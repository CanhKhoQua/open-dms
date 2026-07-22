export default function Home() {
  return (
    <main className="wrap">
      <h1>open-dms</h1>
      <p className="tag">
        Open, ERP-agnostic Distribution Management System — field sales, GPS
        check-in, order taking, and self-contained accounts receivable.
      </p>

      <div className="grid">
        <div className="card">
          <h3>Field ops</h3>
          <p>Rep routes, GPS check-in with in/out-of-range status, shifts, photos.</p>
        </div>
        <div className="card">
          <h3>Order taking</h3>
          <p>Create orders on-site from price lists; each order can bill an invoice.</p>
        </div>
        <div className="card">
          <h3>Debt, self-contained</h3>
          <p>Invoice → FIFO payment allocation → 0-30/31-60/60+ aging → credit limit.</p>
        </div>
        <div className="card">
          <h3>ERP as a plugin</h3>
          <p>Own DB is the source of truth. Swap mock / CSV / MISA via one env var.</p>
        </div>
      </div>

      <div className="section">
        <h3>Run it</h3>
        <pre>{`npm install
cp .env.example .env
npm run db:push     # SQLite tables (zero config)
npm run seed        # demo data
npm run dev         # http://localhost:3000`}</pre>
        <p className="tag">
          SQLite by default — no server needed. Deploy a live demo on Vercel + Neon
          by setting <code>DATABASE_PROVIDER=postgresql</code>.
        </p>
      </div>

      <div className="section">
        <p className="tag">
          Health: <a href="/api/health">/api/health</a> · Rep view:{" "}
          <a href="/rep">/rep</a> · Manager view: <a href="/manager">/manager</a>
        </p>
      </div>
    </main>
  );
}
