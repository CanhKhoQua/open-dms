import Link from "next/link";
import { getOverview, getTeamCoverage, getSalesTrend } from "@/lib/manager/queries";
import { formatMoney } from "@/lib/money";
import { ResetDemoButton } from "./_components/ResetDemoButton";

export const dynamic = "force-dynamic";

const AGING: { key: "current" | "d1_30" | "d31_60" | "d60_plus"; label: string }[] = [
  { key: "current", label: "Current" },
  { key: "d1_30", label: "1–30d" },
  { key: "d31_60", label: "31–60d" },
  { key: "d60_plus", label: "60+d" },
];

// compact money for chart axis ($1.2k / $840)
function compactMoney(n: number): string {
  if (n >= 1000) return `$${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k`;
  return `$${Math.round(n)}`;
}

export default async function ManagerOverviewPage() {
  const [ov, team, trend] = await Promise.all([getOverview(), getTeamCoverage(), getSalesTrend(14)]);

  const kpis: { label: string; value: string | number; accent: string }[] = [
    { label: "Active customers", value: ov.customerCount, accent: "var(--tnm-teal-600)" },
    { label: "Reps", value: ov.repCount, accent: "var(--tnm-teal-600)" },
    { label: "Visits today", value: ov.todayVisits, accent: "#2563eb" },
    { label: "Orders today", value: `${ov.todayOrderCount} · ${formatMoney(ov.todayOrderValue)}`, accent: "var(--tnm-teal-600)" },
    { label: "Collected today", value: formatMoney(ov.todayCollected), accent: "#10b981" },
    { label: "Receivables", value: formatMoney(ov.ar.total), accent: "var(--debt-1-30)" },
    { label: "Overdue", value: formatMoney(ov.overdue), accent: "var(--debt-60)" },
  ];

  const chartMax = Math.max(1, ...trend.map((d) => Math.max(d.orders, d.collected)));

  return (
    <div className="px-6 py-6 max-w-[1100px]">
      <div className="flex items-center justify-end mb-4">
        <ResetDemoButton />
      </div>

      <div className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(150px,1fr))]">
        {kpis.map((k) => (
          <div
            key={k.label}
            className="flex flex-col gap-1 rounded-[14px] bg-white border border-gray-100 border-l-4 px-4 py-3.5"
            style={{ borderLeftColor: k.accent }}
          >
            <span className="text-[11.5px] text-gray-400">{k.label}</span>
            <strong className="text-[18px] font-bold tracking-tight text-gray-900">{k.value}</strong>
          </div>
        ))}
      </div>

      <section className="mt-5 rounded-[14px] bg-white border border-gray-100 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[13px] font-semibold text-gray-900">Last 14 days</h2>
          <div className="flex items-center gap-4 text-[11.5px] text-gray-500">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm" style={{ background: "var(--tnm-teal-600)" }} /> Orders
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm" style={{ background: "#10b981" }} /> Collected
            </span>
          </div>
        </div>
        <div className="flex items-end gap-1.5 h-[140px]">
          {trend.map((d, i) => (
            <div key={d.key} className="group relative flex-1 flex flex-col items-center justify-end gap-1 h-full">
              <div className="flex items-end gap-[3px] w-full justify-center h-full">
                <div
                  className="w-[42%] max-w-[14px] rounded-t-[3px]"
                  style={{ height: `${(d.orders / chartMax) * 100}%`, background: "var(--tnm-teal-600)", minHeight: d.orders > 0 ? 2 : 0 }}
                />
                <div
                  className="w-[42%] max-w-[14px] rounded-t-[3px]"
                  style={{ height: `${(d.collected / chartMax) * 100}%`, background: "#10b981", minHeight: d.collected > 0 ? 2 : 0 }}
                />
              </div>
              <span className={`text-[9px] text-gray-400 ${i % 2 === 0 ? "" : "opacity-0"}`}>{d.label}</span>
              <div className="pointer-events-none absolute bottom-full mb-1 hidden group-hover:block whitespace-nowrap rounded-md bg-gray-900 text-white text-[10.5px] px-2 py-1 z-10">
                <div className="font-semibold">{d.label}</div>
                <div>Orders {compactMoney(d.orders)}</div>
                <div>Collected {compactMoney(d.collected)}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-5 rounded-[14px] bg-white border border-gray-100 p-5">
        <h2 className="text-[13px] font-semibold text-gray-900 mb-3">Aging (company-wide)</h2>
        <div className="grid grid-cols-4 gap-3">
          {AGING.map((b) => (
            <div className="flex flex-col gap-0.5" key={b.key}>
              <span className="text-[11px] text-gray-400">{b.label}</span>
              <strong className="text-[15px] font-mono font-semibold text-gray-900">
                {formatMoney(ov.ar[b.key])}
              </strong>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-5 rounded-[14px] bg-white border border-gray-100 p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[13px] font-semibold text-gray-900">Team today</h2>
          <Link href="/manager/team" className="text-[12px] font-medium text-blue-600 hover:underline">
            details
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[13px] border-collapse">
            <thead>
              <tr>
                <th className="text-left font-medium text-gray-400 text-[11px] uppercase tracking-wide px-3 py-2 border-b border-gray-100">Rep</th>
                <th className="text-right font-medium text-gray-400 text-[11px] uppercase tracking-wide px-3 py-2 border-b border-gray-100">Planned</th>
                <th className="text-right font-medium text-gray-400 text-[11px] uppercase tracking-wide px-3 py-2 border-b border-gray-100">Visited</th>
                <th className="text-right font-medium text-gray-400 text-[11px] uppercase tracking-wide px-3 py-2 border-b border-gray-100">Orders</th>
                <th className="text-right font-medium text-gray-400 text-[11px] uppercase tracking-wide px-3 py-2 border-b border-gray-100">Collected</th>
              </tr>
            </thead>
            <tbody>
              {team.map((t) => (
                <tr key={t.repId}>
                  <td className="px-3 py-2.5 border-b border-gray-100 text-gray-800">{t.name}</td>
                  <td className="px-3 py-2.5 border-b border-gray-100 text-right font-mono text-gray-800">{t.plannedToday}</td>
                  <td className="px-3 py-2.5 border-b border-gray-100 text-right font-mono text-gray-800">{t.visitedPlanned}</td>
                  <td className="px-3 py-2.5 border-b border-gray-100 text-right font-mono text-gray-800">{t.ordersToday}</td>
                  <td className="px-3 py-2.5 border-b border-gray-100 text-right font-mono text-gray-800">{formatMoney(t.collectedToday)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
