import type { PrismaClient } from "@prisma/client";
import { allocateFifo } from "@/lib/debt/fifo";
import { serializeWeekdays } from "@/lib/weekdays";

// Rich, deterministic demo dataset for a HCMC cement / building-materials (VLXD)
// distributor: ~50 customers across districts, cement brands priced in VND, and
// ~130 days of orders, invoices (varied aging), payments, and GPS visits — enough
// to fill the dashboard charts, the receivables table, and the customer map.
// A seeded PRNG keeps every reseed byte-identical.

const DAY = 24 * 60 * 60 * 1000;
const round0 = (n: number) => Math.round(n);

// mulberry32 — tiny deterministic PRNG so reseeds are reproducible.
function makeRng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export async function runSeed(prisma: PrismaClient) {
  const rng = makeRng(20260723);
  const now = new Date();
  const daysAgo = (n: number) => new Date(now.getTime() - n * DAY);
  const pick = <T>(arr: T[]) => arr[Math.floor(rng() * arr.length)];
  const int = (lo: number, hi: number) => lo + Math.floor(rng() * (hi - lo + 1));
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

  // ---------- people ----------
  await prisma.user.create({ data: { email: "admin@open-dms.local", name: "Quản trị hệ thống", role: "ADMIN" } });
  const manager = await prisma.user.create({ data: { email: "manager@open-dms.local", name: "Đặng Quốc Việt", role: "MANAGER" } });
  const reps = [];
  for (const r of [
    { email: "an@open-dms.local", name: "Nguyễn Văn An" },
    { email: "binh@open-dms.local", name: "Trần Thị Bình" },
    { email: "cuong@open-dms.local", name: "Lê Hoàng Cường" },
    { email: "dung@open-dms.local", name: "Phạm Minh Dũng" },
    { email: "hanh@open-dms.local", name: "Võ Thị Hạnh" },
  ]) {
    reps.push(await prisma.user.create({ data: { ...r, role: "REP" } }));
  }

  // ---------- products (cement, priced in VND) ----------
  const productSpecs = [
    { sku: "XM-HT-PCB40", name: "Hà Tiên PCB40 (bao 50kg)", category: "Xi măng bao", unit: "bao", basePrice: 92000, stockQty: 12000 },
    { sku: "XM-HT-PC40", name: "Hà Tiên PC40 (bao 50kg)", category: "Xi măng bao", unit: "bao", basePrice: 98000, stockQty: 8000 },
    { sku: "XM-INSEE-PCB40", name: "INSEE Power-S PCB40 (bao 50kg)", category: "Xi măng bao", unit: "bao", basePrice: 95000, stockQty: 9000 },
    { sku: "XM-NGHISON-PCB40", name: "Nghi Sơn PCB40 (bao 50kg)", category: "Xi măng bao", unit: "bao", basePrice: 90000, stockQty: 7000 },
    { sku: "XM-VICEM-MC25", name: "Vicem Hà Tiên Đa Dụng MC25 (bao 50kg)", category: "Xi măng bao", unit: "bao", basePrice: 88000, stockQty: 6000 },
    { sku: "XM-HT-BULK", name: "Hà Tiên PCB40 rời (tấn)", category: "Xi măng rời", unit: "tấn", basePrice: 1650000, stockQty: 400 },
    { sku: "XM-INSEE-BULK", name: "INSEE PCB40 rời (tấn)", category: "Xi măng rời", unit: "tấn", basePrice: 1720000, stockQty: 350 },
  ];
  const products = [];
  for (const p of productSpecs) products.push(await prisma.product.create({ data: p }));

  const priceList = await prisma.priceList.create({ data: { name: "Bảng giá chuẩn 2026" } });
  await prisma.priceListItem.createMany({
    data: products.map((p, i) => ({ priceListId: priceList.id, productId: p.id, price: productSpecs[i].basePrice })),
  });

  // ---------- customers: ~52 across HCMC districts ----------
  const districts: { name: string; lat: number; lng: number }[] = [
    { name: "Quận 1", lat: 10.7769, lng: 106.7009 },
    { name: "Quận 3", lat: 10.7841, lng: 106.68 },
    { name: "Quận 4", lat: 10.7578, lng: 106.705 },
    { name: "Quận 5", lat: 10.754, lng: 106.6634 },
    { name: "Quận 6", lat: 10.746, lng: 106.635 },
    { name: "Quận 7", lat: 10.734, lng: 106.7215 },
    { name: "Quận 8", lat: 10.724, lng: 106.6286 },
    { name: "Quận 10", lat: 10.7729, lng: 106.6674 },
    { name: "Quận 11", lat: 10.7629, lng: 106.643 },
    { name: "Quận 12", lat: 10.8672, lng: 106.6413 },
    { name: "Bình Thạnh", lat: 10.8106, lng: 106.7091 },
    { name: "Gò Vấp", lat: 10.8386, lng: 106.6656 },
    { name: "Phú Nhuận", lat: 10.7955, lng: 106.68 },
    { name: "Tân Bình", lat: 10.8014, lng: 106.6526 },
    { name: "Tân Phú", lat: 10.791, lng: 106.628 },
    { name: "Bình Tân", lat: 10.765, lng: 106.603 },
    { name: "TP Thủ Đức", lat: 10.85, lng: 106.754 },
    { name: "Nhà Bè", lat: 10.696, lng: 106.708 },
    { name: "Hóc Môn", lat: 10.887, lng: 106.593 },
    { name: "Bình Chánh", lat: 10.73, lng: 106.576 },
  ];
  const prefixes = ["VLXD", "Cửa hàng VLXD", "DNTN VLXD", "Cửa hàng Xi măng", "Đại lý VLXD", "Công ty TNHH XD"];
  const owners = [
    "Thành Công", "Minh Phát", "Đại Phát", "Hưng Thịnh", "Phú Cường", "Tấn Lộc", "An Khang", "Kim Long",
    "Vạn Phát", "Tài Lộc", "Đông Á", "Sài Gòn", "Thiên Phú", "Bảo Ngọc", "Hoàng Gia", "Nhật Minh",
    "Trường Sơn", "Đại Việt", "Song Long", "Thái Bình", "Gia Bảo", "Anh Tú", "Quốc Cường", "Tân Tiến",
    "Hồng Phát", "Đức Trọng", "Lâm Phát", "Vĩnh Xuân", "Phúc Thịnh", "Nam Long", "Hiệp Phát", "Tân Thành",
    "Bình Minh", "Phát Đạt", "Toàn Thắng", "Đại Lộc", "Kim Phát", "Ngọc Hân", "Thanh Bình", "Hải Đăng",
    "Phú Quý", "Minh Long", "Đại Tín", "Trọng Nghĩa", "Vinh Quang", "Tân Phú Cường", "Hoà Bình", "Mỹ Phát",
    "Cát Tường", "Thành Đạt", "Phương Nam", "Đông Dương",
  ];
  const typeByTier: Record<string, string> = { A: "KEY_ACCOUNT", B: "WHOLESALE", C: "WHOLESALE", D: "RETAIL" };
  const limitByTier: Record<string, [number, number]> = {
    A: [500_000_000, 1_000_000_000],
    B: [200_000_000, 500_000_000],
    C: [80_000_000, 200_000_000],
    D: [30_000_000, 80_000_000],
  };
  const tagPool = ["VIP", "Dự án", "Tiềm năng", "Thanh toán tốt", "Nợ xấu", "Khách mới", "Đại lý cấp 1"];

  type Cust = { id: string; lat: number; lng: number; repId: string; tier: string };
  const customers: Cust[] = [];
  for (let i = 0; i < owners.length; i++) {
    const d = districts[i % districts.length];
    const tier = ["A", "B", "B", "C", "C", "C", "D", "D"][i % 8];
    const [lo, hi] = limitByTier[tier];
    const limit = round0((lo + rng() * (hi - lo)) / 1_000_000) * 1_000_000;
    const repId = reps[i % reps.length].id;
    const tags = new Set<string>();
    if (tier === "A") tags.add("VIP");
    if (rng() < 0.35) tags.add(pick(tagPool));
    if (rng() < 0.15) tags.add(pick(tagPool));
    const created = await prisma.customer.create({
      data: {
        code: `KH${String(i + 1).padStart(4, "0")}`,
        name: `${prefixes[i % prefixes.length]} ${owners[i]}`,
        customerType: typeByTier[tier],
        tier,
        tags: [...tags].join(","),
        phone: `09${int(10, 89)}${int(100000, 999999)}`,
        address: `${int(1, 400)} đường số ${int(1, 40)}, ${d.name}, TP.HCM`,
        latitude: d.lat + (rng() - 0.5) * 0.02,
        longitude: d.lng + (rng() - 0.5) * 0.02,
        creditLimit: limit,
      },
    });
    customers.push({ id: created.id, lat: created.latitude!, lng: created.longitude!, repId, tier });
    const wdChoices = [[1, 3, 5], [2, 4, 6], [1, 4], [2, 5], [3, 6], [1, 2, 3, 4, 5]];
    await prisma.repAssignment.create({
      data: { repId, customerId: created.id, plannedWeekdays: serializeWeekdays(pick(wdChoices)) },
    });
  }

  // ---------- orders over ~130 days -> invoices ----------
  let ordSeq = 0;
  let invSeq = 0;
  // per-customer open invoices, oldest-first, for FIFO payment allocation later
  const openByCust: Record<string, { id: string; issuedAt: Date; amount: number }[]> = {};
  let orderCount = 0;
  let invoiceCount = 0;

  for (const c of customers) {
    const orders = int(2, 8);
    for (let o = 0; o < orders; o++) {
      const ago = int(0, 130);
      const orderedAt = daysAgo(ago);
      const lineN = int(1, 3);
      const usedSku = new Set<number>();
      const lines: { productId: string; quantity: number; unitPrice: number; lineTotal: number }[] = [];
      for (let l = 0; l < lineN; l++) {
        let pi = int(0, productSpecs.length - 1);
        while (usedSku.has(pi)) pi = int(0, productSpecs.length - 1);
        usedSku.add(pi);
        const spec = productSpecs[pi];
        const qty = spec.unit === "tấn" ? int(2, 30) : int(20, 400);
        const lineTotal = spec.basePrice * qty;
        lines.push({ productId: products[pi].id, quantity: qty, unitPrice: spec.basePrice, lineTotal });
      }
      const subtotal = lines.reduce((s, x) => s + x.lineTotal, 0);
      const discount = rng() < 0.25 ? round0((subtotal * int(2, 5)) / 100) : 0;
      const total = subtotal - discount;
      // recent orders still in pipeline; older ones delivered/confirmed
      const status = ago <= 2 ? "SUBMITTED" : ago <= 5 ? "CONFIRMED" : "DELIVERED";
      ordSeq += 1;
      const order = await prisma.order.create({
        data: {
          code: `ORD-${String(ordSeq).padStart(4, "0")}`,
          customerId: c.id,
          repId: c.repId,
          status,
          orderedAt,
          subtotal,
          discount,
          total,
          lines: { create: lines },
        },
      });
      orderCount += 1;

      // confirmed/delivered orders bill the customer (net 30)
      if (status === "CONFIRMED" || status === "DELIVERED") {
        invSeq += 1;
        const dueDate = new Date(orderedAt.getTime() + 30 * DAY);
        const inv = await prisma.invoice.create({
          data: {
            code: `INV-${String(invSeq).padStart(4, "0")}`,
            customerId: c.id,
            orderId: order.id,
            issuedAt: orderedAt,
            dueDate,
            amount: total,
            status: dueDate.getTime() < now.getTime() ? "OVERDUE" : "OPEN",
          },
        });
        invoiceCount += 1;
        (openByCust[c.id] ||= []).push({ id: inv.id, issuedAt: orderedAt, amount: total });
      }
    }
  }

  // ---------- payments (FIFO) -> varied aging ----------
  let paySeq = 0;
  let paymentCount = 0;
  for (const c of customers) {
    const invs = openByCust[c.id];
    if (!invs || invs.length === 0) continue;
    // "Nợ xấu"-ish D-tier customers pay less; VIPs pay most of it down
    const payRatio = c.tier === "A" ? 0.75 + rng() * 0.25 : c.tier === "D" ? rng() * 0.5 : 0.4 + rng() * 0.45;
    if (payRatio < 0.08) continue;
    const totalOpen = invs.reduce((s, i) => s + i.amount, 0);
    const payAmount = round0((totalOpen * payRatio) / 1000) * 1000;
    if (payAmount <= 0) continue;
    paySeq += 1;
    const payment = await prisma.payment.create({
      data: {
        code: `PAY-${String(paySeq).padStart(4, "0")}`,
        customerId: c.id,
        repId: c.repId,
        amount: payAmount,
        method: pick(["CASH", "BANK_TRANSFER", "E_WALLET"] as const),
        receivedAt: daysAgo(int(0, 20)),
      },
    });
    paymentCount += 1;
    const fifo = allocateFifo(payAmount, invs.map((i) => ({ id: i.id, issuedAt: i.issuedAt, outstanding: i.amount })));
    for (const alloc of fifo.allocations) {
      await prisma.paymentAllocation.create({ data: { paymentId: payment.id, invoiceId: alloc.invoiceId, amount: alloc.amount } });
      const inv = invs.find((i) => i.id === alloc.invoiceId)!;
      const due = new Date(inv.issuedAt.getTime() + 30 * DAY);
      await prisma.invoice.update({
        where: { id: alloc.invoiceId },
        data: { paidAmount: alloc.amount, status: invoiceStatus(inv.amount, alloc.amount, due) },
      });
    }
  }

  // ---------- visits over ~50 days ----------
  let visitCount = 0;
  const gpsChoices: ("OK" | "OK" | "OUT_OF_RANGE" | "MISSING")[] = ["OK", "OK", "OUT_OF_RANGE", "MISSING"];
  const notes = ["Đặt hàng bổ sung xi măng.", "Chủ quán bận, hẹn lại.", "Kiểm tra tồn kho, ổn.", "Khách hỏi công nợ.", "Giao hàng đúng hẹn.", ""];
  for (const c of customers) {
    const n = int(1, 4);
    for (let v = 0; v < n; v++) {
      const gps = pick(gpsChoices);
      const jitter = gps === "OUT_OF_RANGE" ? 0.012 : 0.0006;
      const outcome = pick(["ORDER", "ORDER", "NO_ORDER", "REVISIT"] as const);
      await prisma.visit.create({
        data: {
          repId: c.repId,
          customerId: c.id,
          checkInAt: daysAgo(int(0, 50)),
          latitude: gps === "MISSING" ? null : c.lat + (rng() - 0.5) * jitter,
          longitude: gps === "MISSING" ? null : c.lng + (rng() - 0.5) * jitter,
          gpsStatus: gps,
          outcome,
          note: pick(notes) || null,
        },
      });
      visitCount += 1;
    }
  }

  // ---------- shifts (attendance matrix over ~20 days) ----------
  for (let ri = 0; ri < reps.length; ri++) {
    for (let d = 20; d >= 0; d--) {
      const day = daysAgo(d);
      if (day.getDay() === 0) continue; // no Sunday work
      if (rng() < 0.15) continue; // ~15% absence
      if (d === 0 && ri < 3) {
        // still on duty today (open shift)
        await prisma.shift.create({ data: { repId: reps[ri].id, startedAt: new Date(now.getTime() - int(1, 5) * 60 * 60 * 1000) } });
        continue;
      }
      const start = new Date(day);
      start.setHours(7, int(30, 59), 0, 0);
      const hours = 7.5 + rng() * 2;
      await prisma.shift.create({
        data: { repId: reps[ri].id, startedAt: start, endedAt: new Date(start.getTime() + hours * 3600000) },
      });
    }
  }

  // ---------- notifications ----------
  await prisma.notification.create({
    data: { userId: manager.id, kind: "DEBT_ALERT", title: "Công nợ quá hạn tăng", body: "Nhiều khách đã quá hạn 60+ ngày, cần nhắc thu hồi." },
  });
  await prisma.notification.create({
    data: { userId: manager.id, kind: "ORDER_UPDATE", title: "Đơn hàng mới trong ngày", body: "Có đơn mới chờ xác nhận từ các tuyến." },
  });
  for (const rep of reps) {
    await prisma.notification.create({
      data: { userId: rep.id, kind: "VISIT_REMINDER", title: "Tuyến hôm nay đã sẵn sàng", body: "Bạn có các khách cần ghé thăm hôm nay." },
    });
  }
  await prisma.notification.create({
    data: { userId: reps[1].id, kind: "DEBT_ALERT", title: "Khách vượt hạn mức", body: "Một khách trong tuyến đã vượt hạn mức tín dụng." },
  });

  return {
    reps: reps.length,
    customers: customers.length,
    products: products.length,
    orders: orderCount,
    invoices: invoiceCount,
    payments: paymentCount,
    visits: visitCount,
  };
}
