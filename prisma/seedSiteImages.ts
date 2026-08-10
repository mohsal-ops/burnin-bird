// One-off seed: run with `npx ts-node --esm prisma/seedSiteImages.ts` (loads
// DATABASE_URL from .env via dotenv/config below — no extra flags needed).
// Populates SiteImage from the previously-hardcoded local image imports.
// Note: src/lib/getSiteImages.ts also self-seeds these same defaults on first
// read, so running this script by hand is optional — it's here for parity
// with the other seed* scripts and for explicitly re-seeding in a fresh environment.
import "dotenv/config";
import { PrismaClient } from "../generated/prisma/index.js";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const db = new PrismaClient({ adapter });

async function main() {
  const images = [
    { key: "home_hero", url: "/general/generalPages/mainImage.jpg", label: "Home Page Hero" },
    { key: "story_hero", url: "/general/generalPages/partners.jpg", label: "Our Story -- Hero" },
    { key: "story_origin", url: "/general/generalPages/grandmother.jpg", label: "Our Story -- Origin Section" },
    { key: "story_closing", url: "/general/generalPages/enjoy.jpg", label: "Our Story -- Closing Section" },
  ];
  for (const img of images) {
    await db.siteImage.upsert({ where: { key: img.key }, update: img, create: img });
  }
  console.log("Site images seeded");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
