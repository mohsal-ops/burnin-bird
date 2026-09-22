"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { toast } from "@/hooks/use-toast";
import { seedSampleMenu, clearSampleMenu } from "@/app/admin/_actions/products";

export default function SampleMenuButtons() {
  const [pending, start] = useTransition();
  const router = useRouter();
  const confirm = useConfirm();

  const run = (fn: () => Promise<{ message: string }>) =>
    start(async () => {
      const res = await fn();
      toast({ description: res.message });
      router.refresh();
    });

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="outline" disabled={pending} onClick={() => run(seedSampleMenu)}>
        {pending ? "Working…" : "Load sample menu"}
      </Button>
      <Button
        variant="ghost"
        disabled={pending}
        onClick={async () => {
          if (await confirm({ title: "Remove the sample demo items?", confirmText: "Remove", destructive: true })) run(clearSampleMenu);
        }}
      >
        Remove sample
      </Button>
    </div>
  );
}
