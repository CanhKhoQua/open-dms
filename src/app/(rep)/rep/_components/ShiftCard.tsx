"use client";

import { useEffect, useState, useTransition } from "react";
import { Clock, Square, Check } from "lucide-react";
import { startShift, endShift } from "../actions";

function humanDur(ms: number): string {
  const m = Math.floor(ms / 60000);
  const h = Math.floor(m / 60);
  const rm = m % 60;
  if (h === 0) return `${rm}m`;
  if (rm === 0) return `${h}h`;
  return `${h}h ${rm}m`;
}

export function ShiftCard({ startedAt, done, total }: { startedAt: string | null; done: number; total: number }) {
  const [pending, startT] = useTransition();
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(id);
  }, []);

  const startTs = startedAt ? new Date(startedAt).getTime() : null;
  const active = startTs != null;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  if (!active) {
    return (
      <div className="flex flex-col gap-3 px-[14px] py-[13px] rounded-[14px] bg-tnm-teal-600 text-white" style={{ boxShadow: "var(--shadow-brand-glow)" }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-[10px] bg-white/[0.18] flex items-center justify-center shrink-0">
            <Clock size={18} aria-hidden="true" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13.5px] font-bold">No shift started yet</p>
            <p className="text-[11.5px] text-white/[0.78] font-mono mt-[2px]">Start to share GPS and track visits</p>
          </div>
        </div>
        <button onClick={() => startT(async () => startShift())} disabled={pending} className="inline-flex items-center justify-center gap-2 w-full py-[13px] rounded-[10px] bg-white text-tnm-teal-700 text-[13.5px] font-bold active:bg-gray-50 disabled:opacity-70">
          <span className="w-2 h-2 rounded-full bg-tnm-teal-600" />
          {pending ? "Starting…" : "Start shift"}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 px-[14px] py-[13px] rounded-[14px] bg-white border border-[var(--border-soft)]">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-[10px] bg-emerald-50 flex items-center justify-center shrink-0">
          <span className="relative w-3 h-3 inline-block">
            <span className="absolute inset-0 rounded-full bg-emerald-500" />
            <span className="rep-marker-pulse" style={{ inset: "-4px", background: "#10b981" }} />
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13.5px] font-bold text-gray-900">
            On shift
            {total > 0 && (
              <span className="font-normal text-gray-500 text-[12.5px]">
                {" · "}
                <span className="text-gray-900 font-bold font-mono">{done}/{total}</span> visits
              </span>
            )}
          </p>
          <p className="text-[11.5px] text-gray-600 font-mono mt-[2px]">Running {humanDur(now - startTs)}</p>
        </div>
      </div>
      {total > 0 && (
        <div className="h-[5px] rounded-full bg-gray-100 overflow-hidden">
          <div className="h-full rounded-full bg-tnm-teal-600 transition-[width] duration-300" style={{ width: `${pct}%` }} />
        </div>
      )}
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10.5px] text-gray-500 font-mono flex items-center gap-1.5">
          <Check size={11} aria-hidden="true" /> GPS sharing while on shift
        </p>
        <button onClick={() => startT(async () => endShift())} disabled={pending} className="inline-flex items-center gap-1.5 px-3 py-[7px] rounded-full bg-white text-gray-900 border border-[var(--border-default)] text-[12px] font-semibold active:bg-gray-50 disabled:opacity-70">
          <Square size={12} aria-hidden="true" />
          {pending ? "…" : "End shift"}
        </button>
      </div>
    </div>
  );
}
