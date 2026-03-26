"use client";

import { useCallback, useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export type ConfirmDialogVariant = "danger" | "warning" | "info";

export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmDialogVariant;
  onConfirm: () => void;
  onCancel?: () => void;
}

const variantStyles: Record<
  ConfirmDialogVariant,
  {
    icon: string;
    iconBg: string;
    iconColor: string;
    btnBg: string;
    btnHover: string;
  }
> = {
  danger: {
    icon: "M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z",
    iconBg: "bg-red-500/10",
    iconColor: "text-red-500",
    btnBg: "bg-red-600 hover:bg-red-700 text-white",
    btnHover: "hover:bg-red-700",
  },
  warning: {
    icon: "M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z",
    iconBg: "bg-amber-500/10",
    iconColor: "text-amber-500",
    btnBg: "bg-amber-600 hover:bg-amber-700 text-white",
    btnHover: "hover:bg-amber-700",
  },
  info: {
    icon: "m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z",
    iconBg: "bg-blue-500/10",
    iconColor: "text-blue-500",
    btnBg: "bg-blue-600 hover:bg-blue-700 text-white",
    btnHover: "hover:bg-blue-700",
  },
};

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "danger",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  const style = variantStyles[variant];

  useEffect(() => {
    if (open) {
      // Focus cancel button when dialog opens for safety
      setTimeout(() => cancelRef.current?.focus(), 50);
    }
  }, [open]);

  const handleConfirm = useCallback(() => {
    onConfirm();
    onOpenChange(false);
  }, [onConfirm, onOpenChange]);

  const handleCancel = useCallback(() => {
    onCancel?.();
    onOpenChange(false);
  }, [onCancel, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="sm:max-w-[420px] p-0 gap-0 overflow-hidden"
      >
        <div className="px-6 pt-6 pb-4">
          {/* Icon */}
          <div
            className={`mx-auto mb-4 flex size-12 items-center justify-center rounded-full ${style.iconBg}`}
          >
            <svg
              className={`size-6 ${style.iconColor}`}
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d={style.icon}
              />
            </svg>
          </div>

          <DialogHeader className="text-center sm:text-center">
            <DialogTitle className="text-base font-semibold text-t-primary">
              {title}
            </DialogTitle>
            <DialogDescription className="mt-2 text-sm leading-relaxed text-t-secondary">
              {description}
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Actions */}
        <div className="flex gap-3 border-t border-b-secondary bg-surface-sunken/50 px-6 py-4">
          <button
            ref={cancelRef}
            type="button"
            onClick={handleCancel}
            className="flex-1 rounded-xl border border-b-secondary bg-surface-elevated px-4 py-2.5 text-sm font-medium text-t-primary transition-colors hover:bg-surface-sunken focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 ${style.btnBg}`}
          >
            {confirmLabel}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
