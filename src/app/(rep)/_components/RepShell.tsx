"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Home, Map, Users, Clock, User, type LucideIcon } from "lucide-react";

type RepHref = "/rep" | "/rep/map" | "/rep/customers" | "/rep/history" | "/rep/profile";

const TABS: { id: string; label: string; href: RepHref; icon: LucideIcon; isActive: (p: string) => boolean }[] = [
  { id: "route", label: "Route", href: "/rep", icon: Home, isActive: (p) => p === "/rep" },
  { id: "map", label: "Map", href: "/rep/map", icon: Map, isActive: (p) => p.startsWith("/rep/map") },
  { id: "customers", label: "Customers", href: "/rep/customers", icon: Users, isActive: (p) => p.startsWith("/rep/customers") },
  { id: "history", label: "History", href: "/rep/history", icon: Clock, isActive: (p) => p.startsWith("/rep/history") },
  { id: "profile", label: "Me", href: "/rep/profile", icon: User, isActive: (p) => p.startsWith("/rep/profile") },
];

export function RepShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="flex flex-col h-[100dvh] overflow-hidden bg-white">
      <main className="flex-1 min-h-0 overflow-y-auto" style={{ overscrollBehaviorY: "contain" }}>
        <div key={pathname} className="rep-page-enter min-h-full">
          {children}
        </div>
      </main>
      <nav
        className="flex-shrink-0 grid grid-cols-5 border-t border-[var(--border-soft)] bg-white"
        style={{ zIndex: "var(--z-bottom-tab)", paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
        aria-label="Primary navigation"
      >
        {TABS.map((tab) => {
          const active = tab.isActive(pathname);
          const Icon = tab.icon;
          return (
            <Link
              key={tab.id}
              href={tab.href}
              className="flex flex-col items-center gap-[3px] py-2.5 active:opacity-70 transition-opacity duration-75"
              style={{ color: active ? "var(--tnm-teal-600)" : "var(--gray-400)" }}
              aria-current={active ? "page" : undefined}
            >
              <Icon size={22} strokeWidth={1.7} aria-hidden="true" />
              <span
                className="text-[11px] leading-none"
                style={{ fontWeight: active ? 600 : 500, color: active ? "var(--tnm-teal-700)" : "var(--gray-500)" }}
              >
                {tab.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
