"use client";

import { useRef, useState, useTransition, type ChangeEvent } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ExternalLink } from "lucide-react";
import { updateSiteImage } from "../_actions/imageActions";
import SlotDiagram, { SITE_IMAGE_GUIDE } from "./SlotDiagram";

type SiteImageRow = { id: string; key: string; url: string; label: string };

function ImageCard({ image }: { image: SiteImageRow }) {
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const guide = SITE_IMAGE_GUIDE[image.key];

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
  };

  const handleSave = () => {
    if (!file) return;
    const formData = new FormData();
    formData.set("image", file);
    startTransition(async () => {
      const res = await updateSiteImage(image.key, formData);
      if (res.ok) {
        toast.success(`${image.label} updated`);
        setFile(null);
        setPreview(null);
        if (inputRef.current) inputRef.current.value = "";
      } else {
        toast.error(res.error ?? "Failed to update image");
      }
    });
  };

  const handleCancel = () => {
    setFile(null);
    setPreview(null);
    if (inputRef.current) inputRef.current.value = "";
  };

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
          onChange={handleFileChange}
        />
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" type="button" onClick={() => inputRef.current?.click()}>
            {file ? "Choose another" : "Change image"}
          </Button>
          {file && (
            <>
              <Button variant="mainButton" size="sm" disabled={isPending} onClick={handleSave}>
                {isPending ? "Saving..." : "Save"}
              </Button>
              <Button variant="ghost" size="sm" disabled={isPending} onClick={handleCancel}>
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
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 px-4 md:px-0">
      {images.map((img) => (
        <ImageCard key={img.id} image={img} />
      ))}
    </div>
  );
}
