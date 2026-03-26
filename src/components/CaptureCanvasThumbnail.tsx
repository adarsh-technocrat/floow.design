"use client";

import { useEffect, useRef, useCallback } from "react";
import { useAppSelector } from "@/store/hooks";
import { FRAME_WIDTH, FRAME_HEIGHT } from "@/lib/canvas-utils";
import http from "@/lib/http";

const THUMB_WIDTH = 960;
const THUMB_HEIGHT = 600;
const CAPTURE_DEBOUNCE_MS = 8_000;
const MIN_CAPTURE_INTERVAL_MS = 30_000;
const OFFSCREEN_RENDER_SCALE = 0.5;

export function CaptureCanvasThumbnail() {
  const projectId = useAppSelector((s) => s.project.projectId);
  const frames = useAppSelector((s) => s.canvas.frames);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSnapshotKeyRef = useRef("");
  const lastCaptureTimeRef = useRef(0);
  const capturingRef = useRef(false);

  const capture = useCallback(async () => {
    if (!projectId || frames.length === 0 || capturingRef.current) return;

    const now = Date.now();
    if (now - lastCaptureTimeRef.current < MIN_CAPTURE_INTERVAL_MS) return;

    const snapshotKey = frames
      .map((f) => `${f.id}:${f.left}:${f.top}:${(f.html || "").length}`)
      .join("|");
    if (snapshotKey === lastSnapshotKeyRef.current) return;
    lastSnapshotKeyRef.current = snapshotKey;

    const framesWithHtml = frames.filter((f) => f.html && f.html.length > 50);
    if (framesWithHtml.length === 0) return;

    capturingRef.current = true;

    try {
      let minX = Infinity,
        minY = Infinity,
        maxX = -Infinity,
        maxY = -Infinity;
      for (const f of framesWithHtml) {
        const fw = f.width ?? FRAME_WIDTH;
        const fh = f.height ?? FRAME_HEIGHT;
        minX = Math.min(minX, f.left);
        minY = Math.min(minY, f.top);
        maxX = Math.max(maxX, f.left + fw);
        maxY = Math.max(maxY, f.top + fh);
      }

      const contentW = maxX - minX;
      const contentH = maxY - minY;
      if (contentW < 1 || contentH < 1) return;

      const padding = 40;
      const availW = THUMB_WIDTH - padding * 2;
      const availH = THUMB_HEIGHT - padding * 2;
      const fitScale = Math.min(availW / contentW, availH / contentH, 1);

      const isDark =
        document.documentElement.classList.contains("dark") ||
        window.matchMedia("(prefers-color-scheme: dark)").matches;

      const html2canvas = (await import("html2canvas")).default;

      const offscreen = document.createElement("div");
      offscreen.style.cssText = `position:fixed;left:-99999px;top:-99999px;width:${contentW}px;height:${contentH}px;overflow:hidden;background:${isDark ? "#0a0a0a" : "#f4f4f5"};pointer-events:none;z-index:-1;`;
      document.body.appendChild(offscreen);

      for (const frame of framesWithHtml) {
        const fw = frame.width ?? FRAME_WIDTH;
        const fh = frame.height ?? FRAME_HEIGHT;

        const wrapper = document.createElement("div");
        wrapper.style.cssText = `position:absolute;left:${frame.left - minX}px;top:${frame.top - minY}px;width:${fw}px;height:${fh}px;overflow:hidden;border-radius:32px;background:#fff;`;

        const inner = document.createElement("div");
        inner.style.cssText = `width:${fw}px;height:${fh}px;overflow:hidden;`;
        inner.innerHTML = frame.html;
        wrapper.appendChild(inner);
        offscreen.appendChild(wrapper);
      }

      await new Promise((r) => setTimeout(r, 200));

      const captured = await html2canvas(offscreen, {
        backgroundColor: isDark ? "#0a0a0a" : "#f4f4f5",
        scale: OFFSCREEN_RENDER_SCALE,
        logging: false,
        useCORS: true,
        allowTaint: true,
      });

      document.body.removeChild(offscreen);

      const thumbCanvas = document.createElement("canvas");
      thumbCanvas.width = THUMB_WIDTH;
      thumbCanvas.height = THUMB_HEIGHT;
      const ctx = thumbCanvas.getContext("2d");
      if (!ctx) return;

      ctx.fillStyle = isDark ? "#0a0a0a" : "#f4f4f5";
      ctx.fillRect(0, 0, THUMB_WIDTH, THUMB_HEIGHT);

      ctx.fillStyle = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.07)";
      for (let dotX = 0; dotX < THUMB_WIDTH; dotX += 14) {
        for (let dotY = 0; dotY < THUMB_HEIGHT; dotY += 14) {
          ctx.beginPath();
          ctx.arc(dotX, dotY, 0.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      const drawW = contentW * fitScale;
      const drawH = contentH * fitScale;
      const offsetX = (THUMB_WIDTH - drawW) / 2;
      const offsetY = (THUMB_HEIGHT - drawH) / 2;

      ctx.drawImage(captured, offsetX, offsetY, drawW, drawH);

      const dataUrl = thumbCanvas.toDataURL("image/png", 0.85);
      lastCaptureTimeRef.current = Date.now();

      http
        .post("/api/projects/thumbnail", { projectId, thumbnail: dataUrl })
        .catch(() => {});
    } catch {} finally {
      capturingRef.current = false;
    }
  }, [projectId, frames]);

  useEffect(() => {
    if (!projectId || frames.length === 0) return;

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(capture, CAPTURE_DEBOUNCE_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [projectId, frames, capture]);

  const captureRef = useRef(capture);
  captureRef.current = capture;
  useEffect(() => {
    return () => {
      captureRef.current();
    };
  }, []);

  return null;
}
