import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/landing/Footer";
import { PromptCTA } from "@/components/landing/PromptCTA";
import { getAllFeatures, DUMMY_FEATURES, type Feature } from "@/lib/features";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Features — AI Mobile App Design Tool | floow.design",
  description:
    "Explore floow.design features: AI app design, screen generation, Figma export, iOS & Android support, multi-screen flows, and custom themes.",
  alternates: { canonical: "https://www.floow.design/features" },
  openGraph: {
    title: "Features — AI Mobile App Design Tool | floow.design",
    description:
      "Explore floow.design features: AI app design, screen generation, Figma export, iOS & Android support, multi-screen flows, and custom themes.",
    url: "https://www.floow.design/features",
  },
};

export const dynamic = "force-dynamic";

const ICONS: Record<string, React.ReactNode> = {
  sparkles: (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 3l1.912 5.813a2 2 0 001.275 1.275L21 12l-5.813 1.912a2 2 0 00-1.275 1.275L12 21l-1.912-5.813a2 2 0 00-1.275-1.275L3 12l5.813-1.912a2 2 0 001.275-1.275L12 3z" />
    </svg>
  ),
  layout: (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M3 9h18M9 21V9" />
    </svg>
  ),
  download: (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
    </svg>
  ),
  smartphone: (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="5" y="2" width="14" height="20" rx="2" />
      <path d="M12 18h.01" />
    </svg>
  ),
  "git-branch": (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="6" y1="3" x2="6" y2="15" />
      <circle cx="18" cy="6" r="3" />
      <circle cx="6" cy="18" r="3" />
      <path d="M18 9a9 9 0 01-9 9" />
    </svg>
  ),
  palette: (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="13.5" cy="6.5" r="0.5" fill="currentColor" />
      <circle cx="17.5" cy="10.5" r="0.5" fill="currentColor" />
      <circle cx="8.5" cy="7.5" r="0.5" fill="currentColor" />
      <circle cx="6.5" cy="12.5" r="0.5" fill="currentColor" />
      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 011.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" />
    </svg>
  ),
};

export default async function FeaturesPage() {
  let features: Feature[];
  try {
    const dbFeatures = await getAllFeatures();
    features = dbFeatures.length > 0 ? dbFeatures : DUMMY_FEATURES;
  } catch {
    features = DUMMY_FEATURES;
  }

  return (
    <div className="relative w-full bg-surface text-t-primary">
      <div className="relative mx-auto max-w-6xl border-x border-b-secondary">
        <Header />

        {/* Hero */}
        <div className="border-b border-b-secondary px-4 py-8 sm:px-6 sm:py-12 md:px-12 md:py-20">
          <div className="flex flex-col gap-4 items-center text-center max-w-2xl mx-auto">
            <div className="flex items-center gap-2 rounded-full bg-input-bg px-3 py-1 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs font-mono text-t-secondary">
                Platform Features
              </span>
            </div>
            <h1
              className="text-[24px] sm:text-[32px] md:text-[48px] font-semibold leading-tight tracking-tight text-t-primary"
              style={{
                fontFamily: "var(--font-logo), 'Space Grotesk', sans-serif",
              }}
            >
              Everything you need to design mobile apps
            </h1>
            <p className="text-t-secondary text-sm sm:text-base md:text-lg leading-relaxed max-w-xl">
              From idea to polished design — AI-powered features that make
              mobile app design 10x faster.
            </p>
          </div>
        </div>

        {/* CTA banner */}
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 border-b border-b-secondary px-5 py-3 text-[11px] font-mono text-t-tertiary">
          <Link
            href="/blog"
            className="hover:text-t-secondary transition-colors no-underline"
          >
            Blog
          </Link>
          <span className="hidden sm:inline">·</span>
          <Link
            href="/compare"
            className="hover:text-t-secondary transition-colors no-underline"
          >
            Compare
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
            Start designing free →
          </Link>
        </div>

        {/* Feature cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 divide-b-secondary">
          {features.map((feature, i) => (
            <Link
              key={feature.slug}
              href={`/features/${feature.slug}`}
              className={`group flex flex-col gap-5 p-6 md:p-10 transition-colors hover:bg-input-bg/80 no-underline ${
                i % 2 === 0 ? "md:border-r md:border-b-secondary" : ""
              } ${i < features.length - 2 ? "md:border-b md:border-b-secondary" : ""} ${i < features.length - 1 ? "" : ""}`}
            >
              {/* Icon */}
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-input-bg border border-b-secondary text-t-secondary">
                  {feature.icon && ICONS[feature.icon] ? (
                    ICONS[feature.icon]
                  ) : (
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    >
                      <path d="M12 3l1.912 5.813a2 2 0 001.275 1.275L21 12l-5.813 1.912a2 2 0 00-1.275 1.275L12 21l-1.912-5.813a2 2 0 00-1.275-1.275L3 12l5.813-1.912a2 2 0 001.275-1.275L12 3z" />
                    </svg>
                  )}
                </div>
                <span className="text-[11px] font-mono font-semibold uppercase tracking-widest text-t-tertiary">
                  {feature.title}
                </span>
              </div>

              {/* Content */}
              <h2
                className="text-lg md:text-xl font-semibold text-t-primary leading-snug"
                style={{
                  fontFamily: "var(--font-logo), 'Space Grotesk', sans-serif",
                }}
              >
                {feature.headline}
              </h2>

              <p className="text-sm text-t-secondary leading-relaxed line-clamp-3">
                {feature.description}
              </p>

              {/* Benefits preview */}
              <div className="flex flex-col gap-2 mt-auto">
                {feature.benefits.slice(0, 3).map((b) => (
                  <div key={b} className="flex items-start gap-2">
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      className="text-green-500 mt-0.5 shrink-0"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span className="text-xs text-t-secondary">{b}</span>
                  </div>
                ))}
              </div>

              {/* Read more */}
              <div className="flex items-center gap-2 pt-3 border-t border-b-secondary">
                <span className="text-[11px] font-mono font-medium text-t-tertiary group-hover:text-t-secondary transition-colors">
                  Learn more
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
              Ready to design your mobile app?
            </h2>
            <p className="text-sm text-t-secondary mb-8 max-w-md mx-auto">
              Describe your app idea and get AI-generated designs in seconds. No
              design skills required.
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
