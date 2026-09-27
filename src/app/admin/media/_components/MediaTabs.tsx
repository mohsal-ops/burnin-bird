"use client";

import { useState } from "react";
import { FileImage, Images, LayoutTemplate } from "lucide-react";
import SiteImageManager from "@/app/admin/images/_components/SiteImageManager";
import GalleryManager from "@/app/admin/gallery/_components/GalleryManager";
import { THEME_MEDIA } from "@/lib/themes/mediaSlots";
import type { ThemeSlug } from "@/lib/themes/registry";
import ThemeMediaStudio from "./ThemeMediaStudio";

type SiteImageRow = { id: string; key: string; url: string; label: string };
type GalleryImage = { id: string; url: string; alt: string; order: number };
type Dish = { id: string; name: string; image: string | null };
type TabId = "home" | "pages" | "gallery";

// Photos that live on other pages (Our Story, Catering) — the same in every design.
const OTHER_PAGE_KEYS = ["story_hero", "story_origin", "story_closing", "catering_hero"];

export default function MediaTabs({
  theme, siteImages, galleryImages, dishes, words, name, brand, autoMascot, defaults,
}: {
  theme: ThemeSlug;
  siteImages: SiteImageRow[];
  galleryImages: GalleryImage[];
  dishes: Dish[];
  words: Record<string, string>;
  name: string;
  brand: string;
  autoMascot: string;
  defaults: { sub: string; heroWord: string; headline: string };
}) {
  const [tab, setTab] = useState<TabId>("home");
  const otherPages = siteImages.filter((i) => OTHER_PAGE_KEYS.includes(i.key));
  const TABS: { id: TabId; label: string; icon: typeof Images; count: number; blurb: string }[] = [
    {
      id: "home",
      label: "Homepage",
      icon: LayoutTemplate,
      count: THEME_MEDIA[theme].slots.length,
      blurb: "The photo spots your homepage design uses — numbered on the live map so you always know exactly where each one appears.",
    },
    {
      id: "pages",
      label: "Other pages",
      icon: FileImage,
      count: otherPages.length,
      blurb: "Photos for Our Story and Catering. These look the same whichever design your site uses.",
    },
    {
      id: "gallery",
      label: "Gallery",
      icon: Images,
      count: galleryImages.length,
      blurb: "Your photo gallery. Add as many photos as you like and drag to reorder them.",
    },
  ];
  const current = TABS.find((t) => t.id === tab)!;
  const CurrentIcon = current.icon;

  return (
    <div className="space-y-5">
      <div className="inline-flex flex-wrap rounded-xl border border-stone-200 bg-white p-1 shadow-sm">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = t.id === tab;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${active ? "bg-[#c85a1e] text-white shadow-sm" : "text-stone-600 hover:bg-stone-100"}`}
            >
              <Icon size={16} />
              {t.label}
              <span className={`rounded-full px-1.5 text-[11px] font-bold ${active ? "bg-white/25 text-white" : "bg-stone-100 text-stone-500"}`}>{t.count}</span>
            </button>
          );
        })}
      </div>

      <div className="flex items-start gap-3 rounded-xl border border-stone-200 bg-stone-50 p-4">
        <CurrentIcon size={18} className="mt-0.5 shrink-0 text-[#c85a1e]" />
        <p className="text-sm text-stone-600">{current.blurb}</p>
      </div>

      {/* All stay mounted so switching tabs never loses an in-progress upload. */}
      <div className={tab === "home" ? "" : "hidden"}>
        <ThemeMediaStudio
          theme={theme}
          rows={siteImages}
          dishes={dishes}
          words={words}
          name={name}
          brand={brand}
          autoMascot={autoMascot}
          defaults={defaults}
        />
      </div>
      <div className={tab === "pages" ? "" : "hidden"}>
        <SiteImageManager images={otherPages} />
      </div>
      <div className={tab === "gallery" ? "" : "hidden"}>
        <GalleryManager images={galleryImages} />
      </div>
    </div>
  );
}
