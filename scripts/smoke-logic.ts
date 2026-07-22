import { allocateFifo } from "../src/lib/debt/fifo";
import { ageInvoices, bucketFor } from "../src/lib/debt/aging";
import { haversineMeters, gpsStatusFor } from "../src/lib/geo";

let failures = 0;
function assert(name: string, cond: boolean, detail = "") {
  const mark = cond ? "PASS" : "FAIL";
  if (!cond) failures += 1;
  console.log(`  [${mark}] ${name}${detail ? " — " + detail : ""}`);
}

const d = (daysAgo: number) => new Date(Date.now() - daysAgo * 86400000);

console.log("FIFO allocation:");
{
  const invs = [
    { id: "A", issuedAt: d(75), outstanding: 10_000_000 },
    { id: "B", issuedAt: d(20), outstanding: 5_000_000 },
  ];
  const r1 = allocateFifo(6_000_000, invs);
  assert("partial hits oldest first", r1.allocations.length === 1 && r1.allocations[0].invoiceId === "A" && r1.allocations[0].amount === 6_000_000, JSON.stringify(r1.allocations));
  assert("no remainder when underpaid", r1.remaining === 0);

  const r2 = allocateFifo(12_000_000, invs);
  assert("spills to second invoice", r2.allocations.length === 2 && r2.allocations[1].amount === 2_000_000, JSON.stringify(r2.allocations));

  const r3 = allocateFifo(20_000_000, invs);
  assert("overpay leaves credit remainder", r3.remaining === 5_000_000, `remaining=${r3.remaining}`);
}

console.log("Aging buckets:");
{
  assert("0 days = current", bucketFor(0) === "current");
  assert("15 days = 1-30", bucketFor(15) === "d1_30");
  assert("45 days = 31-60", bucketFor(45) === "d31_60");
  assert("90 days = 60+", bucketFor(90) === "d60_plus");

  const { summary } = ageInvoices([
    { id: "1", dueDate: d(45), amount: 10_000_000, paidAmount: 6_000_000 }, // 4M in 31-60
    { id: "2", dueDate: d(-10), amount: 5_000_000, paidAmount: 0 }, // due in future = current
    { id: "3", dueDate: d(70), amount: 3_000_000, paidAmount: 3_000_000 }, // fully paid -> skipped
  ]);
  assert("31-60 outstanding correct", summary.d31_60 === 4_000_000, `d31_60=${summary.d31_60}`);
  assert("current correct", summary.current === 5_000_000, `current=${summary.current}`);
  assert("paid invoice excluded", summary.total === 9_000_000, `total=${summary.total}`);
}

console.log("Geo / GPS status:");
{
  const p = { latitude: 10.7769, longitude: 106.7009 };
  assert("same point ~0m", haversineMeters(p, p) < 1);
  const near = haversineMeters(p, { latitude: p.latitude + 0.0005, longitude: p.longitude });
  assert("~0.0005deg lat ~55m", near > 40 && near < 70, `${Math.round(near)}m`);
  const far = haversineMeters(p, { latitude: p.latitude + 0.01, longitude: p.longitude });
  assert("~0.01deg lat > 200m", far > 200, `${Math.round(far)}m`);
  assert("in range = OK", gpsStatusFor(near) === "OK");
  assert("far = OUT_OF_RANGE", gpsStatusFor(far) === "OUT_OF_RANGE");
  assert("null = MISSING", gpsStatusFor(null) === "MISSING");
}

console.log(failures === 0 ? "\nALL LOGIC TESTS PASSED" : `\n${failures} TEST(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
