import db from "@/db/db";
import { getCurrentAdmin } from "@/lib/getCurrentAdmin";
import { redirect } from "next/navigation";
import { approveAdmin, rejectAdmin } from "./_actions/teamActions";
import RemoveAdminButton from "./_components/RemoveAdminButton";
import { CheckCircle2, XCircle, Clock, ShieldCheck } from "lucide-react";

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    APPROVED: "bg-green-50 text-green-700 border-green-200",
    PENDING_APPROVAL: "bg-amber-50 text-amber-700 border-amber-200",
    PENDING_VERIFICATION: "bg-stone-100 text-stone-500 border-stone-200",
    REJECTED: "bg-red-50 text-red-700 border-red-200",
  };
  const labels: Record<string, string> = {
    APPROVED: "Approved",
    PENDING_APPROVAL: "Pending approval",
    PENDING_VERIFICATION: "Awaiting email verification",
    REJECTED: "Rejected",
  };
  return (
    <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}

export default async function TeamPage() {
  const currentAdmin = await getCurrentAdmin();
  if (!currentAdmin) redirect("/login");

  const admins = await db.admin.findMany({ orderBy: { createdAt: "asc" } });
  const pending = admins.filter((a) => a.status === "PENDING_APPROVAL");
  const others = admins.filter((a) => a.status !== "PENDING_APPROVAL");

  // The first admin (earliest created) is the owner — only they can remove others.
  const firstAdmin = admins[0];
  const isOwner = !!firstAdmin && currentAdmin.id === firstAdmin.id;

  return (
    <div className="min-h-screen bg-stone-50 p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-stone-900">Team</h1>
        <p className="text-sm text-stone-500 mt-0.5">
          Manage who has access to the admin dashboard.
        </p>
      </div>

      {pending.length > 0 && (
        <div>
          <h2 className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-4">
            Pending approval
          </h2>
          <div className="bg-white rounded-2xl border border-stone-200 shadow-sm divide-y divide-stone-100">
            {pending.map((admin) => (
              <div key={admin.id} className="flex items-center justify-between px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                    <Clock size={16} />
                  </div>
                  <div>
                    <p className="font-semibold text-stone-800 text-sm">{admin.name}</p>
                    <p className="text-xs text-stone-400">{admin.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <form action={approveAdmin.bind(null, admin.id)}>
                    <button
                      type="submit"
                      className="flex items-center gap-1.5 text-xs font-semibold text-green-700 bg-green-50 hover:bg-green-100 px-3 py-1.5 rounded-xl transition"
                    >
                      <CheckCircle2 size={14} /> Approve
                    </button>
                  </form>
                  <form action={rejectAdmin.bind(null, admin.id)}>
                    <button
                      type="submit"
                      className="flex items-center gap-1.5 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-xl transition"
                    >
                      <XCircle size={14} /> Reject
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-4">
          All admins
        </h2>
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm divide-y divide-stone-100">
          {others.map((admin) => (
            <div key={admin.id} className="flex items-center justify-between px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-stone-100 text-stone-500 flex items-center justify-center">
                  <ShieldCheck size={16} />
                </div>
                <div>
                  <p className="font-semibold text-stone-800 text-sm">
                    {admin.name}
                    {admin.id === currentAdmin.id && (
                      <span className="text-stone-400 font-normal"> (you)</span>
                    )}
                  </p>
                  <p className="text-xs text-stone-400">{admin.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge status={admin.status} />
                {isOwner && admin.status === "APPROVED" && admin.id !== firstAdmin?.id && (
                  <RemoveAdminButton id={admin.id} name={admin.name} />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
