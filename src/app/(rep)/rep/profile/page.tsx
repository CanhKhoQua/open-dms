import Link from "next/link";
import { Bell, ChevronRight } from "lucide-react";
import { getCurrentRep } from "@/lib/session";
import { getRepProfile } from "@/lib/rep/queries";
import { getUnreadCount } from "@/lib/notifications";
import { formatMoney } from "@/lib/money";

export const dynamic = "force-dynamic";

export default async function RepProfilePage() {
  const rep = await getCurrentRep();
  const [stats, unread] = await Promise.all([getRepProfile(rep.id), getUnreadCount(rep.id)]);
  const initials = rep.name.split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase();

  const cards = [
    { label: "Assigned", value: stats.assigned },
    { label: "Visits today", value: stats.todayVisits },
    { label: "Orders today", value: stats.todayOrders },
    { label: "Collected today", value: formatMoney(stats.todayCollected) },
  ];

  return (
    <main className="px-5 pt-6 pb-6">
      <div className="flex items-center gap-3">
        <div className="w-14 h-14 rounded-full bg-tnm-teal-600 text-white flex items-center justify-center text-[18px] font-bold">
          {initials}
        </div>
        <div className="min-w-0">
          <h1 className="text-[19px] font-bold tracking-tight text-gray-900">{rep.name}</h1>
          <p className="text-[12.5px] text-gray-400">{rep.email}</p>
          <span
            className={`inline-flex items-center gap-1.5 mt-1 rounded-full px-2 py-0.5 text-[10.5px] font-semibold ${
              stats.onShift ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500"
            }`}
          >
            <span className={`r-dot ${stats.onShift ? "r-dot--live" : ""}`} />
            {stats.onShift ? "On shift" : "Off shift"}
          </span>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2.5">
        {cards.map((c) => (
          <div key={c.label} className="flex flex-col gap-1 rounded-[14px] bg-white border border-gray-100 px-4 py-3.5">
            <span className="text-[11.5px] text-gray-400">{c.label}</span>
            <strong className="text-[17px] font-bold tracking-tight text-gray-900">{c.value}</strong>
          </div>
        ))}
      </div>

      <Link
        href="/rep/notifications"
        className="mt-3 flex items-center gap-3 rounded-[14px] bg-white border border-gray-100 px-4 py-3.5 active:bg-gray-50"
      >
        <Bell size={18} className="text-gray-500" aria-hidden="true" />
        <span className="text-[14px] font-medium text-gray-900 flex-1">Notifications</span>
        {unread > 0 && (
          <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-tnm-red-500 text-white text-[11px] font-bold inline-flex items-center justify-center">
            {unread}
          </span>
        )}
        <ChevronRight size={18} className="text-gray-300" aria-hidden="true" />
      </Link>

      <p className="mt-5 text-[11.5px] text-gray-400 leading-relaxed">
        Demo build · no authentication. The current user is the first seeded rep.
      </p>
    </main>
  );
}
