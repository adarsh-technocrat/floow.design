"use client";

import { useEffect, useState } from "react";
import { ArrowUp, X } from "lucide-react";
import { ImageIcon } from "@/lib/svg-icons";
import { StyleGuideIcon } from "@/lib/svg-icons";
import { useCanvasChat, type QueuedPrompt } from "@/hooks/useCanvasChat";
import {
  subscribeCreditExhausted,
  type CreditExhaustedReason,
} from "@/lib/chat-bridge";
import { PricingDialog } from "@/components/PricingDialog";
import { ChatEngine } from "./ChatEngine";
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
  const [pricingDialogReason, setPricingDialogReason] =
    useState<CreditExhaustedReason>("insufficient_credits");

  const {
    inputValue,
    setInputValue,
    inputRef,
    fileInputRef,
    attachedImages,
    handleAttachImage,
    handleFileChange,
    handlePaste,
    removeAttachedImage,
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
      <ChatEngine />
      <div className="absolute bottom-4 left-1/2 z-20 -translate-x-1/2 w-full max-w-[600px] px-4">
        {promptQueue.length > 0 && (
          <div className="flex flex-col gap-0 -mb-3">
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

        <div className="relative z-10 rounded-2xl border border-b-strong bg-canvas-panel-bg shadow-lg backdrop-blur-xl transition-all focus-within:border-b-strong">
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleFileChange}
          />

          {/* Image previews */}
          {attachedImages.length > 0 && (
            <div className="flex gap-2 px-4 pt-3 pb-0 overflow-x-auto">
              {attachedImages.map((img) => (
                <div key={img.id} className="relative shrink-0 group">
                  <img
                    src={img.dataUrl}
                    alt={img.name}
                    className="size-16 rounded-lg object-cover border border-b-secondary"
                  />
                  <button
                    type="button"
                    onClick={() => removeAttachedImage(img.id)}
                    className="absolute -top-1.5 -right-1.5 flex size-5 items-center justify-center rounded-full bg-surface-elevated border border-b-secondary text-t-tertiary shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:text-t-primary"
                  >
                    <X className="size-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="px-4 pt-4 pb-2">
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={(event) => setInputValue(event.target.value)}
              onKeyDown={handleTextareaKeyDown}
              onPaste={handlePaste}
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
              <button
                type="button"
                aria-label="Attach image"
                onClick={handleAttachImage}
                className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-t-tertiary transition-colors hover:text-t-secondary hover:bg-secondary/40"
              >
                <ImageIcon className="size-4" />
              </button>
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
                  className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-red-500/10 text-red-500 outline-none transition-all hover:bg-red-500/20 active:scale-95"
                  aria-label="Stop generating"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                    <rect x="6" y="6" width="12" height="12" rx="2" />
                  </svg>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={submitPromptOrAddToQueue}
                  disabled={!inputValue.trim() && attachedImages.length === 0}
                  className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-btn-primary-bg text-btn-primary-text shadow-sm outline-none transition-all hover:opacity-90 disabled:pointer-events-none disabled:opacity-30 focus-visible:ring-2 focus-visible:ring-ring/50 active:scale-95"
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
