"use client";

import type React from "react";
import { Fragment, useEffect, useRef, useState } from "react";
import { Brain, ChevronDown, MessageSquareText, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { toggleAgentLogVisible } from "@/store/slices/uiSlice";
import {
  subscribeActivityHistoryLoading,
  subscribeChatMessages,
  subscribeChatStatus,
  stopChatGeneration,
} from "@/lib/chat-bridge";
import ReactMarkdown from "react-markdown";

interface MessagePart {
  type: string;
  text?: string;
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

function getUserText(msg: ChatMessage): string | null {
  if (typeof msg.content === "string" && msg.content.length > 0)
    return msg.content;
  const p = msg.parts?.find(
    (x) => x.type === "text" && x.text != null && x.text.length > 0,
  );
  return p?.text ?? null;
}

function getToolLabel(
  toolName: string,
  input?: { id?: string; name?: string; description?: string; screens?: Array<{ name?: string }> },
  done?: boolean,
): string {
  const toTitle = (s: string) => s.replace(/\b\w/g, (c) => c.toUpperCase());
  // Try to extract screen name from various input shapes
  const screenName =
    input?.name
      ? toTitle(input.name)
      : input?.screens?.[0]?.name
        ? toTitle(input.screens[0].name)
        : undefined;

  if (toolName === "design_screen")
    return done
      ? `Designed ${screenName ?? "screen"}`
      : `Designing ${screenName ?? "screen"}…`;
  if (toolName === "create_all_screens") {
    const count = input?.screens?.length;
    const names = input?.screens?.map((s) => s.name).filter(Boolean);
    if (names && names.length > 0) {
      return done
        ? `Created ${names.join(", ")}`
        : `Creating ${names.join(", ")}…`;
    }
    return done
      ? `Created ${count ?? ""} screens`
      : `Creating ${count ?? ""} screens…`;
  }
  if (toolName === "update_screen")
    return done
      ? `Updated ${screenName ?? "screen"}`
      : `Updating ${screenName ?? "screen"}…`;
  if (toolName === "edit_design")
    return done
      ? `Edited ${screenName ?? "screen"}`
      : `Editing ${screenName ?? "screen"}…`;
  if (toolName === "read_screen")
    return done
      ? `Read ${screenName ?? "screen"}`
      : `Reading ${screenName ?? "screen"}…`;
  if (toolName === "build_theme")
    return done ? "Built theme" : "Building theme…";
  if (toolName === "update_theme")
    return done ? "Updated theme" : "Updating theme…";
  const base = toTitle(toolName.replace(/_/g, " "));
  return done ? base : `${base}…`;
}

function ToolStep({ part }: { part: MessagePart }) {
  const done = part.state === "done" || part.state === "output-available";
  const label = getToolLabel(
    part.toolName ??
      (part.type?.startsWith("tool-") ? part.type.slice(5) : "tool"),
    part.input as { id?: string; name?: string; description?: string; screens?: Array<{ name?: string }> } | undefined,
    done,
  );
  return (
    <div className="flex items-center gap-2 py-0.5">
      {done ? (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="shrink-0">
          <circle cx="12" cy="12" r="10" fill="#22c55e" fillOpacity="0.15" />
          <path d="M8 12.5l2.5 2.5 5-5" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="shrink-0 animate-spin" style={{ animationDuration: "1.5s" }}>
          <circle cx="12" cy="12" r="10" stroke="#22c55e" strokeOpacity="0.2" strokeWidth="2" />
          <path d="M12 2a10 10 0 0 1 10 10" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" />
        </svg>
      )}
      <span className={`text-xs ${done ? "text-t-secondary" : "text-t-primary"}`}>
        {label}
      </span>
    </div>
  );
}

const activityMarkdownComponents: React.ComponentProps<
  typeof ReactMarkdown
>["components"] = {
  p: ({ children }) => (
    <p className="mb-1.5 last:mb-0 text-[11px] leading-relaxed text-t-secondary">
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
    <li className="text-[11px] leading-relaxed text-t-secondary">{children}</li>
  ),
  code: ({ children }) => (
    <code className="rounded bg-muted/80 px-1 py-0.5 font-mono text-[11px] text-t-primary">
      {children}
    </code>
  ),
  pre: ({ children }) => (
    <pre className="mb-1.5 max-w-full overflow-x-auto rounded-md bg-muted/80 p-2 font-mono text-[11px] text-t-secondary">
      {children}
    </pre>
  ),
  strong: ({ children }) => (
    <strong className="font-semibold text-t-primary">{children}</strong>
  ),
  em: ({ children }) => <em className="italic text-t-secondary">{children}</em>,
  h1: ({ children }) => (
    <h1 className="mb-1 mt-2 text-[13px] font-semibold text-t-primary first:mt-0">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="mb-1 mt-2 text-[12px] font-semibold text-t-primary first:mt-0">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="mb-1 mt-1.5 text-[11px] font-medium text-t-primary first:mt-0">
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


function ExpandableReasoningBlock({
  text,
  partState,
  instanceKey,
}: {
  text: string;
  partState?: string;
  instanceKey: string;
}) {
  const streaming = partState === "streaming";
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
          className="px-2 py-1.5"
        >
          <div className="chat-markdown">
            <ReactMarkdown components={activityMarkdownComponents}>
              {text}
            </ReactMarkdown>
          </div>
        </div>
      ) : null}
    </div>
  );
}

// Planning/internal tools that should be hidden from the activity feed
const HIDDEN_TOOL_PREFIXES = [
  "classifyIntent",
  "planScreens",
  "planStyle",
  "build_theme",
];

// Part types that are streaming noise — skip them
const NOISE_PART_TYPES = new Set([
  "step-start",
  "data-tool-call-start",
  "data-tool-call-delta",
  "data-tool-call-end",
]);

function isHiddenTool(toolName: string | undefined): boolean {
  if (!toolName) return false;
  return HIDDEN_TOOL_PREFIXES.some(
    (prefix) => toolName === prefix || toolName.startsWith(`tool-${prefix}`),
  );
}

function AssistantBubble({ msg }: { msg: ChatMessage }) {
  const parts = msg.parts ?? [];

  // Filter out noise and hidden planning tools, deduplicate by toolCallId
  const seenToolCallIds = new Set<string>();
  const toolParts = parts.filter((p) => {
    if (NOISE_PART_TYPES.has(p.type ?? "")) return false;
    const isToolPart =
      p.type === "tool-step" ||
      (p.type?.startsWith("tool-") && !NOISE_PART_TYPES.has(p.type)) ||
      p.type === "dynamic-tool";
    if (!isToolPart) return false;
    // Get the tool name from either toolName or the type suffix
    const name =
      p.toolName ?? (p.type?.startsWith("tool-") ? p.type.slice(5) : "");
    if (isHiddenTool(name)) return false;
    // Deduplicate by toolCallId
    if (p.toolCallId) {
      if (seenToolCallIds.has(p.toolCallId)) return false;
      seenToolCallIds.add(p.toolCallId);
    }
    return true;
  });

  const textParts = parts.filter(
    (p) => p.type === "text" && p.text != null && p.text.length > 0,
  );
  const reasoningParts = parts.filter(
    (p) => p.type === "reasoning" && p.text != null && p.text.length > 0,
  );

  if (
    toolParts.length === 0 &&
    textParts.length === 0 &&
    reasoningParts.length === 0 &&
    !msg.content
  )
    return null;

  return (
    <div className="flex flex-col gap-2">
      {reasoningParts.length > 0 && (
        <ExpandableReasoningBlock
          key={`reasoning-${msg.id}`}
          instanceKey={msg.id}
          text={reasoningParts.map((p) => p.text!).join("\n\n")}
          partState={reasoningParts[reasoningParts.length - 1].state}
        />
      )}
      {toolParts.length > 0 && (
        <div className="rounded-lg border border-b-secondary bg-input-bg/40 px-3 py-2">
          {toolParts.map((p, i) => (
            <ToolStep key={p.toolCallId ?? i} part={p} />
          ))}
        </div>
      )}
      {textParts.map((p, i) => (
        <div key={`${msg.id}-text-${i}`} className="chat-markdown">
          <ReactMarkdown components={activityMarkdownComponents}>
            {p.text!}
          </ReactMarkdown>
        </div>
      ))}
      {textParts.length === 0 &&
        typeof msg.content === "string" &&
        msg.content.length > 0 && (
          <div className="chat-markdown">
            <ReactMarkdown components={activityMarkdownComponents}>
              {msg.content}
            </ReactMarkdown>
          </div>
        )}
    </div>
  );
}

export function CanvasBottomLeft() {
  const dispatch = useAppDispatch();
  const logVisible = useAppSelector((s) => s.ui.agentLogVisible);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [chatStatus, setChatStatus] = useState<string>("ready");

  useEffect(() => {
    return subscribeActivityHistoryLoading(setHistoryLoading);
  }, []);

  useEffect(() => {
    return subscribeChatStatus(setChatStatus);
  }, []);

  // Live sync with ChatPanel useChat state (same source as /api/chat/sessions hydrate)
  useEffect(() => {
    return subscribeChatMessages((next) => {
      if (Array.isArray(next)) setMessages(next as ChatMessage[]);
    });
  }, []);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current && logVisible) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, logVisible]);

  const visibleMessages = messages.filter((m) => m.role !== "system");

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
            <div className="flex items-center gap-1">
              {(chatStatus === "submitted" || chatStatus === "streaming") && (
                <button
                  type="button"
                  onClick={stopChatGeneration}
                  className="flex items-center gap-1 rounded-md bg-red-500/10 px-2 py-1 text-[11px] font-medium text-red-500 transition-colors hover:bg-red-500/20"
                >
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                    <rect x="4" y="4" width="16" height="16" rx="2" />
                  </svg>
                  Stop
                </button>
              )}
              <button
                type="button"
                onClick={() => dispatch(toggleAgentLogVisible())}
                className="size-5 flex items-center justify-center rounded text-t-tertiary hover:text-t-secondary transition-colors"
              >
                <X className="size-3" />
              </button>
            </div>
          </div>

          {/* Messages */}
          {historyLoading ? (
            <div className="flex items-center justify-center py-10 px-4">
              <div className="flex items-center gap-2 text-xs text-t-tertiary">
                <div className="size-1.5 rounded-full bg-t-tertiary animate-pulse" />
                Loading...
              </div>
            </div>
          ) : visibleMessages.length === 0 ? (
            <div className="flex items-center justify-center py-10 px-4">
              <p className="text-[11px] text-t-tertiary text-center">
                No activity yet
              </p>
            </div>
          ) : (
            <div className="relative">
              <div className="pointer-events-none absolute left-0 right-0 top-0 z-10 h-4 bg-gradient-to-b from-surface-elevated to-transparent" />

              {/* max-h + overflow-y only: avoid h-full inside flex-col without fixed card height (was collapsing to 0) */}
              <div
                ref={scrollRef}
                className="max-h-[min(480px,calc(560px-2.75rem))] overflow-y-auto scrollbar-hide"
              >
                <div className="flex flex-col gap-2 px-3 py-3">
                  {visibleMessages.map((msg, idx) => {
                    const isLast = idx === visibleMessages.length - 1;
                    const userText =
                      msg.role === "user" ? getUserText(msg) : null;
                    return (
                      <Fragment key={msg.id}>
                        {msg.role === "user" ? (
                          <div className="flex justify-end">
                            <div className="max-w-[90%] rounded-lg bg-input-bg px-2.5 py-1.5">
                              {userText ? (
                                <div className="chat-markdown">
                                  <ReactMarkdown
                                    components={activityMarkdownComponents}
                                  >
                                    {userText}
                                  </ReactMarkdown>
                                </div>
                              ) : null}
                            </div>
                          </div>
                        ) : msg.role === "assistant" ? (
                          <div className="flex justify-start">
                            <div className="max-w-[95%]">
                              <AssistantBubble msg={msg} />
                            </div>
                          </div>
                        ) : null}
                      </Fragment>
                    );
                  })}

                  {/* Thinking indicator — blue shimmer text */}
                  {(chatStatus === "submitted" || chatStatus === "streaming") && (
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
    </div>
  );
}
