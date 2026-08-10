import GiftCardPageClient from "./_components/GiftCardPageClient";
import { buildMetadata } from "@/lib/seo";
import { getLogoUrl } from "@/lib/siteSettings";

export const metadata = buildMetadata("giftCard");

export default async function Page() {
  const logoUrl = await getLogoUrl();
  return <GiftCardPageClient logoUrl={logoUrl} />;
}
