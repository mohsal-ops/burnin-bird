"use client";

import PageHeader from "@/app/admin/_components/pageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@radix-ui/react-label";
import { useActionState, useEffect } from "react";
import { AddOrder } from "../../_actions/orders";

const initialState = {
  message: "",
};

export default function ProductForm({productId} : {productId ?: string | undefined}) {
  const { toast } = useToast();
  const [state, formAction, pending] = useActionState(AddOrder, initialState)
  
 

  useEffect(() => {
    if (state?.message) {
      toast({
        variant:
          state.message === "order added succefuly" ? "default" : "destructive", // Success or error styling
        description: `${state.message}`, // Show the returned message
      });
    }
  }, [state]);

  return (
    <div className="lg:flex justify-center">
      <form action={formAction} className="space-y-4 lg:w-[80%] ">
        <PageHeader>add new</PageHeader>
        <div className="space-y-2">
          <Label htmlFor="description" className=" text-sm ">
            product id
          </Label>
          <Textarea
            required
            id="productId"
            name="productId"
            defaultValue={productId}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="image" className=" text-sm ">
            email
          </Label>
          <Input
            type="email"
            required
            id="email"
            name="email"
          />
        </div>
        <Button disabled={pending } type="submit">
          {pending ? "saving..." : "save"}
        </Button>
      </form>
    </div>
  );
}
