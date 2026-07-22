"use server";

import { prisma } from "@/lib/db";
import { getCurrentRep } from "@/lib/session";
import { haversineMeters, gpsStatusFor } from "@/lib/geo";
import { allocateFifo } from "@/lib/debt/fifo";
import { revalidatePath } from "next/cache";

// Every rep action re-verifies the customer belongs to the current rep.
async function assertOwned(repId: string, customerId: string) {
  const link = await prisma.repAssignment.findUnique({
    where: { repId_customerId: { repId, customerId } },
  });
  if (!link) throw new Error("Khach hang khong thuoc pham vi cua ban.");
}

function invoiceStatus(amount: number, paid: number, dueDate: Date) {
  if (paid >= amount) return "PAID" as const;
  if (dueDate.getTime() < Date.now()) return "OVERDUE" as const;
  if (paid > 0) return "PARTIAL" as const;
  return "OPEN" as const;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

export type CheckInInput = {
  customerId: string;
  latitude: number | null;
  longitude: number | null;
  note?: string;
  outcome?: "ORDER" | "NO_ORDER" | "CLOSED" | "REVISIT";
};

export async function checkIn(input: CheckInInput) {
  const rep = await getCurrentRep();
  await assertOwned(rep.id, input.customerId);
  const customer = await prisma.customer.findUniqueOrThrow({
    where: { id: input.customerId },
  });

  let distance: number | null = null;
  if (
    input.latitude != null &&
    input.longitude != null &&
    customer.latitude != null &&
    customer.longitude != null
  ) {
    distance = haversineMeters(
      { latitude: input.latitude, longitude: input.longitude },
      { latitude: customer.latitude, longitude: customer.longitude },
    );
  }
  const gpsStatus = gpsStatusFor(distance);

  await prisma.visit.create({
    data: {
      repId: rep.id,
      customerId: input.customerId,
      latitude: input.latitude,
      longitude: input.longitude,
      gpsStatus,
      outcome: input.outcome,
      note: input.note,
    },
  });

  revalidatePath(`/rep/customers/${input.customerId}`);
  revalidatePath("/rep");
  return { gpsStatus, distanceM: distance === null ? null : Math.round(distance) };
}

export async function startShift() {
  const rep = await getCurrentRep();
  const open = await prisma.shift.findFirst({ where: { repId: rep.id, endedAt: null } });
  if (!open) await prisma.shift.create({ data: { repId: rep.id } });
  revalidatePath("/rep");
}

export async function endShift() {
  const rep = await getCurrentRep();
  const open = await prisma.shift.findFirst({
    where: { repId: rep.id, endedAt: null },
    orderBy: { startedAt: "desc" },
  });
  if (open) await prisma.shift.update({ where: { id: open.id }, data: { endedAt: new Date() } });
  revalidatePath("/rep");
}

export type OrderLineInput = { productId: string; quantity: number };

export async function createOrder(input: {
  customerId: string;
  lines: OrderLineInput[];
  issueInvoice: boolean;
}) {
  const rep = await getCurrentRep();
  await assertOwned(rep.id, input.customerId);

  const cleanLines = input.lines.filter((l) => l.quantity > 0);
  if (cleanLines.length === 0) throw new Error("Don hang chua co dong nao.");

  const products = await prisma.product.findMany({
    where: { id: { in: cleanLines.map((l) => l.productId) } },
  });
  const priceOf = new Map(products.map((p) => [p.id, Number(p.basePrice)]));

  const lines = cleanLines.map((l) => {
    const unitPrice = priceOf.get(l.productId) ?? 0;
    return {
      productId: l.productId,
      quantity: l.quantity,
      unitPrice,
      lineTotal: round2(unitPrice * l.quantity),
    };
  });
  const subtotal = round2(lines.reduce((s, l) => s + l.lineTotal, 0));
  const code = `ORD-${Date.now()}`;

  const order = await prisma.order.create({
    data: {
      code,
      customerId: input.customerId,
      repId: rep.id,
      status: "SUBMITTED",
      subtotal,
      discount: 0,
      total: subtotal,
      lines: { create: lines },
    },
  });

  if (input.issueInvoice) {
    const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await prisma.invoice.create({
      data: {
        code: `INV-${Date.now()}`,
        customerId: input.customerId,
        orderId: order.id,
        dueDate,
        amount: subtotal,
        status: "OPEN",
      },
    });
  }

  revalidatePath(`/rep/customers/${input.customerId}`);
  revalidatePath("/rep");
  return { orderCode: code, total: subtotal };
}

export async function collectPayment(input: {
  customerId: string;
  amount: number;
  method: "CASH" | "BANK_TRANSFER" | "E_WALLET";
}) {
  const rep = await getCurrentRep();
  await assertOwned(rep.id, input.customerId);
  if (input.amount <= 0) throw new Error("So tien phai lon hon 0.");

  const invoices = await prisma.invoice.findMany({
    where: { customerId: input.customerId, status: { notIn: ["PAID", "VOID"] } },
    orderBy: { issuedAt: "asc" },
  });

  const open = invoices
    .map((i) => ({
      id: i.id,
      issuedAt: new Date(i.issuedAt),
      dueDate: new Date(i.dueDate),
      amount: Number(i.amount),
      paidAmount: Number(i.paidAmount),
      outstanding: round2(Number(i.amount) - Number(i.paidAmount)),
    }))
    .filter((i) => i.outstanding > 0);

  const fifo = allocateFifo(input.amount, open);

  const payment = await prisma.payment.create({
    data: {
      code: `PAY-${Date.now()}`,
      customerId: input.customerId,
      repId: rep.id,
      amount: input.amount,
      method: input.method,
    },
  });

  for (const alloc of fifo.allocations) {
    const inv = open.find((i) => i.id === alloc.invoiceId)!;
    const newPaid = round2(inv.paidAmount + alloc.amount);
    await prisma.paymentAllocation.create({
      data: { paymentId: payment.id, invoiceId: alloc.invoiceId, amount: alloc.amount },
    });
    await prisma.invoice.update({
      where: { id: alloc.invoiceId },
      data: { paidAmount: newPaid, status: invoiceStatus(inv.amount, newPaid, inv.dueDate) },
    });
  }

  revalidatePath(`/rep/customers/${input.customerId}`);
  revalidatePath("/rep");
  return {
    paymentCode: payment.code,
    applied: fifo.allocations.length,
    remaining: fifo.remaining,
  };
}
