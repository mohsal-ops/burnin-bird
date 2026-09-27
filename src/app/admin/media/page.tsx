import PageHeader from "../_components/pageHeader";
import { getAllSiteImages } from "@/lib/getSiteImages";
import { getSetting, getThemeColor } from "@/lib/siteSettings";
import { getActiveTheme } from "@/lib/themes/active";
import { THEME_MEDIA, mascotFor, stretchWord } from "@/lib/themes/mediaSlots";
import { SITE_CONFIG } from "@/lib/siteConfig";
import db from "@/db/db";
import MediaTabs from "./_components/MediaTabs";

export const dynamic = "force-dynamic";

export default async function MediaPage() {
  const theme = await getActiveTheme();
  const spec = THEME_MEDIA[theme];
  const [siteImages, galleryImages, dishes, brand, wordVals] = await Promise.all([
    getAllSiteImages(),
    db.galleryImage.findMany({ orderBy: { order: "asc" } }),
    db.item
      .findMany({ where: { featured: true, isAvailableForPurchase: true }, select: { id: true, name: true, image: true }, take: 8 })
      .catch(() => []),
    getThemeColor(),
    Promise.all(spec.words.map((w) => getSetting(w.key, ""))),
  ]);
  const words = Object.fromEntries(spec.words.map((w, i) => [w.key, wordVals[i]]).filter(([, v]) => v));
  const c = SITE_CONFIG;
  const trademark = c.trademark || c.name;

  return (
    <div className="lg:flex justify-center">
      <div className="p-5 space-y-4 w-full lg:w-[92%] xl:w-[88%]">
        <PageHeader>Media</PageHeader>
        <p className="text-sm text-stone-500 px-4 md:px-0">
          Every photo on your site, laid out the way your design actually uses them.
        </p>
        <MediaTabs
          theme={theme}
          siteImages={siteImages}
          galleryImages={galleryImages}
          dishes={dishes}
          words={words}
          name={trademark}
          brand={brand}
          autoMascot={`/mascots/${mascotFor(c.loaderStyle, c.cuisines)}.webp`}
          defaults={{
            sub: trademark.split(/\s+/)[0],
            heroWord: stretchWord(c.primaryDish || c.cuisines?.[0] || "Delicious"),
            headline: `Neighborhood ${c.primaryDish || c.cuisines?.[0] || "kitchen"}`,
          }}
        />
      </div>
    </div>
  );
}
