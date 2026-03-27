"use client";

import { useEffect, useState } from "react";
import {
  subscribeCreditExhausted,
  type CreditExhaustedReason,
} from "@/lib/chat-bridge";
import { PricingDialog } from "@/components/PricingDialog";
import { useCanvasChat } from "@/hooks/useCanvasChat";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setCanvasToolMode } from "@/store/slices/uiSlice";
import { ChatEngine } from "./ChatEngine";
import { EditingPromptCard } from "./editing-mode/EditingPromptCard";
import { editingPromptPlaceholder } from "./editing-mode/editingPromptPlaceholder";
import { PromptBoxStackedLayers } from "./editing-mode/PromptBoxStackedLayers";
import { PromptQueueSection } from "./editing-mode/PromptQueueSection";
import { StyleGuideDock } from "./editing-mode/StyleGuideDock";

export function EditingModeDisplay() {
  const [styleGuideOpen, setStyleGuideOpen] = useState(false);
  const [pricingDialogOpen, setPricingDialogOpen] = useState(false);
  const [pricingDialogReason, setPricingDialogReason] =
    useState<CreditExhaustedReason>("insufficient_credits");
  const dispatch = useAppDispatch();
  const canvasToolMode = useAppSelector((s) => s.ui.canvasToolMode);

  const toggleNoteMode = () => {
    dispatch(setCanvasToolMode(canvasToolMode === "note" ? "select" : "note"));
  };

  const chat = useCanvasChat();

  useEffect(() => {
    return subscribeCreditExhausted((reason) => {
      setPricingDialogReason(reason);
      setPricingDialogOpen(true);
    });
  }, []);

  const hasQueue = chat.promptQueue.length > 0;

  const placeholder = editingPromptPlaceholder({
    isAgentWorking: chat.isAgentWorking,
    selectedElement: chat.selectedElement,
    attachedFrames: chat.attachedFrames,
  });

  const canSubmit =
    Boolean(chat.inputValue.trim()) || chat.attachedImages.length > 0;

  return (
    <>
      <ChatEngine />
      <div className="absolute bottom-4 left-1/2 z-20 w-full max-w-[660px] -translate-x-1/2 px-4">
        <div className="relative pt-3">
          <PromptBoxStackedLayers />
          <PromptQueueSection
            promptQueue={chat.promptQueue}
            onForceExecute={chat.forceExecuteQueuedPrompt}
            onRemove={chat.removePromptFromQueue}
          />
          <EditingPromptCard
            hasQueue={hasQueue}
            fileInputRef={chat.fileInputRef}
            handleFileChange={chat.handleFileChange}
            attachedFrames={chat.attachedFrames}
            removeAttachedFrame={chat.removeAttachedFrame}
            selectedElement={chat.selectedElement}
            clearSelectedElement={chat.clearSelectedElement}
            attachedImages={chat.attachedImages}
            removeAttachedImage={chat.removeAttachedImage}
            inputRef={chat.inputRef}
            inputValue={chat.inputValue}
            setInputValue={chat.setInputValue}
            placeholder={placeholder}
            handleTextareaKeyDown={chat.handleTextareaKeyDown}
            handlePaste={chat.handlePaste}
            handleTextareaAutoResize={chat.handleTextareaAutoResize}
            handleAttachImage={chat.handleAttachImage}
            canvasToolMode={canvasToolMode}
            toggleNoteMode={toggleNoteMode}
            isAgentWorking={chat.isAgentWorking}
            stopCurrentGeneration={chat.stopCurrentGeneration}
            submitPromptOrAddToQueue={chat.submitPromptOrAddToQueue}
            hasUploadingImages={chat.hasUploadingImages}
            canSubmit={canSubmit}
          />
        </div>
      </div>

      <StyleGuideDock
        open={styleGuideOpen}
        onToggle={() => setStyleGuideOpen((v) => !v)}
        onClose={() => setStyleGuideOpen(false)}
      />

      <PricingDialog
        open={pricingDialogOpen}
        onClose={() => setPricingDialogOpen(false)}
        reason={pricingDialogReason}
      />
    </>
  );
}
