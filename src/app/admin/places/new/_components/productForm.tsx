"use client";

import { AddCategory, updateProduct } from "@/app/admin/_actions/products";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/formatters";
import { Label } from "@radix-ui/react-label";
import { Item } from "generated/prisma";
import { useActionState, useEffect } from "react";
import { useFormState } from "react-dom";

const initialState = {
  message: "",
};
export default function ProductForm({ item }: { item: Item | null }) {
  const [state, formAction, pending] = useActionState(
    AddCategory,
    initialState,
  );
  useEffect(() => {
    if (state?.message) {
      toast({
        variant:
          state.message === "item added succefuly" ? "default" : "destructive", // Success or error styling
        description: `${state.message}`, // Show the returned message
      });
    }
  }, [state, pending, formAction]);

  return (
    <>
      <form action={formAction} className="space-y-8">
        <div className="space-y-2">
          <Label htmlFor="name" className=" text-sm ">
            Name
          </Label>
          <Input
            type="text"
            required
            id="name"
            name="name"
            defaultValue={item?.name}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="image" className=" text-sm ">
            Image
          </Label>
          <Input
            type="file"
            required
            id="image"
            name="image"
            defaultValue={item?.name}
          />
        </div>
        <Button disabled={pending} type="submit">
          {pending ? "saving..." : "save"}
        </Button>
      </form>
    </>
  );
}