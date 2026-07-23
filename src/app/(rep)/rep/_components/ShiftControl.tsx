"use client";

import { useTransition } from "react";
import { startShift, endShift } from "../actions";

export function ShiftControl({ open }: { open: boolean }) {
  const [pending, startT] = useTransition();
  return (
    <div className="flex items-center gap-3 rounded-[14px] border border-gray-100 bg-white px-4 py-3">
      <span className={`r-dot ${open ? "r-dot--live" : ""}`} />
      <span className="text-[13.5px] font-semibold text-gray-900">
        {open ? "On shift" : "Off shift"}
      </span>
      <button
        className={
          open
            ? "ml-auto inline-flex items-center justify-center rounded-[10px] border border-gray-200 bg-white px-4 py-2 text-[13px] font-semibold text-gray-900 active:bg-gray-50 disabled:opacity-60"
            : "ml-auto inline-flex items-center justify-center rounded-[10px] bg-tnm-teal-600 px-4 py-2 text-[13px] font-bold text-white active:bg-tnm-teal-700 disabled:opacity-60"
        }
        disabled={pending}
        onClick={() => startT(async () => (open ? endShift() : startShift()))}
      >
        {pending ? "…" : open ? "End shift" : "Start shift"}
      </button>
    </div>
  );
}
