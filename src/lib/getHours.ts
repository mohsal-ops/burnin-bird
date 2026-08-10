import db from "@/db/db";
import { SITE_CONFIG } from "@/lib/siteConfig";

// Derived from the single source of truth (siteConfig.hours) so seeded hours
// always match the brand's real hours. Array order is Sunday → Saturday.
export const DEFAULT_HOURS = SITE_CONFIG.hours.map((h, i) => ({
  day: h.day,
  dayIndex: i,
  open: h.open,
  close: h.close,
}));

// Falls back to seeding the table from DEFAULT_HOURS if it's ever empty
// (fresh DB, or the seed script was never run) instead of returning nothing.
// Also resilient if the DB is unreachable/timing out (or the table doesn't
// exist yet) - returns defaults so the root layout doesn't 500 the whole app.
export async function getBusinessHours() {
  try {
    const hours = await db.businessHours.findMany({ orderBy: { dayIndex: "asc" } });
    if (hours.length > 0) return hours;

    await Promise.all(
      DEFAULT_HOURS.map((h) =>
        db.businessHours.upsert({ where: { dayIndex: h.dayIndex }, update: h, create: h }),
      ),
    );
    return await db.businessHours.findMany({ orderBy: { dayIndex: "asc" } });
  } catch {
    return DEFAULT_HOURS.map((h, i) => ({ id: `default-${i}`, updatedAt: new Date(), ...h }));
  }
}

export function formatHour(hour: number): string {
  const period = hour >= 12 ? "PM" : "AM";
  const display = hour % 12 === 0 ? 12 : hour % 12;
  return `${display}:00 ${period}`;
}

export function getOpenStatus(
  hours: { dayIndex: number; open: number | null; close: number | null }[],
) {
  const now = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Chicago" }));
  const day = now.getDay();
  const hour = now.getHours() + now.getMinutes() / 60;
  const today = hours.find((h) => h.dayIndex === day);

  if (!today?.open || !today?.close) return { isOpen: false, label: "Closed today", next: "" };
  if (hour >= today.open && hour < today.close) {
    return { isOpen: true, label: "Open now", next: `Closes at ${formatHour(today.close)}` };
  }
  return { isOpen: false, label: "Currently closed", next: `Opens at ${formatHour(today.open)}` };
}
