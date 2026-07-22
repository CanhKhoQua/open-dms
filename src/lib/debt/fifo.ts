// FIFO payment allocation: a payment knocks down the OLDEST open invoices first.
// Pure function so it can be unit-tested and reused by API + seed.

export interface OpenInvoice {
  id: string;
  issuedAt: Date;
  outstanding: number;
}

export interface FifoAllocation {
  invoiceId: string;
  amount: number;
}

export interface FifoResult {
  allocations: FifoAllocation[];
  remaining: number; // overpayment left as unallocated credit
}

export function allocateFifo(payment: number, invoices: OpenInvoice[]): FifoResult {
  const ordered = invoices
    .filter((i) => i.outstanding > 0)
    .slice()
    .sort((a, b) => a.issuedAt.getTime() - b.issuedAt.getTime());

  const allocations: FifoAllocation[] = [];
  let remaining = round2(payment);

  for (const inv of ordered) {
    if (remaining <= 0) break;
    const applied = Math.min(remaining, inv.outstanding);
    allocations.push({ invoiceId: inv.id, amount: round2(applied) });
    remaining = round2(remaining - applied);
  }

  return { allocations, remaining };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
