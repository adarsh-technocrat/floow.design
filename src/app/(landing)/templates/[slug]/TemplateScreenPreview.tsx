"use client";

import { useMemo, useEffect, useRef, useLayoutEffect, useState } from "react";

const FRAME_W = 430;
const FRAME_H = 932;
const PHONE_PATH_D =
  "M 334 0 c 45.255 0 67.882 0 81.941 14.059 c 14.059 14.059 14.059 36.686 14.059 81.941 L 430 836 c 0 45.255 0 67.882 -14.059 81.941 c -14.059 14.059 -36.686 14.059 -81.941 14.059 L 96 932 c -45.255 0 -67.882 0 -81.941 -14.059 c -14.059 -14.059 -14.059 -36.686 -14.059 -81.941 L 0 96 c 0 -45.255 0 -67.882 14.059 -81.941 c 14.059 -14.059 36.686 -14.059 81.941 -14.059 Z";

export function TemplateScreenPreview({
  html,
  title,
}: {
  html: string;
  title: string;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.35);
  const clipId = useMemo(() => `tpl-clip-${Math.random().toString(36).slice(2, 8)}`, []);

  const src = useMemo(() => {
    const blob = new Blob([html], { type: "text/html" });
    return URL.createObjectURL(blob);
  }, [html]);

  useEffect(() => {
    return () => URL.revokeObjectURL(src);
  }, [src]);

  useLayoutEffect(() => {
    const el = hostRef.current;
    if (!el) return;
    const update = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      if (w < 1 || h < 1) return;
      const s = Math.min(w / FRAME_W, h / FRAME_H) * 0.92;
      setScale(Math.max(0.1, Math.min(s, 1)));
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={hostRef} className="absolute inset-0 flex items-center justify-center">
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

      <div
        className="relative shrink-0"
        style={{
          width: FRAME_W * scale,
          height: FRAME_H * scale,
          filter: "drop-shadow(0 4px 24px rgba(0,0,0,0.25))",
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
            title={title}
            className="pointer-events-none border-none"
            width={FRAME_W}
            height={FRAME_H}
            style={{
              transform: `scale(${scale})`,
              transformOrigin: "top left",
              width: FRAME_W,
              height: FRAME_H,
            }}
            tabIndex={-1}
          />
        </div>
      </div>
    </div>
  );
}
