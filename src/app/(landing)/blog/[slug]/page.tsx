import { notFound } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/landing/Footer";
import { MdxRenderer } from "@/components/blog/MdxRenderer";
import { Avatar } from "@/components/ui/Avatar";
import { BlogPromptCTA } from "@/components/landing/BlogPromptCTA";
import { getAllPosts, getPostBySlug, getRelatedPosts } from "@/lib/blog";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return { title: "Post Not Found" };

  const { frontmatter: fm } = post;

  return {
    title: `${fm.title} | floow.design Blog`,
    description: fm.description,
    keywords: fm.tags,
    authors: [{ name: fm.author }],
    openGraph: {
      title: fm.title,
      description: fm.description,
      type: "article",
      publishedTime: fm.date,
      authors: [fm.author],
      tags: fm.tags,
      siteName: "floow.design",
      ...(fm.coverImage && {
        images: [{ url: fm.coverImage, width: 1200, height: 630 }],
      }),
    },
    twitter: {
      card: "summary_large_image",
      title: fm.title,
      description: fm.description,
      ...(fm.coverImage && { images: [fm.coverImage] }),
    },
    alternates: {
      canonical: `/blog/${slug}`,
    },
  };
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) notFound();

  const { frontmatter: fm } = post;
  const allPosts = await getAllPosts();
  const currentIndex = allPosts.findIndex((p) => p.slug === slug);
  const prevPost =
    currentIndex < allPosts.length - 1 ? allPosts[currentIndex + 1] : null;
  const nextPost = currentIndex > 0 ? allPosts[currentIndex - 1] : null;
  const relatedPosts = await getRelatedPosts(slug, 3);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: fm.title,
    description: fm.description,
    datePublished: fm.date,
    ...(fm.coverImage && { image: fm.coverImage }),
    author: {
      "@type": "Person",
      name: fm.author,
      ...(fm.authorRole && { jobTitle: fm.authorRole }),
    },
    publisher: { "@type": "Organization", name: "floow.design" },
    wordCount: post.wordCount,
    keywords: fm.tags.join(", "),
    mainEntityOfPage: { "@type": "WebPage", "@id": `/blog/${slug}` },
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
            href="/blog"
            className="hover:text-t-secondary transition-colors no-underline"
          >
            Blog
          </Link>
          <span>/</span>
          <span className="text-t-secondary truncate max-w-[200px]">
            {fm.title}
          </span>
        </nav>

        {/* Cover image */}
        {fm.coverImage && (
          <div className="border-b border-b-secondary">
            <img
              src={fm.coverImage}
              alt={fm.title}
              className="w-full h-[240px] sm:h-[320px] md:h-[420px] object-cover"
            />
          </div>
        )}

        {/* Article header */}
        <header>
          <div className="px-4 py-8 sm:px-6 sm:py-12 md:px-16 md:py-16 max-w-3xl mx-auto">
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <span className="rounded-md bg-input-bg px-2.5 py-1 text-[11px] font-mono uppercase tracking-wider text-t-secondary border border-b-secondary">
                {fm.category}
              </span>
              <span className="text-[11px] text-t-tertiary font-mono">
                {post.readingTime}
              </span>
              <span className="text-[11px] text-t-tertiary font-mono">·</span>
              <span className="text-[11px] text-t-tertiary font-mono">
                {post.wordCount.toLocaleString()} words
              </span>
            </div>

            <h1
              className="text-2xl md:text-4xl font-semibold leading-tight tracking-tight text-t-primary"
              style={{
                fontFamily: "var(--font-logo), 'Space Grotesk', sans-serif",
              }}
            >
              {fm.title}
            </h1>

            <p className="mt-4 text-base md:text-lg text-t-secondary leading-relaxed">
              {fm.description}
            </p>

            <div className="flex flex-wrap gap-2 mt-6">
              {fm.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-input-bg px-2.5 py-0.5 text-[11px] font-mono uppercase tracking-wider text-t-tertiary border border-b-secondary"
                >
                  #{tag}
                </span>
              ))}
            </div>

            <div className="mt-8 flex items-center gap-3 pt-6 border-t border-b-secondary">
              <Avatar name={fm.author} size={40} />
              <div>
                <p className="text-sm font-medium text-t-primary">
                  {fm.author}
                </p>
                <div className="flex items-center gap-2">
                  {fm.authorRole && (
                    <span className="text-[11px] text-t-tertiary">
                      {fm.authorRole}
                    </span>
                  )}
                  {fm.authorRole && <span className="text-t-tertiary">·</span>}
                  <time
                    className="text-[11px] font-mono text-t-tertiary"
                    dateTime={fm.date}
                  >
                    {new Date(fm.date).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </time>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Prompt CTA */}
        <div className="mx-auto max-w-3xl px-4 sm:px-6 md:px-16 pt-2 pb-6">
          <BlogPromptCTA />
        </div>

        {/* Article content */}
        <div>
          <article className="mx-auto max-w-3xl px-4 pb-8 pt-6 sm:px-6 sm:pb-10 sm:pt-8 md:px-16 md:pb-14 md:pt-10">
            <MdxRenderer source={post.content} />
          </article>
        </div>

        {/* Product CTA — internal link for SEO */}
        <div className="border-t border-b-secondary">
          <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 md:px-16 text-center">
            <p
              className="text-lg sm:text-xl font-semibold text-t-primary mb-2"
              style={{
                fontFamily: "var(--font-logo), 'Space Grotesk', sans-serif",
              }}
            >
              Design your mobile app with AI
            </p>
            <p className="text-sm text-t-secondary mb-6 max-w-md mx-auto">
              Generate pixel-perfect iOS &amp; Android screens in seconds.
              Export to Figma and ship faster.
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
                href="/#features"
                className="hover:text-t-secondary transition-colors no-underline"
              >
                See features
              </Link>
              <span>·</span>
              <Link
                href="/#templates"
                className="hover:text-t-secondary transition-colors no-underline"
              >
                Browse templates
              </Link>
              <span>·</span>
              <Link
                href="/#faq"
                className="hover:text-t-secondary transition-colors no-underline"
              >
                FAQ
              </Link>
            </div>
          </div>
        </div>

        {/* Related posts */}
        {relatedPosts.length > 0 && (
          <div className="border-t border-b-secondary">
            <div className="border-b border-b-secondary px-5 py-3">
              <span className="text-[11px] font-mono font-medium uppercase tracking-wider text-t-tertiary">
                Related Articles
              </span>
            </div>
            <div className="grid grid-cols-1 divide-y divide-b-secondary md:grid-cols-3 md:divide-x md:divide-y-0 md:divide-b-secondary md:gap-0">
              {relatedPosts.map((rp) => (
                <Link
                  key={rp.slug}
                  href={`/blog/${rp.slug}`}
                  className="group flex flex-col gap-2 p-5 md:p-6 transition-colors hover:bg-input-bg/80 no-underline"
                >
                  <span className="text-[11px] font-mono uppercase tracking-wider text-t-tertiary">
                    {rp.frontmatter.category}
                  </span>
                  <span className="text-sm font-medium text-t-primary leading-snug">
                    {rp.frontmatter.title}
                  </span>
                  <span className="text-[11px] font-mono text-t-tertiary">
                    {rp.readingTime}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Prev/Next */}
        <div className="grid grid-cols-1 divide-y divide-b-secondary border-t border-b-secondary md:grid-cols-2 md:divide-x md:divide-y-0 md:divide-b-secondary md:gap-0">
          {prevPost ? (
            <Link
              href={`/blog/${prevPost.slug}`}
              className="group flex flex-col gap-2 p-6 md:p-8 transition-colors hover:bg-input-bg/80 no-underline"
            >
              <span className="text-[11px] font-mono uppercase tracking-wider text-t-tertiary">
                ← Older
              </span>
              <span className="text-sm font-medium text-t-primary">
                {prevPost.frontmatter.title}
              </span>
            </Link>
          ) : (
            <div className="hidden md:block" aria-hidden />
          )}
          {nextPost ? (
            <Link
              href={`/blog/${nextPost.slug}`}
              className="group flex flex-col gap-2 p-6 md:p-8 items-end text-right hover:bg-input-bg transition-colors no-underline"
            >
              <span className="text-[11px] font-mono uppercase tracking-wider text-t-tertiary">
                Newer →
              </span>
              <span className="text-sm font-medium text-t-primary">
                {nextPost.frontmatter.title}
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
