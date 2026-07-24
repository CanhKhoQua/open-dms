import Link from "next/link";
import { getWatchlist } from "@/lib/manager/queries";
import { formatMoney } from "@/lib/money";

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

export default async function ManagerWatchlistPage() {
  const rows = await getWatchlist();

  return (
    <div className="px-6 py-6 max-w-[1100px]">
      <p className="text-[13px] text-gray-500 mb-4">{rows.length} customers on your watchlist</p>
      <div className="rounded-[14px] bg-white border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px] border-collapse">
            <thead>
              <tr>
                <th className={THL}>Customer</th>
                <th className={THL}>Tier</th>
                <th className={THL}>Reason</th>
                <th className={THR}>Outstanding</th>
                <th className={THR}>Overdue</th>
                <th className={THR}>Last visit</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className={TD}>
                    <Link href={`/manager/customers/${r.customerId}`} className="font-medium text-gray-900 hover:text-tnm-teal-700 hover:underline">
                      {r.name}
                    </Link>{" "}
                    <span className="text-gray-400 text-[12px]">{r.code}</span>
                    {r.overLimit && <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-red-50 text-red-600 font-semibold">Over limit</span>}
                  </td>
                  <td className={TD}>
                    {r.tier && (
                      <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-[11px] font-bold ring-1 ${TIER_CLASS[r.tier] ?? TIER_CLASS.D}`}>
                        {r.tier}
                      </span>
                    )}
                  </td>
                  <td className={TD}>{r.reason ? <span className="text-[12px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{r.reason}</span> : "—"}</td>
                  <td className={TDR}>{formatMoney(r.outstanding)}</td>
                  <td className={TDR}>{r.overdue > 0 ? <span className="text-red-600">{formatMoney(r.overdue)}</span> : <span className="text-gray-300">—</span>}</td>
                  <td className={TDR}>{r.daysSince == null ? <span className="text-red-600">never</span> : `${r.daysSince}d ago`}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {rows.length === 0 && <p className="text-[13px] text-gray-400 px-4 py-8 text-center">Watchlist is empty.</p>}
      </div>
    </div>
  );
}
