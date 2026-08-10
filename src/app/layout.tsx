import type { Metadata } from "next";
import { CartProvider } from "./providers/CartProvider";
import { GoogleAnalytics } from "@next/third-parties/google";
import { SITE_CONFIG } from "@/lib/siteConfig";
import { getBusinessHours } from "@/lib/getHours";
import { getThemeColor, DEFAULT_THEME_COLOR } from "@/lib/siteSettings";
import { readableTextColor } from "@/lib/color";
import "./globals.css";

export const metadata: Metadata = {
  // ── TITLE ────────────────────────────────────────────────────────────────
  title: {
    default: SITE_CONFIG.seoTitle,
    template: `%s | ${SITE_CONFIG.name} ${SITE_CONFIG.city}`,
  },

  // ── DESCRIPTION ──────────────────────────────────────────────────────────
  description: SITE_CONFIG.seoDescription,

  // ── KEYWORDS ─────────────────────────────────────────────────────────────
  keywords: SITE_CONFIG.seoKeywords,

  // ── CANONICAL URL ────────────────────────────────────────────────────────
  metadataBase: new URL(SITE_CONFIG.siteUrl),
  alternates: {
    canonical: "/",
  },

  // ── FAVICON ──────────────────────────────────────────────────────────────
  // Set here (root layout) so every route gets it - a page-level metadata
  // export only applies to that one route, not its siblings.
  icons: {
    icon: "/logo.png",
  },

  // ── OPEN GRAPH (Facebook, WhatsApp, iMessage previews) ───────────────────
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_CONFIG.siteUrl,
    siteName: SITE_CONFIG.name,
    title: SITE_CONFIG.seoTitle,
    description: SITE_CONFIG.seoDescription,
    images: [
      {
        url: SITE_CONFIG.ogImage,
        width: 1200,
        height: 630,
        alt: `${SITE_CONFIG.name} in ${SITE_CONFIG.city}, ${SITE_CONFIG.state}`,
      },
    ],
  },

  // ── TWITTER / X CARD ─────────────────────────────────────────────────────
  twitter: {
    card: "summary_large_image",
    title: SITE_CONFIG.seoTitle,
    description: SITE_CONFIG.seoDescription,
    images: [SITE_CONFIG.ogImage],
  },

  // ── ROBOTS ───────────────────────────────────────────────────────────────
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  // ── VERIFICATION ─────────────────────────────────────────────────────────
  // Paste your Google Search Console verification code here once you set it up
  // verification: {
  //   google: "paste-your-verification-code-here",
  // },
};

function openingHoursSpecification(hours: { day: string; open: number | null; close: number | null }[]) {
  return hours
    .filter((h) => h.open !== null && h.close !== null)
    .map((h) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: h.day,
      opens: `${String(h.open).padStart(2, "0")}:00`,
      closes: `${String(h.close).padStart(2, "0")}:00`,
    }));
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const businessHours = await getBusinessHours();
  const rawColor = await getThemeColor();
  // Only allow a hex color to reach the injected <style> (no CSS injection).
  const themeColor = /^#[0-9a-fA-F]{3,8}$/.test(rawColor)
    ? rawColor
    : DEFAULT_THEME_COLOR;
  const brandForeground = readableTextColor(themeColor);
  return (
    <html lang="en">
      <head>
        <style
          dangerouslySetInnerHTML={{
            __html: `:root{--brand:${themeColor};--brand-foreground:${brandForeground}}`,
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Restaurant",
              name: SITE_CONFIG.name,
              description: SITE_CONFIG.seoDescription,
              url: SITE_CONFIG.siteUrl,
              telephone: SITE_CONFIG.phone,
              email: SITE_CONFIG.email,
              image: `${SITE_CONFIG.siteUrl}${SITE_CONFIG.ogImage}`,
              logo: `${SITE_CONFIG.siteUrl}/logo.png`,
              priceRange: SITE_CONFIG.priceRange,
              servesCuisine: SITE_CONFIG.cuisines,
              address: {
                "@type": "PostalAddress",
                streetAddress: SITE_CONFIG.street,
                addressLocality: SITE_CONFIG.city,
                addressRegion: SITE_CONFIG.state,
                postalCode: SITE_CONFIG.zip,
                addressCountry: "US",
              },
              geo: {
                "@type": "GeoCoordinates",
                latitude: SITE_CONFIG.lat,
                longitude: SITE_CONFIG.lng,
              },
              openingHoursSpecification: openingHoursSpecification(businessHours),
              sameAs: [
                SITE_CONFIG.instagramUrl,
                SITE_CONFIG.facebookUrl,
                SITE_CONFIG.tiktokUrl,
              ],
            }),
          }}
        />
      </head>
      <body>
        <a href="#main-content" className="skip-to-content">
          Skip to main content
        </a>
        <CartProvider>{children}</CartProvider>
        {process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID && (
          <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID} />
        )}
      </body>
    </html>
  );
}
