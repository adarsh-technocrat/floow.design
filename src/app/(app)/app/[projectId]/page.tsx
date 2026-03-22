"use client";

import { useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
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
import { sendChatMessage, isChatBridgeReady } from "@/lib/chat-bridge";
import { setAgentLogVisible } from "@/store/slices/uiSlice";
import type { RootState } from "@/store";

export default function ProjectCanvasPage() {
  const dispatch = useDispatch();
  const projectId = useSelector((s: RootState) => s.project.projectId);
  const projectLoaded = useSelector((s: RootState) => s.project.loaded);
  const searchParams = useSearchParams();
  const promptSentRef = useRef(false);

  useCanvasThumbnail(projectId);

  // Auto-send prompt from URL query param once project & chat bridge are ready
  useEffect(() => {
    if (promptSentRef.current || !projectLoaded) return;
    const prompt = searchParams.get("prompt");
    if (!prompt) return;

    // Poll until chat bridge is ready (ChatPanel has mounted and registered)
    const timer = setInterval(() => {
      if (!isChatBridgeReady()) return; // not ready yet, keep waiting

      sendChatMessage(prompt);
      promptSentRef.current = true;
      clearInterval(timer);

      // Auto-open the activity log so user sees the agent working
      dispatch(setAgentLogVisible(true));

      // Clean the URL
      window.history.replaceState({}, "", window.location.pathname);
    }, 300);

    // Give up after 15s
    const timeout = setTimeout(() => clearInterval(timer), 15000);

    return () => {
      clearInterval(timer);
      clearTimeout(timeout);
    };
  }, [projectLoaded, searchParams, dispatch]);

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
