import db from "@/db/db";
import ModifierGroupsManager from "../../new/_components/ModifierGroupsManager";

export default async function SidesGroupPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [item, allItems] = await Promise.all([
    db.item.findUnique({
      where: { id },
      include: {
        sideGroups: {
          orderBy: { order: "asc" },
          include: { options: { orderBy: { order: "asc" } } },
        },
      },
    }),
    db.item.findMany({
      where: { NOT: { id } },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  if (!item) return <div>Menu Item Not found</div>;

  return (
    <div className="flex flex-col gap-3 md:ml-44">
      <p className="text-3xl">{item.name} — Modifiers</p>
      <ModifierGroupsManager itemId={item.id} initialGroups={item.sideGroups} allItems={allItems} />
    </div>
  );
}
