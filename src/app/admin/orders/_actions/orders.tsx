'use server'
import db from "@/db/db";
import { cache } from "@/lib/handleCaching";
import { revalidatePath } from "next/cache";
import { notFound } from "next/navigation";
import { toast } from "sonner";
import { z } from "zod";

export const GetProducts= cache(async ()=>{
     const orders = await db.order.findMany();

  const eachitemAndItsCategoryObjects = async (orders: any[]) => {
    return await Promise.all(
      orders.map(async (order) => {
        const userEmail = await db.user.findUnique({
          where: { id: order.userId },
          select: { email: true },
        });
        const product = await db.item.findUnique({
          where: { id: order.productId },
          select: { name: true,priceInCents:true },
        });


        return {
          ...userEmail,
          name: product?.name,
          price: product?.priceInCents || 0
        };
      }),
    );
  };
  
  const products = await db.item.findMany()
    const data = await eachitemAndItsCategoryObjects(orders);
    return {products,data}
},["products"]) 




const AddOrderSchema = z.object({
  productId: z.string().min(1),
  email: z.string().min(1),
});

export async function AddOrder(prevSatate: unknown, formData: FormData) {
  try {
    const result = AddOrderSchema.safeParse(
      Object.fromEntries(formData.entries()),
    );
    if (result.success === false) {
      console.log(result.error.message )
      return { message: result.error.message };
      }
      
      
      
      const data = { ...result.data };
      
    const product = await db.item.findUnique({
      where: {
        id:data.productId
      },
      select: {
        id: true,
        priceInCents:true
      }
    })

      const userExist = await db.user.findUnique({ where: { email: data.email }, select: { id: true } })
    if(product == null) return notFound()
    if (userExist == null) {
      const user = await db.user.create({
        data: {
          email:data.email
        }
      })
      await db.order.create({
        data: {
          userId: user?.id,
          productId: product.id,
          pricePaidInCents: product.priceInCents,

        }
      },)
      return { message: "order added succefuly" };

    }
    

    await db.order.create({
      data: {
        userId: userExist?.id,
        productId:product.id,
        pricePaidInCents: product.priceInCents,

      },
    });


    revalidatePath("/admin");
    revalidatePath("/admin/orders");
    return { message: "order added succefuly" };
  } catch (error: any) {
    // ✅ Check if it's a unique constraint error (Prisma error code P2002)
    if (error.code === "P2002" && error.meta?.target?.includes("slug")) {
      return {
        message: "This name already exists. Please choose a different one.",
      };
    }
      console.log(error)


    return { message: error };
  }
}
export async function deleteOrder(orderId: string) {
  if (!orderId){
    console.log("no order id provided")

    return;
  }

  await db.order.delete({
    where: { id: orderId },
  })
  revalidatePath("/admin");
  revalidatePath("/admin/orders");
}