"use client";

import { useEffect, useRef, useCallback } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "@/store";

/**
 * Silently captures a thumbnail of the canvas by rendering the first frame's
 * HTML into a hidden iframe, then drawing it onto a canvas element.
 * Debounced — only captures after 3 seconds of frame inactivity.
 */
export function useCanvasThumbnail(projectId: string | null) {
  const frames = useSelector((s: RootState) => s.canvas.frames);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastHtmlRef = useRef<string>("");

  const capture = useCallback(async () => {
    if (!projectId || frames.length === 0) return;

    const firstFrame = frames[0];
    if (!firstFrame?.html) return;

    // Skip if HTML hasn't changed since last capture
    if (firstFrame.html === lastHtmlRef.current) return;
    lastHtmlRef.current = firstFrame.html;

    try {
      // Create a hidden iframe to render the frame HTML
      const iframe = document.createElement("iframe");
      iframe.style.cssText =
        "position:fixed;top:-9999px;left:-9999px;width:420px;height:927px;border:none;opacity:0;pointer-events:none;";
      iframe.sandbox.add("allow-same-origin");
      document.body.appendChild(iframe);

      // Write content and wait for load
      const doc = iframe.contentDocument;
      if (!doc) {
        document.body.removeChild(iframe);
        return;
      }

      doc.open();
      doc.write(firstFrame.html);
      doc.close();

      // Wait for content to render
      await new Promise((r) => setTimeout(r, 500));

      // Use SVG foreignObject to render HTML to canvas
      const svgData = `
        <svg xmlns="http://www.w3.org/2000/svg" width="420" height="927">
          <foreignObject width="100%" height="100%">
            <div xmlns="http://www.w3.org/1999/xhtml">
              ${doc.documentElement.outerHTML}
            </div>
          </foreignObject>
        </svg>`;

      const img = new Image();
      const svgBlob = new Blob([svgData], {
        type: "image/svg+xml;charset=utf-8",
      });
      const url = URL.createObjectURL(svgBlob);

      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject();
        img.src = url;
      });

      // Draw to a small canvas for thumbnail
      const thumbWidth = 210;
      const thumbHeight = 464;
      const canvas = document.createElement("canvas");
      canvas.width = thumbWidth;
      canvas.height = thumbHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(img, 0, 0, thumbWidth, thumbHeight);
        const dataUrl = canvas.toDataURL("image/png", 0.7);

        // Save silently — don't block UI
        fetch("/api/projects/thumbnail", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ projectId, thumbnail: dataUrl }),
        }).catch(() => {});
      }

      URL.revokeObjectURL(url);
      document.body.removeChild(iframe);
    } catch {
      // Silent fail — thumbnail is a nice-to-have
    }
  }, [projectId, frames]);

  useEffect(() => {
    if (!projectId || frames.length === 0) return;

    // Debounce: capture 3 seconds after last frame change
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(capture, 3000);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [projectId, frames, capture]);
}
