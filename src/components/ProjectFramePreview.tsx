"use client";

import { cn } from "@/lib/utils";
import type { FramePreviewItem } from "@/store/slices/projectsSlice";

/**
 * Renders a phone-shaped scaled-down iframe preview of a screen.
 * The iframe is rendered at full mobile size (390×844) then scaled down
 * with CSS transform to fit the card, giving a crisp miniature preview.
 */
const DEVICE_W = 390;
const DEVICE_H = 844;
const SCALE = 0.18;

function MiniScreen({ frameId, label }: { frameId: string; label: string }) {
  const scaledW = DEVICE_W * SCALE;
  const scaledH = DEVICE_H * SCALE;

  return (
    <div
      className="relative overflow-hidden rounded-lg border border-border/30 bg-white shadow-sm"
      style={{ width: scaledW, height: scaledH }}
    >
      <iframe
        title={label}
        src={`/api/frames/${frameId}/render`}
        className="border-0 pointer-events-none origin-top-left"
        sandbox="allow-scripts"
        loading="lazy"
        tabIndex={-1}
        style={{
          width: DEVICE_W,
          height: DEVICE_H,
          transform: `scale(${SCALE})`,
          transformOrigin: "top left",
          colorScheme: "light",
        }}
      />
    </div>
  );
}

export type ProjectFramePreviewProps = {
  title: string;
  framePreviews?: FramePreviewItem[];
  emptyLabel?: string;
  dimmed?: boolean;
  className?: string;
};

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
        "flex h-full w-full min-h-0 items-end justify-center overflow-hidden bg-surface-sunken px-3 pt-4",
        className,
      )}
      style={{
        backgroundImage: `radial-gradient(var(--canvas-dot) 0.65px, transparent 0.65px)`,
        backgroundSize: "14px 14px",
        gap: count >= 3 ? "6px" : "8px",
      }}
    >
      {framePreviews.map((frame, i) => (
        <div
          key={frame.id}
          className="relative shrink-0"
          style={{
            transform:
              count >= 3
                ? `rotate(${i === 0 ? -4 : i === 2 ? 4 : 0}deg) translateY(${i === 1 ? -6 : 4}px)`
                : count === 2
                  ? `rotate(${i === 0 ? -3 : 3}deg)`
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
