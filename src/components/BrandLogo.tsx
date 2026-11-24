"use client";

import Image, { type StaticImageData } from "next/image";
import { useEffect, useState } from "react";

// The restaurant's logo, shown whole. A logo with a transparent background sits
// as-is (never cropped). A logo on a solid background (a square photo, white
// box...) goes in a circle so the edge looks intentional. Decided once per
// logo by reading its corner pixels, then remembered for the visit.
type Shape = "free" | "circle";
const known = new Map<string, Shape>();

function readShape(img: HTMLImageElement): Shape | null {
  try {
    const n = 24;
    const cv = document.createElement("canvas");
    cv.width = n;
    cv.height = n;
    const ctx = cv.getContext("2d", { willReadFrequently: true });
    if (!ctx) return null;
    ctx.drawImage(img, 0, 0, n, n);
    const px = ctx.getImageData(0, 0, n, n).data;
    const alphaAt = (x: number, y: number) => px[(y * n + x) * 4 + 3];
    // corners + edge midpoints: any see-through pixel = a transparent logo
    const pts: [number, number][] = [[0, 0], [n - 1, 0], [0, n - 1], [n - 1, n - 1], [n >> 1, 0], [0, n >> 1], [n - 1, n >> 1], [n >> 1, n - 1]];
    return pts.some(([x, y]) => alphaAt(x, y) < 240) ? "free" : "circle";
  } catch {
    return null; // another site's image we can't read: leave it uncropped
  }
}

export function BrandLogo({
  src,
  alt,
  className = "",
  width = 96,
  height = 96,
  priority,
}: {
  src: string | StaticImageData;
  alt: string;
  /** size classes, e.g. "h-11 w-11" */
  className?: string;
  width?: number;
  height?: number;
  priority?: boolean;
}) {
  const key = typeof src === "string" ? src : src.src;
  const [shape, setShape] = useState<Shape>(() => known.get(key) ?? "free");
  useEffect(() => {
    const k = known.get(key);
    if (k) setShape(k);
  }, [key]);

  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      priority={priority}
      draggable={false}
      onLoad={(e) => {
        if (known.has(key)) return;
        const s = readShape(e.currentTarget);
        if (!s) return;
        known.set(key, s);
        setShape(s);
      }}
      className={`shrink-0 ${shape === "circle" ? "rounded-full object-cover" : "object-contain"} ${className}`}
    />
  );
}
