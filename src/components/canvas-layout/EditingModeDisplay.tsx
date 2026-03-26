"use client";

import { type ReactNode, useEffect, useState } from "react";
import { ArrowUp, X } from "lucide-react";
import { ImageIcon, StyleGuideIcon, FrameIcon } from "@/lib/svg-icons";
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
    <div className="group flex items-center gap-2 rounded-t-xl border border-b-0 border-b-secondary bg-surface-elevated/95 px-3 py-1.5 backdrop-blur-xl transition-all hover:bg-surface-elevated">
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

function ToolbarChip({
  label,
  onRemove,
  icon,
}: {
  label: string;
  onRemove?: () => void;
  icon?: ReactNode;
}) {
  return (
    <div className="group inline-flex h-8 max-w-[210px] items-center gap-1.5 rounded-full border border-b-secondary bg-input-bg px-3 text-[13px] text-t-secondary">
      {icon ? <span className="shrink-0">{icon}</span> : null}
      <span className="truncate">{label}</span>
      {onRemove ? (
        <button
          type="button"
          onClick={onRemove}
          className="shrink-0 rounded-full p-0.5 text-t-tertiary transition-colors group-hover:text-t-secondary hover:bg-surface-sunken"
          aria-label={`Remove ${label}`}
        >
          <X className="size-3.5" />
        </button>
      ) : null}
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
    attachedFrames,
    selectedElement,
    hasUploadingImages,
    handleAttachImage,
    handleFileChange,
    handlePaste,
    removeAttachedImage,
    removeAttachedFrame,
    clearSelectedElement,
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
      <div className="absolute bottom-4 left-1/2 z-20 w-full max-w-[660px] -translate-x-1/2 px-4">
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

        <div className="relative z-10 rounded-[28px] border border-b-secondary bg-canvas-panel-bg shadow-md backdrop-blur-xl transition-all focus-within:border-b-strong">
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleFileChange}
          />

          {(attachedFrames.length > 0 ||
            selectedElement ||
            attachedImages.length > 0) && (
            <div className="flex gap-2 overflow-x-auto px-5 pb-0 pt-3">
              {attachedFrames.map((frame) => (
                <ToolbarChip
                  key={frame.id}
                  label={frame.label || "Untitled Screen"}
                  onRemove={() => removeAttachedFrame(frame.id)}
                  icon={<FrameIcon color="currentColor" className="size-3.5" />}
                />
              ))}
              {selectedElement ? (
                <ToolbarChip
                  label={
                    selectedElement.text
                      ? selectedElement.text.slice(0, 32)
                      : `<${selectedElement.tagName}>`
                  }
                  onRemove={clearSelectedElement}
                />
              ) : null}
              {attachedImages.map((img) => (
                <ToolbarChip
                  key={img.id}
                  label={img.name || "Image"}
                  onRemove={() => removeAttachedImage(img.id)}
                  icon={<ImageIcon className="size-3.5" />}
                />
              ))}
            </div>
          )}

          <div className="px-5 pb-2 pt-3">
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={(event) => setInputValue(event.target.value)}
              onKeyDown={handleTextareaKeyDown}
              onPaste={handlePaste}
              placeholder={
                isAgentWorking
                  ? "Type to queue next prompt..."
                  : selectedElement
                    ? `Edit <${selectedElement.tagName}> element...`
                    : attachedFrames.length > 0
                      ? `Edit ${attachedFrames.length === 1 ? `"${attachedFrames[0].label || "screen"}"` : `${attachedFrames.length} screens`}...`
                      : "What would you like to change or create?"
              }
              rows={1}
              className="max-h-[140px] min-h-[48px] w-full resize-none bg-transparent py-2 text-[16px] leading-relaxed text-t-primary placeholder:text-t-tertiary outline-none"
              onInput={handleTextareaAutoResize}
            />
          </div>

          <div className="flex items-center justify-between px-5 py-2.5">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                aria-label="Attach image"
                onClick={handleAttachImage}
                className="inline-flex size-8 shrink-0 items-center justify-center rounded-md text-t-secondary transition-colors hover:bg-input-bg hover:text-t-primary"
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
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <rect x="6" y="6" width="12" height="12" rx="2" />
                  </svg>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={submitPromptOrAddToQueue}
                  disabled={
                    (!inputValue.trim() && attachedImages.length === 0) ||
                    hasUploadingImages
                  }
                  className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-btn-primary-bg text-btn-primary-text shadow-sm outline-none transition-all hover:opacity-90 disabled:pointer-events-none disabled:opacity-30 focus-visible:ring-2 focus-visible:ring-ring/50 active:scale-95"
                >
                  <ArrowUp className="size-4" />
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
