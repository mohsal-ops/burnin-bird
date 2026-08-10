import db from "@/db/db";
import ReviewManager from "./_components/ReviewManager";

export default async function ReviewsPage() {
  const reviews = await db.review.findMany({ orderBy: { order: "asc" } });

  return (
    <div className="min-h-screen w-full flex justify-center ">
      <div className="flex flex-col md:w-4xl w-full  bg-stone-50 p-6 space-y-8">
        <div>
        <h1 className="text-2xl font-bold text-stone-900">Reviews</h1>
        <p className="text-sm text-stone-500 mt-0.5">
          Manage the customer testimonials shown on your homepage.
        </p>
      </div>

      <ReviewManager reviews={reviews} />
      </div>
      
    </div>
  );
}
