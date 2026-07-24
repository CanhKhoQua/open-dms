import { getRepPerformance } from "@/lib/manager/queries";
import { formatMoney } from "@/lib/money";

export const dynamic = "force-dynamic";

const THL = "font-medium text-gray-400 text-[11px] uppercase tracking-wide px-3 py-2 border-b border-gray-100 text-left";
const THR = "font-medium text-gray-400 text-[11px] uppercase tracking-wide px-3 py-2 border-b border-gray-100 text-right";
const TD = "px-3 py-2.5 border-b border-gray-100 text-gray-800";
const TDR = "px-3 py-2.5 border-b border-gray-100 text-gray-800 text-right font-mono tabular-nums";

export default async function ManagerPerformancePage() {
  const rows = await getRepPerformance(30);
  const totals = rows.reduce(
    (a, r) => ({
      visits: a.visits + r.visits,
      orders: a.orders + r.orders,
      orderValue: a.orderValue + r.orderValue,
      collected: a.collected + r.collected,
    }),
    { visits: 0, orders: 0, orderValue: 0, collected: 0 },
  );

  return (
    <div className="px-6 py-6 max-w-[1100px]">
      <p className="text-[13px] text-gray-500 mb-4">Rolling 30-day performance · {rows.length} reps</p>
      <div className="rounded-[14px] bg-white border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px] border-collapse">
            <thead>
              <tr>
                <th className={THL}>Rep</th>
                <th className={THR}>Assigned</th>
                <th className={THR}>Visits</th>
                <th className={THR}>Unique</th>
                <th className={THR}>GPS %</th>
                <th className={THR}>Orders</th>
                <th className={THR}>Order value</th>
                <th className={THR}>Collected</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.repId}>
                  <td className={TD}><span className="font-medium text-gray-900">{r.name}</span></td>
                  <td className={TDR}>{r.assigned}</td>
                  <td className={TDR}>{r.visits}</td>
                  <td className={TDR}>{r.uniqueCustomers}</td>
                  <td className={TDR}>
                    <span className={r.gpsRate >= 80 ? "text-emerald-600" : r.gpsRate >= 50 ? "text-amber-600" : "text-red-600"}>
                      {r.gpsRate}%
                    </span>
                  </td>
                  <td className={TDR}>{r.orders}</td>
                  <td className={TDR}>{formatMoney(r.orderValue)}</td>
                  <td className={TDR}>{formatMoney(r.collected)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50/60">
                <td className={`${TD} font-semibold text-gray-700`}>Total</td>
                <td className={TDR}></td>
                <td className={`${TDR} font-semibold`}>{totals.visits}</td>
                <td className={TDR}></td>
                <td className={TDR}></td>
                <td className={`${TDR} font-semibold`}>{totals.orders}</td>
                <td className={`${TDR} font-semibold`}>{formatMoney(totals.orderValue)}</td>
                <td className={`${TDR} font-semibold`}>{formatMoney(totals.collected)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
        {rows.length === 0 && <p className="text-[13px] text-gray-400 px-4 py-8 text-center">No reps.</p>}
      </div>
    </div>
  );
}
