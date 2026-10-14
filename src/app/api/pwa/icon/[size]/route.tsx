import { ImageResponse } from "next/og";
import { getLogoUrl, getThemeColor } from "@/lib/siteSettings";
import { SITE_CONFIG } from "@/lib/siteConfig";

// App icon for the PWA manifest / iOS home screen: the restaurant's own logo
// centred on its brand colour, generated on the fly. The logo is the one the
// builder puts in every site at build time (public/logo.png, always there);
// the dashboard Branding logo is only a fallback.
export const revalidate = 86400;

export async function GET(req: Request, { params }: { params: Promise<{ size: string }> }) {
  const { size: raw } = await params;
  const size = raw === "512" ? 512 : raw === "180" ? 180 : 192;
  const maskable = new URL(req.url).searchParams.get("maskable") === "1";
  const builderLogo = new URL("/logo.png", req.url).toString();
  const [hasBuilderLogo, dashLogo, color] = await Promise.all([
    fetch(builderLogo, { method: "HEAD" }).then((r) => r.ok).catch(() => false),
    getLogoUrl().catch(() => ""),
    getThemeColor().catch(() => "#111111"),
  ]);
  const abs = hasBuilderLogo ? builderLogo : dashLogo ? new URL(dashLogo, SITE_CONFIG.siteUrl).toString() : "";
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
    { width: size, height: size },
  );
}
