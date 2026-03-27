"use client";

function ShimmerBar({ className }: { className?: string }) {
  return <div className={`activity-shimmer-bar ${className ?? ""}`} />;
}

function ProjectCardSkeleton() {
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-b-secondary bg-surface-elevated shadow-sm">
      {/* Preview area — same aspect-[16/9] + bg as real card */}
      <div className="relative aspect-[16/9] w-full border-b border-b-secondary/80 bg-surface-sunken">
        <ShimmerBar className="absolute inset-0 rounded-none" />
      </div>
      {/* Text area — same px-4 py-3 gap-1 as real card */}
      <div className="flex flex-col justify-center gap-1 px-4 py-3">
        <ShimmerBar className="h-[14px] w-full rounded" />
        <ShimmerBar className="h-[11px] w-full rounded" />
      </div>
    </article>
  );
}

export function ProjectCardShimmer({ count = 6 }: { count?: number }) {
  return (
    <div className="w-full max-w-[880px] mt-10 rounded-2xl border border-b-secondary bg-surface-elevated/60 backdrop-blur-xl p-5 sm:p-6">
      {/* Header — matches "Recent projects" + count layout */}
      <div className="flex items-center justify-between mb-5">
        <ShimmerBar className="h-[11px] w-full rounded" />
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
