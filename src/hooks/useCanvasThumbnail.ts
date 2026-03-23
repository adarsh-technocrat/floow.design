"use client";

import { useEffect, useRef, useCallback } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "@/store";
import http from "@/lib/http";
import { FRAME_WIDTH, FRAME_HEIGHT } from "@/lib/canvas-utils";

const THUMB_WIDTH = 480;
const THUMB_HEIGHT = 300;
const CANVAS_PADDING = 40;
const CAPTURE_DEBOUNCE_MS = 10_000;
const MIN_INTERVAL_BETWEEN_CAPTURES_MS = 60_000;

export function useCanvasThumbnail(projectId: string | null) {
  const frames = useSelector((s: RootState) => s.canvas.frames);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSnapshotKeyRef = useRef<string>("");
  const lastCaptureTimeRef = useRef<number>(0);

  const captureCanvasViewThumbnail = useCallback(async () => {
    if (!projectId || frames.length === 0) return;

    const now = Date.now();
    if (now - lastCaptureTimeRef.current < MIN_INTERVAL_BETWEEN_CAPTURES_MS) return;

    const snapshotKey = frames
      .map((f) => `${f.id}:${f.left}:${f.top}:${(f.html || "").length}`)
      .join("|");
    if (snapshotKey === lastSnapshotKeyRef.current) return;
    lastSnapshotKeyRef.current = snapshotKey;

    const framesWithHtml = frames.filter((f) => f.html && f.html.length > 50);
    if (framesWithHtml.length === 0) return;

    try {
      const minLeft = Math.min(...framesWithHtml.map((f) => f.left));
      const minTop = Math.min(...framesWithHtml.map((f) => f.top));
      const maxRight = Math.max(
        ...framesWithHtml.map((f) => f.left + (f.width ?? FRAME_WIDTH)),
      );
      const maxBottom = Math.max(
        ...framesWithHtml.map((f) => f.top + (f.height ?? FRAME_HEIGHT)),
      );

      const contentWidth = maxRight - minLeft + CANVAS_PADDING * 2;
      const contentHeight = maxBottom - minTop + CANVAS_PADDING * 2;
      const scaleToFit = Math.min(
        THUMB_WIDTH / contentWidth,
        THUMB_HEIGHT / contentHeight,
        0.3,
      );

      const canvas = document.createElement("canvas");
      canvas.width = THUMB_WIDTH;
      canvas.height = THUMB_HEIGHT;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const isDark = document.documentElement.classList.contains("dark") ||
        window.matchMedia("(prefers-color-scheme: dark)").matches;
      ctx.fillStyle = isDark ? "#0a0a0a" : "#f4f4f5";
      ctx.fillRect(0, 0, THUMB_WIDTH, THUMB_HEIGHT);

      const dotColor = isDark ? "rgba(255,255,255,0.12)" : "rgba(9,9,11,0.18)";
      const dotSpacing = 20 * scaleToFit;
      if (dotSpacing > 2) {
        ctx.fillStyle = dotColor;
        for (let x = 0; x < THUMB_WIDTH; x += dotSpacing) {
          for (let y = 0; y < THUMB_HEIGHT; y += dotSpacing) {
            ctx.beginPath();
            ctx.arc(x, y, 0.5, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      const offsetX =
        (THUMB_WIDTH - contentWidth * scaleToFit) / 2 -
        minLeft * scaleToFit +
        CANVAS_PADDING * scaleToFit;
      const offsetY =
        (THUMB_HEIGHT - contentHeight * scaleToFit) / 2 -
        minTop * scaleToFit +
        CANVAS_PADDING * scaleToFit;

      const renderPromises = framesWithHtml.map(
        (frame) =>
          new Promise<{
            img: HTMLImageElement;
            left: number;
            top: number;
            width: number;
            height: number;
          } | null>((resolve) => {
            const iframe = document.createElement("iframe");
            iframe.style.cssText =
              "position:fixed;top:-9999px;left:-9999px;border:none;opacity:0;pointer-events:none;";
            iframe.width = String(frame.width ?? FRAME_WIDTH);
            iframe.height = String(frame.height ?? FRAME_HEIGHT);
            iframe.sandbox.add("allow-same-origin");
            document.body.appendChild(iframe);

            const doc = iframe.contentDocument;
            if (!doc) {
              document.body.removeChild(iframe);
              resolve(null);
              return;
            }

            doc.open();
            doc.write(frame.html);
            doc.close();

            setTimeout(() => {
              const w = frame.width ?? FRAME_WIDTH;
              const h = frame.height ?? FRAME_HEIGHT;
              const svgData = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
                <foreignObject width="100%" height="100%">
                  <div xmlns="http://www.w3.org/1999/xhtml">${doc.documentElement.outerHTML}</div>
                </foreignObject>
              </svg>`;

              const img = new Image();
              const blob = new Blob([svgData], {
                type: "image/svg+xml;charset=utf-8",
              });
              const url = URL.createObjectURL(blob);

              img.onload = () => {
                URL.revokeObjectURL(url);
                document.body.removeChild(iframe);
                resolve({
                  img,
                  left: frame.left,
                  top: frame.top,
                  width: w,
                  height: h,
                });
              };
              img.onerror = () => {
                URL.revokeObjectURL(url);
                document.body.removeChild(iframe);
                resolve(null);
              };
              img.src = url;
            }, 400);
          }),
      );

      const renderedFrames = (await Promise.all(renderPromises)).filter(
        Boolean,
      ) as Array<{
        img: HTMLImageElement;
        left: number;
        top: number;
        width: number;
        height: number;
      }>;

      for (const rf of renderedFrames) {
        const drawX = offsetX + rf.left * scaleToFit;
        const drawY = offsetY + rf.top * scaleToFit;
        const drawW = rf.width * scaleToFit;
        const drawH = rf.height * scaleToFit;

        ctx.save();
        const radius = 12 * scaleToFit;
        ctx.beginPath();
        ctx.moveTo(drawX + radius, drawY);
        ctx.lineTo(drawX + drawW - radius, drawY);
        ctx.quadraticCurveTo(drawX + drawW, drawY, drawX + drawW, drawY + radius);
        ctx.lineTo(drawX + drawW, drawY + drawH - radius);
        ctx.quadraticCurveTo(drawX + drawW, drawY + drawH, drawX + drawW - radius, drawY + drawH);
        ctx.lineTo(drawX + radius, drawY + drawH);
        ctx.quadraticCurveTo(drawX, drawY + drawH, drawX, drawY + drawH - radius);
        ctx.lineTo(drawX, drawY + radius);
        ctx.quadraticCurveTo(drawX, drawY, drawX + radius, drawY);
        ctx.closePath();
        ctx.clip();

        ctx.drawImage(rf.img, drawX, drawY, drawW, drawH);
        ctx.restore();

        ctx.strokeStyle = isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(drawX, drawY, drawW, drawH, radius);
        ctx.stroke();
      }

      const dataUrl = canvas.toDataURL("image/png", 0.8);
      lastCaptureTimeRef.current = Date.now();
      http
        .post("/api/projects/thumbnail", { projectId, thumbnail: dataUrl })
        .catch(() => {});
    } catch {
      // Silent fail
    }
  }, [projectId, frames]);

  useEffect(() => {
    if (!projectId || frames.length === 0) return;

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(captureCanvasViewThumbnail, CAPTURE_DEBOUNCE_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [projectId, frames, captureCanvasViewThumbnail]);
}
