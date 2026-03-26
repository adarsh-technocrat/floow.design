"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";

type Status = "idle" | "loading" | "ready" | "copied" | "error";

export function useFigmaExport() {
  const [status, setStatus] = useState<Status>("idle");

  const exportToFigma = useCallback(async (html: string) => {
    if (!html) {
      toast.error("No HTML to export");
      return;
    }

    setStatus("loading");

    try {
      const res = await fetch("/api/figma-export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ html }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Export failed" }));
        throw new Error(err.error || `Export failed (${res.status})`);
      }

      const clipboardData = await res.text();
      setStatus("ready");

      // Copy Figma clipboard data via the copy event
      const copyHandler = (e: ClipboardEvent) => {
        e.clipboardData?.setData("text/html", clipboardData);
        e.preventDefault();
      };

      document.addEventListener("copy", copyHandler, { once: true });
      document.execCommand("copy");

      setStatus("copied");
      toast.success("Copied! Paste into Figma (Cmd+V / Ctrl+V)", {
        position: "top-center",
        duration: 4000,
      });

      setTimeout(() => setStatus("idle"), 3000);
    } catch (err) {
      setStatus("error");
      toast.error(
        err instanceof Error ? err.message : "Failed to export to Figma",
        { position: "top-center" },
      );
      setTimeout(() => setStatus("idle"), 2000);
    }
  }, []);

  return { exportToFigma, status };
}
