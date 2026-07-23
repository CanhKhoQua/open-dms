"use client";

import { useMemo, useState } from "react";
import { Search, ArrowUpDown } from "lucide-react";
import { formatMoney } from "@/lib/money";

export type DebtRow = {
  customerId: string;
  code: string;
  name: string;
  outstanding: number;
  overdue: number;
  buckets: { current: number; d1_30: number; d31_60: number; d60_plus: number; total: number };
  creditLimit: number;
  overLimit: boolean;
};

type Filter = "all" | "overdue" | "over_limit";
type SortKey = "overdue" | "outstanding" | "name";

const THL =
  "font-semibold text-gray-500 text-[11px] uppercase tracking-wide px-3 py-2.5 border-b border-gray-100 text-left bg-gray-50/80";
const THR =
  "font-semibold text-gray-500 text-[11px] uppercase tracking-wide px-3 py-2.5 border-b border-gray-100 text-right bg-gray-50/80";
const TDR = "px-3 py-3 border-b border-gray-100 text-gray-800 text-right font-mono tabular-nums";

// Worst non-empty bucket drives the severity stripe on the left of each row.
function severity(b: DebtRow["buckets"]): { color: string; label: string } {
  if (b.d60_plus > 0) return { color: "var(--debt-60)", label: "60+ days" };
  if (b.d31_60 > 0) return { color: "var(--debt-31-60)", label: "31–60 days" };
  if (b.d1_30 > 0) return { color: "var(--debt-1-30)", label: "1–30 days" };
  return { color: "var(--tnm-teal-500)", label: "Current" };
}

// Stacked proportion bar of the aging buckets.
function AgingBar({ b }: { b: DebtRow["buckets"] }) {
  const segs = [
    { v: b.current, c: "var(--tnm-teal-500)" },
    { v: b.d1_30, c: "var(--debt-1-30)" },
    { v: b.d31_60, c: "var(--debt-31-60)" },
    { v: b.d60_plus, c: "var(--debt-60)" },
  ].filter((s) => s.v > 0);
  const sum = segs.reduce((s, x) => s + x.v, 0) || 1;
  return (
    <div className="flex h-[6px] w-[90px] rounded-full overflow-hidden bg-gray-100 ml-auto">
      {segs.map((s, i) => (
        <span key={i} style={{ width: `${(s.v / sum) * 100}%`, background: s.c }} />
      ))}
    </div>
  );
}

// Credit-limit utilization bar (green under 70%, amber under 100%, red over).
function LimitBar({ outstanding, limit }: { outstanding: number; limit: number }) {
  if (limit <= 0) return <span className="text-gray-300">—</span>;
  const pct = Math.min((outstanding / limit) * 100, 100);
  const color = outstanding >= limit ? "var(--debt-60)" : outstanding / limit >= 0.7 ? "var(--debt-1-30)" : "var(--tnm-teal-600)";
  return (
    <div className="flex flex-col items-end gap-1">
      <span className="text-[12px] font-mono text-gray-500">{formatMoney(limit)}</span>
      <div className="h-[5px] w-[70px] rounded-full bg-gray-100 overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

export function DebtTable({ rows }: { rows: DebtRow[] }) {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<SortKey>("overdue");

  const view = useMemo(() => {
    const needle = q.trim().toLowerCase();
    let r = rows;
    if (needle) r = r.filter((x) => x.name.toLowerCase().includes(needle) || x.code.toLowerCase().includes(needle));
    if (filter === "overdue") r = r.filter((x) => x.overdue > 0);
    if (filter === "over_limit") r = r.filter((x) => x.overLimit);
    return [...r].sort((a, b) =>
      sort === "name"
        ? a.name.localeCompare(b.name)
        : sort === "outstanding"
          ? b.outstanding - a.outstanding
          : b.overdue - a.overdue || b.outstanding - a.outstanding,
    );
  }, [rows, q, filter, sort]);

  const chips: { key: Filter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "overdue", label: "Overdue" },
    { key: "over_limit", label: "Over limit" },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden="true" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search customer or code…"
            className="w-full rounded-[10px] border border-gray-200 bg-white pl-9 pr-3 py-2 text-[13px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-tnm-teal-500/30 focus:border-tnm-teal-500"
          />
        </div>
        <div className="flex gap-1">
          {chips.map((c) => (
            <button
              key={c.key}
              onClick={() => setFilter(c.key)}
              className={`rounded-full px-3 py-1.5 text-[12px] font-semibold transition-colors ${
                filter === c.key ? "bg-tnm-teal-600 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-[14px] bg-white border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto max-h-[68vh] overflow-y-auto">
          <table className="w-full text-[13px] border-collapse">
            <thead className="sticky top-0 z-10">
              <tr>
                <th className={`${THL} sticky left-0 z-20`}>Customer</th>
                <th className={THR}>
                  <button onClick={() => setSort("outstanding")} className="inline-flex items-center gap-1 hover:text-gray-700">
                    Outstanding <ArrowUpDown size={11} className={sort === "outstanding" ? "text-tnm-teal-600" : "text-gray-300"} />
                  </button>
                </th>
                <th className={THR}>
                  <button onClick={() => setSort("overdue")} className="inline-flex items-center gap-1 hover:text-gray-700">
                    Overdue <ArrowUpDown size={11} className={sort === "overdue" ? "text-tnm-teal-600" : "text-gray-300"} />
                  </button>
                </th>
                <th className={THR}>Aging</th>
                <th className={THR}>Limit</th>
              </tr>
            </thead>
            <tbody>
              {view.map((r) => {
                const sev = severity(r.buckets);
                return (
                  <tr key={r.customerId} className={r.overLimit ? "bg-red-50/40" : undefined}>
                    <td className="px-3 py-3 border-b border-gray-100 sticky left-0 bg-inherit">
                      <div className="flex items-center gap-2.5">
                        <span
                          className="w-1 h-8 rounded-full shrink-0"
                          style={{ background: sev.color }}
                          title={sev.label}
                          aria-hidden="true"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-900 truncate">{r.name}</span>
                            {r.overLimit && (
                              <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold bg-red-50 text-red-600 shrink-0">
                                Over limit
                              </span>
                            )}
                          </div>
                          <span className="text-gray-400 text-[11.5px] font-mono">{r.code}</span>
                        </div>
                      </div>
                    </td>
                    <td className={TDR}>{formatMoney(r.outstanding)}</td>
                    <td className={`${TDR} ${r.overdue > 0 ? "text-amber-700 font-semibold" : "text-gray-400"}`}>
                      {r.overdue > 0 ? formatMoney(r.overdue) : "—"}
                    </td>
                    <td className="px-3 py-3 border-b border-gray-100">
                      <AgingBar b={r.buckets} />
                    </td>
                    <td className="px-3 py-3 border-b border-gray-100">
                      <LimitBar outstanding={r.outstanding} limit={r.creditLimit} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {view.length === 0 && (
          <p className="text-[13px] text-gray-400 px-4 py-8 text-center">No matching receivables.</p>
        )}
      </div>
    </div>
  );
}
