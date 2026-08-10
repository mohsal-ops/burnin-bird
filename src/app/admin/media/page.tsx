import PageHeader from "../_components/pageHeader";
import { getAllSiteImages } from "@/lib/getSiteImages";
import db from "@/db/db";
import MediaTabs from "./_components/MediaTabs";

export const dynamic = "force-dynamic";

export default async function MediaPage() {
  const [siteImages, galleryImages] = await Promise.all([
    getAllSiteImages(),
    db.galleryImage.findMany({ orderBy: { order: "asc" } }),
  ]);

  return (
    <div className="lg:flex justify-center">
      <div className="p-5 space-y-4 w-full lg:w-[85%]">
        <PageHeader>Media</PageHeader>
        <p className="text-sm text-stone-500 px-4 md:px-0">
          All your site photos in one place -- the fixed site images and your
          homepage gallery.
        </p>
        <MediaTabs siteImages={siteImages} galleryImages={galleryImages} />
      </div>
    </div>
  );
}
