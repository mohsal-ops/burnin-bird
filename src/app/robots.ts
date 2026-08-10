import type { MetadataRoute } from "next";
import { SITE_CONFIG } from "@/lib/siteConfig";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/api", "/login"],
      },
    ],
    sitemap: `${SITE_CONFIG.siteUrl}/sitemap.xml`,
  };
}
