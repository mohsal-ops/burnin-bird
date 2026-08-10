// Replace SecondSection with this:
"use client";
import { MdKeyboardArrowRight } from "react-icons/md";
import { SITE_CONFIG } from "@/lib/siteConfig";
import { ProductSuspense } from "../Menu/_components/ProductSuspense";
import { Suspense, useRef } from "react";
import HomeFeaturedSkeleton from "../_skeletons/HomeFeaturedSkeleton";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import PageHeader from "./PageHeader";
import { ItemWithSides } from "../page";
import { CartItem } from "generated/prisma";



export function SecondSectionFeatured({
  products,
  cartItems,
}: {
  products: ItemWithSides[];
  cartItems: CartItem[];
}) {
  const scrollRef = useRef<HTMLDivElement>(null); // add: import { useRef } from "react";

    const scrollRight = () => {
    scrollRef.current?.scrollBy({ left: 320, behavior: "smooth" });
  };

  const scrollLeft = () => {
    scrollRef.current?.scrollBy({ left: -320, behavior: "smooth" });
  };

  return (
    <div className="flex-col space-y-3 p-3 sm:w-[85vw] w-full overflow-hidden">
      <div className="flex justify-between items-center">
        <PageHeader>Featured</PageHeader>
         <div className="flex items-center gap-2">
          {/* Left scroll button */}
          <button
            onClick={scrollLeft}
            aria-label="Scroll left"
            className="w-10 h-10 rounded-full border border-gray-300 bg-white
                       flex items-center justify-center
                       hover:bg-gray-50 transition-colors text-gray-600"
          >
            <MdKeyboardArrowRight className="rotate-180" size={20} />
          </button>

          {/* Right scroll button */}
          <button
            onClick={scrollRight}
            aria-label="Scroll right"
            className="w-10 h-10 rounded-full border border-gray-300 bg-white
                       flex items-center justify-center
                       hover:bg-gray-50 transition-colors text-gray-600"
          >
            <MdKeyboardArrowRight size={20} />
          </button>

          {/* View Menu button */}
          <Link href="/Menu">
            <Button size="lg" variant="outline" className="h-10 text-left">
              {SITE_CONFIG.menuCtaLabel}
            </Button>
          </Link>
        </div>
        
      </div>

      <div className="relative">
        {/* Scrollable row */}
        <div
          ref={scrollRef}
          className="grid grid-flow-col justify-start gap-2  w-full overflow-auto no-scrollbar"
        >
          <Suspense fallback={<><HomeFeaturedSkeleton /></>}>
            <ProductSuspense
              orderType={null}
              cartItems={cartItems}
              products={products}
            />
          </Suspense>
        </div>

        {/* Scroll-right arrow */}
        {/* <button
          onClick={scrollRight}
          aria-label="Scroll right"
          className="absolute right-2 top-1/2 -translate-y-1/2 z-10
                     flex items-center justify-center
                     w-10 h-10 rounded-full shadow-md
                     bg-brand text-black
                     hover:bg-brand-dark transition-colors"
        >
          <MdKeyboardArrowRight size={24} />
        </button> */}
      </div>

    </div>
  );
}

// export function SecondSection({
//   products,
//   cartItems,
// }: {
//   products: ItemWithSides[];
//   cartItems: CartItem[];
// }) {
//   const scrollRef = useRef<HTMLDivElement>(null);



//   return (
//     <div className="flex-col space-y-1 p-3 sm:w-[85vw] w-full overflow-hidden">
//       <div className="flex justify-between items-center">
//         <PageHeader>Featured</PageHeader>

       
    //   </div>

//       <div
//         ref={scrollRef}
//         className="grid grid-flow-col justify-start gap-8 w-full overflow-auto no-scrollbar"
//       >
//         <Suspense fallback={<><HomeFeaturedSkeleton /></>}>
//           <ProductSuspense
//             orderType={null}
//             cartItems={cartItems}
//             products={products}
//           />
//         </Suspense>
//       </div>
//     </div>
//   );
// }