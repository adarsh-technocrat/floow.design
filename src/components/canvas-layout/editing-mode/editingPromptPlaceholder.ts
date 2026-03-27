import type { SelectedElementContext } from "@/lib/chat-bridge";
import type { AttachedFrame } from "@/hooks/useCanvasChat";

export function editingPromptPlaceholder({
  isAgentWorking,
  selectedElement,
  attachedFrames,
}: {
  isAgentWorking: boolean;
  selectedElement: SelectedElementContext | null;
  attachedFrames: AttachedFrame[];
}): string {
  if (isAgentWorking) return "Type to queue next prompt...";
  if (selectedElement) {
    return `Edit <${selectedElement.tagName}> element...`;
  }
  if (attachedFrames.length > 0) {
    return attachedFrames.length === 1
      ? `Edit "${attachedFrames[0].label || "screen"}"...`
      : `Edit ${attachedFrames.length} screens...`;
  }
  return "What would you like to change or create?";
}
