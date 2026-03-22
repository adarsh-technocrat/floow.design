"use client";

import { useSelector } from "react-redux";
import { Canvas } from "@/components/Canvas";
import {
  CanvasBottomLeft,
  CanvasBottomRight,
  CanvasTopLeft,
  CanvasTopRight,
  EditingModeDisplay,
} from "@/components/canvas-layout";
import { useCanvasThumbnail } from "@/hooks/useCanvasThumbnail";
import type { RootState } from "@/store";

export default function ProjectCanvasPage() {
  const projectId = useSelector((s: RootState) => s.project.projectId);
  useCanvasThumbnail(projectId);

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
