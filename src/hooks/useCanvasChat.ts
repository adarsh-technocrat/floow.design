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
import http from "@/lib/http";

export interface QueuedPrompt {
  id: string;
  text: string;
  createdAt: number;
}

export interface AttachedImage {
  id: string;
  /** Local data URL for preview */
  dataUrl: string;
  /** Uploaded HTTPS URL (set after upload completes) */
  url?: string;
  name: string;
  /** True while uploading to Vercel Blob */
  uploading: boolean;
  /** True if upload failed */
  error?: boolean;
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
    (text: string, imageUrls?: string[]) => {
      sendChatMessage(text, imageUrls);
      dispatch(setAgentLogVisible(true));
    },
    [dispatch],
  );

  /** Upload a single image to Vercel Blob immediately */
  const uploadImage = useCallback(async (imgId: string, dataUrl: string) => {
    try {
      const res = await http.post("/api/chat/upload", { images: [dataUrl] });
      const urls: string[] = res.data?.urls ?? [];
      if (urls.length > 0) {
        setAttachedImages((prev) =>
          prev.map((img) =>
            img.id === imgId ? { ...img, uploading: false, url: urls[0] } : img,
          ),
        );
      } else {
        setAttachedImages((prev) =>
          prev.map((img) =>
            img.id === imgId ? { ...img, uploading: false, error: true } : img,
          ),
        );
      }
    } catch {
      setAttachedImages((prev) =>
        prev.map((img) =>
          img.id === imgId ? { ...img, uploading: false, error: true } : img,
        ),
      );
    }
  }, []);

  /** Add image and start upload immediately */
  const addImageAndUpload = useCallback(
    (file: File) => {
      if (!file.type.startsWith("image/")) return;
      if (file.size > 10 * 1024 * 1024) return; // 10MB limit
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        const imgId = `img-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        setAttachedImages((prev) => [
          ...prev,
          {
            id: imgId,
            dataUrl,
            name: file.name || "image.png",
            uploading: true,
          },
        ]);
        // Fire upload immediately
        uploadImage(imgId, dataUrl);
      };
      reader.readAsDataURL(file);
    },
    [uploadImage],
  );

  const handleAttachImage = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files) return;
      Array.from(files).forEach((file) => addImageAndUpload(file));
      e.target.value = "";
    },
    [addImageAndUpload],
  );

  const removeAttachedImage = useCallback((id: string) => {
    setAttachedImages((prev) => prev.filter((img) => img.id !== id));
  }, []);

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of Array.from(items)) {
        if (!item.type.startsWith("image/")) continue;
        e.preventDefault();
        const file = item.getAsFile();
        if (!file || file.size > 10 * 1024 * 1024) continue;
        addImageAndUpload(file);
      }
    },
    [addImageAndUpload],
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
        processingQueueRef.current = false;
      }, 100);
      return remainingPrompts;
    });
  }, [dispatchMessageToChatBridge]);

  /** Check if any images are still uploading */
  const hasUploadingImages = attachedImages.some((img) => img.uploading);

  const submitPromptOrAddToQueue = useCallback(() => {
    const trimmedText = inputValue.trim();
    if (!trimmedText && attachedImages.length === 0) return;
    if (hasUploadingImages) return; // Block send while uploading
    if (!hasCreditsForAction()) return;

    // Collect only successfully uploaded HTTPS URLs
    const imageUrls = attachedImages
      .filter((img) => img.url && !img.error)
      .map((img) => img.url!);

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
        imageUrls.length > 0 ? imageUrls : undefined,
      );
    }
  }, [inputValue, attachedImages, hasUploadingImages, isAgentWorking, dispatchMessageToChatBridge, resetTextareaHeight, hasCreditsForAction]);

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
    handleAttachImage,
    handleFileChange,
    handlePaste,
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
