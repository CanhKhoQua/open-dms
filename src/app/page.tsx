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
        <pre>{`cp .env.example .env
docker compose up -d          # Postgres 16
npm install
npm run db:migrate            # create tables
npm run seed                  # demo data (orders, invoices, FIFO, a GPS visit)
npm run dev                   # http://localhost:3000`}</pre>
        <p className="tag">
          No Docker? Set <code>provider = &quot;sqlite&quot;</code> in{" "}
          <code>prisma/schema.prisma</code> and{" "}
          <code>DATABASE_URL=&quot;file:./dev.db&quot;</code>.
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
