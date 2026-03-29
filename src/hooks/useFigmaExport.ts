"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import {
  isSafari,
  checkClipboardPermissions,
  createDeferredClipboardCopy,
  copyFigmaHTML,
} from "@/lib/clipboard";

type Status = "idle" | "loading" | "ready" | "copied" | "error";

export function useFigmaExport() {
  const [status, setStatus] = useState<Status>("idle");

  const exportToFigma = useCallback(
    async (html: string, width?: number, height?: number) => {
      if (!html) {
        toast.error("No HTML to export");
        return;
      }

      const isSafariBrowser = isSafari();

      // Safari: create deferred clipboard SYNCHRONOUSLY within the gesture
      let deferredClipboard: ReturnType<
        typeof createDeferredClipboardCopy
      > | null = null;
      if (isSafariBrowser) {
        deferredClipboard = createDeferredClipboardCopy();
      }

      // Non-Safari: check permissions before the API call
      if (!isSafariBrowser) {
        const { canProceed, errorMessage } = await checkClipboardPermissions();
        if (!canProceed) {
          toast.error(errorMessage || "Clipboard access denied", {
            position: "top-center",
          });
          return;
        }
      }

      setStatus("loading");
      const loadingToast = toast.loading(
        "Exporting to Figma… please don't switch tabs",
        { position: "top-center" },
      );

      try {
        const res = await fetch("/api/figma-export", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ html, width, height }),
        });

        if (!res.ok) {
          const err = await res
            .json()
            .catch(() => ({ error: "Export failed" }));
          throw new Error(err.error || `Export failed (${res.status})`);
        }

        const clipboardData = await res.text();
        setStatus("ready");

        // Copy to clipboard
        if (deferredClipboard) {
          await deferredClipboard.resolve(clipboardData);
        } else {
          await copyFigmaHTML(clipboardData);
        }

        setStatus("copied");
        toast.dismiss(loadingToast);
        toast.success("Copied! Paste into Figma (Cmd+V / Ctrl+V)", {
          position: "top-center",
          duration: 4000,
        });

        setTimeout(() => setStatus("idle"), 3000);
      } catch (err) {
        if (deferredClipboard) {
          deferredClipboard.reject(
            err instanceof Error ? err : new Error("Export failed"),
          );
        }
        setStatus("error");
        toast.dismiss(loadingToast);
        toast.error(
          err instanceof Error ? err.message : "Failed to export to Figma",
          { position: "top-center" },
        );
        setTimeout(() => setStatus("idle"), 2000);
      }
    },
    [],
  );

  return { exportToFigma, status };
}
