"use client";

import type React from "react";
import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import { Brain, ChevronDown, MessageSquareText, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { toggleAgentLogVisible } from "@/store/slices/uiSlice";
import {
  subscribeActivityHistoryLoading,
  subscribeChatMessages,
  subscribeChatStatus,
} from "@/lib/chat-bridge";
import ReactMarkdown from "react-markdown";

/* ── Types ── */

interface MessagePart {
  type: string;
  text?: string;
  image?: string;
  url?: string;
  mediaType?: string;
  toolCallId?: string;
  toolName?: string;
  state?: string;
  input?: { id?: string; name?: string };
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content?: string;
  parts?: MessagePart[];
}

/** Changes when the last message body updates (streaming); avoids skipping Activity updates when only length+id stay the same. */
function fingerprintLastMessage(msg: ChatMessage | undefined): string {
  if (!msg) return "";
  if (typeof msg.content === "string" && msg.content.length > 0) {
    return `c:${msg.content.length}`;
  }
  const parts = msg.parts;
  if (!parts?.length) return "p:0";
  let sig = 0;
  for (const p of parts) {
    const t = (p as { text?: string }).text;
    if (typeof t === "string") sig += t.length;
    const st = (p as { state?: string }).state;
    if (typeof st === "string") sig += st.length;
  }
  return `p:${parts.length}:${sig}`;
}

/* ── Helpers (identical to ChatPanel) ── */

function getUserText(msg: ChatMessage): string | null {
  if (typeof msg.content === "string" && msg.content.length > 0)
    return msg.content;
  const p = msg.parts?.find(
    (x) => x.type === "text" && x.text != null && x.text.length > 0,
  );
  return p?.text ?? null;
}

function getUserImages(msg: ChatMessage): string[] {
  if (!msg.parts) return [];
  return msg.parts
    .filter(
      (p) => (p.type === "image" && p.image) || (p.type === "file" && p.url),
    )
    .map((p) => p.image ?? p.url ?? "");
}

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

const TOOL_STEP_PART_TYPE = "tool-step";

interface ToolStep {
  toolCallId: string;
  toolName: string;
  state: "running" | "done" | "error";
  input?: { id?: string; name?: string };
}

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

/* ── Markdown components (identical to ChatPanel) ── */

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

/* ── UI components (identical to ChatPanel) ── */

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
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          className="shrink-0"
        >
          <path
            d="M8 12.5l2.5 2.5 5-5"
            stroke="#22c55e"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : (
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          className="shrink-0 animate-spin"
          style={{ animationDuration: "1.5s" }}
        >
          <circle
            cx="12"
            cy="12"
            r="9"
            stroke="#3b82f6"
            strokeOpacity="0.3"
            strokeWidth="2.5"
          />
          <path
            d="M12 3a9 9 0 0 1 9 9"
            stroke="#3b82f6"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </svg>
      )}
      <span
        className={`text-[11px] font-medium ${
          finished
            ? "text-emerald-600 dark:text-emerald-400"
            : "text-blue-600 dark:text-blue-400"
        }`}
      >
        {label}
      </span>
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
        aria-controls={`act-reasoning-body-${instanceKey}`}
        id={`act-reasoning-trigger-${instanceKey}`}
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
          id={`act-reasoning-body-${instanceKey}`}
          role="region"
          aria-labelledby={`act-reasoning-trigger-${instanceKey}`}
          className="max-h-[120px] overflow-y-auto px-2 py-1.5"
        >
          <div className="chat-markdown text-[11px] leading-relaxed">
            <ReactMarkdown components={markdownComponents}>
              {text}
            </ReactMarkdown>
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
              instanceKey={`act-reasoning-${i}`}
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

/* ── Main component ── */

export function CanvasBottomLeft() {
  const dispatch = useAppDispatch();
  const logVisible = useAppSelector((s) => s.ui.agentLogVisible);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [chatStatus, setChatStatus] = useState<string>("ready");
  const frames = useAppSelector((s) => s.canvas.frames);

  useEffect(() => {
    return subscribeActivityHistoryLoading(setHistoryLoading);
  }, []);

  useEffect(() => {
    return subscribeChatStatus(setChatStatus);
  }, []);

  const lastMsgKeyRef = useRef("");
  useEffect(() => {
    return subscribeChatMessages((next) => {
      if (!Array.isArray(next)) return;
      const arr = next as ChatMessage[];
      const last = arr[arr.length - 1];
      const key = `${arr.length}:${last?.id ?? ""}:${fingerprintLastMessage(last)}`;
      if (key === lastMsgKeyRef.current) return;
      lastMsgKeyRef.current = key;
      setMessages(arr);
    });
  }, []);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current && logVisible) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, logVisible, chatStatus]);

  const visibleMessages = messages.filter((m) => m.role !== "system");

  const isActivelyStreaming =
    chatStatus === "submitted" || chatStatus === "streaming";

  // Image preview dialog
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  return (
    <div className="absolute bottom-4 left-4 z-10 flex flex-col items-start gap-2">
      {/* Log panel */}
      {logVisible && (
        <div className="w-[300px] max-h-[560px] flex flex-col rounded-xl border border-b-secondary bg-surface-elevated/90 backdrop-blur-xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2 flex-shrink-0">
            <span className="text-[11px] font-mono font-medium uppercase tracking-wider text-t-tertiary">
              Activity
            </span>
            <button
              type="button"
              onClick={() => dispatch(toggleAgentLogVisible())}
              className="size-5 flex items-center justify-center rounded text-t-tertiary hover:text-t-secondary transition-colors"
            >
              <X className="size-3" />
            </button>
          </div>

          {/* Messages — identical rendering to ChatPanel */}
          {historyLoading ? (
            <div className="flex items-center justify-center py-10 px-4">
              <div className="flex items-center gap-2 text-xs text-t-tertiary">
                <div className="size-1.5 rounded-full bg-t-tertiary animate-pulse" />
                Loading...
              </div>
            </div>
          ) : visibleMessages.length === 0 && !isActivelyStreaming ? (
            <div className="flex items-center justify-center py-10 px-4">
              <p className="text-[11px] text-t-tertiary text-center">
                No activity yet
              </p>
            </div>
          ) : (
            <div className="relative">
              <div className="pointer-events-none absolute left-0 right-0 top-0 z-10 h-4 bg-gradient-to-b from-surface-elevated to-transparent" />

              <div
                ref={scrollRef}
                className="max-h-[min(480px,calc(560px-2.75rem))] overflow-y-auto scrollbar-hide"
              >
                <div className="flex flex-col gap-2 px-3 py-3">
                  {visibleMessages.map((msg, msgIndex) => {
                    const isLastMessage =
                      msgIndex === visibleMessages.length - 1;

                    const stepsForMessage =
                      msg.role === "assistant"
                        ? toolStepsFromParts(msg.parts as MessagePart[])
                        : undefined;

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
                              {getUserImages(msg).length > 0 && (
                                <div className="flex gap-1.5 mb-1.5 flex-wrap">
                                  {getUserImages(msg).map((src, imgIdx) => (
                                    <button
                                      key={imgIdx}
                                      type="button"
                                      onClick={() => setPreviewImage(src)}
                                      className="cursor-zoom-in"
                                    >
                                      <img
                                        src={src}
                                        alt="Attached"
                                        className="max-h-24 max-w-[140px] rounded-md object-cover border border-b-secondary transition-opacity hover:opacity-80"
                                      />
                                    </button>
                                  ))}
                                </div>
                              )}
                              {getUserText(msg) ? (
                                <div className="chat-markdown">
                                  <ReactMarkdown
                                    components={markdownComponents}
                                  >
                                    {getUserText(msg)!}
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
                                    chatStatus === "streaming" && isLastMessage
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
                                    chatStatus === "streaming" && isLastMessage
                                  }
                                  toolSteps={stepsForMessage}
                                />
                              ) : null}
                            </div>
                          </div>
                        ) : null}
                      </Fragment>
                    );
                  })}

                  {/* Thinking indicator — shimmer text */}
                  {isActivelyStreaming && (
                    <div className="flex justify-start">
                      <div className="rounded-lg bg-input-bg/60 px-3 py-2">
                        <span className="shimmer-text text-xs font-medium">
                          {chatStatus === "submitted"
                            ? "Thinking..."
                            : "Generating screens..."}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="pointer-events-none absolute bottom-0 left-0 right-0 z-10 h-4 bg-gradient-to-t from-surface-elevated to-transparent" />
            </div>
          )}
        </div>
      )}

      {/* Agent Log button */}
      <button
        type="button"
        onClick={() => dispatch(toggleAgentLogVisible())}
        className={`flex items-center gap-2 rounded-xl border border-b-secondary backdrop-blur-sm px-4 py-2.5 text-xs font-medium transition-colors ${
          logVisible
            ? "bg-input-bg text-t-primary"
            : "bg-surface-elevated/80 text-t-secondary hover:text-t-primary"
        }`}
        title="Toggle Agent Log"
      >
        <MessageSquareText className="size-4" />
        Agent Log
        {visibleMessages.length > 0 && !logVisible && (
          <span className="text-[11px] font-mono text-t-tertiary bg-input-bg rounded-full px-1.5 py-0.5 min-w-[20px] text-center">
            {visibleMessages.length}
          </span>
        )}
      </button>

      {/* Image Preview Dialog */}
      {previewImage && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={() => setPreviewImage(null)}
        >
          <button
            type="button"
            onClick={() => setPreviewImage(null)}
            className="absolute top-4 right-4 flex size-9 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition-colors hover:bg-white/20"
          >
            <X className="size-5" />
          </button>
          <img
            src={previewImage}
            alt="Preview"
            className="max-h-[85vh] max-w-[90vw] rounded-lg object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
