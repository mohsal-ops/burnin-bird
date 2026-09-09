import { NextRequest, NextResponse } from "next/server";
import db from "@/db/db";
import { emailUnsubToken } from "@/lib/loyalty";
import { SITE_CONFIG } from "@/lib/siteConfig";

// One-click CAN-SPAM email unsubscribe. The link in every marketing email's
// footer points here with the contact id + a signed token. GET (so the link
// works straight from an inbox) flips emailSubscribed=false and shows a plain
// confirmation page. SMS consent is untouched - the two are separate.
export const runtime = "nodejs";

function page(title: string, body: string): NextResponse {
  return new NextResponse(
    `<!doctype html><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>` +
      `<title>${title}</title>` +
      `<div style="font-family:system-ui,Segoe UI,Arial,sans-serif;max-width:520px;margin:12vh auto;padding:0 20px;text-align:center;color:#1c1917">` +
      `<h1 style="font-size:20px">${title}</h1><p style="color:#57534e;line-height:1.6">${body}</p>` +
      `<p style="margin-top:24px"><a href="${SITE_CONFIG.siteUrl}" style="color:#c85a1e">Back to ${SITE_CONFIG.name}</a></p></div>`,
    { headers: { "content-type": "text/html; charset=utf-8" } },
  );
}

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("c") || "";
  const token = req.nextUrl.searchParams.get("t") || "";
  if (!id || !token || token !== emailUnsubToken(id)) {
    return page("Invalid link", "This unsubscribe link is invalid or has expired.");
  }
  try {
    await db.loyaltyContact.updateMany({
      where: { id },
      data: { emailSubscribed: false, unsubscribedAt: new Date() },
    });
  } catch (e) {
    console.error("email unsubscribe failed:", (e as Error).message);
  }
  return page(
    "You're unsubscribed",
    `You won't receive marketing emails from ${SITE_CONFIG.name} anymore. You can rejoin anytime from our rewards page.`,
  );
}
