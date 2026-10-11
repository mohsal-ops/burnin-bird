import type { PosMenu, PosMenuItem } from "./types";

// Pure: decide what a POS menu import would change, so the owner sees a
// preview before anything is written. Matching order:
//   1. an existing PosMenuMap link (posId → our Item)
//   2. same name (case/spacing-insensitive) → link it
//   3. otherwise "new" (only created if the owner ticks "add new items")
// We never delete our items: things missing from the POS are just listed.

export interface LocalItem {
  id: string;
  name: string;
  priceInCents: number;
  isAvailableForPurchase: boolean;
}

export type MenuAction =
  | { kind: "update"; itemId: string; pos: PosMenuItem; link: boolean; changes: string[] }
  | { kind: "same"; itemId: string; pos: PosMenuItem; link: boolean }
  | { kind: "create"; pos: PosMenuItem };

export interface MenuPlan {
  actions: MenuAction[];
  /** Our items the POS doesn't have (left untouched). */
  notInPos: LocalItem[];
  counts: { update: number; same: number; create: number; notInPos: number };
}

const norm = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim();

export function planMenuImport(menu: PosMenu, local: LocalItem[], links: { localId: string; posId: string }[]): MenuPlan {
  const byId = new Map(local.map((l) => [l.id, l]));
  const byName = new Map(local.map((l) => [norm(l.name), l]));
  const linked = new Map(links.map((m) => [m.posId, m.localId]));
  const used = new Set<string>();
  const actions: MenuAction[] = [];

  for (const pos of menu.items) {
    let target = linked.has(pos.posId) ? byId.get(linked.get(pos.posId)!) : undefined;
    let link = false;
    if (!target) {
      const n = byName.get(norm(pos.name));
      if (n && !used.has(n.id)) {
        target = n;
        link = true;
      }
    }
    if (!target) {
      actions.push({ kind: "create", pos });
      continue;
    }
    used.add(target.id);
    const changes: string[] = [];
    if (target.priceInCents !== pos.priceCents)
      changes.push(`price $${(target.priceInCents / 100).toFixed(2)} → $${(pos.priceCents / 100).toFixed(2)}`);
    if (target.isAvailableForPurchase !== pos.available) changes.push(pos.available ? "back in stock" : "sold out");
    actions.push(changes.length ? { kind: "update", itemId: target.id, pos, link, changes } : { kind: "same", itemId: target.id, pos, link });
  }

  const notInPos = local.filter((l) => !used.has(l.id));
  const count = (k: MenuAction["kind"]) => actions.filter((a) => a.kind === k).length;
  return { actions, notInPos, counts: { update: count("update"), same: count("same"), create: count("create"), notInPos: notInPos.length } };
}

export function slugify(s: string): string {
  return (
    s
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "item"
  );
}
