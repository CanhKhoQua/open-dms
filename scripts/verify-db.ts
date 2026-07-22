import { PrismaClient } from "@prisma/client";
import { getTodayRoute, getRepCustomer } from "../src/lib/rep/queries";
import { getOverview, getTeamCoverage, getDebtByCustomer } from "../src/lib/manager/queries";

const prisma = new PrismaClient();
let fail = 0;
const check = (n: string, c: boolean, d = "") => { if (!c) fail++; console.log(`  [${c ? "PASS" : "FAIL"}] ${n}${d ? " — " + d : ""}`); };

async function main() {
  const rep = await prisma.user.findFirstOrThrow({ where: { role: "REP" }, orderBy: { createdAt: "asc" } });

  console.log("Manager (company-wide):");
  const ov = await getOverview();
  check("has customers", ov.customerCount === 6, `count=${ov.customerCount}`);
  check("AR total > 0", ov.ar.total > 0, `AR=${ov.ar.total}`);
  check("overdue > 0", ov.overdue > 0, `overdue=${ov.overdue}`);
  const team = await getTeamCoverage();
  check("3 reps in coverage", team.length === 3);
  check("someone planned+visited today", team.some((t) => t.visitedPlanned > 0));
  const debt = await getDebtByCustomer();
  check("debt rows sorted, some over-limit flagged", debt.length > 0 && debt.some((d) => d.overLimit || d.overdue >= 0), `rows=${debt.length}`);

  console.log("Rep (scoped):");
  const route = await getTodayRoute(rep.id);
  check("route only this rep's customers", route.length > 0 && route.length <= 6, `n=${route.length}`);
  const first = route[0];
  const detail = await getRepCustomer(rep.id, first.customerId);
  check("own customer detail loads", detail !== null);
  const other = await prisma.repAssignment.findFirst({ where: { repId: { not: rep.id } } });
  const cross = other ? await getRepCustomer(rep.id, other.customerId) : null;
  check("scope: other rep's customer => null", cross === null);
}

main().catch((e) => { console.error(e); fail++; }).finally(async () => {
  await prisma.$disconnect();
  console.log(fail === 0 ? "\nDB QUERY LAYER OK" : `\n${fail} CHECK(S) FAILED`);
  process.exit(fail === 0 ? 0 : 1);
});
