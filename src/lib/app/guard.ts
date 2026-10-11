import "server-only";
import { NextResponse } from "next/server";
import { isEnabled } from "@/lib/flags";

// Every /api/app/* route: 404 unless this restaurant bought the native app
// (flag "native_app"). CORS isn't needed: native apps don't send an Origin.
export async function appApiOff(): Promise<NextResponse | null> {
  return (await isEnabled("native_app")) ? null : NextResponse.json({ error: "Not found" }, { status: 404 });
}
