import type { ReactNode } from "react";
import { getCurrentManager } from "@/lib/session";
import { ManagerShell } from "./_components/ManagerShell";

export const dynamic = "force-dynamic";

export default async function ManagerLayout({ children }: { children: ReactNode }) {
  const mgr = await getCurrentManager().catch(() => null);
  return <ManagerShell managerName={mgr?.name ?? "Manager"}>{children}</ManagerShell>;
}
