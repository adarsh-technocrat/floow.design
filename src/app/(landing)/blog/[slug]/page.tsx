import { notFound } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/landing/Footer";
import { MdxRenderer } from "@/components/blog/MdxRenderer";
import { Avatar } from "@/components/ui/Avatar";
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
    title: `${fm.title} | Launchpad AI Blog`,
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
      siteName: "Launchpad AI",
    },
    twitter: {
      card: "summary_large_image",
      title: fm.title,
      description: fm.description,
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
    author: {
      "@type": "Person",
      name: fm.author,
      ...(fm.authorRole && { jobTitle: fm.authorRole }),
    },
    publisher: { "@type": "Organization", name: "Launchpad AI" },
    wordCount: post.wordCount,
    keywords: fm.tags.join(", "),
    mainEntityOfPage: { "@type": "WebPage", "@id": `/blog/${slug}` },
  };

  return (
    <div className="w-full bg-surface text-t-primary">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="mx-auto max-w-6xl">
        <Header />

        {/* Breadcrumb */}
        <nav
          className="flex items-center gap-2 px-5 py-3 text-[11px] font-mono text-t-tertiary"
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

        {/* Article header */}
        <header>
          <div className="px-6 md:px-16 py-12 md:py-16 max-w-3xl mx-auto">
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <span className="rounded-md bg-input-bg px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider text-t-secondary">
                {fm.category}
              </span>
              <span className="text-[10px] text-t-tertiary font-mono">
                {post.readingTime}
              </span>
              <span className="text-[10px] text-t-tertiary font-mono">·</span>
              <span className="text-[10px] text-t-tertiary font-mono">
                {post.wordCount} words
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
                  className="rounded-full bg-input-bg px-2 py-0.5 text-[9px] font-mono uppercase tracking-wider text-t-tertiary"
                >
                  #{tag}
                </span>
              ))}
            </div>

            <div className="mt-8 flex items-center gap-3 pt-6">
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

        {/* Article content */}
        <div>
          <article className="mx-auto max-w-3xl px-6 py-10 md:px-16 md:py-14">
            <MdxRenderer source={post.content} />
          </article>
        </div>

        {/* Related posts */}
        {relatedPosts.length > 0 && (
          <div className="py-6">
            <div className="px-5 py-3">
              <span className="text-[10px] font-mono font-medium uppercase tracking-wider text-t-tertiary">
                Related Articles
              </span>
            </div>
            <div className="grid grid-cols-1 gap-4 px-5 md:grid-cols-3 md:gap-6">
              {relatedPosts.map((rp) => (
                <Link
                  key={rp.slug}
                  href={`/blog/${rp.slug}`}
                  className="group flex flex-col gap-2 rounded-xl p-5 transition-colors hover:bg-input-bg/80 no-underline"
                >
                  <span className="text-[9px] font-mono uppercase tracking-wider text-t-tertiary">
                    {rp.frontmatter.category}
                  </span>
                  <span className="text-sm font-medium text-t-primary leading-snug">
                    {rp.frontmatter.title}
                  </span>
                  <span className="text-[10px] font-mono text-t-tertiary">
                    {rp.readingTime}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Prev/Next */}
        <div className="grid grid-cols-1 gap-4 px-5 py-8 md:grid-cols-2 md:gap-8">
          {prevPost ? (
            <Link
              href={`/blog/${prevPost.slug}`}
              className="group flex flex-col gap-2 rounded-xl p-6 transition-colors hover:bg-input-bg/80 no-underline"
            >
              <span className="text-[10px] font-mono uppercase tracking-wider text-t-tertiary">
                ← Older
              </span>
              <span className="text-sm font-medium text-t-primary">
                {prevPost.frontmatter.title}
              </span>
            </Link>
          ) : (
            <div />
          )}
          {nextPost ? (
            <Link
              href={`/blog/${nextPost.slug}`}
              className="group flex flex-col gap-2 p-6 items-end text-right hover:bg-input-bg transition-colors no-underline"
            >
              <span className="text-[10px] font-mono uppercase tracking-wider text-t-tertiary">
                Newer →
              </span>
              <span className="text-sm font-medium text-t-primary">
                {nextPost.frontmatter.title}
              </span>
            </Link>
          ) : (
            <div />
          )}
        </div>

        <Footer />
      </div>
    </div>
  );
}
