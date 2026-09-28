import PageHeader from "../_components/pageHeader";
import {
  getThemeColor,
  getLogoUrl,
  getHomeText,
} from "@/lib/siteSettings";
import BrandingManager from "./_components/BrandingManager";
import ThemePaletteCard from "./_components/ThemePaletteCard";
import { getSavedThemePalettes } from "@/lib/siteSettings";
import { getActiveTheme } from "@/lib/themes/active";
import { THEMES } from "@/lib/themes/registry";
import { THEME_PALETTES, resolvePalette } from "@/lib/themes/palette";
import { SITE_CONFIG } from "@/lib/siteConfig";

export const dynamic = "force-dynamic";

export default async function BrandingPage() {
  const [color, logo, homeText, theme, savedPalettes] = await Promise.all([
    getThemeColor(),
    getLogoUrl(),
    getHomeText(),
    getActiveTheme(),
    getSavedThemePalettes(),
  ]);
  const { palette } = resolvePalette(theme, savedPalettes);

  return (
    <div className="lg:flex justify-center">
      <div className="p-5 space-y-4 w-full lg:w-[85%]">
        <PageHeader>Branding</PageHeader>
        <p className="text-sm text-stone-500 px-4 md:px-0">
          Change your site&apos;s theme color and logo. Changes apply across the
          whole site.
        </p>
        {THEME_PALETTES[theme] && (
          <div className="px-4 md:px-0">
            <ThemePaletteCard
              key={theme}
              slug={theme}
              label={THEMES[theme].label}
              initial={palette}
              brand={color}
              restaurant={SITE_CONFIG.trademark || SITE_CONFIG.name}
            />
          </div>
        )}
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
