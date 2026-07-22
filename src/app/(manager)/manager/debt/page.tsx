import { getDebtByCustomer } from "@/lib/manager/queries";
import { formatVnd } from "@/lib/money";

export const dynamic = "force-dynamic";

export default async function ManagerDebtPage() {
  const rows = await getDebtByCustomer();
  const total = rows.reduce((s, r) => s + r.outstanding, 0);
  const overdue = rows.reduce((s, r) => s + r.overdue, 0);

  return (
    <main className="wrap">
      <h1>Công nợ</h1>
      <p className="tag">
        {rows.length} khách còn nợ · tổng {formatVnd(total)} · quá hạn{" "}
        {formatVnd(overdue)}
      </p>

      <div className="tablewrap">
        <table>
          <thead>
            <tr>
              <th>Khách</th>
              <th className="num">Còn phải thu</th>
              <th className="num">Quá hạn</th>
              <th className="num">1–30</th>
              <th className="num">31–60</th>
              <th className="num">60+</th>
              <th className="num">Hạn mức</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.customerId} className={r.overLimit ? "danger" : undefined}>
                <td>
                  {r.name} <span className="muted small">{r.code}</span>
                  {r.overLimit && <span className="badge warn">Vượt hạn mức</span>}
                </td>
                <td className="num">{formatVnd(r.outstanding)}</td>
                <td className="num">{formatVnd(r.overdue)}</td>
                <td className="num">{formatVnd(r.buckets.d1_30)}</td>
                <td className="num">{formatVnd(r.buckets.d31_60)}</td>
                <td className="num">{formatVnd(r.buckets.d60_plus)}</td>
                <td className="num">{formatVnd(r.creditLimit)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rows.length === 0 && <p className="muted">Không có công nợ.</p>}
    </main>
  );
}
