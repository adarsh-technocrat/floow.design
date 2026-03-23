"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const FRAME_W = 420;
const FRAME_H = 927;

function HtmlFramePreview({
  srcDoc,
  title,
}: {
  srcDoc: string;
  title: string;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.2);

  useLayoutEffect(() => {
    const el = hostRef.current;
    if (!el) return;

    const update = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      if (w < 8 || h < 8) return;
      const s = Math.min(w / FRAME_W, h / FRAME_H) * 0.96;
      setScale(Math.max(0.08, Math.min(s, 1)));
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [srcDoc]);

  return (
    <div
      ref={hostRef}
      className="absolute inset-0 flex items-center justify-center overflow-hidden rounded-[inherit]"
    >
      <iframe
        title={title}
        srcDoc={srcDoc}
        sandbox=""
        tabIndex={-1}
        width={FRAME_W}
        height={FRAME_H}
        className="pointer-events-none shrink-0 border-0"
        style={{
          transform: `scale(${scale})`,
          transformOrigin: "center center",
        }}
      />
    </div>
  );
}

export type ProjectFramePreviewProps = {
  thumbnail: string | null;
  firstFrameHtml?: string | null;
  title: string;
  emptyLabel?: string;
  /** Trash / muted cards */
  dimmed?: boolean;
  className?: string;
};

/**
 * Figma-style file tile: dotted canvas + centered phone-frame preview.
 */
export function ProjectFramePreview({
  thumbnail,
  firstFrameHtml,
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
          alt=""
          className={cn(
            "absolute inset-0 h-full w-full object-cover object-center",
            dimmed &&
              "opacity-[0.68] grayscale-[0.45] transition-[opacity,filter] duration-300 group-hover:opacity-[0.82] group-hover:grayscale-[0.15]",
          )}
        />
      ) : (
      <div
        className={cn(
          "relative w-full max-w-[min(200px,75%)] overflow-hidden rounded-[11px] border border-b-secondary bg-surface-elevated shadow-[0_2px_16px_-2px_rgba(0,0,0,0.18)] dark:shadow-[0_4px_28px_-4px_rgba(0,0,0,0.55)] sm:max-w-[min(240px,80%)]",
          "aspect-[420/927]",
          dimmed &&
            "opacity-[0.68] grayscale-[0.45] transition-[opacity,filter] duration-300 group-hover:opacity-[0.82] group-hover:grayscale-[0.15]",
        )}
      >
        {firstFrameHtml ? (
          <HtmlFramePreview
            srcDoc={firstFrameHtml}
            title={`${title} preview`}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-surface-sunken">
            <span className="px-2 text-center text-[10px] font-mono text-t-tertiary">
              {emptyLabel}
            </span>
          </div>
        )}
      </div>
      )}
    </div>
  );
}
