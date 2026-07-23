import { getDebtByCustomer } from "@/lib/manager/queries";
import { formatMoney } from "@/lib/money";

export const dynamic = "force-dynamic";

const THL = "font-medium text-gray-400 text-[11px] uppercase tracking-wide px-3 py-2 border-b border-gray-100 text-left";
const THR = "font-medium text-gray-400 text-[11px] uppercase tracking-wide px-3 py-2 border-b border-gray-100 text-right";
const TD = "px-3 py-2.5 border-b border-gray-100 text-gray-800";
const TDR = "px-3 py-2.5 border-b border-gray-100 text-gray-800 text-right font-mono";

export default async function ManagerDebtPage() {
  const rows = await getDebtByCustomer();
  const total = rows.reduce((s, r) => s + r.outstanding, 0);
  const overdue = rows.reduce((s, r) => s + r.overdue, 0);

  return (
    <div className="px-6 py-6 max-w-[1100px]">
      <p className="text-[13px] text-gray-500 mb-4">
        {rows.length} customers with a balance · total{" "}
        <span className="font-mono font-semibold text-gray-900">{formatMoney(total)}</span> ·
        overdue{" "}
        <span className="font-mono font-semibold text-amber-700">{formatMoney(overdue)}</span>
      </p>

      <div className="rounded-[14px] bg-white border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px] border-collapse">
            <thead>
              <tr>
                <th className={THL}>Customer</th>
                <th className={THR}>Outstanding</th>
                <th className={THR}>Overdue</th>
                <th className={THR}>1–30d</th>
                <th className={THR}>31–60d</th>
                <th className={THR}>60+d</th>
                <th className={THR}>Limit</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.customerId} className={r.overLimit ? "bg-red-50/60" : undefined}>
                  <td className={TD}>
                    <span className="font-medium text-gray-900">{r.name}</span>{" "}
                    <span className="text-gray-400 text-[12px]">{r.code}</span>
                    {r.overLimit && (
                      <span className="ml-2 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold bg-red-50 text-red-600">
                        Over limit
                      </span>
                    )}
                  </td>
                  <td className={TDR}>{formatMoney(r.outstanding)}</td>
                  <td className={TDR}>{formatMoney(r.overdue)}</td>
                  <td className={TDR}>{formatMoney(r.buckets.d1_30)}</td>
                  <td className={TDR}>{formatMoney(r.buckets.d31_60)}</td>
                  <td className={TDR}>{formatMoney(r.buckets.d60_plus)}</td>
                  <td className={TDR}>{formatMoney(r.creditLimit)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {rows.length === 0 && (
          <p className="text-[13px] text-gray-400 px-4 py-8 text-center">No outstanding receivables.</p>
        )}
      </div>
    </div>
  );
}
