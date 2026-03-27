"use client";

import { type ReactNode, useEffect, useState } from "react";
import {
  ArrowUp,
  ListOrdered,
  MessageSquare,
  StickyNote,
  X,
} from "lucide-react";
import { ImageIcon, StyleGuideIcon, FrameIcon } from "@/lib/svg-icons";
import { useCanvasChat, type QueuedPrompt } from "@/hooks/useCanvasChat";
import {
  subscribeCreditExhausted,
  type CreditExhaustedReason,
} from "@/lib/chat-bridge";
import { PricingDialog } from "@/components/PricingDialog";
import { ChatEngine } from "./ChatEngine";
import { StyleGuidePanel } from "./StyleGuidePanel";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setCanvasToolMode, type CanvasToolMode } from "@/store/slices/uiSlice";

function queuePreviewText(text: string): string {
  const t = text.trim();
  const sep = t.indexOf("]\n\n");
  if (sep !== -1 && t.startsWith("[")) {
    const after = t.slice(sep + 3).trim();
    if (after) return after;
  }
  return t;
}

function QueuedPromptChip({
  prompt,
  position,
  onForceExecute,
  onRemove,
}: {
  prompt: QueuedPrompt;
  position: number;
  onForceExecute: (id: string) => void;
  onRemove: (id: string) => void;
}) {
  const preview = queuePreviewText(prompt.text);
  return (
    <div className="group flex w-full items-start gap-2.5 rounded-xl border border-b-secondary bg-input-bg/90 px-3 py-2.5 transition-colors hover:bg-input-bg">
      <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-amber-500/12 text-[12px] font-semibold tabular-nums text-amber-700 dark:text-amber-400">
        {position}
      </div>
      <p
        className="min-w-0 flex-1 line-clamp-3 text-[13px] leading-snug text-t-secondary"
        title={preview}
      >
        {preview}
      </p>
      <div className="flex shrink-0 items-center gap-0.5 pt-0.5">
        <button
          type="button"
          onClick={() => onRemove(prompt.id)}
          className="rounded-lg p-1.5 text-t-tertiary transition-colors hover:bg-input-bg hover:text-t-primary"
          title="Remove from queue"
          aria-label="Remove from queue"
        >
          <X className="size-3.5" />
        </button>
        <button
          type="button"
          onClick={() => onForceExecute(prompt.id)}
          className="rounded-lg p-1.5 text-t-tertiary transition-colors hover:bg-input-bg hover:text-t-primary"
          title="Stop current and send this now"
          aria-label="Stop current and send this now"
        >
          <ArrowUp className="size-3.5" />
        </button>
      </div>
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
  const dispatch = useAppDispatch();
  const canvasToolMode = useAppSelector((s) => s.ui.canvasToolMode);

  const toggleNoteMode = () => {
    dispatch(setCanvasToolMode(canvasToolMode === "note" ? "select" : "note"));
  };

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
        <div className="relative pt-3">
          {/* Stacked card layers — same pattern as dashboard prompt box */}
          <div
            className="pointer-events-none absolute inset-x-4 top-0 bottom-3 rounded-2xl border border-b-secondary/30 bg-canvas-panel-bg/45 shadow-sm"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-x-2 top-1.5 bottom-1.5 flex flex-col items-center rounded-2xl border border-b-secondary/50 bg-canvas-panel-bg/65 pt-2 shadow-sm"
            role="region"
            aria-label="Canvas chat"
          >
            <div className="flex max-w-[min(100%,280px)] items-center justify-center gap-2 px-3 text-center">
              <MessageSquare
                className="size-3.5 shrink-0 text-t-tertiary"
                aria-hidden
              />
              <span className="text-[11px] font-semibold uppercase tracking-wide text-t-secondary">
                Canvas chat
              </span>
              <span className="hidden text-[11px] text-t-tertiary sm:inline">
                · Edits & screens
              </span>
            </div>
          </div>
          <div className="relative overflow-hidden rounded-2xl border border-b-secondary bg-canvas-panel-bg shadow-lg backdrop-blur-xl transition-all focus-within:border-b-strong">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleFileChange}
            />

            {promptQueue.length > 0 && (
              <div className="border-b border-b-secondary px-5 pt-4 pb-3">
                <div className="flex max-h-[min(40vh,220px)] flex-col gap-2 overflow-y-auto overscroll-contain [scrollbar-gutter:stable]">
                  <div className="flex shrink-0 items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-t-tertiary">
                    <ListOrdered className="size-3.5 shrink-0" aria-hidden />
                    <span>Queued prompts</span>
                    <span className="tabular-nums text-amber-600/90 dark:text-amber-400/90">
                      ({promptQueue.length})
                    </span>
                  </div>
                  {promptQueue.map((queuedPrompt, index) => (
                    <QueuedPromptChip
                      key={queuedPrompt.id}
                      prompt={queuedPrompt}
                      position={index + 1}
                      onForceExecute={forceExecuteQueuedPrompt}
                      onRemove={removePromptFromQueue}
                    />
                  ))}
                </div>
              </div>
            )}

            {(attachedFrames.length > 0 ||
              selectedElement ||
              attachedImages.length > 0) && (
              <div className="flex gap-2 overflow-x-auto px-5 pb-0 pt-3">
                {attachedFrames.map((frame) => (
                  <ToolbarChip
                    key={frame.id}
                    label={frame.label || "Untitled Screen"}
                    onRemove={() => removeAttachedFrame(frame.id)}
                    icon={
                      <FrameIcon color="currentColor" className="size-3.5" />
                    }
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
                <button
                  type="button"
                  aria-label="Add note"
                  title="Add sticky note (N)"
                  onClick={toggleNoteMode}
                  className={`inline-flex size-8 shrink-0 items-center justify-center rounded-md transition-colors ${
                    canvasToolMode === "note"
                      ? "bg-btn-primary-bg text-btn-primary-text"
                      : "text-t-secondary hover:bg-input-bg hover:text-t-primary"
                  }`}
                >
                  <StickyNote className="size-4" />
                </button>
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
