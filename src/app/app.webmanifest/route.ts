import { NextResponse } from "next/server";
import { getIconVersion, iconUrl } from "@/lib/pwa/iconUrl";
import { isEnabled } from "@/lib/flags";
import { SITE_CONFIG } from "@/lib/siteConfig";
import { getThemeColor } from "@/lib/siteSettings";

// Web app manifest (flag "pwa"). 404 while off, so nothing about the site
// changes until the flag is turned on. Linked from <PwaBoot> only when on.
export const revalidate = 300;

export async function GET() {
  if (!(await isEnabled("pwa"))) return new NextResponse("Not found", { status: 404 });
  const color = await getThemeColor().catch(() => "#111111");
  const v = await getIconVersion();
  const name = SITE_CONFIG.name;
  return NextResponse.json(
    {
      name,
      short_name: name.length > 12 ? name.split(/\s+/)[0].slice(0, 12) : name,
      description: SITE_CONFIG.seoDescription,
      start_url: "/?source=app",
      scope: "/",
      display: "standalone",
      background_color: "#ffffff",
      theme_color: color,
      icons: [
        { src: iconUrl(192, { v }), sizes: "192x192", type: "image/png", purpose: "any" },
        { src: iconUrl(512, { v }), sizes: "512x512", type: "image/png", purpose: "any" },
        { src: iconUrl(512, { maskable: true, v }), sizes: "512x512", type: "image/png", purpose: "maskable" },
      ],
      shortcuts: [{ name: "Order now", url: "/Menu?source=app" }],
    },
    { headers: { "Content-Type": "application/manifest+json" } },
  );
}
