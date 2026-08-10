"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GripVertical, Trash2, Upload } from "lucide-react";
import {
  addGalleryImage,
  deleteGalleryImage,
  reorderGalleryImages,
} from "../_actions/galleryActions";

type GalleryImage = {
  id: string;
  url: string;
  alt: string;
  order: number;
};

export default function GalleryManager({
  images: initialImages,
}: {
  images: GalleryImage[];
}) {
  const [images, setImages] = useState(initialImages);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isReordering, startReorderTransition] = useTransition();
  const dragIndex = useRef<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  const router = useRouter();
  const [state, formAction, isUploading] = useActionState(addGalleryImage, {
    message: "",
  });
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.message) {
      toast.success(state.message);
      formRef.current?.reset();
      router.refresh();
    } else if (state && "error" in state && state.error) {
      toast.error(state.error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  async function handleDelete(id: string, alt: string) {
    if (!confirm(`Remove "${alt || "this image"}" from the gallery?`)) return;
    setDeletingId(id);
    const res = await deleteGalleryImage(id);
    setDeletingId(null);
    if (res.error) {
      toast.error(res.error);
    } else {
      setImages((prev) => prev.filter((img) => img.id !== id));
      toast.success(res.message);
    }
  }

  // Native HTML5 drag-and-drop breaks after the first use if you reorder the
  // array (and therefore move DOM nodes) on every dragover - that desyncs
  // the browser's drag session for the element still being dragged, so the
  // *next* drag silently does nothing. Fix: only track what's being hovered
  // during the drag, and apply the actual reorder once, on drop.
  function handleDragStart(index: number) {
    dragIndex.current = index;
  }

  function handleDragOver(e: React.DragEvent, index: number) {
    e.preventDefault();
    if (overIndex !== index) setOverIndex(index);
  }

  function handleDrop(e: React.DragEvent, index: number) {
    e.preventDefault();
    const from = dragIndex.current;
    dragIndex.current = null;
    setOverIndex(null);
    if (from === null || from === index) return;

    // Compute the reordered array as a plain value first - setImages and
    // startReorderTransition must each be called directly from the event
    // handler, not from inside a setState updater (updaters must be pure;
    // triggering a transition inside one causes React to throw "Cannot
    // call startTransition while rendering" on every render after).
    const next = [...images];
    const [moved] = next.splice(from, 1);
    next.splice(index, 0, moved);
    setImages(next);

    startReorderTransition(async () => {
      const res = await reorderGalleryImages(next.map((img) => img.id));
      if (res.error) toast.error(res.error);
    });
  }

  function handleDragEnd() {
    dragIndex.current = null;
    setOverIndex(null);
  }

  return (
    <div className="space-y-8">
      <form
        ref={formRef}
        action={formAction}
        className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 space-y-4"
      >
        <h2 className="text-sm font-bold uppercase tracking-widest text-stone-400">
          Add a photo
        </h2>
        <div className="flex flex-col sm:flex-row gap-3 items-start">
          <div className="flex-1 space-y-2 w-full">
            <Label htmlFor="gallery-image">Image file(s)</Label>
            <Input id="gallery-image" name="image" type="file" accept="image/*" multiple required />
            <p className="text-xs text-stone-400">You can select multiple images at once.</p>
          </div>
          <div className="flex-1 space-y-2 w-full">
            <Label htmlFor="gallery-alt">Alt text (optional - applied to all)</Label>
            <Input id="gallery-alt" name="alt" placeholder="Homemade comfort food" />
          </div>
        </div>
        <Button type="submit" disabled={isUploading} className="gap-2">
          <Upload size={16} />
          {isUploading ? "Uploading..." : "Add to gallery"}
        </Button>
        {state?.error && <p className="text-sm text-red-500">{state.error}</p>}
      </form>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold uppercase tracking-widest text-stone-400">
            {images.length} photo{images.length !== 1 ? "s" : ""} - drag to reorder
          </h2>
          {isReordering && <span className="text-xs text-stone-400">Saving order...</span>}
        </div>

        {images.length === 0 ? (
          <div className="p-12 text-center text-stone-400 bg-white rounded-2xl border border-stone-200">
            No gallery photos yet - add one above.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {images.map((img, index) => (
              <div
                key={img.id}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDrop={(e) => handleDrop(e, index)}
                onDragEnd={handleDragEnd}
                className={[
                  "group relative aspect-square rounded-2xl overflow-hidden border shadow-sm bg-stone-100 cursor-grab active:cursor-grabbing transition-colors",
                  overIndex === index
                    ? "border-[#c85a1e] ring-2 ring-[#c85a1e]/40"
                    : "border-stone-200",
                ].join(" ")}
              >
                <Image
                  src={img.url}
                  alt={img.alt}
                  fill
                  sizes="(max-width: 768px) 50vw, 25vw"
                  className="object-cover pointer-events-none"
                />
                <div className="absolute top-2 left-2 bg-black/50 text-white rounded-lg p-1">
                  <GripVertical size={14} />
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(img.id, img.alt)}
                  disabled={deletingId === img.id}
                  aria-label={`Remove ${img.alt || "image"}`}
                  className="absolute top-2 right-2 bg-white/90 hover:bg-red-50 text-red-500 rounded-lg p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
