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
import { CheckCircle2, MoreVertical, Plus, UtensilsCrossed, XCircle } from "lucide-react";
import ActivateAndDesactivate, {
  DeleteItemComp,
  IsFeaturedOrNot,
} from "./_components/productsActions";

export default async function Items() {
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

        {/* Table card */}
        <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
          {data.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-stone-100 bg-stone-50 text-left text-xs font-semibold uppercase tracking-wider text-stone-500">
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Name</th>
                    <th className="px-5 py-3">Price</th>
                    <th className="px-5 py-3">Category</th>
                    <th className="w-0 px-5 py-3">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {data.map((obj) => (
                    <tr key={obj?.id} className="transition-colors hover:bg-stone-50/70">
                      <td className="px-5 py-3">
                        {obj?.isAvailableForPurchase ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700">
                            <CheckCircle2 size={13} /> Available
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-600">
                            <XCircle size={13} /> Unavailable
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2 font-medium text-stone-800">
                          {obj?.name}
                          {obj?.featured && (
                            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700">
                              Featured
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3 font-semibold text-stone-900">
                        {formatCurrency(obj?.priceInCents / 100)}
                      </td>
                      <td className="px-5 py-3">
                        <span className="inline-block rounded-md bg-stone-100 px-2.5 py-1 text-xs font-medium text-stone-600">
                          {obj?.typename}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-700">
                            <span className="sr-only">Actions</span>
                            <MoreVertical size={16} />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
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
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
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
    </div>
  );
}
