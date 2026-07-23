import { prisma } from "@/lib/db";
import { ageInvoices } from "@/lib/debt/aging";
import { parseWeekdays } from "@/lib/weekdays";

// plannedWeekdays uses 1=Mon..7=Sun; JS getDay() is 0=Sun..6=Sat.
export function isoWeekday(d: Date = new Date()): number {
  const js = d.getDay();
  return js === 0 ? 7 : js;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function outstandingOf(invoices: { amount: unknown; paidAmount: unknown }[]): number {
  return invoices.reduce(
    (sum, i) => sum + (Number(i.amount) - Number(i.paidAmount)),
    0,
  );
}

// Today's route for this rep only (scope: RepAssignment).
export async function getTodayRoute(repId: string) {
  const wd = isoWeekday();
  const today = new Date();
  const assignments = await prisma.repAssignment.findMany({
    where: { repId },
    include: {
      customer: {
        include: {
          invoices: true,
          visits: {
            where: { repId },
            orderBy: { checkInAt: "desc" },
            take: 1,
          },
        },
      },
    },
    orderBy: { customer: { name: "asc" } },
  });

  const rows = assignments.map((a) => {
    const last = a.customer.visits[0];
    return {
      customerId: a.customerId,
      name: a.customer.name,
      code: a.customer.code,
      address: a.customer.address,
      plannedToday: parseWeekdays(a.plannedWeekdays).includes(wd),
      outstanding: outstandingOf(a.customer.invoices),
      creditLimit: Number(a.customer.creditLimit),
      visitedToday: last ? isSameDay(new Date(last.checkInAt), today) : false,
    };
  });

  // Planned-today customers first, then the rest of this rep's book.
  return rows.sort((x, y) => Number(y.plannedToday) - Number(x.plannedToday));
}

// Full detail for ONE customer, only if it belongs to this rep.
export async function getRepCustomer(repId: string, customerId: string) {
  const assignment = await prisma.repAssignment.findUnique({
    where: { repId_customerId: { repId, customerId } },
  });
  if (!assignment) return null; // not this rep's customer -> scope enforced

  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    include: {
      invoices: { orderBy: { issuedAt: "asc" } },
      orders: {
        where: { repId },
        orderBy: { orderedAt: "desc" },
        take: 5,
        include: { lines: { include: { product: true } } },
      },
      visits: { where: { repId }, orderBy: { checkInAt: "desc" }, take: 5 },
    },
  });
  if (!customer) return null;

  const { rows, summary } = ageInvoices(
    customer.invoices.map((i) => ({
      id: i.id,
      dueDate: new Date(i.dueDate),
      amount: Number(i.amount),
      paidAmount: Number(i.paidAmount),
    })),
  );

  return { customer, aging: { rows, summary }, plannedWeekdays: parseWeekdays(assignment.plannedWeekdays) };
}

// This rep's visit history.
export async function getRepVisits(repId: string, take = 50) {
  return prisma.visit.findMany({
    where: { repId },
    orderBy: { checkInAt: "desc" },
    take,
    include: { customer: true },
  });
}

// One visit, only if it belongs to this rep (scope enforced).
export async function getRepVisit(repId: string, visitId: string) {
  const visit = await prisma.visit.findFirst({
    where: { id: visitId, repId },
    include: { customer: true },
  });
  return visit;
}

// Active products for order taking (base price; a price list could override).
export async function getActiveProducts() {
  const products = await prisma.product.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
  });
  return products.map((p) => ({
    id: p.id,
    sku: p.sku,
    name: p.name,
    unit: p.unit,
    price: Number(p.basePrice),
  }));
}

export async function hasOpenShift(repId: string) {
  const shift = await prisma.shift.findFirst({
    where: { repId, endedAt: null },
    orderBy: { startedAt: "desc" },
  });
  return shift;
}

// Full customer book for this rep, name-sorted (scope: RepAssignment).
export async function getRepCustomers(repId: string) {
  const assignments = await prisma.repAssignment.findMany({
    where: { repId },
    include: { customer: { include: { invoices: true } } },
    orderBy: { customer: { name: "asc" } },
  });
  return assignments.map((a) => ({
    customerId: a.customerId,
    name: a.customer.name,
    code: a.customer.code,
    address: a.customer.address,
    customerType: a.customer.customerType,
    outstanding: outstandingOf(a.customer.invoices),
    creditLimit: Number(a.customer.creditLimit),
  }));
}

// Customers with coordinates for this rep's map (scope: RepAssignment).
export async function getRepMapPoints(repId: string) {
  const today = new Date();
  const assignments = await prisma.repAssignment.findMany({
    where: { repId },
    include: {
      customer: {
        include: {
          invoices: true,
          visits: { where: { repId }, orderBy: { checkInAt: "desc" }, take: 1 },
        },
      },
    },
  });
  return assignments
    .filter((a) => a.customer.latitude != null && a.customer.longitude != null)
    .map((a) => {
      const last = a.customer.visits[0];
      const visitedToday = last ? isSameDay(new Date(last.checkInAt), today) : false;
      const outstanding = outstandingOf(a.customer.invoices);
      const status: "visited" | "debt" | "default" = visitedToday
        ? "visited"
        : outstanding > 0
          ? "debt"
          : "default";
      return {
        id: a.customerId,
        name: a.customer.name,
        code: a.customer.code,
        lat: a.customer.latitude as number,
        lng: a.customer.longitude as number,
        outstanding,
        status,
      };
    });
}

// Today's stats for the rep profile screen.
export async function getRepProfile(repId: string) {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const [assigned, todayVisits, todayOrders, todayPayments, shift] = await Promise.all([
    prisma.repAssignment.count({ where: { repId } }),
    prisma.visit.count({ where: { repId, checkInAt: { gte: start } } }),
    prisma.order.findMany({ where: { repId, orderedAt: { gte: start } }, select: { total: true } }),
    prisma.payment.findMany({ where: { repId, receivedAt: { gte: start } }, select: { amount: true } }),
    prisma.shift.findFirst({ where: { repId, endedAt: null } }),
  ]);
  return {
    assigned,
    todayVisits,
    todayOrders: todayOrders.length,
    todayCollected: todayPayments.reduce((s, p) => s + Number(p.amount), 0),
    onShift: Boolean(shift),
  };
}
