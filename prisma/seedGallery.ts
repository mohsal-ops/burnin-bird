// One-off seed: run with `npx tsx prisma/seedGallery.ts`
// Populates GalleryImage from the previously-hardcoded home page photo grid.
import { PrismaClient } from "../generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const db = new PrismaClient({ adapter });

const IMAGES = [
  "SouthernJerks-Sep25-78.jpg",
  "SouthernJerks-Sep25-73.jpg",
  "SouthernJerks-Sep25-52.jpg",
  "SouthernJerks-Sep25-59.jpg",
  "SouthernJerks-Sep25-55.jpg",
  "SouthernJerks-Sep25-63.jpg",
  "SouthernJerks-Sep25-58.jpg",
  "SouthernJerks-Sep25-53.jpg",
  "SouthernJerks-Sep25-42.jpg",
  "SouthernJerks-Sep25-46.jpg",
  "SouthernJerks-Sep25-27.jpg",
  "SouthernJerks-Sep25-25.jpg",
];

async function main() {
  const existing = await db.galleryImage.count();
  if (existing > 0) {
    console.log(`GalleryImage already has ${existing} rows -- skipping seed.`);
    return;
  }

  await db.galleryImage.createMany({
    data: IMAGES.map((file, i) => ({
      url: `/general/3rdsection/${file}`,
      alt: "Southern Jerks jerk chicken and wings in Houston, TX",
      order: i,
    })),
  });

  console.log(`Seeded ${IMAGES.length} gallery images.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
