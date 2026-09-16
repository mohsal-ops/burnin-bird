import { Button } from "@/components/ui/button";
import PageHeader from "../_components/pageHeader";
import Link from "next/link";
import db from "@/db/db";
import { formatCurrency } from "@/lib/formatters";
import { DropdownMenu } from "@radix-ui/react-dropdown-menu";
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Plus, UtensilsCrossed, Star } from "lucide-react";
import ActivateAndDesactivate, {
  DeleteItemComp,
  IsFeaturedOrNot,
} from "./_components/productsActions";
import { getAccess } from "@/lib/getAccess";
import PreviewSectionNote from "../_components/PreviewSectionNote";
import { StatusPill } from "../_components/pos";
import { cn } from "@/lib/utils";

export default async function Items() {
  const access = await getAccess();
  const items = await db.item?.findMany();
  const itemAndTypeFunction = async (items: any[]) => {
    return await Promise.all(
      items.map(async (item) => {
        const category = await db.types.findUnique({
          where: { id: item.typeId },
          select: { name: true },
        });

        return {
          ...item,
          typename: category?.name || "Unknown", // Handle case where category is not found
        };
      }),
    );
  };
  const data = await itemAndTypeFunction(items);

  return (
    <div className="lg:flex justify-center">
      <div className="w-full lg:w-[80%] p-4 md:p-6 space-y-5">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <PageHeader>Menu Items</PageHeader>
            <p className="mt-1 text-sm text-stone-500">
              {data.length} item{data.length === 1 ? "" : "s"} on your menu
            </p>
          </div>
          <Link href="/admin/menuItems/new">
            <Button variant="mainButton" size="md" className="gap-1.5">
              <Plus size={16} /> Add item
            </Button>
          </Link>
        </div>

        {access.mode === "preview" && (
          <PreviewSectionNote>
            Every order placed through your own menu skips the 15–30% commission
            DoorDash and Uber Eats take that margin and it stays with you.
          </PreviewSectionNote>
        )}

        {/* Menu items as a POS grid of image tiles: photo, name, price - tap to
            edit. The "..." menu (feature, availability, sides, delete) sits on
            top of the tile, outside the edit link, so it never triggers a nav. */}
        {data.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {data.map((obj) => (
              <div
                key={obj?.id}
                className="group relative overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
              >
                <Link href={`/admin/menuItems/${obj.id}/edit`} className="block">
                  {/* Photo */}
                  <div className="relative aspect-[4/3] bg-stone-100">
                    {obj?.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={obj.image}
                        alt={obj.name}
                        className={cn(
                          "h-full w-full object-cover",
                          !obj?.isAvailableForPurchase && "opacity-50 grayscale",
                        )}
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-stone-300">
                        <UtensilsCrossed size={34} />
                      </div>
                    )}
                    {/* Availability status - shared POS tone language */}
                    <div className="absolute left-2 top-2">
                      <StatusPill tone={obj?.isAvailableForPurchase ? "live" : "off"}>
                        {obj?.isAvailableForPurchase ? "On" : "Off"}
                      </StatusPill>
                    </div>
                    {obj?.featured && (
                      <div className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-800">
                        <Star size={11} className="fill-amber-500 text-amber-500" /> Featured
                      </div>
                    )}
                  </div>
                  {/* Name + price (number-forward) */}
                  <div className="p-3">
                    <p className="truncate font-semibold text-stone-800">{obj?.name}</p>
                    <div className="mt-1 flex items-center justify-between gap-2">
                      <span className="text-lg font-extrabold tabular-nums tracking-tight text-stone-900">
                        {formatCurrency(obj?.priceInCents / 100)}
                      </span>
                      <span className="truncate rounded-md bg-stone-100 px-2 py-0.5 text-[11px] font-medium text-stone-500">
                        {obj?.typename}
                      </span>
                    </div>
                  </div>
                </Link>
                {/* Actions - kept outside the edit Link */}
                <div className="absolute right-2 top-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger className="grid size-9 place-items-center rounded-lg bg-white/90 text-stone-600 shadow-sm ring-1 ring-stone-200 backdrop-blur transition-colors hover:bg-white hover:text-stone-900">
                      <span className="sr-only">Actions</span>
                      <MoreVertical size={16} />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="admin-shell">
                      <IsFeaturedOrNot id={obj?.id} isProductFeatured={obj?.featured} />
                      <ActivateAndDesactivate
                        id={obj?.id}
                        isAvailableForPurchase={obj?.isAvailableForPurchase}
                      />
                      <DropdownMenuItem asChild>
                        <Link href={`/admin/menuItems/${obj.id}/edit`}>Edit</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/admin/menuItems/${obj.id}/sidesGroup`}>Add Sides</Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DeleteItemComp id={obj?.id} />
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-stone-200 bg-white px-6 py-16 text-center shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-stone-100 text-stone-400">
              <UtensilsCrossed size={22} />
            </div>
            <div>
              <p className="font-semibold text-stone-800">No menu items yet</p>
              <p className="mt-1 text-sm text-stone-500">
                Add your first item, or load a sample menu to try the ordering flow.
              </p>
            </div>
            <Link href="/admin/menuItems/new">
              <Button variant="mainButton" size="md" className="gap-1.5">
                <Plus size={16} /> Add item
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
