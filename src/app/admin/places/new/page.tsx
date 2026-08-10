import PageHeader from "../../_components/pageHeader";
import ProductForm from "./_components/productForm";

export default function New() {
  return (
    <div className="p-2">
      <PageHeader>add new</PageHeader>
      <ProductForm item={null} />
    </div>
  );
}
