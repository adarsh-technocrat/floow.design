"use client";

import { Copy, Trash2 } from "lucide-react";
import { SectionalEditIcon } from "@/lib/svg-icons";

interface SelectionToastProps {
  message: string;
  onCopy?: () => void;
  onDelete?: () => void;
}

export function SelectionToast({
  message,
  onCopy,
  onDelete,
}: SelectionToastProps) {
  const btnClass =
    "group shrink-0 inline-flex size-8 items-center justify-center rounded-md border border-b-strong bg-surface-elevated opacity-100 transition-colors duration-200 hover:bg-input-bg dark:border-white/15 dark:bg-white/5";

  return (
    <div className="flex w-[550px] max-w-[calc(100vw-32px)] items-center justify-between gap-2 rounded-xl border border-b-strong bg-canvas-panel-bg p-2 shadow-lg backdrop-blur-xl duration-300 dark:border-transparent dark:shadow-none">
      <div className="flex items-center justify-start gap-2">
        <span
          className="dark:opacity-90"
          style={{ color: "var(--text-primary)" }}
        >
          <SectionalEditIcon color="currentColor" />
        </span>
        <p
          className="text-sm font-normal dark:text-white/90"
          style={{ color: "var(--text-primary)" }}
        >
          {message}
        </p>
      </div>
      <div className="flex items-center gap-1">
        {onCopy && (
          <button
            type="button"
            onClick={onCopy}
            className={btnClass}
            title="Copy"
            aria-label="Copy"
          >
            <Copy
              className="size-4"
              style={{ color: "var(--text-primary)" }}
              strokeWidth={2.2}
            />
          </button>
        )}
        {onDelete && (
          <button
            type="button"
            onClick={onDelete}
            className={btnClass}
            title="Delete"
            aria-label="Delete"
          >
            <Trash2
              className="size-4"
              style={{ color: "var(--text-primary)" }}
              strokeWidth={2.2}
            />
          </button>
        )}
      </div>
    </div>
  );
}
