import { Button } from "@/components/ui/button";
import db from "@/db/db";
import Link from "next/link";
import { notFound } from "next/navigation";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_placeholder");

export default async function Success(props: any) {
  const searchParams = await Promise.resolve(props.searchParams);
  const payment_intent = searchParams?.payment_intent;

  if (!payment_intent) return notFound();

  const paymentIntent = await stripe.paymentIntents.retrieve(payment_intent);

  if (!paymentIntent) return notFound();

  const cart = await db.cart.findUnique({
    where: { id: paymentIntent.metadata.cartId },
    include: { items: true },
  });

  if (!cart) return notFound();

  const total = cart.items.reduce(
    (acc, item) => acc + (item.price ?? 0) * (item.quantity ?? 0),
    0
  );

  const isSuccess = paymentIntent.status === "succeeded";

  return (
    <div className="flex max-w-5xl items-center justify-center h-96 pt-20 w-full space-y-10">
      <div className="flex flex-col justify-center items-center min-w-1/3 space-y-5 p-6 bg-green-500 rounded-2xl">
        <div className="text-4xl font-bold text-foreground">
          {isSuccess ? "Success!" : "Error"}
        </div>
        <div className="text-lg tracking-wide font-medium text-center space-y-2">
          <h1>Thanks for your order</h1>
          <Button variant="link" className="mt-4 w-full" asChild>
            {isSuccess ? (
              <a href="/Menu">Back to Menu</a>
            ) : (
              <Link href={`/Menu/${paymentIntent.metadata.cartId}/purchase`}>
                Try again
              </Link>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
