"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";
import Image from "next/image";
import logo from "public/logo.png";

// The inline catering menu — DESIGN ONLY. The content comes from
// SITE_CONFIG.catering.menu (per client, so ⤓ Update never overwrites a
// client's real menu) and is passed in by CateringPageClient. Optional
// `pdfUrl` shows a download button; omit it to hide the button.
export type CateringMenuItem = { name: string; qty?: string; price: number };
export type CateringMenuSection = { title: string; note?: string; items: CateringMenuItem[] };

// Drifting smoke plumes for the "off the grill" entrance. Each wisp is a soft
// blurred blob that rises + fades on its own timer so the motion reads organic.
const SMOKE: { left: string; size: number; rise: number; dur: number; delay: number }[] = [
  { left: "12%", size: 150, rise: 260, dur: 7.0, delay: 0.0 },
  { left: "34%", size: 190, rise: 320, dur: 8.5, delay: 1.6 },
  { left: "56%", size: 140, rise: 240, dur: 6.5, delay: 0.8 },
  { left: "74%", size: 200, rise: 340, dur: 9.0, delay: 2.4 },
  { left: "88%", size: 130, rise: 220, dur: 7.5, delay: 3.2 },
];

export default function CateringMenuDisplay({
  menu,
  pdfUrl,
  logoUrl,
  grill = true,
}: {
  menu: CateringMenuSection[];
  pdfUrl?: string;
  logoUrl?: string;
  // "Off the grill" smoke + ember entrance. Driven by SITE_CONFIG.catering
  // .animation ("grill" | "none"); reduced motion always wins over it.
  grill?: boolean;
}) {
  const reduce = useReducedMotion();
  const patternLogo = logoUrl || logo.src;
  const showGrill = grill && !reduce;

  if (!menu || menu.length === 0) return null;

  const downloadPdf = () => {
    if (!pdfUrl) return;
    const link = document.createElement("a");
    link.href = pdfUrl;
    link.download = pdfUrl.split("/").pop() || "catering-menu.pdf";
    link.click();
  };

  const container: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { duration: 0.5, staggerChildren: reduce ? 0 : 0.08, delayChildren: 0.05 },
    },
  };
  const rise: Variants = {
    hidden: reduce ? { opacity: 0 } : { opacity: 0, y: 24 },
    show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] } },
  };

  return (
    <motion.div
      variants={container}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-80px" }}
      className="relative overflow-hidden rounded-3xl bg-stone-950 p-6 sm:p-10 shadow-2xl ring-1 ring-white/10"
    >
      {/* Signature repeated-logo pattern, echoing the catering hero. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage: `url(${patternLogo})`,
          backgroundRepeat: "repeat",
          backgroundSize: "90px 90px",
          transform: "rotate(-8deg) scale(1.2)",
        }}
      />
      {/* warm brand glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-brand/20 blur-3xl"
      />

      {/* "Off the grill" — drifting smoke + a warm ember glow along the base.
          Gated by the catering.animation config; off under reduced motion. */}
      {showGrill && (
        <>
          <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
            {SMOKE.map((w, i) => (
              <motion.span
                key={i}
                className="absolute rounded-full blur-2xl"
                style={{
                  left: w.left,
                  bottom: -40,
                  width: w.size,
                  height: w.size,
                  background:
                    "radial-gradient(circle, rgba(255,255,255,0.16), rgba(255,255,255,0) 70%)",
                }}
                initial={{ opacity: 0, y: 0, scale: 0.6 }}
                animate={{ opacity: [0, 0.5, 0], y: [0, -w.rise], scale: [0.6, 1.5] }}
                transition={{ duration: w.dur, delay: w.delay, repeat: Infinity, ease: "easeOut" }}
              />
            ))}
          </div>
          <motion.div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 -bottom-12 h-36 blur-3xl"
            style={{
              background: "radial-gradient(ellipse at bottom, rgba(200,90,30,0.4), rgba(200,90,30,0) 70%)",
            }}
            animate={{ opacity: [0.35, 0.7, 0.35] }}
            transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
          />
        </>
      )}

      <div className="relative">
        <motion.div variants={rise} className="mb-8 flex items-center justify-center gap-3 text-center">
          <span className="h-px w-8 bg-brand/60" />
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-brand">By the tray, feeds a crowd</p>
          <span className="h-px w-8 bg-brand/60" />
        </motion.div>

        <div className="grid gap-x-12 gap-y-10 md:grid-cols-2">
          {menu.map((section, s) => {
            // The first section is the headliner: full width with 2-column items.
            const wide = s === 0;
            return (
              <motion.div key={section.title} variants={rise} className={wide ? "md:col-span-2" : ""}>
                <div className="mb-1 flex items-baseline gap-3">
                  <h3 className="font-serif text-2xl font-bold text-brand sm:text-3xl">{section.title}</h3>
                  <span className="h-px flex-1 translate-y-[-2px] bg-white/15" />
                </div>
                {section.note && <p className="mb-4 text-sm italic text-white/50">{section.note}</p>}

                <ul className={wide ? "grid gap-x-12 gap-y-3 sm:grid-cols-2" : "space-y-3"}>
                  {section.items.map((item, i) => (
                    <li key={`${item.name}-${i}`} className="flex items-baseline gap-3">
                      <span className="text-[17px] font-medium text-white">
                        {item.name}
                        {item.qty && <span className="ml-2 text-sm font-normal text-white/50">{item.qty}</span>}
                      </span>
                      <span className="mb-1 flex-1 border-b border-dotted border-white/20" />
                      <span className="text-lg font-bold tabular-nums text-brand">${item.price}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          variants={rise}
          className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-6 sm:flex-row"
        >
          <p className="text-sm text-white/45">Tax and gratuity not included. Custom orders welcome.</p>
          {pdfUrl && (
            <button
              type="button"
              onClick={downloadPdf}
              className="inline-flex items-center gap-2 rounded-full border border-white/25 px-4 py-2 text-sm font-medium text-white transition-colors hover:border-brand hover:text-brand"
            >
              <Image src={logo} alt="" width={18} height={18} className="h-4 w-4 rounded-sm" />
              Download PDF menu
            </button>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}
