import { buildMetadata } from "@/lib/seo";
import { GetFeaturedProducts, GetGategories, GetPlaces, GetProducts } from './_actions/getDataNeeded'
import MainPageMenu from './_components/mainPage'
import { getBusinessHours } from '@/lib/getHours'
import { getUberDirect } from "@/lib/siteSettings"

export const metadata = buildMetadata("menu");

export default async function Menu() {


   const [featuredProducts , places, categories, products, hours, uber] = await Promise.all([
    GetFeaturedProducts(),
    GetPlaces(),
    GetGategories(),
    GetProducts(),
    getBusinessHours(),
    getUberDirect(),
   ])
  // Delivery = Uber Direct. Only offer it when the owner has it switched on.
  const deliveryOn = uber.enabled && uber.mode !== "pickup_only"
  return (
      <MainPageMenu featuredProducts={featuredProducts}  places={places} products={products} gategories={categories} hours={hours} deliveryOn={deliveryOn} />
  )
}


