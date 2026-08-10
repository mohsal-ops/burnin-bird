"use client";
// TEMPORARY preview of the admin loading effect (skeleton + looping burger).
import LoadingScreen from "@/components/LoadingScreen";
import { GenericSkeleton } from "@/app/admin/_components/AdminSkeletons";

export default function LoadingTestPage() {
  return (
    <div className="relative min-h-screen bg-white">
      <GenericSkeleton />
      <LoadingScreen keepLooping transparent />
    </div>
  );
}
