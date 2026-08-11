"use client";

import { Phone } from "lucide-react";
import { getOutreach } from "@/lib/outreach";

// Quiet, persistent "book a call" pill shown throughout the read-only preview.
// Mounted once in the admin layout (preview mode only) so the option is always
// reachable without repeating the ask on every feature section. Hidden when the
// client hasn't set a Calendly URL — same gating as the trial popup.
export default function PreviewCallCta() {
  const o = getOutreach();
  if (!o.calendlyUrl) return null;

  return (
    <a
      href={o.calendlyUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-4 right-4 z-40 inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white/95 px-4 py-2.5 text-sm font-medium text-stone-700 shadow-md backdrop-blur transition-colors hover:border-[#c85a1e]/40 hover:text-[#c85a1e]"
    >
      <Phone size={15} className="text-[#c85a1e]" />
      <span>
        Ready to go live? <span className="font-semibold">Book a call</span>
      </span>
    </a>
  );
}
