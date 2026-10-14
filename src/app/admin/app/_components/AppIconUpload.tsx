"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ImagePlus, RotateCcw } from "lucide-react";
import { removeAppIcon, updateAppIcon } from "../appActions";

// Upload the phone app icon, separate from the website and dashboard logos.
export function AppIconUpload({ hasCustom }: { hasCustom: boolean }) {
  const input = useRef<HTMLInputElement>(null);
  const [pending, start] = useTransition();
  const [preview, setPreview] = useState<string | null>(null);
  const router = useRouter();

  return (
    <div className="max-w-sm text-sm text-stone-600">
      <p className="font-semibold text-stone-800">App icon</p>
      <p className="mt-1">
        {hasCustom ? "You're using your own app icon." : "Using your website logo."} A square PNG, at least 512×512, looks best. It fills the
        whole icon.
      </p>
      <input
        ref={input}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          setPreview(URL.createObjectURL(f));
          const fd = new FormData();
          fd.set("icon", f);
          start(async () => {
            const r = await updateAppIcon(fd);
            if (r.ok) {
              toast.success("App icon saved. Phones that already added the app need to add it again to see it.");
              router.refresh();
            } else toast.error(r.error);
            setPreview(null);
            if (input.current) input.current.value = "";
          });
        }}
      />
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {preview && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="" className="h-10 w-10 rounded-lg object-cover" />
        )}
        <button
          type="button"
          disabled={pending}
          onClick={() => input.current?.click()}
          className="inline-flex items-center gap-2 rounded-full bg-stone-900 px-4 py-2 font-medium text-white disabled:opacity-60"
        >
          <ImagePlus className="h-4 w-4" /> {pending ? "Saving…" : hasCustom ? "Change app icon" : "Upload app icon"}
        </button>
        {hasCustom && (
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              start(async () => {
                const r = await removeAppIcon();
                if (r.ok) {
                  toast.success("Back to your website logo.");
                  router.refresh();
                } else toast.error(r.error);
              })
            }
            className="inline-flex items-center gap-1.5 rounded-full border border-stone-300 px-3 py-2 font-medium text-stone-700"
          >
            <RotateCcw className="h-4 w-4" /> Use website logo
          </button>
        )}
      </div>
      <p className="mt-3 text-xs text-stone-500">The app colour comes from Branding.</p>
    </div>
  );
}
