import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { getCurrentRep } from "@/lib/session";
import { getRepCustomer, getActiveProducts } from "@/lib/rep/queries";
import { formatMoney } from "@/lib/money";
import { CheckInButton } from "../../_components/CheckInButton";
import { OrderForm } from "../../_components/OrderForm";
import { PaymentForm } from "../../_components/PaymentForm";

export const dynamic = "force-dynamic";

const AGING: { key: "current" | "d1_30" | "d31_60" | "d60_plus"; label: string }[] = [
  { key: "current", label: "Current" },
  { key: "d1_30", label: "1–30d" },
  { key: "d31_60", label: "31–60d" },
  { key: "d60_plus", label: "60+d" },
];

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const rep = await getCurrentRep();
  const [data, products] = await Promise.all([
    getRepCustomer(rep.id, id),
    getActiveProducts(),
  ]);
  if (!data) notFound();

  const { customer, aging } = data;
  const outstanding = aging.summary.total;
  const creditLimit = Number(customer.creditLimit);
  const usedPct =
    creditLimit > 0 ? Math.min(100, Math.round((outstanding / creditLimit) * 100)) : 0;
  const overLimit = creditLimit > 0 && outstanding > creditLimit;

  return (
    <main className="px-5 pt-5 pb-8">
      <Link
        href="/rep"
        className="inline-flex items-center gap-1 text-[13px] font-medium text-gray-500 active:text-gray-700"
      >
        <ChevronLeft size={16} aria-hidden="true" /> Route
      </Link>

      <header className="mt-2">
        <h1 className="text-[22px] font-bold tracking-tight text-gray-900">{customer.name}</h1>
        <p className="text-[12.5px] text-gray-400 mt-0.5">
          {customer.code}
          {customer.address ? ` · ${customer.address}` : ""}
          {customer.phone ? ` · ${customer.phone}` : ""}
        </p>
      </header>

      {/* Receivables */}
      <section className="mt-4 rounded-[14px] bg-white border border-gray-100 p-4">
        <h2 className="text-[13px] font-semibold text-gray-900">Receivables</h2>
        <p className="text-[13px] text-gray-500 mt-1">
          Outstanding{" "}
          <span className="font-mono font-semibold text-gray-900">
            {formatMoney(outstanding)}
          </span>{" "}
          of {formatMoney(creditLimit)} limit
        </p>
        <div className="h-[6px] rounded-full bg-gray-100 overflow-hidden my-3">
          <div
            className={`h-full rounded-full ${overLimit ? "bg-red-500" : "bg-tnm-teal-600"}`}
            style={{ width: `${usedPct}%` }}
          />
        </div>
        <div className="grid grid-cols-4 gap-2">
          {AGING.map((b) => (
            <div className="flex flex-col gap-0.5" key={b.key}>
              <span className="text-[10.5px] text-gray-400">{b.label}</span>
              <span className="text-[13px] font-mono font-semibold text-gray-900">
                {formatMoney(aging.summary[b.key])}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Check-in */}
      <section className="mt-3 rounded-[14px] bg-white border border-gray-100 p-4">
        <h2 className="text-[13px] font-semibold text-gray-900 mb-3">Check-in</h2>
        <CheckInButton customerId={customer.id} />
      </section>

      {/* New order */}
      <section className="mt-3 rounded-[14px] bg-white border border-gray-100 p-4">
        <h2 className="text-[13px] font-semibold text-gray-900 mb-3">New order</h2>
        <OrderForm customerId={customer.id} products={products} />
      </section>

      {/* Collect payment */}
      <section className="mt-3 rounded-[14px] bg-white border border-gray-100 p-4">
        <h2 className="text-[13px] font-semibold text-gray-900 mb-3">Collect payment</h2>
        <PaymentForm customerId={customer.id} outstanding={outstanding} />
      </section>

      {/* Recent orders */}
      <section className="mt-3 rounded-[14px] bg-white border border-gray-100 p-4">
        <h2 className="text-[13px] font-semibold text-gray-900 mb-2">Recent orders</h2>
        {customer.orders.length === 0 && (
          <p className="text-[13px] text-gray-400">No orders yet.</p>
        )}
        <div className="flex flex-col divide-y divide-gray-100">
          {customer.orders.map((o) => (
            <div className="flex items-center justify-between py-2.5" key={o.id}>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-semibold text-gray-900">{o.code}</span>
                  <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold bg-gray-100 text-gray-500">
                    {o.status}
                  </span>
                </div>
                <span className="text-[12px] text-gray-400">
                  {o.lines.length} line{o.lines.length === 1 ? "" : "s"} ·{" "}
                  {new Date(o.orderedAt).toLocaleDateString("en-US")}
                </span>
              </div>
              <span className="text-[13px] font-mono font-semibold text-gray-900 shrink-0">
                {formatMoney(Number(o.total))}
              </span>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
