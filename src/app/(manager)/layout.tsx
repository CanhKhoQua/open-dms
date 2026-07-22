import Link from "next/link";

export default function ManagerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="rep-shell">
      <header className="rep-header">
        <Link href="/manager" className="brand">
          open-dms · Manager
        </Link>
        <nav>
          <Link href="/manager">Tổng quan</Link>
          <Link href="/manager/debt">Công nợ</Link>
          <Link href="/manager/team">Đội ngũ</Link>
          <Link href="/manager/visits">Ghé thăm</Link>
        </nav>
      </header>
      <div className="mgr-body">{children}</div>
    </div>
  );
}
