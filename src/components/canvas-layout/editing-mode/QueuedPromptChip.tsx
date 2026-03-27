import { ArrowUp, X } from "lucide-react";
import type { QueuedPrompt } from "@/hooks/useCanvasChat";
import { queuePreviewText } from "./queuePreviewText";

export function QueuedPromptChip({
  prompt,
  onForceExecute,
  onRemove,
}: {
  prompt: QueuedPrompt;
  onForceExecute: (id: string) => void;
  onRemove: (id: string) => void;
}) {
  const preview = prompt.displayLabel ?? queuePreviewText(prompt.text);
  return (
    <div className="group flex w-full items-center gap-2">
      <p
        className="min-w-0 flex-1 line-clamp-2 px-2 py-1 text-[13px] leading-snug text-t-secondary"
        title={preview}
      >
        {preview}
      </p>
      <div className="flex shrink-0 items-center gap-0.5">
        <button
          type="button"
          onClick={() => onRemove(prompt.id)}
          className="rounded-lg p-1.5 text-t-tertiary transition-colors hover:bg-input-bg hover:text-t-primary"
          title="Remove from queue"
          aria-label="Remove from queue"
        >
          <X className="size-3.5" />
        </button>
        <button
          type="button"
          onClick={() => onForceExecute(prompt.id)}
          className="rounded-lg p-1.5 text-t-tertiary transition-colors hover:bg-input-bg hover:text-t-primary"
          title="Stop current and send this now"
          aria-label="Stop current and send this now"
        >
          <ArrowUp className="size-3.5" />
        </button>
      </div>
    </div>
  );
}
