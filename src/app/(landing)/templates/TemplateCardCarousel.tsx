"use client";

import { useState, useEffect, useMemo, useRef, useLayoutEffect } from "react";

const FRAME_W = 430;
const FRAME_H = 932;
const PHONE_PATH_D =
  "M 334 0 c 45.255 0 67.882 0 81.941 14.059 c 14.059 14.059 14.059 36.686 14.059 81.941 L 430 836 c 0 45.255 0 67.882 -14.059 81.941 c -14.059 14.059 -36.686 14.059 -81.941 14.059 L 96 932 c -45.255 0 -67.882 0 -81.941 -14.059 c -14.059 -14.059 -14.059 -36.686 -14.059 -81.941 L 0 96 c 0 -45.255 0 -67.882 14.059 -81.941 c 14.059 -14.059 36.686 -14.059 81.941 -14.059 Z";

const AUTO_ROTATE_MS = 3500;

function ScreenFrame({ html, label, clipId, scale }: { html: string; label: string; clipId: string; scale: number }) {
  const src = useMemo(() => {
    const blob = new Blob([html], { type: "text/html" });
    return URL.createObjectURL(blob);
  }, [html]);

  useEffect(() => {
    return () => URL.revokeObjectURL(src);
  }, [src]);

  return (
    <div
      className="relative shrink-0 mx-auto"
      style={{
        width: FRAME_W * scale,
        height: FRAME_H * scale,
        filter: "drop-shadow(0 4px 20px rgba(0,0,0,0.3))",
      }}
    >
      <div
        className="absolute inset-0 overflow-hidden"
        style={{
          backgroundColor: "#0a0a0a",
          clipPath: `url(#${clipId})`,
        }}
      >
        <iframe
          src={src}
          sandbox="allow-scripts"
          title={label}
          className="pointer-events-none border-none"
          width={FRAME_W}
          height={FRAME_H}
          style={{
            transform: `scale(${scale})`,
            transformOrigin: "top left",
          }}
          tabIndex={-1}
        />
      </div>
    </div>
  );
}

export function TemplateCardCarousel({
  frames,
}: {
  frames: { id: string; label: string; html: string }[];
}) {
  const [activeIdx, setActiveIdx] = useState(0);
  const hostRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.3);
  const clipId = useMemo(() => `tpl-card-${Math.random().toString(36).slice(2, 8)}`, []);

  useLayoutEffect(() => {
    const el = hostRef.current;
    if (!el) return;
    const update = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      if (w < 1 || h < 1) return;
      const padding = 24;
      const s = Math.min((w - padding * 2) / FRAME_W, (h - padding * 2) / FRAME_H);
      setScale(Math.max(0.1, Math.min(s, 1)));
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (frames.length <= 1) return;
    const timer = setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % frames.length);
    }, AUTO_ROTATE_MS);
    return () => clearInterval(timer);
  }, [frames.length]);

  if (frames.length === 0) return null;

  return (
    <div ref={hostRef} className="relative h-full w-full flex flex-col">
      <svg width="0" height="0" className="absolute" aria-hidden>
        <defs>
          <clipPath
            id={clipId}
            clipPathUnits="objectBoundingBox"
            transform={`scale(${1 / FRAME_W}, ${1 / FRAME_H})`}
          >
            <path d={PHONE_PATH_D} />
          </clipPath>
        </defs>
      </svg>

      <div className="flex-1 overflow-hidden">
        <div
          className="flex h-full transition-transform duration-500 ease-in-out"
          style={{ transform: `translateX(-${activeIdx * 100}%)` }}
        >
          {frames.map((f) => (
            <div key={f.id} className="w-full shrink-0 flex items-center justify-center">
              <ScreenFrame html={f.html} label={f.label} clipId={clipId} scale={scale} />
            </div>
          ))}
        </div>
      </div>

      {frames.length > 1 && (
        <div className="flex items-center justify-center gap-1.5 pb-3">
          {frames.map((f, i) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setActiveIdx(i)}
              className={`h-1 rounded-full transition-all ${
                i === activeIdx
                  ? "w-4 bg-btn-primary-bg"
                  : "w-1.5 bg-t-tertiary/40 hover:bg-t-tertiary/60"
              }`}
              aria-label={f.label}
            />
          ))}
        </div>
      )}
    </div>
  );
}
