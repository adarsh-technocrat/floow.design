"use client";

import { useEffect, useRef, useState } from "react";
import { useAppSelector } from "@/store/hooks";
import { FRAME_WIDTH, FRAME_HEIGHT } from "@/lib/canvas-utils";

// ─── Cursor position store ────────────────────────────────────────────────
// Module-level map: frameId → last element rect (in iframe viewport coords)
const cursorPositions = new Map<
  string,
  { left: number; top: number; width: number; height: number }
>();

let positionListeners: Array<() => void> = [];

function subscribeToCursorPositions(cb: () => void) {
  positionListeners.push(cb);
  return () => {
    positionListeners = positionListeners.filter((l) => l !== cb);
  };
}

function notifyListeners() {
  for (const l of positionListeners) l();
}

// Global message listener (installed once)
let listenerInstalled = false;
function installGlobalListener() {
  if (listenerInstalled) return;
  listenerInstalled = true;
  window.addEventListener("message", (e: MessageEvent) => {
    if (e.data?.type !== "cursor-element-track") return;
    const { frameId, rect } = e.data;
    if (!frameId || !rect) return;
    cursorPositions.set(frameId, rect);
    notifyListeners();
  });
}

// ─── Cursor SVG ───────────────────────────────────────────────────────────

function CursorSvg({ color }: { color: string }) {
  return (
    <svg
      width="16"
      height="20"
      viewBox="0 0 16 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="drop-shadow-md"
    >
      <path
        d="M1.5 1L5.5 18L8.5 11L15 9.5L1.5 1Z"
        fill={color}
        stroke="white"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ─── Component ────────────────────────────────────────────────────────────

export function AgentCursors() {
  const agents = useAppSelector((s) => s.agent.agents);
  const frames = useAppSelector((s) => s.canvas.frames);
  const [cursorUpdateTick, setCursorUpdateTick] = useState(0);
  const [lastValidPositions, setLastValidPositions] = useState(
    () => new Map<string, { x: number; y: number }>(),
  );
  const lastValidPositionsRef = useRef(
    new Map<string, { x: number; y: number }>(),
  );

  // Install the global postMessage listener
  useEffect(() => {
    installGlobalListener();
  }, []);

  // Subscribe to position updates from iframes
  useEffect(() => {
    return subscribeToCursorPositions(() => {
      setCursorUpdateTick((n) => n + 1);
    });
  }, []);

  // Persist last valid cursor positions when we have valid rects (no ref read during render)
  useEffect(() => {
    const prev = lastValidPositionsRef.current;
    const next = new Map(prev);
    agents
      .filter((a) => a.status === "working" && a.activeFrameId)
      .forEach((agent) => {
        const frame = frames.find((f) => f.id === agent.activeFrameId);
        if (!frame) return;
        const rect = cursorPositions.get(frame.id);
        if (rect && (rect.width >= 1 || rect.height >= 1)) {
          const frameW = frame.width ?? FRAME_WIDTH;
          const frameH = frame.height ?? FRAME_HEIGHT;
          let x = frame.left + rect.left + rect.width;
          let y = frame.top + rect.top + rect.height * 0.5;
          x = Math.min(x, frame.left + frameW + 12);
          x = Math.max(x, frame.left);
          y = Math.min(y, frame.top + frameH - 20);
          y = Math.max(y, frame.top + 20);
          next.set(agent.id, { x, y });
        }
      });
    lastValidPositionsRef.current = next;
    setLastValidPositions(next);
  }, [agents, frames, cursorUpdateTick]);

  const visibleAgents = agents.filter(
    (a) => a.status === "working" && a.activeFrameId,
  );

  if (visibleAgents.length === 0) return null;

  return (
    <>
      {visibleAgents.map((agent) => {
        const frame = frames.find((f) => f.id === agent.activeFrameId);
        if (!frame) return null;

        const frameW = frame.width ?? FRAME_WIDTH;
        const frameH = frame.height ?? FRAME_HEIGHT;

        // Get the tracked element position from the iframe
        const elemRect = cursorPositions.get(frame.id);
        const lastValid = lastValidPositions.get(agent.id);

        let cursorX: number;
        let cursorY: number;

        const isValidRect =
          elemRect && (elemRect.width >= 1 || elemRect.height >= 1);

        if (isValidRect) {
          // elemRect is in iframe viewport coords (0,0 = top-left of iframe)
          // Map to canvas content coords (frame.left + elemRect position)
          cursorX = frame.left + elemRect.left + elemRect.width;
          cursorY = frame.top + elemRect.top + elemRect.height * 0.5;

          // Clamp within frame bounds
          cursorX = Math.min(cursorX, frame.left + frameW + 12);
          cursorX = Math.max(cursorX, frame.left);
          cursorY = Math.min(cursorY, frame.top + frameH - 20);
          cursorY = Math.max(cursorY, frame.top + 20);
        } else if (lastValid) {
          // Keep cursor at last valid position instead of jumping to (0,0) or frame center
          cursorX = lastValid.x;
          cursorY = lastValid.y;
        } else {
          // Fallback: position at frame center-top while waiting for first report
          cursorX = frame.left + frameW * 0.5;
          cursorY = frame.top + 80;
        }

        return (
          <div
            key={agent.id}
            className="pointer-events-none absolute z-[60]"
            style={{
              left: cursorX,
              top: cursorY,
              transition:
                "left 0.45s cubic-bezier(0.22, 1, 0.36, 1), top 0.4s cubic-bezier(0.22, 1, 0.36, 1)",
              willChange: "left, top",
            }}
          >
            {/* Cursor arrow */}
            <CursorSvg color={agent.color} />

            {/* Name label */}
            <div
              className="ml-3.5 -mt-0.5 flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold text-white shadow-lg"
              style={{ backgroundColor: agent.color }}
            >
              {agent.name}
            </div>
          </div>
        );
      })}
    </>
  );
}
