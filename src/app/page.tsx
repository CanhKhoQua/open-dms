import Link from "next/link";
import { ArrowRight } from "lucide-react";

const FEATURES = [
  {
    title: "Field ops",
    body: "Rep routes, GPS check-in with in/out-of-range status, shifts, and photos.",
  },
  {
    title: "Order taking",
    body: "Create orders on-site from price lists; each order can bill an invoice.",
  },
  {
    title: "Self-contained receivables",
    body: "Invoice → FIFO payment allocation → 0-30/31-60/60+ aging → credit limit.",
  },
  {
    title: "ERP as a plugin",
    body: "Your own DB is the source of truth. Swap mock / CSV / ERP via one env var.",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-4xl px-6 py-16">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-[12px] bg-tnm-teal-600 text-white flex items-center justify-center font-bold text-[16px]">
            OD
          </div>
          <div>
            <h1 className="text-[26px] font-bold tracking-tight text-gray-900 leading-none">
              Open DMS
            </h1>
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-tnm-teal-500 mt-1.5">
              ERP-agnostic distribution management
            </p>
          </div>
        </div>

        <p className="mt-6 text-[15px] leading-relaxed text-gray-600 max-w-2xl text-balance">
          An open Distribution Management System — field sales, GPS check-in, order
          taking, and self-contained accounts receivable. Your own database is the
          source of truth; any ERP is just a plugin.
        </p>

        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href="/rep"
            className="inline-flex items-center gap-2 rounded-[10px] bg-tnm-teal-600 px-4 py-2.5 text-[13.5px] font-bold text-white hover:bg-tnm-teal-700 transition-colors"
          >
            Open rep app <ArrowRight size={16} aria-hidden="true" />
          </Link>
          <Link
            href="/manager"
            className="inline-flex items-center gap-2 rounded-[10px] border border-gray-200 bg-white px-4 py-2.5 text-[13.5px] font-semibold text-gray-900 hover:bg-gray-50 transition-colors"
          >
            Open manager console
          </Link>
        </div>

        <div className="mt-10 grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(220px,1fr))]">
          {FEATURES.map((f) => (
            <div key={f.title} className="rounded-[14px] bg-white border border-gray-100 p-5">
              <h3 className="text-[14px] font-semibold text-gray-900">{f.title}</h3>
              <p className="text-[13px] leading-relaxed text-gray-500 mt-1.5">{f.body}</p>
            </div>
          ))}
        </div>

        <div className="mt-10">
          <h3 className="text-[13px] font-semibold text-gray-900 mb-2">Run it</h3>
          <pre className="rounded-[12px] bg-gray-900 text-gray-100 text-[12.5px] leading-relaxed p-4 overflow-x-auto font-mono">
{`npm install
cp .env.example .env
npm run db:push     # SQLite tables (zero config)
npm run seed        # demo data
npm run dev         # http://localhost:3000`}
          </pre>
          <p className="text-[12.5px] text-gray-500 mt-2">
            SQLite by default — no server needed. For a hosted demo, set{" "}
            <code className="rounded bg-gray-100 border border-gray-200 px-1.5 py-0.5 text-[12px] font-mono">
              DATABASE_PROVIDER=postgresql
            </code>{" "}
            and deploy on Vercel + Neon.
          </p>
        </div>

        <p className="mt-10 text-[12.5px] text-gray-400">
          Health check:{" "}
          <a href="/api/health" className="text-blue-600 hover:underline">
            /api/health
          </a>
        </p>
      </div>
    </main>
  );
}
