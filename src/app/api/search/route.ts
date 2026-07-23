import { NextResponse } from "next/server";
import { searchAll } from "@/lib/manager/queries";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get("q") ?? "";
  const results = await searchAll(q);
  return NextResponse.json(results);
}
