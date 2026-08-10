"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MdKeyboardArrowRight } from "react-icons/md";
import MapClient from "@/components/MapClient";
import HereMapsScripts from "@/components/HereMapsScripts";
import { Location } from "generated/prisma";
import { SITE_CONFIG } from "@/lib/siteConfig";

function formatHour(hour: number): string {
  const period = hour >= 12 ? "PM" : "AM";
  const display = hour % 12 === 0 ? 12 : hour % 12;
  return `${display}:00 ${period}`;
}

type BusinessHourRow = { dayIndex: number; day: string; open: number | null; close: number | null };

export function OurLocation({
  places,
  lat,
  lng,
  hours,
}: {
  places: Location[];
  lat: number;
  lng: number;
  hours: BusinessHourRow[];
}) {
  const [showHours, setShowHours] = useState(false);
  // Fall back to the hours defined in siteConfig when the BusinessHours table
  // is empty (fresh DB / not yet filled in the dashboard), so the section still
  // renders instead of crashing on an undefined day.
  const sourceHours: BusinessHourRow[] = hours.length
    ? hours
    : SITE_CONFIG.hours.map((h, i) => ({ dayIndex: i, day: h.day, open: h.open, close: h.close }));
  const HOURS = [...sourceHours]
    .sort((a, b) => a.dayIndex - b.dayIndex)
    .map((h) => ({
      day: h.day,
      open: h.open === null ? "Closed" : formatHour(h.open),
      close: h.close === null ? "" : formatHour(h.close),
    }));
  const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const todayName = new Date().toLocaleDateString("en-US", { timeZone: SITE_CONFIG.timezone, weekday: "long" });
  const todayIdx = DAY_NAMES.indexOf(todayName);
  const today = HOURS.find((h) => h.day === todayName);
  const todayLabel = !today
    ? "Hours available soon"
    : today.open === "Closed"
      ? "Closed today"
      : `Today: ${today.open} - ${today.close}`;

  const mapsUrl = `${SITE_CONFIG.googleMapsUrl}?entry=ttu`;

  return (
    <div className="flex flex-col sm:flex-row gap-4 p-4 bg-stone-200 rounded-4xl w-[92%] mx-auto sm:w-[75%] font-bold ">
      <HereMapsScripts />
      {/* Map */}
      <div className="sm:w-[45%] w-full h-56 sm:h-auto min-h-50 rounded-3xl overflow-hidden shrink-0">
        <MapClient lat={lat} lng={lng} className="h-full w-full" />
      </div>

      {/* Info panel */}
      <div className="flex flex-col justify-between gap-4 flex-1 py-1">
        {/* Top: name + address */}
        <div className="flex flex-col gap-4">
          <div>
            <p className="text-sm text-gray-500">{SITE_CONFIG.name}</p>
            <p className="text-xl font-semibold text-gray-900">{SITE_CONFIG.city}, {SITE_CONFIG.state}</p>
          </div>

          <div className="flex gap-8 mt-3">
            <div className="flex flex-col gap-1">
              <span className="text-xs text-gray-500">Address</span>
              <p className="text-sm leading-relaxed">
                {SITE_CONFIG.street}
                <br />
                {SITE_CONFIG.city}, {SITE_CONFIG.state} {SITE_CONFIG.zip}
              </p>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs text-gray-500">Contact</span>
              <p className="text-sm leading-relaxed">
                {SITE_CONFIG.phone}
                <br />
                {SITE_CONFIG.email}
              </p>
            </div>
          </div>
        </div>

        {/* Animated hours panel */}
        <div
          className={`overflow-hidden transition-all duration-500 ease-in-out ${
            showHours ? "max-h-80 opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div className="border-t border-gray-300 pt-3">
            <table className="w-full text-sm">
              <tbody>
                {HOURS.map((h, i) => {
                  const isToday = i === todayIdx;
                  const label =
                    h.open === "Closed" ? "Closed" : `${h.open} - ${h.close}`;
                  return (
                    <tr
                      key={h.day}
                      className={`border-b border-gray-200 last:border-0 transition-all duration-300 ${
                        showHours
                          ? "opacity-100 translate-y-0"
                          : "opacity-0 translate-y-2"
                      }`}
                      style={{
                        transitionDelay: showHours ? `${i * 45}ms` : "0ms",
                      }}
                    >
                      <td
                        className={`py-1.5 w-28 ${
                          isToday
                            ? "font-semibold text-gray-900"
                            : "text-gray-500"
                        }`}
                      >
                        {h.day}
                      </td>
                      <td
                        className={`py-1.5 ${
                          isToday
                            ? "font-semibold text-gray-900"
                            : "text-gray-700"
                        }`}
                      >
                        {label}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-gray-300 pt-3 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
            {todayLabel}
          </p>

          <div className="flex items-center gap-2 flex-wrap">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowHours((v) => !v)}
            >
              {showHours ? "See info" : "See hours"}
            </Button>

            <a href={mapsUrl} target="_blank" rel="noopener noreferrer">
              <Button size="sm" variant="outline">
                Get directions
              </Button>
            </a>

            <Link href="/catering">
              <Button size="sm" variant="mainButton">
                Catering
                <MdKeyboardArrowRight />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
