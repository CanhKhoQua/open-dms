import { prisma } from "@/lib/db";
import { ageInvoices, type AgingSummary } from "@/lib/debt/aging";
import { startOfToday, isoWeekday } from "@/lib/date";
import { parseWeekdays } from "@/lib/weekdays";

// Manager scope = company-wide. No repId filter (opposite of the rep app).

function toAgingInput(invoices: { id: string; dueDate: Date; amount: unknown; paidAmount: unknown }[]) {
  return invoices.map((i) => ({
    id: i.id,
    dueDate: new Date(i.dueDate),
    amount: Number(i.amount),
    paidAmount: Number(i.paidAmount),
  }));
}

export async function getOverview() {
  const today = startOfToday();
  const [customerCount, repCount, invoices, todayVisits, todayOrders, todayPayments] =
    await Promise.all([
      prisma.customer.count({ where: { active: true } }),
      prisma.user.count({ where: { role: "REP", active: true } }),
      prisma.invoice.findMany({
        where: { status: { notIn: ["PAID", "VOID"] } },
        select: { id: true, dueDate: true, amount: true, paidAmount: true },
      }),
      prisma.visit.count({ where: { checkInAt: { gte: today } } }),
      prisma.order.findMany({
        where: { orderedAt: { gte: today } },
        select: { total: true },
      }),
      prisma.payment.findMany({
        where: { receivedAt: { gte: today } },
        select: { amount: true },
      }),
    ]);

  const { summary } = ageInvoices(toAgingInput(invoices));
  const overdue = summary.d1_30 + summary.d31_60 + summary.d60_plus;

  return {
    customerCount,
    repCount,
    ar: summary as AgingSummary,
    overdue,
    todayVisits,
    todayOrderCount: todayOrders.length,
    todayOrderValue: todayOrders.reduce((s, o) => s + Number(o.total), 0),
    todayCollected: todayPayments.reduce((s, p) => s + Number(p.amount), 0),
  };
}

export async function getTeamCoverage() {
  const today = startOfToday();
  const wd = isoWeekday();

  const [reps, assignments, visits, orders, payments] = await Promise.all([
    prisma.user.findMany({ where: { role: "REP" }, orderBy: { name: "asc" } }),
    prisma.repAssignment.findMany({ select: { repId: true, customerId: true, plannedWeekdays: true } }),
    prisma.visit.findMany({ where: { checkInAt: { gte: today } }, select: { repId: true, customerId: true } }),
    prisma.order.findMany({ where: { orderedAt: { gte: today } }, select: { repId: true, total: true } }),
    prisma.payment.findMany({ where: { receivedAt: { gte: today } }, select: { repId: true, amount: true } }),
  ]);

  return reps.map((rep) => {
    const mine = assignments.filter((a) => a.repId === rep.id);
    const plannedToday = mine.filter((a) => parseWeekdays(a.plannedWeekdays).includes(wd));
    const visitedCustomers = new Set(
      visits.filter((v) => v.repId === rep.id).map((v) => v.customerId),
    );
    const plannedVisited = plannedToday.filter((a) => visitedCustomers.has(a.customerId));
    return {
      repId: rep.id,
      name: rep.name,
      assigned: mine.length,
      plannedToday: plannedToday.length,
      visitedPlanned: plannedVisited.length,
      ordersToday: orders.filter((o) => o.repId === rep.id).length,
      collectedToday: payments
        .filter((p) => p.repId === rep.id)
        .reduce((s, p) => s + Number(p.amount), 0),
    };
  });
}

export async function getDebtByCustomer() {
  const customers = await prisma.customer.findMany({
    where: { active: true },
    include: {
      invoices: {
        where: { status: { notIn: ["PAID", "VOID"] } },
        select: { id: true, dueDate: true, amount: true, paidAmount: true },
      },
    },
  });

  const rows = customers.map((c) => {
    const { summary } = ageInvoices(toAgingInput(c.invoices));
    const overdue = summary.d1_30 + summary.d31_60 + summary.d60_plus;
    const creditLimit = Number(c.creditLimit);
    return {
      customerId: c.id,
      code: c.code,
      name: c.name,
      outstanding: summary.total,
      overdue,
      buckets: summary,
      creditLimit,
      overLimit: creditLimit > 0 && summary.total > creditLimit,
    };
  });

  return rows
    .filter((r) => r.outstanding > 0)
    .sort((a, b) => b.overdue - a.overdue || b.outstanding - a.outstanding);
}

export async function getAllRecentVisits(take = 50) {
  return prisma.visit.findMany({
    orderBy: { checkInAt: "desc" },
    take,
    include: { customer: true, rep: true },
  });
}

// All customers with coordinates, company-wide, for the manager map.
export async function getAllMapPoints() {
  const today = startOfToday();
  const customers = await prisma.customer.findMany({
    where: { active: true },
    include: {
      invoices: { where: { status: { notIn: ["PAID", "VOID"] } }, select: { amount: true, paidAmount: true } },
      visits: { where: { checkInAt: { gte: today } }, select: { id: true }, take: 1 },
      assignments: { include: { rep: true }, take: 1 },
    },
  });
  return customers
    .filter((c) => c.latitude != null && c.longitude != null)
    .map((c) => {
      const outstanding = c.invoices.reduce((s, i) => s + (Number(i.amount) - Number(i.paidAmount)), 0);
      const visitedToday = c.visits.length > 0;
      const status: "visited" | "debt" | "default" = visitedToday
        ? "visited"
        : outstanding > 0
          ? "debt"
          : "default";
      return {
        id: c.id,
        name: c.name,
        code: c.code,
        lat: c.latitude as number,
        lng: c.longitude as number,
        outstanding,
        status,
        repName: c.assignments[0]?.rep.name,
      };
    });
}

// Company-wide customer directory.
export async function getAllCustomers() {
  const customers = await prisma.customer.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
    include: {
      invoices: { where: { status: { notIn: ["PAID", "VOID"] } }, select: { amount: true, paidAmount: true } },
      assignments: { include: { rep: true }, take: 1 },
    },
  });
  return customers.map((c) => ({
    id: c.id,
    code: c.code,
    name: c.name,
    customerType: c.customerType,
    tier: c.tier,
    tags: c.tags,
    phone: c.phone,
    address: c.address,
    creditLimit: Number(c.creditLimit),
    outstanding: c.invoices.reduce((s, i) => s + (Number(i.amount) - Number(i.paidAmount)), 0),
    repName: c.assignments[0]?.rep.name ?? null,
  }));
}

// Rep directory (accounts + assignment counts).
export async function getRepDirectory() {
  const reps = await prisma.user.findMany({
    where: { role: "REP" },
    orderBy: { name: "asc" },
    include: { _count: { select: { assignments: true } } },
  });
  return reps.map((r) => ({
    id: r.id,
    name: r.name,
    email: r.email,
    active: r.active,
    assigned: r._count.assignments,
  }));
}

// Daily order value vs. collected for the last `days` days (dashboard trend).
export async function getSalesTrend(days = 14) {
  const start = startOfToday();
  start.setDate(start.getDate() - (days - 1));

  const [orders, payments] = await Promise.all([
    prisma.order.findMany({ where: { orderedAt: { gte: start } }, select: { orderedAt: true, total: true } }),
    prisma.payment.findMany({ where: { receivedAt: { gte: start } }, select: { receivedAt: true, amount: true } }),
  ]);

  const fmt = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" });
  const buckets: { key: string; label: string; orders: number; collected: number }[] = [];
  const index = new Map<string, number>();
  for (let i = 0; i < days; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    index.set(key, buckets.length);
    buckets.push({ key, label: fmt.format(d), orders: 0, collected: 0 });
  }
  const keyOf = (d: Date) => {
    const local = new Date(d);
    local.setHours(0, 0, 0, 0);
    return local.toISOString().slice(0, 10);
  };
  for (const o of orders) {
    const i = index.get(keyOf(new Date(o.orderedAt)));
    if (i != null) buckets[i].orders += Number(o.total);
  }
  for (const p of payments) {
    const i = index.get(keyOf(new Date(p.receivedAt)));
    if (i != null) buckets[i].collected += Number(p.amount);
  }
  return buckets;
}

// One customer, company-wide (manager scope): aging, orders, visits, owning rep.
export async function getManagerCustomer(customerId: string) {
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    include: {
      invoices: { orderBy: { issuedAt: "asc" } },
      orders: { orderBy: { orderedAt: "desc" }, take: 8, include: { rep: true } },
      visits: { orderBy: { checkInAt: "desc" }, take: 8, include: { rep: true } },
      assignments: { include: { rep: true }, take: 1 },
    },
  });
  if (!customer) return null;

  const { rows, summary } = ageInvoices(toAgingInput(customer.invoices));
  const overdue = summary.d1_30 + summary.d31_60 + summary.d60_plus;
  const creditLimit = Number(customer.creditLimit);

  return {
    customer,
    rep: customer.assignments[0]?.rep ?? null,
    aging: { rows, summary },
    overdue,
    creditLimit,
    overLimit: creditLimit > 0 && summary.total > creditLimit,
  };
}

// Company-wide fuzzy search over customers and reps (for the ⌘K palette).
export async function searchAll(query: string) {
  const q = query.trim();
  if (!q) return { customers: [], reps: [] };
  const [customers, reps] = await Promise.all([
    prisma.customer.findMany({
      where: {
        active: true,
        OR: [{ name: { contains: q } }, { code: { contains: q } }],
      },
      orderBy: { name: "asc" },
      take: 6,
      select: { id: true, name: true, code: true, customerType: true },
    }),
    prisma.user.findMany({
      where: {
        role: "REP",
        OR: [{ name: { contains: q } }, { email: { contains: q } }],
      },
      orderBy: { name: "asc" },
      take: 4,
      select: { id: true, name: true, email: true },
    }),
  ]);
  return { customers, reps };
}

// One rep: assigned customers, recent visits, recent orders.
export async function getRepDetail(repId: string) {
  const rep = await prisma.user.findUnique({ where: { id: repId } });
  if (!rep) return null;
  const [assignments, recentVisits, recentOrders] = await Promise.all([
    prisma.repAssignment.findMany({ where: { repId }, include: { customer: true }, orderBy: { customer: { name: "asc" } } }),
    prisma.visit.findMany({ where: { repId }, orderBy: { checkInAt: "desc" }, take: 10, include: { customer: true } }),
    prisma.order.findMany({ where: { repId }, orderBy: { orderedAt: "desc" }, take: 10, include: { customer: true } }),
  ]);
  return { rep, customers: assignments.map((a) => a.customer), recentVisits, recentOrders };
}
