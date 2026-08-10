import type { MetadataRoute } from "next";
import { SITE_CONFIG } from "@/lib/siteConfig";
import db from "@/db/db";

const BASE_URL = SITE_CONFIG.siteUrl;

const STATIC_ROUTES: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] }[] = [
  { path: "/", priority: 1, changeFrequency: "daily" },
  { path: "/Menu", priority: 0.9, changeFrequency: "daily" },
  { path: "/catering", priority: 0.8, changeFrequency: "weekly" },
  { path: "/GiftCard", priority: 0.7, changeFrequency: "monthly" },
  { path: "/story", priority: 0.6, changeFrequency: "monthly" },
  { path: "/Blog", priority: 0.7, changeFrequency: "daily" },
  { path: "/KidsZone", priority: 0.5, changeFrequency: "monthly" },
  { path: "/rewards", priority: 0.5, changeFrequency: "monthly" },
  { path: "/terms", priority: 0.2, changeFrequency: "yearly" },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await db.post.findMany({
    select: { id: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((route) => ({
    url: `${BASE_URL}${route.path}`,
    lastModified: new Date(),
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  const postEntries: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${BASE_URL}/Blog/${post.id}/post`,
    lastModified: post.createdAt,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  return [...staticEntries, ...postEntries];
}
