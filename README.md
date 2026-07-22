# open-dms

> Open, ERP-agnostic **Distribution Management System** — for any business with
> field sales reps, routes, and receivables. Field ops + order taking +
> self-contained accounts receivable, with no proprietary ERP required.

> **Name is a placeholder** (`open-dms`) — final product name TBD.

## Why

Most DMS builds are welded to one accounting/ERP system: the ERP is the source
of truth, and the app reads customers, products, and debt straight out of it.
That makes them impossible to open-source or reuse.

open-dms **inverts the dependency**:

- The app's **own database is the source of truth**.
- Any external ERP (MISA, SAP, a spreadsheet) is an **optional plugin** that
  feeds the DB through a small `ErpAdapter` interface — never read at request time.
- Debt (invoices, payments, aging, credit limits) is **self-contained** — no GL,
  no tax engine, no accounting coupling.

So it runs greenfield out of the box, and connects to your ERP when you want it to.

## Features

- **Field ops** — rep ↔ customer assignments with planned weekdays, GPS check-in
  with in-range / out-of-range status, shifts, visit outcomes + photos.
- **Order taking** — build orders on-site from price lists; an order can bill an invoice.
- **Accounts receivable (self-contained)** — invoice → **FIFO** payment allocation
  → **0-30 / 31-60 / 60+ aging** → credit-limit tracking → collect-at-point-of-sale.
- **ERP as a plugin** — `mock` (demo data) · `csv` (import files) · `misa` (stub seam).
- **Notifications** — in-app + optional Web Push (auto-disabled when VAPID keys are blank).

## Architecture

```
             ERP_ADAPTER=mock|csv|misa
                        |
   +--------------------v--------------------+
   |            src/lib/erp (ErpAdapter)     |   <- the only seam to any ERP
   |   mock.ts    csv.ts    misa.ts (stub)   |
   +--------------------+--------------------+
                        | one-time / scheduled load
                        v
   +-----------------------------------------+
   |   Own database (Prisma + Postgres)      |   <- source of truth
   |   customers · products · orders ·       |
   |   invoices · payments · visits          |
   +--------------------+--------------------+
                        |
        +---------------+----------------+
        |                                |
   src/lib/debt                     src/app (Next.js)
   aging.ts · fifo.ts               (rep) · (manager) · api
   (pure, testable)
```

## Tech stack

- **Next.js 15** (App Router) · **React 19** · **TypeScript**
- **Prisma** ORM · **Postgres 16** (switch `provider` to `sqlite` to run with no DB server)

## Quick start

```bash
cp .env.example .env
docker compose up -d          # Postgres 16
npm install
npm run db:migrate            # create tables
npm run seed                  # demo data: order -> invoice -> partial payment (FIFO) -> overdue -> a GPS visit
npm run dev                   # http://localhost:3000
```

**No Docker?** Target SQLite with three schema tweaks: set `provider = "sqlite"`, change `plannedWeekdays Int[]` to `plannedWeekdays String`, and drop the `@db.Decimal(18,2)` native annotations (keep the `Decimal` type). Then set `DATABASE_URL="file:./dev.db"` and run `npm run db:migrate && npm run seed && npm run dev`.

Health check: `GET /api/health`.

## Project structure

```
prisma/
  schema.prisma        16 models, UUID PKs, self-contained AR
  seed.ts              full demo chain (reuses src/lib/debt/fifo)
src/
  app/
    (rep)/             field-rep app (route group)
    (manager)/         manager console (route group)
    api/health/        db liveness
  lib/
    db.ts              Prisma client singleton
    erp/               ErpAdapter: types · index (factory) · mock · csv · misa
    debt/              aging.ts (buckets) · fifo.ts (allocation) — pure functions
data/                  sample CSVs for the csv adapter
```

## Where things plug in

The public build ships stubs at the integration seams — this is where a real
deployment wires in its own providers:

| Seam | Public build | Plug in |
| --- | --- | --- |
| ERP / accounting | `mock`, `csv` | `src/lib/erp/misa.ts` (or your own adapter) |
| Maps | OpenStreetMap tiles | Mapbox / Google via env |
| Web Push | off unless VAPID set | your VAPID keys |
| Payments / e-invoice | — | add an adapter following `src/lib/erp` |

## License

MIT — see [LICENSE](./LICENSE).
