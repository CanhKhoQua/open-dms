import Link from "next/link";
import { getOverview, getTeamCoverage } from "@/lib/manager/queries";
import { formatMoney } from "@/lib/money";
import { ResetDemoButton } from "./_components/ResetDemoButton";

export const dynamic = "force-dynamic";

const AGING: { key: "current" | "d1_30" | "d31_60" | "d60_plus"; label: string }[] = [
  { key: "current", label: "Current" },
  { key: "d1_30", label: "1–30d" },
  { key: "d31_60", label: "31–60d" },
  { key: "d60_plus", label: "60+d" },
];

export default async function ManagerOverviewPage() {
  const [ov, team] = await Promise.all([getOverview(), getTeamCoverage()]);

  const kpis: { label: string; value: string | number }[] = [
    { label: "Active customers", value: ov.customerCount },
    { label: "Reps", value: ov.repCount },
    { label: "Visits today", value: ov.todayVisits },
    { label: "Orders today", value: `${ov.todayOrderCount} · ${formatMoney(ov.todayOrderValue)}` },
    { label: "Collected today", value: formatMoney(ov.todayCollected) },
    { label: "Receivables", value: formatMoney(ov.ar.total) },
    { label: "Overdue", value: formatMoney(ov.overdue) },
  ];

  return (
    <div className="px-6 py-6 max-w-[1100px]">
      <div className="flex items-center justify-end mb-4">
        <ResetDemoButton />
      </div>

      <div className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(150px,1fr))]">
        {kpis.map((k) => (
          <div
            key={k.label}
            className="flex flex-col gap-1 rounded-[14px] bg-white border border-gray-100 px-4 py-3.5"
          >
            <span className="text-[11.5px] text-gray-400">{k.label}</span>
            <strong className="text-[18px] font-bold tracking-tight text-gray-900">
              {k.value}
            </strong>
          </div>
        ))}
      </div>

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
