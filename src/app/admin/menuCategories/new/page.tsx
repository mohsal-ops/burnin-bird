import PageHeader from "../../_components/pageHeader";
import ProductForm from "./_components/productForm";

export default function New() {
  return (
    <div className="min-h-screen bg-stone-50 p-4 md:p-6">
      <div className="mx-auto w-full max-w-lg space-y-4">
        <PageHeader>Add Category</PageHeader>
        <ProductForm item={null} />
      </div>
    </div>
  );
}
