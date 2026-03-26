import Link from "next/link";
import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/landing/Footer";
import { TemplateCardCarousel } from "./TemplateCardCarousel";
import { prisma } from "@/lib/db";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mobile App Templates – floow.design",
  description:
    "Browse beautiful, ready-to-use mobile app design templates. Finance, social, e-commerce, and more — customize instantly with AI.",
  alternates: {
    canonical: "https://www.floow.design/templates",
  },
  openGraph: {
    title: "Mobile App Templates – floow.design",
    description:
      "Browse beautiful, ready-to-use mobile app design templates. Customize instantly with AI.",
    url: "https://www.floow.design/templates",
  },
};

export const dynamic = "force-dynamic";

async function getTemplates() {
  const templates = await prisma.project.findMany({
    where: { isTemplate: true, trashedAt: null },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      templateTag: true,
      templateSlug: true,
      templateDesc: true,
      thumbnail: true,
      _count: { select: { frames: true } },
      frames: {
        where: { html: { not: "" } },
        orderBy: { updatedAt: "asc" },
        select: { id: true, label: true, html: true },
      },
    },
  });

  return templates.map((t) => ({
    id: t.id,
    name: t.name,
    tag: t.templateTag || "Template",
    slug: t.templateSlug,
    description: t.templateDesc,
    screens: t._count.frames,
    thumbnail: t.thumbnail,
    frames: t.frames
      .filter((f) => f.html.length > 50)
      .map((f) => ({ id: f.id, label: f.label, html: f.html })),
  }));
}

export default async function TemplatesPage() {
  const templates = await getTemplates();

  return (
    <div className="relative w-full bg-surface text-t-primary">
      <div className="relative mx-auto max-w-6xl border-x border-b-secondary">
        <Header />

        <div className="border-b border-b-secondary px-4 py-8 sm:px-6 sm:py-12 md:px-12 md:py-20">
          <div className="flex flex-col gap-4 items-center text-center max-w-2xl mx-auto">
            <div className="flex items-center gap-2 rounded-full bg-input-bg px-3 py-1 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-violet-500 animate-pulse" />
              <span className="text-xs font-mono text-t-secondary">
                Ready to use
              </span>
            </div>
            <h1
              className="text-[24px] sm:text-[32px] md:text-[48px] font-semibold leading-tight tracking-tight text-t-primary"
              style={{
                fontFamily: "var(--font-logo), 'Space Grotesk', sans-serif",
              }}
            >
              Templates
            </h1>
            <p className="text-t-secondary text-sm sm:text-base md:text-lg leading-relaxed max-w-xl">
              Beautiful mobile app designs you can customize instantly with AI.
              Pick a template and make it yours.
            </p>
          </div>
        </div>

        {templates.length === 0 ? (
          <div className="flex items-center justify-center py-20 px-4">
            <p className="text-sm text-t-tertiary">
              No templates yet. Check back soon.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 p-4 sm:grid-cols-2 sm:p-6 lg:grid-cols-3 lg:p-8">
            {templates.map((t) => (
              <Link
                key={t.id}
                href={t.slug ? `/templates/${t.slug}` : `/templates`}
                className="group flex flex-col overflow-hidden rounded-xl border border-b-secondary bg-surface-elevated transition-all hover:-translate-y-1 hover:shadow-lg no-underline"
              >
                <div
                  className="relative aspect-[9/14] w-full overflow-hidden"
                  style={{
                    backgroundColor: "var(--canvas-bg, #0a0a0a)",
                    backgroundImage: "radial-gradient(var(--canvas-dot) 0.65px, transparent 0.65px)",
                    backgroundSize: "14px 14px",
                  }}
                >
                  {t.frames.length > 0 ? (
                    <TemplateCardCarousel frames={t.frames} />
                  ) : t.thumbnail ? (
                    <img
                      alt={t.name}
                      src={t.thumbnail}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <span className="text-xs font-mono text-t-tertiary">
                        {t.screens} screens
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2 p-4 border-t border-b-secondary">
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-btn-primary-bg/15 px-2 py-0.5 text-[10px] font-mono font-semibold uppercase tracking-wider text-btn-primary-bg">
                      {t.tag}
                    </span>
                    <span className="text-[11px] font-mono text-t-tertiary">
                      {t.screens} screens
                    </span>
                  </div>
                  <h2 className="text-sm font-semibold text-t-primary line-clamp-1">
                    {t.name}
                  </h2>
                  {t.description && (
                    <p className="text-xs text-t-secondary line-clamp-2">
                      {t.description}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}

        <Footer />
      </div>
    </div>
  );
}
