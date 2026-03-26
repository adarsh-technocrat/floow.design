"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export function TemplateUseButton({ templateId }: { templateId: string }) {
  const { user } = useAuth();
  const router = useRouter();

  const handleClick = () => {
    if (!user) {
      sessionStorage.setItem("pending_template", templateId);
      router.push("/signin");
      return;
    }
    router.push(`/project/${templateId}`);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="inline-flex items-center justify-center gap-2 rounded-full bg-btn-primary-bg px-6 py-2.5 text-sm font-semibold text-btn-primary-text shadow-sm transition-all hover:opacity-90 active:scale-[0.98] w-fit"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 5v14M5 12h14" />
      </svg>
      Use Template
    </button>
  );
}
