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
    "shrink-0 inline-flex size-8 items-center justify-center rounded-md text-t-secondary transition-colors duration-200 hover:bg-input-bg hover:text-t-primary dark:text-white/70 dark:hover:bg-white/10 dark:hover:text-white/90";

  return (
    <div className="flex w-[550px] max-w-[calc(100vw-32px)] items-center justify-between gap-2 rounded-xl border border-b-primary bg-surface-elevated p-2 shadow-lg duration-300 dark:border-transparent dark:bg-canvas-panel dark:shadow-none">
      <div className="flex items-center justify-start gap-2">
        <span className="text-t-primary dark:opacity-90">
          <SectionalEditIcon color="currentColor" />
        </span>
        <p className="text-sm font-normal text-t-primary dark:text-white/90">
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
            <Copy className="size-4" />
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
            <Trash2 className="size-4" />
          </button>
        )}
      </div>
    </div>
  );
}
