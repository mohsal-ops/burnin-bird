"use server";
import { revalidatePath } from "next/cache";
import { assertWritable } from "@/lib/previewGuard";
import { setFlag } from "@/lib/flags";

export async function setAppFeature(flag: "pwa" | "web_push" | "native_app" | "customer_accounts", on: boolean): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await assertWritable();
    if (flag !== "pwa" && flag !== "web_push" && flag !== "native_app" && flag !== "customer_accounts") return { ok: false, error: "Unknown setting" };
    await setFlag(flag, on);
    revalidatePath("/admin/app");
    revalidatePath("/", "layout"); // public layout reads the pwa flag (ISR)
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

/** "Send test alert": pushes a test notification to every owner device. */
export async function sendTestOwnerAlert(): Promise<{ ok: true; sent: number } | { ok: false; error: string }> {
  try {
    await assertWritable();
    const { pushToOwners } = await import("@/lib/push/send");
    const sent = await pushToOwners({
      title: "Test alert 🔔",
      body: "Phone alerts work. New orders will show up like this.",
      url: "/admin/orders",
      tag: "sv-test",
    });
    return { ok: true, sent };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
