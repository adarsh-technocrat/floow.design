import readingTime from "reading-time";

export interface BlogPost {
  slug: string;
  frontmatter: {
    title: string;
    description: string;
    date: string;
    author: string;
    authorRole?: string;
    category: string;
    tags: string[];
    tldr: string | null;
    coverImage?: string;
    published: boolean;
  };
  content: string;
  readingTime: string;
  wordCount: number;
}

/* ------------------------------------------------------------------ */
/*  Internal API base URL                                              */
/* ------------------------------------------------------------------ */

function getBaseUrl(): string {
  // Server-side: use internal URL
  if (typeof window === "undefined") {
    return process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000";
  }
  // Client-side: relative
  return "";
}

/* ------------------------------------------------------------------ */
/*  Transform API response to BlogPost                                 */
/* ------------------------------------------------------------------ */

interface ApiPost {
  slug: string;
  title: string;
  description: string;
  content: string;
  tldr: string | null;
  coverImage: string | null;
  category: string;
  tags: string[];
  author: string;
  authorRole: string | null;
  published: boolean;
  createdAt: string;
}

function toBlogPost(row: ApiPost): BlogPost {
  const stats = readingTime(row.content);
  return {
    slug: row.slug,
    frontmatter: {
      title: row.title,
      description: row.description,
      date: row.createdAt,
      author: row.author,
      authorRole: row.authorRole ?? undefined,
      category: row.category,
      tags: row.tags,
      tldr: row.tldr,
      coverImage: row.coverImage ?? undefined,
      published: row.published,
    },
    content: row.content,
    readingTime: stats.text,
    wordCount: stats.words,
  };
}

/* ------------------------------------------------------------------ */
/*  Public API                                                         */
/* ------------------------------------------------------------------ */

export async function getAllPosts(): Promise<BlogPost[]> {
  const res = await fetch(`${getBaseUrl()}/api/blog`, {
    cache: "no-store",
  });
  if (!res.ok) return [];
  const data = (await res.json()) as { posts: ApiPost[] };
  return data.posts.map(toBlogPost);
}

export async function getPostBySlug(
  slug: string,
): Promise<BlogPost | undefined> {
  const res = await fetch(`${getBaseUrl()}/api/blog/${slug}`, {
    cache: "no-store",
  });
  if (!res.ok) return undefined;
  const data = (await res.json()) as { post: ApiPost };
  if (!data.post || !data.post.published) return undefined;
  return toBlogPost(data.post);
}

export async function getAllSlugs(): Promise<string[]> {
  const posts = await getAllPosts();
  return posts.map((p) => p.slug);
}

export async function getRelatedPosts(
  currentSlug: string,
  limit = 3,
): Promise<BlogPost[]> {
  const all = await getAllPosts();
  const current = all.find((p) => p.slug === currentSlug);
  if (!current) return all.slice(0, limit);

  return all
    .filter((p) => p.slug !== currentSlug)
    .sort((a, b) => {
      const aMatch = a.frontmatter.tags.filter((t) =>
        current.frontmatter.tags.includes(t),
      ).length;
      const bMatch = b.frontmatter.tags.filter((t) =>
        current.frontmatter.tags.includes(t),
      ).length;
      return bMatch - aMatch;
    })
    .slice(0, limit);
}
