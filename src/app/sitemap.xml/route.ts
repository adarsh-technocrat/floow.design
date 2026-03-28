const baseUrl = "https://www.floow.design";

// Update these dates when the corresponding sub-sitemap content actually changes
const sitemaps = [
  { path: "/sitemap/pages", lastmod: "2026-03-28" },
  { path: "/sitemap/templates", lastmod: "2026-03-28" },
  { path: "/sitemap/blog", lastmod: "2026-03-28" },
];

export async function GET() {
  const entries = sitemaps
    .map(
      (s) => `  <sitemap>
    <loc>${baseUrl}${s.path}</loc>
    <lastmod>${s.lastmod}</lastmod>
  </sitemap>`,
    )
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries}
</sitemapindex>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
