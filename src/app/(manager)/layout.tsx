import type { ReactNode } from "react";
import { getCurrentManager } from "@/lib/session";
import { getUnreadCount } from "@/lib/notifications";
import { ManagerShell } from "./_components/ManagerShell";

export const dynamic = "force-dynamic";

export default async function ManagerLayout({ children }: { children: ReactNode }) {
  const mgr = await getCurrentManager().catch(() => null);
  const unread = mgr ? await getUnreadCount(mgr.id).catch(() => 0) : 0;
  return (
    <ManagerShell managerName={mgr?.name ?? "Manager"} unreadCount={unread}>
      {children}
    </ManagerShell>
  );
}
