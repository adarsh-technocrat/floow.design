// Bridge between the bottom input box and the ChatPanel's useChat hook.
// ChatPanel registers its sendMessage, EditingModeDisplay calls it.
// Activity (CanvasBottomLeft) subscribes to live message snapshots from useChat.

let _sendFn: ((text: string) => void) | null = null;

export type ChatMessagesSnapshotListener = (messages: unknown[]) => void;

const _messageListeners = new Set<ChatMessagesSnapshotListener>();

let _lastMessagesSnapshot: unknown[] | undefined;
let _hasEmittedMessagesSnapshot = false;

export type ActivityHistoryLoadingListener = (loading: boolean) => void;

const _historyLoadingListeners = new Set<ActivityHistoryLoadingListener>();

/** Last emitted value so new subscribers (e.g. after Strict Mode remount) don't miss `false` and stay on shimmer forever. */
let _lastActivityHistoryLoading: boolean | undefined;

export function registerChatSend(fn: (text: string) => void) {
  _sendFn = fn;
  // #region agent log
  fetch("http://127.0.0.1:7253/ingest/bf26e32e-b221-45cd-9795-984cd7651c6f", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      runId: "pre-fix",
      hypothesisId: "H7",
      location: "chat-bridge.ts:registerChatSend",
      message: "chat send bridge registered",
      data: {},
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion
}

export function unregisterChatSend() {
  _sendFn = null;
  // #region agent log
  fetch("http://127.0.0.1:7253/ingest/bf26e32e-b221-45cd-9795-984cd7651c6f", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      runId: "pre-fix",
      hypothesisId: "H7",
      location: "chat-bridge.ts:unregisterChatSend",
      message: "chat send bridge unregistered",
      data: {},
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion
}

export function sendChatMessage(text: string) {
  // #region agent log
  fetch("http://127.0.0.1:7253/ingest/bf26e32e-b221-45cd-9795-984cd7651c6f", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      runId: "pre-fix",
      hypothesisId: "H7",
      location: "chat-bridge.ts:sendChatMessage",
      message: "canvas requested chat send",
      data: {
        hasBridge: Boolean(_sendFn),
        textLength: text.trim().length,
      },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion
  if (_sendFn) {
    _sendFn(text);
  }
}

/** Returns true if a chat send function is registered (ChatPanel is mounted) */
export function isChatBridgeReady(): boolean {
  return _sendFn !== null;
}

// Stop function bridge
let _stopFn: (() => void) | null = null;

export function registerChatStop(fn: () => void) {
  _stopFn = fn;
}

export function unregisterChatStop() {
  _stopFn = null;
}

export function stopChatGeneration() {
  if (_stopFn) _stopFn();
}

// Chat status bridge — lets Activity panel know if the agent is working
type ChatStatus = "ready" | "submitted" | "streaming" | "error";
type ChatStatusListener = (status: ChatStatus) => void;
const _statusListeners = new Set<ChatStatusListener>();
let _lastStatus: ChatStatus = "ready";

export function emitChatStatus(status: ChatStatus): void {
  _lastStatus = status;
  for (const l of _statusListeners) l(status);
}

export function subscribeChatStatus(listener: ChatStatusListener): () => void {
  _statusListeners.add(listener);
  listener(_lastStatus);
  return () => {
    _statusListeners.delete(listener);
  };
}

// Generating frames bridge — tracks which frame IDs are currently being generated
type GeneratingFramesListener = (ids: Set<string>) => void;
const _generatingListeners = new Set<GeneratingFramesListener>();
let _generatingFrameIds = new Set<string>();

export function addGeneratingFrame(id: string): void {
  _generatingFrameIds = new Set([..._generatingFrameIds, id]);
  for (const l of _generatingListeners) l(_generatingFrameIds);
}

export function removeGeneratingFrame(id: string): void {
  _generatingFrameIds = new Set(
    [..._generatingFrameIds].filter((x) => x !== id),
  );
  for (const l of _generatingListeners) l(_generatingFrameIds);
}

export function clearGeneratingFrames(): void {
  _generatingFrameIds = new Set();
  for (const l of _generatingListeners) l(_generatingFrameIds);
}

export function subscribeGeneratingFrames(
  listener: GeneratingFramesListener,
): () => void {
  _generatingListeners.add(listener);
  listener(_generatingFrameIds);
  return () => {
    _generatingListeners.delete(listener);
  };
}

export function subscribeChatMessages(
  listener: ChatMessagesSnapshotListener,
): () => void {
  _messageListeners.add(listener);
  if (_hasEmittedMessagesSnapshot && _lastMessagesSnapshot !== undefined) {
    listener(_lastMessagesSnapshot);
  }
  return () => {
    _messageListeners.delete(listener);
  };
}

/** Push the current useChat messages to Activity and any other subscribers. */
export function emitChatMessagesSnapshot(messages: unknown[]): void {
  _lastMessagesSnapshot = messages;
  _hasEmittedMessagesSnapshot = true;
  for (const l of _messageListeners) {
    l(messages);
  }
}

export function subscribeActivityHistoryLoading(
  listener: ActivityHistoryLoadingListener,
): () => void {
  _historyLoadingListeners.add(listener);
  if (_lastActivityHistoryLoading !== undefined) {
    listener(_lastActivityHistoryLoading);
  }
  return () => {
    _historyLoadingListeners.delete(listener);
  };
}

export function emitActivityHistoryLoading(loading: boolean): void {
  _lastActivityHistoryLoading = loading;
  for (const l of _historyLoadingListeners) {
    l(loading);
  }
}

export type CreditExhaustedReason = "no_plan" | "insufficient_credits";
type CreditExhaustedListener = (reason: CreditExhaustedReason) => void;
const _creditExhaustedListeners = new Set<CreditExhaustedListener>();

export function emitCreditExhausted(reason: CreditExhaustedReason): void {
  for (const l of _creditExhaustedListeners) l(reason);
}

export function subscribeCreditExhausted(listener: CreditExhaustedListener): () => void {
  _creditExhaustedListeners.add(listener);
  return () => { _creditExhaustedListeners.delete(listener); };
}
