"use client";

import { cn } from "@/lib/utils";

export type ProjectFramePreviewProps = {
  thumbnail: string | null;
  title: string;
  emptyLabel?: string;
  dimmed?: boolean;
  className?: string;
};

export function ProjectFramePreview({
  thumbnail,
  title,
  emptyLabel = "No preview",
  dimmed = false,
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
      {thumbnail ? (
        <img
          src={thumbnail}
          alt={title}
          className={cn(
            "absolute inset-0 h-full w-full object-cover object-center",
            dimmed &&
              "opacity-[0.68] grayscale-[0.45] transition-[opacity,filter] duration-300 group-hover:opacity-[0.82] group-hover:grayscale-[0.15]",
          )}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-surface-sunken">
          <span className="px-2 text-center text-[10px] font-mono text-t-tertiary">
            {emptyLabel}
          </span>
        </div>
      )}
    </div>
  );
}
