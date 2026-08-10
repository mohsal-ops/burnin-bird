// One-off seed: run with `npx ts-node --esm prisma/seedHours.ts` (loads
// DATABASE_URL from .env via dotenv/config below — no extra flags needed).
// Populates BusinessHours from the previously-hardcoded SITE_CONFIG.hours.
// Note: src/lib/getHours.ts also self-seeds these same defaults on first read,
// so running this script by hand is optional — it's here for parity with the
// other seed* scripts and for explicitly re-seeding in a fresh environment.
import "dotenv/config";
import { PrismaClient } from "../generated/prisma/index.js";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const db = new PrismaClient({ adapter });

const INITIAL_HOURS = [
  { day: "Sunday", dayIndex: 0, open: 11, close: 16 },
  { day: "Monday", dayIndex: 1, open: null, close: null },
  { day: "Tuesday", dayIndex: 2, open: 11, close: 21 },
  { day: "Wednesday", dayIndex: 3, open: 11, close: 21 },
  { day: "Thursday", dayIndex: 4, open: 11, close: 21 },
  { day: "Friday", dayIndex: 5, open: 11, close: 21 },
  { day: "Saturday", dayIndex: 6, open: 12, close: 20 },
];

async function main() {
  for (const h of INITIAL_HOURS) {
    await db.businessHours.upsert({
      where: { dayIndex: h.dayIndex },
      update: h,
      create: h,
    });
  }
  console.log("Hours seeded");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
