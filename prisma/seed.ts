import { PrismaClient } from "@prisma/client";
import { runSeed } from "../src/lib/seed";

const prisma = new PrismaClient();

runSeed(prisma)
  .then((s) =>
    console.log(
      `Seed done: ${s.reps} reps, ${s.customers} customers, ${s.products} products, ${s.orders} orders, ${s.invoices} invoices, ${s.payments} payments, ${s.visits} visits.`,
    ),
  )
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
