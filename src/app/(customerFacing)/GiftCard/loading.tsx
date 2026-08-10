"use client";

import Image from "next/image";
import logo from "public/logo.png";

export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
      <div className="animate-pulse">
        <Image src={logo} alt="The Wagon Wheel" className="h-20 w-20 rounded-full object-cover" />
      </div>

      <p className="text-gray-400 text-lg animate-pulse">Loading gift card payment…</p>

      <div className="flex justify-center">
        <div className="w-12 h-12 border-4 border-brand border-t-black rounded-full animate-spin" />
      </div>
    </div>
  );
}
