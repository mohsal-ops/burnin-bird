"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { updateBusinessHours } from "../_actions/hoursActions";

type HourRow = { dayIndex: number; day: string; open: number | null; close: number | null };

// Small pure helper duplicated locally (rather than imported from src/lib/getHours.ts)
// so this client component doesn't pull the Prisma client into the browser bundle.
function formatHour(hour: number): string {
  const period = hour >= 12 ? "PM" : "AM";
  const display = hour % 12 === 0 ? 12 : hour % 12;
  return `${display}:00 ${period}`;
}

const HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) => i); // 12 AM - 11 PM
const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export default function HoursEditor({ hours }: { hours: HourRow[] }) {
  // Always render all 7 weekdays, filling in any the DB is missing as "closed",
  // so every day is editable (toggle open/closed) - no add/remove needed.
  const [rows, setRows] = useState<HourRow[]>(() => {
    const byIndex = new Map(hours.map((h) => [h.dayIndex, h]));
    return DAY_NAMES.map(
      (day, i) =>
        byIndex.get(i) ?? { dayIndex: i, day, open: null, close: null },
    );
  });
  const [isPending, startTransition] = useTransition();

  const toggleDay = (dayIndex: number, isOpenNow: boolean) => {
    setRows((prev) =>
      prev.map((r) =>
        r.dayIndex === dayIndex
          ? {
              ...r,
              open: isOpenNow ? (r.open ?? 11) : null,
              close: isOpenNow ? (r.close ?? 21) : null,
            }
          : r,
      ),
    );
  };

  const setOpenHour = (dayIndex: number, value: number) => {
    setRows((prev) => prev.map((r) => (r.dayIndex === dayIndex ? { ...r, open: value } : r)));
  };

  const setCloseHour = (dayIndex: number, value: number) => {
    setRows((prev) => prev.map((r) => (r.dayIndex === dayIndex ? { ...r, close: value } : r)));
  };

  const handleSave = () => {
    startTransition(async () => {
      try {
        await updateBusinessHours(
          rows.map((r) => ({ dayIndex: r.dayIndex, open: r.open, close: r.close })),
        );
        toast.success("Hours updated");
      } catch (error) {
        console.error(error);
        toast.error("Failed to update hours");
      }
    });
  };

  return (
    <div className="space-y-4 max-w-2xl px-4 md:px-0">
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm divide-y divide-stone-100">
        {rows.map((row) => {
          const dayIsOpen = row.open !== null && row.close !== null;
          return (
            <div
              key={row.dayIndex}
              className="flex flex-col sm:flex-row sm:items-center gap-3 p-4"
            >
              <div className="flex items-center gap-3 sm:w-36 shrink-0">
                <Switch
                  checked={dayIsOpen}
                  onCheckedChange={(v) => toggleDay(row.dayIndex, v)}
                />
                <span className="font-medium text-stone-800">{row.day}</span>
              </div>

              {dayIsOpen ? (
                <div className="flex items-center gap-2 flex-1 flex-wrap">
                  <Select
                    value={String(row.open)}
                    onValueChange={(v) => setOpenHour(row.dayIndex, Number(v))}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {HOUR_OPTIONS.map((h) => (
                        <SelectItem key={h} value={String(h)}>
                          {formatHour(h)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <span className="text-stone-400 text-sm">to</span>
                  <Select
                    value={String(row.close)}
                    onValueChange={(v) => setCloseHour(row.dayIndex, Number(v))}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {HOUR_OPTIONS.map((h) => (
                        <SelectItem key={h} value={String(h)}>
                          {formatHour(h)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <span className="text-sm text-stone-400 flex-1">Closed</span>
              )}
            </div>
          );
        })}
      </div>

      <Button
        variant="mainButton"
        disabled={isPending}
        onClick={handleSave}
        className="w-full sm:w-auto"
      >
        {isPending ? "Saving..." : "Save All"}
      </Button>
    </div>
  );
}
