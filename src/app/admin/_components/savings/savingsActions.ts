"use server";
import { revalidatePath } from "next/cache";
import { assertWritable } from "@/lib/previewGuard";
import { setCommissionPct } from "@/lib/reports/savingsData";

export async function saveCommissionPct(pct: number): Promise<{ ok: true } | { ok: false; error: string }> {
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
