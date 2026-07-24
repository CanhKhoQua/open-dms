import Link from "next/link";
import {
  getOverview,
  getTeamCoverage,
  getSalesTrend,
  getDashboardHero,
  getVolumeSeries,
  getActiveCustomersSeries,
  getProductMix,
} from "@/lib/manager/queries";
import { formatMoney } from "@/lib/money";
import { ResetDemoButton } from "./_components/ResetDemoButton";

export const dynamic = "force-dynamic";

const AGING: { key: "current" | "d1_30" | "d31_60" | "d60_plus"; label: string }[] = [
  { key: "current", label: "Current" },
  { key: "d1_30", label: "1–30d" },
  { key: "d31_60", label: "31–60d" },
  { key: "d60_plus", label: "60+d" },
];

const MIX_COLORS = ["#0e9a9a", "#14b1b1", "#2563eb", "#7c3aed", "#B4791E", "#E8710A", "#64748b"];

// compact VND for chart axes (1,2 tỷ / 850 tr / 90k)
function compactMoney(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)} tỷ`;
  if (n >= 1_000_000) return `${Math.round(n / 1_000_000)} tr`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}k`;
  return `${Math.round(n)}`;
}

export default async function ManagerOverviewPage() {
  const [ov, team, trend, hero, vol, active, mix] = await Promise.all([
    getOverview(),
    getTeamCoverage(),
    getSalesTrend(14),
    getDashboardHero(),
    getVolumeSeries(12),
    getActiveCustomersSeries(12),
    getProductMix(90),
  ]);

  const heroCards = [
    { label: "Revenue MTD", value: formatMoney(hero.mtdRevenue), sub: `${hero.mtdCount} orders · day ${hero.dayOfMonth}/${hero.daysInMonth}`, accent: "var(--tnm-teal-600)" },
    { label: "Projected (run-rate)", value: formatMoney(Math.round(hero.projected)), sub: `${formatMoney(Math.round(hero.runRate))}/day`, accent: "#2563eb" },
    {
      label: "Same period last year",
      value: formatMoney(hero.splyRevenue),
      sub: hero.yoyPct == null ? "no prior-year data" : `${hero.yoyPct >= 0 ? "▲" : "▼"} ${Math.abs(hero.yoyPct)}% YoY`,
      subCls: hero.yoyPct == null ? "text-gray-400" : hero.yoyPct >= 0 ? "text-emerald-600" : "text-red-600",
      accent: "#7c3aed",
    },
    { label: "Receivables", value: formatMoney(ov.ar.total), sub: `${formatMoney(ov.overdue)} overdue`, subCls: ov.overdue > 0 ? "text-red-600" : "text-gray-400", accent: "var(--debt-1-30)" },
  ];

  // volume chart geometry (SVG bars + MA3 line)
  const volMax = Math.max(1, ...vol.map((d) => Math.max(d.value, d.ma)));
  const VW = 480, VH = 120, vbw = VW / vol.length;
  const maPoints = vol.map((d, i) => `${(i * vbw + vbw / 2).toFixed(1)},${(VH - (d.ma / volMax) * (VH - 8)).toFixed(1)}`).join(" ");

  const activeMax = Math.max(1, ...active.map((d) => d.count));

  return (
    <div className="px-6 py-6 max-w-[1100px]">
      <div className="flex items-center justify-end mb-4">
        <ResetDemoButton />
      </div>

      {/* KPI hero */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        {heroCards.map((k) => (
          <div key={k.label} className="rounded-[14px] bg-white border border-gray-100 border-l-4 px-4 py-3.5" style={{ borderLeftColor: k.accent }}>
            <div className="text-[11.5px] text-gray-400">{k.label}</div>
            <div className="text-[19px] font-bold tracking-tight text-gray-900 mt-1 tabular-nums">{k.value}</div>
            <div className={`text-[11.5px] mt-0.5 ${k.subCls ?? "text-gray-400"}`}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* secondary KPIs */}
      <div className="grid gap-3 grid-cols-3 lg:grid-cols-6 mt-3">
        {[
          { label: "Customers", value: ov.customerCount },
          { label: "Reps", value: ov.repCount },
          { label: "Visits today", value: ov.todayVisits },
          { label: "Orders today", value: ov.todayOrderCount },
          { label: "Order value", value: compactMoney(ov.todayOrderValue) },
          { label: "Collected", value: compactMoney(ov.todayCollected) },
        ].map((k) => (
          <div key={k.label} className="rounded-[12px] bg-white border border-gray-100 px-3 py-2.5">
            <div className="text-[10.5px] text-gray-400">{k.label}</div>
            <div className="text-[15px] font-semibold text-gray-900 tabular-nums">{k.value}</div>
          </div>
        ))}
      </div>

      {/* charts: volume + active customers */}
      <div className="grid gap-4 lg:grid-cols-2 mt-5">
        <section className="rounded-[14px] bg-white border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[13px] font-semibold text-gray-900">Order value · weekly</h2>
            <span className="text-[11px] text-gray-400 inline-flex items-center gap-1.5">
              <span className="w-4 h-0.5 rounded" style={{ background: "#e01020" }} /> 3-wk avg
            </span>
          </div>
          <svg viewBox={`0 0 ${VW} ${VH}`} className="w-full h-[130px]" preserveAspectRatio="none">
            {vol.map((d, i) => {
              const h = (d.value / volMax) * (VH - 8);
              return <rect key={d.key} x={i * vbw + vbw * 0.2} y={VH - h} width={vbw * 0.6} height={h} rx="1.5" fill="var(--tnm-teal-600)" />;
            })}
            <polyline points={maPoints} fill="none" stroke="#e01020" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
          </svg>
          <div className="flex justify-between text-[9.5px] text-gray-400 mt-1">
            <span>{vol[0]?.label}</span>
            <span>{vol[vol.length - 1]?.label}</span>
          </div>
        </section>

        <section className="rounded-[14px] bg-white border border-gray-100 p-5">
          <h2 className="text-[13px] font-semibold text-gray-900 mb-3">Active customers · weekly</h2>
          <div className="flex items-end gap-1.5 h-[130px]">
            {active.map((d) => (
              <div key={d.key} className="group relative flex-1 flex flex-col items-center justify-end h-full">
                <span className="text-[9px] text-gray-500 mb-0.5 tabular-nums">{d.count}</span>
                <div className="w-full max-w-[18px] rounded-t-[3px] bg-blue-500" style={{ height: `${(d.count / activeMax) * 100}%`, minHeight: d.count > 0 ? 2 : 0 }} />
                <div className="pointer-events-none absolute bottom-full mb-1 hidden group-hover:block whitespace-nowrap rounded-md bg-gray-900 text-white text-[10px] px-2 py-1 z-10">
                  {d.label}: {d.count}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* product mix */}
      <section className="rounded-[14px] bg-white border border-gray-100 p-5 mt-4">
        <h2 className="text-[13px] font-semibold text-gray-900 mb-3">Product mix · last 90 days</h2>
        <div className="h-2.5 w-full rounded-full overflow-hidden flex mb-4">
          {mix.rows.map((r, i) => (
            <div key={r.name} style={{ width: `${r.pct}%`, background: MIX_COLORS[i % MIX_COLORS.length] }} title={`${r.name} ${r.pct}%`} />
          ))}
        </div>
        <div className="grid gap-x-6 gap-y-1.5 sm:grid-cols-2">
          {mix.rows.map((r, i) => (
            <div key={r.name} className="flex items-center gap-2 text-[12.5px]">
              <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: MIX_COLORS[i % MIX_COLORS.length] }} />
              <span className="text-gray-700 truncate flex-1">{r.name}</span>
              <span className="font-mono tabular-nums text-gray-500">{r.pct}%</span>
              <span className="font-mono tabular-nums text-gray-800 w-24 text-right">{formatMoney(r.value)}</span>
            </div>
          ))}
        </div>
      </section>

      {/* daily orders vs collected */}
      <section className="mt-4 rounded-[14px] bg-white border border-gray-100 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[13px] font-semibold text-gray-900">Last 14 days</h2>
          <div className="flex items-center gap-4 text-[11.5px] text-gray-500">
            <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: "var(--tnm-teal-600)" }} /> Orders</span>
            <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: "#10b981" }} /> Collected</span>
          </div>
        </div>
        <div className="flex items-end gap-1.5 h-[130px]">
          {(() => {
            const m = Math.max(1, ...trend.map((d) => Math.max(d.orders, d.collected)));
            return trend.map((d, i) => (
              <div key={d.key} className="group relative flex-1 flex flex-col items-center justify-end gap-1 h-full">
                <div className="flex items-end gap-[3px] w-full justify-center h-full">
                  <div className="w-[42%] max-w-[14px] rounded-t-[3px]" style={{ height: `${(d.orders / m) * 100}%`, background: "var(--tnm-teal-600)", minHeight: d.orders > 0 ? 2 : 0 }} />
                  <div className="w-[42%] max-w-[14px] rounded-t-[3px]" style={{ height: `${(d.collected / m) * 100}%`, background: "#10b981", minHeight: d.collected > 0 ? 2 : 0 }} />
                </div>
                <span className={`text-[9px] text-gray-400 ${i % 2 === 0 ? "" : "opacity-0"}`}>{d.label}</span>
                <div className="pointer-events-none absolute bottom-full mb-1 hidden group-hover:block whitespace-nowrap rounded-md bg-gray-900 text-white text-[10.5px] px-2 py-1 z-10">
                  <div className="font-semibold">{d.label}</div>
                  <div>Orders {compactMoney(d.orders)}</div>
                  <div>Collected {compactMoney(d.collected)}</div>
                </div>
              </div>
            ));
          })()}
        </div>
      </section>

      {/* aging */}
      <section className="mt-4 rounded-[14px] bg-white border border-gray-100 p-5">
        <h2 className="text-[13px] font-semibold text-gray-900 mb-3">Aging (company-wide)</h2>
        <div className="grid grid-cols-4 gap-3">
          {AGING.map((b) => (
            <div className="flex flex-col gap-0.5" key={b.key}>
              <span className="text-[11px] text-gray-400">{b.label}</span>
              <strong className="text-[15px] font-mono font-semibold text-gray-900">{formatMoney(ov.ar[b.key])}</strong>
            </div>
          ))}
        </div>
      </section>

      {/* team */}
      <section className="mt-4 rounded-[14px] bg-white border border-gray-100 p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[13px] font-semibold text-gray-900">Team today</h2>
          <Link href="/manager/team" className="text-[12px] font-medium text-blue-600 hover:underline">details</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[13px] border-collapse">
            <thead>
              <tr>
                {["Rep", "Planned", "Visited", "Orders", "Collected"].map((h, i) => (
                  <th key={h} className={`font-medium text-gray-400 text-[11px] uppercase tracking-wide px-3 py-2 border-b border-gray-100 ${i === 0 ? "text-left" : "text-right"}`}>{h}</th>
                ))}
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
