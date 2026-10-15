import { NextResponse } from "next/server";
import db from "@/db/db";

// Photos for the picture tiles in the phone menu ("Menu" + "Our Story"), from
// the restaurant's own gallery (dish photos as a fallback). Uses what the site already has (no
// extra uploads). Public + ISR-cached like the public pages, so it's ~free.
export const revalidate = 300;

export async function GET() {
  const [items, gallery] = await Promise.all([
    db.item
      .findMany({
        where: { isAvailableForPurchase: true, NOT: [{ image: null }, { image: "" }] },
        orderBy: [{ featured: "desc" }],
        select: { image: true },
        take: 3,
      })
      .catch(() => []),
    db.galleryImage.findMany({ orderBy: { order: "asc" }, select: { url: true }, take: 6 }).catch(() => []),
  ]);
  // Real photos (the gallery) look best zoomed; dish cut-outs are the fallback.
  const g = gallery.map((x) => x.url).filter(Boolean);
  const dishes = items.map((i) => i.image).filter((x): x is string => !!x);
  const menu = g.length >= 2 ? g.slice(0, 3) : dishes;
  const story = g.length >= 5 ? g.slice(3, 6) : g.length >= 2 ? g.slice(-2) : [];
  return NextResponse.json({ menu, story });
}
