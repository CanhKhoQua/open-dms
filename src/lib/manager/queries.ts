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
