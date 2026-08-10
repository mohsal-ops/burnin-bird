// One-off seed: run with `npx tsx prisma/seedReviews.ts`
// Populates Review from the previously-hardcoded home page testimonials.
import { PrismaClient } from "../generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const db = new PrismaClient({ adapter });

const REVIEWS = [
  {
    name: "Terrence B.",
    review:
      "This was some good eatin! Chicken has a nice coating and is crispy. The jerk flavor in the breading sets this apart from others. The sauce options were next level.",
    avatar:
      "https://api.dicebear.com/7.x/micah/svg?seed=TerenceB&backgroundColor=b6e3f4",
  },
  {
    name: "Sofia M.",
    review:
      "I've tried Caribbean food all over Houston and Southern Jerks is hands down the best. The seasoning is bold without being overpowering. My whole family is obsessed now!",
    avatar:
      "https://api.dicebear.com/7.x/micah/svg?seed=SofiaM&backgroundColor=ffd5dc",
  },
  {
    name: "James L.",
    review:
      "Came in on my lunch break and ended up going back for dinner the same day. The jerk chicken sandwich is unreal. Fast service, friendly staff highly recommend.",
    avatar:
      "https://api.dicebear.com/7.x/micah/svg?seed=JamesL&backgroundColor=c0aede",
  },
  {
    name: "Amara N.",
    review:
      "As someone who grew up eating Caribbean food, I'm very picky. Southern Jerks nailed the authentic flavor. Crispy, juicy, perfectly spiced. Will be a regular for sure.",
    avatar:
      "https://api.dicebear.com/7.x/micah/svg?seed=AmaraN&backgroundColor=d1f5c0",
  },
  {
    name: "Paris B.",
    review:
      "I've been addicted since I first tried them. Went back that same day for dinner. Told my whole job and we've been ordering for team lunch ever since. 10/10, no debate.",
    avatar:
      "https://api.dicebear.com/7.x/micah/svg?seed=ParisB&backgroundColor=ffeaa7",
  },
];

async function main() {
  const existing = await db.review.count();
  if (existing > 0) {
    console.log(`Review already has ${existing} rows -- skipping seed.`);
    return;
  }

  await db.review.createMany({
    data: REVIEWS.map((r, i) => ({ ...r, order: i })),
  });

  console.log(`Seeded ${REVIEWS.length} reviews.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
