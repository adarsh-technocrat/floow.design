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
import { Brain, ChevronDown, X, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import { ImageIcon } from "@/lib/svg-icons";
import { PageMentionInput } from "./PageMentionInput";
import { useAuth } from "@/contexts/AuthContext";
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
  themeMode: "light" | "dark";
} = { frames: [], theme: {}, themeMode: "light" };

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
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 ${
        finished
          ? "border-emerald-500/30 bg-emerald-500/8"
          : "border-blue-500/30 bg-blue-500/8"
      }`}
    >
      {finished ? (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="shrink-0">
          <path d="M8 12.5l2.5 2.5 5-5" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="shrink-0 animate-spin" style={{ animationDuration: "1.5s" }}>
          <circle cx="12" cy="12" r="9" stroke="#3b82f6" strokeOpacity="0.3" strokeWidth="2.5" />
          <path d="M12 3a9 9 0 0 1 9 9" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      )}
      <span
        className={`text-[11px] font-medium ${
          finished ? "text-emerald-600 dark:text-emerald-400" : "text-blue-600 dark:text-blue-400"
        }`}
      >
        {label}
      </span>
    </div>
  );
}

function StreamingActivityIndicator({ label }: { label?: string }) {
  return (
    <div className="flex justify-start">
      <div className="rounded-lg bg-input-bg/60 px-3 py-2">
        <span className="shimmer-text text-xs font-medium">
          {label ?? "Thinking..."}
        </span>
      </div>
    </div>
  );
}

function WelcomeState() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-12 text-center">
      <div className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500/15 to-blue-500/15">
        <Zap className="size-6 text-violet-500" fill="currentColor" />
      </div>
      <div className="flex flex-col gap-1.5">
        <h3 className="text-sm font-semibold text-t-primary">AI Design Assistant</h3>
        <p className="text-xs leading-relaxed text-t-tertiary max-w-[280px]">
          Describe what you want to build or change. I can create screens, update designs, and build themes.
        </p>
      </div>
      <div className="flex flex-col gap-2 w-full max-w-[260px] mt-2">
        {[
          "Design a login screen",
          "Update the color theme",
          "Add a settings page",
        ].map((suggestion) => (
          <div
            key={suggestion}
            className="rounded-xl border border-b-secondary/60 bg-input-bg/50 px-3.5 py-2.5 text-xs text-t-secondary text-left transition-colors hover:bg-input-bg hover:text-t-primary cursor-default"
          >
            {suggestion}
          </div>
        ))}
      </div>
    </div>
  );
}

function ReasoningBlock({
  text,
  isStreaming,
  isComplete,
  instanceKey,
}: {
  text: string;
  isStreaming?: boolean;
  isComplete?: boolean;
  instanceKey: string;
}) {
  const streaming = !!isStreaming && !isComplete;
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (streaming) setOpen(true);
  }, [streaming]);

  return (
    <div className="overflow-hidden rounded-md border border-b-secondary bg-input-bg">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 px-2.5 py-2 text-left transition-colors hover:bg-surface-sunken/80"
        aria-expanded={open}
        aria-controls={`reasoning-body-${instanceKey}`}
        id={`reasoning-trigger-${instanceKey}`}
      >
        <Brain className="size-3.5 shrink-0 text-t-tertiary" />
        <span className="flex-1 text-xs font-medium text-t-secondary">
          {streaming ? "Reasoning…" : "Reasoning"}
        </span>
        <ChevronDown
          className={cn(
            "size-3.5 shrink-0 text-t-tertiary transition-transform",
            open && "rotate-180",
          )}
        />
      </button>
      {open ? (
        <div
          id={`reasoning-body-${instanceKey}`}
          role="region"
          aria-labelledby={`reasoning-trigger-${instanceKey}`}
          className="max-h-[120px] overflow-y-auto px-2 py-1.5"
        >
          <div className="chat-markdown text-[11px] leading-relaxed">
            <ReactMarkdown components={markdownComponents}>{text}</ReactMarkdown>
          </div>
        </div>
      ) : null}
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
    <div className="flex flex-col gap-2">
      {ordered.map((item, i) => {
        if (item.kind === "tool") {
          const step = stepByCallId.get(item.toolCallId);
          if (!step) return null;
          return (
            <div
              key={`${item.toolCallId}-${i}`}
              className="flex flex-wrap gap-1.5 shrink-0"
            >
              <ToolStepChip step={step} frames={frames} />
            </div>
          );
        }
        if (item.kind === "reasoning") {
          return (
            <ReasoningBlock
              key={`reasoning-${i}`}
              instanceKey={`reasoning-${i}`}
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


const markdownComponents: React.ComponentProps<
  typeof ReactMarkdown
>["components"] = {
  p: ({ children }) => (
    <p className="mb-1.5 last:mb-0 text-[13px] leading-relaxed text-t-secondary">
      {children}
    </p>
  ),
  ul: ({ children }) => (
    <ul className="mb-1.5 list-disc space-y-0.5 pl-3">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="mb-1.5 list-decimal space-y-0.5 pl-3">{children}</ol>
  ),
  li: ({ children }) => (
    <li className="text-[13px] leading-relaxed text-t-secondary">{children}</li>
  ),
  code: ({ children }) => (
    <code className="rounded bg-muted/80 px-1 py-0.5 font-mono text-[12px] text-t-primary">
      {children}
    </code>
  ),
  pre: ({ children }) => (
    <pre className="mb-1.5 max-w-full overflow-x-auto rounded-md bg-muted/80 p-2 font-mono text-[12px] text-t-secondary">
      {children}
    </pre>
  ),
  strong: ({ children }) => (
    <strong className="font-semibold text-t-primary">{children}</strong>
  ),
  em: ({ children }) => <em className="italic text-t-secondary">{children}</em>,
  h1: ({ children }) => (
    <h1 className="mb-1 mt-2 text-[15px] font-semibold text-t-primary first:mt-0">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="mb-1 mt-2 text-[13px] font-semibold text-t-primary first:mt-0">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="mb-1 mt-1.5 text-[13px] font-medium text-t-primary first:mt-0">
      {children}
    </h3>
  ),
  blockquote: ({ children }) => (
    <blockquote className="mb-1.5 border-l-2 pl-2 text-t-secondary [border-left-color:var(--border-secondary)]">
      {children}
    </blockquote>
  ),
  a: ({ children, href }) => (
    <a
      href={href}
      className="text-t-primary underline underline-offset-2 hover:text-t-secondary"
      target="_blank"
      rel="noreferrer"
    >
      {children}
    </a>
  ),
};

const MIN_PANEL_WIDTH = 360;
const MAX_PANEL_WIDTH = 600;
const DEFAULT_PANEL_WIDTH = 432;
const RAIL_OFFSET = 70;
const RIGHT_MARGIN = 16;

// ChatHistoryShimmer is no longer needed — loading state is inline

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
  const frames = useAppSelector((s) => s.canvas.frames);
  const theme = useAppSelector((s) => s.canvas.theme);
  const activeThemeMode = useAppSelector((s) => s.canvas.activeThemeMode);
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
        // For new themes, wrap variables in the variant structure
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

  const chatSessionContextRef = useRef({
    projectId,
    userId: chatUserId,
  });
  chatSessionContextRef.current = {
    projectId,
    userId: chatUserId,
  };

  const postChatSession = useCallback((messagesPayload: UIMessage[]) => {
    const { projectId: pid, userId: uid } = chatSessionContextRef.current;
    return http.post("/api/chat/sessions", {
      projectId: pid,
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
          data.toolName === "design_screen" ||
          data.toolName === "update_screen"
        ) {
        }
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
      userId: chatUserId,
    });
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
      setToolSteps([]);
      setLastMessageToolSteps([]);
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
      className="chat-panel fixed top-[8%] bottom-[10%] z-30 flex flex-col rounded-xl border border-b-secondary bg-surface-elevated/90 backdrop-blur-xl shadow-lg overflow-hidden"
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

      {/* Header — matches Activity panel */}
      <div className="flex items-center justify-between px-3 py-2 flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono font-medium uppercase tracking-wider text-t-tertiary">
            Chat
          </span>
          {selectedFrameIds.length > 0 && (
            <span className="text-[11px] text-t-tertiary truncate max-w-[140px]">
              · {activeFrameLabel}
            </span>
          )}
        </div>
        <div ref={headerDropdownRef} className="relative">
          <button
            type="button"
            onClick={onClose}
            className="size-5 flex items-center justify-center rounded text-t-tertiary hover:text-t-secondary transition-colors"
          >
            <X className="size-3" />
          </button>
        </div>
      </div>

      {/* Messages area — matches Activity panel */}
      {isLoadingHistory ? (
        <div className="flex items-center justify-center py-10 px-4">
          <div className="flex items-center gap-2 text-xs text-t-tertiary">
            <div className="size-1.5 rounded-full bg-t-tertiary animate-pulse" />
            Loading...
          </div>
        </div>
      ) : !isLoadingHistory && messages.length === 0 && !isActivelyStreaming ? (
        <WelcomeState />
      ) : (
        <div className="relative min-h-0 flex-1">
          <div className="pointer-events-none absolute left-0 right-0 top-0 z-10 h-4 bg-gradient-to-b from-surface-elevated to-transparent" />

          <div
            ref={chatThreadRef}
            id="chat-thread-area"
            className="h-full overflow-y-auto scrollbar-hide"
          >
            <div className="flex flex-col gap-2 px-3 py-3">
              {messages
                .filter((m: { role: string }) => m.role !== "system")
                .map(
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
                    const visibleMessages = messages.filter(
                      (m: { role: string }) => m.role !== "system",
                    );
                    const isLastMessage =
                      msgIndex === visibleMessages.length - 1;

                    const stepsFromParts =
                      msg.role === "assistant"
                        ? toolStepsFromParts(msg.parts as MessagePart[])
                        : undefined;

                    const liveToolSteps =
                      isLastMessage && isActivelyStreaming
                        ? toolSteps
                        : undefined;

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
                        {msg.role === "user" ? (
                          <div className="flex justify-end">
                            <div className="max-w-[90%] rounded-lg bg-input-bg px-2.5 py-1.5">
                              {getUserMessageText(msg) ? (
                                <div className="chat-markdown">
                                  <ReactMarkdown
                                    components={markdownComponents}
                                  >
                                    {getUserMessageText(msg)!}
                                  </ReactMarkdown>
                                </div>
                              ) : null}
                            </div>
                          </div>
                        ) : msg.role === "assistant" ? (
                          <div className="flex justify-start">
                            <div className="max-w-[95%]">
                              {msg.parts && msg.parts.length > 0 ? (
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
                                  <ReactMarkdown
                                    components={markdownComponents}
                                  >
                                    {msg.content}
                                  </ReactMarkdown>
                                </div>
                              ) : stepsForMessage &&
                                stepsForMessage.length > 0 ? (
                                <AssistantMessageContent
                                  parts={[]}
                                  frames={frames}
                                  isStreaming={
                                    status === "streaming" && isLastMessage
                                  }
                                  toolSteps={stepsForMessage}
                                />
                              ) : null}
                            </div>
                          </div>
                        ) : null}
                      </Fragment>
                    );
                  },
                )}

              {showPendingBubble && (
                <div className="flex justify-start">
                  <div className="max-w-[95%]">
                    <AssistantMessageContent
                      parts={[]}
                      frames={frames}
                      isStreaming={status === "streaming"}
                      toolSteps={toolSteps}
                    />
                  </div>
                </div>
              )}

              {/* Thinking indicator — shimmer text like Activity panel */}
              {(showStreamingIndicator ||
                (isActivelyStreaming && !showPendingBubble && !lastMsgHasContent)) && (
                <StreamingActivityIndicator
                  label={
                    status === "submitted"
                      ? "Thinking..."
                      : "Generating screens..."
                  }
                />
              )}
            </div>
          </div>

          <div className="pointer-events-none absolute bottom-0 left-0 right-0 z-10 h-4 bg-gradient-to-t from-surface-elevated to-transparent" />
        </div>
      )}

      <div className="w-full border-t border-b-secondary/50 p-3">
        <form
          onSubmit={handleSend}
          className="w-full overflow-visible rounded-2xl border border-border/50 bg-input-bg/80 shadow-sm transition-all focus-within:border-border focus-within:bg-input-bg focus-within:shadow-md"
        >
          {selectedFrameIds.length > 0 && (
            <div className="flex flex-wrap gap-1.5 px-3.5 pt-3 pb-0.5">
              {selectedFrameIds.map((id) => {
                const frame = frames.find((f) => f.id === id);
                if (!frame) return null;
                return (
                  <span
                    key={id}
                    className="mention-chip inline-flex items-center gap-1.5 rounded-lg border px-2 py-0.5 text-[11px] font-medium text-mention-chip-text"
                    style={{
                      backgroundColor: "var(--mention-chip-bg)",
                      borderColor: "var(--mention-chip-border)",
                    }}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="10"
                      height="10"
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
            placeholder="Ask AI to design or edit..."
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            disabled={isActivelyStreaming}
            className="text-sm"
          />
          <div className="flex items-center justify-between px-2 pb-2">
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                aria-label="Attach image"
                className="inline-flex size-7 shrink-0 items-center justify-center rounded-lg text-t-tertiary transition-colors hover:text-t-secondary hover:bg-secondary/40"
              >
                <ImageIcon className="size-3.5" />
              </button>
              <div ref={agentDropdownRef} className="relative">
                <button
                  type="button"
                  onClick={() => setShowAgentDropdown((v) => !v)}
                  className="inline-flex items-center gap-1 rounded-lg px-1.5 py-1 text-xs font-medium text-t-tertiary transition-colors hover:text-t-secondary hover:bg-secondary/40"
                >
                  <Zap className="size-3" fill="currentColor" />
                  <span className="text-[11px]">{agentCount}</span>
                  <ChevronDown className="size-2.5 opacity-60" />
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
            {isActivelyStreaming ? (
              <button
                type="button"
                onClick={() => stop()}
                className="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-red-500/10 text-red-500 outline-none transition-all hover:bg-red-500/20 active:scale-95"
                aria-label="Stop generating"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="6" width="12" height="12" rx="2" />
                </svg>
              </button>
            ) : (
              <button
                type="submit"
                disabled={!inputValue.trim()}
                className="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-btn-primary-bg text-btn-primary-text shadow-sm outline-none transition-all hover:opacity-90 disabled:pointer-events-none disabled:opacity-30 focus-visible:ring-2 focus-visible:ring-ring/50 active:scale-95"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="1em"
                  height="1em"
                  fill="currentColor"
                  viewBox="0 0 256 256"
                  className="size-3.5"
                >
                  <path d="M205.66,117.66a8,8,0,0,1-11.32,0L136,59.31V216a8,8,0,0,1-16,0V59.31L61.66,117.66a8,8,0,0,1-11.32-11.32l72-72a8,8,0,0,1,11.32,0l72,72A8,8,0,0,1,205.66,117.66Z" />
                </svg>
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
