import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/landing/Footer";
import { getAllPosts } from "@/lib/blog";
import Link from "next/link";

export const metadata = {
  title: "Blog – floow.design",
  description: "Latest updates, tips, and stories from floow.design",
};

export const dynamic = "force-dynamic";

export default async function BlogPage() {
  const posts = await getAllPosts();

  return (
    <div className="relative w-full bg-surface text-t-primary">
      <div className="relative mx-auto max-w-6xl border-x border-b-secondary">
        <Header />

        {/* Hero */}
        <div className="border-b border-b-secondary px-6 py-12 md:px-12 md:py-20">
          <div className="flex flex-col gap-4 items-center text-center max-w-2xl mx-auto">
            <div className="flex items-center gap-2 rounded-full bg-input-bg px-3 py-1 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs font-mono text-t-secondary">
                Latest Insights
              </span>
            </div>
            <h1
              className="text-[32px] md:text-[48px] font-semibold leading-tight tracking-tight text-t-primary"
              style={{
                fontFamily: "var(--font-logo), 'Space Grotesk', sans-serif",
              }}
            >
              Blog
            </h1>
            <p className="text-t-secondary text-base md:text-lg leading-relaxed max-w-xl">
              Updates, tutorials, and insights on building Flutter apps with AI.
            </p>
          </div>
        </div>

        {/* Post grid */}
        <div className="grid grid-cols-1 gap-6 px-5 py-8 md:grid-cols-2 md:gap-8">
          {posts.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group flex flex-col gap-4 rounded-xl bg-surface p-6 transition-all hover:bg-input-bg/80 no-underline"
            >
              <div className="flex items-center gap-3">
                <span className="rounded-md bg-input-bg px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider text-t-secondary">
                  {post.frontmatter.category}
                </span>
                <span className="text-[10px] text-t-tertiary font-mono">
                  {post.readingTime}
                </span>
              </div>

              <h2
                className="text-lg md:text-xl font-semibold text-t-primary group-hover:text-t-primary transition-colors leading-snug"
                style={{
                  fontFamily: "var(--font-logo), 'Space Grotesk', sans-serif",
                }}
              >
                {post.frontmatter.title}
              </h2>

              <p className="text-sm text-t-secondary leading-relaxed">
                {post.frontmatter.description}
              </p>

              <div className="flex flex-wrap gap-1.5 mt-1">
                {post.frontmatter.tags.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-input-bg px-2 py-0.5 text-[9px] font-mono uppercase tracking-wider text-t-tertiary"
                  >
                    #{tag}
                  </span>
                ))}
              </div>

              <div className="mt-auto flex items-center justify-between pt-4">
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
            </Link>
          ))}
        </div>

        <Footer />
      </div>
    </div>
  );
}
