import db from "@/db/db";
import PageHeader from "../_components/pageHeader";
import CateringInbox from "./_components/CateringInbox";
import { getAccess } from "@/lib/getAccess";
import PreviewSectionNote from "../_components/PreviewSectionNote";

export const dynamic = "force-dynamic";

export default async function CateringPage() {
  const access = await getAccess();
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
        {access.mode === "preview" && (
          <PreviewSectionNote>
            Catering inquiries land here with all the details instead of getting
            buried in your Instagram DMs where they&apos;re easy to lose.
          </PreviewSectionNote>
        )}
        <CateringInbox requests={requests} />
      </div>
    </div>
  );
}
