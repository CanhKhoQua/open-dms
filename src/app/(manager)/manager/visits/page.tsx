import { getAllRecentVisits } from "@/lib/manager/queries";

export const dynamic = "force-dynamic";

const GPS_LABELS: Record<string, string> = {
  OK: "GPS hợp lệ",
  OUT_OF_RANGE: "Ngoài bán kính",
  MISSING: "Không GPS",
};

export default async function ManagerVisitsPage() {
  const visits = await getAllRecentVisits();
  const flagged = visits.filter((v) => v.gpsStatus !== "OK").length;

  return (
    <main className="wrap">
      <h1>Ghé thăm</h1>
      <p className="tag">
        {visits.length} lượt gần đây · {flagged} lượt cần lưu ý (GPS)
      </p>
      <div className="list">
        {visits.map((v) => (
          <div className="row" key={v.id}>
            <div className="row-main">
              <strong>{v.customer.name}</strong>
              <div className="muted small">
                {v.rep.name} · {new Date(v.checkInAt).toLocaleString("vi-VN")}
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
