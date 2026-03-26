"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import http from "@/lib/http";

export function TemplateUseButton({ templateId }: { templateId: string }) {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    if (!user) {
      sessionStorage.setItem("pending_template", templateId);
      router.push("/signin");
      return;
    }

    setLoading(true);
    try {
      const { data } = await http.post<{ id?: string }>("/api/templates/use", { templateId });
      if (data.id) {
        router.push(`/project/${data.id}`);
      }
    } catch {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className="inline-flex items-center justify-center gap-2 rounded-full bg-btn-primary-bg px-6 py-2.5 text-sm font-semibold text-btn-primary-text shadow-sm transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50 w-fit"
    >
      {loading ? (
        <div className="size-4 animate-spin rounded-full border-2 border-btn-primary-text border-t-transparent" />
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 5v14M5 12h14" />
        </svg>
      )}
      {loading ? "Creating project..." : "Use Template"}
    </button>
  );
}
