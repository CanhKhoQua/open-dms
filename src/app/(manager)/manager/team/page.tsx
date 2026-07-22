import { getTeamCoverage } from "@/lib/manager/queries";
import { formatVnd } from "@/lib/money";

export const dynamic = "force-dynamic";

export default async function ManagerTeamPage() {
  const team = await getTeamCoverage();

  return (
    <main className="wrap">
      <h1>Đội ngũ</h1>
      <p className="tag">Độ phủ hôm nay theo từng sale</p>

      <div className="tablewrap">
        <table>
          <thead>
            <tr>
              <th>Sale</th>
              <th className="num">Được giao</th>
              <th className="num">Kế hoạch hôm nay</th>
              <th className="num">Đã ghé (KH)</th>
              <th className="num">Đơn</th>
              <th className="num">Thu</th>
            </tr>
          </thead>
          <tbody>
            {team.map((t) => {
              const behind = t.plannedToday > 0 && t.visitedPlanned < t.plannedToday;
              return (
                <tr key={t.repId} className={behind ? "warnrow" : undefined}>
                  <td>{t.name}</td>
                  <td className="num">{t.assigned}</td>
                  <td className="num">{t.plannedToday}</td>
                  <td className="num">
                    {t.visitedPlanned}
                    {behind && <span className="badge warn">thiếu</span>}
                  </td>
                  <td className="num">{t.ordersToday}</td>
                  <td className="num">{formatVnd(t.collectedToday)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {team.length === 0 && <p className="muted">Chưa có sale nào.</p>}
    </main>
  );
}
