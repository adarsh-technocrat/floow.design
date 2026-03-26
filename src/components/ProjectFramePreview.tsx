"use client";

import { cn } from "@/lib/utils";
import type { FramePreviewItem } from "@/store/slices/projectsSlice";

export type ProjectFramePreviewProps = {
  title: string;
  framePreviews?: FramePreviewItem[];
  emptyLabel?: string;
  dimmed?: boolean;
  className?: string;
};

function MiniScreen({ frameId, label }: { frameId: string; label: string }) {
  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden rounded-lg border border-border/40 bg-white shadow-sm">
      <iframe
        title={label}
        src={`/api/frames/${frameId}/render`}
        className="h-full w-full border-0 pointer-events-none"
        sandbox=""
        loading="lazy"
        tabIndex={-1}
        style={{ colorScheme: "light" }}
      />
    </div>
  );
}

export function ProjectFramePreview({
  title: _title,
  framePreviews,
  emptyLabel = "No preview",
  dimmed: _dimmed = false,
  className,
}: ProjectFramePreviewProps) {
  const hasScreens = framePreviews && framePreviews.length > 0;

  if (!hasScreens) {
    return (
      <div
        className={cn(
          "flex h-full w-full min-h-0 items-center justify-center overflow-hidden bg-surface-sunken",
          className,
        )}
        style={{
          backgroundImage: `radial-gradient(var(--canvas-dot) 0.65px, transparent 0.65px)`,
          backgroundSize: "14px 14px",
        }}
      >
        <span className="px-2 text-center text-[10px] font-mono text-t-tertiary">
          {emptyLabel}
        </span>
      </div>
    );
  }

  const count = framePreviews.length;

  return (
    <div
      className={cn(
        "flex h-full w-full min-h-0 items-center justify-center gap-2 overflow-hidden bg-surface-sunken px-3 py-3 sm:px-4 sm:py-4",
        className,
      )}
      style={{
        backgroundImage: `radial-gradient(var(--canvas-dot) 0.65px, transparent 0.65px)`,
        backgroundSize: "14px 14px",
      }}
    >
      {framePreviews.map((frame, i) => (
        <div
          key={frame.id}
          className="relative h-full overflow-hidden rounded-lg"
          style={{
            width: count === 1 ? "45%" : count === 2 ? "38%" : "30%",
            transform:
              count >= 3
                ? `rotate(${i === 0 ? -3 : i === 2 ? 3 : 0}deg) translateY(${i === 1 ? -2 : 2}px)`
                : count === 2
                  ? `rotate(${i === 0 ? -2 : 2}deg)`
                  : undefined,
            zIndex: count >= 3 && i === 1 ? 2 : 1,
          }}
        >
          <MiniScreen frameId={frame.id} label={frame.label} />
        </div>
      ))}
    </div>
  );
}
