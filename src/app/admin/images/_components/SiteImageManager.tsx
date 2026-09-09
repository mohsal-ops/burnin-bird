"use client";

import { useRef, useState, useTransition, type ChangeEvent } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ExternalLink, Images } from "lucide-react";
import { updateSiteImage } from "../_actions/imageActions";
import SlotDiagram, { SITE_IMAGE_GUIDE } from "./SlotDiagram";
import { SITE_CONFIG } from "@/lib/siteConfig";

type SiteImageRow = { id: string; key: string; url: string; label: string };

// The three keys that together make up the homepage hero carousel, in slide
// order. They're pulled out of the flat grid and shown as one combined card
// (see HeroCarouselCard) so an owner edits "the hero" in one place instead of
// hunting for three lookalike cards.
const HERO_KEYS = ["home_hero", "home_hero_2", "home_hero_3"] as const;

// Shared upload flow (file -> local preview -> server action -> toast), used by
// both the normal ImageCard and each hero slide tile.
function useSlotUpload(key: string, label: string) {
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  const onFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
  };
  const reset = () => {
    setFile(null);
    setPreview(null);
    if (inputRef.current) inputRef.current.value = "";
  };
  const save = () => {
    if (!file) return;
    const formData = new FormData();
    formData.set("image", file);
    startTransition(async () => {
      const res = await updateSiteImage(key, formData);
      if (res.ok) {
        toast.success(`${label} updated`);
        reset();
      } else {
        toast.error(res.error ?? "Failed to update image");
      }
    });
  };
  return { preview, file, isPending, inputRef, onFileChange, save, cancel: reset };
}

// One editable hero slide inside the combined card: numbered, labelled by its
// live CTA, with the same change/save/cancel affordances as a normal card.
function HeroSlide({
  image,
  index,
}: {
  image: SiteImageRow;
  index: number;
}) {
  const { preview, file, isPending, inputRef, onFileChange, save, cancel } = useSlotUpload(
    image.key,
    image.label,
  );
  const slide = SITE_CONFIG.home.heroSlides?.[index];
  const role = slide?.ctaLabel ?? image.label;

  return (
    <div className="relative flex flex-col rounded-xl border border-stone-200 bg-white overflow-hidden">
      <div className="relative w-full aspect-[16/10] bg-stone-100">
        {(preview ?? image.url) ? (
          <Image
            src={preview ?? image.url}
            alt={image.label}
            fill
            sizes="(max-width: 640px) 100vw, 320px"
            className="object-cover"
            unoptimized={!!preview}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xs text-stone-400">
            No image set
          </div>
        )}
        {/* slide number badge */}
        <span className="absolute top-2 left-2 grid place-items-center size-7 rounded-full bg-[#c85a1e] text-white text-xs font-bold shadow ring-2 ring-white/70">
          {index + 1}
        </span>
        {preview && (
          <span className="absolute top-2 right-2 rounded-full bg-amber-500 text-white text-[11px] font-semibold px-2 py-0.5 shadow">
            Unsaved
          </span>
        )}
      </div>

      <div className="flex flex-col gap-2 p-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-400">
            Slide {index + 1}
          </p>
          <p className="truncate text-sm font-semibold text-stone-800">{role}</p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onFileChange}
        />
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" type="button" onClick={() => inputRef.current?.click()}>
            {file ? "Choose another" : "Change image"}
          </Button>
          {file && (
            <>
              <Button variant="mainButton" size="sm" disabled={isPending} onClick={save}>
                {isPending ? "Saving..." : "Save"}
              </Button>
              <Button variant="ghost" size="sm" disabled={isPending} onClick={cancel}>
                Cancel
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Combined hero card: the three slide tiles in carousel order, with a header
// that explains where it shows and links to the live page. Spans the full grid.
function HeroCarouselCard({ slides }: { slides: SiteImageRow[] }) {
  const guide = SITE_IMAGE_GUIDE["home_hero"];
  return (
    <div className="sm:col-span-2 lg:col-span-3 bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-stone-100 bg-gradient-to-r from-[#c85a1e]/10 to-transparent p-4">
        <div className="flex items-start gap-3">
          <span className="grid place-items-center size-9 shrink-0 rounded-xl bg-[#c85a1e] text-white shadow">
            <Images size={18} />
          </span>
          <div>
            <p className="font-semibold text-stone-800">Home Hero Carousel</p>
            <p className="text-xs leading-snug text-stone-500 max-w-md">
              {guide?.where ??
                "The big rotating banner at the very top of your homepage. It cycles through these slides in order."}
            </p>
          </div>
        </div>
        <a
          href={guide?.href ?? "/"}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs font-medium text-[#c85a1e] hover:underline"
        >
          View Home page
          <ExternalLink size={12} />
        </a>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4">
        {slides.map((img, i) => (
          <HeroSlide key={img.id} image={img} index={i} />
        ))}
      </div>
    </div>
  );
}

function ImageCard({ image }: { image: SiteImageRow }) {
  const { preview, file, isPending, inputRef, onFileChange, save, cancel } = useSlotUpload(
    image.key,
    image.label,
  );
  const guide = SITE_IMAGE_GUIDE[image.key];

  return (
    <div className="group bg-white rounded-2xl border border-stone-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col">
      <div className="relative w-full aspect-[16/10] bg-stone-100">
        {(preview ?? image.url) ? (
          <Image
            src={preview ?? image.url}
            alt={image.label}
            fill
            sizes="(max-width: 640px) 100vw, 400px"
            className="object-cover"
            unoptimized={!!preview}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xs text-stone-400">
            No image set
          </div>
        )}
        {preview && (
          <span className="absolute top-2 left-2 rounded-full bg-amber-500 text-white text-[11px] font-semibold px-2 py-0.5 shadow">
            Unsaved preview
          </span>
        )}
      </div>

      <div className="p-4 space-y-3">
        <p className="font-semibold text-stone-800 text-sm">{image.label}</p>

        {guide && (
          <div className="flex gap-3 rounded-xl border border-stone-200 bg-stone-50 p-3">
            <div className="w-[42%] max-w-[150px] shrink-0 self-start">
              <SlotDiagram blocks={guide.blocks} />
            </div>
            <div className="min-w-0 flex flex-col justify-center gap-1">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-stone-400">
                Where it appears
              </p>
              <p className="text-xs leading-snug text-stone-600">{guide.where}</p>
              <a
                href={guide.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-medium text-[#c85a1e] hover:underline"
              >
                View {guide.page}
                <ExternalLink size={12} />
              </a>
            </div>
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onFileChange}
        />
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" type="button" onClick={() => inputRef.current?.click()}>
            {file ? "Choose another" : "Change image"}
          </Button>
          {file && (
            <>
              <Button variant="mainButton" size="sm" disabled={isPending} onClick={save}>
                {isPending ? "Saving..." : "Save"}
              </Button>
              <Button variant="ghost" size="sm" disabled={isPending} onClick={cancel}>
                Cancel
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SiteImageManager({ images }: { images: SiteImageRow[] }) {
  // Pull the hero slides out (in slide order) and show them as one combined
  // card first; everything else keeps the normal per-image grid after it.
  const heroSlides = HERO_KEYS.map((k) => images.find((img) => img.key === k)).filter(
    (img): img is SiteImageRow => !!img,
  );
  const rest = images.filter((img) => !HERO_KEYS.includes(img.key as (typeof HERO_KEYS)[number]));

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 px-4 md:px-0">
      {heroSlides.length > 0 && <HeroCarouselCard slides={heroSlides} />}
      {rest.map((img) => (
        <ImageCard key={img.id} image={img} />
      ))}
    </div>
  );
}
