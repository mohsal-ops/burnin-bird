import { ProductCardSkeleton } from "./_components/ProductCardServer";

export default function HomeLoading() {
  return (
    <div className="pt-20 w-full  flex flex-col gap-20 items-center animate-pulse">

      {/* HERO */}
      <div className="w-[85%] h-[70vh] bg-gray-200 rounded-3xl" />

      {/* FEATURED */}
      <div className="w-[85%] space-y-6">
        <div className="h-8 w-40 bg-gray-200 rounded" />
        <div className="flex gap-4 overflow-hidden">
          <ProductCardSkeleton />
          <ProductCardSkeleton />
          <ProductCardSkeleton />
        </div>
      </div>

      {/* BIG IMAGE SECTION */}
      <div className="w-[85%] h-100 bg-gray-200 rounded-3xl" />

      {/* REVIEWS */}
      <div className="grid md:grid-cols-3 gap-6 w-[85%]">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-48 bg-gray-200 rounded-2xl" />
        ))}
      </div>

      {/* MAP */}
      <div className="w-[85%] h-75 bg-gray-200 rounded-3xl" />

    </div>
  );
}
