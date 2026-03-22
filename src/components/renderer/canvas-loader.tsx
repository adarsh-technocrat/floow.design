"use client";

import React from "react";

import Image from "next/image";

interface CanvasLoaderProps {
  message?: string;
}

export function CanvasLoader({
  message = "Loading project...",
}: CanvasLoaderProps) {
  return (
    <div className="absolute inset-0 z-[100] flex items-center justify-center bg-surface-overlay/90 backdrop-blur-md dark:bg-black/50">
      <div className="flex flex-col items-center gap-4">
        <Image
          src="/logo-without-text.png"
          alt="logo"
          width={64}
          height={64}
          className="rounded-[25px]"
        />
        <p className="text-sm font-medium text-t-secondary">{message}</p>
        <div className="h-1 w-48 overflow-hidden rounded-full bg-input-bg">
          <div
            className="h-full rounded-full bg-linear-to-r from-btn-primary-bg via-t-secondary to-btn-primary-bg dark:from-zinc-100 dark:via-zinc-400 dark:to-zinc-100"
            style={{
              animation: "loadLeftToRight 0.5s ease-in-out infinite",
            }}
          />
        </div>
      </div>
    </div>
  );
}
