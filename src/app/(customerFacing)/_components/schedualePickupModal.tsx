"use client";
import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import Image from "next/image";
import { formatCurrency } from "@/lib/formatters";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { DialogTrigger } from "@radix-ui/react-dialog";
import { useCart } from "@/app/providers/CartProvider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Prisma } from "generated/prisma";
import { PickupDetailsContent } from "./pickupTimeandDay";

/* ---------------- Types ---------------- */

export type SideGroupWithOptions = Prisma.SideGroupGetPayload<{
  include: {
    options: true;
  };
}>;

type Product = {
  id: string;
  name: string;
  priceInCents: number;
  description: string | null;
  image: string | null;
  sideGroups: SideGroupWithOptions[];
};

/* ---------------- UI Steps ---------------- */

// function PickupDetails({ onNext }: { onNext: () => void }) {
//   return (
//     <div className="flex flex-col gap-6">
//       <div className="bg-stone-200 w-full shadow-sm sm:w-1/2 flex h-11 rounded-3xl overflow-hidden">
//               <label className="cursor-pointer w-1/2 relative">
//                 <input
//                   type="radio"
//                   name="orderType"
//                   value="delivery"
//                   checked={choice === "delivery"}
//                   onChange={() => setChoice("delivery")}
//                   className="hidden peer"
//                 />

//                 <div className="h-full bg-stone-200 border  flex items-center justify-center rounded-3xl peer-checked:shadow-md peer-checked:border-gray-300 peer-checked:bg-white peer-checked:text-black transition">
//                   Delivery
//                 </div>
//               </label>

//               {/* Pickup */}
//               <label className="cursor-pointer h-full relative w-1/2">
//                 <input
//                   type="radio"
//                   name="orderType"
//                   value="pickup"
//                   checked={choice === "pickup"}
//                   onChange={() => setChoice("pickup")}
//                   className="hidden peer"
//                 />
//                 <div className=" h-full bg-stone-200 border  flex items-center justify-center rounded-3xl peer-checked:shadow-md peer-checked:border-gray-300 peer-checked:bg-white peer-checked:text-black transition">
//                   Pickup
//                 </div>
//               </label>
//             </div>

//       <p className="text-center text-sm text-muted-foreground">
//         📍 The Wagon Wheel | Texas BBQ in Eagle Pass
//       </p>
//     </div>
//   );
// }

/* ---------------- Add Product Card ---------------- */

function AddProductCard({
  product,
  quantity,
  setQuantity,
  selectedSides,
  setSelectedSides,
  invalidGroupIds,
  finalPrice,
}: {
  product: Product;
  quantity: number;
  setQuantity: React.Dispatch<React.SetStateAction<number>>;
  selectedSides: Record<string, string[]>;
  setSelectedSides: React.Dispatch<
    React.SetStateAction<Record<string, string[]>>
  >;
  invalidGroupIds: string[];
  finalPrice: number;
}) {
  // Required groups first (DoorDash order), then by the owner-set display order.
  const isReq = (g: SideGroupWithOptions) => g.type === "SIDE" || g.required;
  const ord = (x: { order?: number }) => x.order ?? 0;
  const orderedGroups = [...product.sideGroups].sort((a, b) => {
    const r = (isReq(a) ? 0 : 1) - (isReq(b) ? 0 : 1);
    return r !== 0 ? r : ord(a) - ord(b);
  });
  return (
    <div className="animate-in fade-in-50 duration-300">
      <div className="border rounded-2xl shadow-sm p-4 space-y-4 bg-white">
        <div>
          <h3 className="text-lg font-semibold">{product.name}</h3>
          {product.description && (
            <p className="text-gray-500 text-sm font">{product.description}</p>
          )}
          <p className="text-sm text-muted-foreground">
            {formatCurrency(product.priceInCents / 100)}
          </p>
        </div>

        {product.image && (
          <div className="relative flex w-full h-72 items-center gap-4">
            <Image
              priority
              src={product.image}
              alt="product image"
              fill
              className="object-cover  w-full h-full rounded-lg"
            />
          </div>
        )}

        {/* Quantity */}
        <div className="flex items-center justify-between">
          <Label className="font-medium">Quantity</Label>
          <div className="flex items-center border rounded-lg">
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setQuantity((prev) => (prev > 1 ? prev - 1 : 1))}
            >
              -
            </Button>
            <span className="px-3">{quantity}</span>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setQuantity((prev) => prev + 1)}
            >
              +
            </Button>
          </div>
        </div>

        {/* Side Groups */}
        {orderedGroups.map((group) => {
          const isSide = group.type === "SIDE";
          const isRequired = isSide || group.required;
          const selCount = selectedSides[group.id]?.length ?? 0;
          const isSatisfied = selCount > 0;
          const atCap = !!group.maxSelect && selCount >= group.maxSelect;
          const isInvalid = invalidGroupIds.includes(group.id);
          const opts = [...group.options].sort((a, b) => ord(a) - ord(b));
          return (
          <div
            key={group.id}
            className={`space-y-2 rounded-lg transition-colors ${
              isInvalid ? "border border-red-500 bg-red-50 p-2 animate-shake" : ""
            }`}
          >
            <div>
              <p className="font-medium">
                {group.title}
                {!isRequired && (
                  <span className="ml-1 text-sm font-normal text-muted-foreground">
                    (Optional)
                  </span>
                )}
              </p>
              <p
                className={`text-xs font-medium ${
                  isRequired
                    ? isSatisfied
                      ? "text-green-600"
                      : "text-red-600"
                    : "text-muted-foreground"
                }`}
              >
                {isRequired ? "Required" : "Optional"}
                {group.maxSelect ? ` · Select up to ${group.maxSelect}` : ""}
              </p>
            </div>


            {/* RADIO (Spice) */}
            {group.maxSelect === 1 ? (
              <RadioGroup
                value={selectedSides[group.id]?.[0]}
                onValueChange={(val) =>
                  setSelectedSides((prev) => ({
                    ...prev,
                    [group.id]: [val],
                  }))
                }
              >
                {opts.map((opt) => (
                  <div
                    key={opt.id}
                    className="flex items-center justify-between border-b py-3"
                  >
                    <Label className="flex items-center gap-3">
                      <RadioGroupItem value={opt.id} />
                      {opt.label}
                    </Label>
                    {opt.priceInCents ? (
                      <span className="text-xs text-muted-foreground ml-2">
                        +{formatCurrency(opt.priceInCents / 100)}
                      </span>
                    ) : null}
                  </div>
                ))}
              </RadioGroup>
            ) : (
              /* CHECKBOX (multi-select, capped at maxSelect) */
              opts.map((opt) => {
                const checked =
                  selectedSides[group.id]?.includes(opt.id) ?? false;
                const disabled = atCap && !checked;

                return (
                  <div
                    key={opt.id}
                    className={`flex items-center justify-between border-b py-3 ${
                      disabled ? "opacity-40" : "cursor-pointer"
                    }`}
                    onClick={() => {
                      if (disabled) return;
                      setSelectedSides((prev) => {
                        const current = prev[group.id] || [];
                        let next = current;

                        if (current.includes(opt.id)) {
                          next = current.filter((id) => id !== opt.id);
                        } else {
                          if (
                            group.maxSelect &&
                            current.length >= group.maxSelect
                          )
                            return prev;
                          next = [...current, opt.id];
                        }

                        return { ...prev, [group.id]: next };
                      });
                    }}
                  >
                    <Label className="flex items-center gap-3">
                      <Checkbox checked={checked} disabled={disabled} />
                      {opt.label}
                    </Label>

                    {opt.priceInCents ? (
                      <span className="text-xs text-muted-foreground ml-2">
                        +{formatCurrency(opt.priceInCents / 100)}
                      </span>
                    ) : null}
                  </div>
                );
              })
            )}
          </div>
        )})}

        <div className="flex items-center justify-between pt-3 border-t">
          <span className="font-semibold">Total</span>
          <span className="font-semibold text-lg">
            {formatCurrency((finalPrice * quantity) / 100)}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Main Dialog ---------------- */

export default function SchedulePickupDialog({
  open,
  onOpenChange,
  product,
  orderType
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product;
  orderType: "pickup" | "delivery" | null
}) {
  const [step, setStep] = useState<"details" | "addCard">("details");
  const [quantity, setQuantity] = useState(1);
  const [selectedSides, setSelectedSides] = useState<Record<string, string[]>>(
    {},
  );
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [TimeExist, setTimeExist] = useState<boolean>(false);
  const [invalidGroupIds, setInvalidGroupIds] = useState<string[]>([]);

  const router = useRouter();
  const { cartId, mutate, cartItems } = useCart();

  useEffect(() => {
    if (cartItems && cartItems.length > 0) {
      const Day = cartItems[0].pickupDay; // convert string -> Date
      const time = cartItems[0].pickupTime;
      setSelectedDay(Day);
      setSelectedTime(time);
      setTimeExist(true);
    }
  }, [cartItems, selectedDay]);

  useEffect(() => {
    if (TimeExist) setStep("addCard");
  }, [TimeExist]);

  const calculateSidesTotal = () => {
    let total = 0;

    for (const group of product.sideGroups) {
      const selected = selectedSides[group.id] || [];

      for (const optId of selected) {
        const option = group.options.find((o) => o.id === optId);
        if (option?.priceInCents) {
          total += option.priceInCents;
        }
      }
    }

    return total;
  };
  const sidesTotal = calculateSidesTotal();
  const finalPrice = product.priceInCents + sidesTotal;

  const getMissingRequiredGroupIds = () =>
    product.sideGroups
      .filter((group) => group.type === "SIDE" || group.required)
      .filter((group) => (selectedSides[group.id]?.length ?? 0) === 0)
      .map((group) => group.id);

  const handleAddToCart = async () => {
    // The button is disabled while required groups are unsatisfied; guard anyway.
    if (getMissingRequiredGroupIds().length > 0) return;

    setIsLoading(true);
    try {
      const res = await fetch("/api/cart/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          name: product.name,
          image: product.image,
          price: finalPrice,
          pickupDay: selectedDay,
          pickupTime: selectedTime,
          quantity,
          sides: selectedSides,
        }),
      });

      const data = await res.json();
      await mutate(["/api/cart/get", cartId]);
      router.refresh();
      toast(data.message);
      onOpenChange(false);
    } catch {
      toast("Failed to add to cart");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger />
      <DialogContent className="flex flex-col justify-between max-h-[95vh]">
        {step === "addCard" && (
          <DialogHeader className="p-2">
            <DialogTitle>Add to Cart</DialogTitle>
          </DialogHeader>
        )}

        <div className="flex-1 h-full overflow-auto px-2">
          {step === "details" && (
            <PickupDetailsContent
              orderType={orderType}
              onComplete={() => setStep("addCard")}
            />
          )}

          {step === "addCard" && (
            <AddProductCard
              product={product}
              quantity={quantity}
              setQuantity={setQuantity}
              selectedSides={selectedSides}
              setSelectedSides={setSelectedSides}
              invalidGroupIds={invalidGroupIds}
              finalPrice={finalPrice}
            />
          )}
        </div>

        <DialogFooter className="p-3">
          {step === "addCard" &&
            (() => {
              const missingCount = getMissingRequiredGroupIds().length;
              const totalStr = formatCurrency((finalPrice * quantity) / 100);
              return (
                <Button
                  size="md"
                  variant="mainButton"
                  className="w-full"
                  onClick={handleAddToCart}
                  disabled={isLoading || missingCount > 0}
                >
                  {isLoading
                    ? "Adding..."
                    : missingCount > 0
                      ? `Make ${missingCount} required selection${
                          missingCount > 1 ? "s" : ""
                        } - ${totalStr}`
                      : `Add to Cart · ${totalStr}`}
                </Button>
              );
            })()}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
