import db from "@/db/db"
import { getStripe, getStripeConfig } from "@/lib/stripeConfig"
import { StripeCheckoutForm } from "../../_components/StripeCheckoutForm"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { deriveOrderType } from "@/lib/orderType"
import { getLoyaltySettings, loyaltyIncentive } from "@/lib/loyalty"
import { REDEMPTION_WINDOW_DAYS } from "@/lib/loyaltyPromo"
import { PromoField } from "../../../_components/PromoField"

interface PageProps {
  params: Promise<{ id: string }>
}


// ✅ FIX: await the params
export default async function Page({ params }: PageProps) {
  const { id } = await params

  if (!id) {
    return (
      <div className="flex items-center justify-center text-muted-foreground w-full h-screen">
        A problem occurred
      </div>
    )
  }

  const cart = await db.cart.findUnique({
    where: { id },
    include: { items: true },
  })

  if (!cart) {
    return (
      <div className="h-svh justify-center w-full flex items-center text-muted-foreground">
        Your cart ID was not found
        <Button variant="link">
          <Link href="/Menu">Try again</Link>
        </Button>
      </div>
    )
  }

  const itemsTotal = cart.items.reduce(
    (acc, item) => acc + (item.price ?? 0) * (item.quantity ?? 0),
    0
  )

  // Loyalty promo: a campaign code applied to this cart discounts the items
  // subtotal (verified still inside the redemption window). Delivery is untouched.
  let discountInCents = 0
  let appliedPromoCode: string | null = null
  if (cart.promoCampaignId) {
    const since = new Date(Date.now() - REDEMPTION_WINDOW_DAYS * 86400_000)
    const camp = await db.loyaltyCampaign.findFirst({
      where: { id: cart.promoCampaignId, sentAt: { gte: since } },
      select: { discountPercent: true, redemptionCode: true },
    })
    if (camp) {
      discountInCents = Math.round((itemsTotal * camp.discountPercent) / 100)
      appliedPromoCode = camp.redemptionCode
    }
  }

  // Add the real Uber Direct courier fee only for delivery orders (it's stored on
  // the cart at address entry). Pickup orders are unaffected.
  const isDelivery = cart.items[0] ? deriveOrderType(cart.items[0]) === "delivery" : false

  // A delivery order is only payable with a real courier quote. Without one there
  // is no courier to dispatch, so never take payment for a "free" delivery that
  // won't happen - send the customer back to fix the address or pick up.
  if (isDelivery && !cart.uberQuoteId) {
    return (
      <div className="mx-auto flex min-h-[60svh] w-full max-w-md flex-col items-center justify-center gap-4 px-6 pt-24 text-center">
        <h1 className="text-xl font-semibold">Delivery isn&apos;t available for this order</h1>
        <p className="text-muted-foreground">
          We couldn&apos;t get a courier for your delivery address, so nothing has been charged.
          Please go back and choose pickup, or try a different address.
        </p>
        <Button asChild variant="mainButton">
          <Link href="/Menu">Back to the menu</Link>
        </Button>
      </div>
    )
  }

  const deliveryFee = isDelivery ? cart.uberFeeCents ?? 0 : 0
  const total = Math.max(0, itemsTotal - discountInCents) + deliveryFee

  const [stripe, stripeCfg] = await Promise.all([getStripe(), getStripeConfig()])
  if (!stripe || !stripeCfg.publishableKey) {
    return (
      <div className="mx-auto flex min-h-[60svh] w-full max-w-md flex-col items-center justify-center gap-4 px-6 pt-24 text-center">
        <h1 className="text-xl font-semibold">Online payment isn&apos;t open yet</h1>
        <p className="text-muted-foreground">
          This restaurant hasn&apos;t switched on card payments yet, so nothing has been charged. Please call to order.
        </p>
        <Button asChild variant="mainButton">
          <Link href="/Menu">Back to the menu</Link>
        </Button>
      </div>
    )
  }

  const paymentIntent = await stripe.paymentIntents.create({
    amount: total,
    currency: "USD",
    metadata: { cartId: cart.id },
  })

  if (!paymentIntent.client_secret) {
    throw new Error("Stripe failed to create payment intent")
  }

  const loyalty = await getLoyaltySettings()

  return (
    <>
      <div className="mx-auto w-full max-w-md px-4 pt-4">
        <PromoField appliedCode={appliedPromoCode} discountInCents={discountInCents} />
      </div>
      <StripeCheckoutForm
        priceInCents={total}
        deliveryFeeInCents={deliveryFee}
        clientSecret={paymentIntent.client_secret}
        publishableKey={stripeCfg.publishableKey}
        loyaltyEnabled={loyalty.enabled}
        loyaltyConsentText={loyalty.consentText}
        loyaltyIncentive={loyaltyIncentive()}
      />
    </>
  )
}
