"use client";

import { AddCategory } from "@/app/admin/_actions/products";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { Label } from "@radix-ui/react-label";
import { Item } from "generated/prisma";
import { useActionState, useEffect } from "react";
import Link from "next/link";

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
        variant: /added|success|updated/i.test(state.message) ? "default" : "destructive",
        description: `${state.message}`,
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
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="mainButton" disabled={pending} type="submit">
            {pending ? "Saving…" : "Add category"}
          </Button>
          <Link href="/admin/menuCategories">
            <Button type="button" variant="outline">Back to categories</Button>
          </Link>
        </div>
      </form>
    </>
  );
}
