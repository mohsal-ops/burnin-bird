import React from 'react'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CartItem } from '../../../../generated/prisma';
import ProductCardClient, { AllDishesCardClient, PopularDishesCardClient } from './productCardClient';
import { SideGroupWithOptions } from './schedualePickupModal';

type productObjectPath = {
    id: string;
    name: string;
    priceInCents: number;
    description: string | null ;
    image: string | null ;
    cartItems: CartItem[]
    sideGroups: SideGroupWithOptions[]
    orderType: "pickup" | "delivery" | null
};



export default function ProductCardServer({ id, name, priceInCents, description, image, cartItems, sideGroups, orderType }: productObjectPath) {
  return (
    <ProductCardClient
      id={id}
      name={name}
      priceInCents={priceInCents}
      description={!description ? "": description}
      image={image}
      cartItems={cartItems}
      sideGroups={sideGroups}
      orderType={orderType}
    />
  );
}



export function PopularDishesCardServer({ id, name, priceInCents, description, image, cartItems, sideGroups, orderType }: productObjectPath) {
  return (
    <PopularDishesCardClient
      id={id}
      name={name}
      priceInCents={priceInCents}
      description={!description ? "": description}
      image={image}
      cartItems={cartItems}
      sideGroups={sideGroups}
      orderType={orderType}
    />
  );
}

export function AllDishesCardServer({ id, name, priceInCents, description, image, cartItems, sideGroups, orderType }: productObjectPath) {  return (
    <AllDishesCardClient
      id={id}
      name={name}
      priceInCents={priceInCents}
      description={!description ? "": description}
      image={image}
      cartItems={cartItems}
      sideGroups={sideGroups}
      orderType={orderType}
    />
  );
}



export function ProductCardSkeleton() {
  return (
    <Card className="overflow-hidden flex gap-4 p-4 animate-pulse">
      <div className="w-24 h-24 rounded-xl bg-gray-300 shrink-0" />
      <div className="flex-1 space-y-3">
        <div className="h-4 w-3/4 bg-gray-300 rounded" />
        <div className="h-3 w-1/2 bg-gray-300 rounded" />
      </div>
    </Card>
  );
}
