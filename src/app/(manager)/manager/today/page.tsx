import { getTodayActivity } from "@/lib/manager/queries";
import { formatMoney } from "@/lib/money";

export const dynamic = "force-dynamic";

const KIND_META: Record<string, { label: string; dot: string; text: string }> = {
  visit: { label: "Visit", dot: "bg-blue-500", text: "text-blue-600" },
  order: { label: "Order", dot: "bg-tnm-teal-500", text: "text-tnm-teal-700" },
  payment: { label: "Payment", dot: "bg-emerald-500", text: "text-emerald-600" },
};

function time(at: Date): string {
  return new Date(at).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

export default async function ManagerTodayPage() {
  const data = await getTodayActivity();

  const kpis = [
    { label: "On duty", value: `${data.onDuty.length}`, accent: "var(--tnm-teal-600)" },
    { label: "Visits today", value: `${data.visitCount}`, accent: "#2563eb" },
    { label: "Orders today", value: formatMoney(data.orderValue), accent: "var(--tnm-teal-600)" },
    { label: "Collected today", value: formatMoney(data.collected), accent: "#10b981" },
  ];

  return (
    <div className="px-6 py-6 max-w-[1000px]">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-[14px] bg-white border border-gray-100 border-l-4 px-4 py-3" style={{ borderLeftColor: k.accent }}>
            <div className="text-[11px] uppercase tracking-wide text-gray-400 font-medium">{k.label}</div>
            <div className="text-[20px] font-bold tracking-tight text-gray-900 mt-1 tabular-nums">{k.value}</div>
          </div>
        ))}
      </div>

      {data.onDuty.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-5">
          {data.onDuty.map((r) => (
            <span key={r.repId} className="inline-flex items-center gap-1.5 text-[12px] font-medium px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {r.name} · since {time(r.startedAt)}
            </span>
          ))}
        </div>
      )}

      <div className="rounded-[14px] bg-white border border-gray-100 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 text-[13px] font-semibold text-gray-700">Activity feed</div>
        {data.events.length === 0 ? (
          <p className="text-[13px] text-gray-400 px-4 py-10 text-center">No activity yet today.</p>
        ) : (
          <ul>
            {data.events.map((e) => {
              const m = KIND_META[e.kind];
              return (
                <li key={e.id} className="flex items-center gap-3 px-4 py-2.5 border-b border-gray-50 last:border-0">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${m.dot}`} />
                  <span className="font-mono tabular-nums text-[12px] text-gray-400 w-14 shrink-0">{time(e.at)}</span>
                  <span className={`text-[11px] font-semibold uppercase tracking-wide w-16 shrink-0 ${m.text}`}>{m.label}</span>
                  <span className="text-[13px] text-gray-800 min-w-0 flex-1 truncate">
                    <span className="font-medium">{e.customer}</span>
                    <span className="text-gray-400"> · {e.label}</span>
                  </span>
                  <span className="text-[12px] text-gray-500 shrink-0 hidden sm:block">{e.rep}</span>
                  {e.amount != null && (
                    <span className="font-mono tabular-nums text-[12.5px] text-gray-800 shrink-0 w-28 text-right">{formatMoney(e.amount)}</span>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
