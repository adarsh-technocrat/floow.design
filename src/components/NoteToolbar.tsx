"use client";

import React from "react";
import { Minus, Plus, Trash2, Copy } from "lucide-react";
import {
  NOTE_COLORS,
  type NoteColor,
} from "@/store/slices/canvasSlice";

const TOOLBAR_GAP_SCREEN_PX = 48;

interface NoteToolbarProps {
  noteId: string;
  color: NoteColor;
  fontSize: number;
  scale: number;
  canvasScale: number;
  onColorChange: (color: NoteColor) => void;
  onFontSizeChange: (size: number) => void;
  onDelete: () => void;
  onDuplicate: () => void;
}

function ToolbarButton({
  children,
  title,
  onClick,
  active,
}: {
  children: React.ReactNode;
  title?: string;
  onClick?: () => void;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={
        "inline-flex size-7 shrink-0 items-center justify-center rounded-md text-sm outline-none transition-all active:scale-95 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg]:size-3.5 " +
        (active
          ? "bg-btn-primary-bg text-btn-primary-text"
          : "text-t-secondary hover:bg-input-bg hover:text-t-primary")
      }
    >
      {children}
    </button>
  );
}

function ColorDot({
  noteColor,
  active,
  onClick,
}: {
  noteColor: NoteColor;
  active: boolean;
  onClick: () => void;
}) {
  const colors = NOTE_COLORS[noteColor];
  return (
    <button
      type="button"
      onClick={onClick}
      title={noteColor.charAt(0).toUpperCase() + noteColor.slice(1)}
      className="relative inline-flex size-5 shrink-0 items-center justify-center rounded-full transition-all active:scale-90"
      style={{ backgroundColor: colors.bg, borderColor: colors.border, borderWidth: active ? 2 : 1 }}
    >
      {active && (
        <div
          className="size-2 rounded-full"
          style={{ backgroundColor: colors.text }}
        />
      )}
    </button>
  );
}

export function NoteToolbar({
  color,
  fontSize,
  scale,
  canvasScale,
  onColorChange,
  onFontSizeChange,
  onDelete,
  onDuplicate,
}: NoteToolbarProps) {
  const topOffsetPx = TOOLBAR_GAP_SCREEN_PX / canvasScale;
  const colorKeys = Object.keys(NOTE_COLORS) as NoteColor[];

  return (
    <div
      className="pointer-events-auto absolute left-1/2 z-50 flex items-center gap-1.5 rounded-xl border border-b-strong bg-canvas-panel-bg px-2 py-1.5 shadow-lg backdrop-blur-xl"
      style={{
        top: `-${topOffsetPx}px`,
        transform: `translateX(-50%) scale(${scale})`,
        transformOrigin: "center top",
      }}
    >
      {/* Color dots */}
      <div className="flex items-center gap-1">
        {colorKeys.map((c) => (
          <ColorDot
            key={c}
            noteColor={c}
            active={c === color}
            onClick={() => onColorChange(c)}
          />
        ))}
      </div>

      <div className="mx-0.5 h-4 w-px bg-b-primary" />

      {/* Font size controls */}
      <div className="flex items-center gap-0.5">
        <ToolbarButton
          title="Decrease font size"
          onClick={() => onFontSizeChange(Math.max(10, fontSize - 2))}
        >
          <Minus />
        </ToolbarButton>
        <span className="min-w-6 text-center text-[11px] font-mono text-t-secondary tabular-nums">
          {fontSize}
        </span>
        <ToolbarButton
          title="Increase font size"
          onClick={() => onFontSizeChange(Math.min(32, fontSize + 2))}
        >
          <Plus />
        </ToolbarButton>
      </div>

      <div className="mx-0.5 h-4 w-px bg-b-primary" />

      {/* Actions */}
      <ToolbarButton title="Duplicate" onClick={onDuplicate}>
        <Copy />
      </ToolbarButton>
      <ToolbarButton title="Delete" onClick={onDelete}>
        <Trash2 />
      </ToolbarButton>
    </div>
  );
}
