"use client";

// Generic per-item modifier editor: add / edit / remove / reorder groups and
// their options. Owner-facing, so the raw SideGroupType enum is hidden behind a
// plain-English "kind" picker; behaviour on the customer side is driven by the
// `required` toggle + `maxSelect`, not the enum. Saves the full ordered set via
// saveItemModifiers (delete-all-then-recreate). Reorder uses up/down arrows, the
// same pattern as the reviews/categories admin lists.
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { ArrowUp, ArrowDown, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";
import { saveItemModifiers } from "@/app/admin/_actions/products";

type Kind = "extras" | "recommended" | "no";
const KIND_LABEL: Record<Kind, string> = {
  extras: "Choice / extras",
  recommended: "Recommended items",
  no: "Remove ingredients",
};
const KIND_TO_TYPE: Record<Kind, "EXTRA" | "RECOMMENDED" | "NO"> = {
  extras: "EXTRA",
  recommended: "RECOMMENDED",
  no: "NO",
};
function typeToKind(type: string): Kind {
  if (type === "RECOMMENDED") return "recommended";
  if (type === "NO") return "no";
  return "extras"; // EXTRA / SPICE / SIDE all present as "Choice / extras"
}

type WOption = { key: string; label: string; price: string; linkedItemId: string };
type WGroup = {
  key: string;
  title: string;
  kind: Kind;
  required: boolean;
  maxSelect: string; // "" = unlimited
  options: WOption[];
};

type InitialGroup = {
  id: string;
  title: string;
  type: string;
  required: boolean;
  maxSelect: number | null;
  options: {
    id: string;
    label: string;
    priceInCents: number | null;
    linkedItemId: string | null;
  }[];
};

let keySeq = 0;
const nextKey = () => `k${keySeq++}`;
const blankOption = (): WOption => ({ key: nextKey(), label: "", price: "", linkedItemId: "" });

function fromInitial(groups: InitialGroup[]): WGroup[] {
  return groups.map((g) => ({
    key: nextKey(),
    title: g.title,
    kind: typeToKind(g.type),
    required: g.required,
    maxSelect: g.maxSelect == null ? "" : String(g.maxSelect),
    options: g.options.length
      ? g.options.map((o) => ({
          key: nextKey(),
          label: o.label,
          price: o.priceInCents == null ? "" : (o.priceInCents / 100).toString(),
          linkedItemId: o.linkedItemId ?? "",
        }))
      : [blankOption()],
  }));
}

export default function ModifierGroupsManager({
  itemId,
  initialGroups,
  allItems,
}: {
  itemId: string;
  initialGroups: InitialGroup[];
  allItems: { id: string; name: string }[];
}) {
  const [groups, setGroups] = useState<WGroup[]>(() => fromInitial(initialGroups));
  const [pending, start] = useTransition();

  // ── group mutators ──
  const addGroup = () =>
    setGroups((p) => [
      ...p,
      { key: nextKey(), title: "", kind: "extras", required: false, maxSelect: "", options: [blankOption()] },
    ]);
  const removeGroup = (gi: number) => setGroups((p) => p.filter((_, i) => i !== gi));
  const moveGroup = (gi: number, dir: -1 | 1) =>
    setGroups((p) => {
      const j = gi + dir;
      if (j < 0 || j >= p.length) return p;
      const n = [...p];
      [n[gi], n[j]] = [n[j], n[gi]];
      return n;
    });
  const patchGroup = (gi: number, patch: Partial<WGroup>) =>
    setGroups((p) => p.map((g, i) => (i === gi ? { ...g, ...patch } : g)));

  // ── option mutators ──
  const addOption = (gi: number) =>
    setGroups((p) => p.map((g, i) => (i === gi ? { ...g, options: [...g.options, blankOption()] } : g)));
  const removeOption = (gi: number, oi: number) =>
    setGroups((p) => p.map((g, i) => (i === gi ? { ...g, options: g.options.filter((_, k) => k !== oi) } : g)));
  const moveOption = (gi: number, oi: number, dir: -1 | 1) =>
    setGroups((p) =>
      p.map((g, i) => {
        if (i !== gi) return g;
        const j = oi + dir;
        if (j < 0 || j >= g.options.length) return g;
        const o = [...g.options];
        [o[oi], o[j]] = [o[j], o[oi]];
        return { ...g, options: o };
      }),
    );
  const patchOption = (gi: number, oi: number, patch: Partial<WOption>) =>
    setGroups((p) =>
      p.map((g, i) =>
        i === gi ? { ...g, options: g.options.map((o, k) => (k === oi ? { ...o, ...patch } : o)) } : g,
      ),
    );

  // ── validation (mirrors the server action) ──
  const errors: string[] = [];
  groups.forEach((g, i) => {
    const real = g.options.filter((o) => o.label.trim());
    if (!g.title.trim()) errors.push(`Group ${i + 1} needs a title.`);
    if (g.required && real.length === 0)
      errors.push(`"${g.title.trim() || `Group ${i + 1}`}" is required but has no options.`);
  });
  const valid = errors.length === 0;

  const save = () => {
    if (!valid) {
      toast.error(errors[0]);
      return;
    }
    const payload = groups.map((g, gi) => ({
      title: g.title.trim(),
      type: KIND_TO_TYPE[g.kind],
      required: g.required,
      maxSelect: g.maxSelect.trim() === "" ? null : Math.max(1, parseInt(g.maxSelect, 10) || 1),
      order: gi,
      options: g.options
        .filter((o) => o.label.trim())
        .map((o, oi) => {
          const n = parseFloat(o.price);
          return {
            label: o.label.trim(),
            priceInCents: o.price.trim() === "" || !Number.isFinite(n) ? null : Math.round(n * 100),
            linkedItemId: o.linkedItemId || null,
            order: oi,
          };
        }),
    }));
    start(async () => {
      const res = await saveItemModifiers(itemId, payload);
      if (res && "error" in res && res.error) toast.error(res.error);
      else toast.success("Modifiers saved.");
    });
  };

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
      <div className="mb-1 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-stone-900">Modifiers</h2>
          <p className="text-sm text-stone-500">
            Choices and add-ons customers pick when ordering this item.
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={addGroup} className="gap-1.5 shrink-0">
          <Plus size={15} /> Add group
        </Button>
      </div>

      {groups.length === 0 && (
        <p className="mt-4 rounded-xl bg-stone-50 px-4 py-6 text-center text-sm text-stone-500">
          No modifier groups yet. Add one — e.g. a required &ldquo;Choose a sauce&rdquo; or optional
          &ldquo;Add extras&rdquo;.
        </p>
      )}

      <div className="mt-4 space-y-5">
        {groups.map((g, gi) => (
          <div key={g.key} className="rounded-xl border border-stone-200 bg-stone-50/60 p-4">
            {/* group header */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex flex-col">
                <button
                  type="button"
                  aria-label="Move group up"
                  onClick={() => moveGroup(gi, -1)}
                  disabled={gi === 0}
                  className="text-stone-400 hover:text-stone-700 disabled:opacity-30"
                >
                  <ArrowUp size={16} />
                </button>
                <button
                  type="button"
                  aria-label="Move group down"
                  onClick={() => moveGroup(gi, 1)}
                  disabled={gi === groups.length - 1}
                  className="text-stone-400 hover:text-stone-700 disabled:opacity-30"
                >
                  <ArrowDown size={16} />
                </button>
              </div>
              <Input
                value={g.title}
                onChange={(e) => patchGroup(gi, { title: e.target.value })}
                placeholder="Group title (e.g. Choose a sauce)"
                className="min-w-[180px] flex-1 bg-white"
              />
              <Select value={g.kind} onValueChange={(v) => patchGroup(gi, { kind: v as Kind })}>
                <SelectTrigger className="w-[170px] bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(KIND_LABEL) as Kind[]).map((k) => (
                    <SelectItem key={k} value={k}>
                      {KIND_LABEL[k]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <button
                type="button"
                aria-label="Remove group"
                onClick={() => removeGroup(gi)}
                className="ml-auto text-stone-400 hover:text-red-600"
              >
                <Trash2 size={17} />
              </button>
            </div>

            {/* group settings */}
            <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2">
              <label className="flex items-center gap-2 text-sm text-stone-700">
                <Switch checked={g.required} onCheckedChange={(v) => patchGroup(gi, { required: v })} />
                Required
              </label>
              <label className="flex items-center gap-2 text-sm text-stone-700">
                Max selections
                <Input
                  type="number"
                  min={1}
                  value={g.maxSelect}
                  onChange={(e) => patchGroup(gi, { maxSelect: e.target.value })}
                  placeholder="∞"
                  className="w-20 bg-white"
                />
                <span className="text-xs text-stone-400">blank = no limit</span>
              </label>
            </div>

            {/* options */}
            <div className="mt-3 space-y-2">
              {g.options.map((o, oi) => (
                <div key={o.key} className="flex flex-wrap items-center gap-2">
                  <div className="flex flex-col">
                    <button
                      type="button"
                      aria-label="Move option up"
                      onClick={() => moveOption(gi, oi, -1)}
                      disabled={oi === 0}
                      className="text-stone-300 hover:text-stone-600 disabled:opacity-30"
                    >
                      <ArrowUp size={13} />
                    </button>
                    <button
                      type="button"
                      aria-label="Move option down"
                      onClick={() => moveOption(gi, oi, 1)}
                      disabled={oi === g.options.length - 1}
                      className="text-stone-300 hover:text-stone-600 disabled:opacity-30"
                    >
                      <ArrowDown size={13} />
                    </button>
                  </div>
                  <Input
                    value={o.label}
                    onChange={(e) => patchOption(gi, oi, { label: e.target.value })}
                    placeholder="Option label"
                    className="min-w-[140px] flex-1 bg-white"
                  />
                  <div className="flex items-center gap-1">
                    <span className="text-sm text-stone-400">$</span>
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      value={o.price}
                      onChange={(e) => patchOption(gi, oi, { price: e.target.value })}
                      placeholder="Free"
                      className="w-24 bg-white"
                    />
                  </div>
                  <Select
                    value={o.linkedItemId || "none"}
                    onValueChange={(v) => patchOption(gi, oi, { linkedItemId: v === "none" ? "" : v })}
                  >
                    <SelectTrigger className="w-[150px] bg-white text-xs">
                      <SelectValue placeholder="Link item" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No linked item</SelectItem>
                      {allItems.map((it) => (
                        <SelectItem key={it.id} value={it.id}>
                          {it.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <button
                    type="button"
                    aria-label="Remove option"
                    onClick={() => removeOption(gi, oi)}
                    className="text-stone-300 hover:text-red-600"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => addOption(gi)}
                className="gap-1.5 text-[#c85a1e]"
              >
                <Plus size={14} /> Add option
              </Button>
            </div>
          </div>
        ))}
      </div>

      {errors.length > 0 && (
        <ul className="mt-4 list-inside list-disc rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {errors.map((e, i) => (
            <li key={i}>{e}</li>
          ))}
        </ul>
      )}

      <div className="mt-5 flex justify-end">
        <Button type="button" variant="mainButton" onClick={save} disabled={!valid || pending}>
          {pending ? "Saving…" : "Save modifiers"}
        </Button>
      </div>
    </div>
  );
}
