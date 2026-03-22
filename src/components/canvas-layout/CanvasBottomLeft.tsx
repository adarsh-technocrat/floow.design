"use client";

import type React from "react";
import { Fragment, useEffect, useRef, useState } from "react";
import { ChevronDown, MessageSquareText, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { toggleAgentLogVisible } from "@/store/slices/uiSlice";
import {
  subscribeActivityHistoryLoading,
  subscribeChatMessages,
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
  input?: { id?: string; name?: string },
  done?: boolean,
): string {
  const toTitle = (s: string) => s.replace(/\b\w/g, (c) => c.toUpperCase());
  const name = input?.name ? toTitle(input.name) : undefined;
  const map: Record<string, [string, string]> = {
    classifyIntent: ["Understanding intent…", "Understood intent"],
    planScreens: ["Planning screens…", "Planned screens"],
    planStyle: ["Defining visual style…", "Defined visual style"],
    build_theme: ["Creating theme…", "Created theme"],
    update_theme: ["Updating theme…", "Updated theme"],
    create_all_screens: ["Creating all screens…", "Created all screens"],
  };
  if (map[toolName]) return done ? map[toolName][1] : map[toolName][0];
  if (toolName === "design_screen")
    return done
      ? `Designed ${name ?? "screen"}`
      : `Designing ${name ?? "screen"}…`;
  if (toolName === "update_screen")
    return done
      ? `Updated ${name ?? "screen"}`
      : `Updating ${name ?? "screen"}…`;
  if (toolName === "edit_design")
    return done ? `Edited ${name ?? "screen"}` : `Editing ${name ?? "screen"}…`;
  if (toolName === "read_screen")
    return done ? `Read ${name ?? "screen"}` : `Reading ${name ?? "screen"}…`;
  const base = toTitle(toolName.replace(/_/g, " "));
  return done ? base : `${base}…`;
}

function ToolChip({ part }: { part: MessagePart }) {
  const done = part.state === "done" || part.state === "output-available";
  const label = getToolLabel(
    part.toolName ??
      (part.type?.startsWith("tool-") ? part.type.slice(5) : "tool"),
    part.input as { id?: string; name?: string } | undefined,
    done,
  );
  return (
    <div
      className={`flex items-center gap-1.5 rounded-md border border-b-0 px-2 py-1 ${done ? "border-b-secondary bg-input-bg" : "border-b-primary bg-input-bg"}`}
    >
      {done ? (
        <svg
          width="10"
          height="10"
          viewBox="0 0 256 256"
          fill="currentColor"
          className="text-t-secondary shrink-0"
        >
          <path d="M229.66,77.66l-128,128a8,8,0,0,1-11.32,0l-56-56a8,8,0,0,1,11.32-11.32L96,188.69,218.34,66.34a8,8,0,0,1,11.32,11.32Z" />
        </svg>
      ) : (
        <span className="size-2.5 shrink-0 animate-pulse rounded-full bg-t-secondary" />
      )}
      <span
        className={`font-mono text-[9px] uppercase tracking-wider ${done ? "text-t-secondary" : "text-t-secondary"}`}
      >
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
    <code className="rounded bg-muted/80 px-1 py-0.5 font-mono text-[10px] text-t-primary">
      {children}
    </code>
  ),
  pre: ({ children }) => (
    <pre className="mb-1.5 max-w-full overflow-x-auto rounded-md bg-muted/80 p-2 font-mono text-[10px] text-t-secondary">
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
    <blockquote className="mb-1.5 border-l-2 border-b-primary pl-2 text-t-secondary">
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

function ActivityHistoryShimmer() {
  return (
    <div className="flex flex-col gap-3 px-3 py-4">
      <div className="flex justify-end">
        <div className="activity-shimmer-bar h-7 w-[58%]" />
      </div>
      <div className="flex flex-col gap-2">
        <div className="activity-shimmer-bar h-3.5 w-[42%]" />
        <div className="activity-shimmer-bar h-3.5 w-[78%]" />
        <div className="activity-shimmer-bar h-3.5 w-[56%]" />
      </div>
      <div className="flex justify-end">
        <div className="activity-shimmer-bar h-7 w-[52%]" />
      </div>
      <div className="flex flex-col gap-2">
        <div className="activity-shimmer-bar h-3.5 w-[64%]" />
        <div className="activity-shimmer-bar h-3.5 w-[38%]" />
      </div>
    </div>
  );
}

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

  const flat = text.replace(/\s+/g, " ").trim();
  const preview = flat.slice(0, 88);
  const truncated = flat.length > 88;

  return (
    <div className="overflow-hidden rounded-md border border-b-0 border-b-secondary bg-input-bg">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 px-2 py-1.5 text-left transition-colors hover:bg-surface-sunken/80"
        aria-expanded={open}
        aria-controls={`reasoning-body-${instanceKey}`}
        id={`reasoning-trigger-${instanceKey}`}
      >
        <div className="min-w-0 flex-1">
          <span className="font-mono text-[10px] font-medium uppercase tracking-wider text-t-tertiary">
            Reasoning
          </span>
          {!open && (
            <p className="mt-0.5 line-clamp-2 text-[10px] leading-snug text-t-secondary">
              {preview}
              {truncated ? "…" : ""}
            </p>
          )}
        </div>
        {streaming ? (
          <span
            className="size-1.5 shrink-0 animate-pulse rounded-full bg-t-secondary"
            title="Streaming"
          />
        ) : null}
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

function AssistantBubble({ msg }: { msg: ChatMessage }) {
  const parts = msg.parts ?? [];
  const toolParts = parts.filter(
    (p) =>
      p.type === "tool-step" ||
      p.type?.startsWith("tool-") ||
      p.type === "dynamic-tool",
  );
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
    <div className="flex flex-col gap-1.5">
      {toolParts.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {toolParts.map((p, i) => (
            <ToolChip key={p.toolCallId ?? i} part={p} />
          ))}
        </div>
      )}
      {reasoningParts.map((p, i) => (
        <ExpandableReasoningBlock
          key={`reasoning-${msg.id}-${i}`}
          instanceKey={`${msg.id}-${i}`}
          text={p.text!}
          partState={p.state}
        />
      ))}
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

  useEffect(() => {
    return subscribeActivityHistoryLoading(setHistoryLoading);
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
        <div className="w-[260px] max-h-[560px] flex flex-col rounded-xl border border-b-0 border-b-primary bg-surface-elevated/90 backdrop-blur-xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2 flex-shrink-0">
            <span className="text-[10px] font-mono font-medium uppercase tracking-wider text-t-tertiary">
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

          {/* Messages */}
          {historyLoading ? (
            <div className="relative">
              <div className="pointer-events-none absolute left-0 right-0 top-0 z-10 h-4 bg-gradient-to-b from-surface-elevated to-transparent" />
              <div className="max-h-[min(480px,calc(560px-2.75rem))] overflow-hidden">
                <ActivityHistoryShimmer />
              </div>
              <div className="pointer-events-none absolute bottom-0 left-0 right-0 z-10 h-4 bg-gradient-to-t from-surface-elevated to-transparent" />
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
                  {visibleMessages.map((msg) => {
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
        className={`flex items-center gap-2 rounded-xl border border-b-0 backdrop-blur-sm px-4 py-2.5 text-xs font-medium transition-colors ${
          logVisible
            ? "border-b-strong bg-input-bg text-t-primary"
            : "border-b-strong bg-surface-elevated/80 text-t-secondary hover:text-t-primary hover:border-b-strong"
        }`}
        title="Toggle Agent Log"
      >
        <MessageSquareText className="size-4" />
        Agent Log
        {visibleMessages.length > 0 && !logVisible && (
          <span className="text-[10px] font-mono text-t-tertiary bg-input-bg rounded-full px-1.5 py-0.5 min-w-[20px] text-center">
            {visibleMessages.length}
          </span>
        )}
      </button>
    </div>
  );
}
