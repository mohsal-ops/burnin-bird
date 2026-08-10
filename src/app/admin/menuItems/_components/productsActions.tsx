"use client";

import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import {
  DeleteCategory,
  DeleteMenuItem,
  toglleAvalability,
  toglleFeaturing,
} from "../../_actions/products";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteOrder } from "../../orders/_actions/orders";

export function IsFeaturedOrNot({
  id,
  isProductFeatured
}: {
  id: string,
    isProductFeatured: boolean
}) {
  const router = useRouter()
  const [isPending, starTransition] = useTransition()
  return <DropdownMenuItem
    disabled={isPending}
    onClick={() => 
      starTransition(async () => {
        await toglleFeaturing(id, !isProductFeatured)
        router.refresh()
      })
    }
  >

    {isProductFeatured ? "X-featured" : "feature"}
    <div className=" font-medium text-muted-foreground block text-sm">{isProductFeatured ?'remove from most popular list':'make the product in the most popular list'}</div>
  </DropdownMenuItem>
}
export default function ActivateAndDesactivate({
  id,
  isAvailableForPurchase,
}: {
  id: string;
  isAvailableForPurchase: boolean;
  }) {
  const [isPending, starTransition] = useTransition()
  const router = useRouter()


  return (
    <DropdownMenuItem
      disabled={isPending}
      onClick={() => 
        starTransition(
          async () => {
            await toglleAvalability(id, !isAvailableForPurchase) 
            router.refresh()
          }
      )}
    >
      {isAvailableForPurchase ? "Desactivate" : "Activate"}
    </DropdownMenuItem>
  );
}

export function DeleteOrder({ id }: { id: string }) {
  const [isPendind, startTransition] = useTransition();
  return (
    <DropdownMenuItem
      disabled={isPendind}
      className=" w-full text-destructive rounded-sm h-8 hover:bg-red-500 hover:text-white hover:duration-200 text-sm text-start pl-2 "
      onClick={() =>
        startTransition(async () => {
          await deleteOrder(id);
        })
      }
    >
      Delete
    </DropdownMenuItem>
  );
}
export function DeleteItemComp({ id }: { id: string }) {
  const [isPendind, startTransition] = useTransition();
  return (
    <DropdownMenuItem
      disabled={isPendind}
      className=" w-full text-destructive rounded-sm h-8 hover:bg-red-500 hover:text-white hover:cursor-pointer hover:duration-200 text-sm text-start pl-2 "
      onClick={() =>
        startTransition(async () => {
          await DeleteMenuItem(id);
        })
      }
    >
      Delete
    </DropdownMenuItem>
  );
}

export function DeleteItemComp2({
  id,
  disabled,
}: {
  id: string;
  disabled: boolean;
}) {
  const [isPendind, startTransition] = useTransition();
  return (
    <DropdownMenuItem
      disabled={disabled || isPendind}
      className=" w-full text-destructive rounded-sm h-8 hover:bg-red-500 hover:text-white hover:duration-200 text-sm text-start pl-2 "
      onClick={() =>
        startTransition(async () => {
          await DeleteCategory(id);
        })
      }
    >
      Delete
    </DropdownMenuItem>
  );
}
