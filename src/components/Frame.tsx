"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { FrameToolbar } from "@/components/FrameToolbar";
import FrameElementInspectionOverlay from "@/components/frame/element-inspection/FrameElementInspectionOverlay";
import { useAppSelector } from "@/store/hooks";
import {
  subscribeGeneratingFrames,
  getSelectedElementContext,
  setSelectedElementContext,
} from "@/lib/chat-bridge";
import type { OnElementSelectedPayload } from "@/components/frame/element-inspection/FrameElementInspectionOverlay";
import {
  useFrameInteraction,
  type ResizeHandle,
  MIN_FRAME_WIDTH,
  MIN_FRAME_HEIGHT,
} from "@/hooks/useFrameInteraction";
import { FRAME_WIDTH, FRAME_HEIGHT } from "@/lib/canvas-utils";

const PHONE_PATH_D =
  "M 334 0 c 45.255 0 67.882 0 81.941 14.059 c 14.059 14.059 14.059 36.686 14.059 81.941 L 430 836 c 0 45.255 0 67.882 -14.059 81.941 c -14.059 14.059 -36.686 14.059 -81.941 14.059 L 96 932 c -45.255 0 -67.882 0 -81.941 -14.059 c -14.059 -14.059 -14.059 -36.686 -14.059 -81.941 L 0 96 c 0 -45.255 0 -67.882 14.059 -81.941 c 14.059 -14.059 36.686 -14.059 81.941 -14.059 Z";

function ResizeHandleDot({
  corner,
  onPointerDown,
  scale = 1,
}: {
  corner: ResizeHandle;
  onPointerDown: (e: React.PointerEvent, corner: ResizeHandle) => void;
  scale?: number;
}) {
  const cursor =
    corner === "nw" || corner === "se" ? "nwse-resize" : "nesw-resize";
  const size = 12 * scale;
  const offset = -(size / 2);
  const posStyle: React.CSSProperties =
    corner === "nw"
      ? { left: offset, top: offset }
      : corner === "ne"
        ? { right: offset, top: offset }
        : corner === "sw"
          ? { left: offset, bottom: offset }
          : { right: offset, bottom: offset };

  return (
    <div
      className="absolute z-50 shrink-0 rounded-[1px] bg-white shadow-none"
      style={{
        cursor,
        width: size,
        height: size,
        border: `${2 * scale}px solid #8B7CFF`,
        ...posStyle,
      }}
      data-resize-handle={corner}
      onPointerDown={(e) => {
        e.stopPropagation();
        onPointerDown(e, corner);
      }}
      aria-hidden
    />
  );
}

function EdgeResizeHandle({
  edge,
  onPointerDown,
  scale = 1,
}: {
  edge: "e" | "w" | "n" | "s";
  onPointerDown: (e: React.PointerEvent, corner: ResizeHandle) => void;
  scale?: number;
}) {
  const isHorizontal = edge === "n" || edge === "s";
  const cursor = isHorizontal ? "ns-resize" : "ew-resize";
  const hitSize = 8 * scale;
  const style: React.CSSProperties = isHorizontal
    ? {
        left: "10%",
        width: "80%",
        height: hitSize,
        ...(edge === "n"
          ? { top: 0, transform: "translateY(-50%)" }
          : { bottom: 0, transform: "translateY(50%)" }),
      }
    : {
        top: "10%",
        height: "80%",
        width: hitSize,
        ...(edge === "w"
          ? { left: 0, transform: "translateX(-50%)" }
          : { right: 0, transform: "translateX(50%)" }),
      };

  return (
    <div
      className="absolute z-50"
      style={{ cursor, ...style }}
      data-resize-handle={edge}
      onPointerDown={(e) => {
        e.stopPropagation();
        onPointerDown(e, edge);
      }}
      aria-hidden
    />
  );
}

function DragHandleIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="1em"
      height="1em"
      fill="currentColor"
      viewBox="0 0 256 256"
      className="size-4 shrink-0"
    >
      <path d="M104,60A12,12,0,1,1,92,48,12,12,0,0,1,104,60Zm60,12a12,12,0,1,0-12-12A12,12,0,0,0,164,72ZM92,116a12,12,0,1,0,12,12A12,12,0,0,0,92,116Zm72,0a12,12,0,1,0,12,12A12,12,0,0,0,164,116ZM92,184a12,12,0,1,0,12,12A12,12,0,0,0,92,184Zm72,0a12,12,0,1,0,12,12A12,12,0,0,0,164,184Z" />
    </svg>
  );
}

export interface FrameProps {
  id: string;
  label: string;
  html?: string;
  left: number;
  top?: number;
  width?: number;
  height?: number;
  selected?: boolean;
  onSelect?: (id: string, metaKey: boolean) => void;
  showToolbar?: boolean;
  canvasScale?: number;
  onPositionChange?: (newLeft: number, newTop: number) => void;
  onSizeChange?: (changes: {
    left?: number;
    top?: number;
    width?: number;
    height?: number;
  }) => void;
  spaceHeld?: boolean;
  onWheelForZoom?: (e: {
    clientX: number;
    clientY: number;
    deltaY: number;
  }) => void;
  children?: React.ReactNode;
}

export const Frame = React.memo(function Frame({
  id,
  label,
  html = "",
  left,
  top = -500,
  width: widthProp,
  height: heightProp,
  selected = false,
  onSelect,
  showToolbar: showToolbarProp = undefined,
  canvasScale = 0.556382,
  onPositionChange,
  onSizeChange,
  spaceHeld = false,
  onWheelForZoom,
  children,
}: FrameProps) {
  const width = widthProp ?? FRAME_WIDTH;
  const height = heightProp ?? FRAME_HEIGHT;
  const frameRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  useEffect(() => {
    return subscribeGeneratingFrames(() => {});
  }, [id]);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const [stableSelected, setStableSelected] = useState(selected);
  const hideSelectedRafRef = useRef<number | null>(null);
  const showToolbar = showToolbarProp ?? stableSelected;
  const [stableShowToolbar, setStableShowToolbar] = useState(showToolbar);
  const hideToolbarRafRef = useRef<number | null>(null);
  const mainChatActiveFrameId = useAppSelector(
    (s) => s.agent.mainChatActiveFrameId,
  );
  const mainChatStatus = useAppSelector((s) => s.agent.mainChatStatus);
  const isActiveAgentFrame =
    mainChatStatus === "working" && mainChatActiveFrameId === id;
  const enableElementInspection =
    (stableShowToolbar ?? false) || isActiveAgentFrame;

  const handleElementSelected = useCallback(
    (info: OnElementSelectedPayload) => {
      if (info.selectedElement) {
        setSelectedElementContext({
          frameId: id,
          frameLabel: label,
          elementId: info.selectedElement.elementId,
          tagName: info.selectedElement.tagName,
          text: info.selectedElement.text,
          innerHTML: info.selectedElement.innerHTML,
        });
      } else {
        setSelectedElementContext(null);
      }
    },
    [id, label],
  );

  useEffect(() => {
    if (stableShowToolbar) return;
    const ctx = getSelectedElementContext();
    if (ctx?.frameId === id) {
      setSelectedElementContext(null);
    }
  }, [stableShowToolbar, id]);

  useEffect(() => {
    return () => {
      const ctx = getSelectedElementContext();
      if (ctx?.frameId === id) {
        setSelectedElementContext(null);
      }
    };
  }, [id]);

  useEffect(() => {
    if (hideSelectedRafRef.current != null) {
      cancelAnimationFrame(hideSelectedRafRef.current);
      hideSelectedRafRef.current = null;
    }
    if (selected) {
      setStableSelected(true);
      return;
    }
    // Keep selected state for two frames to avoid one-frame border blink.
    hideSelectedRafRef.current = requestAnimationFrame(() => {
      hideSelectedRafRef.current = requestAnimationFrame(() => {
        hideSelectedRafRef.current = null;
        setStableSelected(false);
      });
    });
    return () => {
      if (hideSelectedRafRef.current != null) {
        cancelAnimationFrame(hideSelectedRafRef.current);
        hideSelectedRafRef.current = null;
      }
    };
  }, [selected]);

  useEffect(() => {
    if (hideToolbarRafRef.current != null) {
      cancelAnimationFrame(hideToolbarRafRef.current);
      hideToolbarRafRef.current = null;
    }
    if (showToolbar) {
      setStableShowToolbar(true);
      return;
    }
    // Smooth out transient selection toggles that cause visible blink.
    hideToolbarRafRef.current = requestAnimationFrame(() => {
      hideToolbarRafRef.current = requestAnimationFrame(() => {
        hideToolbarRafRef.current = null;
        setStableShowToolbar(false);
      });
    });
    return () => {
      if (hideToolbarRafRef.current != null) {
        cancelAnimationFrame(hideToolbarRafRef.current);
        hideToolbarRafRef.current = null;
      }
    };
  }, [showToolbar]);

  /* eslint-disable react-hooks/refs -- iframeRef is forwarded to child for element inspection */
  const childrenWithInspection = useMemo(() => {
    if (children == null) return children;
    const child = React.Children.only(children);
    if (!React.isValidElement(child)) return children;
    return React.cloneElement(
      child as React.ReactElement<{
        iframeRef?: React.RefObject<HTMLIFrameElement | null>;
        enableElementInspection?: boolean;
      }>,
      {
        iframeRef,
        enableElementInspection,
      },
    );
  }, [children, enableElementInspection]);
  /* eslint-enable react-hooks/refs */

  const {
    isDragging,
    zoomModifierHeld,
    wheelOverlayRef,
    handleContentPointerDown,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handleResizePointerDown,
  } = useFrameInteraction({
    frameRef,
    id,
    left,
    top,
    width,
    height,
    canvasScale,
    spaceHeld,
    onSelect,
    onPositionChange,
    onSizeChange,
    onWheelForZoom,
    selected,
  });

  return (
    <div
      ref={frameRef}
      data-frame
      className={`absolute shrink-0 select-none ${isDragging ? "cursor-grabbing" : ""}`}
      style={{
        left: `${left}px`,
        top: `${top}px`,
        width: `${width}px`,
        height: `${height}px`,
        minWidth: MIN_FRAME_WIDTH,
        minHeight: MIN_FRAME_HEIGHT,
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden>
        <defs>
          <clipPath
            id={`frame-phone-clip-${id}`}
            clipPathUnits="objectBoundingBox"
            transform={`scale(${1 / FRAME_WIDTH}, ${1 / FRAME_HEIGHT})`}
          >
            <path d={PHONE_PATH_D} />
          </clipPath>
        </defs>
      </svg>
      <div
        className="absolute inset-0 isolate will-change-transform filter-[drop-shadow(0_0_2px_rgb(212_212_216))] dark:filter-[drop-shadow(0_0_2px_rgb(113_113_122))]"
        style={{
          width: `${width}px`,
          height: `${height}px`,
        }}
      >
        <div
          className="absolute inset-0 overflow-hidden"
          style={{
            backgroundColor: "#0a0a0a",
            clipPath: `url(#frame-phone-clip-${id})`,
          }}
          {...(onWheelForZoom && { "data-frame-zoom": "true" })}
          onPointerDown={handleContentPointerDown}
        >
          {childrenWithInspection ?? (
            <div className="size-full" title="Canvas Frame" />
          )}
          {stableShowToolbar && (
            <FrameElementInspectionOverlay
              iframeRef={iframeRef}
              overlayRef={overlayRef}
              enabled={true}
              zoom={canvasScale}
              onElementSelected={handleElementSelected}
            />
          )}
          {onWheelForZoom && (
            <div
              ref={wheelOverlayRef}
              className="absolute inset-0 z-50"
              style={{
                pointerEvents: zoomModifierHeld ? "auto" : "none",
              }}
              aria-hidden
            />
          )}
        </div>
      </div>
      <div className="pointer-events-none absolute inset-0 z-40" />

      {isHovered && !stableSelected && !isDragging && (
        <svg
          className="pointer-events-none absolute z-20"
          style={{
            inset: `${-3 / canvasScale}px`,
            width: `calc(100% + ${6 / canvasScale}px)`,
            height: `calc(100% + ${6 / canvasScale}px)`,
          }}
          aria-hidden
        >
          <rect
            x={1 / canvasScale}
            y={1 / canvasScale}
            width={`calc(100% - ${2 / canvasScale}px)`}
            height={`calc(100% - ${2 / canvasScale}px)`}
            fill="none"
            stroke="#8B7CFF"
            strokeWidth={2 / canvasScale}
            strokeOpacity={0.4}
            rx="0"
          />
        </svg>
      )}

      {stableSelected && !stableShowToolbar && !isDragging && (
        <svg
          className="pointer-events-none absolute z-30"
          style={{
            inset: `${-5 / canvasScale}px`,
            width: `calc(100% + ${10 / canvasScale}px)`,
            height: `calc(100% + ${10 / canvasScale}px)`,
          }}
          aria-hidden
        >
          <rect
            x={1.5 / canvasScale}
            y={1.5 / canvasScale}
            width={`calc(100% - ${3 / canvasScale}px)`}
            height={`calc(100% - ${3 / canvasScale}px)`}
            fill="none"
            stroke="#8B7CFF"
            strokeWidth={3 / canvasScale}
            strokeDasharray={`${10 / canvasScale} ${7 / canvasScale}`}
            rx="0"
          />
        </svg>
      )}

      {stableShowToolbar && (
        <>
          {!isDragging && (
            <svg
              className="pointer-events-none absolute z-30"
              style={{
                inset: `${-5 / canvasScale}px`,
                width: `calc(100% + ${10 / canvasScale}px)`,
                height: `calc(100% + ${10 / canvasScale}px)`,
              }}
              aria-hidden
            >
              <rect
                x={1.5 / canvasScale}
                y={1.5 / canvasScale}
                width={`calc(100% - ${3 / canvasScale}px)`}
                height={`calc(100% - ${3 / canvasScale}px)`}
                fill="none"
                stroke="#8B7CFF"
                strokeWidth={3 / canvasScale}
                strokeDasharray={`${10 / canvasScale} ${7 / canvasScale}`}
                rx="0"
              />
            </svg>
          )}
          <ResizeHandleDot
            corner="nw"
            scale={1 / canvasScale}
            onPointerDown={handleResizePointerDown}
          />
          <ResizeHandleDot
            corner="ne"
            scale={1 / canvasScale}
            onPointerDown={handleResizePointerDown}
          />
          <ResizeHandleDot
            corner="sw"
            scale={1 / canvasScale}
            onPointerDown={handleResizePointerDown}
          />
          <ResizeHandleDot
            corner="se"
            scale={1 / canvasScale}
            onPointerDown={handleResizePointerDown}
          />
          <EdgeResizeHandle
            edge="w"
            scale={1 / canvasScale}
            onPointerDown={handleResizePointerDown}
          />
          <EdgeResizeHandle
            edge="e"
            scale={1 / canvasScale}
            onPointerDown={handleResizePointerDown}
          />
          <EdgeResizeHandle
            edge="n"
            scale={1 / canvasScale}
            onPointerDown={handleResizePointerDown}
          />
          <EdgeResizeHandle
            edge="s"
            scale={1 / canvasScale}
            onPointerDown={handleResizePointerDown}
          />
          <FrameToolbar
            label={label}
            html={html}
            scale={1 / canvasScale}
            canvasScale={canvasScale}
          />
        </>
      )}

      <div
        className="absolute left-0 flex items-center gap-3 truncate whitespace-nowrap text-sm"
        style={{
          transform: `scale(${1 / canvasScale})`,
          top: `${-30 / canvasScale}px`,
          transformOrigin: "left top",
          visibility: stableShowToolbar ? "hidden" : "visible",
        }}
      >
        <div
          className="flex cursor-grab select-none items-center gap-1 truncate"
          style={{ width: 239.244 }}
        >
          <span data-drag-handle className="cursor-grab">
            <DragHandleIcon />
          </span>
          <div className="min-w-18 flex flex-1 flex-col gap-2 truncate">
            <div
              className="relative inline-block min-w-0 cursor-default select-none truncate rounded border border-transparent py-0 text-sm hover:text-(--foreground-muted)"
              role="button"
              tabIndex={0}
            >
              {label}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
