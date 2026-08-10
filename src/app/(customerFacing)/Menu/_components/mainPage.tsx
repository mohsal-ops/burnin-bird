"use client";
import React, { Suspense, useEffect, useRef, useState } from "react";
import { FaLocationPin } from "react-icons/fa6";
import { SITE_CONFIG } from "@/lib/siteConfig";
import { PiMagnifyingGlass } from "react-icons/pi";
import { Button } from "@/components/ui/button";
import { AllDishesSuspense, PopularDishesSuspense } from "./ProductSuspense";
import PickupDetails from "../../_components/pickupTimeandDay";
import { ProductCardSkeleton } from "../../_components/ProductCardServer";
import { useCart } from "@/app/providers/CartProvider";
import { CartItem, Item, Location, Types } from "generated/prisma";
import { CarFrontIcon, StoreIcon } from "lucide-react";
import { ItemWithSides } from "../../page";
import { MdKeyboardArrowRight } from "react-icons/md";

type BusinessHourRow = { dayIndex: number; day: string; open: number | null; close: number | null };

type PropsTypes = {
  places: Location[];
  gategories: Types[];
  products: ItemWithSides[];
  featuredProducts: ItemWithSides[];
  hours: BusinessHourRow[];
} & React.HTMLAttributes<HTMLDivElement>;



const CATEGORY_ORDER = [
  "A LA Carte",
  "Dipping Sauces",
  "Entrees",
  "No Bones ",
  "Family Dinners",
  "Kid's Meal 12 & Under ",
  "Sides ",
  "Extras ",
  // any category not listed here will appear at the end
];



export default function MainPageMenu({
  featuredProducts,
  style,
  places,
  gategories,
  products,
  hours,
}: PropsTypes) {
  const [filtered, setfiltered] = useState<ItemWithSides[] | undefined>();
  // Default to pickup so ordering works out of the box; the toggle can switch to delivery.
  const [choice, setChoice] = useState<"delivery" | "pickup" | null>("pickup");
  const [query, setQuery] = useState("");
  const placeholderRef = useRef<HTMLDivElement | null>(null);
  const [isPinned, setIsPinned] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  // const [cartItems, setcartItems] = useState<CartItem[] | undefined>([])
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedAddress, setSelectedAddress] = useState<string | null>(null);
  const [open, setOpen] = useState<boolean>(false);
  const { cartItems, cartId, mutate } = useCart();
  const { isOpen, label } = getOpenStatus();

  function getOpenStatus() {
    const now = new Date(
      new Date().toLocaleString("en-US", { timeZone: "America/Chicago" }),
    );
    const day = now.getDay();
    const hour = now.getHours() + now.getMinutes() / 60;
    const todayHours = hours.find((h) => h.dayIndex === day) ?? { open: null, close: null };

    if (!todayHours.open || !todayHours.close)
      return { isOpen: false, label: "Closed today" };

    if (hour >= todayHours.open && hour < todayHours.close) {
      const closeHour = todayHours.close;
      const displayClose =
        closeHour >= 12
          ? `${closeHour > 12 ? closeHour - 12 : closeHour}:00 PM`
          : `${closeHour}:00 AM`;
      return { isOpen: true, label: `Open now · Closes ${displayClose}` };
    }

    const openHour = todayHours.open;
    const displayOpen =
      openHour >= 12
        ? `${openHour > 12 ? openHour - 12 : openHour}:00 PM`
        : `${openHour}:00 AM`;
    return { isOpen: false, label: `Closed · Opens ${displayOpen}` };
  }

  // Tracks the serachbar so it fiex it or un-fix it
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsPinned(!entry.isIntersecting);
      },
      { threshold: 0.3 },
    );

    if (placeholderRef.current) {
      observer.observe(placeholderRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // observ gategory position so it's button style will be changed

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveCategory(entry.target.id.replace("cat-", ""));
          }
        });
      },
      { threshold: 0.3 }, // triggers when 30% of section is visible
    );

    gategories?.forEach((cat) => {
      const el = document.getElementById(`cat-${cat.id}`);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [gategories]);

  // search filter function
  useEffect(() => {
    const filterFunction = () => {
      const filteredArray = query
        ? products?.filter((p) =>
            p.name.toLowerCase().includes(query.toLowerCase()),
          )
        : undefined;
      setfiltered(filteredArray);
    };

    filterFunction();
  }, [query]);

  useEffect(() => {
    // Only run when cartItems first become available
    if (cartItems && cartItems.length > 0 && !selectedDay && !selectedTime) {
      const Day = cartItems[0].pickupDay
        ? new Date(cartItems[0].pickupDay)
        : null;
      const time = cartItems[0].pickupTime;
      setSelectedDay(Day);
      setSelectedTime(time);

      const city = cartItems[0].deliveryAddress?.split(",")[1].trim();
      setSelectedAddress(city);
    }
  }, [cartItems]);

  const grouped = React.useMemo(() => {
    const sorted = [...gategories].sort((a, b) => {
      const aIndex = CATEGORY_ORDER.indexOf(a.name);
      const bIndex = CATEGORY_ORDER.indexOf(b.name);
      const aOrder = aIndex === -1 ? 999 : aIndex;
      const bOrder = bIndex === -1 ? 999 : bIndex;
      return aOrder - bOrder;
    });

    return sorted.map((category) => ({
      category,
      products: products.filter((p) => p.typeId === category.id),
    }));
  }, [gategories, products]);


  return (
    <div
      style={{ ...style }}
      className="flex flex-col md:flex-row gap-16 w-full lg:w-[80%] pt-20 "
    >
      <div className="relative hidden md:block w-2/12 py-5  ">
        <div id="desktop-search-categories" className="flex w-60 flex-col sticky top-24">
          <div className="flex  w-full justify-start items-center  border border-stone-300 rounded-xl outline-none focus-within:border-2 focus-within:border-black">
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
          <div className="flex flex-col py-2 font-bold gap-1  w-full ">
            {grouped &&
              grouped.map(({ category: cat }) => (
                <Button
                  key={cat.id}
                  onClick={() =>
                    document
                      .getElementById(`cat-${cat.id}`)
                      ?.scrollIntoView({ behavior: "smooth" })
                  }
                  className={`justify-start font-medium text-sm ${
                    activeCategory === cat.id
                      ? "bg-black text-white"
                      : "bg-transparent text-gray-600"
                  }`}
                  variant="ghost"
                >
                  {cat.name}
                </Button>
              ))}
          </div>
        </div>
      </div>
      <div className="md:w-9/12 w-full md:py-5 px-2 space-y-5 md:space-y-7 ">
        <div
          className="flex flex-col gap-2 md:items-start  items-center  font-bold  "
          id="name&address"
        >
          <p className="tracking-tight font-serif  text-xl text-center">
            {SITE_CONFIG.tagline}
          </p>
          <span className="flex text-sm space-x-2 justify-center sm:justify-start items-center font-semibold w-4/5 gap-1  text-neutral-600 text-center  ">
            <FaLocationPin className="md:block hidden" />
            <p>{SITE_CONFIG.address}</p>

            <p className="flex items-center gap-1.5 text-sm font-medium">
              <span
                className={`w-2 h-2 rounded-full underline ${
                  isOpen ? "bg-green-500" : "bg-red-500"
                }`}
              />
              <span
                className={`underline ${isOpen ? "text-green-600" : "text-red-500"}`}
              >
                {label}
              </span>
            </p>
          </span>
        </div>
        <div id="PickupOrDelivery" className="text-sm flex p-1">
          <div className="flex flex-col sm:flex-row w-full sm:w-1/2  gap-4 font-semibold text-gray-600">
            <div className="bg-stone-200 w-full shadow-sm sm:w-1/2 flex h-11 rounded-3xl overflow-hidden">
              <label className="cursor-pointer w-1/2 relative">
                <input
                  type="radio"
                  name="orderType"
                  value="delivery"
                  checked={choice === "delivery"}
                  onChange={() => setChoice("delivery")}
                  className="hidden peer"
                />
                <div className="h-full bg-stone-200 border  flex items-center justify-center rounded-3xl peer-checked:shadow-md peer-checked:border-gray-300 peer-checked:bg-white peer-checked:text-black transition">
                  Delivery
                </div>
              </label>
              <label className="cursor-pointer h-full relative w-1/2">
                <input
                  type="radio"
                  name="orderType"
                  value="pickup"
                  checked={choice === "pickup"}
                  onChange={() => setChoice("pickup")}
                  className="hidden peer"
                />
                <div className=" h-full bg-stone-200 border  flex items-center justify-center rounded-3xl peer-checked:shadow-md peer-checked:border-gray-300 peer-checked:bg-white peer-checked:text-black transition">
                  Pickup
                </div>
              </label>
            </div>
            <Button
              variant="outline"
              onClick={() => setOpen(true)}
              className="w-full sm:w-2/3 h-11 text-sm rounded-lg hover:bg-stone-200 shadow-xs justify-between"
            >
              {choice === "pickup" ? (
                selectedDay != null || selectedTime != null ? (
                  <div className="flex items-center gap-2">
                    <StoreIcon size={17} />
                    <h1>{selectedDay?.toDateString()}</h1>{" "}
                    <h1>{selectedTime}</h1>
                  </div>
                ) : (
                  "Schedule pickup"
                )
              ) : selectedDay != null || selectedTime != null ? (
                <div className="flex items-center gap-2">
                  <CarFrontIcon size={17} />
                  <h1>{"Delivery to " + selectedAddress}</h1>
                </div>
              ) : (
                "Select delivery location"
              )}
              <span>▼</span>
            </Button>
          </div>
        </div>
        <div ref={placeholderRef} id="popularDishes">
          <h2 className="text-xl font-semibold font-serif ">Popular</h2>
          {featuredProducts && featuredProducts?.length > 0 ? (
            <PopularDishes
              choice={choice}
              cartItems={cartItems}
              Poularproducts={featuredProducts}
            />
          ) : (
            <p className="text-gray-500 text-center ">No products found</p>
          )}
        </div>
        <div
          id="SearchBar&gategories"
          className={
            isPinned
              ? "fixed top-20  right-0 left-0  z-50 md:hidden transform p-2 -translate-y-20 duration-500  bg-white flex gap-2 flex-col "
              : "md:hidden py-2 translate-y-0 duration-500 z-50 flex gap-2 flex-col"
          }
        >
          <div className="flex pl-1 w-full justify-start items-center  bg-white border rounded-xl outline-none focus-within:border-2 focus-within:border-black">
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
          <div className="flex items-center gap-2 overflow-auto">
            {grouped &&
              grouped.map(({ category: cat }) => (
                <Button
                  key={cat.id}
                  onClick={() =>
                    document
                      .getElementById(`cat-${cat.id}`)
                      ?.scrollIntoView({ behavior: "smooth" })
                  }
                  className={`font-medium text-sm ${
                    activeCategory === cat.id
                      ? "bg-black text-white"
                      : "bg-transparent text-gray-600"
                  }`}
                  variant="outline"
                >
                  {cat.name}
                </Button>
              ))}
          </div>
        </div>

        <div id="Products" className="min-h-56 ">
          {filtered && filtered.length > 0 ? (
            <AllDishes
              choice={choice}
              cartItems={cartItems}
              Products={filtered}
            />
          ) : query ? (
            <span className="text-gray-500 text-center  ">
              No products found
            </span>
          ) : (
            grouped?.map((Category) => (
              <section
                key={Category.category.id}
                className="space-y-1 mb-8"
                id={`cat-${Category?.category?.id}`}
              >
                <h2 className="text-xl font-semibold font-serif ">
                  {Category.category.name}
                </h2>
                <AllDishes
                  choice={choice}
                  cartItems={cartItems}
                  Products={Category.products}
                />
              </section>
            ))
          )}
        </div>
      </div>
      <PickupDetails orderType={choice} open={open} onOpenChange={setOpen} />
    </div>
  );
}

export function PopularDishes({
  cartItems,
  Poularproducts,
  choice,
}: {
  cartItems: CartItem[];
  Poularproducts: ItemWithSides[] | undefined;
  choice: "pickup" | "delivery" | null;
}) {
  const products = Poularproducts;
  const scrollRef = useRef<HTMLDivElement>(null); // add: import { useRef } from "react";

  const scrollRight = () => {
    scrollRef.current?.scrollBy({ left: 320, behavior: "smooth" });
  };
  return (
    <div className="flex-col space-y-6  w-full ">
      <div className="relative">
        <div
          ref={scrollRef}
          className=" grid grid-flow-col justify-start gap-2 w-full no-scrollbar overflow-auto z-0  py-2"
        >
          <Suspense
            fallback={
              <>
                <ProductCardSkeleton />
                <ProductCardSkeleton />
                <ProductCardSkeleton />
              </>
            }
          >
            <PopularDishesSuspense
              orderType={choice}
              cartItems={cartItems}
              products={products}
            />
          </Suspense>
          {/* Scroll-right arrow */}
          <button
            onClick={scrollRight}
            aria-label="Scroll right"
            className="absolute right-2 top-1/2 -translate-y-1/2 z-50
                             flex items-center justify-center
                             w-10 h-10 rounded-full shadow-md
                             bg-brand text-white
                             hover:bg-brand-dark transition-colors"
          >
            <MdKeyboardArrowRight size={24} />
          </button>
        </div>
      </div>
    </div>
  );
}

export function AllDishes({
  cartItems,
  Products,
  choice,
}: {
  cartItems: CartItem[];
  Products: ItemWithSides[];
  choice: "pickup" | "delivery" | null;
}) {
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
          <AllDishesSuspense
            orderType={choice}
            cartItems={cartItems}
            products={Products}
          />
        </Suspense>
      </div>
    </div>
  );
}
