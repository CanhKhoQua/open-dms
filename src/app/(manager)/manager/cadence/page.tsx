import { getCadence } from "@/lib/manager/queries";

export const dynamic = "force-dynamic";

const THL = "font-medium text-gray-400 text-[11px] uppercase tracking-wide px-3 py-2 border-b border-gray-100 text-left";
const THR = "font-medium text-gray-400 text-[11px] uppercase tracking-wide px-3 py-2 border-b border-gray-100 text-right";
const TD = "px-3 py-2.5 border-b border-gray-100 text-gray-800";
const TDR = "px-3 py-2.5 border-b border-gray-100 text-gray-800 text-right font-mono tabular-nums";

const TIER_CLASS: Record<string, string> = {
  A: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  B: "bg-blue-50 text-blue-700 ring-blue-200",
  C: "bg-amber-50 text-amber-700 ring-amber-200",
  D: "bg-gray-100 text-gray-500 ring-gray-200",
};

export default async function ManagerCadencePage() {
  const { rules, dueList, dueTotal } = await getCadence();

  return (
    <div className="px-6 py-6 max-w-[1000px]">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {rules.map((r) => (
          <div key={r.tier} className="rounded-[14px] bg-white border border-gray-100 p-4">
            <div className="flex items-center justify-between">
              <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-[12px] font-bold ring-1 ${TIER_CLASS[r.tier] ?? TIER_CLASS.D}`}>
                {r.tier}
              </span>
              <span className="text-[12px] text-gray-400">every {r.intervalDays}d</span>
            </div>
            <div className="text-[12px] text-gray-500 mt-2 leading-snug">{r.label}</div>
            <div className="mt-3 flex items-baseline gap-1.5">
              <span className={`text-[20px] font-bold tabular-nums ${r.due > 0 ? "text-red-600" : "text-gray-900"}`}>{r.due}</span>
              <span className="text-[12px] text-gray-400">/ {r.total} due</span>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-[14px] bg-white border border-gray-100 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <span className="text-[13px] font-semibold text-gray-700">Due for a visit now</span>
          <span className="text-[12px] text-gray-400">{dueTotal} total{dueList.length < dueTotal ? ` · showing top ${dueList.length}` : ""}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[13px] border-collapse">
            <thead>
              <tr>
                <th className={THL}>Customer</th>
                <th className={THL}>Tier</th>
                <th className={THR}>Cadence</th>
                <th className={THR}>Last visit</th>
                <th className={THR}>Overdue by</th>
              </tr>
            </thead>
            <tbody>
              {dueList.map((d) => (
                <tr key={d.code}>
                  <td className={TD}>
                    <span className="font-medium text-gray-900">{d.name}</span> <span className="text-gray-400 text-[12px]">{d.code}</span>
                  </td>
                  <td className={TD}>
                    <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-[11px] font-bold ring-1 ${TIER_CLASS[d.tier] ?? TIER_CLASS.D}`}>
                      {d.tier}
                    </span>
                  </td>
                  <td className={TDR}>{d.interval}d</td>
                  <td className={TDR}>{d.daysSince == null ? <span className="text-red-600">never</span> : `${d.daysSince}d ago`}</td>
                  <td className={TDR}>
                    {d.daysSince == null ? <span className="text-red-600 font-semibold">—</span> : <span className="text-red-600 font-semibold">+{d.over}d</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {dueList.length === 0 && <p className="text-[13px] text-gray-400 px-4 py-8 text-center">Everyone is within cadence. 🎉</p>}
      </div>
    </div>
  );
}
