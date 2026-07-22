"use client";

import { useState, useTransition } from "react";
import { createOrder } from "../actions";
import { formatVnd } from "@/lib/money";

type ProductOption = {
  id: string;
  sku: string;
  name: string;
  unit: string;
  price: number;
};

export function OrderForm({
  customerId,
  products,
}: {
  customerId: string;
  products: ProductOption[];
}) {
  const [qty, setQty] = useState<Record<string, number>>({});
  const [issue, setIssue] = useState(true);
  const [pending, startT] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  const total = products.reduce((s, p) => s + (qty[p.id] || 0) * p.price, 0);

  function submit() {
    const lines = products
      .map((p) => ({ productId: p.id, quantity: qty[p.id] || 0 }))
      .filter((l) => l.quantity > 0);
    if (lines.length === 0) {
      setMsg("Chọn ít nhất 1 sản phẩm.");
      return;
    }
    startT(async () => {
      const res = await createOrder({ customerId, lines, issueInvoice: issue });
      setMsg(`Tạo đơn ${res.orderCode} — ${formatVnd(res.total)}.`);
      setQty({});
    });
  }

  return (
    <div className="form">
      {products.map((p) => (
        <div className="line" key={p.id}>
          <div>
            <strong>{p.name}</strong>
            <span className="muted">
              {" · "}
              {formatVnd(p.price)}/{p.unit}
            </span>
          </div>
          <input
            type="number"
            min={0}
            value={qty[p.id] ?? ""}
            placeholder="0"
            onChange={(e) => setQty({ ...qty, [p.id]: Number(e.target.value) })}
          />
        </div>
      ))}
      <label className="check">
        <input
          type="checkbox"
          checked={issue}
          onChange={(e) => setIssue(e.target.checked)}
        />
        Xuất hóa đơn ngay (hạn 30 ngày)
      </label>
      <div className="total">Tổng: {formatVnd(total)}</div>
      <button className="btn primary" disabled={pending} onClick={submit}>
        {pending ? "Đang tạo..." : "Tạo đơn"}
      </button>
      {msg && <p className="hint">{msg}</p>}
    </div>
  );
}
