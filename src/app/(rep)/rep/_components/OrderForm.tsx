"use client";

import { useState, useTransition } from "react";
import { createOrder } from "../actions";
import { formatMoney } from "@/lib/money";

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
      setMsg("Pick at least one product.");
      return;
    }
    startT(async () => {
      const res = await createOrder({ customerId, lines, issueInvoice: issue });
      setMsg(`Created order ${res.orderCode} — ${formatMoney(res.total)}.`);
      setQty({});
    });
  }

  return (
    <div className="flex flex-col gap-2.5">
      {products.map((p) => (
        <div
          key={p.id}
          className="flex items-center justify-between gap-3 border-b border-gray-100 pb-2"
        >
          <div className="min-w-0">
            <span className="text-[13px] font-medium text-gray-900">{p.name}</span>
            <span className="text-[12px] text-gray-400">
              {" · "}
              {formatMoney(p.price)}/{p.unit}
            </span>
          </div>
          <input
            type="number"
            min={0}
            value={qty[p.id] ?? ""}
            placeholder="0"
            onChange={(e) => setQty({ ...qty, [p.id]: Number(e.target.value) })}
            className="w-20 text-right rounded-lg border border-gray-200 px-2.5 py-1.5 text-[13px] text-gray-900 focus:border-tnm-teal-500 focus:outline-none"
          />
        </div>
      ))}
      <label className="flex items-center gap-2 text-[13px] text-gray-600">
        <input
          type="checkbox"
          checked={issue}
          onChange={(e) => setIssue(e.target.checked)}
          className="accent-tnm-teal-600"
        />
        Issue invoice now (net 30)
      </label>
      <div className="text-[14px] font-semibold text-gray-900">
        Total: <span className="font-mono">{formatMoney(total)}</span>
      </div>
      <button
        className="inline-flex items-center justify-center rounded-[10px] bg-tnm-teal-600 px-4 py-2.5 text-[13.5px] font-bold text-white active:bg-tnm-teal-700 disabled:opacity-60"
        disabled={pending}
        onClick={submit}
      >
        {pending ? "Creating…" : "Create order"}
      </button>
      {msg && <p className="text-[12.5px] text-tnm-teal-700">{msg}</p>}
    </div>
  );
}
