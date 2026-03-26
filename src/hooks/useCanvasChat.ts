"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setAgentLogVisible } from "@/store/slices/uiSlice";
import {
  sendChatMessage,
  stopChatGeneration,
  subscribeChatStatus,
  emitCreditExhausted,
} from "@/lib/chat-bridge";
import { useImageAttachments } from "./useImageAttachments";

export type { AttachedImage } from "./useImageAttachments";

export interface QueuedPrompt {
  id: string;
  text: string;
  createdAt: number;
}

export function useCanvasChat() {
  const dispatch = useAppDispatch();
  const userPlan = useAppSelector((s) => s.user.plan);
  const [inputValue, setInputValue] = useState("");
  const [isAgentWorking, setIsAgentWorking] = useState(false);
  const [promptQueue, setPromptQueue] = useState<QueuedPrompt[]>([]);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const processingQueueRef = useRef(false);

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

  const dispatchMessageToChatBridge = useCallback(
    (text: string, imageUrls?: string[]) => {
      sendChatMessage(text, imageUrls);
      dispatch(setAgentLogVisible(true));
    },
    [dispatch],
  );

  const processNextPromptFromQueue = useCallback(() => {
    setPromptQueue((currentQueue) => {
      if (currentQueue.length === 0) {
        processingQueueRef.current = false;
        return currentQueue;
      }
      processingQueueRef.current = true;
      const [nextPrompt, ...remainingPrompts] = currentQueue;
      setTimeout(() => {
        dispatchMessageToChatBridge(nextPrompt.text);
      }, 100);
      return remainingPrompts;
    });
  }, [dispatchMessageToChatBridge]);

  const submitPromptOrAddToQueue = useCallback(() => {
    const trimmedText = inputValue.trim();
    if (!trimmedText && attachedImages.length === 0) return;
    if (hasUploadingImages) return;
    if (!hasCreditsForAction()) return;

    const imageUrls = getUploadedUrls();
    setInputValue("");
    clearImages();
    resetTextareaHeight();

    if (isAgentWorking) {
      const queuedPrompt: QueuedPrompt = {
        id: `q-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        text: trimmedText || "Attached image",
        createdAt: Date.now(),
      };
      setPromptQueue((prev) => [...prev, queuedPrompt]);
    } else {
      dispatchMessageToChatBridge(
        trimmedText || "Attached image",
        imageUrls.length > 0 ? imageUrls : undefined,
      );
    }
  }, [inputValue, attachedImages, hasUploadingImages, isAgentWorking, dispatchMessageToChatBridge, resetTextareaHeight, hasCreditsForAction, getUploadedUrls, clearImages]);

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
    hasUploadingImages,
    handleAttachImage: openFilePicker,
    handleFileChange,
    handlePaste,
    removeAttachedImage: removeImage,
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
