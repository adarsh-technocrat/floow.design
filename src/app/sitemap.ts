import type { MetadataRoute } from "next";

const baseUrl = "https://www.floow.design";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: `${baseUrl}/sitemap/pages`,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/sitemap/blog`,
      lastModified: new Date(),
    },
  ];
}
