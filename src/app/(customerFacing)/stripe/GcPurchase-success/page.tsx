import { Button } from "@/components/ui/button";
import Link from "next/link";
import Stripe from "stripe";

export default async function Success(props: any) {
  const searchParams = await Promise.resolve(props.searchParams);
  const payment_intent = searchParams?.payment_intent;

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_placeholder");

  if (!payment_intent) {
    return (
      <div className="flex items-center justify-center text-gray-400 w-full h-screen">
        A problem occurred
      </div>
    );
  }

  const paymentIntent = await stripe.paymentIntents.retrieve(payment_intent, {
    expand: ["charges.data.balance_transaction"],
  });

  if (!paymentIntent) {
    return (
      <div className="flex items-center justify-center text-gray-400 w-full h-screen">
        A problem occurred
      </div>
    );
  }

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
            <Link
              href={
                isSuccess
                  ? "/Menu"
                  : `products/${paymentIntent.metadata.cartId}/purchase`
              }
            >
              {isSuccess ? "Back to Menu" : "Try again"}
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
