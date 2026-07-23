import Link from "next/link";
import { ChevronRight, UserCog } from "lucide-react";
import { getRepDirectory } from "@/lib/manager/queries";

export const dynamic = "force-dynamic";

export default async function ManagerRepsPage() {
  const reps = await getRepDirectory();

  return (
    <div className="px-6 py-6 max-w-[900px]">
      <p className="text-[13px] text-gray-500 mb-4">{reps.length} sales reps</p>
      <div className="grid gap-2.5 [grid-template-columns:repeat(auto-fill,minmax(280px,1fr))]">
        {reps.map((r) => (
          <Link
            key={r.id}
            href={`/manager/reps/${r.id}`}
            className="flex items-center gap-3 rounded-[14px] bg-white border border-gray-100 px-4 py-3.5 hover:bg-gray-50 transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-tnm-teal-600 text-white flex items-center justify-center text-[13px] font-bold shrink-0">
              {r.name.split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[14px] font-semibold text-gray-900 truncate">{r.name}</div>
              <div className="text-[12px] text-gray-400 truncate">{r.email}</div>
            </div>
            <div className="flex items-center gap-1 text-[12px] text-gray-500 shrink-0">
              <UserCog size={14} className="text-gray-400" aria-hidden="true" />
              {r.assigned}
            </div>
            <ChevronRight size={18} className="text-gray-300 shrink-0" aria-hidden="true" />
          </Link>
        ))}
        {reps.length === 0 && <p className="text-[13px] text-gray-400 py-8 text-center">No reps.</p>}
      </div>
    </div>
  );
}
