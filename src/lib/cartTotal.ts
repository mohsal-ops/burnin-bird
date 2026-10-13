import "server-only";
import db from "@/db/db";
import { deriveOrderType } from "@/lib/orderType";
import { REDEMPTION_WINDOW_DAYS } from "@/lib/loyaltyPromo";

type CartForTotal = {
  promoCampaignId: string | null;
  uberFeeCents: number | null;
  items: { price: number | null; quantity: number | null; orderType?: string | null; deliveryAddress?: string | null }[];
};

// The ONE place a cart's payable total is computed (items - loyalty promo +
// courier fee). The checkout page charges this; finalizeCart re-checks the paid
// amount against it so a cart changed after checkout opened can't be under-paid.
export async function cartTotalCents(cart: CartForTotal): Promise<{ total: number; discount: number; deliveryFee: number; code: string | null }> {
  const itemsTotal = cart.items.reduce((acc, it) => acc + (it.price ?? 0) * (it.quantity ?? 0), 0);

  let discount = 0;
  let code: string | null = null;
  if (cart.promoCampaignId) {
    const since = new Date(Date.now() - REDEMPTION_WINDOW_DAYS * 86400_000);
    const camp = await db.loyaltyCampaign.findFirst({
      where: { id: cart.promoCampaignId, sentAt: { gte: since } },
      select: { discountPercent: true, redemptionCode: true },
    });
    if (camp) {
      discount = Math.round((itemsTotal * camp.discountPercent) / 100);
      code = camp.redemptionCode;
    }
  }

  const first = cart.items[0];
  const isDelivery = first
    ? deriveOrderType({ deliveryAddress: first.deliveryAddress ?? null, orderType: first.orderType ?? null }) === "delivery"
    : false;
  const deliveryFee = isDelivery ? cart.uberFeeCents ?? 0 : 0;
  return { total: Math.max(0, itemsTotal - discount) + deliveryFee, discount, deliveryFee, code };
}
