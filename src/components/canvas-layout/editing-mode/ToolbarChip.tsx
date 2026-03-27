import { type ReactNode } from "react";
import { X } from "lucide-react";

export function ToolbarChip({
  label,
  onRemove,
  icon,
}: {
  label: string;
  onRemove?: () => void;
  icon?: ReactNode;
}) {
  return (
    <div className="group inline-flex h-8 max-w-[210px] items-center gap-1.5 rounded-full border border-b-secondary bg-input-bg px-3 text-[13px] text-t-secondary">
      {icon ? <span className="shrink-0">{icon}</span> : null}
      <span className="truncate">{label}</span>
      {onRemove ? (
        <button
          type="button"
          onClick={onRemove}
          className="shrink-0 rounded-full p-0.5 text-t-tertiary transition-colors group-hover:text-t-secondary hover:bg-surface-sunken"
          aria-label={`Remove ${label}`}
        >
          <X className="size-3.5" />
        </button>
      ) : null}
    </div>
  );
}
