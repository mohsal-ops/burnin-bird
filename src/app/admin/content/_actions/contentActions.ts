"use server";

import db from "@/db/db";
import { revalidatePath } from "next/cache";

const KEYS = [
  "home_headline",
  "home_subheadline",
  "text_feature1_title",
  "text_feature1_desc",
  "text_feature2_title",
  "text_feature2_desc",
] as const;

export async function updateSiteText(values: Record<string, string>) {
  try {
    await Promise.all(
      KEYS.filter((k) => k in values).map((k) =>
        db.siteSetting.upsert({
          where: { key: k },
          update: { value: values[k] ?? "" },
          create: { key: k, value: values[k] ?? "" },
        }),
      ),
    );
    // revalidate the whole layout so the new text reaches every page
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (error) {
    console.error("updateSiteText error:", error);
    return { error: "Couldn't save the text. Try again." };
  }
}
