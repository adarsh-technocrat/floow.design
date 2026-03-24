import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/landing/Footer";
import { PromptCTA } from "@/components/landing/PromptCTA";
import {
  getAllComparisons,
  DUMMY_COMPARISONS,
  type Comparison,
} from "@/lib/comparisons";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Compare floow.design vs Competitors — AI Design Tool Comparison",
  description:
    "See how floow.design compares to Figma, Uizard, Visily, and FlutterFlow for AI-powered mobile app design. Honest, detailed comparisons.",
  alternates: { canonical: "https://www.floow.design/compare" },
  openGraph: {
    title: "Compare floow.design vs Competitors — AI Design Tool Comparison",
    description:
      "See how floow.design compares to Figma, Uizard, Visily, and FlutterFlow for AI-powered mobile app design.",
    url: "https://www.floow.design/compare",
  },
};

export const dynamic = "force-dynamic";

export default async function ComparePage() {
  let comparisons: Comparison[];
  try {
    const db = await getAllComparisons();
    comparisons = db.length > 0 ? db : DUMMY_COMPARISONS;
  } catch {
    comparisons = DUMMY_COMPARISONS;
  }

  return (
    <div className="relative w-full bg-surface text-t-primary">
      <div className="relative mx-auto max-w-6xl border-x border-b-secondary">
        <Header />

        {/* Hero */}
        <div className="border-b border-b-secondary px-4 py-8 sm:px-6 sm:py-12 md:px-12 md:py-20">
          <div className="flex flex-col gap-4 items-center text-center max-w-2xl mx-auto">
            <div className="flex items-center gap-2 rounded-full bg-input-bg px-3 py-1 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              <span className="text-xs font-mono text-t-secondary">
                Honest Comparisons
              </span>
            </div>
            <h1
              className="text-[24px] sm:text-[32px] md:text-[48px] font-semibold leading-tight tracking-tight text-t-primary"
              style={{
                fontFamily: "var(--font-logo), 'Space Grotesk', sans-serif",
              }}
            >
              floow.design vs the competition
            </h1>
            <p className="text-t-secondary text-sm sm:text-base md:text-lg leading-relaxed max-w-xl">
              See how floow.design compares to other design and prototyping
              tools. No marketing fluff — just honest feature comparisons.
            </p>
          </div>
        </div>

        {/* CTA banner */}
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 border-b border-b-secondary px-5 py-3 text-[11px] font-mono text-t-tertiary">
          <Link
            href="/features"
            className="hover:text-t-secondary transition-colors no-underline"
          >
            Features
          </Link>
          <span className="hidden sm:inline">·</span>
          <Link
            href="/blog"
            className="hover:text-t-secondary transition-colors no-underline"
          >
            Blog
          </Link>
          <span className="hidden sm:inline">·</span>
          <Link
            href="/pricing"
            className="hover:text-t-secondary transition-colors no-underline"
          >
            Pricing
          </Link>
          <span className="hidden sm:inline">·</span>
          <Link
            href="/project"
            className="text-btn-primary-text bg-btn-primary-bg px-3 py-1 rounded hover:opacity-90 transition-colors no-underline"
          >
            Try floow.design free →
          </Link>
        </div>

        {/* Comparison cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 divide-b-secondary">
          {comparisons.map((comp, i) => (
            <Link
              key={comp.slug}
              href={`/compare/${comp.slug}`}
              className={`group flex flex-col gap-5 p-6 md:p-10 transition-colors hover:bg-input-bg/80 no-underline ${
                i % 2 === 0 ? "md:border-r md:border-b-secondary" : ""
              } ${i < comparisons.length - 2 ? "md:border-b md:border-b-secondary" : ""}`}
            >
              {/* VS badge */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-btn-primary-bg text-btn-primary-text text-[10px] font-mono font-bold">
                    f
                  </div>
                  <span className="text-[11px] font-mono font-bold text-t-tertiary">
                    VS
                  </span>
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-input-bg border border-b-secondary text-[10px] font-mono font-bold text-t-secondary">
                    {comp.competitorName.charAt(0)}
                  </div>
                </div>
                <span className="text-[11px] font-mono font-semibold uppercase tracking-widest text-t-tertiary">
                  floow vs {comp.competitorName}
                </span>
              </div>

              {/* Content */}
              <h2
                className="text-lg md:text-xl font-semibold text-t-primary leading-snug"
                style={{
                  fontFamily: "var(--font-logo), 'Space Grotesk', sans-serif",
                }}
              >
                {comp.title}
              </h2>

              <p className="text-sm text-t-secondary leading-relaxed line-clamp-3">
                {comp.description}
              </p>

              {/* Quick comparison */}
              <div className="grid grid-cols-2 gap-3 mt-auto">
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-t-tertiary">
                    floow.design
                  </span>
                  {comp.floowPros.slice(0, 2).map((p) => (
                    <div key={p} className="flex items-start gap-1.5">
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        className="text-green-500 mt-0.5 shrink-0"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      <span className="text-[11px] text-t-secondary line-clamp-1">
                        {p}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-t-tertiary">
                    {comp.competitorName}
                  </span>
                  {comp.competitorPros.slice(0, 2).map((p) => (
                    <div key={p} className="flex items-start gap-1.5">
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        className="text-blue-500 mt-0.5 shrink-0"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      <span className="text-[11px] text-t-secondary line-clamp-1">
                        {p}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Read more */}
              <div className="flex items-center gap-2 pt-3 border-t border-b-secondary">
                <span className="text-[11px] font-mono font-medium text-t-tertiary group-hover:text-t-secondary transition-colors">
                  Read full comparison
                </span>
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  className="text-t-tertiary group-hover:text-t-secondary group-hover:translate-x-0.5 transition-all"
                >
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="border-t border-b-secondary">
          <div className="mx-auto max-w-xl px-4 py-12 sm:py-16 text-center">
            <h2
              className="text-xl sm:text-2xl font-semibold text-t-primary mb-3"
              style={{
                fontFamily: "var(--font-logo), 'Space Grotesk', sans-serif",
              }}
            >
              See the difference for yourself
            </h2>
            <p className="text-sm text-t-secondary mb-8 max-w-md mx-auto">
              Try floow.design free and experience AI-powered mobile app design
              firsthand.
            </p>
            <PromptCTA
              variant="compact"
              placeholder="Describe your app idea and hit Generate..."
            />
          </div>
        </div>

        <Footer />
      </div>
    </div>
  );
}
