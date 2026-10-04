"use client";

import { useState } from "react";
import Image from "next/image";

// A dish photo that works on ANY coloured panel without blend tricks
// (mix-blend-multiply tinted food with the panel colour — green burgers on a
// blue hero). On load we sample the image's corner alpha:
//   • cut-out (transparent PNG/WebP) → rendered free-floating, true colour
//   • ordinary photo (opaque, often a white box) → rendered as `photoClassName`
//     (a round plate / rounded card), cropped with object-cover
// JPEGs are photos by definition, so they skip detection.

export type DishKind = "?" | "cutout" | "photo";

export function detectKind(img: HTMLImageElement): DishKind {
  try {
    const cv = document.createElement("canvas");
    cv.width = cv.height = 24;
    const ctx = cv.getContext("2d", { willReadFrequently: true })!;
    ctx.drawImage(img, 0, 0, 24, 24);
    const d = ctx.getImageData(0, 0, 24, 24).data;
    const a = (x: number, y: number) => d[(y * 24 + x) * 4 + 3];
    const corners = [a(0, 0), a(23, 0), a(0, 23), a(23, 23), a(12, 0), a(0, 12)];
    return corners.filter((v) => v < 200).length >= 3 ? "cutout" : "photo";
  } catch {
    return "photo"; // unreadable (cross-origin) → never show a raw white box
  }
}

export function SmartDishImage({
  src,
  alt,
  sizes,
  priority,
  className = "",
  cutoutClassName = "",
  photoClassName = "overflow-hidden rounded-full",
  photoStyle,
  cutoutStyle,
  onKind,
}: {
  src: string;
  alt: string;
  sizes: string;
  priority?: boolean;
  className?: string;
  cutoutClassName?: string;
  photoClassName?: string;
  photoStyle?: React.CSSProperties;
  cutoutStyle?: React.CSSProperties;
  onKind?: (k: DishKind) => void;
}) {
  const jpg = /\.jpe?g(\?|$)/i.test(src);
  const [kind, setKind] = useState<DishKind>(jpg ? "photo" : "?");
  const photo = kind === "photo";
  return (
    <span
      className={`absolute block ${className} ${photo ? photoClassName : cutoutClassName}`}
      style={photo ? photoStyle : cutoutStyle}
    >
      <Image
        src={src}
        alt={alt}
        fill
        priority={priority}
        sizes={sizes}
        crossOrigin="anonymous" // Blob sends CORS * — lets the alpha check read the pixels
        className={`${photo ? "object-cover" : "object-contain"} transition-opacity duration-300 ${kind === "?" ? "opacity-0" : "opacity-100"}`}
        onLoad={(e) => {
          if (kind !== "?") return;
          const k = detectKind(e.currentTarget);
          setKind(k);
          onKind?.(k);
        }}
      />
    </span>
  );
}
