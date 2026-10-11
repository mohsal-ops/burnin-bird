import "server-only";
import db from "@/db/db";
import { getActiveConnection, loadContext } from "./connection";
import { planMenuImport, slugify, type MenuPlan } from "./menuPlan";
import { getAdapter } from "./registry";
import type { PosMenuItem, PosProvider } from "./types";

// Fetch the POS menu and preview / apply it. Prices + availability of matched
// items are updated; new items are only created when the owner asks.

async function fetchPlan(): Promise<{ provider: PosProvider; plan: MenuPlan }> {
  const conn = await getActiveConnection();
  if (!conn) throw new Error("No POS connected");
  const provider = conn.provider as PosProvider;
  const menu = await getAdapter(provider).importMenu(await loadContext(conn));
  const [local, links] = await Promise.all([
    db.item.findMany({ select: { id: true, name: true, priceInCents: true, isAvailableForPurchase: true } }),
    db.posMenuMap.findMany({ where: { provider, localType: "item" }, select: { localId: true, posId: true } }),
  ]);
  return { provider, plan: planMenuImport(menu, local, links) };
}

export async function previewMenuImport() {
  return fetchPlan();
}

async function uniqueSlug(base: string, taken: (s: string) => Promise<boolean>) {
  let s = slugify(base);
  for (let i = 2; await taken(s); i++) s = `${slugify(base)}-${i}`;
  return s;
}

async function createItem(provider: PosProvider, pos: PosMenuItem) {
  let type = await db.types.findFirst({ where: { name: { equals: pos.category, mode: "insensitive" } } });
  if (!type) {
    const slug = await uniqueSlug(pos.category, async (s) => !!(await db.types.findUnique({ where: { slug: s } })));
    type = await db.types.create({ data: { name: pos.category, slug } });
  }
  const slug = await uniqueSlug(pos.name, async (s) => !!(await db.item.findUnique({ where: { slug: s } })));
  const item = await db.item.create({
    data: {
      name: pos.name,
      description: pos.description ?? null,
      priceInCents: pos.priceCents,
      isAvailableForPurchase: pos.available,
      slug,
      typeId: type.id,
    },
  });
  for (const [i, g] of pos.modifierGroups.entries()) {
    const group = await db.sideGroup.create({
      data: { itemId: item.id, title: g.name, type: "EXTRA", required: g.required, maxSelect: g.maxSelect, order: i },
    });
    for (const [j, m] of g.modifiers.entries()) {
      const opt = await db.sideOption.create({
        data: { sideGroupId: group.id, label: m.name, priceInCents: m.priceCents || null, order: j },
      });
      await db.posMenuMap.create({ data: { provider, localType: "option", localId: opt.id, posId: m.posId } });
    }
  }
  return item.id;
}

export async function applyMenuImport(opts: { createNew: boolean }) {
  const { provider, plan } = await fetchPlan();
  let updated = 0;
  let created = 0;
  for (const a of plan.actions) {
    if (a.kind === "create") {
      if (!opts.createNew) continue;
      const id = await createItem(provider, a.pos);
      await db.posMenuMap.create({ data: { provider, localType: "item", localId: id, posId: a.pos.posId } });
      created++;
      continue;
    }
    if (a.link) {
      await db.posMenuMap.upsert({
        where: { provider_localType_localId: { provider, localType: "item", localId: a.itemId } },
        update: { posId: a.pos.posId },
        create: { provider, localType: "item", localId: a.itemId, posId: a.pos.posId },
      });
    }
    if (a.kind === "update") {
      await db.item.update({
        where: { id: a.itemId },
        data: { priceInCents: a.pos.priceCents, isAvailableForPurchase: a.pos.available },
      });
      updated++;
    }
  }
  await db.posConnection.update({ where: { provider }, data: { lastMenuSyncAt: new Date() } });
  return { updated, created, counts: plan.counts };
}
