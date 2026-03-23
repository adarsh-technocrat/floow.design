"use client";

import { Minus, Plus } from "lucide-react";

interface SeatPickerProps {
  seats: number;
  onSeatsChange: (seats: number) => void;
  min?: number;
  max?: number;
}

export function SeatPicker({
  seats,
  onSeatsChange,
  min = 1,
  max = 50,
}: SeatPickerProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[11px] font-mono uppercase tracking-wider text-t-tertiary">
        Seats
      </span>
      <div className="inline-flex items-center rounded-lg border border-b-secondary bg-input-bg">
        <button
          type="button"
          onClick={() => onSeatsChange(Math.max(min, seats - 1))}
          disabled={seats <= min}
          className="inline-flex size-7 items-center justify-center rounded-l-lg text-t-secondary transition-colors hover:bg-surface-sunken hover:text-t-primary disabled:opacity-30 disabled:pointer-events-none"
        >
          <Minus className="size-3" />
        </button>
        <span className="min-w-[28px] text-center text-sm font-semibold font-mono text-t-primary">
          {seats}
        </span>
        <button
          type="button"
          onClick={() => onSeatsChange(Math.min(max, seats + 1))}
          disabled={seats >= max}
          className="inline-flex size-7 items-center justify-center rounded-r-lg text-t-secondary transition-colors hover:bg-surface-sunken hover:text-t-primary disabled:opacity-30 disabled:pointer-events-none"
        >
          <Plus className="size-3" />
        </button>
      </div>
    </div>
  );
}
