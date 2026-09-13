"use client";
// TEMPORARY preview of the loading effect. Loops so it's easy to watch, and
// accepts ?variant=burger|coffee|pizza|bowl|grill to preview any loader style
// without changing SITE_CONFIG.loaderStyle.
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import LoadingScreen from "@/components/LoadingScreen";
import { GenericSkeleton } from "@/app/admin/_components/AdminSkeletons";

const VARIANTS = ["burger", "coffee", "pizza", "bowl", "grill"] as const;

function LoadingTestInner() {
  const raw = useSearchParams().get("variant");
  const variant = (VARIANTS as readonly string[]).includes(raw ?? "")
    ? (raw as (typeof VARIANTS)[number])
    : undefined;
  return (
    <div className="relative min-h-screen bg-white">
      <GenericSkeleton />
      <LoadingScreen keepLooping transparent variant={variant} />
    </div>
  );
}

export default function LoadingTestPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <LoadingTestInner />
    </Suspense>
  );
}
