import { PrismaClient } from "@prisma/client";
import { allocateFifo } from "../src/lib/debt/fifo";

const prisma = new PrismaClient();

const DAY = 24 * 60 * 60 * 1000;
const now = new Date();
const daysAgo = (n: number) => new Date(now.getTime() - n * DAY);
const daysFromNow = (n: number) => new Date(now.getTime() + n * DAY);
const round2 = (n: number) => Math.round(n * 100) / 100;

function invoiceStatus(amount: number, paid: number, dueDate: Date) {
  if (paid >= amount) return "PAID" as const;
  if (dueDate.getTime() < now.getTime()) return "OVERDUE" as const;
  if (paid > 0) return "PARTIAL" as const;
  return "OPEN" as const;
}

async function main() {
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

  // ----- users -----
  await prisma.user.create({ data: { email: "admin@open-dms.local", name: "Admin", role: "ADMIN" } });
  const manager = await prisma.user.create({ data: { email: "manager@open-dms.local", name: "Quan Ly Vung", role: "MANAGER" } });
  const reps = await Promise.all(
    [
      { email: "an@open-dms.local", name: "Nguyen Van An" },
      { email: "binh@open-dms.local", name: "Tran Thi Binh" },
      { email: "cuong@open-dms.local", name: "Le Van Cuong" },
    ].map((r) => prisma.user.create({ data: { ...r, role: "REP" } })),
  );

  // ----- products -----
  const productSpecs = [
    { sku: "SP-COLA-330", name: "Nuoc ngot Cola 330ml", category: "BEVERAGE", unit: "lon", basePrice: 9000, stockQty: 5000 },
    { sku: "SP-MILK-1L", name: "Sua tuoi 1L", category: "DAIRY", unit: "hop", basePrice: 32000, stockQty: 800 },
    { sku: "SP-WATER-500", name: "Nuoc suoi 500ml", category: "BEVERAGE", unit: "chai", basePrice: 5000, stockQty: 9000 },
    { sku: "SP-SNACK-100", name: "Snack khoai tay 100g", category: "SNACK", unit: "goi", basePrice: 15000, stockQty: 1200 },
  ];
  const products = await Promise.all(productSpecs.map((p) => prisma.product.create({ data: p })));
  const priceOf = new Map(products.map((p) => [p.sku, Number(p.basePrice)]));

  // ----- price list -----
  const priceList = await prisma.priceList.create({ data: { name: "Bang gia chuan" } });
  await prisma.priceListItem.createMany({
    data: products.map((p) => ({ priceListId: priceList.id, productId: p.id, price: p.basePrice })),
  });

  // ----- customers + assignments (weekdays chosen so every run day has a route) -----
  const custSpecs = [
    { code: "KH001", name: "Tap hoa Ba Nam", type: "RETAIL", lat: 10.7769, lng: 106.7009, limit: 20000000, rep: 0, wd: [1, 2, 3, 4, 5, 6, 7] },
    { code: "KH002", name: "Sieu thi Mini Anh Tuan", type: "WHOLESALE", lat: 10.7872, lng: 106.6969, limit: 50000000, rep: 0, wd: [1, 3, 5] },
    { code: "KH003", name: "Quan ca phe Goc Pho", type: "RETAIL", lat: 10.7700, lng: 106.7050, limit: 10000000, rep: 0, wd: [1, 2, 3, 4, 5, 6, 7] },
    { code: "KH004", name: "Cua hang Tien Loi 24h", type: "RETAIL", lat: 10.7620, lng: 106.6820, limit: 15000000, rep: 1, wd: [1, 2, 3, 4, 5, 6, 7] },
    { code: "KH005", name: "Dai ly Phuong Nam", type: "WHOLESALE", lat: 10.8000, lng: 106.6500, limit: 80000000, rep: 1, wd: [2, 4, 6] },
    { code: "KH006", name: "Nha hang Bien Xanh", type: "KEY_ACCOUNT", lat: 10.7900, lng: 106.7200, limit: 60000000, rep: 2, wd: [1, 2, 3, 4, 5, 6, 7] },
  ];
  const customers: Record<string, { id: string; lat: number; lng: number; rep: string }> = {};
  for (const c of custSpecs) {
    const created = await prisma.customer.create({
      data: { code: c.code, name: c.name, customerType: c.type, latitude: c.lat, longitude: c.lng, creditLimit: c.limit },
    });
    customers[c.code] = { id: created.id, lat: c.lat, lng: c.lng, rep: reps[c.rep].id };
    await prisma.repAssignment.create({ data: { repId: reps[c.rep].id, customerId: created.id, plannedWeekdays: c.wd } });
  }

  // ----- open shift for rep An -----
  await prisma.shift.create({ data: { repId: reps[0].id, startedAt: daysAgo(0) } });

  // ----- invoices across aging buckets -----
  // [customerCode, issuedDaysAgo, dueDaysFromNow(neg=overdue), amount]
  const invSpecs: [string, number, number, number][] = [
    ["KH001", 75, -45, 10000000], // overdue 31-60
    ["KH001", 20, 10, 5000000], // current
    ["KH002", 100, -70, 24000000], // overdue 60+
    ["KH003", 40, -10, 3000000], // overdue 1-30
    ["KH005", 15, 15, 40000000], // current, big
    ["KH006", 90, -60, 18000000], // overdue 60+
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

  // ----- a partial payment on KH001 (FIFO oldest-first) -----
  const kh1Invoices = invByCustomer["KH001"];
  const paymentAmount = 6000000;
  const payment = await prisma.payment.create({
    data: { code: "PAY-001", customerId: customers["KH001"].id, repId: customers["KH001"].rep, amount: paymentAmount, method: "CASH", receivedAt: daysAgo(0) },
  });
  const fifo = allocateFifo(paymentAmount, kh1Invoices.map((i) => ({ id: i.id, issuedAt: i.issuedAt, outstanding: i.amount })));
  for (const alloc of fifo.allocations) {
    await prisma.paymentAllocation.create({ data: { paymentId: payment.id, invoiceId: alloc.invoiceId, amount: alloc.amount } });
    const inv = kh1Invoices.find((i) => i.id === alloc.invoiceId)!;
    await prisma.invoice.update({
      where: { id: alloc.invoiceId },
      data: { paidAmount: round2(alloc.amount), status: invoiceStatus(inv.amount, alloc.amount, inv.dueDate) },
    });
  }

  // ----- an order for KH004 today (rep Binh) -----
  await prisma.order.create({
    data: {
      code: "ORD-001",
      customerId: customers["KH004"].id,
      repId: customers["KH004"].rep,
      status: "SUBMITTED",
      orderedAt: daysAgo(0),
      subtotal: round2(priceOf.get("SP-COLA-330")! * 200 + priceOf.get("SP-WATER-500")! * 100),
      total: round2(priceOf.get("SP-COLA-330")! * 200 + priceOf.get("SP-WATER-500")! * 100),
      lines: {
        create: [
          { productId: products[0].id, quantity: 200, unitPrice: priceOf.get("SP-COLA-330")!, lineTotal: priceOf.get("SP-COLA-330")! * 200 },
          { productId: products[2].id, quantity: 100, unitPrice: priceOf.get("SP-WATER-500")!, lineTotal: priceOf.get("SP-WATER-500")! * 100 },
        ],
      },
    },
  });

  // ----- visits: some today (coverage), varied GPS -----
  const visitSpecs: { code: string; days: number; gps: "OK" | "OUT_OF_RANGE" | "MISSING"; outcome?: "ORDER" | "NO_ORDER" }[] = [
    { code: "KH001", days: 0, gps: "OK", outcome: "ORDER" },
    { code: "KH003", days: 0, gps: "OUT_OF_RANGE", outcome: "NO_ORDER" },
    { code: "KH004", days: 0, gps: "OK", outcome: "ORDER" },
    { code: "KH006", days: 0, gps: "MISSING", outcome: "NO_ORDER" },
    { code: "KH002", days: 2, gps: "OK", outcome: "ORDER" },
    { code: "KH005", days: 3, gps: "OK", outcome: "NO_ORDER" },
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

  // ----- a debt alert -----
  await prisma.notification.create({
    data: { userId: manager.id, kind: "DEBT_ALERT", title: "Cong no qua han cao", body: "Dai ly Phuong Nam / Sieu thi Anh Tuan qua han 60+." },
  });

  const custCount = await prisma.customer.count();
  console.log(`Seed done: ${reps.length} reps, ${custCount} customers, ${invSeq} invoices.`);
  console.log(`  FIFO PAY-001 (${paymentAmount}) -> ${fifo.allocations.length} alloc, remaining ${fifo.remaining}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
