"use client";

import { useState, useTransition } from "react";

export function ResetDemoButton() {
  const [pending, startT] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  function reset() {
    setMsg(null);
    startT(async () => {
      const res = await fetch("/api/seed", { method: "POST" });
      const json = await res.json();
      if (res.ok) {
        setMsg("Đã reset dữ liệu demo.");
        location.reload();
      } else {
        setMsg(json.error ?? "Lỗi reset.");
      }
    });
  }

  return (
    <span>
      <button className="btn" disabled={pending} onClick={reset}>
        {pending ? "Đang reset..." : "Reset demo data"}
      </button>
      {msg && <span className="hint"> {msg}</span>}
    </span>
  );
}
