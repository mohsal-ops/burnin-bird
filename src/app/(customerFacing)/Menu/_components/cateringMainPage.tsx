'use client'
import React, { Suspense, useEffect, useState } from 'react'
import { PiMagnifyingGlass } from 'react-icons/pi'
import { Button } from '@/components/ui/button'
import { AllDishesSuspense, PopularDishesSuspense } from '../_components/ProductSuspense'
import { GetFeaturedProducts, GetGategories } from '../_actions/getDataNeeded'
import { ProductCardSkeleton } from '../../_components/ProductCardServer'
import { useCart } from '@/app/providers/CartProvider'
import { CartItem, Item, Types } from 'generated/prisma'
import { ItemWithSides } from '../../page'


type PropsTypes = {
    gategories: Types[],
    products: ItemWithSides[],

} & React.HTMLAttributes<HTMLDivElement>

export default function CateringMainPage({ style, gategories, products }: PropsTypes) {
    const [choice, setChoice] = useState<"delivery" | "pickup" | null>("pickup");
    const [query, setQuery] = useState("");
    const { cartItems } = useCart();
console.log(choice)

    const [activeCategory, setActiveCategory] = useState<string | null>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setActiveCategory(entry.target.id.replace("cat-", ""));
                    }
                });
            },
            { threshold: 0.3 } // triggers when 30% of section is visible
        );

        gategories?.forEach((cat) => {
            const el = document.getElementById(`cat-${cat.id}`);
            if (el) observer.observe(el);
        });

        return () => observer.disconnect();
    }, [gategories]);






    const grouped = gategories?.map((category) => ({
        category: { ...category },
        products: products.filter((p) => p.typeId === category.id),
    }));

    return (
        <div className='flex flex-col md:flex-row gap-16 w-full lg:w-[80%] pt-20'>
            <div className='relative hidden md:block w-2/12 py-5  '>
                <div id="SearchBar&gategories" className='flex w-60 flex-col fixed'>
                    <div className='flex  w-full justify-start items-center  border border-stone-300 rounded-xl outline-none focus-within:border-2 focus-within:border-black'>
                        {/* Search Input */}
                        <PiMagnifyingGlass fontSize={21} className="mx-2" />

                        <input
                            type="text"
                            placeholder="Search Menu..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            className="w-full md:rounded-lg rounded-full py-2 outline-none "
                        />
                    </div>
                    <div className='flex flex-col py-2 font-bold gap-1  w-full '>
                        {gategories && (
                            gategories.map((cat) => (
                                <Button
                                    key={cat.id}

                                    onClick={() =>
                                        document.getElementById(`cat-${cat.id}`)?.scrollIntoView({ behavior: "smooth" })
                                    }
                                    className={`justify-start font-medium text-sm ${activeCategory === cat.id ? "bg-black text-white" : "bg-transparent text-gray-600"
                                        }`}
                                    variant="ghost"
                                >
                                    {cat.name}
                                </Button>
                            ))

                        )}

                    </div>
                </div>
            </div>
            <div className='md:w-9/12 w-full md:py-5 px-3 space-y-5 md:space-y-7'>
                <div className='flex flex-col gap-2 md:items-start  items-center  font-bold  ' id="name&address">
                    <p className='tracking-tight font-serif  text-xl text-center'>Burgers, Breakfast, Pizza & Daily Specials</p>
                </div>
                <div id="PickupOrDelivery " className='text-xs flex  bg-stone-200 rounded-3xl p'>
                    <div className="flex w-full justify-between  gap-4 font-semibold text-gray-600">
                        {/* Delivery */}
                        <label className="cursor-pointer w-1/2 relative">
                            <input
                                type="radio"
                                name="orderType"
                                value="delivery"
                                checked={choice === "delivery"}
                                onChange={() => setChoice("delivery")}
                                className="hidden peer"
                            />
                            <div className=" h-10 bg-stone-200 border  flex items-center justify-center  rounded-3xl peer-checked:shadow-md peer-checked:border-gray-300 peer-checked:bg-white peer-checked:text-black transition">
                                Delivery
                            </div>
                        </label>

                        {/* Pickup */}
                        <label className="cursor-pointer w-1/2 relative ">
                            <input
                                type="radio"
                                name="orderType"
                                value="pickup"
                                checked={choice === "pickup"}
                                onChange={() => setChoice("pickup")}
                                className="hidden peer"
                            />
                            <div className=" h-10 bg-stone-200 border  flex items-center justify-center  rounded-3xl peer-checked:shadow-md peer-checked:border-gray-300 peer-checked:bg-white peer-checked:text-black transition">
                                Pickup
                            </div>
                        </label>
                    </div>
                </div>
                <div id="SearchBar&gategories" className='md:hidden sticky top-0 py-2 bg-white z-50 flex gap-2 flex-col'>
                    <div className='flex pl-1 w-full justify-start items-center  bg-white border rounded-xl outline-none focus-within:border-2 focus-within:border-black'>
                        {/* Search Input */}
                        <PiMagnifyingGlass fontSize={21} className="ml-1" />

                        <input
                            type="text"
                            placeholder="Search Menu..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            className="w-full md:rounded-lg rounded-full p-2 outline-none "
                        />
                    </div>
                    <div className='flex items-center gap-2 overflow-auto'>
                        {gategories && (
                            gategories.map((cat) => (
                                <Button
                                    key={cat.id}
                                    onClick={() =>
                                        document.getElementById(`cat-${cat.id}`)?.scrollIntoView({ behavior: "smooth" })
                                    }
                                    className={`font-medium text-sm ${activeCategory === cat.id ? "bg-black text-white" : "bg-transparent text-gray-600"
                                        }`}
                                    variant="outline"
                                >
                                    {cat.name}
                                </Button>))
                        )}
                    </div>
                </div>

                <div id="Products">
                    <AllDishes orderType={null} cartItems={cartItems}  Products={products} />

                </div>
            </div>

        </div>
    )
}



export function AllDishes({ cartItems ,Products, orderType }: {cartItems:CartItem[],  Products: ItemWithSides[], orderType: string | null }) {

    return (
        <div className="flex space-y-6  w-full">
            <div className="grid grid-cols-1 md:grid-cols-2  gap-4 w-full py-2">
                <Suspense
                    fallback={
                        <>
                            <ProductCardSkeleton />
                            <ProductCardSkeleton />
                            <ProductCardSkeleton />
                        </>
                    }
                >
                    <AllDishesSuspense orderType={null} cartItems={cartItems}  products={Products} />
                </Suspense>
            </div>
        </div>

    )
}

