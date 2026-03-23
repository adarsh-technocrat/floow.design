"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useAppSelector } from "@/store/hooks";
import { FRAME_WIDTH, FRAME_HEIGHT } from "@/lib/canvas-utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";

interface PreviewModalProps {
  open: boolean;
  onClose: () => void;
  initialFrameId?: string;
}

export function PreviewModal({ open, onClose, initialFrameId }: PreviewModalProps) {
  const frames = useAppSelector((s) => s.canvas.frames);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!open) return;
    if (initialFrameId) {
      const idx = frames.findIndex((f) => f.id === initialFrameId);
      setCurrentIndex(idx >= 0 ? idx : 0);
    } else {
      setCurrentIndex(0);
    }
  }, [open, initialFrameId, frames]);

  const goToNextFrame = useCallback(() => {
    setCurrentIndex((i) => (i < frames.length - 1 ? i + 1 : i));
  }, [frames.length]);

  const goToPreviousFrame = useCallback(() => {
    setCurrentIndex((i) => (i > 0 ? i - 1 : i));
  }, []);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown") goToNextFrame();
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") goToPreviousFrame();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, goToNextFrame, goToPreviousFrame]);

  const currentFrame = frames[currentIndex];

  return (
    <Dialog open={open && frames.length > 0} onOpenChange={(o) => !o && onClose()}>
      <DialogContent showCloseButton={false} className="flex max-h-[92vh] min-h-0 flex-col overflow-hidden p-0 sm:max-w-[520px]">
        <DialogHeader className="flex shrink-0 flex-row items-center justify-between gap-4 space-y-0 px-5 py-3.5 border-b border-b-secondary">
          <div>
            <DialogTitle className="text-sm font-semibold text-t-primary truncate max-w-[240px]">
              {currentFrame?.label ?? "Preview"}
            </DialogTitle>
            <p className="text-[11px] text-t-tertiary font-mono">
              Screen {currentIndex + 1} of {frames.length}
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={goToPreviousFrame}
              disabled={currentIndex === 0}
              className="inline-flex size-8 items-center justify-center rounded-lg border border-b-secondary text-t-secondary transition-colors hover:bg-input-bg hover:text-t-primary disabled:opacity-20 disabled:pointer-events-none"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              type="button"
              onClick={goToNextFrame}
              disabled={currentIndex === frames.length - 1}
              className="inline-flex size-8 items-center justify-center rounded-lg border border-b-secondary text-t-secondary transition-colors hover:bg-input-bg hover:text-t-primary disabled:opacity-20 disabled:pointer-events-none"
            >
              <ChevronRight className="size-4" />
            </button>
            <div className="mx-0.5 h-4 w-px bg-b-secondary" />
            <DialogClose className="flex size-8 items-center justify-center rounded-lg text-t-tertiary transition-colors hover:bg-input-bg hover:text-t-primary">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </DialogClose>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden bg-black flex items-center justify-center">
          {currentFrame && (
            <div
              className="relative overflow-hidden"
              style={{ width: FRAME_WIDTH * 0.82, height: FRAME_HEIGHT * 0.82 }}
            >
              <iframe
                key={currentFrame.id}
                title={`Preview: ${currentFrame.label}`}
                srcDoc={currentFrame.html}
                sandbox="allow-scripts allow-same-origin"
                className="border-0 bg-white"
                style={{
                  width: FRAME_WIDTH,
                  height: FRAME_HEIGHT,
                  transform: "scale(0.82)",
                  transformOrigin: "top left",
                }}
              />
            </div>
          )}
        </div>

        {frames.length > 1 && (
          <div className="flex items-center justify-center gap-1.5 border-t border-b-secondary px-4 py-3">
            {frames.map((f, i) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setCurrentIndex(i)}
                className={`rounded-full transition-all ${
                  i === currentIndex
                    ? "size-2.5 bg-t-primary"
                    : "size-2 bg-t-tertiary/30 hover:bg-t-tertiary"
                }`}
                title={f.label}
              />
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
