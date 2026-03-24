import { notFound } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/landing/Footer";
import { MdxRenderer } from "@/components/blog/MdxRenderer";
import { PromptCTA } from "@/components/landing/PromptCTA";
import {
  getAllFeatures,
  getFeatureBySlug,
  DUMMY_FEATURES,
  type Feature,
} from "@/lib/features";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function resolveFeature(slug: string): Promise<Feature | undefined> {
  try {
    const db = await getFeatureBySlug(slug);
    if (db) return db;
  } catch {
    /* db not ready */
  }
  return DUMMY_FEATURES.find((f) => f.slug === slug);
}

async function resolveAllFeatures(): Promise<Feature[]> {
  try {
    const db = await getAllFeatures();
    if (db.length > 0) return db;
  } catch {
    /* db not ready */
  }
  return DUMMY_FEATURES;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const feature = await resolveFeature(slug);
  if (!feature) return { title: "Feature Not Found" };

  return {
    title: `${feature.title} — floow.design`,
    description: feature.description,
    keywords: feature.keywords,
    openGraph: {
      title: `${feature.title} — floow.design`,
      description: feature.description,
      type: "website",
      siteName: "floow.design",
      ...(feature.imageUrl && {
        images: [{ url: feature.imageUrl, width: 1200, height: 630 }],
      }),
    },
    twitter: {
      card: "summary_large_image",
      title: `${feature.title} — floow.design`,
      description: feature.description,
    },
    alternates: { canonical: `/features/${slug}` },
  };
}

export default async function FeaturePage({ params }: PageProps) {
  const { slug } = await params;
  const feature = await resolveFeature(slug);
  if (!feature) notFound();

  const allFeatures = await resolveAllFeatures();
  const currentIndex = allFeatures.findIndex((f) => f.slug === slug);
  const otherFeatures = allFeatures.filter((f) => f.slug !== slug);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: feature.title,
    description: feature.description,
    url: `https://www.floow.design/features/${slug}`,
    isPartOf: {
      "@type": "WebSite",
      name: "floow.design",
      url: "https://www.floow.design",
    },
    about: {
      "@type": "SoftwareApplication",
      name: "floow.design",
      applicationCategory: "DesignApplication",
      operatingSystem: "Web",
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
            href="/features"
            className="hover:text-t-secondary transition-colors no-underline"
          >
            Features
          </Link>
          <span>/</span>
          <span className="text-t-secondary truncate max-w-[200px]">
            {feature.title}
          </span>
        </nav>

        {/* Hero */}
        <div className="px-4 py-8 sm:px-6 sm:py-12 md:px-12 md:py-16">
          <div className="max-w-3xl mx-auto">
            <div className="flex flex-wrap items-center gap-3 mb-6">
              {feature.keywords.slice(0, 3).map((kw) => (
                <span
                  key={kw}
                  className="rounded-full bg-input-bg px-2.5 py-0.5 text-[11px] font-mono uppercase tracking-wider text-t-tertiary border border-b-secondary"
                >
                  #{kw.replace(/\s+/g, "-")}
                </span>
              ))}
            </div>

            <h1
              className="text-2xl md:text-4xl font-semibold leading-tight tracking-tight text-t-primary mb-4"
              style={{
                fontFamily: "var(--font-logo), 'Space Grotesk', sans-serif",
              }}
            >
              {feature.headline}
            </h1>

            <p className="text-base md:text-lg text-t-secondary leading-relaxed max-w-2xl">
              {feature.description}
            </p>

            {/* CTA buttons */}
            <div className="flex flex-col sm:flex-row gap-3 mt-8">
              <Link
                href="/project"
                className="inline-flex h-11 items-center justify-center px-6 rounded border-0 bg-btn-primary-bg text-[11px] font-semibold uppercase tracking-wider text-btn-primary-text hover:opacity-90 transition-colors no-underline font-mono"
              >
                Try it free
              </Link>
              <Link
                href="/pricing"
                className="inline-flex h-11 items-center justify-center px-6 rounded border border-b-secondary text-[11px] font-semibold uppercase tracking-wider text-t-secondary hover:text-t-primary transition-colors no-underline font-mono"
              >
                View pricing
              </Link>
            </div>
          </div>
        </div>

        {/* Video / Image placeholder */}
        <div className="border-y border-b-secondary">
          {feature.videoUrl ? (
            <div className="aspect-video w-full bg-surface-sunken">
              <video
                src={feature.videoUrl}
                controls
                className="w-full h-full object-cover"
                poster={feature.imageUrl ?? undefined}
              />
            </div>
          ) : feature.imageUrl ? (
            <img
              src={feature.imageUrl}
              alt={feature.title}
              className="w-full h-[240px] sm:h-[320px] md:h-[420px] object-cover"
            />
          ) : (
            <div className="w-full h-[200px] sm:h-[280px] md:h-[360px] bg-gradient-to-br from-input-bg to-surface flex items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <div className="w-16 h-16 rounded-2xl bg-surface border border-b-secondary flex items-center justify-center">
                  <svg
                    width="32"
                    height="32"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1"
                    className="text-t-tertiary"
                  >
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                </div>
                <span className="text-[11px] font-mono text-t-tertiary uppercase tracking-wider">
                  Feature video coming soon
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Benefits grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-px border-b border-b-secondary bg-b-secondary">
          {feature.benefits.map((benefit) => (
            <div
              key={benefit}
              className="flex items-start gap-3 bg-surface px-6 py-6 md:px-8 md:py-8"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                className="text-green-500 mt-0.5 shrink-0"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span className="text-sm text-t-primary font-medium">
                {benefit}
              </span>
            </div>
          ))}
        </div>

        {/* Main content */}
        <article className="mx-auto max-w-3xl px-4 pb-8 pt-8 sm:px-6 sm:pb-10 sm:pt-10 md:px-16 md:pb-14 md:pt-12">
          <MdxRenderer source={feature.content} />
        </article>

        {/* Prompt CTA */}
        <div className="border-t border-b-secondary">
          <div className="mx-auto max-w-xl px-4 py-10 sm:py-14 text-center">
            <p
              className="text-lg sm:text-xl font-semibold text-t-primary mb-2"
              style={{
                fontFamily: "var(--font-logo), 'Space Grotesk', sans-serif",
              }}
            >
              Try {feature.title} now
            </p>
            <p className="text-sm text-t-secondary mb-6 max-w-md mx-auto">
              Describe your app idea and see this feature in action.
            </p>
            <PromptCTA
              variant="compact"
              placeholder="Describe your app idea and hit Generate..."
            />
          </div>
        </div>

        {/* Other features */}
        {otherFeatures.length > 0 && (
          <div className="border-t border-b-secondary">
            <div className="border-b border-b-secondary px-5 py-3">
              <span className="text-[11px] font-mono font-medium uppercase tracking-wider text-t-tertiary">
                Explore More Features
              </span>
            </div>
            <div className="grid grid-cols-1 divide-y divide-b-secondary md:grid-cols-3 md:divide-x md:divide-y-0 md:divide-b-secondary">
              {otherFeatures.slice(0, 3).map((f) => (
                <Link
                  key={f.slug}
                  href={`/features/${f.slug}`}
                  className="group flex flex-col gap-2 p-5 md:p-6 transition-colors hover:bg-input-bg/80 no-underline"
                >
                  <span className="text-[11px] font-mono uppercase tracking-wider text-t-tertiary">
                    {f.title}
                  </span>
                  <span className="text-sm font-medium text-t-primary leading-snug">
                    {f.headline}
                  </span>
                  <span className="text-[11px] font-mono text-t-tertiary group-hover:text-t-secondary transition-colors">
                    Learn more →
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Prev / Next features */}
        <div className="grid grid-cols-1 divide-y divide-b-secondary border-t border-b-secondary md:grid-cols-2 md:divide-x md:divide-y-0 md:divide-b-secondary">
          {currentIndex > 0 ? (
            <Link
              href={`/features/${allFeatures[currentIndex - 1].slug}`}
              className="group flex flex-col gap-2 p-6 md:p-8 transition-colors hover:bg-input-bg/80 no-underline"
            >
              <span className="text-[11px] font-mono uppercase tracking-wider text-t-tertiary">
                ← Previous Feature
              </span>
              <span className="text-sm font-medium text-t-primary">
                {allFeatures[currentIndex - 1].title}
              </span>
            </Link>
          ) : (
            <div className="hidden md:block" aria-hidden />
          )}
          {currentIndex < allFeatures.length - 1 ? (
            <Link
              href={`/features/${allFeatures[currentIndex + 1].slug}`}
              className="group flex flex-col gap-2 p-6 md:p-8 items-end text-right hover:bg-input-bg transition-colors no-underline"
            >
              <span className="text-[11px] font-mono uppercase tracking-wider text-t-tertiary">
                Next Feature →
              </span>
              <span className="text-sm font-medium text-t-primary">
                {allFeatures[currentIndex + 1].title}
              </span>
            </Link>
          ) : (
            <div className="hidden md:block" aria-hidden />
          )}
        </div>

        <Footer />
      </div>
    </div>
  );
}
