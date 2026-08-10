import db from "@/db/db";
import GalleryManager from "./_components/GalleryManager";

export default async function GalleryPage() {
  const images = await db.galleryImage.findMany({ orderBy: { order: "asc" } });

  return (
    <div className="min-h-screen bg-stone-50 p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-stone-900">Gallery</h1>
        <p className="text-sm text-stone-500 mt-0.5">
          Manage the photo grid shown on your homepage.
        </p>
      </div>

      <GalleryManager images={images} />
    </div>
  );
}
