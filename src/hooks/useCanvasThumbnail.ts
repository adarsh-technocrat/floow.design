"use client";

import { useEffect, useRef, useCallback } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "@/store";
import http from "@/lib/http";

const THUMB_WIDTH = 480;
const THUMB_HEIGHT = 300;
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
      const canvasContainer = document.querySelector("[data-frame]")?.parentElement;
      if (!canvasContainer) return;

      const html2canvas = (await import("html2canvas")).default;
      const capturedCanvas = await html2canvas(canvasContainer, {
        backgroundColor: null,
        scale: 0.3,
        useCORS: true,
        allowTaint: true,
        logging: false,
        ignoreElements: (element) => {
          return element.hasAttribute("data-resize-handle") ||
            element.hasAttribute("data-drag-handle") ||
            element.hasAttribute("data-toolbar-buttons") ||
            element.classList.contains("pointer-events-none");
        },
      });

      const thumbCanvas = document.createElement("canvas");
      thumbCanvas.width = THUMB_WIDTH;
      thumbCanvas.height = THUMB_HEIGHT;
      const ctx = thumbCanvas.getContext("2d");
      if (!ctx) return;

      const isDark = document.documentElement.classList.contains("dark") ||
        window.matchMedia("(prefers-color-scheme: dark)").matches;
      ctx.fillStyle = isDark ? "#0a0a0a" : "#f4f4f5";
      ctx.fillRect(0, 0, THUMB_WIDTH, THUMB_HEIGHT);

      const srcW = capturedCanvas.width;
      const srcH = capturedCanvas.height;
      const fitScale = Math.min(THUMB_WIDTH / srcW, THUMB_HEIGHT / srcH);
      const drawW = srcW * fitScale;
      const drawH = srcH * fitScale;
      const drawX = (THUMB_WIDTH - drawW) / 2;
      const drawY = (THUMB_HEIGHT - drawH) / 2;

      ctx.drawImage(capturedCanvas, drawX, drawY, drawW, drawH);

      const dataUrl = thumbCanvas.toDataURL("image/png", 0.8);
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
