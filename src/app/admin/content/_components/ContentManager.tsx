"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ExternalLink } from "lucide-react";
import { updateSiteText } from "../_actions/contentActions";

type Text = {
  headline: string;
  subheadline: string;
  feature1Title: string;
  feature1Desc: string;
  feature2Title: string;
  feature2Desc: string;
};

const inputCls =
  "w-full rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-stone-300";

function Field(props: {
  label: string;
  value: string;
  placeholder?: string;
  area?: boolean;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-stone-600">{props.label}</label>
      {props.area ? (
        <textarea
          rows={3}
          value={props.value}
          placeholder={props.placeholder}
          onChange={(e) => props.onChange(e.target.value)}
          className={inputCls}
        />
      ) : (
        <input
          type="text"
          value={props.value}
          placeholder={props.placeholder}
          onChange={(e) => props.onChange(e.target.value)}
          className={inputCls}
        />
      )}
    </div>
  );
}

export default function ContentManager({ initial, defaults }: { initial: Text; defaults: Text }) {
  const [v, setV] = useState<Text>(initial);
  const [saving, start] = useTransition();
  const set = (k: keyof Text) => (val: string) => setV((prev) => ({ ...prev, [k]: val }));

  const save = () =>
    start(async () => {
      const res = await updateSiteText({
        home_headline: v.headline,
        home_subheadline: v.subheadline,
        text_feature1_title: v.feature1Title,
        text_feature1_desc: v.feature1Desc,
        text_feature2_title: v.feature2Title,
        text_feature2_desc: v.feature2Desc,
      });
      if (res.ok) toast.success("Content updated");
      else toast.error(res.error ?? "Failed to save");
    });

  return (
    <div className="space-y-6 px-4 md:px-0">
      <a
        href="/"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-xs font-medium text-[#c85a1e] hover:underline"
      >
        Preview the home page
        <ExternalLink size={12} />
      </a>

      <div className="space-y-4 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <div>
          <h2 className="font-semibold text-stone-800">Home hero</h2>
          <p className="text-sm text-stone-500">The big headline at the very top of the home page.</p>
        </div>
        <Field label="Headline" value={v.headline} placeholder={defaults.headline} onChange={set("headline")} />
        <Field label="Subheadline" value={v.subheadline} placeholder={defaults.subheadline} onChange={set("subheadline")} />
      </div>

      <div className="space-y-4 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <div>
          <h2 className="font-semibold text-stone-800">Feature 1</h2>
          <p className="text-sm text-stone-500">First highlighted section on the home page.</p>
        </div>
        <Field label="Title" value={v.feature1Title} placeholder={defaults.feature1Title} onChange={set("feature1Title")} />
        <Field area label="Description" value={v.feature1Desc} placeholder={defaults.feature1Desc} onChange={set("feature1Desc")} />
      </div>

      <div className="space-y-4 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <div>
          <h2 className="font-semibold text-stone-800">Feature 2</h2>
          <p className="text-sm text-stone-500">Second highlighted section on the home page.</p>
        </div>
        <Field label="Title" value={v.feature2Title} placeholder={defaults.feature2Title} onChange={set("feature2Title")} />
        <Field area label="Description" value={v.feature2Desc} placeholder={defaults.feature2Desc} onChange={set("feature2Desc")} />
      </div>

      <p className="px-1 text-xs text-stone-400">Leave a field blank to use the built-in default (shown as the greyed-out hint).</p>

      <Button variant="mainButton" disabled={saving} onClick={save}>
        {saving ? "Saving..." : "Save content"}
      </Button>
    </div>
  );
}
