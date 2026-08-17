import db from "@/db/db"
import ProductForm from "../../new/_components/productForm"
import getAllTypes from "@/app/admin/menuCategories/_action/gettypes";
import ModifierGroupsManager from "../../new/_components/ModifierGroupsManager";

export default async function Edit({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [types, item, allItems] = await Promise.all([
    getAllTypes(),
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

  return (
    <div className="flex flex-col gap-6 md:ml-44">
      <div className="flex flex-col gap-3">
        <p className="text-3xl">Edit Product</p>
        <ProductForm item={item} types={types} />
      </div>
      {item && (
        <ModifierGroupsManager
          itemId={item.id}
          initialGroups={item.sideGroups}
          allItems={allItems}
        />
      )}
    </div>
  )
}
