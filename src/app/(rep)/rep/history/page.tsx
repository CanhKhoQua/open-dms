import { getCurrentRep } from "@/lib/session";
import { getRepVisits } from "@/lib/rep/queries";

export const dynamic = "force-dynamic";

const GPS_LABELS: Record<string, string> = {
  OK: "GPS hợp lệ",
  OUT_OF_RANGE: "Ngoài bán kính",
  MISSING: "Không GPS",
};

export default async function RepHistoryPage() {
  const rep = await getCurrentRep();
  const visits = await getRepVisits(rep.id);

  return (
    <main className="wrap">
      <h1>Lịch sử ghé</h1>
      <p className="tag">{visits.length} lượt (chỉ của bạn)</p>
      <div className="list">
        {visits.map((v) => (
          <div className="row" key={v.id}>
            <div className="row-main">
              <strong>{v.customer.name}</strong>
              <div className="muted small">
                {new Date(v.checkInAt).toLocaleString("vi-VN")}
                {v.outcome ? ` · ${v.outcome}` : ""}
              </div>
            </div>
            <div className="row-right">
              <span
                className={
                  v.gpsStatus === "OK"
                    ? "badge ok"
                    : v.gpsStatus === "OUT_OF_RANGE"
                      ? "badge warn"
                      : "badge"
                }
              >
                {GPS_LABELS[v.gpsStatus]}
              </span>
            </div>
          </div>
        ))}
        {visits.length === 0 && <p className="muted">Chưa có lượt ghé nào.</p>}
      </div>
    </main>
  );
}
