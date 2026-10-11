import { NextResponse } from "next/server";
import { isEnabled } from "@/lib/flags";
import { getVapidKeys } from "@/lib/push/send";

export const dynamic = "force-dynamic";

// Public VAPID key the browser needs to subscribe. 404 while web push is off.
export async function GET() {
  if (!(await isEnabled("web_push"))) return NextResponse.json({ error: "off" }, { status: 404 });
  const { publicKey } = await getVapidKeys();
  return NextResponse.json({ publicKey });
}
