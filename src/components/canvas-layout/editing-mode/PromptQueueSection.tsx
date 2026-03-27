import { AnimatePresence, motion } from "framer-motion";
import type { QueuedPrompt } from "@/hooks/useCanvasChat";
import { QueuedPromptChip } from "./QueuedPromptChip";

const QUEUE_MOTION = { type: "spring" as const, stiffness: 420, damping: 34 };

export function PromptQueueSection({
  promptQueue,
  onForceExecute,
  onRemove,
}: {
  promptQueue: QueuedPrompt[];
  onForceExecute: (id: string) => void;
  onRemove: (id: string) => void;
}) {
  const hasQueue = promptQueue.length > 0;

  return (
    <AnimatePresence initial={false}>
      {hasQueue && (
        <motion.div
          key="prompt-queue"
          role="region"
          aria-label="Queued prompts"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 6 }}
          transition={QUEUE_MOTION}
          className="relative z-1 mx-2"
        >
          <div className="max-h-[min(40vh,220px)] overflow-y-auto overscroll-contain [scrollbar-gutter:stable]">
            {promptQueue.map((queuedPrompt) => (
              <QueuedPromptChip
                key={queuedPrompt.id}
                prompt={queuedPrompt}
                onForceExecute={onForceExecute}
                onRemove={onRemove}
              />
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
