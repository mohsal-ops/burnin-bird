"use client";

import { useState } from "react";
import { Image as ImageIcon, Images } from "lucide-react";
import SiteImageManager from "@/app/admin/images/_components/SiteImageManager";
import GalleryManager from "@/app/admin/gallery/_components/GalleryManager";

type SiteImageRow = { id: string; key: string; url: string; label: string };
type GalleryImage = { id: string; url: string; alt: string; order: number };

const TABS = [
  {
    id: "site" as const,
    label: "Site photos",
    icon: ImageIcon,
    blurb:
      "Fixed spots on your site, the home page hero and the Our Story photos. Each slot holds one specific image.",
  },
  {
    id: "gallery" as const,
    label: "Gallery",
    icon: Images,
    blurb:
      "The photo grid shown on your homepage. Add as many photos as you like and drag to reorder them.",
  },
];

export default function MediaTabs({
  siteImages,
  galleryImages,
}: {
  siteImages: SiteImageRow[];
  galleryImages: GalleryImage[];
}) {
  const [tab, setTab] = useState<"site" | "gallery">("site");
  const current = TABS.find((t) => t.id === tab)!;
  const CurrentIcon = current.icon;

  return (
    <div className="space-y-5">
      {/* Tab switcher */}
      <div className="inline-flex flex-wrap rounded-xl border border-stone-200 bg-white p-1 shadow-sm">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = t.id === tab;
          const count = t.id === "gallery" ? galleryImages.length : siteImages.length;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                active
                  ? "bg-[#c85a1e] text-white shadow-sm"
                  : "text-stone-600 hover:bg-stone-100"
              }`}
            >
              <Icon size={16} />
              {t.label}
              <span
                className={`rounded-full px-1.5 text-[11px] font-bold ${
                  active ? "bg-white/25 text-white" : "bg-stone-100 text-stone-500"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* What this tab is */}
      <div className="flex items-start gap-3 rounded-xl border border-stone-200 bg-stone-50 p-4">
        <CurrentIcon size={18} className="mt-0.5 shrink-0 text-[#c85a1e]" />
        <p className="text-sm text-stone-600">{current.blurb}</p>
      </div>

      {/* Both stay mounted (kept in the DOM) so switching tabs never loses an
          in-progress upload or a reordered gallery - just hide the inactive one. */}
      <div className={tab === "site" ? "" : "hidden"}>
        <SiteImageManager images={siteImages} />
      </div>
      <div className={tab === "gallery" ? "" : "hidden"}>
        <GalleryManager images={galleryImages} />
      </div>
    </div>
  );
}
