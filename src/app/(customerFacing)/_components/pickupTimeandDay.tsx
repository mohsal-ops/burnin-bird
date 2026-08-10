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

import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useCart } from "@/app/providers/CartProvider";
import HereAutocomplete from "@/lib/HereAutocomplete";
import { getAvailableTimeSlots } from "@/lib/hours";

/**
 * The order-details/schedule UI, extracted from its Dialog wrapper so it can be
 * embedded inline inside another Dialog (SchedulePickupDialog) without nesting
 * two Radix Dialog roots at once (which caused focus/accessibility bugs).
 * `PickupDetails` below wraps this in its own Dialog for standalone use.
 */
export function PickupDetailsContent({
  orderType,
  onComplete,
}: {
  orderType: "delivery" | "pickup" | null;
  onComplete: () => void;
}) {
  const [showSchedule, setShowSchedule] = useState(false);
  const [showpickupDetails, setshowpickupDetails] = useState(false);

  useEffect(() => {
    setshowpickupDetails(orderType === "pickup");
  }, [orderType]);
  const [selectedPlace, setSelectedPlace] = useState<{
    address: string;
    lat: number;
    lng: number;
    placeId: string;
  } | null>(null);
  const [apt, setApt] = useState("");
  const [instructions, setInstructions] = useState("");

  // 🟢 selectedDay is now a Date or null
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState<string | undefined>("");
  const [customerPhone, setCustomerPhone] = useState<string | undefined>("");
  const [isLoading, setIsLoading] = useState(false);
  const [showMoreDays, setShowMoreDays] = useState(false);
  const { cartId, mutate } = useCart();
  const router = useRouter();

  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const formatDay = (date: Date) =>
    date.toLocaleDateString("en-US", {
      weekday: "short",
      day: "2-digit",
      month: "short",
    });

  const moreDays = Array.from({ length: 8 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i + 2);
    return d;
  });

  // Only show time slots that fall within the restaurant's open hours for the selected day,
  // and drop a previously-picked time if it's no longer valid once the day changes.
  const availableTimeSlots = getAvailableTimeSlots(selectedDay);
  useEffect(() => {
    if (selectedTime && !availableTimeSlots.includes(selectedTime)) {
      setSelectedTime(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDay]);

  const handleAddDelivery = async () => {
    setIsLoading(true);
    if (!selectedPlace) {
      toast("Please select delivery address");
      setIsLoading(false);
      return;
    }
    try {
      const res = await fetch("/api/cart/addDelivery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address: selectedPlace.address,
          lat: selectedPlace.lat,
          lng: selectedPlace.lng,
          placeId: selectedPlace.placeId,
          apt,
          instructions,
          orderType,
          customerName,
          customerPhone,
        }),
      });

      const data = await res.json();
      await mutate(["/api/cart/get", cartId]);
      router.refresh();

      if (res.ok) {
        toast(`${data.message}`);
        onComplete();
      } else {
        toast(`${data.message}`);
        throw new Error("Failed adding delevey details");
      }
    } catch (error) {
      console.error(error);
      toast(`${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToCart = async (Day: Date | null, Time: string | null) => {
    setIsLoading(true);
    if (!Day || !Time) {
      toast("Please select a day and time");
      setIsLoading(false);
      return;
    }
    try {
      const res = await fetch("/api/cart/addTime", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pickupDay: Day,
          pickupTime: Time,
          orderType: orderType,
        }),
      });
      const data = await res.json();
      await mutate(["/api/cart/get", cartId]);
      router.refresh();

      if (res.ok) {
        toast(`${data.message}`);
        setShowSchedule(false);
        onComplete();
      } else {
        toast(`${data.message}`);
        throw new Error("Failed adding Time");
      }
    } catch (error) {
      console.error(error);
      toast(`${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const isSameDay = (a: Date | null, b: Date) =>
    !!a && a.toDateString() === b.toDateString();

  return (
    <div className="flex flex-col gap-4 justify-between">
      <DialogHeader className="px-5 py-3 flex-none ">
        <DialogTitle>
          {!showSchedule ? "Order Details" : "Schedule Pickup"}
        </DialogTitle>
      </DialogHeader>

      <div className="flex flex-col space-y-8 flex-1 px-2">
        {orderType === "delivery" && !selectedPlace && (
          <HereAutocomplete
            onSelect={(place) => {
              setSelectedPlace({
                address: place.address.label,
                lat: place.position.lat,
                lng: place.position.lng,
                placeId: place.id,
              });
            }}
          />
        )}

        {orderType === "delivery" || (orderType === null && selectedPlace) ? (
          selectedPlace && (
            <div className="flex flex-col gap-3">
              <div className="border p-3 rounded-xl flex justify-between items-center">
                <div>
                  <div className="font-medium">📍 {selectedPlace.address}</div>
                </div>
                <button
                  className="text-sm text-blue-500"
                  onClick={() => setSelectedPlace(null)}
                >
                  Change
                </button>
              </div>

              <input
                placeholder="Apt / Suite / Floor"
                value={apt}
                onChange={(e) => setApt(e.target.value)}
                className="border rounded-xl p-3"
              />
              <input
                className="border rounded-xl p-3"
                placeholder="Full name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
              />

              <input
                className="border rounded-xl p-3"
                placeholder="Phone number"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
              />
              <div className="border rounded-xl p-3 bg-stone-50 text-sm space-y-1">
                <p className="font-semibold">
                  ⭐ Earn Rewards With Every Order
                </p>
                <p>• 1 point for every $1 spent</p>
                <p>• 100 points = Free Regular Side</p>
                <p>• 500 points = Free 5 Piece Combo</p>
                <p>• 800 points = Free 8 Piece Combo</p>
                <p className="text-xs text-muted-foreground pt-1">
                  Use your phone number at checkout to collect and redeem
                  points.
                </p>
              </div>
              <textarea
                placeholder="Delivery instructions"
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                className="border rounded-xl p-3"
              />
            </div>
          )
        ) : null}

        {(showSchedule || orderType === "pickup") && (
          <>
            {/* Day Selection */}
            <div className="flex flex-col gap-2  ">
              <div className="flex gap-2">
                {/* Today */}
                <Button
                  size="lg"
                  variant={
                    isSameDay(selectedDay, today) ? "clicked" : "outline"
                  }
                  className="flex justify-between w-1/2"
                  onClick={() => {
                    setSelectedDay(today);
                    setShowMoreDays(false);
                  }}
                >
                  <span>{formatDay(today).split(" ")[0]}</span>
                  <span>{formatDay(today).split(" ").slice(1).join(" ")}</span>
                </Button>

                {/* Tomorrow */}
                <Button
                  size="lg"
                  variant={
                    isSameDay(selectedDay, tomorrow) ? "clicked" : "outline"
                  }
                  className="flex justify-between w-1/2"
                  onClick={() => {
                    setSelectedDay(tomorrow);
                    setShowMoreDays(false);
                  }}
                >
                  <span>{formatDay(tomorrow).split(" ")[0]}</span>
                  <span>
                    {formatDay(tomorrow).split(" ").slice(1).join(" ")}
                  </span>
                </Button>
              </div>

              {/* More Days */}
              <Button
                size="lg"
                variant="outline"
                onClick={() => setShowMoreDays(!showMoreDays)}
                className="w-full justify-between"
              >
                More days
                <span>▼</span>
              </Button>

              {showMoreDays && (
                <div className="grid grid-cols-2 gap-2 ">
                  {moreDays.map((day, i) => (
                    <Button
                      size="lg"
                      key={i}
                      variant={
                        isSameDay(selectedDay, day) ? "clicked" : "outline"
                      }
                      className="justify-between"
                      onClick={() => setSelectedDay(day)}
                    >
                      <span>{formatDay(day).split(" ")[0]}</span>
                      <span>{formatDay(day).split(" ").slice(1).join(" ")}</span>
                    </Button>
                  ))}
                </div>
              )}
              {/* Time Slots */}
              <div
                className={`${showMoreDays && "h-28"} flex flex-col max-h-72 overflow-hidden `}
              >
                <p className="font-medium mb-2">Available times:</p>
                <div className="w-full h-full overflow-auto scrollbar-thin scrollbar-thumb-gray-300 ">
                  <div>
                    {availableTimeSlots.length === 0 && (
                      <p className="text-sm text-muted-foreground py-2">
                        We&apos;re closed that day - please pick another date.
                      </p>
                    )}
                    {availableTimeSlots.map((t) => (
                      <div
                        key={t}
                        onClick={() => setSelectedTime(t)}
                        className="flex items-center w-full py-3 px-2 space-x-4 border-b cursor-pointer"
                      >
                        <Checkbox
                          checked={selectedTime === t}
                          onCheckedChange={() => setSelectedTime(t)}
                        />
                        <Label>{t}</Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-3 pt-3">
                <input
                  className="border rounded-xl p-3"
                  placeholder="Phone number"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                />

                <div className="border rounded-xl p-3 bg-stone-50 text-sm space-y-1">
                  <p className="font-semibold">
                    ⭐ Earn Rewards With Every Order
                  </p>
                  <p>• 1 point for every $1 spent</p>
                  <p>• 100 points = Free Regular Side</p>
                  <p>• 500 points = Free 5 Piece Combo</p>
                  <p>• 800 points = Free 8 Piece Combo</p>

                  <p className="text-xs text-muted-foreground pt-1">
                    Use your phone number to collect and redeem points.
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <DialogFooter className="flex-none p-3">
        {showpickupDetails && (
          <Button
            size="md"
            variant="mainButton"
            className="h-6 w-full"
            onClick={() => {
              setshowpickupDetails(false);
              setShowSchedule(true);
              setSelectedDay(today); // default to today
            }}
          >
            Schedule Pickup
          </Button>
        )}
        {showSchedule && (
          <Button
            disabled={isLoading || !selectedTime}
            size="md"
            variant="mainButton"
            className="w-full"
            onClick={() => handleAddToCart(selectedDay, selectedTime)}
          >
            {isLoading ? "Scheduling..." : "Schedule Order"}
          </Button>
        )}
        {orderType === "delivery" && selectedPlace && (
          <Button
            disabled={isLoading}
            size="md"
            variant="mainButton"
            className="w-full"
            onClick={handleAddDelivery}
          >
            {isLoading ? "Confirming..." : "Confirm Delivery"}
          </Button>
        )}
      </DialogFooter>
    </div>
  );
}

/* Standalone Dialog wrapper - used directly from mainPage.tsx's (currently disabled) toggle. */
export default function PickupDetails({
  open,
  onOpenChange,
  orderType,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderType: "delivery" | "pickup" | null;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        aria-describedby={undefined}
        className="flex flex-col gap-4 justify-between overflow-scroll max-h-[95vh] scrollbar-thin scrollbar-track-gray-100 "
      >
        <PickupDetailsContent
          orderType={orderType}
          onComplete={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
