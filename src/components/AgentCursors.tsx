"use client";

import { useEffect, useRef, useCallback, useMemo } from "react";
import { useAppSelector } from "@/store/hooks";
import { FRAME_WIDTH, FRAME_HEIGHT } from "@/lib/canvas-utils";
import type { AgentInstance } from "@/store/slices/agentSlice";
import { AGENT_PERSONAS } from "@/constants/agent-personas";

export interface CursorElementInfo {
  left: number;
  top: number;
  width: number;
  height: number;
  elementId: string;
}

export const cursorPositions = new Map<string, CursorElementInfo>();

let positionListeners: Array<() => void> = [];

export function subscribeToCursorPositions(cb: () => void) {
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
    const { frameId, rect, elementId } = e.data;
    if (!frameId || !rect) return;
    cursorPositions.set(frameId, { ...rect, elementId: elementId || "" });
    notifyListeners();
  });
}

// ─── Lerp helper for smooth human-like movement ──────────────────────────

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

// ─── Single cursor component (pure DOM) ──────────────────────────────────

function AgentCursor({
  agent,
  frames,
}: {
  agent: AgentInstance;
  frames: Array<{
    id: string;
    label: string;
    left: number;
    top: number;
    width?: number;
    height?: number;
  }>;
}) {
  const elRef = useRef<HTMLDivElement>(null);
  // Current animated position
  const currentPos = useRef({ x: 0, y: 0 });
  // Target position to animate towards
  const targetPos = useRef({ x: 0, y: 0 });
  // Whether we've set an initial position yet
  const hasInitialized = useRef(false);
  // rAF handle
  const rafRef = useRef<number>(0);
  // Last valid position (so cursor doesn't jump to 0,0)
  const lastValidPos = useRef<{ x: number; y: number } | null>(null);

  // Compute target position from frame + element rect
  const computeTarget = useCallback(() => {
    const frame = frames.find((f) => f.id === agent.activeFrameId);
    if (!frame) return lastValidPos.current;

    const frameW = frame.width ?? FRAME_WIDTH;
    const frameH = frame.height ?? FRAME_HEIGHT;
    const elemRect = cursorPositions.get(frame.id);
    const isValid = elemRect && (elemRect.width >= 1 || elemRect.height >= 1);

    if (isValid) {
      let x = frame.left + elemRect.left + elemRect.width;
      let y = frame.top + elemRect.top + elemRect.height * 0.5;
      x = Math.max(frame.left, Math.min(x, frame.left + frameW + 12));
      y = Math.max(frame.top + 20, Math.min(y, frame.top + frameH - 20));
      const pos = { x, y };
      lastValidPos.current = pos;
      return pos;
    }

    if (lastValidPos.current) return lastValidPos.current;

    // Fallback: center-top of frame
    const fallback = { x: frame.left + frameW * 0.5, y: frame.top + 80 };
    lastValidPos.current = fallback;
    return fallback;
  }, [agent.activeFrameId, frames]);

  // Animation loop — lerp towards target for smooth organic movement
  useEffect(() => {
    let running = true;
    let lastTime = 0;

    const tick = (time: number) => {
      if (!running) return;

      const dt = lastTime ? Math.min((time - lastTime) / 1000, 0.05) : 0.016;
      lastTime = time;

      const el = elRef.current;
      if (!el) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      // Smooth factor: higher = snappier. ~4-6 feels human-like.
      const speed = 4.5;
      const t = 1 - Math.exp(-speed * dt);

      const tx = targetPos.current.x;
      const ty = targetPos.current.y;
      const cx = currentPos.current.x;
      const cy = currentPos.current.y;

      const dx = Math.abs(tx - cx);
      const dy = Math.abs(ty - cy);

      // Skip lerp if close enough (< 0.5px)
      if (dx < 0.5 && dy < 0.5) {
        currentPos.current.x = tx;
        currentPos.current.y = ty;
      } else {
        currentPos.current.x = lerp(cx, tx, t);
        currentPos.current.y = lerp(cy, ty, t);
      }

      el.style.transform = `translate3d(${currentPos.current.x}px, ${currentPos.current.y}px, 0)`;

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      running = false;
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // Listen to cursor position updates and recompute target (pure DOM, no state)
  useEffect(() => {
    const update = () => {
      const pos = computeTarget();
      if (!pos) return;

      if (!hasInitialized.current) {
        // Snap to initial position (no animation on first placement)
        hasInitialized.current = true;
        currentPos.current = { ...pos };
        targetPos.current = { ...pos };
        const el = elRef.current;
        if (el) {
          el.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0)`;
        }
      } else {
        targetPos.current = { ...pos };
      }
    };

    // Compute immediately
    update();

    // Subscribe to iframe position updates
    return subscribeToCursorPositions(update);
  }, [computeTarget]);

  // Also recompute when activeFrameId changes (agent moved to new frame)
  useEffect(() => {
    const pos = computeTarget();
    if (pos) {
      targetPos.current = { ...pos };
    }
  }, [agent.activeFrameId, computeTarget]);

  return (
    <div
      ref={elRef}
      className="pointer-events-none absolute left-0 top-0 z-[60]"
      style={{
        willChange: "transform",
      }}
    >
      {/* Cursor arrow */}
      <svg
        width="24"
        height="30"
        viewBox="0 0 16 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="drop-shadow-lg"
      >
        <path
          d="M1.5 1L5.5 18L8.5 11L15 9.5L1.5 1Z"
          fill={agent.color}
          stroke="white"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>

      {/* Name label */}
      <div
        className="ml-4 -mt-0.5 flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold text-white shadow-lg"
        style={{ backgroundColor: agent.color }}
      >
        {agent.name}
      </div>
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────

const SINGLE_AGENT_VIRTUAL_ID = "main";

export function AgentCursors() {
  const agents = useAppSelector((s) => s.agent.agents);
  const frames = useAppSelector((s) => s.canvas.frames);
  const mainChatActiveFrameId = useAppSelector(
    (s) => s.agent.mainChatActiveFrameId,
  );
  const mainChatStatus = useAppSelector((s) => s.agent.mainChatStatus);

  // Install the global postMessage listener once
  useEffect(() => {
    installGlobalListener();
  }, []);

  const visibleAgents = useMemo(() => {
    const fromStore = agents.filter(
      (a) => a.status === "working" && a.activeFrameId,
    );
    if (fromStore.length > 0) return fromStore;
    if (
      agents.length === 0 &&
      mainChatStatus === "working" &&
      mainChatActiveFrameId
    ) {
      const persona = AGENT_PERSONAS[0];
      return [
        {
          id: SINGLE_AGENT_VIRTUAL_ID,
          name: persona.name,
          emoji: persona.emoji,
          color: persona.color,
          subTask: "",
          assignedScreens: [],
          screenPositions: [],
          status: "working" as const,
          chatId: "main",
          activeFrameId: mainChatActiveFrameId,
          cursorProgress: 0,
        } as AgentInstance,
      ];
    }
    return [];
  }, [agents, mainChatStatus, mainChatActiveFrameId]);

  if (visibleAgents.length === 0) return null;

  return (
    <>
      {visibleAgents.map((agent) => (
        <AgentCursor key={agent.id} agent={agent} frames={frames} />
      ))}
    </>
  );
}
