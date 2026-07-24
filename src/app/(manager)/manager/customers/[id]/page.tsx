import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { getManagerCustomer } from "@/lib/manager/queries";
import { formatMoney } from "@/lib/money";

export const dynamic = "force-dynamic";

const TYPE_LABELS: Record<string, string> = {
  RETAIL: "Retail",
  WHOLESALE: "Wholesale",
  KEY_ACCOUNT: "Key account",
};

const TIER_CLASS: Record<string, string> = {
  A: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  B: "bg-blue-50 text-blue-700 ring-blue-200",
  C: "bg-amber-50 text-amber-700 ring-amber-200",
  D: "bg-gray-100 text-gray-500 ring-gray-200",
};

const GPS_META: Record<string, { label: string; cls: string }> = {
  OK: { label: "GPS verified", cls: "bg-emerald-50 text-emerald-700" },
  OUT_OF_RANGE: { label: "Out of range", cls: "bg-amber-50 text-amber-700" },
  MISSING: { label: "No GPS", cls: "bg-gray-100 text-gray-500" },
};

const AGING: { key: "current" | "d1_30" | "d31_60" | "d60_plus"; label: string }[] = [
  { key: "current", label: "Current" },
  { key: "d1_30", label: "1–30d" },
  { key: "d31_60", label: "31–60d" },
  { key: "d60_plus", label: "60+d" },
];

export default async function ManagerCustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getManagerCustomer(id);
  if (!data) notFound();

  const { customer, rep, aging, creditLimit, overLimit } = data;
  const outstanding = aging.summary.total;
  const usedPct = creditLimit > 0 ? Math.min(100, Math.round((outstanding / creditLimit) * 100)) : 0;

  return (
    <div className="px-6 py-6 max-w-[1000px]">
      <Link href="/manager/customers" className="inline-flex items-center gap-1 text-[13px] font-medium text-gray-500 hover:text-gray-700">
        <ChevronLeft size={16} aria-hidden="true" /> Customers
      </Link>

      <header className="mt-2">
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="text-[20px] font-bold tracking-tight text-gray-900">{customer.name}</h1>
          {customer.tier && (
            <span
              className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-[11px] font-bold ring-1 ${
                TIER_CLASS[customer.tier] ?? TIER_CLASS.D
              }`}
            >
              {customer.tier}
            </span>
          )}
          {customer.customerType && (
            <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10.5px] font-semibold bg-tnm-teal-50 text-tnm-teal-700">
              {TYPE_LABELS[customer.customerType] ?? customer.customerType}
            </span>
          )}
          {overLimit && (
            <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10.5px] font-semibold bg-red-50 text-red-600">
              Over limit
            </span>
          )}
        </div>
        <p className="text-[12.5px] text-gray-400 mt-0.5">
          {customer.code}
          {customer.address ? ` · ${customer.address}` : ""}
          {customer.phone ? ` · ${customer.phone}` : ""}
          {rep ? ` · Rep: ${rep.name}` : " · Unassigned"}
        </p>
        {customer.tags && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {customer.tags.split(",").filter(Boolean).map((t) => (
              <span key={t} className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                {t}
              </span>
            ))}
          </div>
        )}
      </header>

      <div className="mt-5 grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(300px,1fr))]">
        <section className="rounded-[14px] bg-white border border-gray-100 p-4">
          <h2 className="text-[13px] font-semibold text-gray-900">Receivables</h2>
          <p className="text-[13px] text-gray-500 mt-1">
            Outstanding <span className="font-mono font-semibold text-gray-900">{formatMoney(outstanding)}</span> of{" "}
            {formatMoney(creditLimit)} limit
          </p>
          <div className="h-[6px] rounded-full bg-gray-100 overflow-hidden my-3">
            <div className={`h-full rounded-full ${overLimit ? "bg-red-500" : "bg-tnm-teal-600"}`} style={{ width: `${usedPct}%` }} />
          </div>
          <div className="grid grid-cols-4 gap-2">
            {AGING.map((b) => (
              <div className="flex flex-col gap-0.5" key={b.key}>
                <span className="text-[10.5px] text-gray-400">{b.label}</span>
                <span className="text-[13px] font-mono font-semibold text-gray-900">{formatMoney(aging.summary[b.key])}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[14px] bg-white border border-gray-100 p-4">
          <h2 className="text-[13px] font-semibold text-gray-900 mb-2">Recent orders</h2>
          <div className="flex flex-col divide-y divide-gray-100">
            {customer.orders.map((o) => (
              <div key={o.id} className="py-2 flex items-center gap-2">
                <span className="text-[13px] font-medium text-gray-900">{o.code}</span>
                <span className="text-[12px] text-gray-400 flex-1 min-w-0 truncate">
                  {new Date(o.orderedAt).toLocaleDateString("en-US")}
                  {o.rep ? ` · ${o.rep.name}` : ""}
                </span>
                <span className="text-[13px] font-mono text-gray-800">{formatMoney(Number(o.total))}</span>
              </div>
            ))}
            {customer.orders.length === 0 && <p className="text-[13px] text-gray-400 py-2">No orders yet.</p>}
          </div>
        </section>

        <section className="rounded-[14px] bg-white border border-gray-100 p-4">
          <h2 className="text-[13px] font-semibold text-gray-900 mb-2">Recent visits</h2>
          <div className="flex flex-col divide-y divide-gray-100">
            {customer.visits.map((v) => {
              const gps = GPS_META[v.gpsStatus] ?? GPS_META.MISSING;
              return (
                <div key={v.id} className="py-2 flex items-center gap-2">
                  <span className="text-[13px] text-gray-800 flex-1 min-w-0 truncate">
                    {v.rep ? v.rep.name : "—"}
                  </span>
                  <span className="text-[11px] text-gray-400">{new Date(v.checkInAt).toLocaleDateString("en-US")}</span>
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${gps.cls}`}>{gps.label}</span>
                </div>
              );
            })}
            {customer.visits.length === 0 && <p className="text-[13px] text-gray-400 py-2">No visits yet.</p>}
          </div>
        </section>
      </div>
    </div>
  );
}
