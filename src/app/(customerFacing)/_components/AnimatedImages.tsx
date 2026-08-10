"use client";
import { useState } from "react";
import PageHeader from "./PageHeader";
import { motion } from "framer-motion";
import Image from "next/image";
import { SITE_CONFIG } from "@/lib/siteConfig";

export type GalleryImageData = { url: string; alt: string };

export function ThirdSectionComponent({
  images,
}: {
  images: GalleryImageData[];
}) {
  return (
    <div className=" sm:w-[85vw] w-full sm:text-start text-center p-2 space-y-10 ">
      <div className="space-y-4">
        <PageHeader>{SITE_CONFIG.home.galleryTitle}</PageHeader>
        <span className="font-medium text-neutral-600 text-lg">
          {" "}
          {SITE_CONFIG.home.gallerySubtitle}
        </span>
      </div>

      <main className="grid grid-cols-2  sm:grid-cols-3  md:grid-cols-3  w-full gap-6 ">
        {images.map((image, i) => (
          <HoverCard key={image.url + i} src={image.url} alt={image.alt} />
        ))}
      </main>
    </div>
  );
}

export function HoverCard({ src, alt }: { src: string; alt: string }) {
  const [loaded, setLoaded] = useState(false);
  const MotionImage = motion.create(Image);

  return (
    <motion.div
      initial="rest"
      whileHover="hover"
      animate="rest"
      className="relative w-full aspect-square overflow-hidden rounded-2xl shadow-lg"
    >
      {/* Skeleton (same size, no layout shift) */}
      {!loaded && (
        <div className="absolute inset-0 bg-gray-300 animate-pulse z-10" />
      )}

      {/* Image */}
      <MotionImage
        src={src}
        alt={alt}
        fill
        sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 28vw"
        className="object-cover w-full h-full"
        onLoad={() => setLoaded(true)}
        initial={{ opacity: 0 }}
        animate={{ opacity: loaded ? 1 : 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        variants={{
          rest: { scale: 1, y: 0 },
          hover: { scale: 1.06, y: -6 },
        }}
      />

      {/* Overlay (unchanged) */}
      <motion.div
        variants={{
          rest: { opacity: 0, y: 8 },
          hover: { opacity: 1, y: 0 },
        }}
        transition={{ duration: 0.28, ease: "easeOut" }}
        className="absolute inset-0 bg-black/40 flex items-end p-4"
        style={{ pointerEvents: "none" }}
      ></motion.div>
    </motion.div>
  );
}
