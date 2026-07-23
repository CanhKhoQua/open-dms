import Link from "next/link";
import { ChevronRight, Check, MapPin } from "lucide-react";
import { getCurrentRep } from "@/lib/session";
import { getTodayRoute, hasOpenShift } from "@/lib/rep/queries";
import { formatMoney } from "@/lib/money";
import { ShiftCard } from "./_components/ShiftCard";

export const dynamic = "force-dynamic";

const DATE_FMT = new Intl.DateTimeFormat("en-US", {
  weekday: "long",
  month: "short",
  day: "numeric",
});

export default async function RepRoutePage() {
  const rep = await getCurrentRep();
  const [route, shift] = await Promise.all([
    getTodayRoute(rep.id),
    hasOpenShift(rep.id),
  ]);
  const planned = route.filter((r) => r.plannedToday);
  const plannedDone = planned.filter((r) => r.visitedToday).length;

  return (
    <main className="px-5 pt-6 pb-6">
      <header>
        <p className="text-[11.5px] font-semibold uppercase tracking-[0.08em] text-tnm-teal-600">
          {DATE_FMT.format(new Date())}
        </p>
        <h1 className="text-[22px] font-bold tracking-tight text-gray-900 mt-1">
          Hi, {rep.name.split(" ")[0]}
        </h1>
        <p className="text-[13px] text-gray-500 mt-0.5">
          {planned.length} planned today · {route.length} in your book
        </p>
      </header>

      <div className="mt-4">
        <ShiftCard
          startedAt={shift ? shift.startedAt.toISOString() : null}
          done={plannedDone}
          total={planned.length}
        />
      </div>

      <Link
        href="/rep/map"
        className="mt-3 flex items-center gap-3 rounded-[14px] bg-white border border-gray-100 px-4 py-3 active:bg-gray-50 transition-colors"
      >
        <div className="w-9 h-9 rounded-[10px] bg-tnm-teal-50 flex items-center justify-center shrink-0">
          <MapPin size={18} className="text-tnm-teal-600" aria-hidden="true" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13.5px] font-semibold text-gray-900">Open route map</p>
          <p className="text-[11.5px] text-gray-400 mt-[2px]">See your customers and today&rsquo;s plan on the map</p>
        </div>
        <ChevronRight size={18} className="text-gray-300 shrink-0" aria-hidden="true" />
      </Link>

      <section className="mt-5 flex flex-col gap-2">
        {route.map((r) => (
          <Link
            key={r.customerId}
            href={`/rep/customers/${r.customerId}`}
            className="flex items-center gap-3 rounded-[14px] bg-white border border-gray-100 px-4 py-3 active:bg-gray-50 transition-colors"
          >
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 border ${
                r.visitedToday
                  ? "bg-emerald-500 border-emerald-500 text-white"
                  : r.plannedToday
                    ? "border-tnm-teal-500 text-transparent"
                    : "border-gray-200 text-transparent"
              }`}
              aria-hidden="true"
            >
              <Check size={13} strokeWidth={3} />
            </span>
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
                {r.plannedToday && !r.visitedToday && (
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

      <Link
        href="/rep/customers"
        className="mt-4 flex items-center justify-center gap-2 rounded-[14px] border border-dashed border-gray-200 px-4 py-3 text-[13px] font-semibold text-gray-500 active:bg-gray-50 transition-colors"
      >
        All customers <ChevronRight size={15} aria-hidden="true" />
      </Link>
    </main>
  );
}
