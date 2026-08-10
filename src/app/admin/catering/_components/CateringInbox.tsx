"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, MoreVertical, Trash2, Phone, Mail } from "lucide-react";
import { updateCateringStatus, deleteCateringRequest } from "../_actions/cateringActions";

type CateringRequestRow = {
  id: string;
  name: string;
  email: string;
  phone: string;
  eventType: string;
  date: string;
  guests: string;
  notes: string | null;
  status: string;
  createdAt: Date;
};

const STATUS_STYLES: Record<string, string> = {
  new: "bg-orange-50 text-orange-600",
  contacted: "bg-blue-50 text-blue-600",
  confirmed: "bg-green-50 text-green-600",
  declined: "bg-red-50 text-red-600",
};

const STATUS_TABS = ["all", "new", "contacted", "confirmed", "declined"] as const;

export default function CateringInbox({ requests }: { requests: CateringRequestRow[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<(typeof STATUS_TABS)[number]>("all");

  const filtered = filter === "all" ? requests : requests.filter((r) => r.status === filter);

  const changeStatus = (id: string, status: string) => {
    startTransition(async () => {
      await updateCateringStatus(id, status);
      router.refresh();
      toast.success(`Marked as ${status}`);
    });
  };

  const remove = (id: string) => {
    if (!confirm("Delete this catering request? This cannot be undone.")) return;
    startTransition(async () => {
      await deleteCateringRequest(id);
      router.refresh();
      toast.success("Request deleted");
    });
  };

  return (
    <div className="space-y-4 px-4 md:px-0">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {STATUS_TABS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
              filter === f ? "bg-[#c85a1e] text-white" : "bg-stone-100 text-stone-500 hover:bg-stone-200"
            }`}
          >
            {f[0].toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-8 text-center text-stone-400 text-sm">
            No catering requests
          </div>
        )}
        {filtered.map((r) => {
          const isExpanded = expandedId === r.id;
          return (
            <div key={r.id} className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
              <button
                className="w-full flex flex-wrap items-center gap-3 p-4 text-left"
                onClick={() => setExpandedId(isExpanded ? null : r.id)}
              >
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${
                    STATUS_STYLES[r.status] ?? STATUS_STYLES.new
                  }`}
                >
                  {r.status}
                </span>
                <span className="font-medium text-stone-800">{r.name}</span>
                <span className="text-xs text-stone-500">{r.eventType}</span>
                <span className="text-xs text-stone-400">
                  {r.date} · {r.guests} guests
                </span>
                <span className="text-xs text-stone-400 ml-auto hidden sm:inline">
                  {new Date(r.createdAt).toLocaleString()}
                </span>
                <ChevronDown
                  size={16}
                  className={`text-stone-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                />
              </button>

              {isExpanded && (
                <div className="border-t border-stone-100 p-4 space-y-4">
                  <div className="grid sm:grid-cols-2 gap-2 text-sm text-stone-600">
                    <p className="flex items-center gap-2">
                      <Mail size={13} /> {r.email}
                    </p>
                    <p className="flex items-center gap-2">
                      <Phone size={13} /> {r.phone}
                    </p>
                    <p>
                      <span className="font-semibold text-stone-700">Event type:</span> {r.eventType}
                    </p>
                    <p>
                      <span className="font-semibold text-stone-700">Date:</span> {r.date}
                    </p>
                    <p>
                      <span className="font-semibold text-stone-700">Guests:</span> {r.guests}
                    </p>
                  </div>

                  {r.notes && (
                    <div className="bg-stone-50 rounded-xl p-3 text-sm text-stone-600">
                      <p className="font-semibold text-stone-700 mb-1">Notes</p>
                      {r.notes}
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" disabled={isPending} className="gap-1.5">
                          Change status <MoreVertical size={14} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => changeStatus(r.id, "contacted")}>
                          Mark as Contacted
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => changeStatus(r.id, "confirmed")}>
                          Mark as Confirmed
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => changeStatus(r.id, "declined")}>
                          Mark as Declined
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => changeStatus(r.id, "new")}>
                          Mark as New
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <Button
                      variant="destructive"
                      size="sm"
                      disabled={isPending}
                      className="gap-1.5"
                      onClick={() => remove(r.id)}
                    >
                      <Trash2 size={14} /> Delete
                    </Button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
