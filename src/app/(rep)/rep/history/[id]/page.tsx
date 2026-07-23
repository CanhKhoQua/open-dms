import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, MapPin, Clock, StickyNote, ChevronRight } from "lucide-react";
import { getCurrentRep } from "@/lib/session";
import { getRepVisit } from "@/lib/rep/queries";

export const dynamic = "force-dynamic";

const GPS_META: Record<string, { label: string; cls: string; dot: string }> = {
  OK: { label: "GPS verified", cls: "bg-emerald-50 text-emerald-700", dot: "#059669" },
  OUT_OF_RANGE: { label: "Out of range", cls: "bg-amber-50 text-amber-700", dot: "#d97706" },
  MISSING: { label: "No GPS", cls: "bg-gray-100 text-gray-500", dot: "#9ca3af" },
};

const OUTCOME_LABELS: Record<string, string> = {
  ORDER: "Order placed",
  NO_ORDER: "No order",
  CLOSED: "Store closed",
  REVISIT: "Revisit needed",
};

export default async function VisitDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const rep = await getCurrentRep();
  const visit = await getRepVisit(rep.id, id);
  if (!visit) notFound();

  const gps = GPS_META[visit.gpsStatus] ?? GPS_META.MISSING;
  const hasCoords = visit.latitude != null && visit.longitude != null;

  return (
    <main className="px-5 pt-5 pb-8">
      <Link
        href="/rep/history"
        className="inline-flex items-center gap-1 text-[13px] font-medium text-gray-500 active:text-gray-700"
      >
        <ChevronLeft size={16} aria-hidden="true" /> Visit history
      </Link>

      <header className="mt-2 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-[22px] font-bold tracking-tight text-gray-900 truncate">
            {visit.customer.name}
          </h1>
          <p className="text-[12.5px] text-gray-400 mt-0.5">{visit.customer.code}</p>
        </div>
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold shrink-0 ${gps.cls}`}>
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: gps.dot }} />
          {gps.label}
        </span>
      </header>

      <section className="mt-4 rounded-[14px] bg-white border border-gray-100 divide-y divide-gray-100">
        <div className="flex items-center gap-3 px-4 py-3.5">
          <Clock size={17} className="text-gray-400 shrink-0" aria-hidden="true" />
          <div className="flex-1 min-w-0">
            <p className="text-[11px] text-gray-400">Checked in</p>
            <p className="text-[13.5px] font-medium text-gray-900">
              {new Date(visit.checkInAt).toLocaleString("en-US")}
            </p>
          </div>
        </div>
        {visit.checkOutAt && (
          <div className="flex items-center gap-3 px-4 py-3.5">
            <Clock size={17} className="text-gray-400 shrink-0" aria-hidden="true" />
            <div className="flex-1 min-w-0">
              <p className="text-[11px] text-gray-400">Checked out</p>
              <p className="text-[13.5px] font-medium text-gray-900">
                {new Date(visit.checkOutAt).toLocaleString("en-US")}
              </p>
            </div>
          </div>
        )}
        {visit.outcome && (
          <div className="flex items-center gap-3 px-4 py-3.5">
            <span className="w-[17px] h-[17px] rounded-full bg-tnm-teal-50 flex items-center justify-center shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-tnm-teal-600" />
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] text-gray-400">Outcome</p>
              <p className="text-[13.5px] font-medium text-gray-900">
                {OUTCOME_LABELS[visit.outcome] ?? visit.outcome}
              </p>
            </div>
          </div>
        )}
        {hasCoords && (
          <a
            href={`https://www.openstreetmap.org/?mlat=${visit.latitude}&mlon=${visit.longitude}#map=17/${visit.latitude}/${visit.longitude}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-3 px-4 py-3.5 active:bg-gray-50"
          >
            <MapPin size={17} className="text-gray-400 shrink-0" aria-hidden="true" />
            <div className="flex-1 min-w-0">
              <p className="text-[11px] text-gray-400">Check-in location</p>
              <p className="text-[13.5px] font-medium text-gray-900 font-mono">
                {(visit.latitude as number).toFixed(5)}, {(visit.longitude as number).toFixed(5)}
              </p>
            </div>
            <ChevronRight size={16} className="text-gray-300 shrink-0" aria-hidden="true" />
          </a>
        )}
      </section>

      {visit.note && (
        <section className="mt-3 rounded-[14px] bg-white border border-gray-100 p-4">
          <h2 className="flex items-center gap-2 text-[13px] font-semibold text-gray-900 mb-2">
            <StickyNote size={15} className="text-gray-400" aria-hidden="true" /> Note
          </h2>
          <p className="text-[13px] leading-relaxed text-gray-600">{visit.note}</p>
        </section>
      )}

      {visit.photoUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={visit.photoUrl}
          alt="Visit photo"
          className="mt-3 w-full rounded-[14px] border border-gray-100 object-cover"
        />
      )}

      <Link
        href={`/rep/customers/${visit.customerId}`}
        className="mt-4 flex items-center justify-center gap-2 rounded-[14px] bg-tnm-teal-600 px-4 py-3 text-[13.5px] font-bold text-white active:bg-tnm-teal-700 transition-colors"
      >
        Open customer <ChevronRight size={16} aria-hidden="true" />
      </Link>
    </main>
  );
}
