"use client";

import { useEffect, useState } from "react";
import { ArrowUp, X } from "lucide-react";
import { StyleGuideIcon } from "@/lib/svg-icons";
import { useCanvasChat, type QueuedPrompt } from "@/hooks/useCanvasChat";
import { subscribeCreditExhausted, type CreditExhaustedReason } from "@/lib/chat-bridge";
import { PricingDialog } from "@/components/PricingDialog";
import { ChatPanel } from "./ChatPanel";
import { StyleGuidePanel } from "./StyleGuidePanel";

function QueuedPromptChip({
  prompt,
  onForceExecute,
  onRemove,
}: {
  prompt: QueuedPrompt;
  onForceExecute: (id: string) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <div className="group flex items-center gap-2 rounded-t-xl border border-b-0 border-b-secondary bg-surface-elevated/95 px-4 py-2.5 backdrop-blur-xl transition-all hover:bg-surface-elevated">
      <div className="flex size-4 shrink-0 items-center justify-center rounded-full bg-amber-500/15">
        <div className="size-1.5 rounded-full bg-amber-500 animate-pulse" />
      </div>
      <p className="flex-1 truncate text-[13px] text-t-secondary">
        {prompt.text}
      </p>
      <button
        type="button"
        onClick={() => onRemove(prompt.id)}
        className="shrink-0 rounded-md p-1 text-t-tertiary opacity-0 transition-all hover:bg-input-bg hover:text-t-primary group-hover:opacity-100"
        title="Remove from queue"
      >
        <X className="size-3.5" />
      </button>
      <button
        type="button"
        onClick={() => onForceExecute(prompt.id)}
        className="shrink-0 rounded-md p-1 text-t-tertiary opacity-0 transition-all hover:bg-input-bg hover:text-t-primary group-hover:opacity-100"
        title="Stop current and send this now"
      >
        <ArrowUp className="size-3.5" />
      </button>
    </div>
  );
}

export function EditingModeDisplay() {
  const [styleGuideOpen, setStyleGuideOpen] = useState(false);
  const [pricingDialogOpen, setPricingDialogOpen] = useState(false);
  const [pricingDialogReason, setPricingDialogReason] = useState<CreditExhaustedReason>("insufficient_credits");

  const {
    inputValue,
    setInputValue,
    inputRef,
    isAgentWorking,
    promptQueue,
    submitPromptOrAddToQueue,
    forceExecuteQueuedPrompt,
    removePromptFromQueue,
    stopCurrentGeneration,
    handleTextareaKeyDown,
    handleTextareaAutoResize,
  } = useCanvasChat();

  useEffect(() => {
    return subscribeCreditExhausted((reason) => {
      setPricingDialogReason(reason);
      setPricingDialogOpen(true);
    });
  }, []);

  return (
    <>
      <ChatPanel isVisible={false} onClose={() => {}} />

      <div className="absolute bottom-4 left-1/2 z-20 -translate-x-1/2 w-full max-w-[600px] px-4">
        {promptQueue.length > 0 && (
          <div className="flex flex-col gap-0">
            {promptQueue.map((queuedPrompt, index) => (
              <div
                key={queuedPrompt.id}
                className="relative"
                style={{
                  height: 24,
                  zIndex: promptQueue.length - index,
                }}
              >
                <div className="absolute bottom-0 left-0 right-0">
                  <QueuedPromptChip
                    prompt={queuedPrompt}
                    onForceExecute={forceExecuteQueuedPrompt}
                    onRemove={removePromptFromQueue}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="rounded-2xl border border-b-strong bg-canvas-panel-bg shadow-lg backdrop-blur-xl transition-all focus-within:border-b-strong">
          <div className="px-4 pt-4 pb-2">
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={(event) => setInputValue(event.target.value)}
              onKeyDown={handleTextareaKeyDown}
              placeholder={
                isAgentWorking
                  ? "Type to queue next prompt..."
                  : "Describe what to design..."
              }
              rows={2}
              className="w-full bg-transparent text-[15px] text-t-primary placeholder-t-tertiary outline-none resize-none leading-relaxed max-h-[140px] min-h-[52px]"
              onInput={handleTextareaAutoResize}
            />
          </div>

          <div className="flex items-center justify-between px-4 py-2.5">
            <div className="flex items-center gap-2">
              {isAgentWorking && promptQueue.length > 0 && (
                <span className="text-[11px] font-mono text-amber-500">
                  {promptQueue.length} queued
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {isAgentWorking ? (
                <button
                  type="button"
                  onClick={stopCurrentGeneration}
                  className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-red-500/15 px-3 text-xs font-medium text-red-500 transition-all hover:bg-red-500/25 active:scale-95"
                >
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <rect x="4" y="4" width="16" height="16" rx="2" />
                  </svg>
                  Stop
                </button>
              ) : (
                <button
                  type="button"
                  onClick={submitPromptOrAddToQueue}
                  disabled={!inputValue.trim()}
                  className="inline-flex size-8 items-center justify-center rounded-lg bg-btn-primary-bg text-btn-primary-text transition-all hover:opacity-90 disabled:opacity-20 disabled:pointer-events-none active:scale-95"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="absolute right-4 top-16 z-20 flex flex-col items-center gap-2">
        <div className="flex flex-col items-center gap-1 rounded-full border border-b-strong bg-canvas-panel-bg shadow-md backdrop-blur-xl p-1">
          <button
            type="button"
            onClick={() => setStyleGuideOpen((v) => !v)}
            className={`rounded-full p-2 transition-colors ${
              styleGuideOpen
                ? "bg-btn-primary-bg text-btn-primary-text"
                : "text-t-secondary hover:bg-input-bg hover:text-t-primary"
            }`}
            title="Style Guide"
          >
            <StyleGuideIcon color="currentColor" width={18} height={18} />
          </button>
        </div>
        <StyleGuidePanel
          open={styleGuideOpen}
          onClose={() => setStyleGuideOpen(false)}
        />
      </div>

      <PricingDialog
        open={pricingDialogOpen}
        onClose={() => setPricingDialogOpen(false)}
        reason={pricingDialogReason}
      />
    </>
  );
}
