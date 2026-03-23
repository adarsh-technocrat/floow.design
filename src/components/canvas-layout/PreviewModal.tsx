"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useAppSelector } from "@/store/hooks";
import { FRAME_WIDTH, FRAME_HEIGHT } from "@/lib/canvas-utils";

interface PreviewModalProps {
  open: boolean;
  onClose: () => void;
  initialFrameId?: string;
}

export function PreviewModal({ open, onClose, initialFrameId }: PreviewModalProps) {
  const frames = useAppSelector((s) => s.canvas.frames);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Set initial frame when opened
  useEffect(() => {
    if (!open) return;
    if (initialFrameId) {
      const idx = frames.findIndex((f) => f.id === initialFrameId);
      setCurrentIndex(idx >= 0 ? idx : 0);
    } else {
      setCurrentIndex(0);
    }
  }, [open, initialFrameId, frames]);

  const goNext = useCallback(() => {
    setCurrentIndex((i) => (i < frames.length - 1 ? i + 1 : i));
  }, [frames.length]);

  const goPrev = useCallback(() => {
    setCurrentIndex((i) => (i > 0 ? i - 1 : i));
  }, []);

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight" || e.key === "ArrowDown") goNext();
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") goPrev();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose, goNext, goPrev]);

  if (!open || frames.length === 0) return null;

  const currentFrame = frames[currentIndex];
  if (!currentFrame) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop with dotted canvas bg */}
      <div
        className="absolute inset-0 bg-canvas-bg/95 backdrop-blur-sm"
        style={{
          backgroundImage: "radial-gradient(circle, var(--canvas-dot) 1px, transparent 1px)",
          backgroundSize: "20px 20px",
        }}
        onClick={onClose}
      />

      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-10 flex h-14 items-center justify-between px-5">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-t-primary">
            Preview
          </span>
          <span className="rounded-md border border-b-secondary bg-surface-elevated/80 px-2.5 py-1 text-[11px] font-mono text-t-secondary">
            {currentIndex + 1} / {frames.length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[12px] font-medium text-t-secondary truncate max-w-[200px]">
            {currentFrame.label}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex size-8 items-center justify-center rounded-lg border border-b-secondary bg-surface-elevated/80 text-t-secondary transition-colors hover:bg-input-bg hover:text-t-primary"
          >
            <X className="size-4" />
          </button>
        </div>
      </div>

      {/* Left arrow */}
      <button
        type="button"
        onClick={goPrev}
        disabled={currentIndex === 0}
        className="absolute left-5 z-10 inline-flex size-10 items-center justify-center rounded-full border border-b-secondary bg-surface-elevated/80 text-t-secondary transition-all hover:bg-input-bg hover:text-t-primary disabled:opacity-20 disabled:pointer-events-none backdrop-blur-sm"
      >
        <ChevronLeft className="size-5" />
      </button>

      {/* Phone frame */}
      <div className="relative z-10 flex flex-col items-center">
        <div
          className="overflow-hidden rounded-[44px] border-[3px] border-zinc-700/40 bg-black shadow-2xl dark:border-zinc-500/30"
          style={{ width: FRAME_WIDTH * 0.85, height: FRAME_HEIGHT * 0.85 }}
        >
          <iframe
            key={currentFrame.id}
            title={`Preview: ${currentFrame.label}`}
            srcDoc={currentFrame.html}
            sandbox="allow-scripts allow-same-origin"
            className="size-full border-0 bg-white"
            style={{
              width: FRAME_WIDTH,
              height: FRAME_HEIGHT,
              transform: "scale(0.85)",
              transformOrigin: "top left",
            }}
          />
        </div>
      </div>

      {/* Right arrow */}
      <button
        type="button"
        onClick={goNext}
        disabled={currentIndex === frames.length - 1}
        className="absolute right-5 z-10 inline-flex size-10 items-center justify-center rounded-full border border-b-secondary bg-surface-elevated/80 text-t-secondary transition-all hover:bg-input-bg hover:text-t-primary disabled:opacity-20 disabled:pointer-events-none backdrop-blur-sm"
      >
        <ChevronRight className="size-5" />
      </button>

      {/* Bottom page dots */}
      {frames.length > 1 && (
        <div className="absolute bottom-5 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2 rounded-full border border-b-secondary bg-surface-elevated/80 px-3 py-2 backdrop-blur-sm">
          {frames.map((f, i) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setCurrentIndex(i)}
              className={`size-2 rounded-full transition-all ${
                i === currentIndex
                  ? "bg-t-primary scale-125"
                  : "bg-t-tertiary/40 hover:bg-t-tertiary"
              }`}
              title={f.label}
            />
          ))}
        </div>
      )}
    </div>
  );
}
