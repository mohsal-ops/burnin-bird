import { ImageResponse } from "next/og";
import { getLogoUrl, getThemeColor } from "@/lib/siteSettings";
import { SITE_CONFIG } from "@/lib/siteConfig";

// App icon for the PWA manifest / iOS home screen: the restaurant's own logo
// centred on its brand colour, generated on the fly (no per-client assets).
export const revalidate = 86400;

export async function GET(req: Request, { params }: { params: Promise<{ size: string }> }) {
  const { size: raw } = await params;
  const size = raw === "512" ? 512 : raw === "180" ? 180 : 192;
  const maskable = new URL(req.url).searchParams.get("maskable") === "1";
  const [logo, color] = await Promise.all([getLogoUrl().catch(() => ""), getThemeColor().catch(() => "#111111")]);
  const abs = logo ? new URL(logo, SITE_CONFIG.siteUrl).toString() : "";
  // Maskable icons get cropped to a circle by Android: keep the logo inside the safe zone.
  const inner = Math.round(size * (maskable ? 0.6 : 0.78));

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
          <img src={abs} width={inner} height={inner} style={{ objectFit: "contain" }} alt="" />
        ) : (
          <div style={{ fontSize: size * 0.5, color: "#fff", fontWeight: 800 }}>{SITE_CONFIG.name.slice(0, 1)}</div>
        )}
      </div>
    ),
    { width: size, height: size },
  );
}
