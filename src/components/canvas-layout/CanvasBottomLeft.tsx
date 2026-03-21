"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import { MessageSquareText, X } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { toggleAgentLogVisible } from "@/store/slices/uiSlice";
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
  if (typeof msg.content === "string" && msg.content.trim()) return msg.content;
  const p = msg.parts?.find((p) => p.type === "text" && p.text?.trim());
  return p?.text?.trim() ?? null;
}

function getToolLabel(toolName: string, input?: { id?: string; name?: string }, done?: boolean): string {
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
  if (toolName === "design_screen") return done ? `Designed ${name ?? "screen"}` : `Designing ${name ?? "screen"}…`;
  if (toolName === "update_screen") return done ? `Updated ${name ?? "screen"}` : `Updating ${name ?? "screen"}…`;
  if (toolName === "edit_design") return done ? `Edited ${name ?? "screen"}` : `Editing ${name ?? "screen"}…`;
  if (toolName === "read_screen") return done ? `Read ${name ?? "screen"}` : `Reading ${name ?? "screen"}…`;
  const base = toTitle(toolName.replace(/_/g, " "));
  return done ? base : `${base}…`;
}

function ToolChip({ part }: { part: MessagePart }) {
  const done = part.state === "done" || part.state === "output-available";
  const label = getToolLabel(
    part.toolName ?? (part.type?.startsWith("tool-") ? part.type.slice(5) : "tool"),
    part.input as { id?: string; name?: string } | undefined,
    done,
  );
  return (
    <div className={`flex items-center gap-1.5 rounded-md border px-2 py-1 ${done ? "border-white/[0.08] bg-white/[0.03]" : "border-white/[0.12] bg-white/[0.05]"}`}>
      {done ? (
        <svg width="10" height="10" viewBox="0 0 256 256" fill="currentColor" className="text-white/40 shrink-0">
          <path d="M229.66,77.66l-128,128a8,8,0,0,1-11.32,0l-56-56a8,8,0,0,1,11.32-11.32L96,188.69,218.34,66.34a8,8,0,0,1,11.32,11.32Z" />
        </svg>
      ) : (
        <span className="size-2.5 shrink-0 animate-pulse rounded-full bg-white/40" />
      )}
      <span className={`font-mono text-[9px] uppercase tracking-wider ${done ? "text-white/40" : "text-white/60"}`}>{label}</span>
    </div>
  );
}

const mdComponents = {
  p: ({ children }: { children?: React.ReactNode }) => <p className="mb-1 last:mb-0 text-[11px] leading-relaxed text-white/40">{children}</p>,
  strong: ({ children }: { children?: React.ReactNode }) => <strong className="font-semibold text-white/50">{children}</strong>,
  ul: ({ children }: { children?: React.ReactNode }) => <ul className="mb-1 list-disc pl-3 space-y-0.5">{children}</ul>,
  li: ({ children }: { children?: React.ReactNode }) => <li className="text-[11px] leading-relaxed text-white/40">{children}</li>,
};

function AssistantBubble({ msg }: { msg: ChatMessage }) {
  const parts = msg.parts ?? [];
  const toolParts = parts.filter(
    (p) => p.type === "tool-step" || p.type?.startsWith("tool-") || p.type === "dynamic-tool",
  );
  const textParts = parts.filter((p) => p.type === "text" && p.text?.trim());
  const reasoningParts = parts.filter((p) => p.type === "reasoning" && p.text?.trim());

  if (toolParts.length === 0 && textParts.length === 0 && reasoningParts.length === 0 && !msg.content) return null;

  return (
    <div className="flex flex-col gap-1.5">
      {toolParts.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {toolParts.map((p, i) => <ToolChip key={p.toolCallId ?? i} part={p} />)}
        </div>
      )}
      {textParts.map((p, i) => (
        <div key={i}>
          <ReactMarkdown components={mdComponents}>{p.text!}</ReactMarkdown>
        </div>
      ))}
      {textParts.length === 0 && typeof msg.content === "string" && msg.content.trim() && (
        <ReactMarkdown components={mdComponents}>{msg.content}</ReactMarkdown>
      )}
    </div>
  );
}

export function CanvasBottomLeft() {
  const dispatch = useAppDispatch();
  const logVisible = useAppSelector((s) => s.ui.agentLogVisible);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const loadedRef = useRef(false);

  // Load conversation history
  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;
    fetch("/api/chat/sessions")
      .then((r) => r.json())
      .then((data: { messages?: ChatMessage[] }) => {
        if (data?.messages?.length) setMessages(data.messages);
      })
      .catch(() => {});
  }, [loaded]);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current && logVisible) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length, logVisible]);

  const visibleMessages = messages.filter((m) => m.role !== "system");

  return (
    <div className="absolute bottom-4 left-4 z-10 flex flex-col items-start gap-2">
      {/* Log panel */}
      {logVisible && (
        <div className="w-[260px] max-h-[560px] flex flex-col rounded-xl border border-white/[0.12] bg-[#0e0e10]/90 backdrop-blur-xl shadow-[0_4px_24px_rgba(0,0,0,0.4)] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-white/[0.08] flex-shrink-0">
            <span className="text-[10px] font-mono font-medium uppercase tracking-wider text-white/35">Activity</span>
            <button
              type="button"
              onClick={() => dispatch(toggleAgentLogVisible())}
              className="size-5 flex items-center justify-center rounded text-white/25 hover:text-white/50 transition-colors"
            >
              <X className="size-3" />
            </button>
          </div>

          {/* Messages */}
          {visibleMessages.length === 0 ? (
            <div className="flex items-center justify-center py-10 px-4">
              <p className="text-[11px] text-white/20 text-center">No activity yet</p>
            </div>
          ) : (
            <div className="flex-1 min-h-0 relative">
              <div className="pointer-events-none absolute top-0 left-0 right-0 h-4 bg-gradient-to-b from-[#0e0e10] to-transparent z-10" />

              <div ref={scrollRef} className="h-full max-h-[500px] overflow-y-auto scrollbar-hide">
                <div className="flex flex-col gap-2 px-3 py-3">
                  {visibleMessages.map((msg) => (
                    <Fragment key={msg.id}>
                      {msg.role === "user" ? (
                        <div className="flex justify-end">
                          <div className="rounded-lg px-2.5 py-1.5 bg-white/[0.06] max-w-[90%]">
                            <p className="text-[11px] text-white/60">{getUserText(msg)}</p>
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
                  ))}
                </div>
              </div>

              <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-[#0e0e10] to-transparent z-10" />
            </div>
          )}
        </div>
      )}

      {/* Agent Log button */}
      <button
        type="button"
        onClick={() => dispatch(toggleAgentLogVisible())}
        className={`flex items-center gap-2 rounded-xl border backdrop-blur-sm px-4 py-2.5 text-xs font-medium transition-colors ${
          logVisible
            ? "border-white/[0.2] bg-white/[0.1] text-white/70"
            : "border-white/[0.15] bg-[#111113]/80 text-white/40 hover:text-white/70 hover:border-white/[0.25]"
        }`}
        title="Toggle Agent Log"
      >
        <MessageSquareText className="size-4" />
        Agent Log
        {visibleMessages.length > 0 && !logVisible && (
          <span className="text-[10px] font-mono text-white/30 bg-white/[0.06] rounded-full px-1.5 py-0.5 min-w-[20px] text-center">{visibleMessages.length}</span>
        )}
      </button>
    </div>
  );
}
