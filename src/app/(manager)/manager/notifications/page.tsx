import { getCurrentManager } from "@/lib/session";
import { getNotifications } from "@/lib/notifications";
import { markAllReadManager } from "./actions";

export const dynamic = "force-dynamic";

const KIND: Record<string, { label: string; cls: string }> = {
  VISIT_REMINDER: { label: "Reminder", cls: "bg-tnm-teal-50 text-tnm-teal-700" },
  ORDER_UPDATE: { label: "Order", cls: "bg-blue-50 text-blue-600" },
  DEBT_ALERT: { label: "Receivables", cls: "bg-amber-50 text-amber-700" },
  SYSTEM: { label: "System", cls: "bg-gray-100 text-gray-500" },
};

export default async function ManagerNotificationsPage() {
  const mgr = await getCurrentManager();
  const items = await getNotifications(mgr.id);
  const hasUnread = items.some((n) => !n.readAt);

  return (
    <div className="px-6 py-6 max-w-[720px]">
      <div className="flex items-center justify-end mb-4">
        {hasUnread && (
          <form action={markAllReadManager}>
            <button className="text-[12px] font-medium text-blue-600 hover:underline">Mark all read</button>
          </form>
        )}
      </div>
      <div className="flex flex-col gap-2">
        {items.map((n) => {
          const kind = KIND[n.kind] ?? KIND.SYSTEM;
          return (
            <div
              key={n.id}
              className={`rounded-[14px] border px-4 py-3 ${n.readAt ? "bg-white border-gray-100" : "bg-tnm-teal-50/40 border-tnm-teal-100"}`}
            >
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${kind.cls}`}>{kind.label}</span>
                {!n.readAt && <span className="w-1.5 h-1.5 rounded-full bg-tnm-red-500" />}
                <span className="text-[11px] text-gray-400 ml-auto">{new Date(n.createdAt).toLocaleString("en-US")}</span>
              </div>
              <div className="text-[14px] font-semibold text-gray-900 mt-1.5">{n.title}</div>
              {n.body && <div className="text-[13px] text-gray-500 mt-0.5">{n.body}</div>}
            </div>
          );
        })}
        {items.length === 0 && <p className="text-[13px] text-gray-400 py-8 text-center">No notifications.</p>}
      </div>
    </div>
  );
}
