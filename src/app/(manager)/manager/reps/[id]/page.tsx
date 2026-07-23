import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { getRepDetail } from "@/lib/manager/queries";
import { formatMoney } from "@/lib/money";

export const dynamic = "force-dynamic";

const GPS_META: Record<string, { label: string; cls: string }> = {
  OK: { label: "GPS verified", cls: "bg-emerald-50 text-emerald-700" },
  OUT_OF_RANGE: { label: "Out of range", cls: "bg-amber-50 text-amber-700" },
  MISSING: { label: "No GPS", cls: "bg-gray-100 text-gray-500" },
};

export default async function ManagerRepDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getRepDetail(id);
  if (!data) notFound();
  const { rep, customers, recentVisits, recentOrders } = data;

  return (
    <div className="px-6 py-6 max-w-[1000px]">
      <Link href="/manager/reps" className="inline-flex items-center gap-1 text-[13px] font-medium text-gray-500 hover:text-gray-700">
        <ChevronLeft size={16} aria-hidden="true" /> Reps
      </Link>
      <div className="mt-2 flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-tnm-teal-600 text-white flex items-center justify-center text-[16px] font-bold">
          {rep.name.split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase()}
        </div>
        <div>
          <h1 className="text-[20px] font-bold tracking-tight text-gray-900">{rep.name}</h1>
          <p className="text-[12.5px] text-gray-400">{rep.email} · {customers.length} customers</p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(300px,1fr))]">
        <section className="rounded-[14px] bg-white border border-gray-100 p-4">
          <h2 className="text-[13px] font-semibold text-gray-900 mb-2">Assigned customers</h2>
          <div className="flex flex-col divide-y divide-gray-100">
            {customers.map((c) => (
              <div key={c.id} className="py-2 text-[13px] text-gray-800">
                {c.name} <span className="text-gray-400 text-[12px]">{c.code}</span>
              </div>
            ))}
            {customers.length === 0 && <p className="text-[13px] text-gray-400 py-2">None.</p>}
          </div>
        </section>

        <section className="rounded-[14px] bg-white border border-gray-100 p-4">
          <h2 className="text-[13px] font-semibold text-gray-900 mb-2">Recent visits</h2>
          <div className="flex flex-col divide-y divide-gray-100">
            {recentVisits.map((v) => {
              const gps = GPS_META[v.gpsStatus] ?? GPS_META.MISSING;
              return (
                <div key={v.id} className="py-2 flex items-center gap-2">
                  <span className="text-[13px] text-gray-800 flex-1 min-w-0 truncate">{v.customer.name}</span>
                  <span className="text-[11px] text-gray-400">{new Date(v.checkInAt).toLocaleDateString("en-US")}</span>
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${gps.cls}`}>{gps.label}</span>
                </div>
              );
            })}
            {recentVisits.length === 0 && <p className="text-[13px] text-gray-400 py-2">None.</p>}
          </div>
        </section>

        <section className="rounded-[14px] bg-white border border-gray-100 p-4">
          <h2 className="text-[13px] font-semibold text-gray-900 mb-2">Recent orders</h2>
          <div className="flex flex-col divide-y divide-gray-100">
            {recentOrders.map((o) => (
              <div key={o.id} className="py-2 flex items-center gap-2">
                <span className="text-[13px] font-medium text-gray-900">{o.code}</span>
                <span className="text-[12px] text-gray-400 flex-1 min-w-0 truncate">{o.customer.name}</span>
                <span className="text-[13px] font-mono text-gray-800">{formatMoney(Number(o.total))}</span>
              </div>
            ))}
            {recentOrders.length === 0 && <p className="text-[13px] text-gray-400 py-2">None.</p>}
          </div>
        </section>
      </div>
    </div>
  );
}
