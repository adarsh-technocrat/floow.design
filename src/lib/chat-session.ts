import type { UIMessage } from "ai";

/** When no single frame is selected, chat is scoped to the whole canvas. */
export const CANVAS_CHAT_FRAME_ID = "__project__";

export type ChatSessionMessageRecord = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
  isStreaming?: boolean;
  isComplete?: boolean;
  attachments?: unknown[];
  liked?: boolean;
  disliked?: boolean;
  isCancelled?: boolean;
  parts?: unknown[];
};

export function isUiMessageShape(m: unknown): m is UIMessage {
  return (
    typeof m === "object" &&
    m !== null &&
    typeof (m as UIMessage).id === "string" &&
    typeof (m as UIMessage).role === "string" &&
    Array.isArray((m as UIMessage).parts)
  );
}

function textFromUiParts(parts: UIMessage["parts"]): string {
  const chunks: string[] = [];
  for (const p of parts) {
    if (!p || typeof p !== "object") continue;
    const pt = p as { type?: string; text?: string };
    if (
      (pt.type === "text" || pt.type === "reasoning") &&
      typeof pt.text === "string" &&
      pt.text.length > 0
    ) {
      chunks.push(pt.text);
    }
  }
  return chunks.join("\n\n");
}

export function uiMessageToRecord(m: UIMessage): ChatSessionMessageRecord {
  return {
    id: m.id,
    role: m.role,
    content: textFromUiParts(m.parts),
    timestamp: new Date().toISOString(),
    isStreaming: false,
    isComplete: true,
    attachments: [],
    parts: m.parts as unknown[],
  };
}

export function normalizeIncomingMessages(
  raw: unknown[],
): ChatSessionMessageRecord[] {
  const out: ChatSessionMessageRecord[] = [];
  for (const m of raw) {
    if (isUiMessageShape(m)) {
      out.push(uiMessageToRecord(m));
      continue;
    }
    if (m && typeof m === "object" && "id" in m && "role" in m) {
      const o = m as Record<string, unknown>;
      const role = o.role;
      if (role !== "user" && role !== "assistant" && role !== "system")
        continue;
      const parts = o.parts;
      let content = typeof o.content === "string" ? o.content : "";
      if (
        !content &&
        Array.isArray(parts) &&
        parts.length > 0 &&
        isUiMessageShape({ id: String(o.id), role, parts } as UIMessage)
      ) {
        content = textFromUiParts(parts as UIMessage["parts"]);
      }
      out.push({
        id: String(o.id),
        role,
        content,
        timestamp:
          typeof o.timestamp === "string"
            ? o.timestamp
            : new Date().toISOString(),
        isStreaming: Boolean(o.isStreaming),
        isComplete: o.isComplete !== false,
        attachments: Array.isArray(o.attachments) ? o.attachments : [],
        liked: Boolean(o.liked),
        disliked: Boolean(o.disliked),
        isCancelled: Boolean(o.isCancelled),
        parts: Array.isArray(parts) ? parts : undefined,
      });
    }
  }
  // #region agent log
  fetch("http://127.0.0.1:7253/ingest/bf26e32e-b221-45cd-9795-984cd7651c6f", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      runId: "pre-fix",
      hypothesisId: "H2",
      location: "chat-session.ts:normalizeIncomingMessages",
      message: "normalized incoming messages for persistence",
      data: {
        rawCount: raw.length,
        normalizedCount: out.length,
        withPartsCount: out.filter(
          (m) => Array.isArray(m.parts) && m.parts.length > 0,
        ).length,
        assistantCount: out.filter((m) => m.role === "assistant").length,
      },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion
  return out;
}

export function recordsToUiMessages(
  records: ChatSessionMessageRecord[],
): UIMessage[] {
  const messages = records.map((r) => {
    if (r.parts && Array.isArray(r.parts) && r.parts.length > 0) {
      return {
        id: r.id,
        role: r.role,
        parts: r.parts as UIMessage["parts"],
      };
    }
    return {
      id: r.id,
      role: r.role,
      parts: [{ type: "text", text: r.content || "" }] as UIMessage["parts"],
    };
  });
  // #region agent log
  fetch("http://127.0.0.1:7253/ingest/bf26e32e-b221-45cd-9795-984cd7651c6f", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      runId: "pre-fix",
      hypothesisId: "H3",
      location: "chat-session.ts:recordsToUiMessages",
      message: "converted records to ui messages",
      data: {
        recordCount: records.length,
        withPartsCount: records.filter(
          (r) => Array.isArray(r.parts) && r.parts.length > 0,
        ).length,
        fallbackContentCount: records.filter(
          (r) => !(Array.isArray(r.parts) && r.parts.length > 0),
        ).length,
        assistantCount: records.filter((r) => r.role === "assistant").length,
      },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion
  return messages;
}
