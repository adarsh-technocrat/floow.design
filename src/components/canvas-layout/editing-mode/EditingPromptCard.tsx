"use client";

import {
  type ChangeEvent,
  type ClipboardEvent,
  type FormEvent,
  type KeyboardEvent,
  type RefObject,
} from "react";
import { ArrowUp, StickyNote } from "lucide-react";
import { ImageIcon, FrameIcon } from "@/lib/svg-icons";
import type { CanvasToolMode } from "@/store/slices/uiSlice";
import type { AttachedFrame, AttachedImage } from "@/hooks/useCanvasChat";
import type { SelectedElementContext } from "@/lib/chat-bridge";
import { ToolbarChip } from "./ToolbarChip";

function StopGenerationIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <rect x="6" y="6" width="12" height="12" rx="2" />
    </svg>
  );
}

export interface EditingPromptCardProps {
  hasQueue: boolean;
  fileInputRef: RefObject<HTMLInputElement | null>;
  handleFileChange: (e: ChangeEvent<HTMLInputElement>) => void;
  attachedFrames: AttachedFrame[];
  removeAttachedFrame: (id: string) => void;
  selectedElement: SelectedElementContext | null;
  clearSelectedElement: () => void;
  attachedImages: AttachedImage[];
  removeAttachedImage: (id: string) => void;
  inputRef: RefObject<HTMLTextAreaElement | null>;
  inputValue: string;
  setInputValue: (v: string) => void;
  placeholder: string;
  handleTextareaKeyDown: (e: KeyboardEvent<HTMLTextAreaElement>) => void;
  handlePaste: (e: ClipboardEvent<HTMLTextAreaElement>) => void;
  handleTextareaAutoResize: (e: FormEvent<HTMLTextAreaElement>) => void;
  handleAttachImage: () => void;
  canvasToolMode: CanvasToolMode;
  toggleNoteMode: () => void;
  isAgentWorking: boolean;
  stopCurrentGeneration: () => void;
  submitPromptOrAddToQueue: () => void;
  hasUploadingImages: boolean;
  canSubmit: boolean;
}

export function EditingPromptCard(props: EditingPromptCardProps) {
  const {
    hasQueue,
    fileInputRef,
    handleFileChange,
    attachedFrames,
    removeAttachedFrame,
    selectedElement,
    clearSelectedElement,
    attachedImages,
    removeAttachedImage,
    inputRef,
    inputValue,
    setInputValue,
    placeholder,
    handleTextareaKeyDown,
    handlePaste,
    handleTextareaAutoResize,
    handleAttachImage,
    canvasToolMode,
    toggleNoteMode,
    isAgentWorking,
    stopCurrentGeneration,
    submitPromptOrAddToQueue,
    hasUploadingImages,
    canSubmit,
  } = props;

  const showAttachments =
    attachedFrames.length > 0 || !!selectedElement || attachedImages.length > 0;

  return (
    <div
      className={`relative z-1 overflow-hidden rounded-2xl border border-b-secondary bg-canvas-panel-bg shadow-lg backdrop-blur-xl transition-all focus-within:border-b-strong ${
        hasQueue ? "mt-1.5" : ""
      }`}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />

      {showAttachments && (
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
          placeholder={placeholder}
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
              <StopGenerationIcon />
            </button>
          ) : (
            <button
              type="button"
              onClick={submitPromptOrAddToQueue}
              disabled={!canSubmit || hasUploadingImages}
              className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-btn-primary-bg text-btn-primary-text shadow-sm outline-none transition-all hover:opacity-90 disabled:pointer-events-none disabled:opacity-30 focus-visible:ring-2 focus-visible:ring-ring/50 active:scale-95"
            >
              <ArrowUp className="size-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
