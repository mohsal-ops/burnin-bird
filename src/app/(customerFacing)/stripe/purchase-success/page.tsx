import { Button } from "@/components/ui/button";
import db from "@/db/db";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireStripe } from "@/lib/stripeConfig";
import { finalizeCart } from "@/lib/finalizeOrder";
import { isEnabled } from "@/lib/flags";
import PushOptIn from "@/components/pwa/PushOptIn";
import MarkOrdered from "@/components/pwa/MarkOrdered";
import SaveInfoCard from "@/components/SaveInfoCard";
import { currentCustomerEmail } from "@/lib/customerAuth";


export default async function Success(props: any) {
  const searchParams = await Promise.resolve(props.searchParams);
  const payment_intent = searchParams?.payment_intent;

  if (!payment_intent) return notFound();
  const stripe = await requireStripe();

  const paymentIntent = await stripe.paymentIntents.retrieve(payment_intent);

  if (!paymentIntent) return notFound();

  // Finalize here too (idempotent) so the order completes, counts as revenue,
  // dispatches the courier and notifies - even if the Stripe webhook isn't set up.
  if (paymentIntent.status === "succeeded") {
    await finalizeCart(paymentIntent.metadata.cartId, paymentIntent.receipt_email || "N/A", paymentIntent.amount_received);
  }

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
  const pushOn = isSuccess && (await isEnabled("web_push"));
  // Offer "Save your info?" to guests who paid with an email (accounts on).
  const clientSecret = typeof searchParams?.payment_intent_client_secret === "string" ? searchParams.payment_intent_client_secret : "";
  const offerSave =
    isSuccess && !!paymentIntent.receipt_email && !!clientSecret && (await isEnabled("customer_accounts")) && !(await currentCustomerEmail());

  return (
    <div className="flex max-w-5xl items-center justify-center h-96 pt-20 w-full space-y-10">
      <div className="flex flex-col justify-center items-center min-w-1/3 space-y-5 p-6 bg-green-500 rounded-2xl">
        <div className="text-4xl font-bold text-foreground">
          {isSuccess ? "Success!" : "Error"}
        </div>
        <div className="text-lg tracking-wide font-medium text-center space-y-2">
          <h1>Thanks for your order</h1>
          {isSuccess && <MarkOrdered />}
          {offerSave && <SaveInfoCard paymentIntent={paymentIntent.id} clientSecret={clientSecret} email={paymentIntent.receipt_email!} />}
          {pushOn && (
            <PushOptIn
              audience="customer"
              cartId={cart.id}
              label={cart.uberQuoteId ? "Notify me when it's on the way" : "Notify me when it's ready"}
              className="flex flex-col items-center pt-1"
            />
          )}
          {isSuccess && cart.uberDeliveryId && (
            <div className="text-sm font-normal">
              <p>
                A courier is being arranged
                {cart.uberStatus ? ` - status: ${cart.uberStatus.replace(/_/g, " ")}` : ""}.
              </p>
              {cart.uberTrackingUrl && (
                <a
                  href={cart.uberTrackingUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="underline font-semibold"
                >
                  Track your courier
                </a>
              )}
            </div>
          )}
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
