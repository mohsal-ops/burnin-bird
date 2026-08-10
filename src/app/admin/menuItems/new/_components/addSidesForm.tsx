"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Item, SideGroupType } from "generated/prisma";
import { addItemSides } from "@/app/admin/_actions/products";
import { toast } from "sonner";

export type SideGroupDTO = {
  id: string;
  itemId: string;
  type: SideGroupType;
  title: string;
  required: boolean;
  maxSelect: number | null;
};

export default function SidesGroupBuilder({
  name,
  itemId,
  item,
  sideItems,
}: {
  name: string;
  itemId: string;
  item: SideGroupDTO[];
  sideItems: Item[];
}) {
  /* ENABLE / DISABLE GROUPS */
  const [enabled, setEnabled] = useState({
    recommended: false,
    burgerNo: false,
    loadedFriesNo: false,
    extraSauce: false,
    largeExtra: false,
    spice: false,
    sandwichNo: false,
  });

  /* STATES */
  type RecommendedSide = {
    name: string;
    price?: number; // optional
  };

  const [recommendedSides, setRecommendedSides] = useState<RecommendedSide[]>(
    [],
  );
  const [burgerNo, setBurgerNo] = useState<string[]>([]);
  const [loadedFriesNo, setLoadedFriesNo] = useState<string[]>([]);
  const [sandwichNo, setSandwichNo] = useState<string[]>([]);
  const [pending, setPending] = useState(false);

  const [extraSauces, setExtraSauces] = useState<
    { name: string; price: number }[]
  >([]);

  const [largeExtras, setLargeExtras] = useState<
    { name: string; price: number }[]
  >([]);

  const toggleRecommended = (name: string) => {
    setRecommendedSides((prev) => {
      const exists = prev.find((r) => r.name === name);

      if (exists) {
        // remove
        return prev.filter((r) => r.name !== name);
      }

      // add
      return [...prev, { name }];
    });
  };

  const buildPayload = () => {
    const groups: any[] = [];

    /* 1️⃣ Recommended Sides */
    if (enabled.recommended) {
      groups.push({
        title: "Recommended Sides",
        type: "RECOMMENDED",
        required: false,
        options: recommendedSides.map((r) => {
          const linked = sideItems.find((s) => s.name === r.name);
          return {
            label: r.name,
            linkedItemId: linked?.id,
            priceInCents: r.price ? Math.round(r.price * 100) : null,
          };
        }),
      });
    }

    /* 2️⃣ Burger No */
    if (enabled.burgerNo) {
      groups.push({
        title: "Burger No",
        type: "NO",
        required: false,
        options: burgerNo.map((o) => ({ label: o })),
      });
    }

    /* 3️⃣ Loaded Fries No */
    if (enabled.loadedFriesNo) {
      groups.push({
        title: "Loaded Fries No",
        type: "NO",
        required: false,
        options: loadedFriesNo.map((o) => ({ label: o })),
      });
    }

    /* 4️⃣ Extra Sauce */
    if (enabled.extraSauce) {
      groups.push({
        title: "Extra Sauce",
        type: "EXTRA",
        required: false,
        options: extraSauces.map((s) => ({
          label: s.name,
          priceInCents: Math.round(s.price * 100),
        })),
      });
    }

    /* 5️⃣ Large Side Extra */
    if (enabled.largeExtra) {
      groups.push({
        title: "Large Side Extra",
        type: "EXTRA",
        required: false,
        options: largeExtras.map((e) => ({
          label: e.name,
          priceInCents: Math.round(e.price * 100),
        })),
      });
    }

    /* 6️⃣ Spice */
    if (enabled.spice) {
      groups.push({
        title: "Spice",
        type: "SPICE",
        required: true,
        maxSelect: 1,
        options: [{ label: "Mild" }, { label: "No More Spice" }],
      });
    }

    /* 7️⃣ Sandwich No */
    if (enabled.sandwichNo) {
      groups.push({
        title: "Sandwich No",
        type: "NO",
        required: false,
        options: sandwichNo.map((o) => ({ label: o })),
      });
    }

    return groups.filter((g) => g.options.length > 0);
  };

  const handleAddSides = async () => {
    setPending(true);
    const payload = buildPayload();
    const res = await addItemSides(itemId, payload);
    toast(`${res.message}`);
    setPending(false);
  };

  const toggleArrayValue = (
    value: string,
    array: string[],
    setArray: (v: string[]) => void,
  ) => {
    setArray(
      array.includes(value)
        ? array.filter((v) => v !== value)
        : [...array, value],
    );
  };

  if (!item) {
    return <p className="text-red-500 text-center mt-10">Product not found</p>;
  }

  return (
    <div className="space-y-6 w-full mb-10 sm:w-[50vw] ">
      <p className="text-2xl font-bold">{name}</p>
      {/* 1️⃣ Recommended Sides */}
      <Group
        title="Recommended Sides"
        enabled={enabled.recommended}
        onToggle={(v) => setEnabled({ ...enabled, recommended: v })}
      >
        {sideItems.map((s) => {
          const selected = recommendedSides.find((r) => r.name === s.name);

          return (
            <div key={s.id} className="flex items-center gap-3">
              <Checkbox
                disabled={!enabled.recommended}
                checked={!!selected}
                onCheckedChange={() => toggleRecommended(s.name)}
              />

              <span className="flex-1">{s.name}</span>

              {/* optional price */}
              {selected && (
                <Input
                  type="number"
                  placeholder="+$"
                  className="w-24"
                  value={selected.price ?? ""}
                  onChange={(e) => {
                    const value = e.target.value;
                    setRecommendedSides((prev) =>
                      prev.map((r) =>
                        r.name === s.name
                          ? { ...r, price: value ? Number(value) : undefined }
                          : r,
                      ),
                    );
                  }}
                />
              )}
            </div>
          );
        })}
      </Group>

      {/* 2️⃣ Burger No */}
      <Group
        title="Burger No"
        enabled={enabled.burgerNo}
        onToggle={(v) => setEnabled({ ...enabled, burgerNo: v })}
      >
        {[
          "No Golden Ranch Sauce",
          "No Pepper Jack Cheese",
          "No Pepper Relish",
          "No Pickles",
        ].map((o) => (
          <Option disabled={!enabled.burgerNo} key={o}>
            <Checkbox
              disabled={!enabled.burgerNo}
              checked={burgerNo.includes(o)}
              onCheckedChange={() => toggleArrayValue(o, burgerNo, setBurgerNo)}
            />
            <span>{o}</span>
          </Option>
        ))}
      </Group>

      {/* 3️⃣ Loaded Fries No */}
      <Group
        title="Loaded Fries NO"
        enabled={enabled.loadedFriesNo}
        onToggle={(v) => setEnabled({ ...enabled, loadedFriesNo: v })}
      >
        {["No Golden Ranch Sauce", "No BBQ Sauce"].map((o) => (
          <Option disabled={!enabled.loadedFriesNo} key={o}>
            <Checkbox
              disabled={!enabled.loadedFriesNo}
              checked={loadedFriesNo.includes(o)}
              onCheckedChange={() =>
                toggleArrayValue(o, loadedFriesNo, setLoadedFriesNo)
              }
            />
            <span>{o}</span>
          </Option>
        ))}
      </Group>

      {/* 4️⃣ Extra Sauce */}
      <Group
        title="Extra Sauce (+$)"
        enabled={enabled.extraSauce}
        onToggle={(v) => setEnabled({ ...enabled, extraSauce: v })}
      >
        <DynamicPriceList
          disabled={!enabled.extraSauce}
          items={extraSauces}
          setItems={setExtraSauces}
        />
      </Group>

      {/* 5️⃣ Large Side Extra */}
      <Group
        title="Large Side Extra $$$"
        enabled={enabled.largeExtra}
        onToggle={(v) => setEnabled({ ...enabled, largeExtra: v })}
      >
        <DynamicPriceList
          disabled={!enabled.largeExtra}
          items={largeExtras}
          setItems={setLargeExtras}
        />
      </Group>

      {/* 6️⃣ Spice */}
      <Group
        title="Spice"
        enabled={enabled.spice}
        onToggle={(v) => setEnabled({ ...enabled, spice: v })}
      >
        <p className="text-sm text-muted-foreground">
          Customers will choose between:
          <br />• Mild
          <br />• No More Spice
        </p>
      </Group>

      {/* 7️⃣ Sandwich No */}
      <Group
        title="Sandwich No"
        enabled={enabled.sandwichNo}
        onToggle={(v) => setEnabled({ ...enabled, sandwichNo: v })}
      >
        {["No Golden Ranch Sauce", "No Pickles"].map((o) => (
          <Option disabled={!enabled.sandwichNo} key={o}>
            <Checkbox
              disabled={!enabled.sandwichNo}
              checked={sandwichNo.includes(o)}
              onCheckedChange={() =>
                toggleArrayValue(o, sandwichNo, setSandwichNo)
              }
            />
            <span>{o}</span>
          </Option>
        ))}
      </Group>

      {/* SAVE */}
      <Button
        disabled={pending}
        className="w-full bg-black text-white"
        onClick={async () => {
          handleAddSides();
        }}
      >
        {pending ? "Saving..." : "Save Sides Groups"}
      </Button>
    </div>
  );
}

/* ---------------- UI HELPERS ---------------- */

type GroupProps = {
  title: string;
  enabled: boolean;
  onToggle: (value: boolean) => void;
  children: React.ReactNode;
};

function Group({ title, enabled, onToggle, children }: GroupProps) {
  return (
    <Card className={enabled ? "" : "opacity-60"}>
      <CardHeader className="flex flex-row items-center gap-5">
        <h3 className="font-semibold">{title}</h3>
        <Switch checked={enabled} onCheckedChange={onToggle} />
      </CardHeader>
      <CardContent className="space-y-2">{children}</CardContent>
    </Card>
  );
}

function Option({ children, disabled }: any) {
  return (
    <label
      className={`flex items-center gap-3 ${
        disabled ? "pointer-events-none" : ""
      }`}
    >
      {children}
    </label>
  );
}

function DynamicPriceList({ items, setItems, disabled }: any) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Input
          disabled={disabled}
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Input
          disabled={disabled}
          placeholder="Price"
          type="number"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        />
        <Button
          disabled={disabled}
          onClick={() => {
            if (!name || !price) return;
            setItems([...items, { name, price: Number(price) }]);
            setName("");
            setPrice("");
          }}
        >
          Add
        </Button>
      </div>

      {items.map((i: any, idx: number) => (
        <div key={idx} className="text-sm flex justify-between">
          <span>{i.name}</span>
          <span>${i.price.toFixed(2)}</span>
        </div>
      ))}
    </div>
  );
}

// "use client";

// import {
//   AddSidesGroup,
// } from "@/app/admin/_actions/products";
// import { Button } from "@/components/ui/button";

// import { useToast } from "@/hooks/use-toast";
// import {  Item } from "generated/prisma";
// import { useActionState, useEffect, useState } from "react";

// const initialState = {
//   message: "",
// };

// type SideGroupDTO = {
//   id: string;
//   itemId: string;
//   type: "SIDE" | "SPICE" | "RECOMMENDED";
//   title: string;
//   required: boolean;
//   maxSelect: number | null;
// };

// type ItemDTO = {
//   id: string;
//   name: string;
//   sideGroups: SideGroupDTO[];
// };

// export function SidesGroupForm({ item, sideItems }: { item: ItemDTO, sideItems: Item[] }) {
//   const [state, formAction, pending] = useActionState(AddSidesGroup, {
//     ok: false,
//     message: "",
//   });

//   const { toast } = useToast();
//   useEffect(() => {
//     if (state?.message) {
//       toast({
//         variant:
//           state.message === "item added succefuly" ? "default" : "destructive",
//         description: `${state.message}`,
//       });
//     }
//   }, [state]);

//   if (!item) {
//     return <p className="text-red-500 text-center mt-10">Product not found</p>;
//   }

//   return (
//     <div className="p-6 space-y-6">
//       <h1 className="text-xl font-bold">Sides Groups for: {item.name}</h1>

//       {/* Existing groups */}
//       <div className="space-y-2">
//         {item.sideGroups.map((g) => (
//           <div key={g.id} className="border p-2 rounded">
//             <strong>{g.title}</strong> - {g.type} -{" "}
//             {g.required ? "Required" : "Optional"} - Max: {g.maxSelect ?? "∞"}
//           </div>
//         ))}
//       </div>

//       {/* Add new group */}
//       <form action={formAction} className="space-y-3">
//         <input type="hidden" name="itemId" value={item.id} />

//         <input
//           name="title"
//           placeholder="Group title"
//           className="border p-2 w-full"
//           required
//         />

//         <select name="type" className="border p-2 w-full">
//           <option value="SIDE">Sides</option>
//           <option value="SPICE">Spice</option>
//           <option value="RECOMMENDED">Recommended</option>
//         </select>

//         <label className="flex gap-2">
//           <input type="checkbox" name="required" />
//           Required
//         </label>

//         <input
//           name="maxSelect"
//           type="number"
//           placeholder="Max select (empty = unlimited)"
//           className="border p-2 w-full"
//         />

//         <Button
//           className="bg-black text-white"
//           type="submit"
//           disabled={pending}
//         >
//           {pending ? "Adding..." : "Add Group"}
//         </Button>
//       </form>
//     </div>
//   );
// }
