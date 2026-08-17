"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { seedSampleMenu, clearSampleMenu, type SampleCuisine } from "@/app/admin/_actions/products";

const CUISINES: { key: SampleCuisine; label: string }[] = [
  { key: "burger", label: "Burgers & Chicken" },
  { key: "pizza", label: "Pizza" },
  { key: "persian", label: "Persian" },
];

export default function SampleMenuButtons() {
  const [pending, start] = useTransition();
  const [busy, setBusy] = useState<string | null>(null);
  const router = useRouter();

  const run = (label: string, fn: () => Promise<{ message: string }>) => {
    setBusy(label);
    start(async () => {
      const res = await fn();
      toast(res.message);
      router.refresh();
      setBusy(null);
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm text-stone-500">Load a sample menu:</span>
      {CUISINES.map((c) => (
        <Button
          key={c.key}
          variant="outline"
          size="sm"
          disabled={pending}
          onClick={() => run(c.key, () => seedSampleMenu(c.key))}
        >
          {busy === c.key ? "Loading…" : c.label}
        </Button>
      ))}
      <Button
        variant="ghost"
        size="sm"
        disabled={pending}
        onClick={() => {
          if (confirm("Remove the sample menu items?")) run("clear", clearSampleMenu);
        }}
      >
        {busy === "clear" ? "Removing…" : "Remove sample"}
      </Button>
    </div>
  );
}
