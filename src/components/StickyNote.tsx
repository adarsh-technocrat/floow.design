"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { NoteToolbar } from "@/components/NoteToolbar";
import {
  NOTE_COLORS,
  MIN_NOTE_SIZE,
  type NoteColor,
} from "@/store/slices/canvasSlice";

export interface StickyNoteProps {
  id: string;
  text: string;
  left: number;
  top: number;
  width: number;
  height: number;
  color: NoteColor;
  fontSize: number;
  authorName?: string;
  selected: boolean;
  canvasScale: number;
  spaceHeld: boolean;
  onSelect: (id: string) => void;
  onTextChange: (id: string, text: string) => void;
  onPositionChange: (id: string, left: number, top: number) => void;
  onSizeChange: (
    id: string,
    changes: { left?: number; top?: number; width?: number; height?: number },
  ) => void;
  onColorChange: (id: string, color: NoteColor) => void;
  onFontSizeChange: (id: string, size: number) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
}

type ResizeHandle = "nw" | "ne" | "sw" | "se" | "n" | "s" | "e" | "w";

function ResizeHandleDot({
  corner,
  onPointerDown,
}: {
  corner: "nw" | "ne" | "sw" | "se";
  onPointerDown: (e: React.PointerEvent, corner: ResizeHandle) => void;
}) {
  const cursor =
    corner === "nw" || corner === "se" ? "nwse-resize" : "nesw-resize";
  const position =
    corner === "nw"
      ? "left-0 top-0 -translate-x-1/2 -translate-y-1/2"
      : corner === "ne"
        ? "right-0 top-0 translate-x-1/2 -translate-y-1/2"
        : corner === "sw"
          ? "left-0 bottom-0 -translate-x-1/2 translate-y-1/2"
          : "right-0 bottom-0 translate-x-1/2 translate-y-1/2";

  return (
    <div
      className={`absolute z-50 size-3 shrink-0 rounded-[1px] border-2 bg-white shadow-none ${position}`}
      style={{ cursor, borderColor: "#8B7CFF" }}
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
}: {
  edge: "e" | "w" | "n" | "s";
  onPointerDown: (e: React.PointerEvent, handle: ResizeHandle) => void;
}) {
  const isHorizontal = edge === "n" || edge === "s";
  const cursor = isHorizontal ? "ns-resize" : "ew-resize";
  const style: React.CSSProperties = isHorizontal
    ? {
        left: "10%",
        width: "80%",
        height: "8px",
        ...(edge === "n"
          ? { top: 0, transform: "translateY(-50%)" }
          : { bottom: 0, transform: "translateY(50%)" }),
      }
    : {
        top: "10%",
        height: "80%",
        width: "8px",
        ...(edge === "w"
          ? { left: 0, transform: "translateX(-50%)" }
          : { right: 0, transform: "translateX(50%)" }),
      };

  return (
    <div
      className="absolute z-50"
      style={{ cursor, ...style }}
      onPointerDown={(e) => {
        e.stopPropagation();
        onPointerDown(e, edge);
      }}
      aria-hidden
    />
  );
}

export const StickyNote = React.memo(function StickyNote({
  id,
  text,
  left,
  top,
  width,
  height,
  color,
  fontSize,
  authorName,
  selected,
  canvasScale,
  spaceHeld,
  onSelect,
  onTextChange,
  onPositionChange,
  onSizeChange,
  onColorChange,
  onFontSizeChange,
  onDelete,
  onDuplicate,
}: StickyNoteProps) {
  const noteRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const dragStartRef = useRef<{
    mouseX: number;
    mouseY: number;
    left: number;
    top: number;
  } | null>(null);
  const resizeStartRef = useRef<{
    mouseX: number;
    mouseY: number;
    left: number;
    top: number;
    width: number;
    height: number;
    handle: ResizeHandle;
  } | null>(null);

  const colors = NOTE_COLORS[color];

  // Focus textarea when note is first created (empty text + selected)
  useEffect(() => {
    if (selected && text === "" && textareaRef.current) {
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
  }, [selected, text]);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (e.button !== 0 || spaceHeld) return;
      // Don't start drag when clicking toolbar buttons or resize handles
      const target = e.target as HTMLElement;
      if (
        target.closest?.("[data-note-toolbar]") ||
        target.closest?.("[data-resize-handle]")
      )
        return;
      e.stopPropagation();
      onSelect(id);

      if (isEditing) return;

      dragStartRef.current = {
        mouseX: e.clientX,
        mouseY: e.clientY,
        left,
        top,
      };
      setIsDragging(true);
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    },
    [id, left, top, spaceHeld, onSelect, isEditing],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (dragStartRef.current) {
        const dx = (e.clientX - dragStartRef.current.mouseX) / canvasScale;
        const dy = (e.clientY - dragStartRef.current.mouseY) / canvasScale;
        onPositionChange(
          id,
          dragStartRef.current.left + dx,
          dragStartRef.current.top + dy,
        );
        return;
      }
      if (resizeStartRef.current) {
        const r = resizeStartRef.current;
        const dx = (e.clientX - r.mouseX) / canvasScale;
        const dy = (e.clientY - r.mouseY) / canvasScale;
        const handle = r.handle;

        let newLeft = r.left;
        let newTop = r.top;
        let newWidth = r.width;
        let newHeight = r.height;

        if (handle.includes("e"))
          newWidth = Math.max(MIN_NOTE_SIZE, r.width + dx);
        if (handle.includes("w")) {
          newWidth = Math.max(MIN_NOTE_SIZE, r.width - dx);
          newLeft = r.left + r.width - newWidth;
        }
        if (handle.includes("s"))
          newHeight = Math.max(MIN_NOTE_SIZE, r.height + dy);
        if (handle.includes("n")) {
          newHeight = Math.max(MIN_NOTE_SIZE, r.height - dy);
          newTop = r.top + r.height - newHeight;
        }

        onSizeChange(id, {
          left: newLeft,
          top: newTop,
          width: newWidth,
          height: newHeight,
        });
      }
    },
    [id, canvasScale, onPositionChange, onSizeChange],
  );

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    dragStartRef.current = null;
    resizeStartRef.current = null;
    setIsDragging(false);
    (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
  }, []);

  const handleResizePointerDown = useCallback(
    (e: React.PointerEvent, handle: ResizeHandle) => {
      e.stopPropagation();
      resizeStartRef.current = {
        mouseX: e.clientX,
        mouseY: e.clientY,
        left,
        top,
        width,
        height,
        handle,
      };
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    },
    [left, top, width, height],
  );

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
    setTimeout(() => textareaRef.current?.focus(), 0);
  }, []);

  const handleTextBlur = useCallback(() => {
    setIsEditing(false);
  }, []);

  return (
    <div
      ref={noteRef}
      data-note
      data-note-id={id}
      className={`absolute shrink-0 select-none ${isDragging ? "cursor-grabbing" : "cursor-grab"}`}
      style={{
        left: `${left}px`,
        top: `${top}px`,
        width: `${width}px`,
        height: `${height}px`,
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onDoubleClick={handleDoubleClick}
    >
      {/* Note body */}
      <div
        className="absolute inset-0 rounded-lg shadow-md transition-shadow"
        style={{
          backgroundColor: colors.bg,
          borderWidth: selected ? 2 : 1,
          borderColor: selected ? "#8B7CFF" : colors.border,
          boxShadow: selected
            ? "0 4px 20px rgba(139,124,255,0.15), 0 2px 8px rgba(0,0,0,0.08)"
            : "0 2px 8px rgba(0,0,0,0.08)",
        }}
      >
        {/* Folded corner effect */}
        <div
          className="absolute right-0 top-0 size-5 rounded-bl-md"
          style={{
            background: `linear-gradient(135deg, transparent 50%, ${colors.border} 50%)`,
            opacity: 0.5,
          }}
        />

        {/* Text content */}
        <div className="absolute inset-0 flex flex-col p-3 overflow-hidden">
          {isEditing ? (
            <textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => onTextChange(id, e.target.value)}
              onBlur={handleTextBlur}
              onPointerDown={(e) => e.stopPropagation()}
              className="w-full flex-1 resize-none bg-transparent outline-none p-0 m-0 border-none whitespace-pre-wrap break-words"
              style={{
                color: colors.text,
                fontSize: `${fontSize}px`,
                lineHeight: 1.4,
                fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
                letterSpacing: "normal",
              }}
              placeholder="Type something..."
            />
          ) : (
            <div
              className="w-full flex-1 overflow-hidden whitespace-pre-wrap break-words"
              style={{
                color: colors.text,
                fontSize: `${fontSize}px`,
                lineHeight: 1.4,
                fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
                letterSpacing: "normal",
              }}
            >
              {text || (
                <span style={{ opacity: 0.5 }}>Double-click to edit</span>
              )}
            </div>
          )}
          {authorName && (
            <div
              className="mt-auto pt-1 text-right truncate"
              style={{
                fontSize: "10px",
                opacity: 0.55,
                color: colors.text,
                fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
              }}
            >
              — {authorName}
            </div>
          )}
        </div>
      </div>

      {/* Selection border + resize handles + toolbar */}
      {selected && (
        <>
          <ResizeHandleDot
            corner="nw"
            onPointerDown={handleResizePointerDown}
          />
          <ResizeHandleDot
            corner="ne"
            onPointerDown={handleResizePointerDown}
          />
          <ResizeHandleDot
            corner="sw"
            onPointerDown={handleResizePointerDown}
          />
          <ResizeHandleDot
            corner="se"
            onPointerDown={handleResizePointerDown}
          />
          <EdgeResizeHandle edge="n" onPointerDown={handleResizePointerDown} />
          <EdgeResizeHandle edge="s" onPointerDown={handleResizePointerDown} />
          <EdgeResizeHandle edge="e" onPointerDown={handleResizePointerDown} />
          <EdgeResizeHandle edge="w" onPointerDown={handleResizePointerDown} />
          <NoteToolbar
            noteId={id}
            color={color}
            fontSize={fontSize}
            scale={1 / canvasScale}
            canvasScale={canvasScale}
            onColorChange={(c) => onColorChange(id, c)}
            onFontSizeChange={(s) => onFontSizeChange(id, s)}
            onDelete={() => onDelete(id)}
            onDuplicate={() => onDuplicate(id)}
          />
        </>
      )}
    </div>
  );
});
