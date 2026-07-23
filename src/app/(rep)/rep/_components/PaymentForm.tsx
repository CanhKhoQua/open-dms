"use client";

import { useState, useTransition } from "react";
import { collectPayment } from "../actions";
import { formatMoney } from "@/lib/money";

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
      setMsg("Enter an amount greater than 0.");
      return;
    }
    startT(async () => {
      const res = await collectPayment({ customerId, amount, method });
      setMsg(
        `Collected ${res.paymentCode}: applied to ${res.applied} invoice(s), ${formatMoney(res.remaining)} unapplied.`,
      );
      setAmount(0);
    });
  }

  return (
    <div className="flex flex-col gap-2.5">
      <p className="text-[13px] text-gray-500">
        Outstanding:{" "}
        <span className="font-mono font-semibold text-gray-900">
          {formatMoney(outstanding)}
        </span>
      </p>
      <input
        type="number"
        min={0}
        value={amount || ""}
        placeholder="Amount"
        onChange={(e) => setAmount(Number(e.target.value))}
        className="w-full rounded-lg border border-gray-200 px-2.5 py-2 text-[13px] text-gray-900 focus:border-tnm-teal-500 focus:outline-none"
      />
      <select
        value={method}
        onChange={(e) => setMethod(e.target.value as Method)}
        className="w-full rounded-lg border border-gray-200 bg-white px-2.5 py-2 text-[13px] text-gray-900 focus:border-tnm-teal-500 focus:outline-none"
      >
        <option value="CASH">Cash</option>
        <option value="BANK_TRANSFER">Bank transfer</option>
        <option value="E_WALLET">E-wallet</option>
      </select>
      <button
        className="inline-flex items-center justify-center rounded-[10px] bg-tnm-teal-600 px-4 py-2.5 text-[13.5px] font-bold text-white active:bg-tnm-teal-700 disabled:opacity-60"
        disabled={pending}
        onClick={submit}
      >
        {pending ? "Collecting…" : "Collect (FIFO)"}
      </button>
      {msg && <p className="text-[12.5px] text-tnm-teal-700">{msg}</p>}
    </div>
  );
}
