import db from "@/db/db";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url as string)
    const isfeatured = searchParams.get('featured')

    if (!isfeatured) {
        try {
            const products = await db.item.findMany({
                where: { isAvailableForPurchase: true },
            });

            return Response.json({
                products,
                quantity: products.length,
            });
        } catch (error) {
            console.error("Error fetching products:", error);
            return Response.json(
                { error: "Failed to fetch products" },
                { status: 500 }
            );
        }
    }
    

    try {
        const products = await db.item.findMany({
            where: { isAvailableForPurchase: true , featured : true},
        });

        return Response.json({
            products,
            quantity: products.length,
        });
    } catch (error) {
        console.error("Error fetching featured products:", error);
        return Response.json(
            { error: "Failed to fetch featured products" },
            { status: 500 }
        );
    }
}
