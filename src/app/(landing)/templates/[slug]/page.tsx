import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/landing/Footer";
import { TemplateUseButton } from "./TemplateUseButton";
import { TemplateScreenPreview } from "./TemplateScreenPreview";
import { prisma } from "@/lib/db";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function getTemplate(slug: string) {
  const template = await prisma.project.findFirst({
    where: { templateSlug: slug, isTemplate: true, trashedAt: null },
    select: {
      id: true,
      name: true,
      templateTag: true,
      templateSlug: true,
      templateDesc: true,
      createdAt: true,
      frames: {
        select: { id: true, label: true, html: true },
        orderBy: { updatedAt: "asc" },
      },
    },
  });
  return template;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const template = await getTemplate(slug);
  if (!template) return { title: "Template Not Found" };

  const title = `${template.name} – Free Mobile App Template | floow.design`;
  const description =
    template.templateDesc ||
    `${template.name} mobile app template with ${template.frames.length} screens. Customize instantly with AI on floow.design.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      url: `https://www.floow.design/templates/${slug}`,
      siteName: "floow.design",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    alternates: {
      canonical: `https://www.floow.design/templates/${slug}`,
    },
  };
}

export default async function TemplateDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const template = await getTemplate(slug);
  if (!template) notFound();

  const tag = template.templateTag || "Template";
  const screenCount = template.frames.length;

  const templateJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CreativeWork",
        name: template.name,
        description:
          template.templateDesc ||
          `${template.name} mobile app template with ${screenCount} screens.`,
        url: `https://www.floow.design/templates/${slug}`,
        creator: { "@type": "Organization", name: "floow.design" },
        isAccessibleForFree: true,
        provider: {
          "@type": "Organization",
          name: "floow.design",
          url: "https://www.floow.design",
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Home",
            item: "https://www.floow.design",
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Templates",
            item: "https://www.floow.design/templates",
          },
          {
            "@type": "ListItem",
            position: 3,
            name: template.name,
            item: `https://www.floow.design/templates/${slug}`,
          },
        ],
      },
    ],
  };

  return (
    <div className="relative w-full bg-surface text-t-primary">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(templateJsonLd) }}
      />
      <div className="relative mx-auto max-w-6xl border-x border-b-secondary">
        <Header />

        <div className="border-b border-b-secondary px-4 py-8 sm:px-6 sm:py-12 md:px-12 md:py-16">
          <div className="flex flex-col gap-6 max-w-3xl mx-auto">
            <nav
              aria-label="Breadcrumb"
              className="flex items-center gap-3 text-xs font-mono text-t-tertiary"
            >
              <Link
                href="/"
                className="hover:text-t-secondary transition-colors"
              >
                Home
              </Link>
              <span aria-hidden="true">/</span>
              <Link
                href="/templates"
                className="hover:text-t-secondary transition-colors"
              >
                Templates
              </Link>
              <span aria-hidden="true">/</span>
              <span className="text-t-secondary" aria-current="page">
                {template.name}
              </span>
            </nav>

            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <span className="rounded bg-btn-primary-bg/15 px-2.5 py-1 text-[11px] font-mono font-semibold uppercase tracking-wider text-btn-primary-bg">
                  {tag}
                </span>
                <span className="text-[11px] font-mono text-t-tertiary">
                  {screenCount} screen{screenCount !== 1 ? "s" : ""}
                </span>
              </div>

              <h1
                className="text-[24px] sm:text-[32px] md:text-[40px] font-semibold leading-tight tracking-tight text-t-primary"
                style={{
                  fontFamily: "var(--font-logo), 'Space Grotesk', sans-serif",
                }}
              >
                {template.name}
              </h1>

              {template.templateDesc && (
                <p className="text-t-secondary text-sm sm:text-base leading-relaxed max-w-2xl">
                  {template.templateDesc}
                </p>
              )}

              <TemplateUseButton templateId={template.id} />
            </div>
          </div>
        </div>

        <div className="px-4 py-8 sm:px-6 sm:py-12 md:px-12">
          <h2
            className="text-lg font-semibold text-t-primary mb-6"
            style={{
              fontFamily: "var(--font-logo), 'Space Grotesk', sans-serif",
            }}
          >
            Screens
          </h2>

          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {template.frames
              .filter((f) => f.html && f.html.length > 50)
              .map((frame) => (
                <div
                  key={frame.id}
                  className="flex flex-col items-center gap-3"
                >
                  <div
                    className="relative w-full overflow-hidden rounded-2xl border border-b-secondary bg-surface-sunken"
                    style={{
                      aspectRatio: "430 / 932",
                      backgroundImage:
                        "radial-gradient(var(--canvas-dot) 0.65px, transparent 0.65px)",
                      backgroundSize: "14px 14px",
                    }}
                  >
                    <TemplateScreenPreview
                      html={frame.html}
                      title={frame.label}
                    />
                  </div>
                  <p className="text-xs font-medium text-t-secondary">
                    {frame.label}
                  </p>
                </div>
              ))}
          </div>
        </div>

        <div className="border-t border-b-secondary px-4 py-12 sm:px-6 md:px-12">
          <div className="flex flex-col items-center gap-4 text-center max-w-md mx-auto">
            <h2
              className="text-xl sm:text-2xl font-semibold text-t-primary"
              style={{
                fontFamily: "var(--font-logo), 'Space Grotesk', sans-serif",
              }}
            >
              Start building with this template
            </h2>
            <p className="text-sm text-t-secondary">
              Customize every screen with AI — change colors, layout, content,
              and more.
            </p>
            <TemplateUseButton templateId={template.id} />
          </div>
        </div>

        <Footer />
      </div>
    </div>
  );
}
