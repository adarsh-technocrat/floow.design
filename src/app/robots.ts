import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/dashboard/", "/project/", "/team/", "/billing/"],
      },
    ],
    sitemap: "https://www.floow.design/sitemap.xml",
  };
}
