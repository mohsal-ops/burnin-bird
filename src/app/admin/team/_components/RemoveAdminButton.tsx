"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { removeAdmin } from "../_actions/teamActions";

export default function RemoveAdminButton({ id, name }: { id: string; name: string }) {
  const [pending, start] = useTransition();
  const confirm = useConfirm();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={async () => {
        if (!(await confirm({ title: `Remove ${name} from the team?`, description: "They'll lose admin access.", confirmText: "Remove", destructive: true }))) return;
        start(async () => {
          try {
            await removeAdmin(id);
            toast.success(`${name} removed from the team.`);
          } catch (e) {
            toast.error(e instanceof Error ? e.message : "Couldn't remove that member.");
          }
        });
      }}
      className="flex items-center gap-1.5 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-xl transition disabled:opacity-50"
    >
      <Trash2 size={14} /> {pending ? "Removing…" : "Remove"}
    </button>
  );
}
