"use client";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/formatters";
import Image from "next/image";
import fallbackImg from "/public/Image-fallback.png";
import React, { useState } from "react";
import SchedulePickupDialog, {
  SideGroupWithOptions,
} from "./schedualePickupModal";
import { CartItem } from "../../../../generated/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

type productObjectPath = {
  id: string;
  name: string;
  priceInCents: number;
  description: string | "";
  image: string | null;
  cartItems: CartItem[];
  sideGroups: SideGroupWithOptions[];
  orderType: "pickup" | "delivery" | null;
};

export default function ProductCardClient({
  id,
  name,
  priceInCents,
  image,
}: productObjectPath) {
  return (
    <Link href={`/Menu`} className="group flex w-44 shrink-0 flex-col gap-2 p-2 rounded-2xl sm:w-60">
      <Card
        className="relative aspect-square w-full overflow-hidden rounded-2xl"
        key={id}
      >
        <CardContent className="relative h-full w-full p-0">
          <div className="relative h-full w-full overflow-hidden">
            <Image
              src={image ? image : fallbackImg}
              fill
              alt={name}
              sizes="(max-width: 768px) 60vw, 240px"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          </div>
        </CardContent>
      </Card>
      <div className="flex flex-col gap-0.5 px-1 font-semibold">
        <p className="line-clamp-2 min-h-[2.5rem] leading-tight">{name}</p>
        <p className="text-neutral-600">{formatCurrency(priceInCents / 100)}</p>
      </div>
    </Link>
  );
}

export function PopularDishesCardClient({
  id,
  name,
  description,
  priceInCents,
  image,
  sideGroups,
  orderType,
}: productObjectPath) {
  const [open, setOpen] = useState(false);
  const ProductInfos = {
    id,
    name,
    priceInCents,
    description,
    image,
    sideGroups,
  };

  return (
    <div className="group flex w-44 shrink-0 flex-col gap-2 p-2 rounded-2xl sm:w-48">
      <Card
        className="relative aspect-square w-full overflow-hidden rounded-2xl"
        key={id}
      >
        <CardContent className="relative h-full w-full p-0">
          <div className="relative h-full w-full overflow-hidden">
            <Image
              src={image ? image : fallbackImg}
              fill
              alt={name}
              sizes="(max-width: 768px) 60vw, 240px"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          </div>

          <div className="absolute bottom-2 right-2 z-20">
            <Button
              onClick={() => setOpen(true)}
              variant="outline"
              className="h-9 w-9 rounded-full p-0 bg-white shadow-md hover:bg-stone-100"
            >
              <Plus className="stroke-2" size={20} />
            </Button>
          </div>
        </CardContent>
      </Card>
      <div className="flex flex-col gap-0.5 px-1 font-semibold">
        <p className="line-clamp-2 min-h-[2.5rem] leading-tight">{name}</p>
        <p className="text-neutral-600">{formatCurrency(priceInCents / 100)}</p>
      </div>
      <SchedulePickupDialog
        orderType={orderType}
        product={ProductInfos}
        open={open}
        onOpenChange={setOpen}
      />
    </div>
  );
}

export function AllDishesCardClient({
  id,
  name,
  priceInCents,
  description,
  image,
  sideGroups,
  orderType,
}: productObjectPath) {
  const [open, setOpen] = useState(false);
  const ProductInfos = {
    id,
    name,
    priceInCents,
    description,
    image,
    sideGroups,
  };

  return (
    <div className="group flex w-full md:space-x-0 space-x-2 md:rounded-2xl md:border border-y border-gray-200 md:p-0 p-2 transition-colors duration-200 hover:border-gray-300">
      <div
        className={`flex py-3 flex-col justify-center gap-1 md:px-4 px-2 text-lg tracking-tight font-semibold ${image ? " w-3/5" : "w-full "}`}
      >
        <p>{name}</p>
        <p className="text-gray-500 text-sm font">
          {description?.split(" ").slice(0, 15).join(" ")}
          {(description?.split(" ").length ?? 0) > 15 && "..."}
        </p>
        <p className="text-gray-600 font-bold text-sm">
          {formatCurrency(priceInCents / 100)}
        </p>
      </div>
      <Card
        className={`flex md:rounded-l-none rounded-2xl overflow-hidden gap-5 md:h-50 h-36 flex-col  ${image ? " md:w-1/2 w-2/5" : "w-16 "} `}
        key={id}
      >
      
        <CardContent className="flex items-end relative h-full p-0 w-full text-center ">
          <div className="relative top-0 h-full w-full overflow-hidden">
            {image && (
              <Image
                src={image}
                fill
                alt={name}
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 400px"
              />
            )}
          </div>
          <div className="absolute bottom-0 z-20 flex justify-end w-full p-3 ">
            <div className="flex gap-2 items-center  ">
              <Button
                onClick={() => setOpen(true)}
                variant="outline"
                className="w-10 h-10 "
              >
                <Plus className="stroke-1" size={28} />
              </Button>
            </div>
          </div> 
        </CardContent>
      </Card>
      <SchedulePickupDialog
        orderType={orderType}
        product={ProductInfos}
        open={open}
        onOpenChange={setOpen}
      />
    </div>
  );
}
