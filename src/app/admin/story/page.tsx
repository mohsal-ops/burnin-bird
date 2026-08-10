import db from "@/db/db";
import PageHeader from "@/app/admin/_components/pageHeader";
import { ExternalLink } from "lucide-react";
import Link from "next/link";
import PartnerForm from "./_components/PartnerForm";
import AddPartnerForm from "./_components/AddPartnerForm";

export default async function StoryPage() {
  const partners = await db.partner.findMany({
    orderBy: { order: "asc" },
  });

  return (
    <div className="flex flex-col bg-stone-100 p-2 sm:px-16 pb-10">
      <div className="flex items-center justify-between mb-2">
        <PageHeader>Our Story</PageHeader>
        <Link
          href="/story"
          target="_blank"
          className="flex items-center gap-1.5 text-xs text-stone-500 hover:text-stone-800 transition-colors"
        >
          Preview page <ExternalLink size={12} />
        </Link>
      </div>
      <p className="text-sm text-muted-foreground mb-8">
        Edit the owner profiles shown on the Our Story page
      </p>

      <div className="flex flex-col gap-6 max-w-3xl">
        {partners.map((partner) => (
          <PartnerForm key={partner.id} partner={partner} />
        ))}

        <AddPartnerForm defaultOpen={partners.length === 0} nextOrder={partners.length} />
      </div>
    </div>
  );
}