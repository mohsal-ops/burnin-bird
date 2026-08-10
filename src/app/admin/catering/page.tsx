import db from "@/db/db";
import PageHeader from "../_components/pageHeader";
import CateringInbox from "./_components/CateringInbox";

export const dynamic = "force-dynamic";

export default async function CateringPage() {
  const [requests, newCount] = await Promise.all([
    db.cateringRequest.findMany({ orderBy: { createdAt: "desc" } }),
    db.cateringRequest.count({ where: { status: "new" } }),
  ]);

  return (
    <div className="lg:flex justify-center">
      <div className="p-5 space-y-3 w-full lg:w-[80%]">
        <div className="flex items-center gap-3 px-4 md:px-0">
          <PageHeader>Catering Requests</PageHeader>
          {newCount > 0 && (
            <span className="inline-flex items-center justify-center text-xs font-bold px-2.5 py-1 rounded-full bg-orange-100 text-orange-700">
              {newCount} new
            </span>
          )}
        </div>
        <CateringInbox requests={requests} />
      </div>
    </div>
  );
}
