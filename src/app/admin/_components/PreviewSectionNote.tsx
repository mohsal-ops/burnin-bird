import { Info } from "lucide-react";

// A short, plain-spoken note shown ONLY in the read-only preview, tying an admin
// section to the specific problem it solves for a restaurant without a website.
// Not marketing voice — this reads like something the owner would actually say.
export default function PreviewSectionNote({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2.5 rounded-xl border border-[#c85a1e]/25 bg-[#c85a1e]/5 px-4 py-2.5 text-sm text-stone-700">
      <Info size={16} className="mt-0.5 shrink-0 text-[#c85a1e]" />
      <p>{children}</p>
    </div>
  );
}
