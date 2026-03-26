const baseUrl = "https://www.floow.design";

const staticPages = [
  { path: "", changefreq: "weekly", priority: "1.0", lastmod: "2026-03-26" },
  {
    path: "/features",
    changefreq: "weekly",
    priority: "0.9",
    lastmod: "2026-03-26",
  },
  {
    path: "/features/ai-mobile-app-design",
    changefreq: "weekly",
    priority: "0.8",
    lastmod: "2026-03-26",
  },
  {
    path: "/features/ai-screen-generator",
    changefreq: "weekly",
    priority: "0.8",
    lastmod: "2026-03-26",
  },
  {
    path: "/features/export-to-figma",
    changefreq: "weekly",
    priority: "0.8",
    lastmod: "2026-03-26",
  },
  {
    path: "/features/ios-android-design",
    changefreq: "weekly",
    priority: "0.8",
    lastmod: "2026-03-26",
  },
  {
    path: "/features/multi-screen-app-flows",
    changefreq: "weekly",
    priority: "0.8",
    lastmod: "2026-03-26",
  },
  {
    path: "/features/custom-design-themes",
    changefreq: "weekly",
    priority: "0.8",
    lastmod: "2026-03-26",
  },
  {
    path: "/compare",
    changefreq: "weekly",
    priority: "0.8",
    lastmod: "2026-03-26",
  },
  {
    path: "/compare/floow-vs-uizard",
    changefreq: "monthly",
    priority: "0.7",
    lastmod: "2026-03-26",
  },
  {
    path: "/compare/floow-vs-figma",
    changefreq: "monthly",
    priority: "0.7",
    lastmod: "2026-03-26",
  },
  {
    path: "/compare/floow-vs-visily",
    changefreq: "monthly",
    priority: "0.7",
    lastmod: "2026-03-26",
  },
  {
    path: "/compare/floow-vs-flutterflow",
    changefreq: "monthly",
    priority: "0.7",
    lastmod: "2026-03-26",
  },
  {
    path: "/blog",
    changefreq: "daily",
    priority: "0.8",
    lastmod: "2026-03-26",
  },
  {
    path: "/pricing",
    changefreq: "monthly",
    priority: "0.7",
    lastmod: "2026-03-26",
  },
  {
    path: "/privacy",
    changefreq: "yearly",
    priority: "0.3",
    lastmod: "2026-03-26",
  },
  {
    path: "/terms",
    changefreq: "yearly",
    priority: "0.3",
    lastmod: "2026-03-26",
  },
];

export async function GET() {
  const urls = staticPages
    .map(
      (page) => `
  <url>
    <loc>${baseUrl}${page.path}</loc>
    <lastmod>${page.lastmod}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`,
    )
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
