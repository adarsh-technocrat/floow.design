"use client";

import { cn } from "@/lib/utils";

export type ProjectFramePreviewProps = {
  title: string;
  emptyLabel?: string;
  dimmed?: boolean;
  className?: string;
};

export function ProjectFramePreview({
  title: _title,
  emptyLabel = "No preview",
  dimmed: _dimmed = false,
  className,
}: ProjectFramePreviewProps) {
  return (
    <div
      className={cn(
        "flex h-full w-full min-h-0 items-center justify-center overflow-hidden bg-surface-sunken p-2 sm:p-3",
        className,
      )}
      style={{
        backgroundImage: `radial-gradient(var(--canvas-dot) 0.65px, transparent 0.65px)`,
        backgroundSize: "14px 14px",
      }}
    >
      <div className="absolute inset-0 flex items-center justify-center bg-surface-sunken">
        <span className="px-2 text-center text-[10px] font-mono text-t-tertiary">
          {emptyLabel}
        </span>
      </div>
    </div>
  );
}
