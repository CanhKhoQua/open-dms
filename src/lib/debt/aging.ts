// Accounts-receivable aging. Pure functions, no DB — trivially unit-testable.
// Buckets follow the classic 0-30 / 31-60 / 60+ overdue model.

export type AgingBucket = "current" | "d1_30" | "d31_60" | "d60_plus";

export const AGING_BUCKETS: AgingBucket[] = ["current", "d1_30", "d31_60", "d60_plus"];

export function bucketFor(daysPastDue: number): AgingBucket {
  if (daysPastDue <= 0) return "current";
  if (daysPastDue <= 30) return "d1_30";
  if (daysPastDue <= 60) return "d31_60";
  return "d60_plus";
}

export function daysPastDue(dueDate: Date, asOf: Date = new Date()): number {
  const MS_PER_DAY = 24 * 60 * 60 * 1000;
  return Math.floor((asOf.getTime() - dueDate.getTime()) / MS_PER_DAY);
}

export interface OpenInvoiceLike {
  id: string;
  dueDate: Date;
  amount: number;
  paidAmount: number;
}

export interface AgingRow {
  invoiceId: string;
  outstanding: number;
  daysPastDue: number;
  bucket: AgingBucket;
}

export type AgingSummary = Record<AgingBucket, number> & { total: number };

export function ageInvoices(invoices: OpenInvoiceLike[], asOf: Date = new Date()) {
  const rows: AgingRow[] = [];
  const summary: AgingSummary = {
    current: 0,
    d1_30: 0,
    d31_60: 0,
    d60_plus: 0,
    total: 0,
  };

  for (const inv of invoices) {
    const outstanding = round2(inv.amount - inv.paidAmount);
    if (outstanding <= 0) continue;
    const dpd = daysPastDue(inv.dueDate, asOf);
    const bucket = bucketFor(dpd);
    rows.push({ invoiceId: inv.id, outstanding, daysPastDue: dpd, bucket });
    summary[bucket] = round2(summary[bucket] + outstanding);
    summary.total = round2(summary.total + outstanding);
  }

  return { rows, summary };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
