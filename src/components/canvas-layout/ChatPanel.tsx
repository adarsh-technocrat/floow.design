"use client";

import type React from "react";
import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  addFrameWithId,
  updateFrameHtml,
  updateFrame,
  setTheme,
  replaceTheme,
} from "@/store/slices/canvasSlice";
import { pushAgentLog } from "@/store/slices/uiSlice";
import {
  emitActivityHistoryLoading,
  emitChatMessagesSnapshot,
  emitChatStatus,
  addGeneratingFrame,
  clearGeneratingFrames,
  registerChatSend,
  unregisterChatSend,
  registerChatStop,
  unregisterChatStop,
} from "@/lib/chat-bridge";
import { cursor, initCursor } from "@/lib/cursor";
import { Brain, ChevronDown, X, Zap } from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import { ImageIcon } from "@/lib/svg-icons";
import { PageMentionInput } from "./PageMentionInput";
import { useAuth } from "@/contexts/AuthContext";
import { CANVAS_CHAT_FRAME_ID } from "@/lib/chat-session";
import http from "@/lib/http";

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

interface ToolStep {
  toolCallId: string;
  toolName: string;
  state: "running" | "done" | "error";
  input?: { id?: string; name?: string };
}

const latestCanvasState: {
  frames: {
    id: string;
    label: string;
    left: number;
    top: number;
    html: string;
  }[];
  theme: Record<string, string>;
} = { frames: [], theme: {} };

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

  if (toolType === "create_all_screens") {
    return isCalled ? "Created all screens" : "Creating all screens…";
  }
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

function toolStepsFromParts(
  parts: MessagePart[] | undefined,
): ToolStep[] | undefined {
  if (!parts?.length) return undefined;

  const steps: ToolStep[] = [];

  for (const p of parts) {
    if (p.type === TOOL_STEP_PART_TYPE) {
      steps.push({
        toolCallId: p.toolCallId ?? "",
        toolName: p.toolName ?? "tool",
        state: (p.state as ToolStep["state"]) ?? "done",
        input: p.input as { id?: string; name?: string } | undefined,
      });
      continue;
    }
    if (p.type?.startsWith("tool-") || p.type === "dynamic-tool") {
      const state =
        p.state === "output-available"
          ? ("done" as const)
          : p.state === "output-error" || p.state === "input-error"
            ? ("error" as const)
            : ("running" as const);
      const input: { id?: string; name?: string } = {};
      const raw = p.input as { id?: string; name?: string } | undefined;
      if (raw?.id) input.id = raw.id;
      if (raw?.name) input.name = raw.name;
      const toolName =
        p.toolName ?? (p.type?.startsWith("tool-") ? p.type.slice(5) : "");
      steps.push({
        toolCallId: p.toolCallId ?? "",
        toolName: toolName || "tool",
        state,
        input: Object.keys(input).length ? input : undefined,
      });
    }
  }

  return steps.length > 0 ? steps : undefined;
}

function addStepIfNew(prev: ToolStep[], step: ToolStep): ToolStep[] {
  if (prev.some((s) => s.toolCallId === step.toolCallId)) return prev;
  return [...prev, step];
}

function ToolStepChip({
  step,
  frames,
}: {
  step: ToolStep;
  frames: { id: string; label: string }[];
}) {
  const label = getToolDisplayLabel(
    step.toolName,
    frames,
    step.input,
    step.state === "done",
  );
  const finished = step.state === "done";

  return (
    <div
      className={`not-prose flex w-fit items-center gap-2 rounded-md border border-b-secondary px-2 py-1 transition-all ${
        finished ? "bg-input-bg" : "bg-surface-sunken/80"
      }`}
    >
      {finished ? (
        CheckIcon
      ) : (
        <span className="inline-block size-3.5 shrink-0 animate-pulse rounded-full bg-t-tertiary/80" />
      )}
      <span
        className={`font-mono text-[11px] uppercase tracking-wider ${
          finished ? "text-t-secondary" : "text-t-primary"
        }`}
      >
        {label}
      </span>
    </div>
  );
}

function StreamingActivityIndicator() {
  return (
    <div className="flex w-full justify-start">
      <div className="w-fit max-w-[85%] rounded-lg bg-muted/50 px-3 py-2.5 text-sm">
        <span className="inline-block animate-pulse bg-gradient-to-r from-t-400 via-t-200 to-t-400 bg-[length:200%_100%] bg-clip-text text-transparent [animation-duration:1.5s] font-medium">
          Working…
        </span>
      </div>
    </div>
  );
}

function ReasoningBlock({
  text,
  isStreaming,
  isComplete,
}: {
  text: string;
  isStreaming?: boolean;
  isComplete?: boolean;
}) {
  const defaultExpanded = !!isStreaming && !isComplete;
  const [userExpanded, setUserExpanded] = useState<boolean | null>(null);
  const expanded = userExpanded !== null ? userExpanded : defaultExpanded;

  return (
    <div className="not-prose flex w-full flex-col transition-all">
      <button
        type="button"
        onClick={() => setUserExpanded(!expanded)}
        className="inline-flex w-full items-center justify-between gap-1 px-0 py-1 text-left"
      >
        <div className="flex items-center gap-1.5">
          <Brain
            className="size-3.5 shrink-0 text-t-secondary"
            strokeWidth={1.5}
          />
          <span className="font-mono text-[11px] text-t-secondary uppercase tracking-wider">
            {expanded ? "Hide thinking" : "Thinking"}
          </span>
        </div>
        <ChevronDown
          className={`size-3.5 shrink-0 text-t-secondary transition-transform ${
            expanded ? "rotate-180" : ""
          }`}
          strokeWidth={2}
        />
      </button>
      {expanded && text && (
        <div className="chat-markdown py-1.5 text-sm text-t-secondary font-sans">
          <ReactMarkdown components={markdownComponents}>{text}</ReactMarkdown>
        </div>
      )}
    </div>
  );
}

type StreamOrderItem =
  | { kind: "tool"; toolCallId: string }
  | { kind: "reasoning"; text: string }
  | { kind: "text"; text: string };

function AssistantMessageContent({
  parts,
  frames,
  isStreaming,
  toolSteps = [],
}: {
  parts: MessagePart[];
  frames: { id: string; label: string }[];
  isStreaming?: boolean;
  toolSteps?: ToolStep[];
}) {
  const stepByCallId = new Map(
    (toolSteps ?? []).map((s) => [s.toolCallId, s] as const),
  );
  const seenToolIds = new Set<string>();
  const ordered: StreamOrderItem[] = [];

  for (const part of parts) {
    if (part.type === "step-start" || part.type?.startsWith("data-")) continue;
    if (part.type === "text") {
      ordered.push({ kind: "text", text: part.text ?? "" });
    } else if (part.type === "reasoning") {
      ordered.push({ kind: "reasoning", text: part.text ?? "" });
    } else if (
      (part.type?.startsWith("tool-") || part.type === "dynamic-tool") &&
      part.toolCallId &&
      !seenToolIds.has(part.toolCallId)
    ) {
      seenToolIds.add(part.toolCallId);
      ordered.push({ kind: "tool", toolCallId: part.toolCallId });
    }
  }

  return (
    <div className="space-y-3">
      {ordered.map((item, i) => {
        if (item.kind === "tool") {
          const step = stepByCallId.get(item.toolCallId);
          if (!step) return null;
          return (
            <div
              key={`${item.toolCallId}-${i}`}
              className="flex flex-col gap-2 shrink-0"
            >
              <ToolStepChip step={step} frames={frames} />
            </div>
          );
        }
        if (item.kind === "reasoning") {
          return (
            <ReasoningBlock
              key={`reasoning-${i}`}
              text={item.text}
              isStreaming={isStreaming}
              isComplete={
                !isStreaming ||
                ordered.slice(i + 1).some((x) => x.kind === "reasoning")
              }
            />
          );
        }
        return item.text ? (
          <div key={`text-${i}`} className="chat-markdown">
            <ReactMarkdown components={markdownComponents}>
              {item.text}
            </ReactMarkdown>
          </div>
        ) : null;
      })}
    </div>
  );
}

function getUserMessageText(msg: {
  content?: string;
  parts?: Array<{ type: string; text?: string }>;
}): string | null {
  if (typeof msg.content === "string") return msg.content;
  const textPart = msg.parts?.find((p) => p.type === "text" && p.text);
  return textPart?.text ?? null;
}

const CheckIcon = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="1em"
    height="1em"
    fill="currentColor"
    viewBox="0 0 256 256"
    className="size-3.5 shrink-0 text-t-tertiary"
  >
    <path d="M229.66,77.66l-128,128a8,8,0,0,1-11.32,0l-56-56a8,8,0,0,1,11.32-11.32L96,188.69,218.34,66.34a8,8,0,0,1,11.32,11.32Z" />
  </svg>
);

const markdownComponents: React.ComponentProps<
  typeof ReactMarkdown
>["components"] = {
  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
  ul: ({ children }) => (
    <ul className="mb-2 list-disc space-y-1 pl-4">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="mb-2 list-decimal space-y-1 pl-4">{children}</ol>
  ),
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  code: ({ children }) => (
    <code className="rounded bg-muted/80 px-1.5 py-0.5 font-mono text-xs">
      {children}
    </code>
  ),
  pre: ({ children }) => (
    <pre className="mb-2 overflow-x-auto rounded-lg bg-muted/80 p-3 font-mono text-xs">
      {children}
    </pre>
  ),
  strong: ({ children }) => (
    <strong className="font-semibold">{children}</strong>
  ),
  h1: ({ children }) => (
    <h1 className="mb-2 mt-3 text-base font-semibold first:mt-0">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="mb-2 mt-3 text-sm font-semibold first:mt-0">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="mb-2 mt-2 text-sm font-medium first:mt-0">{children}</h3>
  ),
};

const MIN_PANEL_WIDTH = 360;
const MAX_PANEL_WIDTH = 600;
const DEFAULT_PANEL_WIDTH = 432;
const RAIL_OFFSET = 70;
const RIGHT_MARGIN = 16;

function ChatHistoryShimmer() {
  return (
    <div className="flex flex-col gap-4 p-2">
      <div className="flex justify-end">
        <div className="h-8 w-[60%] animate-pulse rounded-lg bg-input-bg" />
      </div>
      <div className="flex flex-col gap-2">
        <div className="h-6 w-[45%] animate-pulse rounded-lg bg-input-bg" />
        <div
          className="h-6 w-[70%] animate-pulse rounded-lg bg-input-bg"
          style={{ animationDelay: "75ms" }}
        />
        <div
          className="h-6 w-[55%] animate-pulse rounded-lg bg-input-bg"
          style={{ animationDelay: "150ms" }}
        />
      </div>
      <div className="flex justify-end">
        <div
          className="h-8 w-[50%] animate-pulse rounded-lg bg-input-bg"
          style={{ animationDelay: "200ms" }}
        />
      </div>
      <div className="flex flex-col gap-2">
        <div
          className="h-6 w-[65%] animate-pulse rounded-lg bg-input-bg"
          style={{ animationDelay: "250ms" }}
        />
        <div
          className="h-6 w-[40%] animate-pulse rounded-lg bg-input-bg"
          style={{ animationDelay: "325ms" }}
        />
      </div>
    </div>
  );
}

interface ChatPanelProps {
  isVisible: boolean;
  onClose: () => void;
  frameName?: string;
}

export function ChatPanel({
  isVisible,
  onClose,
  frameName = "Screen",
}: ChatPanelProps) {
  const dispatch = useAppDispatch();
  cpDispatchRef = dispatch;
  initCursor(dispatch);
  const [panelWidth, setPanelWidth] = useState(DEFAULT_PANEL_WIDTH);
  const [isResizing, setIsResizing] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const agentCount = 1;
  const orchestrationId = null as string | null;
  const agents: never[] = [];
  const activeAgentId = null as string | null;
  const isMultiAgent = orchestrationId !== null && agents.length > 0;
  const [_multiAgentPlanContext, setMultiAgentPlanContext] = useState("");
  const [showAgentDropdown, setShowAgentDropdown] = useState(false);
  const [showHeaderDropdown, setShowHeaderDropdown] = useState(false);
  const agentDropdownRef = useRef<HTMLDivElement>(null);
  const headerDropdownRef = useRef<HTMLDivElement>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [toolSteps, _setToolSteps] = useState<ToolStep[]>([]);
  const chatThreadRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const chatUserId = user?.uid ?? "";
  const selectedFrameIds = useAppSelector((s) => s.canvas.selectedFrameIds);
  const projectId = useAppSelector((s) => s.project.projectId) ?? "";
  const frameSessionId =
    selectedFrameIds.length === 1 ? selectedFrameIds[0] : CANVAS_CHAT_FRAME_ID;
  const frames = useAppSelector((s) => s.canvas.frames);
  const theme = useAppSelector((s) => s.canvas.theme);
  const activeFrameLabel =
    selectedFrameIds.length === 1
      ? (frames.find((f) => f.id === selectedFrameIds[0])?.label ?? frameName)
      : frameName;

  const stateRef = useRef({ frames, theme });
  const toolStepsRef = useRef<ToolStep[]>([]);
  const [lastMessageToolSteps, setLastMessageToolSteps] = useState<ToolStep[]>(
    [],
  );

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
  }, [frames, theme]);

  const chatSessionContextRef = useRef({
    projectId,
    frameId: frameSessionId,
    userId: chatUserId,
  });
  chatSessionContextRef.current = {
    projectId,
    frameId: frameSessionId,
    userId: chatUserId,
  };

  const postChatSession = useCallback((messagesPayload: UIMessage[]) => {
    const {
      projectId: pid,
      frameId: fid,
      userId: uid,
    } = chatSessionContextRef.current;
    return http.post("/api/chat/sessions", {
      projectId: pid,
      frameId: fid,
      userId: uid,
      isActive: true,
      messages: messagesPayload,
    });
  }, []);

  const agentCountRef = useRef(agentCount);
  useEffect(() => {
    agentCountRef.current = agentCount;
  }, [agentCount]);

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
        if (toolName === "design_screen" || toolName === "read_screen") {
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
              http.post("/api/frames", {
                  frameId: f.id,
                  html: f.html,
                  label: f.label,
                  left: f.left,
                  top: f.top,
                  projectId,
                }).catch(() => {});
            }
          } else if (f.id && f.html !== undefined) {
            dispatch(updateFrameHtml({ id: f.id, html: f.html }));
            const frame = stateRef.current.frames.find((x) => x.id === f.id);
            http.post("/api/frames", {
                frameId: f.id,
                html: f.html,
                label: frame?.label,
                left: frame?.left,
                top: frame?.top,
                projectId,
              }).catch(() => {});
          }
        }
        if (output?.themeUpdates) {
          dispatch(setTheme(output.themeUpdates));
        }
        if (output?.theme) {
          dispatch(replaceTheme(output.theme));
        }
        const finishedStep = toolStepsRef.current.find(
          (s) => s.toolCallId === toolCallId,
        );
        if (
          finishedStep?.toolName === "read_screen" &&
          finishedStep?.input?.id
        ) {
          cursor.scan(cursor.MAIN, finishedStep.input.id);
        } else if (finishedStep?.toolName !== "read_screen") {
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
          if (step.toolName === "design_screen") {
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
        if (data.toolName === "read_screen") {
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
          (data.toolName === "update_screen" ||
            data.toolName === "design_screen") &&
          data.frame?.html !== undefined
        ) {
          cpEnqueueHtml(data.frame.id, data.frame.html);
          if (data.toolName === "design_screen" && data.frame.id) {
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
            http.post("/api/frames", {
                frameId: data.frame.id,
                html: data.frame.html,
                label: data.frame.label,
                left: data.frame.left,
                top: data.frame.top,
                projectId,
              }).catch(() => {});
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
          http.post("/api/frames", {
              frameId: data.frame.id,
              html: data.frame.html,
              label: frame?.label,
              left: frame?.left,
              top: frame?.top,
              projectId,
            }).catch(() => {});
        } else if (data.toolName === "update_theme" && data.themeUpdates) {
          dispatch(setTheme(data.themeUpdates));
        } else if (data.toolName === "build_theme" && data.theme) {
          dispatch(replaceTheme(data.theme));
        }
        if (data.toolName === "read_screen") {
          const frameId =
            (data as { args?: { id?: string }; id?: string }).args?.id ??
            (data as { id?: string }).id;
          if (frameId) {
            cursor.scan(cursor.MAIN, frameId);
          }
        } else {
          cursor.hide(cursor.MAIN);
        }
        return;
      }
    },
    onFinish: ({ messages: finishedMessages, isAbort, isError }) => {
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
        setLastMessageToolSteps([...stepsToPersist]);
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
      } else {
        setLastMessageToolSteps([]);
      }
      if (!isAbort && !isError && finishedMessages.length > 0) {
        void postChatSession(finishedMessages).catch(() => {});
      }
    },
    onError: (error) => {
      const msg = error?.message || "";
      // #region agent log
      fetch(
        "http://127.0.0.1:7253/ingest/bf26e32e-b221-45cd-9795-984cd7651c6f",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            runId: "pre-fix",
            hypothesisId: "H5",
            location: "ChatPanel.tsx:onError",
            message: "chat request error surfaced",
            data: { messagePreview: msg.slice(0, 140) },
            timestamp: Date.now(),
          }),
        },
      ).catch(() => {});
      // #endregion
      if (
        msg.includes("402") ||
        msg.includes("no_plan") ||
        msg.includes("insufficient_credits")
      ) {
        toast.error(
          "You need an active plan with credits to use AI features.",
          {
            action: {
              label: "View Plans",
              onClick: () => window.location.assign("/pricing"),
            },
          },
        );
      } else {
        toast.error("Something went wrong. Please try again.");
      }
    },
  });

  // Only re-fetch history when projectId or userId changes — NOT on frame selection
  const lastHydrateKeyRef = useRef("");
  useEffect(() => {
    if (!projectId || !chatUserId) return;
    const hydrateKey = `${projectId}:${chatUserId}`;
    // Skip if the key hasn't changed (e.g., frame selection changed)
    if (hydrateKey === lastHydrateKeyRef.current) return;
    lastHydrateKeyRef.current = hydrateKey;

    setIsLoadingHistory(true);
    const q = new URLSearchParams({
      projectId,
      frameId: frameSessionId,
      userId: chatUserId,
    });
    http.get(`/api/chat/sessions?${q.toString()}`)
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
  }, [setMessages, projectId, frameSessionId, chatUserId]);

  useEffect(() => {
    if (isLoadingHistory) return;
    emitChatMessagesSnapshot(messages);
  }, [messages, isLoadingHistory]);

  // Emit chat status to bridge so Activity panel can show thinking indicator
  useEffect(() => {
    const s =
      status === "streaming"
        ? "streaming"
        : status === "submitted"
          ? "submitted"
          : "ready";
    // #region agent log
    fetch("http://127.0.0.1:7253/ingest/bf26e32e-b221-45cd-9795-984cd7651c6f", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        runId: "pre-fix",
        hypothesisId: "H4",
        location: "ChatPanel.tsx:statusEffect",
        message: "chat status changed",
        data: { status: s },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
    emitChatStatus(s);
    if (s === "ready") clearGeneratingFrames();
  }, [status]);

  useEffect(() => {
    emitActivityHistoryLoading(isLoadingHistory);
  }, [isLoadingHistory]);

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

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    const newWidth = window.innerWidth - e.clientX - RAIL_OFFSET - RIGHT_MARGIN;
    if (newWidth >= MIN_PANEL_WIDTH && newWidth <= MAX_PANEL_WIDTH) {
      setPanelWidth(newWidth);
    }
  }, []);

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
  }, []);

  useEffect(() => {
    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.userSelect = "none";
      document.body.style.cursor = "ew-resize";
    } else {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
    }
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
    };
  }, [isResizing, handleMouseMove, handleMouseUp]);

  const handleSend = useCallback(
    (e?: React.FormEvent) => {
      e?.preventDefault();
      if (!inputValue.trim()) return;
      const prompt = inputValue.trim();
      setInputValue("");

      setToolSteps([]);
      setLastMessageToolSteps([]);
      dispatch(pushAgentLog({ type: "user", text: prompt }));
      sendMessage({ text: prompt });
    },
    [inputValue, sendMessage, setToolSteps, dispatch],
  );

  // Register send function for the bottom input box
  useEffect(() => {
    const bridgeSend = (text: string) => {
      // #region agent log
      fetch(
        "http://127.0.0.1:7253/ingest/bf26e32e-b221-45cd-9795-984cd7651c6f",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            runId: "pre-fix",
            hypothesisId: "H4",
            location: "ChatPanel.tsx:bridgeSend",
            message: "bridge send invoked",
            data: { textLength: text.trim().length },
            timestamp: Date.now(),
          }),
        },
      ).catch(() => {});
      // #endregion
      setToolSteps([]);
      setLastMessageToolSteps([]);
      dispatch(pushAgentLog({ type: "user", text }));
      sendMessage({ text });
    };
    // #region agent log
    fetch("http://127.0.0.1:7253/ingest/bf26e32e-b221-45cd-9795-984cd7651c6f", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        runId: "pre-fix",
        hypothesisId: "H4",
        location: "ChatPanel.tsx:registerBridge",
        message: "chat bridge handlers registered",
        data: {},
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
    registerChatSend(bridgeSend);
    registerChatStop(stop);
    return () => {
      unregisterChatSend();
      unregisterChatStop();
    };
  }, [sendMessage, stop, dispatch, setToolSteps]);

  useEffect(() => {
    chatThreadRef.current?.scrollTo({
      top: chatThreadRef.current.scrollHeight,
      behavior: status === "streaming" ? "auto" : "smooth",
    });
  }, [messages, toolSteps, status]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        agentDropdownRef.current &&
        !agentDropdownRef.current.contains(e.target as Node)
      )
        setShowAgentDropdown(false);
      if (
        headerDropdownRef.current &&
        !headerDropdownRef.current.contains(e.target as Node)
      )
        setShowHeaderDropdown(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!isVisible) return null;

  const isActivelyStreaming = status === "submitted" || status === "streaming";

  const lastMsg = messages[messages.length - 1];
  const lastMsgIsAssistant = lastMsg?.role === "assistant";

  const assistantBubbleAlreadyVisible =
    isActivelyStreaming && lastMsgIsAssistant;

  const showPendingBubble =
    isActivelyStreaming &&
    toolSteps.length > 0 &&
    !assistantBubbleAlreadyVisible;

  const lastMsgHasContent =
    lastMsgIsAssistant &&
    ((lastMsg.parts ?? []).some(
      (p) =>
        (p as MessagePart).type === "text" ||
        (p as MessagePart).type === "reasoning" ||
        (p as MessagePart).type?.startsWith?.("tool-") ||
        (p as MessagePart).type === "dynamic-tool",
    ) ||
      (typeof (lastMsg as { content?: string }).content === "string" &&
        ((lastMsg as { content?: string }).content ?? "").trim().length > 0));

  const showStreamingIndicator =
    isActivelyStreaming &&
    toolSteps.length === 0 &&
    !showPendingBubble &&
    !lastMsgHasContent;

  return (
    <div
      className="chat-panel fixed top-[8%] bottom-[10%] z-30 flex flex-col rounded-xl border border-b-secondary bg-surface-elevated shadow-lg"
      style={{
        right: `${RAIL_OFFSET + RIGHT_MARGIN}px`,
        width: `${panelWidth}px`,
      }}
    >
      <div
        className="absolute -left-2 top-0 z-10 flex h-full w-4 cursor-ew-resize items-center justify-center"
        onMouseDown={handleMouseDown}
        aria-hidden
      >
        <div className="h-full w-0.5 rounded-full bg-border opacity-0 hover:opacity-100" />
      </div>

      <div className="flex flex-row items-center justify-between p-2 pl-3">
        <div className="flex items-center gap-2">
          <div ref={headerDropdownRef} className="relative">
            <button
              type="button"
              onClick={() => setShowHeaderDropdown((v) => !v)}
              className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-sm font-medium text-foreground transition-colors hover:bg-input-bg"
            >
              {(() => {
                return (
                  <>
                    <span className="text-sm">✨</span>
                    <span className="text-t-secondary">AI</span>
                  </>
                );
              })()}
              <span className="text-t-tertiary">·</span>
              <span className="text-t-secondary text-xs font-normal">
                {activeFrameLabel.length > 12
                  ? `${activeFrameLabel.slice(0, 12)}…`
                  : activeFrameLabel}
              </span>
              <ChevronDown className="size-3.5 text-t-tertiary" />
            </button>
            {showHeaderDropdown && (
              <div className="absolute left-0 top-full z-50 mt-1 min-w-[200px] overflow-hidden rounded-xl border border-b-secondary bg-surface-elevated/95 py-1 shadow-lg backdrop-blur-xl">
                <div className="sticky top-0 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-t-tertiary">
                  Active Agents
                </div>
                {isMultiAgent
                  ? [
                      <button
                        key="main-agent"
                        type="button"
                        onClick={() => {
                          // removed: dispatch(setActiveAgent(null));
                          setShowHeaderDropdown(false);
                        }}
                        className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-xs transition-colors hover:bg-input-bg hover:text-t-primary ${
                          activeAgentId === null
                            ? "bg-input-bg text-t-primary"
                            : "text-t-secondary"
                        }`}
                      >
                        <span className="text-sm">{"✨"}</span>
                        <div className="flex flex-col">
                          <span className="font-medium text-t-secondary">
                            {"AI"}
                          </span>
                        </div>
                      </button>,
                    ]
                  : Array.from({ length: agentCount }, (_, i) => {
                      const persona = { name: "AI", emoji: "✨" };
                      const assignedFrame = frames[i];
                      return (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setShowHeaderDropdown(false)}
                          className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-xs text-t-secondary transition-colors hover:bg-input-bg hover:text-t-primary"
                        >
                          <span className="inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-input-bg text-xs text-t-secondary">
                            {persona.emoji}
                          </span>
                          <div className="flex flex-col">
                            <span className="font-medium text-t-primary">
                              {persona.name}
                            </span>
                            <span className="text-[11px] text-t-tertiary">
                              {assignedFrame
                                ? assignedFrame.label
                                : "Unassigned"}
                            </span>
                          </div>
                        </button>
                      );
                    })}
              </div>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close panel"
          className="inline-flex w-8 h-8 min-h-8 shrink-0 cursor-pointer items-center justify-center rounded-md bg-secondary/40 text-secondary-foreground/30 px-2 py-1.5 shadow-xs transition-colors hover:bg-secondary/60"
        >
          <X className="h-3 w-3" />
        </button>
      </div>

      <div
        ref={chatThreadRef}
        id="chat-thread-area"
        className="min-h-0 flex-1 space-y-4 overflow-y-auto scrollbar-hide p-2"
      >
        {isLoadingHistory && <ChatHistoryShimmer />}

        {!isLoadingHistory &&
          messages.map(
            (
              msg: {
                id: string;
                role: string;
                parts?: Array<{
                  type: string;
                  text?: string;
                  state?: string;
                }>;
                content?: string;
              },
              msgIndex: number,
            ) => {
              const isLastMessage = msgIndex === messages.length - 1;
              const stepsFromParts =
                msg.role === "assistant"
                  ? toolStepsFromParts(msg.parts as MessagePart[])
                  : undefined;

              const liveToolSteps =
                isLastMessage && isActivelyStreaming ? toolSteps : undefined;

              const fallbackPersisted =
                msg.role === "assistant" && isLastMessage
                  ? lastMessageToolSteps
                  : undefined;

              const stepsForMessage =
                liveToolSteps && liveToolSteps.length > 0
                  ? liveToolSteps
                  : (stepsFromParts ??
                    (fallbackPersisted?.length
                      ? fallbackPersisted
                      : undefined));

              const isStreamingLastAssistant =
                isLastMessage &&
                msg.role === "assistant" &&
                isActivelyStreaming;

              const hasVisibleContent =
                isStreamingLastAssistant ||
                msg.role !== "assistant" ||
                (msg.parts ?? []).some(
                  (p) =>
                    p.type === "text" ||
                    p.type === "reasoning" ||
                    (p as MessagePart).type?.startsWith?.("tool-") ||
                    (p as MessagePart).type === "dynamic-tool",
                ) ||
                typeof msg.content === "string" ||
                (stepsForMessage && stepsForMessage.length > 0);

              if (!hasVisibleContent) return null;

              return (
                <Fragment key={msg.id}>
                  <div
                    className={`flex w-full ${
                      msg.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`rounded-lg px-3 py-2 text-sm ${
                        msg.role === "user"
                          ? "w-fit max-w-[85%] bg-btn-primary-bg text-btn-primary-text"
                          : msg.role === "assistant"
                            ? "w-full bg-muted/50 text-t-primary"
                            : "w-fit max-w-[85%] bg-muted/30 text-t-primary"
                      }`}
                    >
                      {msg.role === "assistant" ? (
                        msg.parts && msg.parts.length > 0 ? (
                          <AssistantMessageContent
                            parts={msg.parts as MessagePart[]}
                            frames={frames}
                            isStreaming={
                              status === "streaming" && isLastMessage
                            }
                            toolSteps={stepsForMessage}
                          />
                        ) : typeof msg.content === "string" ? (
                          <div className="chat-markdown">
                            <ReactMarkdown components={markdownComponents}>
                              {msg.content}
                            </ReactMarkdown>
                          </div>
                        ) : stepsForMessage && stepsForMessage.length > 0 ? (
                          <AssistantMessageContent
                            parts={[]}
                            frames={frames}
                            isStreaming={
                              status === "streaming" && isLastMessage
                            }
                            toolSteps={stepsForMessage}
                          />
                        ) : isStreamingLastAssistant ? (
                          <span className="inline-block animate-pulse text-t-tertiary text-xs">
                            …
                          </span>
                        ) : null
                      ) : msg.role === "user" ? (
                        getUserMessageText(msg)
                      ) : null}
                    </div>
                  </div>
                </Fragment>
              );
            },
          )}

        {showPendingBubble && (
          <div className="flex w-full justify-start">
            <div className="w-full rounded-lg bg-muted/50 px-3 py-2.5 text-sm text-t-primary">
              <AssistantMessageContent
                parts={[]}
                frames={frames}
                isStreaming={status === "streaming"}
                toolSteps={toolSteps}
              />
            </div>
          </div>
        )}

        {showStreamingIndicator && <StreamingActivityIndicator />}
      </div>

      <div className="w-full p-4">
        <form
          onSubmit={handleSend}
          className="w-full overflow-visible rounded-xl border border-border/60 bg-input-bg shadow-none focus-within:ring-2 focus-within:ring-ring/30"
        >
          {selectedFrameIds.length > 0 && (
            <div className="flex flex-wrap gap-1.5 px-4 pt-3 pb-1">
              {selectedFrameIds.map((id) => {
                const frame = frames.find((f) => f.id === id);
                if (!frame) return null;
                return (
                  <span
                    key={id}
                    className="mention-chip inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium text-mention-chip-text"
                    style={{
                      backgroundColor: "var(--mention-chip-bg)",
                      borderColor: "var(--mention-chip-border)",
                    }}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                    </svg>
                    {frame.label}
                  </span>
                );
              })}
            </div>
          )}
          <PageMentionInput
            value={inputValue}
            onChange={setInputValue}
            pages={frames.map((f) => ({ id: f.id, label: f.label }))}
            placeholder="What changes do you want to make?"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            disabled={isActivelyStreaming}
            className="text-sm"
          />
          <div className="flex items-center justify-between p-2">
            <div className="flex items-center gap-1">
              <button
                type="button"
                aria-label="Attach image"
                className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground/60 transition-colors hover:text-muted-foreground hover:bg-secondary/40"
              >
                <ImageIcon className="size-4" />
              </button>
              <div ref={agentDropdownRef} className="relative">
                <button
                  type="button"
                  onClick={() => setShowAgentDropdown((v) => !v)}
                  className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-t-secondary transition-colors hover:bg-secondary/40"
                >
                  <Zap className="size-3.5" fill="currentColor" />
                  {agentCount}
                  <ChevronDown className="size-3 opacity-60" />
                </button>
                {showAgentDropdown && (
                  <div className="absolute bottom-full left-0 z-50 mb-1 min-w-[130px] overflow-hidden rounded-xl border border-b-secondary bg-surface-elevated/95 py-1 shadow-lg backdrop-blur-xl">
                    <div className="sticky top-0 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-t-tertiary">
                      Agents
                    </div>
                    {[1, 2, 3, 4, 5, 6].map((n) => {
                      return (
                        <button
                          key={n}
                          type="button"
                          onClick={() => {
                            // removed: dispatch(setAgentCountAction(n));
                            if (n === 1 && isMultiAgent) {
                              // removed;
                            }
                            setShowAgentDropdown(false);
                          }}
                          className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs transition-colors hover:bg-input-bg ${
                            agentCount === n
                              ? "font-semibold text-t-primary"
                              : "text-t-secondary"
                          }`}
                        >
                          <Zap
                            className="size-3 text-t-secondary"
                            fill="currentColor"
                          />
                          {n} {n === 1 ? "agent" : "agents"}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
            <button
              type="submit"
              disabled={!inputValue.trim() || isActivelyStreaming}
              className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-btn-primary-bg text-btn-primary-text shadow-xs outline-none transition-colors hover:opacity-90 disabled:pointer-events-none disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-ring/50 active:scale-95"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="1em"
                height="1em"
                fill="currentColor"
                viewBox="0 0 256 256"
                className="size-4"
              >
                <path d="M205.66,117.66a8,8,0,0,1-11.32,0L136,59.31V216a8,8,0,0,1-16,0V59.31L61.66,117.66a8,8,0,0,1-11.32-11.32l72-72a8,8,0,0,1,11.32,0l72,72A8,8,0,0,1,205.66,117.66Z" />
              </svg>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
