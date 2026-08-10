import PageHeader from "../../_components/pageHeader";
import ProductForm from "./_components/productForm";
import getAllTypes from "@/app/admin/menuCategories/_action/gettypes";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ productId?: string }>;
}) {
  const { productId } = await searchParams;

  return (
    <div className="px-3">
      <ProductForm productId={productId} />
    </div>
  );
}
