"use server";
import { assertWritable } from "@/lib/previewGuard";
import db from "@/db/db";
import { revalidatePath } from "next/cache";

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export async function updateBusinessHours(
  hours: { dayIndex: number; open: number | null; close: number | null }[],
) {
  await assertWritable();
  for (const h of hours) {
    // upsert so a day that doesn't exist yet is created instead of throwing
    await db.businessHours.upsert({
      where: { dayIndex: h.dayIndex },
      update: { open: h.open, close: h.close },
      create: {
        dayIndex: h.dayIndex,
        day: DAY_NAMES[h.dayIndex] ?? `Day ${h.dayIndex}`,
        open: h.open,
        close: h.close,
      },
    });
  }
  revalidatePath("/");
  revalidatePath("/Menu");
  revalidatePath("/admin");
  revalidatePath("/admin/hours");
  return { ok: true };
}
