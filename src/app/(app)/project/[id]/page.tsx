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
import { CellProgressLoader } from "@/components/CellProgressLoader";
import { CaptureCanvasThumbnail } from "@/components/CaptureCanvasThumbnail";
import { sendChatMessage, isChatBridgeReady, markNewProject } from "@/lib/chat-bridge";
import { setAgentLogVisible } from "@/store/slices/uiSlice";
import type { RootState } from "@/store";

export default function ProjectCanvasPage() {
  const dispatch = useDispatch();
  const projectId = useSelector((s: RootState) => s.project.projectId);
  const projectLoaded = useSelector((s: RootState) => s.project.loaded);
  const searchParams = useSearchParams();
  const promptSentRef = useRef(false);

  useEffect(() => {
    if (searchParams.get("prompt")) markNewProject();
  }, [searchParams]);

  useEffect(() => {
    if (promptSentRef.current || !projectLoaded) return;
    const prompt = searchParams.get("prompt");
    if (!prompt) return;

    const timer = setInterval(() => {
      if (!isChatBridgeReady()) return;

      let imageUrls: string[] | undefined;
      try {
        const stored = sessionStorage.getItem("pending_prompt_images");
        if (stored) {
          imageUrls = JSON.parse(stored);
          sessionStorage.removeItem("pending_prompt_images");
        }
      } catch {}

      sendChatMessage(prompt, imageUrls);
      promptSentRef.current = true;
      clearInterval(timer);

      dispatch(setAgentLogVisible(true));

      window.history.replaceState({}, "", window.location.pathname);
    }, 300);

    const timeout = setTimeout(() => {
      clearInterval(timer);
    }, 15000);

    return () => {
      clearInterval(timer);
      clearTimeout(timeout);
    };
  }, [projectLoaded, searchParams, dispatch]);

  if (!projectLoaded) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-canvas-bg">
        <CellProgressLoader />
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full flex-col bg-canvas-bg">
      <div
        className="pointer-events-none absolute left-0 right-0 top-0 z-[5] h-14 bg-gradient-to-b from-canvas-bg/80 to-transparent"
        aria-hidden
      />

      <div className="relative w-full flex-1 overflow-hidden">
        <Canvas />
        <CanvasTopLeft />
        <CanvasTopRight />
        <CanvasBottomLeft />
        <CanvasBottomRight />
        <EditingModeDisplay />
        <CaptureCanvasThumbnail />
      </div>
    </div>
  );
}
