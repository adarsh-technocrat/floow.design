"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setAgentLogVisible } from "@/store/slices/uiSlice";
import {
  sendChatMessage,
  stopChatGeneration,
  subscribeChatStatus,
  emitCreditExhausted,
  subscribeSelectedElement,
  type SelectedElementContext,
} from "@/lib/chat-bridge";
import { useImageAttachments } from "./useImageAttachments";

export type { AttachedImage } from "./useImageAttachments";

export interface AttachedFrame {
  id: string;
  label: string;
}

export interface QueuedPrompt {
  id: string;
  text: string;
  createdAt: number;
}

export function useCanvasChat() {
  const dispatch = useAppDispatch();
  const userPlan = useAppSelector((s) => s.user.plan);
  const selectedFrameIds = useAppSelector((s) => s.canvas.selectedFrameIds);
  const frames = useAppSelector((s) => s.canvas.frames);
  const [inputValue, setInputValue] = useState("");
  const [isAgentWorking, setIsAgentWorking] = useState(false);
  const [promptQueue, setPromptQueue] = useState<QueuedPrompt[]>([]);
  const [attachedFrames, setAttachedFrames] = useState<AttachedFrame[]>([]);
  const [selectedElement, setSelectedElement] =
    useState<SelectedElementContext | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const processingQueueRef = useRef(false);

  // Auto-attach selected frames
  useEffect(() => {
    if (selectedFrameIds.length === 0) {
      setAttachedFrames([]);
      return;
    }
    const attached = selectedFrameIds
      .map((id) => {
        const frame = frames.find((f) => f.id === id);
        return frame ? { id: frame.id, label: frame.label } : null;
      })
      .filter(Boolean) as AttachedFrame[];
    setAttachedFrames(attached);
  }, [selectedFrameIds, frames]);

  // Subscribe to element-level selection
  useEffect(() => {
    return subscribeSelectedElement((ctx) => {
      setSelectedElement(ctx);
    });
  }, []);

  const {
    attachedImages,
    hasUploadingImages,
    fileInputRef,
    openFilePicker,
    handleFileChange,
    handlePaste,
    removeImage,
    clearImages,
    getUploadedUrls,
  } = useImageAttachments();

  const hasCreditsForAction = useCallback((): boolean => {
    if (!userPlan || userPlan.plan === "FREE") {
      emitCreditExhausted("no_plan");
      return false;
    }
    if (userPlan.credits <= 0) {
      emitCreditExhausted("insufficient_credits");
      return false;
    }
    return true;
  }, [userPlan]);

  useEffect(() => {
    return subscribeChatStatus((status) => {
      const working = status === "submitted" || status === "streaming";
      if (working && processingQueueRef.current) {
        processingQueueRef.current = false;
      }
      setIsAgentWorking(working);
    });
  }, []);

  useEffect(() => {
    if (!isAgentWorking && !processingQueueRef.current) {
      processNextPromptFromQueue();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAgentWorking]);

  const resetTextareaHeight = useCallback(() => {
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
    }
  }, []);

  const removeAttachedFrame = useCallback((frameId: string) => {
    setAttachedFrames((prev) => prev.filter((f) => f.id !== frameId));
  }, []);

  const clearSelectedElement = useCallback(() => {
    setSelectedElement(null);
  }, []);

  const dispatchMessageToChatBridge = useCallback(
    (
      text: string,
      imageUrls?: string[],
      frameIds?: string[],
      element?: SelectedElementContext,
    ) => {
      sendChatMessage(text, imageUrls, frameIds, element);
      dispatch(setAgentLogVisible(true));
    },
    [dispatch],
  );

  const processNextPromptFromQueue = useCallback(() => {
    let promptToSend: QueuedPrompt | null = null;

    setPromptQueue((currentQueue) => {
      if (currentQueue.length === 0) {
        return currentQueue;
      }
      const [nextPrompt, ...remainingPrompts] = currentQueue;
      promptToSend = nextPrompt;
      return remainingPrompts;
    });

    // Side effects must be outside the state updater to avoid
    // double-execution under React StrictMode.
    if (promptToSend) {
      processingQueueRef.current = true;
      setTimeout(() => {
        dispatchMessageToChatBridge((promptToSend as QueuedPrompt).text);
      }, 100);
    } else {
      processingQueueRef.current = false;
    }
  }, [dispatchMessageToChatBridge]);

  const submitPromptOrAddToQueue = useCallback(() => {
    const trimmedText = inputValue.trim();
    if (!trimmedText && attachedImages.length === 0) return;
    if (hasUploadingImages) return;
    if (!hasCreditsForAction()) return;

    const imageUrls = getUploadedUrls();
    const frameIds = attachedFrames.map((f) => f.id);
    const elementCtx = selectedElement ?? undefined;
    setInputValue("");
    clearImages();
    resetTextareaHeight();

    // Build enriched message with context prefix
    let messageText = trimmedText || "Attached image";
    if (elementCtx) {
      const elDesc = elementCtx.text
        ? `the <${elementCtx.tagName}> element "${elementCtx.text.slice(0, 50)}" (data-uxm-element-id="${elementCtx.elementId}")`
        : `the <${elementCtx.tagName}> element (data-uxm-element-id="${elementCtx.elementId}")`;
      messageText = `[Selected element: ${elDesc} in screen "${elementCtx.frameLabel}" (frame: ${elementCtx.frameId})]\n\n${messageText}`;
    } else if (attachedFrames.length > 0) {
      const screenNames = attachedFrames
        .map((f) => `"${f.label}" (id: ${f.id})`)
        .join(", ");
      messageText = `[Selected screen${attachedFrames.length > 1 ? "s" : ""}: ${screenNames}]\n\n${messageText}`;
    }

    if (isAgentWorking) {
      const queuedPrompt: QueuedPrompt = {
        id: `q-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        text: messageText,
        createdAt: Date.now(),
      };
      setPromptQueue((prev) => [...prev, queuedPrompt]);
    } else {
      dispatchMessageToChatBridge(
        messageText,
        imageUrls.length > 0 ? imageUrls : undefined,
        frameIds.length > 0 ? frameIds : undefined,
        elementCtx,
      );
    }
  }, [
    inputValue,
    attachedImages,
    attachedFrames,
    selectedElement,
    hasUploadingImages,
    isAgentWorking,
    dispatchMessageToChatBridge,
    resetTextareaHeight,
    hasCreditsForAction,
    getUploadedUrls,
    clearImages,
  ]);

  const forceExecuteQueuedPrompt = useCallback(
    (promptId: string) => {
      const targetPrompt = promptQueue.find((p) => p.id === promptId);
      if (!targetPrompt) return;

      setPromptQueue((prev) => prev.filter((p) => p.id !== promptId));
      stopChatGeneration();
      setTimeout(() => {
        dispatchMessageToChatBridge(targetPrompt.text);
      }, 200);
    },
    [promptQueue, dispatchMessageToChatBridge],
  );

  const removePromptFromQueue = useCallback((promptId: string) => {
    setPromptQueue((prev) => prev.filter((p) => p.id !== promptId));
  }, []);

  const stopCurrentGeneration = useCallback(() => {
    stopChatGeneration();
  }, []);

  const handleTextareaKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        submitPromptOrAddToQueue();
      }
    },
    [submitPromptOrAddToQueue],
  );

  const handleTextareaAutoResize = useCallback(
    (event: React.FormEvent<HTMLTextAreaElement>) => {
      const element = event.currentTarget;
      element.style.height = "auto";
      element.style.height = Math.min(element.scrollHeight, 140) + "px";
    },
    [],
  );

  return {
    inputValue,
    setInputValue,
    inputRef,
    fileInputRef,
    attachedImages,
    attachedFrames,
    selectedElement,
    hasUploadingImages,
    handleAttachImage: openFilePicker,
    handleFileChange,
    handlePaste,
    removeAttachedImage: removeImage,
    removeAttachedFrame,
    clearSelectedElement,
    isAgentWorking,
    promptQueue,
    submitPromptOrAddToQueue,
    forceExecuteQueuedPrompt,
    removePromptFromQueue,
    stopCurrentGeneration,
    handleTextareaKeyDown,
    handleTextareaAutoResize,
  };
}
