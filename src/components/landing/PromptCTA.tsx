"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

interface PromptCTAProps {
  /** Compact single-line input for footer, full textarea for blog/hero */
  variant?: "compact" | "full";
  placeholder?: string;
}

export function PromptCTA({
  variant = "compact",
  placeholder = "Describe your app idea...",
}: PromptCTAProps) {
  const [prompt, setPrompt] = useState("");
  const [creating, setCreating] = useState(false);
  const router = useRouter();
  const { user } = useAuth();

  const handleSubmit = async () => {
    const text = prompt.trim();
    if (!text || creating) return;

    if (!user) {
      // Not logged in — redirect to sign-in with prompt preserved
      const params = new URLSearchParams({
        prompt: text,
        redirect: window.location.pathname,
      });
      router.push(`/signin?${params.toString()}`);
      return;
    }

    // Logged in — create project and go to canvas
    setCreating(true);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: text }),
      });
      const data: { id?: string } = await res.json();
      if (data.id) {
        router.push(`/app/${data.id}?prompt=${encodeURIComponent(text)}`);
      }
    } catch {
      setCreating(false);
    }
  };

  if (variant === "compact") {
    return (
      <div className="flex w-full items-center gap-2 rounded-xl bg-surface-elevated p-2 shadow-prompt-card transition-shadow duration-200 focus-within:ring-2 focus-within:ring-zinc-400/35 dark:focus-within:ring-white/15">
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSubmit();
          }}
          placeholder={placeholder}
          className="min-w-0 flex-1 bg-transparent px-2 text-sm text-t-primary placeholder-t-tertiary outline-none"
        />
        <button
          onClick={handleSubmit}
          disabled={creating || !prompt.trim()}
          className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg bg-btn-primary-bg px-4 text-xs font-semibold text-btn-primary-text transition-colors hover:opacity-90 disabled:opacity-50"
        >
          {creating ? (
            <div className="size-3 rounded-full border-2 border-btn-primary-text/40 border-t-transparent animate-spin" />
          ) : (
            <>
              Generate
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </>
          )}
        </button>
      </div>
    );
  }

  // Full variant — textarea style (for blog pages)
  return (
    <div className="flex w-full flex-col rounded-2xl bg-surface-elevated p-5 shadow-prompt-card transition-shadow duration-200 focus-within:ring-2 focus-within:ring-zinc-400/35 dark:focus-within:ring-white/15">
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-transparent text-t-primary placeholder-t-tertiary resize-none focus:outline-none text-[15px] leading-relaxed min-h-[100px]"
        rows={4}
      />
      <div className="flex items-center justify-end pt-3 mt-2">
        <button
          onClick={handleSubmit}
          disabled={creating || !prompt.trim()}
          className="inline-flex h-9 items-center gap-2 rounded-lg bg-btn-primary-bg px-5 text-sm font-semibold text-btn-primary-text transition-colors hover:opacity-90 disabled:opacity-50"
        >
          {creating ? (
            <div className="size-3.5 rounded-full border-2 border-btn-primary-text/40 border-t-transparent animate-spin" />
          ) : (
            <>
              Generate
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
