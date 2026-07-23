import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { getCurrentRep } from "@/lib/session";
import { getTodayRoute, hasOpenShift } from "@/lib/rep/queries";
import { formatMoney } from "@/lib/money";
import { ShiftControl } from "./_components/ShiftControl";

export const dynamic = "force-dynamic";

export default async function RepRoutePage() {
  const rep = await getCurrentRep();
  const [route, shift] = await Promise.all([
    getTodayRoute(rep.id),
    hasOpenShift(rep.id),
  ]);
  const plannedCount = route.filter((r) => r.plannedToday).length;

  return (
    <main className="px-5 pt-6 pb-6">
      <header>
        <h1 className="text-[22px] font-bold tracking-tight text-gray-900">
          Hi, {rep.name.split(" ")[0]}
        </h1>
        <p className="text-[13px] text-gray-500 mt-0.5">
          {plannedCount} planned today · {route.length} in your book
        </p>
      </header>

      <div className="mt-4">
        <ShiftControl open={Boolean(shift)} />
      </div>

      <section className="mt-5 flex flex-col gap-2">
        {route.map((r) => (
          <Link
            key={r.customerId}
            href={`/rep/customers/${r.customerId}`}
            className="flex items-center gap-3 rounded-[14px] bg-white border border-gray-100 px-4 py-3 active:bg-gray-50 transition-colors"
          >
            <div className="flex-1 min-w-0">
              <span className="text-[14px] font-semibold text-gray-900 truncate block">
                {r.name}
              </span>
              <span className="text-[12px] text-gray-400 mt-0.5 truncate block">
                {r.code}
                {r.address ? ` · ${r.address}` : ""}
              </span>
            </div>
            <div className="flex flex-col items-end gap-1 shrink-0">
              <div className="flex gap-1">
                {r.plannedToday && (
                  <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10.5px] font-semibold bg-tnm-teal-50 text-tnm-teal-700">
                    Today
                  </span>
                )}
                {r.visitedToday && (
                  <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10.5px] font-semibold bg-emerald-50 text-emerald-700">
                    Visited
                  </span>
                )}
              </div>
              {r.outstanding > 0 && (
                <span className="text-[12px] font-mono font-semibold text-amber-700">
                  {formatMoney(r.outstanding)}
                </span>
              )}
            </div>
            <ChevronRight size={18} className="text-gray-300 shrink-0" aria-hidden="true" />
          </Link>
        ))}
        {route.length === 0 && (
          <p className="text-[13px] text-gray-400 py-8 text-center">
            No customers assigned yet.
          </p>
        )}
      </section>
    </main>
  );
}
