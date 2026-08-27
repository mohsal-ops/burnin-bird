import db from "@/db/db"
import Stripe from "stripe"
import { StripeCheckoutForm } from "../../_components/StripeCheckoutForm"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { deriveOrderType } from "@/lib/orderType"
import { getLoyaltySettings } from "@/lib/loyalty"

interface PageProps {
  params: Promise<{ id: string }>
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_placeholder")

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

  // Add the real Uber Direct courier fee only for delivery orders (it's stored on
  // the cart at address entry). Pickup orders are unaffected.
  const isDelivery = cart.items[0] ? deriveOrderType(cart.items[0]) === "delivery" : false
  const deliveryFee = isDelivery ? cart.uberFeeCents ?? 0 : 0
  const total = itemsTotal + deliveryFee

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
    <StripeCheckoutForm
      priceInCents={total}
      deliveryFeeInCents={deliveryFee}
      clientSecret={paymentIntent.client_secret}
      loyaltyEnabled={loyalty.enabled}
      loyaltyConsentText={loyalty.consentText}
    />
  )
}
