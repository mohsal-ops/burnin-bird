"use client";

import { useActionState, useRef, useState } from "react";
import { updatePartner } from "../_actions/partnerActions";
import Image from "next/image";
import { Partner } from "generated/prisma";

type State = { message?: string; error?: string } | undefined;

export default function PartnerForm({ partner }: { partner: Partner }) {
  const action = updatePartner.bind(null, partner.id);
  const [state, formAction, pending] = useActionState<State, FormData>(action, undefined);
  const [preview, setPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-stone-100 flex items-center gap-3">
        <div
          className="w-3 h-3 rounded-full shrink-0"
          style={{ background: partner.accent }}
        />
        <p className="font-semibold text-stone-800">{partner.name}</p>
        <span className="text-xs text-stone-400 ml-auto">{partner.role}</span>
      </div>

      <form action={formAction} className="p-6 space-y-5">
        {/* Photo */}
        <div className="flex items-start gap-5">
          <div
            className="relative w-24 h-32 rounded-2xl overflow-hidden shrink-0 cursor-pointer border-2 border-dashed border-stone-200 hover:border-stone-400 transition-colors"
            onClick={() => fileRef.current?.click()}
          >
            {preview || partner.image ? (
              <Image 
                priority
                src={preview ?? partner.image!}
                alt={partner.name}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-stone-400 text-xs text-center px-2">
                Click to upload
              </div>
            )}
          </div>
          <div className="flex-1 space-y-1">
            <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide">
              Photo
            </p>
            <p className="text-xs text-stone-400">Click the image to upload a new photo</p>
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
              defaultValue={partner.name}
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
              defaultValue={partner.role}
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
              defaultValue={partner.accent}
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
                defaultValue={partner.bio[i] ?? ""}
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
          {pending ? "Saving..." : `Save changes for ${partner.name}`}
        </button>
      </form>
    </div>
  );
}