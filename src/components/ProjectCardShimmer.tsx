"use client";

function ShimmerBar({ className }: { className?: string }) {
  return <div className={`activity-shimmer-bar ${className ?? ""}`} />;
}

function ProjectCardSkeleton() {
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-b-secondary bg-surface-elevated shadow-sm">
      {/* Preview area — same aspect-[16/9] + bg as real card */}
      <div className="relative aspect-[16/9] w-full border-b border-b-secondary/80 bg-surface-sunken">
        <div className="flex h-full items-center justify-center gap-3 px-4">
          {/* Mini phone skeletons matching ProjectFramePreview's ~58×127 screens */}
          <div className="flex items-end gap-2">
            <ShimmerBar className="h-[80px] w-[38px] rounded-xl" />
            <ShimmerBar className="h-[80px] w-[38px] rounded-xl opacity-50" />
            <ShimmerBar className="h-[80px] w-[38px] rounded-xl opacity-25" />
          </div>
        </div>
      </div>
      {/* Text area — same px-4 py-3 gap-1 as real card */}
      <div className="flex flex-col justify-center gap-1 px-4 py-3">
        {/* Title: text-sm font-semibold → ~20px line-height */}
        <ShimmerBar className="h-[14px] w-3/5 rounded" />
        {/* Subtitle: text-[11px] font-mono → ~16px line-height */}
        <ShimmerBar className="h-[11px] w-2/5 rounded" />
      </div>
    </article>
  );
}

export function ProjectCardShimmer({ count = 6 }: { count?: number }) {
  return (
    <div className="w-full max-w-[880px] mt-10 rounded-2xl border border-b-secondary bg-surface-elevated/60 backdrop-blur-xl p-5 sm:p-6">
      {/* Header — matches "Recent projects" + count layout */}
      <div className="flex items-center justify-between mb-5">
        <ShimmerBar className="h-[11px] w-28 rounded" />
        <ShimmerBar className="h-[10px] w-16 rounded" />
      </div>
      {/* Grid — same cols + gap as real project grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: count }).map((_, i) => (
          <ProjectCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
