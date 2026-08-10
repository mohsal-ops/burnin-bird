// Seeds a FRESH cloned project's database with sensible EMPTY/DEFAULT data.
// Run by the new-project scaffolding tool against a brand-new Neon database
// (after `prisma migrate deploy`). It is intentionally NOT wired into any
// existing client's workflow - never run it against a live restaurant DB.
//
// It seeds ONLY: placeholder business hours, neutral SiteImage slots, and one
// fresh admin account. Menu items, categories, gallery, reviews, partners,
// orders, carts and users are deliberately left EMPTY so nothing from a
// previous client is ever carried over.
//
//   node prisma/seed.defaults.mjs
//   SEED_ADMIN_EMAIL=owner@joesdiner.com SEED_ADMIN_NAME="Joe" node prisma/seed.defaults.mjs
//
// Prints the generated admin email + password once at the end.

import { createRequire } from "module";
import { readFileSync } from "fs";
import { randomBytes, scrypt } from "crypto";
import { promisify } from "util";
import path from "path";
import { fileURLToPath } from "url";

const scryptAsync = promisify(scrypt);
const projectDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function readEnvVar(file, key) {
  try {
    const t = readFileSync(file, "utf8");
    for (const l of t.split(/\r?\n/)) {
      const m = l.match(new RegExp(`^\\s*${key}\\s*=\\s*(.*)$`));
      if (m) return m[1].trim().replace(/^['"]|['"]$/g, "");
    }
  } catch {}
  return null;
}

const dbUrl =
  process.env.DATABASE_URL ||
  readEnvVar(path.join(projectDir, ".env.local"), "DATABASE_URL") ||
  readEnvVar(path.join(projectDir, ".env"), "DATABASE_URL");
if (!dbUrl) {
  console.error("DATABASE_URL not set (env or .env).");
  process.exit(1);
}
process.env.DATABASE_URL = dbUrl;

const require = createRequire(path.join(projectDir, "package.json"));
const { PrismaClient } = require(path.join(projectDir, "generated", "prisma"));
const { PrismaPg } = require("@prisma/adapter-pg");
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: dbUrl }) });

// Content-neutral image slots (mirror src/lib/getSiteImages.ts). Placeholder
// images ship in /public/general/generalPages and are swapped from admin > Media.
const DEFAULT_SITE_IMAGES = [
  { key: "home_hero", url: "/general/generalPages/mainImage.jpg", label: "Home Page Hero" },
  { key: "home_order", url: "/general/generalPages/mainImage.jpg", label: "Home - Order Directly section" },
  { key: "home_feature_1", url: "/general/generalPages/enjoy.jpg", label: "Home - First Feature" },
  { key: "home_feature_2", url: "/general/generalPages/vibe.jpg", label: "Home - Second Feature" },
  { key: "story_hero", url: "/general/generalPages/partners.jpg", label: "Our Story - Hero" },
  { key: "story_origin", url: "/general/generalPages/grandmother.jpg", label: "Our Story - Origin Section" },
  { key: "story_closing", url: "/general/generalPages/enjoy.jpg", label: "Our Story - Closing Section" },
];

// Placeholder schedule (every day 11:00-21:00). The owner sets real hours in
// admin > Hours - this just keeps the open/closed widget from looking broken.
const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = await scryptAsync(password, salt, 64);
  return `${salt}:${derivedKey.toString("hex")}`;
}

async function main() {
  // 1. Business hours (placeholder)
  for (let i = 0; i < DAYS.length; i++) {
    await prisma.businessHours.upsert({
      where: { dayIndex: i },
      update: {},
      create: { day: DAYS[i], dayIndex: i, open: 11, close: 21 },
    });
  }
  console.log("✓ placeholder business hours");

  // 2. Neutral site image slots
  for (const img of DEFAULT_SITE_IMAGES) {
    await prisma.siteImage.upsert({ where: { key: img.key }, update: {}, create: img });
  }
  console.log("✓ default site image slots");

  // 3. Fresh admin (only if none exists yet)
  const existing = await prisma.admin.count();
  let creds = null;
  if (existing === 0) {
    const email = (process.env.SEED_ADMIN_EMAIL || "owner@example.com").toLowerCase();
    const name = process.env.SEED_ADMIN_NAME || "Owner";
    const password = randomBytes(12).toString("base64url");
    await prisma.admin.create({
      data: {
        name,
        email,
        passwordHash: await hashPassword(password),
        status: "APPROVED",
        emailVerifiedAt: new Date(),
      },
    });
    creds = { email, password };
    console.log("✓ admin account created");
  } else {
    console.log(`✓ admin already exists (${existing}) - skipped`);
  }

  console.log("\nDefaults seeded. Menu, gallery, reviews, and partners left EMPTY.");
  if (creds) {
    console.log("\n──────── ADMIN LOGIN (save this) ────────");
    console.log(`  Email:    ${creds.email}`);
    console.log(`  Password: ${creds.password}`);
    console.log("─────────────────────────────────────────");
  }
}

main()
  .catch((e) => {
    console.error("SEED FAILED:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
