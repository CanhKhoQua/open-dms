import type { ReactNode } from "react";
import { RepShell } from "./_components/RepShell";

export default function RepLayout({ children }: { children: ReactNode }) {
  return <RepShell>{children}</RepShell>;
}
