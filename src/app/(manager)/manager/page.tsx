import Link from "next/link";
import { getCurrentManager } from "@/lib/session";
import { getOverview, getTeamCoverage } from "@/lib/manager/queries";
import { formatVnd } from "@/lib/money";

export const dynamic = "force-dynamic";

const AGING_LABELS: Record<string, string> = {
  current: "Trong hạn",
  d1_30: "1–30",
  d31_60: "31–60",
  d60_plus: "60+",
};

export default async function ManagerOverviewPage() {
  const mgr = await getCurrentManager();
  const [ov, team] = await Promise.all([getOverview(), getTeamCoverage()]);

  const kpis: { label: string; value: string | number }[] = [
    { label: "Khách hoạt động", value: ov.customerCount },
    { label: "Sale", value: ov.repCount },
    { label: "Ghé hôm nay", value: ov.todayVisits },
    { label: "Đơn hôm nay", value: `${ov.todayOrderCount} · ${formatVnd(ov.todayOrderValue)}` },
    { label: "Thu hôm nay", value: formatVnd(ov.todayCollected) },
    { label: "Công nợ", value: formatVnd(ov.ar.total) },
    { label: "Quá hạn", value: formatVnd(ov.overdue) },
  ];

  return (
    <main className="wrap">
      <h1>Tổng quan</h1>
      <p className="tag">Xin chào, {mgr.name} — toàn công ty</p>

      <div className="kpis">
        {kpis.map((k) => (
          <div className="kpi" key={k.label}>
            <span className="muted small">{k.label}</span>
            <strong>{k.value}</strong>
          </div>
        ))}
      </div>

      <section className="panel">
        <h3>Tuổi nợ (toàn công ty)</h3>
        <div className="aging">
          {(["current", "d1_30", "d31_60", "d60_plus"] as const).map((b) => (
            <div className="aging-cell" key={b}>
              <span className="muted small">{AGING_LABELS[b]}</span>
              <strong>{formatVnd(ov.ar[b])}</strong>
            </div>
          ))}
        </div>
      </section>

      <section className="panel">
        <h3>
          Đội ngũ hôm nay · <Link href="/manager/team">chi tiết</Link>
        </h3>
        <div className="tablewrap">
          <table>
            <thead>
              <tr>
                <th>Sale</th>
                <th className="num">Kế hoạch</th>
                <th className="num">Đã ghé</th>
                <th className="num">Đơn</th>
                <th className="num">Thu</th>
              </tr>
            </thead>
            <tbody>
              {team.map((t) => (
                <tr key={t.repId}>
                  <td>{t.name}</td>
                  <td className="num">{t.plannedToday}</td>
                  <td className="num">{t.visitedPlanned}</td>
                  <td className="num">{t.ordersToday}</td>
                  <td className="num">{formatVnd(t.collectedToday)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
