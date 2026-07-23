import { getCurrentRep } from "@/lib/session";
import { getRepVisits } from "@/lib/rep/queries";

export const dynamic = "force-dynamic";

const GPS_META: Record<string, { label: string; cls: string }> = {
  OK: { label: "GPS verified", cls: "bg-emerald-50 text-emerald-700" },
  OUT_OF_RANGE: { label: "Out of range", cls: "bg-amber-50 text-amber-700" },
  MISSING: { label: "No GPS", cls: "bg-gray-100 text-gray-500" },
};

const OUTCOME_LABELS: Record<string, string> = {
  ORDER: "Order",
  NO_ORDER: "No order",
  CLOSED: "Closed",
  REVISIT: "Revisit",
};

export default async function RepHistoryPage() {
  const rep = await getCurrentRep();
  const visits = await getRepVisits(rep.id);

  return (
    <main className="px-5 pt-6 pb-6">
      <header>
        <h1 className="text-[22px] font-bold tracking-tight text-gray-900">Visit history</h1>
        <p className="text-[13px] text-gray-500 mt-0.5">
          {visits.length} visits (yours only)
        </p>
      </header>

      <section className="mt-5 flex flex-col gap-2">
        {visits.map((v) => {
          const gps = GPS_META[v.gpsStatus] ?? GPS_META.MISSING;
          return (
            <div
              key={v.id}
              className="flex items-center gap-3 rounded-[14px] bg-white border border-gray-100 px-4 py-3"
            >
              <div className="flex-1 min-w-0">
                <span className="text-[14px] font-semibold text-gray-900 truncate block">
                  {v.customer.name}
                </span>
                <span className="text-[12px] text-gray-400 mt-0.5 block">
                  {new Date(v.checkInAt).toLocaleString("en-US")}
                  {v.outcome ? ` · ${OUTCOME_LABELS[v.outcome] ?? v.outcome}` : ""}
                </span>
              </div>
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10.5px] font-semibold shrink-0 ${gps.cls}`}
              >
                {gps.label}
              </span>
            </div>
          );
        })}
        {visits.length === 0 && (
          <p className="text-[13px] text-gray-400 py-8 text-center">No visits yet.</p>
        )}
      </section>
    </main>
  );
}
