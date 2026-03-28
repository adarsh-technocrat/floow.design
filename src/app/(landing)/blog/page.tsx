import { FeaturedBlogSection } from "@/components/blog/FeaturedBlogSection";
import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/landing/Footer";
import { getAllPosts } from "@/lib/blog";
import { cn } from "@/lib/utils";
import Link from "next/link";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog – floow.design",
  description:
    "Updates, tutorials, and insights on designing mobile apps with AI",
  alternates: {
    canonical: "https://www.floow.design/blog",
  },
  openGraph: {
    title: "Blog – floow.design",
    description:
      "Updates, tutorials, and insights on designing mobile apps with AI",
    url: "https://www.floow.design/blog",
  },
};

export const dynamic = "force-dynamic";

export default async function BlogPage() {
  const posts = await getAllPosts();
  const featuredPosts = posts.slice(0, 4);
  const gridPosts = posts.slice(4);

  const blogJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Blog – floow.design",
    description:
      "Updates, tutorials, and insights on designing mobile apps with AI",
    url: "https://www.floow.design/blog",
    publisher: { "@type": "Organization", name: "floow.design" },
    mainEntity: {
      "@type": "ItemList",
      itemListElement: posts.map((post, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: `https://www.floow.design/blog/${post.slug}`,
        name: post.frontmatter.title,
      })),
    },
  };

  return (
    <div className="relative w-full bg-surface text-t-primary">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogJsonLd) }}
      />
      <div className="relative mx-auto max-w-6xl border-x border-b-secondary">
        <Header />

        {/* Hero */}
        <div className="border-b border-b-secondary px-4 py-8 sm:px-6 sm:py-12 md:px-12 md:py-20">
          <div className="flex flex-col gap-4 items-center text-center max-w-2xl mx-auto">
            <div className="flex items-center gap-2 rounded-full bg-input-bg px-3 py-1 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs font-mono text-t-secondary">
                Latest Insights
              </span>
            </div>
            <h1
              className="text-[24px] sm:text-[32px] md:text-[48px] font-semibold leading-tight tracking-tight text-t-primary"
              style={{
                fontFamily: "var(--font-logo), 'Space Grotesk', sans-serif",
              }}
            >
              Blog
            </h1>
            <p className="text-t-secondary text-sm sm:text-base md:text-lg leading-relaxed max-w-xl">
              Updates, tutorials, and insights on designing mobile apps with AI.
            </p>
          </div>
        </div>

        {/* Cross-link banner */}
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 border-b border-b-secondary px-5 py-3 text-[11px] font-mono text-t-tertiary">
          <Link
            href="/#features"
            className="hover:text-t-secondary transition-colors no-underline"
          >
            Features
          </Link>
          <span className="hidden sm:inline">·</span>
          <Link
            href="/#templates"
            className="hover:text-t-secondary transition-colors no-underline"
          >
            Templates
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

        <FeaturedBlogSection posts={featuredPosts} />

        {/* Remaining posts — same card grid as before */}
        {gridPosts.length > 0 ? (
          <div
            className={cn(
              "relative grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-0",
              "sm:before:pointer-events-none sm:before:absolute sm:before:left-1/2 sm:before:top-0 sm:before:bottom-0 sm:before:z-1 sm:before:w-px sm:before:-translate-x-1/2 sm:before:bg-b-secondary",
              "lg:before:left-1/3 lg:after:pointer-events-none lg:after:absolute lg:after:left-2/3 lg:after:top-0 lg:after:bottom-0 lg:after:z-1 lg:after:w-px lg:after:-translate-x-1/2 lg:after:bg-b-secondary",
            )}
          >
            {gridPosts.map((post, i) => {
              const n = gridPosts.length;
              const isLastMobile = i === n - 1;
              return (
                <Link
                  key={post.slug}
                  href={`/blog/${post.slug}`}
                  className={cn(
                    "group flex flex-col gap-0 transition-colors hover:bg-input-bg/80 no-underline border-b border-b-secondary overflow-hidden",
                    isLastMobile && "max-sm:border-b-0",
                  )}
                >
                  {/* Cover image */}
                  <div className="overflow-hidden aspect-[16/10]">
                    {post.frontmatter.coverImage ? (
                      <img
                        src={post.frontmatter.coverImage}
                        alt={post.frontmatter.title}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-input-bg to-surface-elevated flex items-center justify-center">
                        <span className="text-2xl text-t-tertiary/30 font-mono">
                          floow
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2.5 p-4 md:p-5">
                    <div className="flex items-center gap-2">
                      <span className="rounded-md bg-input-bg px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider text-t-secondary border border-b-secondary">
                        {post.frontmatter.category}
                      </span>
                      <span className="text-[10px] text-t-tertiary font-mono">
                        {post.readingTime}
                      </span>
                    </div>

                    <h2
                      className="text-[15px] md:text-base font-semibold text-t-primary group-hover:text-t-primary transition-colors leading-snug line-clamp-2"
                      style={{
                        fontFamily:
                          "var(--font-logo), 'Space Grotesk', sans-serif",
                      }}
                    >
                      {post.frontmatter.title}
                    </h2>

                    <p className="text-xs text-t-secondary leading-relaxed line-clamp-2">
                      {post.frontmatter.description}
                    </p>

                    <div className="flex flex-wrap gap-1 mt-0.5">
                      {post.frontmatter.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-input-bg px-1.5 py-0.5 text-[10px] font-mono uppercase tracking-wider text-t-tertiary"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>

                    <div className="mt-auto flex items-center justify-between pt-3 border-t border-b-secondary">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-medium text-t-secondary">
                          {post.frontmatter.author}
                        </span>
                        <span className="text-t-tertiary">·</span>
                        <time
                          className="text-[10px] text-t-tertiary font-mono"
                          dateTime={post.frontmatter.date}
                        >
                          {new Date(post.frontmatter.date).toLocaleDateString(
                            "en-US",
                            { month: "short", day: "numeric", year: "numeric" },
                          )}
                        </time>
                      </div>
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        className="text-t-tertiary group-hover:text-t-secondary transition-colors"
                      >
                        <path d="M5 12h14M12 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : null}

        <Footer />
      </div>
    </div>
  );
}
