"use client";

/**
 * Headless chat engine — no UI, just the useChat hook + tool handling.
 * Mount this once so the AI chat backend stays connected.
 * The Activity panel (CanvasBottomLeft) displays messages via chat-bridge.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  addFrameWithId,
  updateFrameHtml,
  updateFrame,
  setTheme,
  replaceTheme,
  upsertStoredTheme,
} from "@/store/slices/canvasSlice";
import { pushAgentLog } from "@/store/slices/uiSlice";
import {
  emitActivityHistoryLoading,
  emitChatMessagesSnapshot,
  emitChatStatus,
  emitCreditExhausted,
  addGeneratingFrame,
  clearGeneratingFrames,
  registerChatSend,
  unregisterChatSend,
  registerChatStop,
  unregisterChatStop,
} from "@/lib/chat-bridge";
import { cursor, initCursor } from "@/lib/cursor";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import http from "@/lib/http";

/* ── Throttled HTML flush ── */

const CP_THROTTLE_MS = 100;
let cpPendingHtml = new Map<string, string>();
let cpFlushTimer: ReturnType<typeof setTimeout> | null = null;
let cpDispatchRef: ReturnType<typeof useAppDispatch> | null = null;

function cpEnqueueHtml(id: string, html: string) {
  cpPendingHtml.set(id, html);
  if (cpFlushTimer) return;
  cpFlushTimer = setTimeout(() => {
    cpFlushTimer = null;
    const batch = cpPendingHtml;
    cpPendingHtml = new Map();
    if (!cpDispatchRef) return;
    for (const [fid, fhtml] of batch) {
      cpDispatchRef(updateFrameHtml({ id: fid, html: fhtml }));
    }
  }, CP_THROTTLE_MS);
}

function cpFlushHtmlNow() {
  if (cpFlushTimer) {
    clearTimeout(cpFlushTimer);
    cpFlushTimer = null;
  }
  const batch = cpPendingHtml;
  cpPendingHtml = new Map();
  if (!cpDispatchRef) return;
  for (const [fid, fhtml] of batch) {
    cpDispatchRef(updateFrameHtml({ id: fid, html: fhtml }));
  }
}

/* ── Types ── */

interface ToolStep {
  toolCallId: string;
  toolName: string;
  state: "running" | "done" | "error";
  input?: { id?: string; name?: string };
}

type JsonValue =
  | string
  | number
  | boolean
  | null
  | { [key: string]: JsonValue }
  | JsonValue[];

interface MessagePart {
  type: string;
  text?: string;
  toolCallId?: string;
  toolName?: string;
  state?: string;
  input?: Record<string, JsonValue>;
}

const TOOL_STEP_PART_TYPE = "tool-step";

const latestCanvasState: {
  frames: {
    id: string;
    label: string;
    left: number;
    top: number;
    html: string;
  }[];
  theme: Record<string, string>;
  themeMode: "light" | "dark";
} = { frames: [], theme: {}, themeMode: "light" };

/* ── Helpers ── */

function getToolDisplayLabel(
  toolType: string,
  frames: { id: string; label: string }[],
  input?: { id?: string; name?: string },
  isCalled?: boolean,
): string {
  const toTitle = (s: string) => s.replace(/\b\w/g, (c) => c.toUpperCase());

  if (toolType === "classifyIntent")
    return isCalled ? "Understood intent" : "Understanding intent…";
  if (toolType === "planScreens")
    return isCalled ? "Planned screens" : "Planning screens…";
  if (toolType === "planStyle")
    return isCalled ? "Defined visual style" : "Defining visual style…";
  if (toolType === "build_theme")
    return isCalled ? "Created theme" : "Creating theme…";
  if (toolType === "update_theme")
    return isCalled ? "Updated theme" : "Updating theme…";
  if (toolType === "create_all_screens")
    return isCalled ? "Created all screens" : "Creating all screens…";

  if (
    input?.id &&
    (toolType === "read_screen" ||
      toolType === "update_screen" ||
      toolType === "edit_design" ||
      toolType === "design_screen")
  ) {
    const frame = frames.find((f) => f.id === input.id);
    const label = frame?.label ?? "Screen";
    const name = toTitle(label);
    if (toolType === "read_screen")
      return isCalled ? `Read ${name} screen` : `Reading ${name} screen…`;
    if (toolType === "edit_design")
      return isCalled ? `Edited ${name} screen` : `Editing ${name} screen…`;
    if (toolType === "update_screen")
      return isCalled ? `Updated ${name} screen` : `Updating ${name} screen…`;
    if (toolType === "design_screen")
      return isCalled ? `Designed ${name} screen` : `Designing ${name} screen…`;
  }

  const base = toTitle(toolType.replace(/_/g, " "));
  return isCalled ? base : `${base}…`;
}

function addStepIfNew(prev: ToolStep[], step: ToolStep): ToolStep[] {
  if (prev.some((s) => s.toolCallId === step.toolCallId)) return prev;
  return [...prev, step];
}

/* ── Component ── */

export function ChatEngine() {
  const dispatch = useAppDispatch();
  cpDispatchRef = dispatch;
  initCursor(dispatch);

  const [_multiAgentPlanContext, setMultiAgentPlanContext] = useState("");
  const [toolSteps, _setToolSteps] = useState<ToolStep[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const { user } = useAuth();
  const chatUserId = user?.uid ?? "";
  const projectId = useAppSelector((s) => s.project.projectId) ?? "";
  const frames = useAppSelector((s) => s.canvas.frames);
  const theme = useAppSelector((s) => s.canvas.theme);
  const activeThemeMode = useAppSelector((s) => s.canvas.activeThemeMode);

  const stateRef = useRef({ frames, theme });
  const toolStepsRef = useRef<ToolStep[]>([]);

  const setToolSteps = useCallback(
    (updater: ToolStep[] | ((prev: ToolStep[]) => ToolStep[])) => {
      _setToolSteps((prev) => {
        const next = typeof updater === "function" ? updater(prev) : updater;
        toolStepsRef.current = next;
        return next;
      });
    },
    [],
  );

  useEffect(() => {
    stateRef.current = { frames, theme };
    latestCanvasState.frames = frames;
    latestCanvasState.theme = theme;
    latestCanvasState.themeMode = activeThemeMode;
  }, [frames, theme, activeThemeMode]);

  const activeThemeIdRef = useRef<string | null>(null);
  const persistThemeToDatabase = useCallback(
    (
      variables: Record<string, string>,
      themeName?: string,
      variantName?: string,
    ) => {
      if (!chatUserId) return;
      const themeId = activeThemeIdRef.current;
      if (themeId) {
        http
          .put("/api/themes", {
            id: themeId,
            ...(themeName && { name: themeName }),
            variables,
            variantName: variantName ?? latestCanvasState.themeMode,
          })
          .then(({ data }) => {
            dispatch(
              upsertStoredTheme({
                id: data.id,
                name: data.name,
                variants: data.variants,
              }),
            );
          })
          .catch(() => {});
      } else {
        const variants = {
          [variantName ?? latestCanvasState.themeMode ?? "light"]: variables,
        };
        http
          .post("/api/themes", {
            userId: chatUserId,
            name: themeName || "Untitled Theme",
            variants,
          })
          .then(({ data }) => {
            activeThemeIdRef.current = data.id;
            dispatch(
              upsertStoredTheme({
                id: data.id,
                name: data.name,
                variants: data.variants,
              }),
            );
          })
          .catch(() => {});
      }
    },
    [chatUserId, dispatch],
  );

  const chatSessionContextRef = useRef({ projectId, userId: chatUserId });
  chatSessionContextRef.current = { projectId, userId: chatUserId };

  const postChatSession = useCallback((messagesPayload: UIMessage[]) => {
    const { projectId: pid, userId: uid } = chatSessionContextRef.current;
    return http.post("/api/chat/sessions", {
      projectId: pid,
      userId: uid,
      isActive: true,
      messages: messagesPayload,
    });
  }, []);

  const agentCountRef = useRef(1);

  const [transport] = useState(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        prepareSendMessagesRequest: (options) => ({
          body: {
            ...options.body,
            messages: options.messages,
            id: options.id,
            trigger: options.trigger,
            messageId: options.messageId,
            frames: latestCanvasState.frames,
            theme: latestCanvasState.theme,
            themeMode: latestCanvasState.themeMode,
            agentCount: agentCountRef.current,
            userId: chatSessionContextRef.current.userId,
          },
        }),
      }),
  );

  const { messages, setMessages, sendMessage, stop, status } = useChat({
    transport,
    onData: (dataPart) => {
      interface DataPartEvent {
        type: string;
        toolCallId?: string;
        toolName?: string;
        input?: Record<string, JsonValue>;
        output?: JsonValue;
        data?: {
          toolCallId: string;
          toolName: string;
          frame?: {
            id: string;
            label?: string;
            left?: number;
            top?: number;
            html?: string;
          };
          theme?: Record<string, string>;
          themeName?: string;
          themeUpdates?: Record<string, string>;
        };
      }
      const ev = dataPart as DataPartEvent;

      if (ev.type === "data-spawn-agents" && ev.data) {
        const spawnData = ev.data as unknown as {
          orchestrationId?: string;
          agents?: Array<{
            id: string;
            subTask: string;
            assignedScreens: string[];
            assignedFrameIds?: string[];
            screenPositions?: Array<{ left: number; top: number }>;
          }>;
          planContext?: string;
          theme?: Record<string, string>;
        };
        if (spawnData.orchestrationId && spawnData.agents) {
          setMultiAgentPlanContext(spawnData.planContext ?? "");
          if (spawnData.theme && Object.keys(spawnData.theme).length > 0) {
            dispatch(replaceTheme(spawnData.theme));
            persistThemeToDatabase(spawnData.theme);
          }
          return;
        }
      }

      const toolCallId = ev.toolCallId ?? ev.data?.toolCallId;
      const toolName = ev.toolName ?? ev.data?.toolName;

      if (ev.type === "tool-input-start" && toolCallId && toolName) {
        setToolSteps((prev) =>
          addStepIfNew(prev, { toolCallId, toolName, state: "running" }),
        );
        const label = getToolDisplayLabel(
          toolName,
          stateRef.current.frames,
          undefined,
          false,
        );
        dispatch(pushAgentLog({ type: "status", text: label }));
        if (
          toolName === "design_screen" ||
          toolName === "update_screen" ||
          toolName === "edit_design" ||
          toolName === "read_screen"
        ) {
          cursor.working(cursor.MAIN);
        }
        return;
      }
      if (ev.type === "tool-output-available" && toolCallId) {
        cpFlushHtmlNow();
        const output = ev.output as
          | {
              frame?: {
                id: string;
                label?: string;
                left?: number;
                top?: number;
                html?: string;
              };
              theme?: Record<string, string>;
              themeName?: string;
              themeUpdates?: Record<string, string>;
              orchestrationId?: string;
              agents?: Array<{
                id: string;
                subTask: string;
                assignedScreens: string[];
                screenPositions?: Array<{ left: number; top: number }>;
              }>;
              planContext?: string;
            }
          | undefined;
        setToolSteps((prev) =>
          prev.map((s) =>
            s.toolCallId === toolCallId ? { ...s, state: "done" as const } : s,
          ),
        );
        if (output?.orchestrationId && Array.isArray(output?.agents)) {
          setMultiAgentPlanContext(output.planContext ?? "");
          if (output.theme && Object.keys(output.theme).length > 0) {
            dispatch(replaceTheme(output.theme));
            persistThemeToDatabase(output.theme);
          }
          return;
        }
        if (output?.frame) {
          const f = output.frame;
          const isCreate =
            f.id &&
            (f.left !== undefined || f.top !== undefined) &&
            f.html !== undefined;
          if (isCreate) {
            addGeneratingFrame(f.id);
            dispatch(
              addFrameWithId({
                id: f.id,
                label: f.label ?? "",
                left: f.left ?? 0,
                top: f.top ?? 0,
                html: f.html ?? "",
              }),
            );
            dispatch(
              updateFrame({
                id: f.id,
                changes: { label: f.label, html: f.html },
              }),
            );
            if (f.html && f.html.length > 0) {
              http
                .post("/api/frames", {
                  frameId: f.id,
                  html: f.html,
                  label: f.label,
                  left: f.left,
                  top: f.top,
                  projectId,
                })
                .catch(() => {});
            }
          } else if (f.id && f.html !== undefined) {
            dispatch(updateFrameHtml({ id: f.id, html: f.html }));
            const frame = stateRef.current.frames.find((x) => x.id === f.id);
            http
              .post("/api/frames", {
                frameId: f.id,
                html: f.html,
                label: frame?.label,
                left: frame?.left,
                top: frame?.top,
                projectId,
              })
              .catch(() => {});
          }
        }
        if (output?.themeUpdates) {
          dispatch(setTheme(output.themeUpdates));
          persistThemeToDatabase(
            {
              ...stateRef.current.theme,
              ...output.themeUpdates,
            },
            output.themeName,
          );
        }
        if (output?.theme) {
          dispatch(replaceTheme(output.theme));
          persistThemeToDatabase(output.theme, output.themeName);
        }
        const finishedStep = toolStepsRef.current.find(
          (s) => s.toolCallId === toolCallId,
        );
        if (
          finishedStep?.toolName === "read_screen" &&
          finishedStep?.input?.id
        ) {
          cursor.scan(cursor.MAIN, finishedStep.input.id);
        } else if (
          finishedStep?.toolName !== "read_screen" &&
          finishedStep?.toolName !== "design_screen" &&
          finishedStep?.toolName !== "update_screen" &&
          finishedStep?.toolName !== "edit_design"
        ) {
          cursor.hide(cursor.MAIN);
        }
        return;
      }
      if (ev.type === "tool-input-available" && ev.toolCallId && ev.input) {
        const input = ev.input as { id?: string; name?: string };
        const step = toolStepsRef.current.find(
          (s) => s.toolCallId === ev.toolCallId,
        );
        if (input.id && step) {
          if (
            step.toolName === "design_screen" ||
            step.toolName === "update_screen"
          ) {
            cursor.design(cursor.MAIN, input.id);
          } else if (step.toolName === "read_screen") {
            cursor.scan(cursor.MAIN, input.id);
          } else if (step.toolName === "edit_design") {
            cursor.show(cursor.MAIN, input.id);
          }
        }
        setToolSteps((prev) =>
          prev.map((s) =>
            s.toolCallId === ev.toolCallId
              ? { ...s, input: { id: input.id, name: input.name } }
              : s,
          ),
        );
        return;
      }

      if (!ev.data) return;
      const { data } = ev;

      if (ev.type === "data-tool-call-start") {
        setToolSteps((prev) =>
          addStepIfNew(prev, {
            toolCallId: data.toolCallId,
            toolName: data.toolName,
            state: "running",
          }),
        );
        if (
          data.toolName === "design_screen" ||
          data.toolName === "update_screen" ||
          data.toolName === "edit_design" ||
          data.toolName === "read_screen"
        ) {
          cursor.working(cursor.MAIN);
        }
        return;
      }

      if (ev.type === "data-tool-call-delta") {
        const dataWithArgs = data as { args?: { id?: string }; id?: string };
        if (
          data.toolName === "read_screen" &&
          (dataWithArgs.id ?? dataWithArgs.args?.id)
        ) {
          const frameId = dataWithArgs.id ?? dataWithArgs.args?.id ?? "";
          cursor.scan(cursor.MAIN, frameId);
          setToolSteps((prev) =>
            prev.map((s) =>
              s.toolCallId === data.toolCallId
                ? { ...s, input: { ...s.input, id: frameId } }
                : s,
            ),
          );
        } else if (data.toolName === "design_screen" && data.frame) {
          if (data.frame.html !== undefined) {
            cpEnqueueHtml(data.frame.id, data.frame.html);
          }
          if (data.frame.id) {
            cursor.design(cursor.MAIN, data.frame.id);
          }
          if (data.frame.label !== undefined) {
            dispatch(
              updateFrame({
                id: data.frame.id,
                changes: { label: data.frame.label },
              }),
            );
            setToolSteps((prev) =>
              prev.map((s) =>
                s.toolCallId === data.toolCallId
                  ? { ...s, input: { ...s.input, name: data.frame!.label } }
                  : s,
              ),
            );
          }
        } else if (
          data.toolName === "update_screen" &&
          data.frame?.html !== undefined
        ) {
          cpEnqueueHtml(data.frame.id, data.frame.html);
          if (data.frame.id) {
            cursor.design(cursor.MAIN, data.frame.id);
          }
        }
        return;
      }

      if (ev.type === "data-tool-call-end") {
        cpFlushHtmlNow();
        const endInput: { id?: string; name?: string } = {};
        if (data.frame?.id) endInput.id = data.frame.id;
        if (data.frame?.label) endInput.name = data.frame.label;
        if (data.toolName === "read_screen") {
          const dataWithArgs = data as { args?: { id?: string }; id?: string };
          const readScreenId = dataWithArgs.args?.id ?? dataWithArgs.id;
          if (readScreenId) endInput.id = readScreenId;
        }
        const doneLabel = getToolDisplayLabel(
          data.toolName,
          stateRef.current.frames,
          endInput,
          true,
        );
        dispatch(pushAgentLog({ type: "agent", text: doneLabel }));
        setToolSteps((prev) =>
          prev.map((s) =>
            s.toolCallId === data.toolCallId
              ? {
                  ...s,
                  state: "done" as const,
                  input: { ...s.input, ...endInput },
                }
              : s,
          ),
        );
        if (
          (data.toolName === "create_screen" ||
            data.toolName === "create_all_screens") &&
          data.frame
        ) {
          dispatch(
            addFrameWithId({
              id: data.frame.id,
              label: data.frame.label ?? "",
              left: data.frame.left ?? 0,
              top: data.frame.top ?? 0,
              html: data.frame.html ?? "",
            }),
          );
          dispatch(
            updateFrame({
              id: data.frame.id,
              changes: {
                label: data.frame.label,
                html: data.frame.html,
                ...(data.frame.left !== undefined && { left: data.frame.left }),
                ...(data.frame.top !== undefined && { top: data.frame.top }),
              },
            }),
          );
          if (data.frame.html && data.frame.html.length > 0) {
            http
              .post("/api/frames", {
                frameId: data.frame.id,
                html: data.frame.html,
                label: data.frame.label,
                left: data.frame.left,
                top: data.frame.top,
                projectId,
              })
              .catch(() => {});
          }
        } else if (
          (data.toolName === "update_screen" ||
            data.toolName === "edit_design" ||
            data.toolName === "design_screen") &&
          data.frame?.html !== undefined
        ) {
          dispatch(
            updateFrameHtml({ id: data.frame.id, html: data.frame.html }),
          );
          const frame = stateRef.current.frames.find(
            (f) => f.id === data.frame?.id,
          );
          http
            .post("/api/frames", {
              frameId: data.frame.id,
              html: data.frame.html,
              label: frame?.label,
              left: frame?.left,
              top: frame?.top,
              projectId,
            })
            .catch(() => {});
        } else if (data.toolName === "update_theme" && data.themeUpdates) {
          dispatch(setTheme(data.themeUpdates));
          persistThemeToDatabase(
            {
              ...stateRef.current.theme,
              ...data.themeUpdates,
            },
            (data as { themeName?: string }).themeName,
          );
        } else if (data.toolName === "build_theme" && data.theme) {
          dispatch(replaceTheme(data.theme));
          persistThemeToDatabase(
            data.theme,
            (data as { themeName?: string }).themeName,
          );
        }
        if (data.toolName === "read_screen") {
          const frameId =
            (data as { args?: { id?: string }; id?: string }).args?.id ??
            (data as { id?: string }).id;
          if (frameId) {
            cursor.scan(cursor.MAIN, frameId);
          }
        } else if (
          data.toolName !== "design_screen" &&
          data.toolName !== "update_screen" &&
          data.toolName !== "edit_design" &&
          data.toolName !== "build_theme" &&
          data.toolName !== "update_theme" &&
          data.toolName !== "create_all_screens"
        ) {
          cursor.hide(cursor.MAIN);
        }
        return;
      }
    },
    onFinish: ({ messages: finishedMessages, isAbort, isError }) => {
      cursor.hide(cursor.MAIN);
      if (!isAbort && !isError) {
        const last = finishedMessages[finishedMessages.length - 1];
        const textContent =
          last?.role === "assistant"
            ? (
                (last as { parts?: { type: string; text?: string }[] }).parts ??
                []
              )
                .filter((p) => p.type === "text" && p.text)
                .map((p) => p.text)
                .join(" ")
                .trim()
            : "";
        if (textContent) {
          dispatch(
            pushAgentLog({ type: "agent", text: textContent.slice(0, 200) }),
          );
        }
      }
      const stepsToPersist = toolStepsRef.current;
      setToolSteps([]);
      if (
        !isAbort &&
        !isError &&
        finishedMessages.length > 0 &&
        stepsToPersist.length > 0
      ) {
        const lastIdx = finishedMessages.length - 1;
        const lastMsg = finishedMessages[lastIdx];
        if (lastMsg?.role === "assistant") {
          const stepParts = stepsToPersist.map((s) => ({
            type: TOOL_STEP_PART_TYPE,
            toolCallId: s.toolCallId,
            toolName: s.toolName,
            state: s.state,
            input: s.input,
          }));
          const existingParts = (
            (lastMsg as { parts?: MessagePart[] }).parts ?? []
          ).filter((p) => p.type !== TOOL_STEP_PART_TYPE);
          const updated = [...finishedMessages];
          updated[lastIdx] = {
            ...lastMsg,
            parts: [...stepParts, ...existingParts],
          } as typeof lastMsg;
          setMessages(updated);
          void postChatSession(updated).catch(() => {});
          return;
        }
      }
      if (!isAbort && !isError && finishedMessages.length > 0) {
        void postChatSession(finishedMessages).catch(() => {});
      }
    },
    onError: (error) => {
      const msg = error?.message || "";
      if (
        msg.includes("no_plan") ||
        (msg.includes("402") && !msg.includes("insufficient_credits"))
      ) {
        emitCreditExhausted("no_plan");
      } else if (msg.includes("insufficient_credits") || msg.includes("402")) {
        emitCreditExhausted("insufficient_credits");
      } else {
        toast.error("Something went wrong. Please try again.");
      }
    },
  });

  // Hydrate history
  const lastHydrateKeyRef = useRef("");
  useEffect(() => {
    if (!projectId || !chatUserId) return;
    const hydrateKey = `${projectId}:${chatUserId}`;
    if (hydrateKey === lastHydrateKeyRef.current) return;
    lastHydrateKeyRef.current = hydrateKey;

    setIsLoadingHistory(true);
    const q = new URLSearchParams({ projectId, userId: chatUserId });
    http
      .get(`/api/chat/sessions?${q.toString()}`)
      .then(({ data }: { data: { messages?: UIMessage[] } }) => {
        if (lastHydrateKeyRef.current !== hydrateKey) return;
        if (data?.messages && data.messages.length > 0) {
          setMessages(data.messages);
        } else {
          setMessages([]);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (lastHydrateKeyRef.current === hydrateKey) {
          setIsLoadingHistory(false);
        }
      });
  }, [setMessages, projectId, chatUserId]);

  // Broadcast messages to Activity panel
  useEffect(() => {
    if (isLoadingHistory) return;
    emitChatMessagesSnapshot(messages);
  }, [messages, isLoadingHistory]);

  // Broadcast status
  useEffect(() => {
    const s =
      status === "streaming"
        ? "streaming"
        : status === "submitted"
          ? "submitted"
          : "ready";
    emitChatStatus(s);
    if (s === "ready") clearGeneratingFrames();
  }, [status]);

  // Broadcast loading state
  useEffect(() => {
    emitActivityHistoryLoading(isLoadingHistory);
  }, [isLoadingHistory]);

  // Debounced session persist
  const persistTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (messages.length === 0 || status === "streaming") return;
    if (persistTimeoutRef.current) clearTimeout(persistTimeoutRef.current);
    persistTimeoutRef.current = setTimeout(() => {
      persistTimeoutRef.current = null;
      void postChatSession(messages).catch(() => {});
    }, 1500);
    return () => {
      if (persistTimeoutRef.current) clearTimeout(persistTimeoutRef.current);
    };
  }, [messages, status, postChatSession]);

  // Register send/stop for the center input
  useEffect(() => {
    const bridgeSend = (text: string) => {
      setToolSteps([]);
      dispatch(pushAgentLog({ type: "user", text }));
      sendMessage({ text });
    };
    registerChatSend(bridgeSend);
    registerChatStop(stop);
    return () => {
      unregisterChatSend();
      unregisterChatStop();
    };
  }, [sendMessage, stop, dispatch, setToolSteps]);

  // Headless — no UI
  return null;
}
