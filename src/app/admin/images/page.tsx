import PageHeader from "../_components/pageHeader";
import SiteImageManager from "./_components/SiteImageManager";
import { getAllSiteImages } from "@/lib/getSiteImages";

export const dynamic = "force-dynamic";

export default async function ImagesPage() {
  const images = await getAllSiteImages();

  return (
    <div className="lg:flex justify-center">
      <div className="p-5 space-y-3 w-full lg:w-[80%]">
        <PageHeader>Site Images</PageHeader>
        <p className="text-sm text-stone-500 px-4 md:px-0">
          Update the home page hero and Our Story photos. Changes apply immediately.
        </p>
        <SiteImageManager images={images} />
      </div>
    </div>
  );
}
