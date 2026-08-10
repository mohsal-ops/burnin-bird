import db from "@/db/db"
import ProductForm from "../../new/_components/productForm"
import getAllTypes from "@/app/admin/menuCategories/_action/gettypes";

export default async function Edit({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [ types , item] = await Promise.all([
     getAllTypes(),
     db.item.findUnique({
    where: { id }, 
  })])

  return (
    <div className="flex flex-col gap-3 md:ml-44">
      <p className="text-3xl">Edit Product</p>
      <ProductForm item={item} types={types} />
    </div>
  )
}
