import { NextResponse } from "next/server";
import { isJobRequest } from "@/lib/jobAuth";
import { retryDuePosOrders } from "@/lib/pos/pipeline";

export const dynamic = "force-dynamic";

// Called by n8n every ~5 minutes: retries POS pushes whose backoff is due.
// Cheap when idle (one indexed query). Auth: STARVEGA_JOBS_SECRET.
async function handle(req: Request) {
  if (!isJobRequest(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json(await retryDuePosOrders());
}
export const GET = handle;
export const POST = handle;
