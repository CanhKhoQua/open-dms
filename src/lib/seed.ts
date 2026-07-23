import type { PrismaClient } from "@prisma/client";
import { allocateFifo } from "@/lib/debt/fifo";
import { serializeWeekdays } from "@/lib/weekdays";

const DAY = 24 * 60 * 60 * 1000;
const round2 = (n: number) => Math.round(n * 100) / 100;

export async function runSeed(prisma: PrismaClient) {
  const now = new Date();
  const daysAgo = (n: number) => new Date(now.getTime() - n * DAY);
  const daysFromNow = (n: number) => new Date(now.getTime() + n * DAY);
  const invoiceStatus = (amount: number, paid: number, dueDate: Date) => {
    if (paid >= amount) return "PAID" as const;
    if (dueDate.getTime() < now.getTime()) return "OVERDUE" as const;
    if (paid > 0) return "PARTIAL" as const;
    return "OPEN" as const;
  };

  // clean slate (child -> parent)
  await prisma.paymentAllocation.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.orderLine.deleteMany();
  await prisma.order.deleteMany();
  await prisma.visit.deleteMany();
  await prisma.shift.deleteMany();
  await prisma.repAssignment.deleteMany();
  await prisma.priceListItem.deleteMany();
  await prisma.priceList.deleteMany();
  await prisma.promotion.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.pushSubscription.deleteMany();
  await prisma.product.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.user.deleteMany();

  await prisma.user.create({ data: { email: "admin@open-dms.local", name: "Admin", role: "ADMIN" } });
  const manager = await prisma.user.create({ data: { email: "manager@open-dms.local", name: "Susan Brooks", role: "MANAGER" } });
  const reps = [];
  for (const r of [
    { email: "james@open-dms.local", name: "James Carter" },
    { email: "maria@open-dms.local", name: "Maria Lopez" },
    { email: "david@open-dms.local", name: "David Kim" },
  ]) {
    reps.push(await prisma.user.create({ data: { ...r, role: "REP" } }));
  }

  const productSpecs = [
    { sku: "SP-COLA-330", name: "Cola 330ml", category: "BEVERAGE", unit: "can", basePrice: 0.4, stockQty: 5000 },
    { sku: "SP-MILK-1L", name: "Fresh Milk 1L", category: "DAIRY", unit: "carton", basePrice: 1.3, stockQty: 800 },
    { sku: "SP-WATER-500", name: "Spring Water 500ml", category: "BEVERAGE", unit: "bottle", basePrice: 0.2, stockQty: 9000 },
    { sku: "SP-SNACK-100", name: "Potato Chips 100g", category: "SNACK", unit: "pack", basePrice: 0.65, stockQty: 1200 },
  ];
  const products = [];
  for (const p of productSpecs) products.push(await prisma.product.create({ data: p }));
  const priceOf = new Map(productSpecs.map((p) => [p.sku, p.basePrice]));

  const priceList = await prisma.priceList.create({ data: { name: "Standard price list" } });
  await prisma.priceListItem.createMany({
    data: products.map((p) => ({ priceListId: priceList.id, productId: p.id, price: p.basePrice })),
  });

  const custSpecs = [
    { code: "C001", name: "Bay Street Grocery", type: "RETAIL", lat: 10.7769, lng: 106.7009, limit: 20000, rep: 0, wd: [1, 2, 3, 4, 5, 6, 7] },
    { code: "C002", name: "Corner Mini Mart", type: "WHOLESALE", lat: 10.7872, lng: 106.6969, limit: 50000, rep: 0, wd: [1, 3, 5] },
    { code: "C003", name: "Old Town Coffee", type: "RETAIL", lat: 10.77, lng: 106.705, limit: 10000, rep: 0, wd: [1, 2, 3, 4, 5, 6, 7] },
    { code: "C004", name: "24h Convenience", type: "RETAIL", lat: 10.762, lng: 106.682, limit: 15000, rep: 1, wd: [1, 2, 3, 4, 5, 6, 7] },
    { code: "C005", name: "Southgate Distributors", type: "WHOLESALE", lat: 10.8, lng: 106.65, limit: 80000, rep: 1, wd: [2, 4, 6] },
    { code: "C006", name: "Blue Ocean Restaurant", type: "KEY_ACCOUNT", lat: 10.79, lng: 106.72, limit: 60000, rep: 2, wd: [1, 2, 3, 4, 5, 6, 7] },
  ];
  const customers: Record<string, { id: string; lat: number; lng: number; rep: string }> = {};
  for (const c of custSpecs) {
    const created = await prisma.customer.create({
      data: { code: c.code, name: c.name, customerType: c.type, latitude: c.lat, longitude: c.lng, creditLimit: c.limit },
    });
    customers[c.code] = { id: created.id, lat: c.lat, lng: c.lng, rep: reps[c.rep].id };
    await prisma.repAssignment.create({ data: { repId: reps[c.rep].id, customerId: created.id, plannedWeekdays: serializeWeekdays(c.wd) } });
  }

  await prisma.shift.create({ data: { repId: reps[0].id, startedAt: daysAgo(0) } });

  const invSpecs: [string, number, number, number][] = [
    ["C001", 75, -45, 10000],
    ["C001", 20, 10, 5000],
    ["C002", 100, -70, 24000],
    ["C003", 40, -10, 3000],
    ["C005", 15, 15, 40000],
    ["C006", 90, -60, 18000],
  ];
  let invSeq = 0;
  const invByCustomer: Record<string, { id: string; issuedAt: Date; dueDate: Date; amount: number }[]> = {};
  for (const [code, issued, due, amount] of invSpecs) {
    invSeq += 1;
    const dueDate = due < 0 ? daysAgo(-due) : daysFromNow(due);
    const inv = await prisma.invoice.create({
      data: {
        code: `INV-${String(invSeq).padStart(3, "0")}`,
        customerId: customers[code].id,
        issuedAt: daysAgo(issued),
        dueDate,
        amount,
        status: due < 0 ? "OVERDUE" : "OPEN",
      },
    });
    (invByCustomer[code] ||= []).push({ id: inv.id, issuedAt: inv.issuedAt, dueDate, amount });
  }

  const c1Invoices = invByCustomer["C001"];
  const paymentAmount = 6000;
  const payment = await prisma.payment.create({
    data: { code: "PAY-001", customerId: customers["C001"].id, repId: customers["C001"].rep, amount: paymentAmount, method: "CASH", receivedAt: daysAgo(0) },
  });
  const fifo = allocateFifo(paymentAmount, c1Invoices.map((i) => ({ id: i.id, issuedAt: i.issuedAt, outstanding: i.amount })));
  for (const alloc of fifo.allocations) {
    await prisma.paymentAllocation.create({ data: { paymentId: payment.id, invoiceId: alloc.invoiceId, amount: alloc.amount } });
    const inv = c1Invoices.find((i) => i.id === alloc.invoiceId)!;
    await prisma.invoice.update({
      where: { id: alloc.invoiceId },
      data: { paidAmount: round2(alloc.amount), status: invoiceStatus(inv.amount, alloc.amount, inv.dueDate) },
    });
  }

  await prisma.order.create({
    data: {
      code: "ORD-001",
      customerId: customers["C004"].id,
      repId: customers["C004"].rep,
      status: "SUBMITTED",
      orderedAt: daysAgo(0),
      subtotal: priceOf.get("SP-COLA-330")! * 200 + priceOf.get("SP-WATER-500")! * 100,
      total: priceOf.get("SP-COLA-330")! * 200 + priceOf.get("SP-WATER-500")! * 100,
      lines: {
        create: [
          { productId: products[0].id, quantity: 200, unitPrice: priceOf.get("SP-COLA-330")!, lineTotal: priceOf.get("SP-COLA-330")! * 200 },
          { productId: products[2].id, quantity: 100, unitPrice: priceOf.get("SP-WATER-500")!, lineTotal: priceOf.get("SP-WATER-500")! * 100 },
        ],
      },
    },
  });

  const visitSpecs: { code: string; days: number; gps: "OK" | "OUT_OF_RANGE" | "MISSING"; outcome?: "ORDER" | "NO_ORDER" }[] = [
    { code: "C001", days: 0, gps: "OK", outcome: "ORDER" },
    { code: "C003", days: 0, gps: "OUT_OF_RANGE", outcome: "NO_ORDER" },
    { code: "C004", days: 0, gps: "OK", outcome: "ORDER" },
    { code: "C006", days: 0, gps: "MISSING", outcome: "NO_ORDER" },
    { code: "C002", days: 2, gps: "OK", outcome: "ORDER" },
    { code: "C005", days: 3, gps: "OK", outcome: "NO_ORDER" },
  ];
  for (const v of visitSpecs) {
    const c = customers[v.code];
    const jitter = v.gps === "OUT_OF_RANGE" ? 0.01 : v.gps === "MISSING" ? 0 : 0.0005;
    await prisma.visit.create({
      data: {
        repId: c.rep,
        customerId: c.id,
        checkInAt: daysAgo(v.days),
        latitude: v.gps === "MISSING" ? null : c.lat + jitter,
        longitude: v.gps === "MISSING" ? null : c.lng + jitter,
        gpsStatus: v.gps,
        outcome: v.outcome,
      },
    });
  }

  await prisma.notification.create({
    data: { userId: manager.id, kind: "DEBT_ALERT", title: "High overdue receivables", body: "Several customers are 60+ days overdue." },
  });
  for (const rep of reps) {
    await prisma.notification.create({
      data: { userId: rep.id, kind: "VISIT_REMINDER", title: "Today's route is ready", body: "You have customers planned for today." },
    });
  }
  await prisma.notification.create({
    data: { userId: reps[1].id, kind: "ORDER_UPDATE", title: "Order ORD-001 submitted", body: "New order for 24h Convenience." },
  });

  const custCount = await prisma.customer.count();
  return { reps: reps.length, customers: custCount, invoices: invSeq, fifoRemaining: fifo.remaining };
}
