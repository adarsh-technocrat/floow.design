"use client";

import { useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { useSearchParams } from "next/navigation";
import { Canvas } from "@/components/Canvas";
import {
  CanvasBottomLeft,
  CanvasBottomRight,
  CanvasTopLeft,
  CanvasTopRight,
  EditingModeDisplay,
} from "@/components/canvas-layout";
import { useCanvasThumbnail } from "@/hooks/useCanvasThumbnail";
import { sendChatMessage } from "@/lib/chat-bridge";
import type { RootState } from "@/store";

export default function ProjectCanvasPage() {
  const projectId = useSelector((s: RootState) => s.project.projectId);
  const projectLoaded = useSelector((s: RootState) => s.project.loaded);
  const searchParams = useSearchParams();
  const promptSentRef = useRef(false);

  useCanvasThumbnail(projectId);

  // Auto-send prompt from URL query param once project & chat are ready
  useEffect(() => {
    if (promptSentRef.current || !projectLoaded) return;
    const prompt = searchParams.get("prompt");
    if (!prompt) return;

    // Wait for chat bridge to register, then send
    const timer = setInterval(() => {
      sendChatMessage(prompt);
      promptSentRef.current = true;
      clearInterval(timer);
      // Clean the URL
      window.history.replaceState(
        {},
        "",
        window.location.pathname,
      );
    }, 500);

    // Give up after 10s
    const timeout = setTimeout(() => clearInterval(timer), 10000);

    return () => {
      clearInterval(timer);
      clearTimeout(timeout);
    };
  }, [projectLoaded, searchParams]);

  return (
    <div className="flex h-screen w-full flex-col bg-canvas-bg">
      <div
        className="pointer-events-none absolute left-0 right-0 top-0 z-[5] h-12 bg-gradient-to-b from-surface/60 to-transparent"
        aria-hidden
      />

      <div className="relative w-full flex-1 overflow-hidden">
        <Canvas />
        <CanvasTopLeft />
        <CanvasTopRight />
        <CanvasBottomLeft />
        <CanvasBottomRight />
        <EditingModeDisplay />
      </div>
    </div>
  );
}
