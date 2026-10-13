import CateringPageClient from "./_components/CateringPageClient";
import { buildMetadata } from "@/lib/seo";
import { getLogoUrl } from "@/lib/siteSettings";
import { getSiteImage } from "@/lib/getSiteImages";

export const metadata = buildMetadata("catering");

// Cached (ISR): owner changes refresh it via revalidatePath; a fresh render on
// every visit was slow and burned the CPU limit.
export const revalidate = 300;

export default async function Page() {
  const logoUrl = await getLogoUrl();
  const cateringImage = await getSiteImage("catering_hero");
  return <CateringPageClient logoUrl={logoUrl} cateringImage={cateringImage} />;
}
