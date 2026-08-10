"use client";

import dynamic from "next/dynamic";
import type { GalleryImageData } from "./AnimatedImages";

const ThirdSectionComponent = dynamic(
  () =>
    import("./AnimatedImages").then(
      (m) => m.ThirdSectionComponent
    ),
  {
    ssr: false,
    loading: () => (
      <div className="w-[85%] h-100 bg-gray-200 rounded-3xl animate-pulse" />
    ),
  }
);

export default function ThirdSectionClient({
  images,
}: {
  images: GalleryImageData[];
}) {
  return <ThirdSectionComponent images={images} />;
}
