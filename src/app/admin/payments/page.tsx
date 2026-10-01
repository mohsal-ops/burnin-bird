import { getStripeConfig } from "@/lib/stripeConfig";
import { PaymentsForm } from "./_components/PaymentsForm";
import PageHeader from "../_components/pageHeader";

export const dynamic = "force-dynamic";

export default async function PaymentsPage() {
  const cfg = await getStripeConfig();
  // Only safe-to-show facts go to the browser - never the keys themselves.
  const status = {
    source: cfg.source,
    mode: cfg.mode,
    accountName: cfg.accountName,
    webhookUrl: cfg.webhookUrl,
    connectedAt: cfg.connectedAt,
    publishableTail: cfg.publishableKey ? cfg.publishableKey.slice(-4) : "",
  };
  return (
    <div className="lg:flex justify-center">
      <div className="w-full lg:w-[80%] p-4 md:p-6 space-y-5">
        <div>
          <PageHeader>Payments</PageHeader>
          <p className="mt-1 max-w-2xl text-sm text-stone-500">
            Card payments go <span className="font-medium text-stone-700">straight to your own Stripe account</span> and
            then to your bank. No commission - only Stripe&apos;s normal card fee.
          </p>
        </div>
        <PaymentsForm status={status} />
      </div>
    </div>
  );
}
