import db from "@/db/db";

export const DEFAULT_SITE_IMAGES = [
  { key: "home_hero", url: "/general/generalPages/mainImage.jpg", label: "Home Page Hero" },
  { key: "story_hero", url: "/general/generalPages/partners.jpg", label: "Our Story - Hero" },
  { key: "story_origin", url: "/general/generalPages/grandmother.jpg", label: "Our Story - Origin Section" },
  { key: "story_closing", url: "/general/generalPages/enjoy.jpg", label: "Our Story - Closing Section" },
  { key: "home_order", url: "/general/generalPages/mainImage.jpg", label: "Home - Order Directly section" },
  { key: "home_feature_1", url: "/general/generalPages/enjoy.jpg", label: "Home - First Feature" },
  { key: "home_feature_2", url: "/general/generalPages/vibe.jpg", label: "Home - Second Feature" },
  { key: "catering_hero", url: "/general/generalPages/enjoy.jpg", label: "Catering - Hero" },
];

async function seedDefaults() {
  await Promise.all(
    DEFAULT_SITE_IMAGES.map((img) =>
      db.siteImage.upsert({ where: { key: img.key }, update: {}, create: img }),
    ),
  );
}

// Falls back to seeding from DEFAULT_SITE_IMAGES if the row is missing (fresh
// DB, or the seed script was never run) instead of returning an empty string.
export async function getSiteImage(key: string): Promise<string> {
  const img = await db.siteImage.findUnique({ where: { key } });
  if (img) return img.url;

  await seedDefaults();
  const seeded = await db.siteImage.findUnique({ where: { key } });
  return seeded?.url ?? "";
}

export async function getAllSiteImages() {
  // Idempotently ensure every default slot exists (upsert with an empty update
  // never clobbers a custom URL), so newly-added slots like the catering photo
  // show up in admin immediately without waiting for a page visit.
  await seedDefaults();
  return db.siteImage.findMany({ orderBy: { key: "asc" } });
}
