// Applies the owner-chosen category order (a JSON array of category ids saved in
// the "category_order" SiteSetting) to a list of categories. Categories that
// aren't in the saved order keep their original relative position, placed after
// the ordered ones. Storing the order in SiteSetting means no DB migration.
export function applyCategoryOrder<T extends { id: string }>(
  types: T[],
  orderJson: string,
): T[] {
  let orderIds: string[] = [];
  try {
    const parsed = JSON.parse(orderJson || "[]");
    if (Array.isArray(parsed)) orderIds = parsed.filter((x): x is string => typeof x === "string");
  } catch {
    orderIds = [];
  }
  const rank = new Map(orderIds.map((id, i) => [id, i]));
  return types
    .map((t, i) => ({ t, i }))
    .sort((a, b) => {
      const ra = rank.has(a.t.id) ? rank.get(a.t.id)! : Number.MAX_SAFE_INTEGER;
      const rb = rank.has(b.t.id) ? rank.get(b.t.id)! : Number.MAX_SAFE_INTEGER;
      return ra !== rb ? ra - rb : a.i - b.i;
    })
    .map(({ t }) => t);
}
