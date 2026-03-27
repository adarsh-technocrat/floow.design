import { StyleGuideIcon } from "@/lib/svg-icons";
import { StyleGuidePanel } from "../StyleGuidePanel";

export function StyleGuideDock({
  open,
  onToggle,
  onClose,
}: {
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
}) {
  return (
    <div className="absolute right-4 top-16 z-20 flex flex-col items-center gap-2">
      <div className="flex flex-col items-center gap-1 rounded-full border border-b-strong bg-canvas-panel-bg p-1 shadow-md backdrop-blur-xl">
        <button
          type="button"
          onClick={onToggle}
          className={`rounded-full p-2 transition-colors ${
            open
              ? "bg-btn-primary-bg text-btn-primary-text"
              : "text-t-secondary hover:bg-input-bg hover:text-t-primary"
          }`}
          title="Style Guide"
        >
          <StyleGuideIcon color="currentColor" width={18} height={18} />
        </button>
      </div>
      <StyleGuidePanel open={open} onClose={onClose} />
    </div>
  );
}
