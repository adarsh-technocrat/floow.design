"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ChevronDown } from "lucide-react";

export function CanvasTopLeft() {
  const params = useParams();
  const projectId = params?.projectId as string | undefined;

  return (
    <div className="absolute left-0 top-0 z-10 flex h-12 items-center gap-3 px-4">
      <Link
        href="/dashboard"
        className="flex items-center gap-1.5 no-underline"
        title="Back to dashboard"
      >
        <span
          className="text-sm font-bold tracking-tight text-t-primary"
          style={{ fontFamily: "var(--font-logo), 'Space Grotesk', sans-serif" }}
        >
          floow<span className="text-t-secondary">.design</span>
        </span>
      </Link>

      <div className="h-4 w-px bg-b-primary" />

      <button
        type="button"
        className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-t-secondary hover:text-t-primary hover:bg-input-bg transition-colors"
      >
        <span>{projectId ? `Project ${projectId.slice(0, 6)}…` : "Untitled Project"}</span>
        <ChevronDown className="size-3 text-t-tertiary" />
      </button>
    </div>
  );
}
