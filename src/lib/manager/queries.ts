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

// ---------- Phase 2: performance / coverage / today ----------

const MS_DAY = 24 * 60 * 60 * 1000;

// Per-rep KPIs over a rolling window (default 30 days).
export async function getRepPerformance(days = 30) {
  const since = new Date(Date.now() - days * MS_DAY);
  const [reps, assignments, visits, orders, payments] = await Promise.all([
    prisma.user.findMany({ where: { role: "REP" }, orderBy: { name: "asc" } }),
    prisma.repAssignment.findMany({ select: { repId: true } }),
    prisma.visit.findMany({ where: { checkInAt: { gte: since } }, select: { repId: true, customerId: true, gpsStatus: true } }),
    prisma.order.findMany({ where: { orderedAt: { gte: since } }, select: { repId: true, total: true } }),
    prisma.payment.findMany({ where: { receivedAt: { gte: since } }, select: { repId: true, amount: true } }),
  ]);
  const assignedBy = new Map<string, number>();
  for (const a of assignments) assignedBy.set(a.repId, (assignedBy.get(a.repId) ?? 0) + 1);

  return reps.map((rep) => {
    const myVisits = visits.filter((v) => v.repId === rep.id);
    const myOrders = orders.filter((o) => o.repId === rep.id);
    const gpsOk = myVisits.filter((v) => v.gpsStatus === "OK").length;
    return {
      repId: rep.id,
      name: rep.name,
      assigned: assignedBy.get(rep.id) ?? 0,
      visits: myVisits.length,
      uniqueCustomers: new Set(myVisits.map((v) => v.customerId)).size,
      gpsRate: myVisits.length ? Math.round((gpsOk / myVisits.length) * 100) : 0,
      orders: myOrders.length,
      orderValue: myOrders.reduce((s, o) => s + Number(o.total), 0),
      collected: payments.filter((p) => p.repId === rep.id).reduce((s, p) => s + Number(p.amount), 0),
    };
  });
}

// Territory coverage: how many assigned customers each rep actually reached
// (>=1 visit) within the window.
export async function getCoverage(days = 30) {
  const since = new Date(Date.now() - days * MS_DAY);
  const [reps, assignments, visits] = await Promise.all([
    prisma.user.findMany({ where: { role: "REP" }, orderBy: { name: "asc" } }),
    prisma.repAssignment.findMany({ select: { repId: true, customerId: true } }),
    prisma.visit.findMany({ where: { checkInAt: { gte: since } }, select: { repId: true, customerId: true } }),
  ]);
  const rows = reps.map((rep) => {
    const mine = assignments.filter((a) => a.repId === rep.id);
    const visited = new Set(visits.filter((v) => v.repId === rep.id).map((v) => v.customerId));
    const covered = mine.filter((a) => visited.has(a.customerId)).length;
    return {
      repId: rep.id,
      name: rep.name,
      assigned: mine.length,
      covered,
      uncovered: mine.length - covered,
      coveragePct: mine.length ? Math.round((covered / mine.length) * 100) : 0,
    };
  });
  const totalAssigned = rows.reduce((s, r) => s + r.assigned, 0);
  const totalCovered = rows.reduce((s, r) => s + r.covered, 0);
  const overallPct = totalAssigned ? Math.round((totalCovered / totalAssigned) * 100) : 0;
  return { rows, totalAssigned, totalCovered, overallPct, days };
}

export type TodayEvent = {
  id: string;
  kind: "visit" | "order" | "payment";
  at: Date;
  rep: string;
  customer: string;
  label: string;
  amount: number | null;
};

// Live-ish activity feed for the current day (polled, not streamed).
export async function getTodayActivity() {
  const today = startOfToday();
  const [visits, orders, payments, shifts] = await Promise.all([
    prisma.visit.findMany({ where: { checkInAt: { gte: today } }, orderBy: { checkInAt: "desc" }, include: { customer: true, rep: true }, take: 40 }),
    prisma.order.findMany({ where: { orderedAt: { gte: today } }, orderBy: { orderedAt: "desc" }, include: { customer: true, rep: true }, take: 40 }),
    prisma.payment.findMany({ where: { receivedAt: { gte: today } }, orderBy: { receivedAt: "desc" }, include: { customer: true, rep: true }, take: 40 }),
    prisma.shift.findMany({ where: { startedAt: { gte: today }, endedAt: null }, include: { rep: true } }),
  ]);
  const events: TodayEvent[] = [
    ...visits.map((v) => ({ id: `v${v.id}`, kind: "visit" as const, at: v.checkInAt, rep: v.rep.name, customer: v.customer.name, label: v.outcome ?? v.gpsStatus, amount: null })),
    ...orders.map((o) => ({ id: `o${o.id}`, kind: "order" as const, at: o.orderedAt, rep: o.rep.name, customer: o.customer.name, label: o.code, amount: Number(o.total) })),
    ...payments.map((p) => ({ id: `p${p.id}`, kind: "payment" as const, at: p.receivedAt, rep: p.rep?.name ?? "—", customer: p.customer.name, label: "Payment", amount: Number(p.amount) })),
  ].sort((a, b) => b.at.getTime() - a.at.getTime());

  return {
    onDuty: shifts.map((s) => ({ repId: s.repId, name: s.rep.name, startedAt: s.startedAt })),
    visitCount: visits.length,
    orderCount: orders.length,
    orderValue: orders.reduce((s, o) => s + Number(o.total), 0),
    collected: payments.reduce((s, p) => s + Number(p.amount), 0),
    events: events.slice(0, 50),
  };
}

// Attendance matrix: shifts per rep across the last `days` calendar days.
export async function getTimesheet(days = 14) {
  const dayKey = (d: Date) => new Date(d).toLocaleDateString("en-CA"); // local YYYY-MM-DD
  const today = startOfToday();
  const start = new Date(today.getTime() - (days - 1) * MS_DAY);

  const [reps, shifts] = await Promise.all([
    prisma.user.findMany({ where: { role: "REP" }, orderBy: { name: "asc" } }),
    prisma.shift.findMany({ where: { startedAt: { gte: start } }, select: { repId: true, startedAt: true, endedAt: true } }),
  ]);

  const columns = Array.from({ length: days }, (_, i) => {
    const d = new Date(start.getTime() + i * MS_DAY);
    return {
      key: dayKey(d),
      dow: new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(d),
      day: d.getDate(),
      isSunday: d.getDay() === 0,
    };
  });

  const rows = reps.map((rep) => {
    const cells = columns.map((col) => {
      const dayShifts = shifts.filter((s) => s.repId === rep.id && dayKey(s.startedAt) === col.key);
      if (dayShifts.length === 0) return { key: col.key, worked: false, hours: 0, active: false };
      const active = dayShifts.some((s) => !s.endedAt);
      const hours = dayShifts.reduce((h, s) => {
        const end = s.endedAt ? s.endedAt.getTime() : Date.now();
        return h + Math.max(0, end - s.startedAt.getTime()) / 3_600_000;
      }, 0);
      return { key: col.key, worked: true, hours: Math.round(hours * 10) / 10, active };
    });
    return {
      repId: rep.id,
      name: rep.name,
      cells,
      daysWorked: cells.filter((c) => c.worked).length,
      totalHours: Math.round(cells.reduce((h, c) => h + c.hours, 0) * 10) / 10,
    };
  });

  return { columns, rows, days };
}

// Manager's flagged customers, with the stats that make them worth watching.
export async function getWatchlist() {
  const watched = await prisma.watchedCustomer.findMany({
    orderBy: { createdAt: "asc" },
    include: {
      customer: {
        include: {
          invoices: { where: { status: { notIn: ["PAID", "VOID"] } }, select: { id: true, dueDate: true, amount: true, paidAmount: true } },
          visits: { orderBy: { checkInAt: "desc" }, take: 1, select: { checkInAt: true } },
        },
      },
    },
  });
  const now = Date.now();
  return watched.map((w) => {
    const c = w.customer;
    const { summary } = ageInvoices(toAgingInput(c.invoices));
    const creditLimit = Number(c.creditLimit);
    const lastVisit = c.visits[0]?.checkInAt ?? null;
    return {
      id: w.id,
      customerId: c.id,
      code: c.code,
      name: c.name,
      tier: c.tier,
      reason: w.reason,
      outstanding: summary.total,
      overdue: summary.d1_30 + summary.d31_60 + summary.d60_plus,
      overLimit: creditLimit > 0 && summary.total > creditLimit,
      lastVisit,
      daysSince: lastVisit ? Math.floor((now - new Date(lastVisit).getTime()) / MS_DAY) : null,
    };
  });
}

// Visit-cadence policy + which customers are due/overdue against their tier rule.
export async function getCadence() {
  const [rules, customers] = await Promise.all([
    prisma.cadenceRule.findMany({ orderBy: { intervalDays: "asc" } }),
    prisma.customer.findMany({
      where: { active: true },
      select: { id: true, code: true, name: true, tier: true, visits: { orderBy: { checkInAt: "desc" }, take: 1, select: { checkInAt: true } } },
    }),
  ]);
  const ruleByTier = new Map(rules.map((r) => [r.tier, r.intervalDays]));
  const now = Date.now();
  const perTier: Record<string, { total: number; due: number }> = {};
  const dueList: { code: string; name: string; tier: string; daysSince: number | null; interval: number; over: number }[] = [];

  for (const c of customers) {
    const tier = c.tier ?? "C";
    const interval = ruleByTier.get(tier) ?? 14;
    perTier[tier] ||= { total: 0, due: 0 };
    perTier[tier].total += 1;
    const last = c.visits[0]?.checkInAt ?? null;
    const daysSince = last ? Math.floor((now - new Date(last).getTime()) / MS_DAY) : null;
    if (daysSince == null || daysSince > interval) {
      perTier[tier].due += 1;
      dueList.push({ code: c.code, name: c.name, tier, daysSince, interval, over: daysSince == null ? 9999 : daysSince - interval });
    }
  }
  dueList.sort((a, b) => b.over - a.over);

  return {
    rules: rules.map((r) => ({
      tier: r.tier,
      intervalDays: r.intervalDays,
      label: r.label,
      total: perTier[r.tier]?.total ?? 0,
      due: perTier[r.tier]?.due ?? 0,
    })),
    dueList: dueList.slice(0, 40),
    dueTotal: dueList.length,
  };
}

// ---------- Phase 3: dashboard depth ----------

// Month-to-date hero KPIs with run-rate projection and year-over-year (SPLY).
export async function getDashboardHero() {
  const now = new Date();
  const startMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const daysInMonth = Math.round((startNextMonth.getTime() - startMonth.getTime()) / MS_DAY);
  const dayOfMonth = now.getDate();
  // same period last year: 1st .. same day-of-month, previous year
  const splyStart = new Date(now.getFullYear() - 1, now.getMonth(), 1);
  const splyEnd = new Date(now.getFullYear() - 1, now.getMonth(), dayOfMonth, 23, 59, 59);

  const [mtdOrders, splyOrders] = await Promise.all([
    prisma.order.findMany({ where: { orderedAt: { gte: startMonth } }, select: { total: true } }),
    prisma.order.findMany({ where: { orderedAt: { gte: splyStart, lte: splyEnd } }, select: { total: true } }),
  ]);

  const mtdRevenue = mtdOrders.reduce((s, o) => s + Number(o.total), 0);
  const runRate = dayOfMonth > 0 ? mtdRevenue / dayOfMonth : 0;
  const splyRevenue = splyOrders.reduce((s, o) => s + Number(o.total), 0);
  return {
    mtdRevenue,
    mtdCount: mtdOrders.length,
    runRate,
    projected: runRate * daysInMonth,
    splyRevenue,
    yoyPct: splyRevenue > 0 ? Math.round(((mtdRevenue - splyRevenue) / splyRevenue) * 100) : null,
    dayOfMonth,
    daysInMonth,
  };
}

const weekLabel = (start: Date, i: number) =>
  new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date(start.getTime() + i * 7 * MS_DAY));
const weekIndex = (orderedAt: Date, start: Date) =>
  Math.floor((startOfToday(new Date(orderedAt)).getTime() - start.getTime()) / (7 * MS_DAY));

// Weekly order value for the last N weeks + 3-week moving average.
export async function getVolumeSeries(weeks = 12) {
  const start = new Date(startOfToday().getTime() - (weeks * 7 - 1) * MS_DAY);
  const orders = await prisma.order.findMany({ where: { orderedAt: { gte: start } }, select: { orderedAt: true, total: true } });
  const values = Array.from({ length: weeks }, () => 0);
  for (const o of orders) {
    const idx = weekIndex(o.orderedAt, start);
    if (idx >= 0 && idx < weeks) values[idx] += Number(o.total);
  }
  return values.map((value, i) => ({
    key: `w${i}`,
    label: weekLabel(start, i),
    value,
    ma: Math.round((value + (values[i - 1] ?? value) + (values[i - 2] ?? value)) / 3),
  }));
}

// Distinct ordering customers per week, last N weeks.
export async function getActiveCustomersSeries(weeks = 12) {
  const start = new Date(startOfToday().getTime() - (weeks * 7 - 1) * MS_DAY);
  const orders = await prisma.order.findMany({ where: { orderedAt: { gte: start } }, select: { orderedAt: true, customerId: true } });
  const sets = Array.from({ length: weeks }, () => new Set<string>());
  for (const o of orders) {
    const idx = weekIndex(o.orderedAt, start);
    if (idx >= 0 && idx < weeks) sets[idx].add(o.customerId);
  }
  return sets.map((s, i) => ({ key: `w${i}`, label: weekLabel(start, i), count: s.size }));
}

// Revenue share by product over the last N days.
export async function getProductMix(days = 90) {
  const since = new Date(Date.now() - days * MS_DAY);
  const lines = await prisma.orderLine.findMany({
    where: { order: { orderedAt: { gte: since } } },
    select: { lineTotal: true, product: { select: { name: true } } },
  });
  const byProduct = new Map<string, number>();
  for (const l of lines) byProduct.set(l.product.name, (byProduct.get(l.product.name) ?? 0) + Number(l.lineTotal));
  const total = [...byProduct.values()].reduce((s, v) => s + v, 0);
  const rows = [...byProduct.entries()]
    .map(([name, value]) => ({ name, value, pct: total > 0 ? Math.round((value / total) * 100) : 0 }))
    .sort((a, b) => b.value - a.value);
  return { rows, total };
}
