import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import db from "@/db/db";
import { LOYALTY_PROJECT_ID } from "@/lib/loyalty";
import { normalizeCode, REDEMPTION_WINDOW_DAYS } from "@/lib/loyaltyPromo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Apply / clear a loyalty campaign promo code on the current cart. Validated
// against active campaign codes (sent within the redemption window). Storing the
// campaign id on the cart is what makes the discount apply at checkout and lets a
// completed order count as a redemption (see finalizeCart).
export async function POST(req: NextRequest) {
  const cartId = (await cookies()).get("cart_id")?.value;
  if (!cartId) return NextResponse.json({ valid: false, error: "No cart yet." }, { status: 200 });

  const body = (await req.json().catch(() => ({}))) as { code?: unknown };
  const raw = typeof body.code === "string" ? body.code : "";

  // Empty code clears any applied promo.
  if (!raw.trim()) {
    await db.cart.update({ where: { id: cartId }, data: { promoCampaignId: null } }).catch(() => {});
    return NextResponse.json({ valid: false, cleared: true });
  }

  const code = normalizeCode(raw);
  const since = new Date(Date.now() - REDEMPTION_WINDOW_DAYS * 86400_000);
  const campaign = await db.loyaltyCampaign.findFirst({
    where: { projectId: LOYALTY_PROJECT_ID, redemptionCode: code, sentAt: { gte: since } },
    select: { id: true, discountPercent: true, sentAt: true },
  });

  if (!campaign) {
    // Don't reveal whether the code exists but expired vs never existed.
    await db.cart.update({ where: { id: cartId }, data: { promoCampaignId: null } }).catch(() => {});
    return NextResponse.json({ valid: false, error: "That code isn't valid or has expired." });
  }

  await db.cart.update({ where: { id: cartId }, data: { promoCampaignId: campaign.id } });
  return NextResponse.json({ valid: true, code, discountPercent: campaign.discountPercent });
}
