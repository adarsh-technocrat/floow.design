import { notFound } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/landing/Footer";
import { MdxRenderer } from "@/components/blog/MdxRenderer";
import {
  getAllComparisons,
  getComparisonBySlug,
  DUMMY_COMPARISONS,
  type Comparison,
} from "@/lib/comparisons";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function resolveComparison(
  slug: string,
): Promise<Comparison | undefined> {
  try {
    const db = await getComparisonBySlug(slug);
    if (db) return db;
  } catch {
    /* db not ready */
  }
  return DUMMY_COMPARISONS.find((c) => c.slug === slug);
}

async function resolveAllComparisons(): Promise<Comparison[]> {
  try {
    const db = await getAllComparisons();
    if (db.length > 0) return db;
  } catch {
    /* db not ready */
  }
  return DUMMY_COMPARISONS;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const comp = await resolveComparison(slug);
  if (!comp) return { title: "Comparison Not Found" };

  return {
    title: comp.title,
    description: comp.description,
    keywords: comp.keywords,
    openGraph: {
      title: comp.title,
      description: comp.description,
      type: "website",
      siteName: "floow.design",
    },
    twitter: {
      card: "summary_large_image",
      title: comp.title,
      description: comp.description,
    },
    alternates: { canonical: `/compare/${slug}` },
  };
}

function FeatureCheck({ has }: { has: boolean }) {
  return has ? (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      className="text-green-500"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ) : (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      className="text-t-tertiary/40"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

export default async function ComparisonPage({ params }: PageProps) {
  const { slug } = await params;
  const comp = await resolveComparison(slug);
  if (!comp) notFound();

  const allComparisons = await resolveAllComparisons();
  const otherComparisons = allComparisons.filter((c) => c.slug !== slug);

  // Merge all features for the comparison table
  const allFeatureLabels = [
    ...new Set([...comp.floowFeatures, ...comp.competitorFeatures]),
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: comp.title,
    description: comp.description,
    url: `https://www.floow.design/compare/${slug}`,
    isPartOf: {
      "@type": "WebSite",
      name: "floow.design",
      url: "https://www.floow.design",
    },
  };

  return (
    <div className="relative w-full bg-surface text-t-primary">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="relative mx-auto max-w-6xl border-x border-b-secondary">
        <Header />

        {/* Breadcrumb */}
        <nav
          className="flex items-center gap-2 border-b border-b-secondary px-5 py-3 text-[11px] font-mono text-t-tertiary"
          aria-label="Breadcrumb"
        >
          <Link
            href="/"
            className="hover:text-t-secondary transition-colors no-underline"
          >
            Home
          </Link>
          <span>/</span>
          <Link
            href="/compare"
            className="hover:text-t-secondary transition-colors no-underline"
          >
            Compare
          </Link>
          <span>/</span>
          <span className="text-t-secondary truncate max-w-[200px]">
            floow vs {comp.competitorName}
          </span>
        </nav>

        {/* Hero */}
        <div className="px-4 py-8 sm:px-6 sm:py-12 md:px-12 md:py-16">
          <div className="max-w-3xl mx-auto text-center">
            {/* VS Badge */}
            <div className="flex items-center justify-center gap-4 mb-8">
              <div className="flex flex-col items-center gap-2">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-btn-primary-bg text-btn-primary-text text-lg font-mono font-bold">
                  f
                </div>
                <span className="text-[11px] font-mono font-medium text-t-secondary">
                  floow.design
                </span>
              </div>
              <span
                className="text-2xl font-bold text-t-tertiary"
                style={{
                  fontFamily: "var(--font-logo), 'Space Grotesk', sans-serif",
                }}
              >
                vs
              </span>
              <div className="flex flex-col items-center gap-2">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-input-bg border border-b-secondary text-lg font-mono font-bold text-t-secondary">
                  {comp.competitorName.charAt(0)}
                </div>
                <span className="text-[11px] font-mono font-medium text-t-secondary">
                  {comp.competitorName}
                </span>
              </div>
            </div>

            <h1
              className="text-2xl md:text-4xl font-semibold leading-tight tracking-tight text-t-primary mb-4"
              style={{
                fontFamily: "var(--font-logo), 'Space Grotesk', sans-serif",
              }}
            >
              {comp.title}
            </h1>

            <p className="text-base md:text-lg text-t-secondary leading-relaxed max-w-2xl mx-auto">
              {comp.description}
            </p>

            <div className="flex flex-wrap items-center justify-center gap-2 mt-6">
              {comp.keywords.slice(0, 4).map((kw) => (
                <span
                  key={kw}
                  className="rounded-full bg-input-bg px-2.5 py-0.5 text-[11px] font-mono uppercase tracking-wider text-t-tertiary border border-b-secondary"
                >
                  #{kw.replace(/\s+/g, "-")}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Feature comparison table */}
        <div className="border-y border-b-secondary">
          <div className="px-5 py-3 border-b border-b-secondary">
            <span className="text-[11px] font-mono font-medium uppercase tracking-wider text-t-tertiary">
              Feature Comparison
            </span>
          </div>

          {/* Table header */}
          <div className="grid grid-cols-[1fr_80px_80px] sm:grid-cols-[1fr_120px_120px] border-b border-b-secondary bg-input-bg/50">
            <div className="px-4 py-3 sm:px-6">
              <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-t-tertiary">
                Feature
              </span>
            </div>
            <div className="px-2 py-3 text-center border-l border-b-secondary">
              <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-t-primary">
                floow
              </span>
            </div>
            <div className="px-2 py-3 text-center border-l border-b-secondary">
              <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-t-secondary">
                {comp.competitorName.length > 10
                  ? comp.competitorName.slice(0, 8) + "…"
                  : comp.competitorName}
              </span>
            </div>
          </div>

          {/* Table rows */}
          {allFeatureLabels.map((feature) => (
            <div
              key={feature}
              className="grid grid-cols-[1fr_80px_80px] sm:grid-cols-[1fr_120px_120px] border-b border-b-secondary last:border-b-0 hover:bg-input-bg/30 transition-colors"
            >
              <div className="px-4 py-3 sm:px-6">
                <span className="text-sm text-t-primary">{feature}</span>
              </div>
              <div className="px-2 py-3 flex items-center justify-center border-l border-b-secondary">
                <FeatureCheck has={comp.floowFeatures.includes(feature)} />
              </div>
              <div className="px-2 py-3 flex items-center justify-center border-l border-b-secondary">
                <FeatureCheck has={comp.competitorFeatures.includes(feature)} />
              </div>
            </div>
          ))}
        </div>

        {/* Pros comparison */}
        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-b-secondary border-b border-b-secondary">
          {/* floow pros */}
          <div className="p-6 md:p-8">
            <div className="flex items-center gap-2 mb-5">
              <div className="h-6 w-6 rounded bg-btn-primary-bg text-btn-primary-text flex items-center justify-center text-[10px] font-mono font-bold">
                f
              </div>
              <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-t-primary">
                floow.design strengths
              </span>
            </div>
            <div className="flex flex-col gap-3">
              {comp.floowPros.map((pro) => (
                <div key={pro} className="flex items-start gap-2.5">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="text-green-500 mt-0.5 shrink-0"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span className="text-sm text-t-secondary">{pro}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Competitor pros */}
          <div className="p-6 md:p-8">
            <div className="flex items-center gap-2 mb-5">
              <div className="h-6 w-6 rounded bg-input-bg border border-b-secondary flex items-center justify-center text-[10px] font-mono font-bold text-t-secondary">
                {comp.competitorName.charAt(0)}
              </div>
              <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-t-primary">
                {comp.competitorName} strengths
              </span>
            </div>
            <div className="flex flex-col gap-3">
              {comp.competitorPros.map((pro) => (
                <div key={pro} className="flex items-start gap-2.5">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="text-blue-500 mt-0.5 shrink-0"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span className="text-sm text-t-secondary">{pro}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Verdict */}
        <div className="border-b border-b-secondary bg-input-bg/30">
          <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 md:px-16">
            <div className="flex items-center gap-2 mb-4">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className="text-t-primary"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              <span
                className="text-base font-semibold text-t-primary"
                style={{
                  fontFamily: "var(--font-logo), 'Space Grotesk', sans-serif",
                }}
              >
                Our Verdict
              </span>
            </div>
            <p className="text-sm text-t-secondary leading-relaxed">
              {comp.verdict}
            </p>
          </div>
        </div>

        {/* Detailed content */}
        <article className="mx-auto max-w-3xl px-4 pb-8 pt-8 sm:px-6 sm:pb-10 sm:pt-10 md:px-16 md:pb-14 md:pt-12">
          <MdxRenderer source={comp.content} />
        </article>

        {/* CTA */}
        <div className="border-t border-b-secondary">
          <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 md:px-16 text-center">
            <p
              className="text-lg sm:text-xl font-semibold text-t-primary mb-2"
              style={{
                fontFamily: "var(--font-logo), 'Space Grotesk', sans-serif",
              }}
            >
              Try floow.design — the mobile-first AI design tool
            </p>
            <p className="text-sm text-t-secondary mb-6 max-w-md mx-auto">
              Generate pixel-perfect iOS & Android screens in seconds. No design
              skills required.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/project"
                className="inline-flex h-10 items-center px-6 rounded border-0 bg-btn-primary-bg text-[11px] font-semibold uppercase tracking-wider text-btn-primary-text hover:opacity-90 transition-colors no-underline font-mono"
              >
                Try floow.design free
              </Link>
              <Link
                href="/pricing"
                className="inline-flex h-10 items-center px-6 rounded border border-b-secondary text-[11px] font-semibold uppercase tracking-wider text-t-secondary hover:text-t-primary transition-colors no-underline font-mono"
              >
                View pricing
              </Link>
            </div>
            <div className="flex items-center justify-center gap-4 mt-4 text-[11px] font-mono text-t-tertiary">
              <Link
                href="/features"
                className="hover:text-t-secondary transition-colors no-underline"
              >
                See features
              </Link>
              <span>·</span>
              <Link
                href="/blog"
                className="hover:text-t-secondary transition-colors no-underline"
              >
                Read blog
              </Link>
            </div>
          </div>
        </div>

        {/* Other comparisons */}
        {otherComparisons.length > 0 && (
          <div className="border-t border-b-secondary">
            <div className="border-b border-b-secondary px-5 py-3">
              <span className="text-[11px] font-mono font-medium uppercase tracking-wider text-t-tertiary">
                More Comparisons
              </span>
            </div>
            <div className="grid grid-cols-1 divide-y divide-b-secondary md:grid-cols-3 md:divide-x md:divide-y-0 md:divide-b-secondary">
              {otherComparisons.slice(0, 3).map((c) => (
                <Link
                  key={c.slug}
                  href={`/compare/${c.slug}`}
                  className="group flex flex-col gap-2 p-5 md:p-6 transition-colors hover:bg-input-bg/80 no-underline"
                >
                  <span className="text-[11px] font-mono uppercase tracking-wider text-t-tertiary">
                    floow vs {c.competitorName}
                  </span>
                  <span className="text-sm font-medium text-t-primary leading-snug">
                    {c.title}
                  </span>
                  <span className="text-[11px] font-mono text-t-tertiary group-hover:text-t-secondary transition-colors">
                    Read comparison →
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        <Footer />
      </div>
    </div>
  );
}
