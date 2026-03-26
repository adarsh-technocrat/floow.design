import { prisma } from "@/lib/db";

const baseUrl = "https://www.floow.design";

export async function GET() {
  const templates = await prisma.project.findMany({
    where: { isTemplate: true, trashedAt: null, templateSlug: { not: null } },
    select: { templateSlug: true, updatedAt: true },
    orderBy: { createdAt: "asc" },
  });

  const urls = templates
    .map(
      (t) => `
  <url>
    <loc>${baseUrl}/templates/${t.templateSlug}</loc>
    <lastmod>${t.updatedAt.toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
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
