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

export interface QueuedPrompt {
  id: string;
  text: string;
  createdAt: number;
}

export interface AttachedImage {
  id: string;
  dataUrl: string;
  name: string;
}

export function useCanvasChat() {
  const dispatch = useAppDispatch();
  const userPlan = useAppSelector((s) => s.user.plan);
  const [inputValue, setInputValue] = useState("");
  const [attachedImages, setAttachedImages] = useState<AttachedImage[]>([]);
  const [isAgentWorking, setIsAgentWorking] = useState(false);
  const [promptQueue, setPromptQueue] = useState<QueuedPrompt[]>([]);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const processingQueueRef = useRef(false);

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
    (text: string, imageDataUrls?: string[]) => {
      sendChatMessage(text, imageDataUrls);
      dispatch(setAgentLogVisible(true));
    },
    [dispatch],
  );

  const handleAttachImage = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files) return;
      Array.from(files).forEach((file) => {
        if (!file.type.startsWith("image/")) return;
        if (file.size > 10 * 1024 * 1024) return; // 10MB limit
        const reader = new FileReader();
        reader.onload = () => {
          const dataUrl = reader.result as string;
          setAttachedImages((prev) => [
            ...prev,
            {
              id: `img-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              dataUrl,
              name: file.name,
            },
          ]);
        };
        reader.readAsDataURL(file);
      });
      // Reset so the same file can be re-selected
      e.target.value = "";
    },
    [],
  );

  const removeAttachedImage = useCallback((id: string) => {
    setAttachedImages((prev) => prev.filter((img) => img.id !== id));
  }, []);

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
        processingQueueRef.current = false;
      }, 100);
      return remainingPrompts;
    });
  }, [dispatchMessageToChatBridge]);

  const submitPromptOrAddToQueue = useCallback(() => {
    const trimmedText = inputValue.trim();
    if (!trimmedText && attachedImages.length === 0) return;
    if (!hasCreditsForAction()) return;

    const imageDataUrls = attachedImages.map((img) => img.dataUrl);
    setInputValue("");
    setAttachedImages([]);
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
        imageDataUrls.length > 0 ? imageDataUrls : undefined,
      );
    }
  }, [inputValue, attachedImages, isAgentWorking, dispatchMessageToChatBridge, resetTextareaHeight, hasCreditsForAction]);

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
    handleAttachImage,
    handleFileChange,
    removeAttachedImage,
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
