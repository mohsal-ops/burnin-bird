import { ProductCardSkeleton } from "../_components/ProductCardServer";

export default function HomeFeaturedSkeleton() {
  return (
    <div className="w-[85%] space-y-5 animate-pulse">
      <div className="flex justify-between">
        <div className="h-6 w-32 bg-gray-200 rounded" />
        <div className="h-10 w-24 bg-gray-200 rounded" />
      </div>
      <div className="flex gap-4 overflow-hidden">
        <ProductCardSkeleton />
        <ProductCardSkeleton />
        <ProductCardSkeleton />
      </div>
    </div>
  );
}
