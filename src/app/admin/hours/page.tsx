import PageHeader from "../_components/pageHeader";
import HoursEditor from "./_components/HoursEditor";
import { getBusinessHours } from "@/lib/getHours";

export const dynamic = "force-dynamic";

export default async function HoursPage() {
  const hours = await getBusinessHours();

  return (
    <div className="lg:flex justify-center">
      <div className="p-5 space-y-3 w-full lg:w-[80%]">
        <PageHeader>Business Hours</PageHeader>
        <p className="text-sm text-stone-500 px-4 md:px-0">
          Changes here update the site immediately 
        </p>
        <HoursEditor hours={hours} />
      </div>
    </div>
  );
}
