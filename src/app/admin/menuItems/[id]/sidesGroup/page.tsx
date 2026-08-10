import db from "@/db/db";
import SidesGroupBuilder from "../../new/_components/addSidesForm";

export default async function SidesGroupPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {

  const { id } = await params;

  const item = await db.item.findUnique({
    where: { id: id },
    include: { sideGroups: true },
  });

  const sides = await db.types.findUnique({
    where: { slug: "sides-" },
    include: { items: true },
  })

  if (!item) return <div>Menu Item Not found</div>;


  return (
    <div className="flex flex-col gap-3 md:ml-44">
      <p className="text-3xl">Add Sides</p>
      <SidesGroupBuilder itemId={id} name={item.name} item={item.sideGroups} sideItems={sides?.items || []} />
    </div>
  );
}
