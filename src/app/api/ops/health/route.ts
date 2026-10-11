import { NextResponse } from "next/server";
import { isJobRequest } from "@/lib/jobAuth";
import { isEnabled } from "@/lib/flags";
import { gatherHealth } from "@/lib/ops/health";
import { summarise } from "@/lib/ops/checks";
import { sendMail } from "@/lib/email";
import { SITE_CONFIG } from "@/lib/siteConfig";

export const dynamic = "force-dynamic";

// Daily self-check (n8n, ?key=STARVEGA_JOBS_SECRET). Always returns the JSON
// so a central n8n flow can build one digest across all sites. With
// &notify=1 and flag "ops_health" on, it also emails the agency — only when
// something is wrong (no "all good" spam). Never includes secrets.
async function handle(req: Request) {
  if (!isJobRequest(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const checks = await gatherHealth({ pingSite: true });
  const { status, problems } = summarise(checks);

  const notify = new URL(req.url).searchParams.get("notify") === "1";
  const to = process.env.OPS_ALERT_EMAIL || process.env.AGENCY_ALERT_EMAIL;
  if (notify && to && problems.length && (await isEnabled("ops_health"))) {
    await sendMail({
      to,
      // One-line digest per site: status + the problem names in the subject.
      subject: `[${status.toUpperCase()}] ${SITE_CONFIG.name}: ${problems.map((p) => p.label).join(", ")}`.slice(0, 200),
      html: `<div style="font-family:system-ui,sans-serif;font-size:14px"><p><b>${SITE_CONFIG.name}</b> — ${SITE_CONFIG.siteUrl}/admin/health</p><ul>${problems
        .map((p) => `<li><b>${p.label}</b> (${p.status}): ${p.detail.replace(/</g, "&lt;")}</li>`)
        .join("")}</ul></div>`,
    }).catch((e) => console.error("health digest email failed:", (e as Error).message));
  }
  return NextResponse.json({ site: SITE_CONFIG.siteUrl, status, checks });
}
export const GET = handle;
export const POST = handle;
