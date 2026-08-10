"use client";

import { useEffect, useState, FormEvent } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  LinkAuthenticationElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import logo from "public/logo.png";
import { SITE_CONFIG } from "@/lib/siteConfig";
import { formatCurrency } from "@/lib/formatters";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import Image from "next/image";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY as string,
);

export default function GiftCardPageClient({ logoUrl }: { logoUrl?: string }) {
  const [clientSecret, setClientSecret] = useState<string>();
  const [price, setPrice] = useState(50 * 100);
  const route = useRouter();

  useEffect(() => {
    const fetchClientSecret = async () => {
      try {
        const res = await fetch("/api/GiftCard/create-intent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount: price }),
        });

        if (!res.ok) {
          throw new Error(
            `Failed to create payment intent. Status: ${res.status}`,
          );
        }

        const data = await res.json();

        if (data.clientSecret) {
          setClientSecret(data.clientSecret);
        } else {
          throw new Error("clientSecret missing in response");
        }
      } catch (error) {
        console.error("Error fetching clientSecret:", error);
        // Optionally show an error message to the user
      }
    };

    fetchClientSecret();
  }, [price]);

  // Stripe.js appends controller/Link iframes to <body> that survive Next's
  // client-side navigation - remove them when leaving this page so the floating
  // Stripe/Link widget doesn't linger across the rest of the site.
  useEffect(() => {
    return () => {
      document
        .querySelectorAll(
          'iframe[name^="__privateStripe"], iframe[src*="stripe.com"]',
        )
        .forEach((el) => el.remove());
    };
  }, []);

  return (
    <div className="max-w-5xl mx-auto mt-10 space-y-10">
      {/* 🔥 HERO */}
      <section className="relative overflow-hidden rounded-3xl bg-white px-10 py-24 text-center shadow-xl text-brand">
        {/* REPEATED LOGO BACKGROUND */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url(${logo.src})`,
            backgroundRepeat: "repeat",
            backgroundSize: "200px 200px",
            transform: "rotate(-8deg) scale(1.2)",
          }}
        />

        {/* DARK OVERLAY */}
        <div className="absolute inset-0 bg-white/90" />

        {/* CONTENT */}
        <div className="relative z-10">
          <div className="flex justify-center mb-6">
            <div className="rounded-2xl bg-brand p-3 shadow-xl">
              <Image src={logoUrl || logo} alt={`${SITE_CONFIG.name}`} className="h-20 w-20 rounded-full object-cover" />
            </div>
          </div>

          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight">
            A Gift They’ll <span className="text-stone-300">Never Forget</span>
          </h1>

          <p className="mt-6 max-w-2xl mx-auto text-lg">
            Premium food. Bold flavors. One unforgettable experience. Send a
            The Wagon Wheel gift card instantly.
          </p>
        </div>
      </section>

      {/* 🎁 GIFT CARD PREVIEW */}
      <section className="grid md:grid-cols-2 gap-10 items-center px-6">
        <div className="relative">
          <div className="rounded-2xl bg-linear-to-br from-brand to-brand-dark p-8 shadow-2xl -rotate-3">
            <div className="flex justify-between items-center mb-10">
              <span className="font-bold text-brand-foreground text-xl">
                The Wagon Wheel
              </span>
              <span className="text-brand-foreground/70">Gift Card</span>
            </div>

            <div className="text-brand-foreground text-4xl font-extrabold mb-4">
              {formatCurrency(price / 100)}
            </div>

            <div className="flex justify-between text-brand-foreground/80 text-sm">
              <span>No Expiration</span>
              <span>Premium Experience</span>
            </div>
          </div>
        </div>

        {/* Amount Selector */}
        <div className="space-y-6">
          <h2 className="text-3xl font-bold text-gray-900">
            Choose the amount
          </h2>

          <div className="flex flex-wrap gap-3">
            {[10, 25, 50, 75, 100].map((amt) => (
              <Button
                key={amt}
                variant="outline"
                className={cn(
                  "rounded-full px-6 py-3 text-lg border-2",
                  price === amt * 100
                    ? "bg-black text-stone-200 border-black"
                    : "border-gray-300",
                )}
                onClick={() => setPrice(amt * 100)}
              >
                ${amt}
              </Button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <Label htmlFor="custom-amount" className="text-gray-700">Custom amount</Label>
            <Input
              id="custom-amount"
              type="number"
              min={1}
              className="w-32"
              placeholder="e.g. 30"
              onChange={(e) => setPrice(e.target.valueAsNumber * 100)}
            />
          </div>
        </div>
      </section>

      {/* 💳 PAYMENT */}
      {clientSecret ? (
        <Elements options={{ clientSecret }} stripe={stripePromise}>
          <CheckoutForm
            priceInCents={price}
            paymentIntentId={clientSecret.split("_secret_")[0]}
          />
        </Elements>
      ) : (
        <div className="flex justify-center text-gray-400 py-10">
          Loading payment…
          <Button
            variant="link"
            onClick={() => route.refresh()}
            className="ml-1"
          >
            refresh
          </Button>
        </div>
      )}
    </div>
  );
}

function CheckoutForm({
  priceInCents,
  paymentIntentId,
}: {
  priceInCents: number;
  paymentIntentId: string;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [email, setEmail] = useState<string>();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>();
  const [formData, setFormData] = useState({
    fromName: "",
    fromEmail: "",
    toName: "",
    toEmail: "",
    note: "",
    delivery: "now",
  });
  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (!stripe || !elements || !email) return;

    setIsLoading(true);

    try {
      // 1. Attach sender/recipient details to the PaymentIntent so the
      // webhook can include them in the purchase notification email.
      const formRes = await fetch("/api/GiftCard/attach-details", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentIntentId,
          fromName: formData.fromName,
          fromEmail: formData.fromEmail,
          toName: formData.toName,
          toEmail: formData.toEmail,
          note: formData.note,
          delivery: formData.delivery,
        }),
      });

      if (!formRes.ok) {
        throw new Error("Error saving form data");
      }

      // 2. Confirm Stripe Payment
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/stripe/GcPurchase-success`,
          receipt_email: email,
        },
      });

      if (error) {
        setErrorMessage(error.message);
      }
    } catch (err) {
      console.error(err);
      setErrorMessage("Payment or form data saving failed");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card className="p-6 space-y-4">
        <h2 className="text-xl font-semibold">Order your gift card</h2>

        <div className="grid grid-cols-2 gap-3">
          <Input
            aria-label="Your name"
            placeholder="From Name"
            onChange={(e) =>
              setFormData({ ...formData, fromName: e.target.value })
            }
          />
          <Input
            aria-label="Your email"
            type="email"
            placeholder="From Email"
            onChange={(e) =>
              setFormData({ ...formData, fromEmail: e.target.value })
            }
          />
          <Input
            aria-label="Note to include with the gift card"
            className="col-span-2"
            placeholder="Note"
            onChange={(e) => setFormData({ ...formData, note: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            aria-label="Recipient's name"
            placeholder="To Name"
            onChange={(e) =>
              setFormData({ ...formData, toName: e.target.value })
            }
          />
          <Input
            aria-label="Recipient's email"
            type="email"
            placeholder="To Email"
            onChange={(e) =>
              setFormData({ ...formData, toEmail: e.target.value })
            }
          />
        </div>

        <PaymentElement />
        <LinkAuthenticationElement onChange={(e) => setEmail(e.value.email)} />

        <Button
          type="submit"
          className="w-full bg-black text-brand hover:bg-black/90"
        >
          {isLoading
            ? "Processing..."
            : `Pay ${formatCurrency(priceInCents / 100)}`}
        </Button>

        {errorMessage && <p className="text-red-500">{errorMessage}</p>}
      </Card>
    </form>
  );
}
