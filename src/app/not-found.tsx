import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Page Not Found",
  description:
    "The page you're looking for doesn't exist. Head back to floow.design to design mobile apps with AI.",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface px-4 text-center">
      <p
        className="text-[80px] font-bold leading-none tracking-tight text-t-tertiary/20 sm:text-[120px]"
        style={{ fontFamily: "var(--font-logo), 'Space Grotesk', sans-serif" }}
      >
        404
      </p>

      <h1
        className="mt-4 text-2xl font-semibold text-t-primary sm:text-3xl"
        style={{ fontFamily: "var(--font-logo), 'Space Grotesk', sans-serif" }}
      >
        Page not found
      </h1>

      <p className="mt-3 max-w-md text-sm leading-relaxed text-t-secondary">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="rounded-lg bg-btn-primary-bg px-5 py-2.5 text-sm font-medium text-btn-primary-text transition-colors hover:opacity-90"
        >
          Back to home
        </Link>
        <Link
          href="/blog"
          className="rounded-lg border border-b-secondary px-5 py-2.5 text-sm font-medium text-t-secondary transition-colors hover:text-t-primary"
        >
          Read the blog
        </Link>
        <Link
          href="/templates"
          className="rounded-lg border border-b-secondary px-5 py-2.5 text-sm font-medium text-t-secondary transition-colors hover:text-t-primary"
        >
          Browse templates
        </Link>
      </div>
    </div>
  );
}
