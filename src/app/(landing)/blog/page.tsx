import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/landing/Footer";
import Link from "next/link";

export const metadata = {
  title: "Blog - Launchpad AI",
  description: "Latest updates, tips, and stories from Launchpad AI",
};

const posts = [
  {
    slug: "introducing-launchpad-ai",
    title: "Introducing Launchpad AI: Design to Flutter Code with AI",
    excerpt: "Describe your app idea, get beautiful designs and production-ready Flutter code in seconds.",
    date: "Mar 15, 2026",
    category: "Announcement",
    readTime: "4 min",
    author: "Adarsh Kumar",
    image: "https://lh3.googleusercontent.com/CwGQkERZQIadMhpEphW3k58HmhCs02NQRYpR9L_GIhU7qHIDfQlJp-ykadYDGA-x6_Bkq_Ea2r-fFr3rv4kW8Xw9A1DgJuD9hlE5Fw",
  },
  {
    slug: "design-systems-mobile",
    title: "Building Design Systems for Flutter Apps",
    excerpt: "Create consistent, scalable design systems with tokens, components, and patterns for Flutter.",
    date: "Mar 10, 2026",
    category: "Tutorial",
    readTime: "7 min",
    author: "Adarsh Kumar",
    image: "https://lh3.googleusercontent.com/-MMEDlQhYVE8CLSReq5dD_9s_mXvDaJUB8HaM-gKSh4LUsgjpQOK3ov7qdaH7hsVFDF0rc3L6Hi1ppWlaWx-rYMhK8IAViAM-Gk",
  },
  {
    slug: "ai-design-workflow",
    title: "How AI is Changing the Mobile Design Workflow",
    excerpt: "From wireframes to high-fidelity mockups, AI tools are transforming how designers work.",
    date: "Mar 5, 2026",
    category: "Insights",
    readTime: "5 min",
    author: "Adarsh Kumar",
    image: "https://lh3.googleusercontent.com/D6d1SQF0r3pePXE2e02y5nuvncVNFlQTMLmJm8ycWnjxC0Re9wQdvjQWHgcYYpduzGd7_QrfUTjC-OBUjDHOf_vWQ7fkMSRyEwhJ",
  },
  {
    slug: "flutter-export-guide",
    title: "From Design to Flutter: Exporting Production-Ready Code",
    excerpt: "Step-by-step guide on exporting clean Dart & Flutter widget code from Launchpad AI.",
    date: "Feb 28, 2026",
    category: "Tutorial",
    readTime: "6 min",
    author: "Adarsh Kumar",
    image: "https://lh3.googleusercontent.com/7zm0iGoJpEdqqpo4GoqcLdOn0k-s9ZEMVy4MYn6Ia_3_FLlOzKHpb2iLlq7mVaLN7E4_5raueLuya7-MuvUyWFILPxBSdhTTz1XN",
  },
  {
    slug: "mobile-ux-patterns",
    title: "10 Mobile UX Patterns Every Designer Should Know",
    excerpt: "Essential mobile UX patterns — from navigation to gestures — that make apps feel intuitive.",
    date: "Feb 20, 2026",
    category: "Design",
    readTime: "8 min",
    author: "Adarsh Kumar",
    image: "https://lh3.googleusercontent.com/CwGQkERZQIadMhpEphW3k58HmhCs02NQRYpR9L_GIhU7qHIDfQlJp-ykadYDGA-x6_Bkq_Ea2r-fFr3rv4kW8Xw9A1DgJuD9hlE5Fw",
  },
  {
    slug: "flutter-code-tips",
    title: "Flutter Code Generation: Best Practices and Tips",
    excerpt: "Tips for getting the most out of Launchpad AI's Flutter code export.",
    date: "Feb 12, 2026",
    category: "Engineering",
    readTime: "6 min",
    author: "Adarsh Kumar",
    image: "https://lh3.googleusercontent.com/kpKlgqVM9HpnzkABysl_zNiUI-dgwj1kzHnRnh1qkwyxedx6b7dqHkTnNa8cvACvifn2lIHWb95KStpEgveKsl621OibIwFtkky-Ng=w1200",
  },
];

export default function BlogPage() {
  return (
    <div className="w-full bg-black text-white">
      <div className="mx-auto max-w-6xl border-x border-white/[0.12]">
        <Header />

        {/* Hero */}
        <div className="border-b border-white/[0.12] px-6 md:px-12 py-12 md:py-20">
          <div className="flex flex-col gap-4 items-center text-center max-w-2xl mx-auto">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.03] border border-white/[0.12]">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs font-mono text-white/50">Latest Insights</span>
            </div>
            <h1
              className="text-[32px] md:text-[48px] font-semibold leading-tight tracking-tight text-white"
              style={{ fontFamily: "var(--font-logo), 'Space Grotesk', sans-serif" }}
            >
              Blog
            </h1>
            <p className="text-white/40 text-base md:text-lg leading-relaxed max-w-xl">
              Updates, tutorials, and insights on building Flutter apps with AI.
            </p>
          </div>
        </div>

        {/* Post grid — gap-px creates divider lines */}
        <div className="grid grid-cols-1 md:grid-cols-2 bg-white/[0.12]" style={{ gap: '1px' }}>
          {posts.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group flex flex-col gap-4 p-6 bg-black hover:bg-white/[0.02] transition-all no-underline"
            >
              {/* Category + read time */}
              <div className="flex items-center gap-3">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider text-white/50 bg-white/[0.05] border border-white/[0.1]">
                  {post.category}
                </span>
                <span className="text-[10px] text-white/25 font-mono">{post.readTime}</span>
              </div>

              {/* Title */}
              <h2
                className="text-lg md:text-xl font-semibold text-white group-hover:text-white/80 transition-colors leading-snug"
                style={{ fontFamily: "var(--font-logo), 'Space Grotesk', sans-serif" }}
              >
                {post.title}
              </h2>

              {/* Excerpt */}
              <p className="text-sm text-white/35 leading-relaxed">{post.excerpt}</p>

              {/* Footer divider */}
              <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/[0.08]">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-white/50">{post.author}</span>
                  <span className="text-white/15">·</span>
                  <span className="text-[11px] text-white/25 font-mono">{post.date}</span>
                </div>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  className="text-white/20 group-hover:text-white/50 transition-colors"
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
