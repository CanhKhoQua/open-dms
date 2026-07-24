"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import {
  LayoutDashboard,
  Map as MapIcon,
  Building2,
  UserCog,
  Users,
  CreditCard,
  MapPin,
  Activity,
  Target,
  Gauge,
  type LucideIcon,
} from "lucide-react";
import { NotificationsBell } from "./NotificationsBell";
import { GlobalSearch } from "./GlobalSearch";

type ManagerHref =
  | "/manager"
  | "/manager/today"
  | "/manager/map"
  | "/manager/customers"
  | "/manager/reps"
  | "/manager/team"
  | "/manager/coverage"
  | "/manager/performance"
  | "/manager/debt"
  | "/manager/visits";

const RAIL_ITEMS: { href: ManagerHref; label: string; sub: string; icon: LucideIcon }[] = [
  { href: "/manager", label: "Overview", sub: "dashboard", icon: LayoutDashboard },
  { href: "/manager/today", label: "Today", sub: "live activity", icon: Activity },
  { href: "/manager/map", label: "Map", sub: "customers", icon: MapIcon },
  { href: "/manager/customers", label: "Customers", sub: "directory", icon: Building2 },
  { href: "/manager/reps", label: "Reps", sub: "accounts", icon: UserCog },
  { href: "/manager/team", label: "Team", sub: "today's plan", icon: Users },
  { href: "/manager/coverage", label: "Coverage", sub: "reach & gaps", icon: Target },
  { href: "/manager/performance", label: "Performance", sub: "rep KPIs", icon: Gauge },
  { href: "/manager/debt", label: "Receivables", sub: "debt & aging", icon: CreditCard },
  { href: "/manager/visits", label: "Visits", sub: "check-ins", icon: MapPin },
];

const ROUTE_META: Record<string, { title: string; subtitle: string }> = {
  "/manager": { title: "Overview", subtitle: "Company-wide sales & receivables" },
  "/manager/today": { title: "Today", subtitle: "Live field activity across the team" },
  "/manager/map": { title: "Customer map", subtitle: "All customers · pins colored by status" },
  "/manager/customers": { title: "Customers", subtitle: "Company-wide directory" },
  "/manager/reps": { title: "Reps", subtitle: "Accounts & assignment counts" },
  "/manager/team": { title: "Team", subtitle: "Today's plan · visited vs. planned, by rep" },
  "/manager/coverage": { title: "Coverage", subtitle: "Assigned customers reached in the last 30 days" },
  "/manager/performance": { title: "Performance", subtitle: "Rep KPIs over the last 30 days" },
  "/manager/debt": { title: "Receivables", subtitle: "Outstanding · overdue · over credit limit" },
  "/manager/visits": { title: "Visits", subtitle: "Recent check-ins across the team" },
  "/manager/notifications": { title: "Notifications", subtitle: "Alerts for your account" },
};

function isActive(href: string, pathname: string): boolean {
  return href === "/manager" ? pathname === "/manager" : pathname.startsWith(href);
}

interface ManagerShellProps {
  managerName: string;
  unreadCount?: number;
  children: ReactNode;
}

export function ManagerShell({ managerName, unreadCount = 0, children }: ManagerShellProps) {
  const pathname = usePathname();
  const activeHref = RAIL_ITEMS.find((i) => isActive(i.href, pathname))?.href ?? "";
  const meta = ROUTE_META[pathname.startsWith("/manager/notifications") ? "/manager/notifications" : activeHref] ?? {
    title: "Open DMS",
    subtitle: "",
  };
  const initials = managerName.slice(0, 2).toUpperCase();

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <aside className="w-[216px] flex flex-col bg-white shrink-0 border-r border-gray-100">
        <div className="flex items-center gap-2.5 px-4 pt-5 pb-[22px]">
          <div className="w-10 h-10 rounded-[11px] bg-tnm-teal-600 text-white flex items-center justify-center font-bold text-[15px] shrink-0">
            OD
          </div>
          <div>
            <div className="text-[16px] font-bold tracking-tight text-gray-900 leading-none">Open DMS</div>
            <div className="text-[10px] font-semibold tracking-[0.08em] uppercase mt-[3px] text-tnm-teal-500">Manager</div>
          </div>
        </div>

        <nav className="flex flex-col gap-0.5 px-3 flex-1 overflow-y-auto">
          {RAIL_ITEMS.map((item) => {
            const active = isActive(item.href, pathname);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-[9px] rounded-lg text-[13px] font-medium transition-colors ${
                  active ? "bg-blue-50 text-blue-600" : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                }`}
              >
                <Icon size={18} strokeWidth={1.75} />
                <div className="flex-1 min-w-0">
                  <div>{item.label}</div>
                  <div className={`text-[10px] mt-0.5 ${active ? "text-blue-600 opacity-70" : "text-gray-400"}`}>{item.sub}</div>
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="px-4 pb-5">
          <p className="text-[10px] text-gray-400 leading-relaxed">
            Demo build · no auth.
            <br />
            All viewers share one dataset.
          </p>
        </div>
      </aside>

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <header className="h-[60px] flex items-center gap-4 px-6 bg-white shrink-0 border-b border-gray-100">
          <div className="min-w-0">
            <div className="text-[17px] font-semibold tracking-tight text-gray-900 leading-tight">{meta.title}</div>
            {meta.subtitle && <div className="text-[11px] text-gray-400 mt-0.5">{meta.subtitle}</div>}
          </div>
          <div className="flex items-center gap-2 ml-auto shrink-0">
            <GlobalSearch />
            <NotificationsBell initialUnread={unreadCount} />
            <div className="w-9 h-9 rounded-[10px] flex items-center justify-center bg-gray-100 text-gray-700 font-bold text-[13px] select-none">
              {initials}
            </div>
          </div>
        </header>

        <div className="flex flex-col flex-1 min-h-0 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
