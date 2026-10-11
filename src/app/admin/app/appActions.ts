"use server";
import { revalidatePath } from "next/cache";
import { assertWritable } from "@/lib/previewGuard";
import { setFlag } from "@/lib/flags";

export async function setAppFeature(flag: "pwa" | "web_push" | "native_app", on: boolean): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await assertWritable();
    if (flag !== "pwa" && flag !== "web_push" && flag !== "native_app") return { ok: false, error: "Unknown setting" };
    await setFlag(flag, on);
    revalidatePath("/admin/app");
    revalidatePath("/", "layout"); // public layout reads the pwa flag (ISR)
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
