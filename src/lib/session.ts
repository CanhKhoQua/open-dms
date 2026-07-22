import { prisma } from "./db";

// NO AUTH YET (public skeleton). "Current user" resolves to a seeded user by role.
// Replace these with real authentication later — they are the single seam the
// rest of the app depends on, so nothing else changes when auth arrives.
export async function getCurrentRep() {
  const rep = await prisma.user.findFirst({
    where: { role: "REP", active: true },
    orderBy: { createdAt: "asc" },
  });
  if (!rep) throw new Error("No REP user found. Run `npm run seed` first.");
  return rep;
}

export async function getCurrentManager() {
  const mgr = await prisma.user.findFirst({
    where: { role: { in: ["MANAGER", "ADMIN"] }, active: true },
    orderBy: { createdAt: "asc" },
  });
  if (!mgr) throw new Error("No MANAGER user found. Run `npm run seed` first.");
  return mgr;
}
