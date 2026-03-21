"use client";

import Link from "next/link";
import { ChevronDown } from "lucide-react";

export function CanvasTopLeft() {
  return (
    <div className="absolute left-0 top-0 z-10 flex h-12 items-center gap-3 px-4">
      {/* Logo */}
      <Link
        href="/dashboard"
        className="flex items-center gap-1.5 no-underline"
        title="Back to dashboard"
      >
        <span
          className="text-sm font-bold tracking-tight text-white"
          style={{ fontFamily: "var(--font-logo), 'Space Grotesk', sans-serif" }}
        >
          launchpad<span className="text-white/40">.ai</span>
        </span>
      </Link>

      <div className="h-4 w-px bg-white/[0.12]" />

      {/* Project name */}
      <button
        type="button"
        className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-white/60 hover:text-white hover:bg-white/[0.06] transition-colors"
      >
        <span>Untitled Project</span>
        <ChevronDown className="size-3 text-white/30" />
      </button>
    </div>
  );
}
