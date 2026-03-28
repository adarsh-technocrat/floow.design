import { cn } from "@/lib/utils";
import Link from "next/link";

import type { BlogPost } from "@/lib/blog";

function formatPostDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function CoverPlaceholder({ compact }: { compact?: boolean }) {
  return (
    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-input-bg to-surface-elevated">
      <span
        className={cn(
          "font-mono text-t-tertiary/30",
          compact ? "text-[10px] sm:text-xs" : "text-2xl",
        )}
      >
        floow
      </span>
    </div>
  );
}

export function FeaturedBlogSection({ posts }: { posts: BlogPost[] }) {
  if (posts.length === 0) return null;

  const [featured, ...restHead] = posts;
  const sidebar = restHead.slice(0, 3);

  const titleFont = "var(--font-logo), 'Space Grotesk', sans-serif" as const;

  return (
    <section className="border-b border-b-secondary px-4 py-10 sm:px-6 md:px-12 md:py-14">
      <h2
        className="mb-8 text-lg font-semibold tracking-tight text-t-primary md:text-xl"
        style={{ fontFamily: titleFont }}
      >
        Featured
      </h2>

      <div
        className={cn(
          "grid gap-10 lg:gap-12",
          sidebar.length > 0
            ? "lg:grid-cols-[minmax(0,1.55fr)_minmax(260px,1fr)]"
            : "max-w-3xl",
        )}
      >
        {/* Main featured */}
        <Link
          href={`/blog/${featured.slug}`}
          className="group flex min-w-0 flex-col gap-4 no-underline"
        >
          <div className="aspect-[16/10] w-full overflow-hidden rounded-lg border border-b-secondary bg-input-bg">
            {featured.frontmatter.coverImage ? (
              <img
                src={featured.frontmatter.coverImage}
                alt={featured.frontmatter.title}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
              />
            ) : (
              <CoverPlaceholder />
            )}
          </div>
          <div className="flex flex-col gap-2">
            <h3
              className="text-xl font-semibold leading-snug tracking-tight text-t-primary transition-colors group-hover:text-t-secondary sm:text-2xl md:text-[26px] md:leading-tight"
              style={{ fontFamily: titleFont }}
            >
              {featured.frontmatter.title}
            </h3>
            <time
              className="text-sm text-t-tertiary"
              dateTime={featured.frontmatter.date}
            >
              {formatPostDate(featured.frontmatter.date)}
            </time>
          </div>
        </Link>

        {/* Sidebar list */}
        {sidebar.length > 0 ? (
          <ul className="flex flex-col gap-0 divide-y divide-b-secondary border-t border-b-secondary lg:border-t-0 lg:pt-0">
            {sidebar.map((post) => (
              <li key={post.slug} className="py-5 first:pt-0 lg:first:pt-0">
                <Link
                  href={`/blog/${post.slug}`}
                  className="group flex items-center gap-4 no-underline sm:gap-5"
                >
                  <div className="min-w-0 flex-1">
                    <h3
                      className="text-[15px] font-semibold leading-snug text-t-primary transition-colors group-hover:text-t-secondary md:text-base"
                      style={{ fontFamily: titleFont }}
                    >
                      {post.frontmatter.title}
                    </h3>
                    <time
                      className="mt-1 block text-xs text-t-tertiary"
                      dateTime={post.frontmatter.date}
                    >
                      {formatPostDate(post.frontmatter.date)}
                    </time>
                  </div>
                  <div className="size-[72px] shrink-0 overflow-hidden rounded-lg border border-b-secondary bg-input-bg sm:size-20">
                    {post.frontmatter.coverImage ? (
                      <img
                        src={post.frontmatter.coverImage}
                        alt=""
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        loading="lazy"
                      />
                    ) : (
                      <CoverPlaceholder compact />
                    )}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  );
}
