import { NextResponse } from "next/server";
import db from "@/db/db";
import { SITE_CONFIG } from "@/lib/siteConfig";
import { getBusinessHours } from "@/lib/getHours";
import { getLogoUrl } from "@/lib/siteSettings";

// Data for the app-mode home screen (components/app-mode/AppHome). Public and
// cached like the public pages (ISR, 5 min) so it costs almost nothing.
export const revalidate = 300;

type Hours = { dayIndex: number; open: number; close: number };

// Open right now in the restaurant's timezone? Hours are whole hours (0-24);
// close <= open means "past midnight".
function openState(hours: Hours[]) {
  const now = new Date(new Date().toLocaleString("en-US", { timeZone: SITE_CONFIG.timezone }));
  const h = now.getHours() + now.getMinutes() / 60;
  const today = hours.find((x) => x.dayIndex === now.getDay());
  const fmt = (n: number) => {
    const hr = Math.floor(n) % 24;
    return `${hr % 12 || 12}${hr < 12 ? "am" : "pm"}`;
  };
  if (!today || today.open === today.close) return { open: false, label: "Closed today" };
  const close = today.close <= today.open ? today.close + 24 : today.close;
  if (h >= today.open && h < close) return { open: true, label: `Open until ${fmt(today.close)}` };
  if (h < today.open) return { open: false, label: `Opens at ${fmt(today.open)}` };
  return { open: false, label: "Closed now" };
}

export async function GET() {
  try {
    const [hours, logoUrl, featured] = await Promise.all([
      getBusinessHours(),
      getLogoUrl(),
      db.item.findMany({
        where: { isAvailableForPurchase: true, featured: true },
        select: { id: true, name: true, description: true, priceInCents: true, image: true },
        take: 8,
      }),
    ]);
    const items = featured.length
      ? featured
      : await db.item.findMany({
          where: { isAvailableForPurchase: true, image: { not: null } },
          select: { id: true, name: true, description: true, priceInCents: true, image: true },
          take: 8,
        });
    return NextResponse.json({
      name: SITE_CONFIG.name,
      address: (SITE_CONFIG as { street?: string }).street || SITE_CONFIG.address || "",
      logoUrl: logoUrl || null,
      status: openState(hours as Hours[]),
      items: items.filter((i) => i.image),
    });
  } catch {
    return NextResponse.json({ name: SITE_CONFIG.name, address: "", logoUrl: null, status: null, items: [] });
  }
}
