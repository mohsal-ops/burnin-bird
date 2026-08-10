import { buildMetadata } from "@/lib/seo";
import { GetFeaturedProducts, GetGategories, GetPlaces, GetProducts } from './_actions/getDataNeeded'
import MainPageMenu from './_components/mainPage'
import { getBusinessHours } from '@/lib/getHours'

export const metadata = buildMetadata("menu");

export default async function Menu() {


   const [featuredProducts , places, categories, products, hours] = await Promise.all([
    GetFeaturedProducts(),
    GetPlaces(),
    GetGategories(),
    GetProducts(),
    getBusinessHours(),
   ])
  return (
      <MainPageMenu featuredProducts={featuredProducts}  places={places} products={products} gategories={categories} hours={hours} />
  )
}


