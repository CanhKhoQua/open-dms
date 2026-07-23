import { getDebtByCustomer } from "@/lib/manager/queries";
import { formatMoney } from "@/lib/money";
import { DebtTable } from "./_components/DebtTable";

export const dynamic = "force-dynamic";

export default async function ManagerDebtPage() {
  const rows = await getDebtByCustomer();
  const total = rows.reduce((s, r) => s + r.outstanding, 0);
  const overdue = rows.reduce((s, r) => s + r.overdue, 0);
  const overLimit = rows.filter((r) => r.overLimit).length;

  const kpis = [
    { label: "Customers with a balance", value: String(rows.length) },
    { label: "Total outstanding", value: formatMoney(total) },
    { label: "Overdue", value: formatMoney(overdue), accent: "text-amber-700" },
    { label: "Over credit limit", value: String(overLimit), accent: overLimit > 0 ? "text-red-600" : undefined },
  ];

  return (
    <div className="px-6 py-6 max-w-[1100px]">
      <div className="grid gap-3 mb-5 [grid-template-columns:repeat(auto-fit,minmax(160px,1fr))]">
        {kpis.map((k) => (
          <div key={k.label} className="flex flex-col gap-1 rounded-[14px] bg-white border border-gray-100 px-4 py-3.5">
            <span className="text-[11.5px] text-gray-400">{k.label}</span>
            <strong className={`text-[18px] font-bold tracking-tight font-mono ${k.accent ?? "text-gray-900"}`}>
              {k.value}
            </strong>
          </div>
        ))}
      </div>

      <DebtTable rows={rows} />
    </div>
  );
}
