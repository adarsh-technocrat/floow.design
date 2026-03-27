"use client";

import { useCallback, useId, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

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
  /** When true, confirm stays disabled until the user checks the acknowledgment box. */
  requireAcknowledgment?: boolean;
  acknowledgmentLabel?: string;
}

const confirmBtnClass: Record<ConfirmDialogVariant, string> = {
  danger:
    "bg-[#f43f5e] text-white shadow-sm hover:bg-[#e11d48] focus-visible:ring-rose-500/45 disabled:opacity-40 disabled:hover:bg-[#f43f5e]",
  warning:
    "bg-amber-600 text-white hover:bg-amber-700 focus-visible:ring-amber-600/40 disabled:opacity-40 disabled:hover:bg-amber-600",
  info: "bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-600/40 disabled:opacity-40 disabled:hover:bg-blue-600",
};

function HexPatternBackground({ patternId }: { patternId: string }) {
  return (
    <div
      className="pointer-events-none absolute inset-x-0 top-0 h-[38%] min-h-[120px] overflow-hidden rounded-t-[inherit]"
      aria-hidden
    >
      <svg
        className="absolute inset-0 h-full w-full text-zinc-400/14 dark:text-zinc-500/40"
        preserveAspectRatio="xMidYMin slice"
      >
        <defs>
          <pattern
            id={patternId}
            width="28"
            height="49.2"
            patternUnits="userSpaceOnUse"
            patternTransform="scale(0.65)"
          >
            <path
              fill="none"
              stroke="currentColor"
              strokeWidth="0.5"
              d="M14 0 L28 8.08 L28 24.25 L14 32.33 L0 24.25 L0 8.08 Z"
            />
            <path
              fill="none"
              stroke="currentColor"
              strokeWidth="0.5"
              d="M14 16.5 L28 24.58 L28 40.75 L14 48.83 L0 40.75 L0 24.58 Z"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#${patternId})`} />
      </svg>
      {/* Light: neutral grey wash (no rose tint). Dark: subtle warm depth. */}
      <div className="absolute inset-0 bg-gradient-to-b from-zinc-100/70 via-zinc-50/35 to-surface-elevated dark:from-rose-950/50 dark:via-rose-950/18 dark:to-surface-elevated" />
    </div>
  );
}

function FolderIllustration({ variant }: { variant: ConfirmDialogVariant }) {
  const folderFill =
    variant === "danger"
      ? "#E11D48"
      : variant === "warning"
        ? "#D97706"
        : "#2563EB";
  return (
    <div className="relative flex size-[104px] shrink-0 items-center justify-center">
      <div
        className="absolute inset-0 rounded-3xl bg-gradient-to-br from-black/6 to-transparent dark:from-white/10"
        aria-hidden
      />
      <svg
        viewBox="0 0 120 96"
        className="relative z-1 h-[88px] w-[100px] drop-shadow-md dark:drop-shadow-[0_8px_24px_rgba(0,0,0,0.45)]"
        aria-hidden
      >
        <path
          fill={folderFill}
          d="M12 18h38l12 10h46c4 0 8 3.5 8 8v46c0 4.5-3.5 8-8 8H12c-4.5 0-8-3.5-8-8V26c0-4.5 3.5-8 8-8z"
        />
        <path
          fill="#1f2937"
          fillOpacity="0.12"
          d="M12 18h38l12 10h46c4 0 8 3.5 8 8v4H12V18z"
        />
        <rect x="28" y="34" width="64" height="44" rx="3" fill="#F5E6D3" />
        <rect x="36" y="40" width="52" height="9" rx="2" fill="#3B82F6" />
        <rect x="36" y="54" width="40" height="6" rx="1.5" fill="#D4C4B0" />
        <rect x="36" y="64" width="48" height="6" rx="1.5" fill="#D4C4B0" />
      </svg>
    </div>
  );
}

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
  requireAcknowledgment = false,
  acknowledgmentLabel = "I understand this is irreversible",
}: ConfirmDialogProps) {
  const patternId = useId().replace(/:/g, "");
  const [acknowledged, setAcknowledged] = useState(false);

  const handleConfirm = useCallback(() => {
    if (requireAcknowledgment && !acknowledged) return;
    onConfirm();
    onOpenChange(false);
  }, [acknowledged, onConfirm, onOpenChange, requireAcknowledgment]);

  const handleCancel = useCallback(() => {
    onCancel?.();
    onOpenChange(false);
  }, [onCancel, onOpenChange]);

  const confirmDisabled = requireAcknowledgment && !acknowledged;

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) setAcknowledged(false);
        onOpenChange(v);
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="gap-0 overflow-hidden rounded-[28px] border border-b-secondary bg-surface-elevated p-0 shadow-2xl dark:shadow-[var(--shadow-lg)] sm:max-w-[440px] md:max-w-[440px]"
      >
        <div className="relative rounded-t-[28px] bg-surface-elevated">
          <HexPatternBackground patternId={`hex-${patternId}`} />

          <div className="relative z-1 flex flex-col items-center px-8 pb-8 pt-11 text-center">
            <FolderIllustration variant={variant} />

            <DialogTitle className="mt-8 max-w-[21rem] text-balance text-xl font-bold leading-snug tracking-tight text-t-primary sm:text-[1.35rem]">
              {title}
            </DialogTitle>

            <DialogDescription className="mt-4 max-w-[22rem] text-balance text-[15px] leading-relaxed text-t-secondary">
              {description}
            </DialogDescription>

            {requireAcknowledgment ? (
              <div className="mt-10 flex w-full justify-center px-2">
                <label className="inline-flex max-w-[20rem] cursor-pointer items-center gap-3 text-center text-[13px] leading-snug text-t-tertiary">
                  <input
                    type="checkbox"
                    checked={acknowledged}
                    onChange={(e) => setAcknowledged(e.target.checked)}
                    className={cn(
                      "size-[18px] shrink-0 rounded border border-b-strong bg-surface-elevated accent-rose-500",
                      "dark:border-b-strong dark:bg-input-bg",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
                    )}
                  />
                  <span className="text-t-secondary">
                    {acknowledgmentLabel}
                  </span>
                </label>
              </div>
            ) : null}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 border-t border-b-secondary bg-surface-elevated px-6 py-6">
          <button
            type="button"
            onClick={handleCancel}
            className="inline-flex min-h-[48px] w-full items-center justify-center rounded-xl border border-b-secondary bg-surface-elevated px-4 text-sm font-medium text-t-primary transition-colors hover:bg-input-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={confirmDisabled}
            className={cn(
              "inline-flex min-h-[48px] w-full items-center justify-center rounded-xl px-4 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2",
              confirmBtnClass[variant],
            )}
          >
            {confirmLabel}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
