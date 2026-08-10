import { CartItem, Item } from "generated/prisma";
import ProductCard, {  AllDishesCardServer, PopularDishesCardServer } from "../../_components/ProductCardServer";
import ProductCardServer from "../../_components/ProductCardServer";
import { ItemWithSides } from "../../page";

type ProductFetcherProp = {
    products: ItemWithSides[] | undefined
    cartItems: CartItem[]
    orderType: "pickup" | "delivery" | null 
};

export function ProductSuspense({cartItems, products, orderType }: ProductFetcherProp) {


    return products?.map((product: ItemWithSides) => (
    <ProductCardServer orderType={orderType} cartItems={cartItems} key={product.id} {...product} />
    ));
}

export function PopularDishesSuspense({cartItems, products, orderType }: ProductFetcherProp) {

    return products?.map((product: ItemWithSides) => (
        <PopularDishesCardServer orderType={orderType} cartItems={cartItems} key={product.id} {...product} />
    ));
}
export function AllDishesSuspense({cartItems, products, orderType }: ProductFetcherProp) {

    return products?.map((product: ItemWithSides) => (
        <AllDishesCardServer orderType={orderType} cartItems={cartItems} key={product.id} {...product} />
    ));
}


