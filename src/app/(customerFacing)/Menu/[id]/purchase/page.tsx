import db from "@/db/db"
import { notFound } from "next/navigation"
import Stripe from "stripe"
import { StripeCheckoutForm } from "../../_components/StripeCheckoutForm"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface PageProps {
  params: Promise<{ id: string }>
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_placeholder")

// ✅ FIX: await the params
export default async function Page({ params }: PageProps) {
  const { id } = await params

  if (!id) {
    return (
      <div className="flex items-center justify-center text-gray-400 w-full h-screen">
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
      <div className="h-svh justify-center w-full flex items-center text-stone-400">
        Your cart ID was not found
        <Button variant="link">
          <Link href="/Menu">Try again</Link>
        </Button>
      </div>
    )
  }

  const total = cart.items.reduce(
    (acc, item) => acc + (item.price ?? 0) * (item.quantity ?? 0),
    0
  )

  const paymentIntent = await stripe.paymentIntents.create({
    amount: total,
    currency: "USD",
    metadata: { cartId: cart.id },
  })

  if (!paymentIntent.client_secret) {
    throw new Error("Stripe failed to create payment intent")
  }

  return (
    <StripeCheckoutForm
      priceInCents={total}
      clientSecret={paymentIntent.client_secret}
    />
  )
}
