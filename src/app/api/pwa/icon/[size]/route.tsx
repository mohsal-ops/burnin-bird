import { ImageResponse } from "next/og";
import { getLogoUrl, getSetting, getThemeColor } from "@/lib/siteSettings";
import { SITE_CONFIG } from "@/lib/siteConfig";

// App icon for the PWA manifest / iOS home screen: the restaurant's own logo
// centred on its brand colour, generated on the fly. The logo is the one the
// builder puts in every site at build time (public/logo.png, always there);
// the dashboard Branding logo is only a fallback.
// Rendered per request; the CDN caches each versioned URL for an hour (see headers).
export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: Promise<{ size: string }> }) {
  const { size: raw } = await params;
  const size = raw === "512" ? 512 : raw === "180" ? 180 : 192;
  const maskable = new URL(req.url).searchParams.get("maskable") === "1";
  // Order: the app icon the owner uploaded (Admin → App & alerts), then the
  // builder logo every site has, then the dashboard logo, then a letter.
  const builderLogo = new URL("/logo.png", req.url).toString();
  const [appIcon, hasBuilderLogo, dashLogo, color] = await Promise.all([
    getSetting("app_icon_url", "").catch(() => ""),
    fetch(builderLogo, { method: "HEAD" }).then((r) => r.ok).catch(() => false),
    getLogoUrl().catch(() => ""),
    getThemeColor().catch(() => "#111111"),
  ]);
  const abs = appIcon
    ? new URL(appIcon, req.url).toString()
    : hasBuilderLogo
      ? builderLogo
      : dashLogo
        ? new URL(dashLogo, SITE_CONFIG.siteUrl).toString()
        : "";
  // The logo fills the whole icon (no brand-colour frame around it). The brand
  // colour only shows through transparent parts of a logo. Android's maskable
  // version trims the corners itself.
  const inner = size;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: color,
          borderRadius: maskable ? 0 : size * 0.18,
        }}
      >
        {abs ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={abs} width={inner} height={inner} style={{ objectFit: "cover", borderRadius: maskable ? 0 : size * 0.18 }} alt="" />
        ) : (
          <div style={{ fontSize: size * 0.5, color: "#fff", fontWeight: 800 }}>{SITE_CONFIG.name.slice(0, 1)}</div>
        )}
      </div>
    ),
    {
      width: size,
      height: size,
      // Not "immutable for a year" (ImageResponse's default): a logo change
      // must reach phones. URLs are versioned per deploy too (lib/pwa/iconUrl).
      headers: { "Cache-Control": "public, max-age=3600, s-maxage=3600" },
    },
  );
}
