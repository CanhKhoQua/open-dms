import { getTeamCoverage } from "@/lib/manager/queries";
import { formatMoney } from "@/lib/money";

export const dynamic = "force-dynamic";

const THL = "font-medium text-gray-400 text-[11px] uppercase tracking-wide px-3 py-2 border-b border-gray-100 text-left";
const THR = "font-medium text-gray-400 text-[11px] uppercase tracking-wide px-3 py-2 border-b border-gray-100 text-right";
const TD = "px-3 py-2.5 border-b border-gray-100 text-gray-800";
const TDR = "px-3 py-2.5 border-b border-gray-100 text-gray-800 text-right font-mono";

export default async function ManagerTeamPage() {
  const team = await getTeamCoverage();

  return (
    <div className="px-6 py-6 max-w-[1100px]">
      <p className="text-[13px] text-gray-500 mb-4">Coverage today, by rep</p>

      <div className="rounded-[14px] bg-white border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px] border-collapse">
            <thead>
              <tr>
                <th className={THL}>Rep</th>
                <th className={THR}>Assigned</th>
                <th className={THR}>Planned today</th>
                <th className={THR}>Visited (planned)</th>
                <th className={THR}>Orders</th>
                <th className={THR}>Collected</th>
              </tr>
            </thead>
            <tbody>
              {team.map((t) => {
                const behind = t.plannedToday > 0 && t.visitedPlanned < t.plannedToday;
                return (
                  <tr key={t.repId} className={behind ? "bg-amber-50/50" : undefined}>
                    <td className={TD}>{t.name}</td>
                    <td className={TDR}>{t.assigned}</td>
                    <td className={TDR}>{t.plannedToday}</td>
                    <td className={TDR}>
                      {t.visitedPlanned}
                      {behind && (
                        <span className="ml-2 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold bg-amber-50 text-amber-700">
                          behind
                        </span>
                      )}
                    </td>
                    <td className={TDR}>{t.ordersToday}</td>
                    <td className={TDR}>{formatMoney(t.collectedToday)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {team.length === 0 && (
          <p className="text-[13px] text-gray-400 px-4 py-8 text-center">No reps yet.</p>
        )}
      </div>
    </div>
  );
}
