"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface px-4 text-center">
      <p
        className="text-[80px] font-bold leading-none tracking-tight text-t-tertiary/20 sm:text-[120px]"
        style={{ fontFamily: "var(--font-logo), 'Space Grotesk', sans-serif" }}
      >
        500
      </p>

      <h1
        className="mt-4 text-2xl font-semibold text-t-primary sm:text-3xl"
        style={{ fontFamily: "var(--font-logo), 'Space Grotesk', sans-serif" }}
      >
        Something went wrong
      </h1>

      <p className="mt-3 max-w-md text-sm leading-relaxed text-t-secondary">
        An unexpected error occurred. Please try again.
      </p>

      <button
        onClick={reset}
        className="mt-8 rounded-lg bg-btn-primary-bg px-5 py-2.5 text-sm font-medium text-btn-primary-text transition-colors hover:opacity-90"
      >
        Try again
      </button>
    </div>
  );
}
