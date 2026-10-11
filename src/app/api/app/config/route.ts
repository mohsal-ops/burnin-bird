import { NextResponse } from "next/server";
import { appApiOff } from "@/lib/app/guard";
import { SITE_CONFIG } from "@/lib/siteConfig";
import { getBusinessHours } from "@/lib/getHours";
import { getLoyaltySettings } from "@/lib/loyalty";

export const dynamic = "force-dynamic";

// Restaurant info for the native app's Hours & contact screen.
export async function GET() {
  const off = await appApiOff();
  if (off) return off;
  const [hours, loyalty] = await Promise.all([getBusinessHours(), getLoyaltySettings()]);
  return NextResponse.json({
    name: SITE_CONFIG.name,
    phone: SITE_CONFIG.phone,
    address: SITE_CONFIG.address,
    hours: hours.map((h) => ({ day: h.day, open: h.open, close: h.close })),
    loyaltyEnabled: loyalty.enabled,
    rewardsUrl: `${SITE_CONFIG.siteUrl}/rewards`,
    orderingOpen: true,
  });
}
