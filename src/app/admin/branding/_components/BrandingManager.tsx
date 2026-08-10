"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  updateThemeColor,
  updateLogo,
  updateHomeText,
} from "../_actions/brandingActions";
import { readableTextColor } from "@/lib/color";
import { ExternalLink } from "lucide-react";
import SlotDiagram from "@/app/admin/images/_components/SlotDiagram";

const PRESETS = [
  "#facc15",
  "#c85a1e",
  "#e11d48",
  "#db2777",
  "#7c3aed",
  "#2563eb",
  "#0891b2",
  "#1a6b3c",
];

export default function BrandingManager({
  initialColor,
  initialLogo,
  initialHeadline,
  initialSubheadline,
}: {
  initialColor: string;
  initialLogo: string;
  initialHeadline: string;
  initialSubheadline: string;
}) {
  const [headline, setHeadline] = useState(initialHeadline);
  const [subheadline, setSubheadline] = useState(initialSubheadline);
  const [savingText, startText] = useTransition();

  const saveText = () =>
    startText(async () => {
      const res = await updateHomeText(headline, subheadline);
      if (res.ok) toast.success("Home text updated");
      else toast.error(res.error ?? "Failed to save");
    });
  const [color, setColor] = useState(initialColor);
  const [savingColor, startColor] = useTransition();

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [savingLogo, startLogo] = useTransition();
  const logoRef = useRef<HTMLInputElement>(null);

  const saveColor = () =>
    startColor(async () => {
      const res = await updateThemeColor(color);
      if (res.ok) toast.success("Theme color updated");
      else toast.error(res.error ?? "Failed to save");
    });

  const saveLogo = () => {
    if (!logoFile) return;
    const fd = new FormData();
    fd.set("logo", logoFile);
    startLogo(async () => {
      const res = await updateLogo(fd);
      if (res.ok) {
        toast.success("Logo updated");
        setLogoFile(null);
        setLogoPreview(null);
        if (logoRef.current) logoRef.current.value = "";
      } else {
        toast.error(res.error ?? "Failed to save");
      }
    });
  };

  return (
    <div className="space-y-6 px-4 md:px-0">
      {/* HOME HEADLINE */}
      <div className="space-y-4 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <div>
          <h2 className="font-semibold text-stone-800">Home headline</h2>
          <p className="text-sm text-stone-500">
            The big headline and subtitle shown on your home page. Leave blank
            to use the built-in text.
          </p>
        </div>
        <div className="flex gap-3 rounded-xl border border-stone-200 bg-stone-50 p-3">
          <div className="w-[42%] max-w-[150px] shrink-0 self-start">
            <SlotDiagram
              blocks={[
                { k: "nav" },
                { k: "split", side: "left", active: true },
                { k: "text" },
              ]}
            />
          </div>
          <div className="flex min-w-0 flex-col justify-center gap-1">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-stone-400">
              Where it appears
            </p>
            <p className="text-xs leading-snug text-stone-600">
              The large headline at the very top of your home page, over the
              hero.
            </p>
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-medium text-[#c85a1e] hover:underline"
            >
              View Home page
              <ExternalLink size={12} />
            </a>
          </div>
        </div>
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-stone-600">
              Headline
            </label>
            <input
              type="text"
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              placeholder="e.g. Eagle Pass' viral Texas BBQ"
              className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-stone-300"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-stone-600">
              Subheadline
            </label>
            <input
              type="text"
              value={subheadline}
              onChange={(e) => setSubheadline(e.target.value)}
              placeholder="e.g. brisket, ribs & sausage smoked daily"
              className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-stone-300"
            />
          </div>
        </div>
        <Button variant="mainButton" disabled={savingText} onClick={saveText}>
          {savingText ? "Saving..." : "Save text"}
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* THEME COLOR */}
      <div className="space-y-4 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <div>
          <h2 className="font-semibold text-stone-800">Theme color</h2>
          <p className="text-sm text-stone-500">
            The main accent across buttons, headings, and highlights.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            aria-label="Pick theme color"
            className="h-11 w-14 cursor-pointer rounded-lg border border-stone-200 bg-white p-1"
          />
          <input
            type="text"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            aria-label="Theme color hex"
            className="w-32 rounded-lg border border-stone-200 px-3 py-2 text-sm uppercase outline-none focus:ring-2 focus:ring-stone-300"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setColor(p)}
              aria-label={`Use ${p}`}
              className={`h-8 w-8 rounded-full ${
                color.toLowerCase() === p
                  ? "ring-2 ring-stone-900 ring-offset-2"
                  : "ring-1 ring-stone-200"
              }`}
              style={{ background: p }}
            />
          ))}
        </div>

        {/* Live preview */}
        <div className="space-y-2 rounded-xl border border-stone-200 p-4">
          <p className="text-xs uppercase tracking-wide text-stone-400">
            Preview
          </p>
          <div className="flex items-center gap-3">
            <span
              className="rounded-lg px-4 py-2 text-sm font-bold"
              style={{ background: color, color: readableTextColor(color) }}
            >
              Order now
            </span>
            <span className="text-lg font-bold" style={{ color }}>
              Fresh homemade meals
            </span>
          </div>
        </div>

        <Button variant="mainButton" disabled={savingColor} onClick={saveColor}>
          {savingColor ? "Saving..." : "Save color"}
        </Button>
      </div>

      {/* LOGO */}
      <div className="space-y-4 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <div>
          <h2 className="font-semibold text-stone-800">Logo</h2>
          <p className="text-sm text-stone-500">
            Shown in the site header, footer, and browser tab.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative h-20 w-20 overflow-hidden rounded-xl border border-stone-200 bg-stone-100">
            {logoPreview ?? initialLogo ? (
              <Image
                src={logoPreview ?? initialLogo}
                alt="Logo"
                fill
                className="object-contain"
                unoptimized={!!logoPreview}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xs text-stone-400">
                Default
              </div>
            )}
          </div>
          <input
            ref={logoRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) {
                setLogoFile(f);
                setLogoPreview(URL.createObjectURL(f));
              }
            }}
          />
          <div className="flex flex-col gap-2">
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={() => logoRef.current?.click()}
            >
              Choose logo
            </Button>
            {logoFile && (
              <Button
                variant="mainButton"
                size="sm"
                disabled={savingLogo}
                onClick={saveLogo}
              >
                {savingLogo ? "Saving..." : "Save logo"}
              </Button>
            )}
          </div>
        </div>
        <p className="text-xs text-stone-400">
          A square PNG works best. Leave as-is to keep the current logo.
        </p>
      </div>
      </div>
    </div>
  );
}
