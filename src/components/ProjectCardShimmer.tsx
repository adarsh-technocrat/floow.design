"use client";

function ShimmerBar({ className }: { className?: string }) {
  return <div className={`activity-shimmer-bar ${className ?? ""}`} />;
}

function ProjectCardSkeleton() {
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-b-secondary bg-surface-elevated shadow-sm">
      {/* Preview area */}
      <div className="relative aspect-[16/9] w-full border-b border-b-secondary/80 bg-surface-sunken">
        <div className="flex h-full items-center justify-center gap-3 px-4">
          {/* Mini phone skeletons */}
          <div className="flex items-end gap-2">
            <ShimmerBar className="h-[72px] w-[34px] rounded-lg" />
            <ShimmerBar className="h-[72px] w-[34px] rounded-lg opacity-60" />
            <ShimmerBar className="h-[72px] w-[34px] rounded-lg opacity-30" />
          </div>
        </div>
      </div>
      {/* Text area */}
      <div className="flex flex-col gap-2 px-4 py-3">
        <ShimmerBar className="h-4 w-3/5 rounded-md" />
        <ShimmerBar className="h-3 w-2/5 rounded-md" />
      </div>
    </article>
  );
}

export function ProjectCardShimmer({ count = 6 }: { count?: number }) {
  return (
    <div className="w-full max-w-[880px] mt-10 rounded-2xl border border-b-secondary bg-surface-elevated/60 backdrop-blur-xl p-5 sm:p-6">
      <div className="flex items-center justify-between mb-5">
        <ShimmerBar className="h-3 w-28 rounded-md" />
        <ShimmerBar className="h-3 w-16 rounded-md" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: count }).map((_, i) => (
          <ProjectCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
