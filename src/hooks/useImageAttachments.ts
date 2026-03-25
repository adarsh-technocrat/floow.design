"use client";

import { useCallback, useRef, useState } from "react";
import http from "@/lib/http";

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

export function useImageAttachments() {
  const [attachedImages, setAttachedImages] = useState<AttachedImage[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const hasUploadingImages = attachedImages.some((img) => img.uploading);

  /** Upload a single image to Vercel Blob */
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

  /** Read file, add preview, and start upload immediately */
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
          { id: imgId, dataUrl, name: file.name || "image.png", uploading: true },
        ]);
        uploadImage(imgId, dataUrl);
      };
      reader.readAsDataURL(file);
    },
    [uploadImage],
  );

  /** Open the native file picker */
  const openFilePicker = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  /** Handle <input type="file"> change */
  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files) return;
      Array.from(files).forEach((f) => addImageAndUpload(f));
      e.target.value = "";
    },
    [addImageAndUpload],
  );

  /** Handle paste from clipboard */
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

  /** Remove an image (works during upload or after) */
  const removeImage = useCallback((id: string) => {
    setAttachedImages((prev) => prev.filter((img) => img.id !== id));
  }, []);

  /** Clear all images */
  const clearImages = useCallback(() => {
    setAttachedImages([]);
  }, []);

  /** Get uploaded HTTPS URLs (only successfully uploaded ones) */
  const getUploadedUrls = useCallback((): string[] => {
    return attachedImages
      .filter((img) => img.url && !img.error)
      .map((img) => img.url!);
  }, [attachedImages]);

  return {
    attachedImages,
    hasUploadingImages,
    fileInputRef,
    openFilePicker,
    handleFileChange,
    handlePaste,
    removeImage,
    clearImages,
    getUploadedUrls,
  };
}
