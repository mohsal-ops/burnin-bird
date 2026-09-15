"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GripVertical, Trash2, Upload, Loader2, ImageIcon, AlertTriangle } from "lucide-react";
import {
  addGalleryImage,
  registerGalleryImage,
  deleteGalleryImage,
  reorderGalleryImages,
} from "../_actions/galleryActions";

type GalleryImage = {
  id: string;
  url: string;
  alt: string;
  order: number;
};

// In production, photos upload straight from the browser to Vercel Blob (see
// /api/gallery/upload) - no serverless function in the transfer path, so there's
// no ~4.5MB request cap and no function timeout. Big photos go through fine;
// each file just needs to be a sane size on its own.
const isDev = process.env.NODE_ENV === "development";
const MAX_PER_FILE_BYTES = 100 * 1024 * 1024; // 100 MB per photo (prod)
// Dev still uses the server action + local filesystem, which is bound by
// next.config's 10mb server-action limit - so keep the old batch guard there.
const MAX_DEV_BATCH_BYTES = 9 * 1024 * 1024;

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

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

  // Track the chosen files so we can show a live summary + block oversized
  // batches BEFORE they hit the server (where they'd fail hard).
  const [selected, setSelected] = useState<File[]>([]);
  const totalBytes = selected.reduce((sum, f) => sum + f.size, 0);
  // Dev: guard the whole batch against the 10mb server-action limit.
  // Prod: only guard each individual file (each uploads on its own to Blob).
  const oversizeFile = selected.find((f) => f.size > MAX_PER_FILE_BYTES);
  const tooBig = isDev ? totalBytes > MAX_DEV_BATCH_BYTES : !!oversizeFile;

  // Prod client-upload progress.
  const [prodBusy, setProdBusy] = useState(false);
  const [prog, setProg] = useState({ done: 0, total: 0 });
  const isBusy = isDev ? isUploading : prodBusy;

  useEffect(() => {
    if (state?.message) {
      toast.success(state.message);
      formRef.current?.reset();
      setSelected([]);
      router.refresh();
    } else if (state && "error" in state && state.error) {
      toast.error(state.error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  function handleFilesChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSelected(e.target.files ? Array.from(e.target.files) : []);
  }

  // DEV path: the native server-action submit, guarded against the batch limit.
  function handleDevSubmit(e: React.FormEvent<HTMLFormElement>) {
    if (selected.length === 0) return; // native `required` will prompt
    if (tooBig) {
      e.preventDefault();
      toast.error(
        `That's ${formatBytes(totalBytes)} in one go - please upload under ${formatBytes(
          MAX_DEV_BATCH_BYTES
        )} at a time (fewer or smaller photos).`
      );
    }
  }

  // PROD path: upload each file straight to Vercel Blob from the browser, then
  // record it. No function-size cap, no timeout - large photos work.
  async function handleProdSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (selected.length === 0 || prodBusy) return;
    if (oversizeFile) {
      toast.error(
        `"${oversizeFile.name}" is ${formatBytes(oversizeFile.size)} - please keep each photo under ${formatBytes(
          MAX_PER_FILE_BYTES
        )}.`
      );
      return;
    }
    const alt = String(new FormData(e.currentTarget).get("alt") ?? "").trim();
    const { upload } = await import("@vercel/blob/client");

    setProdBusy(true);
    setProg({ done: 0, total: selected.length });
    let added = 0;
    let failed = 0;
    for (const file of selected) {
      try {
        const blob = await upload(`gallery/${file.name}`, file, {
          access: "public",
          handleUploadUrl: "/api/gallery/upload",
          contentType: file.type || undefined,
        });
        const altText = alt || file.name.replace(/\.[^.]+$/, "");
        const res = await registerGalleryImage(blob.url, altText);
        if (res.error) failed++;
        else added++;
      } catch (err) {
        console.error("gallery upload failed for", file.name, err);
        failed++;
      }
      setProg((p) => ({ ...p, done: p.done + 1 }));
    }
    setProdBusy(false);

    if (added > 0) {
      toast.success(
        failed > 0
          ? `${added} photo${added !== 1 ? "s" : ""} added, ${failed} failed.`
          : added === 1
          ? "Image added."
          : `${added} images added.`
      );
      formRef.current?.reset();
      setSelected([]);
      router.refresh();
    } else {
      toast.error("Upload failed. Please try again, or check your connection.");
    }
  }

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
        action={isDev ? formAction : undefined}
        onSubmit={isDev ? handleDevSubmit : handleProdSubmit}
        className="relative bg-white rounded-2xl border border-stone-200 shadow-sm p-6 space-y-4"
      >
        <h2 className="text-sm font-bold uppercase tracking-widest text-stone-400">
          Add a photo
        </h2>
        <div className="flex flex-col sm:flex-row gap-3 items-start">
          <div className="flex-1 space-y-2 w-full">
            <Label htmlFor="gallery-image">Image file(s)</Label>
            <Input
              id="gallery-image"
              name="image"
              type="file"
              accept="image/*"
              multiple
              required
              disabled={isBusy}
              onChange={handleFilesChange}
            />
            <p className="text-xs text-stone-400">
              {isDev
                ? `You can select multiple images at once - up to ${formatBytes(MAX_DEV_BATCH_BYTES)} per upload.`
                : `Select as many photos as you like - each can be up to ${formatBytes(MAX_PER_FILE_BYTES)}.`}
            </p>
          </div>
          <div className="flex-1 space-y-2 w-full">
            <Label htmlFor="gallery-alt">Alt text (optional - applied to all)</Label>
            <Input id="gallery-alt" name="alt" placeholder="Homemade comfort food" disabled={isBusy} />
          </div>
        </div>

        {/* Live selection summary + oversize guard */}
        {selected.length > 0 && (
          <div
            className={[
              "flex items-center gap-2 rounded-xl border px-3 py-2 text-sm",
              tooBig
                ? "border-red-200 bg-red-50 text-red-600"
                : "border-stone-200 bg-stone-50 text-stone-600",
            ].join(" ")}
          >
            {tooBig ? <AlertTriangle size={16} /> : <ImageIcon size={16} />}
            <span>
              {selected.length} photo{selected.length !== 1 ? "s" : ""} selected ·{" "}
              <span className="font-medium">{formatBytes(totalBytes)}</span>
            </span>
            {tooBig && (
              <span className="ml-auto text-xs font-medium">
                Too large - upload fewer or smaller photos.
              </span>
            )}
          </div>
        )}

        <Button type="submit" variant="mainButton" size="md" disabled={isBusy || tooBig} className="gap-2">
          <Upload size={16} />
          {isBusy ? "Uploading..." : "Add to gallery"}
        </Button>
        {state?.error && <p className="text-sm text-red-500">{state.error}</p>}

        {/* Upload overlay - keeps the user informed while large photos transfer */}
        {isBusy && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 rounded-2xl bg-white/85 backdrop-blur-sm">
            <Loader2 size={32} className="animate-spin text-[#c85a1e]" />
            <div className="text-center">
              <p className="font-semibold text-stone-800">
                {!isDev && prog.total > 1
                  ? `Uploading photo ${Math.min(prog.done + 1, prog.total)} of ${prog.total}…`
                  : `Uploading ${selected.length > 0 ? `${selected.length} ` : ""}photo${selected.length !== 1 ? "s" : ""}…`}
              </p>
              <p className="mt-0.5 text-sm text-stone-500">
                Large images can take a moment. Please keep this tab open - don&apos;t refresh.
              </p>
            </div>
            <div className="h-1.5 w-48 overflow-hidden rounded-full bg-stone-200">
              {!isDev && prog.total > 0 ? (
                <div
                  className="h-full rounded-full bg-[#c85a1e] transition-all duration-300"
                  style={{ width: `${Math.round((prog.done / prog.total) * 100)}%` }}
                />
              ) : (
                <div className="h-full w-1/3 animate-[gallery-loading_1.1s_ease-in-out_infinite] rounded-full bg-[#c85a1e]" />
              )}
            </div>
          </div>
        )}
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
