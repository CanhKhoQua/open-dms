import { getCoverage } from "@/lib/manager/queries";

export const dynamic = "force-dynamic";

const THL = "font-medium text-gray-400 text-[11px] uppercase tracking-wide px-3 py-2 border-b border-gray-100 text-left";
const THR = "font-medium text-gray-400 text-[11px] uppercase tracking-wide px-3 py-2 border-b border-gray-100 text-right";
const TD = "px-3 py-2.5 border-b border-gray-100 text-gray-800";
const TDR = "px-3 py-2.5 border-b border-gray-100 text-gray-800 text-right font-mono tabular-nums";

function barColor(pct: number): string {
  if (pct >= 80) return "var(--tnm-teal-600)";
  if (pct >= 50) return "#B4791E";
  return "#D92D20";
}

export default async function ManagerCoveragePage() {
  const { rows, totalAssigned, totalCovered, overallPct, days } = await getCoverage(30);

  return (
    <div className="px-6 py-6 max-w-[1000px]">
      <div className="rounded-[14px] bg-white border border-gray-100 p-5 mb-5">
        <p className="text-[11px] uppercase tracking-wide text-gray-400 font-medium">Overall coverage · last {days} days</p>
        <div className="flex items-end gap-3 mt-1">
          <div className="text-[32px] font-bold tracking-tight text-gray-900 leading-none">{overallPct}%</div>
          <div className="text-[13px] text-gray-500 pb-1">
            {totalCovered} of {totalAssigned} assigned customers reached
          </div>
        </div>
        <div className="mt-3 h-2 rounded-full bg-gray-100 overflow-hidden">
          <div className="h-full rounded-full" style={{ width: `${overallPct}%`, backgroundColor: barColor(overallPct) }} />
        </div>
      </div>

      <div className="rounded-[14px] bg-white border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px] border-collapse">
            <thead>
              <tr>
                <th className={THL}>Rep</th>
                <th className={THR}>Assigned</th>
                <th className={THR}>Reached</th>
                <th className={THR}>Not reached</th>
                <th className={`${THL} w-[220px]`}>Coverage</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.repId}>
                  <td className={TD}><span className="font-medium text-gray-900">{r.name}</span></td>
                  <td className={TDR}>{r.assigned}</td>
                  <td className={TDR}>{r.covered}</td>
                  <td className={TDR}>
                    {r.uncovered > 0 ? <span className="text-red-600">{r.uncovered}</span> : <span className="text-gray-300">0</span>}
                  </td>
                  <td className={TD}>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${r.coveragePct}%`, backgroundColor: barColor(r.coveragePct) }} />
                      </div>
                      <span className="font-mono tabular-nums text-[12px] text-gray-600 w-10 text-right">{r.coveragePct}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {rows.length === 0 && <p className="text-[13px] text-gray-400 px-4 py-8 text-center">No reps.</p>}
      </div>
    </div>
  );
}
