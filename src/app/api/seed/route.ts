import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { runSeed } from "@/lib/seed";

// Reseed the demo database. Guarded so it can't wipe a real deployment.
export async function POST() {
  if (process.env.ALLOW_DEMO_SEED !== "true") {
    return NextResponse.json(
      { error: "Seeding disabled. Set ALLOW_DEMO_SEED=true to enable." },
      { status: 403 },
    );
  }
  try {
    const summary = await runSeed(prisma);
    return NextResponse.json({ ok: true, ...summary });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
