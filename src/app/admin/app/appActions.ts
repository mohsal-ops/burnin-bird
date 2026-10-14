"use server";
import { revalidatePath } from "next/cache";
import { assertWritable } from "@/lib/previewGuard";
import { setFlag } from "@/lib/flags";
import db from "@/db/db";
import { removeStoredFile, storeFile } from "@/lib/storage";

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

// App icon (the phone home-screen icon), separate from the website and
// dashboard logos. Stored as SiteSetting "app_icon_url"; "app_icon_v" changes on
// every save so icon URLs change and phones fetch the new one.
async function setSetting(key: string, value: string) {
  await db.siteSetting.upsert({ where: { key }, update: { value }, create: { key, value } });
}

export async function updateAppIcon(formData: FormData): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  try {
    await assertWritable();
    const file = formData.get("icon") as File | null;
    if (!file || file.size === 0) return { ok: false, error: "Choose an image first." };
    if (!file.type.startsWith("image/") || file.type === "image/svg+xml") return { ok: false, error: "Use a PNG or JPG image." };
    if (file.size > 5 * 1024 * 1024) return { ok: false, error: "That image is too big (max 5 MB)." };
    let url: string;
    if (process.env.NODE_ENV === "development") {
      const fs = await import("node:fs/promises");
      await fs.mkdir("public/site-images", { recursive: true });
      url = `/site-images/${crypto.randomUUID()}-${file.name.replace(/[^\w.-]/g, "")}`;
      await fs.writeFile(`public${url}`, new Uint8Array(await file.arrayBuffer()));
    } else {
      url = await storeFile("site-images", file);
    }
    const old = await db.siteSetting.findUnique({ where: { key: "app_icon_url" } }).catch(() => null);
    await setSetting("app_icon_url", url);
    await setSetting("app_icon_v", String(Date.now()));
    if (old?.value?.startsWith("https://")) await removeStoredFile(old.value).catch(() => {});
    revalidatePath("/admin/app");
    revalidatePath("/", "layout");
    revalidatePath("/app.webmanifest");
    return { ok: true, url };
  } catch (e) {
    return { ok: false, error: `Couldn't save the icon: ${(e as Error).message}` };
  }
}

export async function removeAppIcon(): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await assertWritable();
    const old = await db.siteSetting.findUnique({ where: { key: "app_icon_url" } }).catch(() => null);
    await setSetting("app_icon_url", "");
    await setSetting("app_icon_v", String(Date.now()));
    if (old?.value?.startsWith("https://")) await removeStoredFile(old.value).catch(() => {});
    revalidatePath("/admin/app");
    revalidatePath("/", "layout");
    revalidatePath("/app.webmanifest");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
