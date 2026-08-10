"use client";

import { useActionState, useRef, useState } from "react";
import { addPartner } from "../_actions/partnerActions";
import Image from "next/image";
import { Plus, ChevronDown, ChevronUp } from "lucide-react";

type State = { message?: string; error?: string } | undefined;

export default function AddPartnerForm({
  defaultOpen,
  nextOrder,
}: {
  defaultOpen: boolean;
  nextOrder: number;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [state, formAction, pending] = useActionState<State, FormData>(
    addPartner,
    undefined
  );
  const [preview, setPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Collapse and reset preview on success
  const prevMessage = state?.message;

  return (
    <div className="bg-white rounded-2xl border border-dashed border-stone-300 shadow-sm overflow-hidden">
      {/* Toggle header */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full px-6 py-4 flex items-center gap-3 hover:bg-stone-50 transition-colors text-left"
      >
        <div className="w-7 h-7 rounded-full bg-stone-900 flex items-center justify-center shrink-0">
          <Plus className="w-4 h-4 text-white" />
        </div>
        <p className="font-semibold text-stone-700 flex-1">Add new partner</p>
        {open ? (
          <ChevronUp className="w-4 h-4 text-stone-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-stone-400" />
        )}
      </button>

      {open && (
        <form action={formAction} className="px-6 pb-6 space-y-5 border-t border-stone-100 pt-5">
          {/* Hidden order field */}
          <input type="hidden" name="order" value={nextOrder} />

          {/* Photo */}
          <div className="flex items-start gap-5">
            <div
              className="relative w-24 h-32 rounded-2xl overflow-hidden shrink-0 cursor-pointer border-2 border-dashed border-stone-200 hover:border-stone-400 transition-colors"
              onClick={() => fileRef.current?.click()}
            >
              {preview ? (
                <Image priority src={preview} alt="Preview" fill className="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-stone-400 text-xs text-center px-2">
                  Click to upload
                </div>
              )}
            </div>
            <div className="flex-1 space-y-1">
              <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide">Photo</p>
              <p className="text-xs text-stone-400">Click the image to upload a photo</p>
              <input
                ref={fileRef}
                type="file"
                name="image"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) setPreview(URL.createObjectURL(f));
                }}
              />
            </div>
          </div>

          {/* Name + Role */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-stone-500 uppercase tracking-wide">
                Full Name
              </label>
              <input
                name="name"
                placeholder="e.g. Marcus Johnson"
                className="w-full border border-stone-300 rounded-xl px-3 py-2 text-sm outline-none focus:border-stone-500 transition-colors"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-stone-500 uppercase tracking-wide">
                Role / Title
              </label>
              <input
                name="role"
                placeholder="e.g. Co-Founder & Head Chef"
                className="w-full border border-stone-300 rounded-xl px-3 py-2 text-sm outline-none focus:border-stone-500 transition-colors"
                required
              />
            </div>
          </div>

          {/* Accent color */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-stone-500 uppercase tracking-wide">
              Accent Color
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                name="accent"
                defaultValue="#c85a1e"
                className="w-10 h-10 rounded-xl border border-stone-200 cursor-pointer"
              />
              <p className="text-xs text-stone-400">
                Used for the name underline and bio highlight on the Our Story page
              </p>
            </div>
          </div>

          {/* Bio paragraphs */}
          <div className="space-y-3">
            <label className="text-xs font-semibold text-stone-500 uppercase tracking-wide">
              Bio (3 paragraphs)
            </label>
            {[0, 1, 2].map((i) => (
              <div key={i} className="space-y-1">
                <p className="text-xs text-stone-400">Paragraph {i + 1}</p>
                <textarea
                  name={`bio${i}`}
                  placeholder={
                    i === 0
                      ? "Introduce this person..."
                      : i === 1
                      ? "Their journey or background..."
                      : "Their vision and role at The Wagon Wheel..."
                  }
                  rows={3}
                  className="w-full border border-stone-300 rounded-xl px-3 py-2 text-sm outline-none focus:border-stone-500 transition-colors resize-none"
                  required
                />
              </div>
            ))}
          </div>

          {/* Feedback */}
          {state?.message && (
            <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3">
              <p className="text-sm text-green-700">{state.message}</p>
            </div>
          )}
          {state?.error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <p className="text-sm text-red-600">{state.error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={pending}
            className="w-full bg-stone-900 hover:bg-stone-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm"
          >
            {pending ? "Adding..." : "Add partner"}
          </button>
        </form>
      )}
    </div>
  );
}