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
}

export function unregisterChatSend() {
  _sendFn = null;
}

export function sendChatMessage(text: string) {
  if (_sendFn) {
    _sendFn(text);
  }
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
