import { NextResponse } from "next/server";
import { isJobRequest } from "@/lib/jobAuth";
import { isEnabled } from "@/lib/flags";
import { applyMenuImport } from "@/lib/pos/menuImport";

export const dynamic = "force-dynamic";

// Called by n8n (e.g. every 30 min in opening hours): pulls prices and
// sold-out status from the POS for items already on the site. Never creates
// or deletes items. Off unless flag "pos_menu_sync" is on.
async function handle(req: Request) {
  if (!isJobRequest(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await isEnabled("pos_menu_sync"))) return NextResponse.json({ skipped: "pos_menu_sync off" });
  try {
    return NextResponse.json(await applyMenuImport({ createNew: false }));
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
export const GET = handle;
export const POST = handle;
