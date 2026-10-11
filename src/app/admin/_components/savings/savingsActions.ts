"use server";
import { revalidatePath } from "next/cache";
import { assertWritable } from "@/lib/previewGuard";
import { getCurrentAdmin } from "@/lib/getCurrentAdmin";
import { setCommissionPct, setReportUnsubscribed } from "@/lib/reports/savingsData";
import { sendMonthlyReport } from "@/lib/reports/sendReport";
import { previousMonth } from "@/lib/reports/savings";
import { SITE_CONFIG } from "@/lib/siteConfig";

type R = { ok: true; message?: string } | { ok: false; error: string };

export async function saveCommissionPct(pct: number): Promise<R> {
  try {
    await assertWritable();
    if (!Number.isFinite(pct) || pct < 0 || pct > 60) return { ok: false, error: "Enter a % between 0 and 60." };
    await setCommissionPct(pct);
    revalidatePath("/admin");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

/** "Send me a test report": last month's report, ONLY to the signed-in admin. */
export async function sendTestReport(): Promise<R> {
  try {
    await assertWritable();
    const admin = await getCurrentAdmin();
    if (!admin?.email) return { ok: false, error: "Sign in again." };
    const { year, month0 } = previousMonth(new Date(), SITE_CONFIG.timezone);
    await sendMonthlyReport(admin.email, year, month0, { test: true });
    return { ok: true, message: `Sent to ${admin.email}` };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function setMonthlyEmail(on: boolean): Promise<R> {
  try {
    await assertWritable();
    await setReportUnsubscribed(!on);
    revalidatePath("/admin");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
