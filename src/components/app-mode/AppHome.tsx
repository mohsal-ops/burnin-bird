"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { ArrowRight, Clock } from "lucide-react";
import { loadCustomer } from "@/lib/customerMemory";

// App-mode home screen (home-screen icon only). Replaces the website homepage
// with an app-style screen: greeting, open status, a big best-seller card and
// a swipeable "Popular" row. Colors come from the restaurant's own --brand and
// the site's light/dark tokens, so every client looks like their brand.

type Item = { id: string; name: string; description: string | null; priceInCents: number; image: string | null };
type Data = { name: string; address: string; logoUrl: string | null; status: { open: boolean; label: string } | null; items: Item[] };

const money = (c: number) => `$${(c / 100).toFixed(2)}`;

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

export default function AppHome() {
  const [data, setData] = useState<Data | null>(null);
  const [name, setName] = useState("");
  useEffect(() => {
    setName((loadCustomer().name || "").split(/\s+/)[0] || "");
    fetch("/api/app-home")
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData(null));
  }, []);

  const hero = data?.items[0];
  const popular = data?.items.slice(1) ?? [];

  return (
    <div className="sv-app-home-screen">
      <div className="px-5 pt-3">
        <p className="text-[13px] font-semibold opacity-60">
          {greeting()}
          {name ? `, ${name}` : ""}
        </p>
        <h1 className="sv-app-display mt-0.5 text-[30px] leading-[1.05]">What are we eating?</h1>
      </div>

      {data?.status && (
        <div className="mx-5 mt-4 flex items-center gap-2.5 rounded-2xl bg-muted px-4 py-3 text-[13px] font-bold">
          <span className={`h-2 w-2 shrink-0 rounded-full ${data.status.open ? "bg-green-500" : "bg-stone-400"}`} />
          <span className="flex-1 whitespace-nowrap">{data.status.open ? `Open · ${data.status.label.replace("Open ", "")}` : data.status.label}</span>
          {data.address && <span className="truncate font-semibold opacity-60">{data.address}</span>}
        </div>
      )}

      {hero ? (
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 26 }}
          className="sv-app-hero mx-5 mt-4"
        >
          <motion.div
            className="sv-app-hero-img"
            initial={{ scale: 0.85, rotate: -8, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 180, damping: 18, delay: 0.1 }}
          >
            <Image src={hero.image!} alt={hero.name} fill sizes="300px" className="object-cover" priority />
          </motion.div>
          <div className="relative z-10 flex w-[52%] flex-col gap-1.5">
            <span className="self-start rounded-full bg-black/85 px-2.5 py-1 text-[10.5px] font-extrabold tracking-[0.08em] text-white">
              BEST SELLER
            </span>
            <span className="sv-app-display text-[28px] leading-[0.95] [text-shadow:0_2px_12px_rgba(0,0,0,.18)]">{hero.name.trim()}</span>
            {hero.description && <span className="line-clamp-2 text-[12.5px] font-bold opacity-80">{hero.description}</span>}
          </div>
          <Link href="/Menu" className="sv-app-hero-btn">
            Order · {money(hero.priceInCents)} <ArrowRight size={16} strokeWidth={2.6} />
          </Link>
        </motion.div>
      ) : (
        <div className="mx-5 mt-4 h-[280px] animate-pulse rounded-[28px] bg-muted" />
      )}

      {popular.length > 0 && (
        <>
          <div className="mx-5 mb-2.5 mt-6 flex items-baseline justify-between">
            <span className="sv-app-display text-[20px]">Popular right now</span>
            <Link href="/Menu" className="text-[13px] font-bold text-[var(--brand)]">
              Full menu
            </Link>
          </div>
          <div className="sv-app-row">
            {popular.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 + i * 0.06, type: "spring", stiffness: 260, damping: 24 }}
              >
                <Link href="/Menu" className="flex w-[150px] flex-col gap-1.5">
                  <span className="relative block h-[110px] w-[150px] overflow-hidden rounded-[18px] bg-muted">
                    <Image src={p.image!} alt={p.name} fill sizes="150px" className="object-cover" />
                  </span>
                  <span className="line-clamp-1 text-[14px] font-extrabold">{p.name}</span>
                  <span className="text-[13px] font-bold opacity-60">{money(p.priceInCents)}</span>
                </Link>
              </motion.div>
            ))}
          </div>
        </>
      )}

      <Link href="/Menu" className="mx-5 mt-6 flex items-center gap-3 rounded-2xl bg-muted px-4 py-3.5">
        <Clock size={18} className="text-[var(--brand)]" />
        <span className="flex-1 text-[14px] font-bold">Order ahead for pickup</span>
        <ArrowRight size={16} className="opacity-50" />
      </Link>
    </div>
  );
}
