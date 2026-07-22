import Link from "next/link";

export default function RepLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="rep-shell">
      <header className="rep-header">
        <Link href="/rep" className="brand">
          open-dms · Rep
        </Link>
        <nav>
          <Link href="/rep">Tuyến</Link>
          <Link href="/rep/history">Lịch sử</Link>
        </nav>
      </header>
      <div className="rep-body">{children}</div>
    </div>
  );
}
