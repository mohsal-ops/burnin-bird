import PageHeader from "../_components/pageHeader";
import {
  getThemeColor,
  getLogoUrl,
  getHomeText,
} from "@/lib/siteSettings";
import BrandingManager from "./_components/BrandingManager";

export const dynamic = "force-dynamic";

export default async function BrandingPage() {
  const [color, logo, homeText] = await Promise.all([
    getThemeColor(),
    getLogoUrl(),
    getHomeText(),
  ]);

  return (
    <div className="lg:flex justify-center">
      <div className="p-5 space-y-4 w-full lg:w-[85%]">
        <PageHeader>Branding</PageHeader>
        <p className="text-sm text-stone-500 px-4 md:px-0">
          Change your site&apos;s theme color and logo. Changes apply across the
          whole site.
        </p>
        <BrandingManager
          initialColor={color}
          initialLogo={logo}
          initialHeadline={homeText.headline}
          initialSubheadline={homeText.subheadline}
        />
      </div>
    </div>
  );
}
