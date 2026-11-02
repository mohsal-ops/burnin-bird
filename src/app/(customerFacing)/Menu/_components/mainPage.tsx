"use client";
import React, { Suspense, useEffect, useRef, useState } from "react";
import { FaLocationPin } from "react-icons/fa6";
import { SITE_CONFIG } from "@/lib/siteConfig";
import { atLeast, tierOf } from "@/lib/packages";
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
  /** Owner has Uber Direct delivery on (Delivery settings). */
  deliveryOn?: boolean;
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
  deliveryOn = false,
}: PropsTypes) {
  const [filtered, setfiltered] = useState<ItemWithSides[] | undefined>();
  // Delivery is a Standard+ tier capability; Starter sites are pickup-only.
  // tierOf() defaults a tier-less (pre-tiers) siteConfig to PRO, so existing
  // clients that get new template code but keep their old siteConfig keep delivery.
  // Delivery IS Uber Direct, so it also needs the owner's Delivery setting on -
  // otherwise customers could pick a delivery no courier will ever fulfil.
  const deliveryAllowed = atLeast(tierOf(SITE_CONFIG), "STANDARD") && deliveryOn;
  // Default to pickup so ordering works out of the box; the toggle can switch to delivery.
  const [choice, setChoice] = useState<"delivery" | "pickup" | null>("pickup");
  const [query, setQuery] = useState("");
  const placeholderRef = useRef<HTMLDivElement | null>(null);
  const railRef = useRef<HTMLDivElement | null>(null);
  const chipRowRef = useRef<HTMLDivElement | null>(null);
  const [railFade, setRailFade] = useState({ top: false, bottom: false });
  const updateRailFades = () => {
    const el = railRef.current;
    if (!el) return;
    setRailFade({
      top: el.scrollTop > 4,
      bottom: el.scrollTop + el.clientHeight < el.scrollHeight - 4,
    });
  };
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
  // Deep links like /Menu#cat-<id> (the homepage category tags): wait for that
  // category to render, then glide to it below the fixed nav.
  useEffect(() => {
    const id = window.location.hash.slice(1);
    if (!id.startsWith("cat-")) return;
    let tries = 0;
    const t = setInterval(() => {
      const el = document.getElementById(id);
      if (el || ++tries > 40) {
        clearInterval(t);
        if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 110, behavior: "smooth" });
      }
    }, 100);
    return () => clearInterval(t);
  }, []);

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

  // Follow the page: keep the active category visible inside the desktop rail
  // and the phone chip row (scrolls only those boxes, never the page).
  useEffect(() => {
    if (!activeCategory) return;
    const rail = railRef.current;
    const chip = rail?.querySelector<HTMLElement>(`[data-cat="${activeCategory}"]`);
    if (rail && chip) {
      const top = chip.offsetTop - rail.clientHeight / 2 + chip.clientHeight / 2;
      rail.scrollTo({ top, behavior: "smooth" });
    }
    const row = chipRowRef.current;
    const pill = row?.querySelector<HTMLElement>(`[data-cat="${activeCategory}"]`);
    if (row && pill) {
      const left = pill.offsetLeft - row.clientWidth / 2 + pill.clientWidth / 2;
      row.scrollTo({ left, behavior: "smooth" });
    }
  }, [activeCategory]);

  useEffect(() => {
    updateRailFades();
    window.addEventListener("resize", updateRailFades);
    return () => window.removeEventListener("resize", updateRailFades);
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
        {/* Sticky rail that never grows past the screen: search stays put and
            the category list scrolls on its own (with soft fades), so a long
            menu doesn't make you scroll the whole page to reach the last ones. */}
        <div
          id="desktop-search-categories"
          className="sv-cat-rail flex w-60 flex-col sticky top-24 max-h-[calc(100dvh-7.5rem)]"
        >
          <div className="flex shrink-0 w-full justify-start items-center  border border-border rounded-xl outline-none focus-within:border-2 focus-within:border-ring">
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
          <div className="sv-cat-rail-head flex shrink-0 items-center justify-between px-3 pt-4 pb-1 text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
            <span>Categories</span>
            <span className="tabular-nums">{grouped.length}</span>
          </div>
          <div className="relative flex min-h-0 flex-1 flex-col">
            <div
              ref={railRef}
              onScroll={updateRailFades}
              className="sv-cat-rail-list min-h-0 flex-1 overflow-y-auto overscroll-contain flex flex-col py-2 pr-1 font-bold gap-1 w-full"
            >
              {grouped &&
                grouped.map(({ category: cat, products: items }) => (
                  <Button
                    key={cat.id}
                    data-cat={cat.id}
                    data-active={activeCategory === cat.id ? "1" : undefined}
                    onClick={() =>
                      document
                        .getElementById(`cat-${cat.id}`)
                        ?.scrollIntoView({ behavior: "smooth" })
                    }
                    className={`sv-rail-chip group shrink-0 justify-between gap-2 font-medium text-sm transition-all duration-200 ${
                      activeCategory === cat.id
                        ? "bg-foreground text-background hover:bg-foreground hover:text-background"
                        : "bg-transparent text-muted-foreground hover:translate-x-0.5"
                    }`}
                    variant="ghost"
                  >
                    <span className="truncate">{cat.name}</span>
                    <span
                      className={`sv-rail-count rounded-full px-2 py-0.5 text-[11px] tabular-nums transition-colors ${
                        activeCategory === cat.id
                          ? "bg-background/15 text-background"
                          : "bg-muted text-muted-foreground group-hover:text-foreground"
                      }`}
                    >
                      {items.length}
                    </span>
                  </Button>
                ))}
            </div>
            <div
              aria-hidden
              style={{ background: "linear-gradient(to bottom, var(--rail-bg), transparent)" }}
              className={`pointer-events-none absolute inset-x-0 top-0 h-8 transition-opacity duration-300 ${railFade.top ? "opacity-100" : "opacity-0"}`}
            />
            <div
              aria-hidden
              style={{ background: "linear-gradient(to top, var(--rail-bg) 35%, transparent)" }}
              className={`pointer-events-none absolute inset-x-0 bottom-0 flex h-12 items-end justify-center transition-opacity duration-300 ${railFade.bottom ? "opacity-100" : "opacity-0"}`}
            >
              <button
                type="button"
                onClick={() => railRef.current?.scrollBy({ top: 160, behavior: "smooth" })}
                className="pointer-events-auto mb-1 grid h-7 w-7 animate-bounce place-items-center rounded-full bg-foreground text-background shadow-md"
                aria-label="More categories"
              >
                <MdKeyboardArrowRight className="rotate-90" />
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="md:w-9/12 w-full md:py-5 px-2 space-y-5 md:space-y-7 ">
        <div
          className="sv-menu-head flex flex-col gap-2 md:items-start  items-center  font-bold  "
          id="name&address"
        >
          <p className="tracking-tight font-serif  text-xl text-center">
            {SITE_CONFIG.tagline}
          </p>
          <span className="flex text-sm space-x-2 justify-center sm:justify-start items-center font-semibold w-4/5 gap-1  text-muted-foreground text-center  ">
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
          <div className="flex flex-col sm:flex-row w-full sm:w-1/2  gap-4 font-semibold text-muted-foreground">
            {/* Pickup/Delivery toggle - only on Standard+ tiers. Starter is pickup-only. */}
            {deliveryAllowed && (
            <div className="bg-muted w-full shadow-sm sm:w-1/2 flex h-11 rounded-3xl overflow-hidden">
              <label className="cursor-pointer w-1/2 relative">
                <input
                  type="radio"
                  name="orderType"
                  value="delivery"
                  checked={choice === "delivery"}
                  onChange={() => setChoice("delivery")}
                  className="hidden peer"
                />
                <div className="h-full bg-muted border  flex items-center justify-center rounded-3xl peer-checked:shadow-md peer-checked:border-border peer-checked:bg-background peer-checked:text-foreground transition">
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
                <div className=" h-full bg-muted border  flex items-center justify-center rounded-3xl peer-checked:shadow-md peer-checked:border-border peer-checked:bg-background peer-checked:text-foreground transition">
                  Pickup
                </div>
              </label>
            </div>
            )}
            <Button
              variant="outline"
              onClick={() => setOpen(true)}
              className="w-full sm:w-2/3 h-11 text-sm rounded-lg hover:bg-accent shadow-xs justify-between"
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
            <p className="text-muted-foreground text-center ">No products found</p>
          )}
        </div>
        <div
          id="SearchBar&gategories"
          className={
            isPinned
              ? "sv-menu-catbar fixed top-20  right-0 left-0  z-50 md:hidden transform p-2 -translate-y-20 duration-500  bg-background flex gap-2 flex-col "
              : "sv-menu-catbar md:hidden py-2 translate-y-0 duration-500 z-50 flex gap-2 flex-col"
          }
        >
          <div className="flex pl-1 w-full justify-start items-center  bg-background border rounded-xl outline-none focus-within:border-2 focus-within:border-ring">
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
          <div ref={chipRowRef} className="relative flex items-center gap-2 overflow-auto no-scrollbar scroll-smooth">
            {grouped &&
              grouped.map(({ category: cat }) => (
                <Button
                  key={cat.id}
                  data-cat={cat.id}
                  onClick={() =>
                    document
                      .getElementById(`cat-${cat.id}`)
                      ?.scrollIntoView({ behavior: "smooth" })
                  }
                  data-active={activeCategory === cat.id ? "1" : undefined}
                  className={`sv-cat-chip font-medium text-sm ${
                    activeCategory === cat.id
                      ? "bg-foreground text-background"
                      : "bg-transparent text-muted-foreground"
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
            <span className="text-muted-foreground text-center  ">
              No products found
            </span>
          ) : (
            grouped?.map((Category) => (
              <section
                key={Category.category.id}
                className="sv-menu-section space-y-1 mb-8"
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
