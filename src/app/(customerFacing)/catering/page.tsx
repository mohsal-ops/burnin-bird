import CateringPageClient from "./_components/CateringPageClient";
import { buildMetadata } from "@/lib/seo";
import { getLogoUrl } from "@/lib/siteSettings";
import { getSiteImage } from "@/lib/getSiteImages";

export const metadata = buildMetadata("catering");

export const dynamic = "force-dynamic";

export default async function Page() {
  const logoUrl = await getLogoUrl();
  const cateringImage = await getSiteImage("catering_hero");
  return <CateringPageClient logoUrl={logoUrl} cateringImage={cateringImage} />;
}
