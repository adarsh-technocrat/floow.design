import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/landing/Footer";
import { getAllPosts } from "@/lib/blog";
import { cn } from "@/lib/utils";
import Link from "next/link";

export const metadata = {
  title: "Blog – floow.design",
  description:
    "Updates, tutorials, and insights on designing mobile apps with AI",
};

export const dynamic = "force-dynamic";

export default async function BlogPage() {
  const posts = await getAllPosts();

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

        {/* Post grid — edge-to-edge borders + center rule (md) like pricing */}
        <div
          className={cn(
            "relative grid grid-cols-1 md:grid-cols-2 md:gap-0",
            "md:before:pointer-events-none md:before:absolute md:before:left-1/2 md:before:top-0 md:before:bottom-0 md:before:z-1 md:before:w-px md:before:-translate-x-1/2 md:before:bg-b-secondary",
          )}
        >
          {posts.map((post, i) => {
            const n = posts.length;
            const isLastRowMd = n % 2 === 0 ? i >= n - 2 : i >= n - 1;
            const isLastMobile = i === n - 1;
            return (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className={cn(
                  "group flex flex-col gap-0 transition-colors hover:bg-input-bg/80 no-underline border-b border-b-secondary overflow-hidden",
                  isLastMobile && "max-md:border-b-0",
                  isLastRowMd && "md:border-b-0",
                )}
              >
                {/* Cover image */}
                {post.frontmatter.coverImage && (
                  <div className="overflow-hidden">
                    <img
                      src={post.frontmatter.coverImage}
                      alt={post.frontmatter.title}
                      className="w-full h-[180px] md:h-[200px] object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                      loading="lazy"
                    />
                  </div>
                )}

                <div className="flex flex-col gap-4 p-6 md:p-8">
                  <div className="flex items-center gap-3">
                    <span className="rounded-md bg-input-bg px-2.5 py-1 text-[11px] font-mono uppercase tracking-wider text-t-secondary border border-b-secondary">
                      {post.frontmatter.category}
                    </span>
                    <span className="text-[11px] text-t-tertiary font-mono">
                      {post.readingTime}
                    </span>
                  </div>

                  <h2
                    className="text-lg md:text-xl font-semibold text-t-primary group-hover:text-t-primary transition-colors leading-snug"
                    style={{
                      fontFamily:
                        "var(--font-logo), 'Space Grotesk', sans-serif",
                    }}
                  >
                    {post.frontmatter.title}
                  </h2>

                  <p className="text-sm text-t-secondary leading-relaxed line-clamp-3">
                    {post.frontmatter.description}
                  </p>

                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {post.frontmatter.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-input-bg px-2 py-0.5 text-[11px] font-mono uppercase tracking-wider text-t-tertiary"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>

                  <div className="mt-auto flex items-center justify-between pt-4 border-t border-b-secondary">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-t-secondary">
                        {post.frontmatter.author}
                      </span>
                      <span className="text-t-tertiary">·</span>
                      <time
                        className="text-[11px] text-t-tertiary font-mono"
                        dateTime={post.frontmatter.date}
                      >
                        {new Date(post.frontmatter.date).toLocaleDateString(
                          "en-US",
                          { month: "short", day: "numeric", year: "numeric" },
                        )}
                      </time>
                    </div>
                    <svg
                      width="16"
                      height="16"
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

        <Footer />
      </div>
    </div>
  );
}
