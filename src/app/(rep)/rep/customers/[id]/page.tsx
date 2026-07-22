import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentRep } from "@/lib/session";
import { getRepCustomer, getActiveProducts } from "@/lib/rep/queries";
import { formatVnd } from "@/lib/money";
import { CheckInButton } from "../../_components/CheckInButton";
import { OrderForm } from "../../_components/OrderForm";
import { PaymentForm } from "../../_components/PaymentForm";

export const dynamic = "force-dynamic";

const AGING_LABELS: Record<string, string> = {
  current: "Trong hạn",
  d1_30: "1–30",
  d31_60: "31–60",
  d60_plus: "60+",
};

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

  return (
    <main className="wrap">
      <p className="tag">
        <Link href="/rep">← Tuyến</Link>
      </p>
      <h1>{customer.name}</h1>
      <p className="tag">
        {customer.code}
        {customer.address ? ` · ${customer.address}` : ""}
        {customer.phone ? ` · ${customer.phone}` : ""}
      </p>

      <section className="panel">
        <h3>Công nợ</h3>
        <p className="muted">
          Còn phải thu <strong>{formatVnd(outstanding)}</strong> / hạn mức{" "}
          {formatVnd(creditLimit)}
        </p>
        <div className="bar">
          <div
            className={usedPct >= 100 ? "bar-fill over" : "bar-fill"}
            style={{ width: `${usedPct}%` }}
          />
        </div>
        <div className="aging">
          {(["current", "d1_30", "d31_60", "d60_plus"] as const).map((b) => (
            <div className="aging-cell" key={b}>
              <span className="muted small">{AGING_LABELS[b]}</span>
              <strong>{formatVnd(aging.summary[b])}</strong>
            </div>
          ))}
        </div>
      </section>

      <section className="panel">
        <h3>Check-in</h3>
        <CheckInButton customerId={customer.id} />
      </section>

      <section className="panel">
        <h3>Đơn hàng mới</h3>
        <OrderForm customerId={customer.id} products={products} />
      </section>

      <section className="panel">
        <h3>Thu tiền</h3>
        <PaymentForm customerId={customer.id} outstanding={outstanding} />
      </section>

      <section className="panel">
        <h3>Đơn gần đây</h3>
        {customer.orders.length === 0 && <p className="muted">Chưa có đơn.</p>}
        {customer.orders.map((o) => (
          <div className="line" key={o.id}>
            <div>
              <strong>{o.code}</strong>
              <span className="muted"> · {o.status}</span>
              <div className="muted small">
                {o.lines.length} dòng · {new Date(o.orderedAt).toLocaleDateString("vi-VN")}
              </div>
            </div>
            <strong>{formatVnd(Number(o.total))}</strong>
          </div>
        ))}
      </section>
    </main>
  );
}
