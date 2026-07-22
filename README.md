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

## Quick start (zero config)

Uses **SQLite by default** — no database server, no Docker.

```bash
npm install
cp .env.example .env
npm run db:push     # create the SQLite tables
npm run seed        # demo data (multi-rep, orders, FIFO payments, aging, GPS visits)
npm run dev         # http://localhost:3000
```

Open `/rep` (field rep app) and `/manager` (console). Health: `/api/health`.

### Use Postgres instead
In `.env` set `DATABASE_PROVIDER="postgresql"` and a Postgres `DATABASE_URL`, then
`npm run db:push && npm run seed`. The **same schema** runs on both connectors —
`scripts/set-provider.mjs` flips the Prisma provider from `DATABASE_PROVIDER`.

## Deploy a live demo (Vercel + Neon, free)

GitHub Pages can't host this — it needs a Node server + a database. Use Vercel for
the app and Neon (or Vercel Postgres / Supabase) for the DB. Both have free tiers.

1. Push this repo to GitHub → "Import Project" on Vercel.
2. Create a free Postgres on Neon; copy the connection string.
3. Vercel → Settings → Environment Variables:
   - `DATABASE_PROVIDER = postgresql`
   - `DATABASE_URL = <Neon connection string>`
   - `ALLOW_DEMO_SEED = true`
4. Deploy — the build runs `prisma db push` to create the tables on Neon.
5. Open the site → `/manager` → **Reset demo data** (or `POST /api/seed`) to load rows.

> SQLite is local-only (serverless filesystems are ephemeral), so hosted demos use Postgres.

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
