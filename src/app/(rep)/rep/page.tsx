import Link from "next/link";
import { getCurrentRep } from "@/lib/session";
import { getTodayRoute, hasOpenShift } from "@/lib/rep/queries";
import { formatVnd } from "@/lib/money";
import { ShiftControl } from "./_components/ShiftControl";

export const dynamic = "force-dynamic";

export default async function RepRoutePage() {
  const rep = await getCurrentRep();
  const [route, shift] = await Promise.all([
    getTodayRoute(rep.id),
    hasOpenShift(rep.id),
  ]);
  const plannedCount = route.filter((r) => r.plannedToday).length;

  return (
    <main className="wrap">
      <h1>Chào, {rep.name}</h1>
      <ShiftControl open={Boolean(shift)} />
      <p className="tag">Tuyến hôm nay: {plannedCount} khách</p>

      <div className="list">
        {route.map((r) => (
          <Link
            key={r.customerId}
            href={`/rep/customers/${r.customerId}`}
            className="row"
          >
            <div className="row-main">
              <strong>{r.name}</strong>
              <span className="muted"> {r.code}</span>
              {r.address && <div className="muted small">{r.address}</div>}
            </div>
            <div className="row-right">
              {r.plannedToday && <span className="badge">Hôm nay</span>}
              {r.visitedToday && <span className="badge ok">Đã ghé</span>}
              {r.outstanding > 0 && (
                <span className="badge warn">{formatVnd(r.outstanding)}</span>
              )}
            </div>
          </Link>
        ))}
        {route.length === 0 && (
          <p className="muted">Chưa có khách nào được phân công.</p>
        )}
      </div>
    </main>
  );
}
