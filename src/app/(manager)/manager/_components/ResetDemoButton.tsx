"use client";

import { useState, useTransition } from "react";
import { RotateCcw } from "lucide-react";

export function ResetDemoButton() {
  const [pending, startT] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  function reset() {
    setMsg(null);
    startT(async () => {
      const res = await fetch("/api/seed", { method: "POST" });
      const json = await res.json();
      if (res.ok) {
        setMsg("Demo data reset.");
        location.reload();
      } else {
        setMsg(json.error ?? "Reset failed.");
      }
    });
  }

  return (
    <span className="inline-flex items-center gap-2">
      <button
        className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-[12px] font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-60"
        disabled={pending}
        onClick={reset}
      >
        <RotateCcw size={13} aria-hidden="true" />
        {pending ? "Resetting…" : "Reset demo data"}
      </button>
      {msg && <span className="text-[12px] text-gray-400">{msg}</span>}
    </span>
  );
}
