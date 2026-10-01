import GiftCardPageClient from "./_components/GiftCardPageClient";
import { buildMetadata } from "@/lib/seo";
import { getLogoUrl } from "@/lib/siteSettings";
import { getStripeConfig } from "@/lib/stripeConfig";

export const metadata = buildMetadata("giftCard");

export default async function Page() {
  const [logoUrl, stripe] = await Promise.all([getLogoUrl(), getStripeConfig()]);
  return <GiftCardPageClient logoUrl={logoUrl} publishableKey={stripe.publishableKey} />;
}
