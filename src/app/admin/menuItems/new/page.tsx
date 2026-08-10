import PageHeader from "../../_components/pageHeader";
import ProductForm from "./_components/productForm";
import getAllTypes from "@/app/admin/menuCategories/_action/gettypes";

export default async function New() {
  const types = await getAllTypes();

  return (
    <div className="px-3 ">
      <ProductForm item={null} types={types} />
    </div>
  );
}
