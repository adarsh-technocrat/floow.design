export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  category: string;
  readTime: string;
  author: string;
  image: string;
  content: string;
}

export const posts: BlogPost[] = [
  {
    slug: "google-stitch-vibe-design",
    title:
      'Google\'s Stitch Becomes a "Vibe Design" Platform — And Figma Felt It',
    excerpt:
      "Google transforms Stitch from a text-to-UI experiment into a full AI-native design platform with voice interaction, infinite canvas, and developer SDK — sending Figma shares down 8%.",
    date: "Mar 24, 2026",
    category: "Industry News",
    readTime: "5 min",
    author: "floow.design",
    image:
      "https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?w=1200&auto=format&fit=crop",
    content: `On March 19, 2026, Google unveiled a major redesign of its Stitch AI design tool via Google Labs. Originally launched at Google I/O 2025 as a simple text-to-UI generator, Stitch has been rebuilt from the ground up as what Google calls an "AI-native" design platform.

## What's New in Stitch

The March 2026 update ships five headline features: AI-Native Infinite Canvas, Smarter Design Agent, Voice Interaction, Instant Prototyping, and DESIGN.md Design Systems.

## Market Impact

Shares of Figma Inc. fell as much as 8% on March 19 following the announcement. Stitch remains free during its beta period with 350 standard and 200 pro generations per month.

## The Takeaway

For AI-native design platforms like floow.design, this signals exactly what the market is demanding: less friction between idea and interface, more intelligence baked into the canvas itself.`,
  },
];

export function getPostBySlug(slug: string): BlogPost | undefined {
  return posts.find((p) => p.slug === slug);
}
