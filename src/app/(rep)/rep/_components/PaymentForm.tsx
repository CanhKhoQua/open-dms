"use client";

import { useState, useTransition } from "react";
import { collectPayment } from "../actions";
import { formatVnd } from "@/lib/money";

type Method = "CASH" | "BANK_TRANSFER" | "E_WALLET";

export function PaymentForm({
  customerId,
  outstanding,
}: {
  customerId: string;
  outstanding: number;
}) {
  const [amount, setAmount] = useState<number>(0);
  const [method, setMethod] = useState<Method>("CASH");
  const [pending, startT] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  function submit() {
    if (amount <= 0) {
      setMsg("Nhập số tiền > 0.");
      return;
    }
    startT(async () => {
      const res = await collectPayment({ customerId, amount, method });
      setMsg(
        `Đã thu ${res.paymentCode}: đối trừ ${res.applied} hóa đơn, dư ${formatVnd(res.remaining)}.`,
      );
      setAmount(0);
    });
  }

  return (
    <div className="form">
      <p className="muted">
        Còn phải thu: <strong>{formatVnd(outstanding)}</strong>
      </p>
      <input
        type="number"
        min={0}
        value={amount || ""}
        placeholder="Số tiền"
        onChange={(e) => setAmount(Number(e.target.value))}
      />
      <select value={method} onChange={(e) => setMethod(e.target.value as Method)}>
        <option value="CASH">Tiền mặt</option>
        <option value="BANK_TRANSFER">Chuyển khoản</option>
        <option value="E_WALLET">Ví điện tử</option>
      </select>
      <button className="btn primary" disabled={pending} onClick={submit}>
        {pending ? "Đang thu..." : "Thu tiền (FIFO)"}
      </button>
      {msg && <p className="hint">{msg}</p>}
    </div>
  );
}
