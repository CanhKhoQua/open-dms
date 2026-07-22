"use client";

import { useTransition } from "react";
import { startShift, endShift } from "../actions";

export function ShiftControl({ open }: { open: boolean }) {
  const [pending, startT] = useTransition();
  return (
    <div className="shiftbar">
      <span className={open ? "dot on" : "dot"} />
      <span>{open ? "Đang trong ca" : "Chưa vào ca"}</span>
      <button
        className="btn"
        disabled={pending}
        onClick={() => startT(async () => (open ? endShift() : startShift()))}
      >
        {pending ? "..." : open ? "Kết ca" : "Vào ca"}
      </button>
    </div>
  );
}
