import { ProductCardSkeleton } from "../_components/ProductCardServer";

export default function LoadingMenu() {
  return (
    <div className="flex flex-col md:flex-row gap-16 w-full lg:w-[80%] pt-20 animate-pulse">

      {/* Left categories */}
      <div className="hidden md:block w-2/12 space-y-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-10 rounded-xl bg-gray-200" />
        ))}
      </div>

      {/* Main content */}
      <div className="md:w-9/12 w-full space-y-6 px-2">

        {/* Title */}
        <div className="space-y-2">
          <div className="h-6 w-2/3 bg-gray-200 rounded" />
          <div className="h-4 w-1/3 bg-gray-200 rounded" />
        </div>

        {/* Popular */}
        <div className="space-y-3">
          <div className="h-5 w-32 bg-gray-200 rounded" />
          <div className="flex gap-4 overflow-hidden">
            <ProductCardSkeleton />
            <ProductCardSkeleton />
            <ProductCardSkeleton />
          </div>
        </div>

        {/* Products */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(6)].map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>

      </div>
    </div>
  );
}
