// Rewrites the Prisma datasource provider from DATABASE_PROVIDER (default sqlite).
// Local dev needs nothing (sqlite). On Vercel/Neon set DATABASE_PROVIDER=postgresql.
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const provider = (process.env.DATABASE_PROVIDER || "sqlite").toLowerCase();
const allowed = ["sqlite", "postgresql"];
if (!allowed.includes(provider)) {
  console.error(`Unknown DATABASE_PROVIDER "${provider}". Use: ${allowed.join(", ")}`);
  process.exit(1);
}
const schemaPath = join(dirname(fileURLToPath(import.meta.url)), "..", "prisma", "schema.prisma");
const src = readFileSync(schemaPath, "utf8");
const next = src.replace(/provider = "(sqlite|postgresql)"/, `provider = "${provider}"`);
if (next !== src) writeFileSync(schemaPath, next);
console.log(`Prisma datasource provider = ${provider}`);
