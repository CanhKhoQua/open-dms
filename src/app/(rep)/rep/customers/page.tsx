import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { getCurrentRep } from "@/lib/session";
import { getRepCustomers } from "@/lib/rep/queries";
import { formatMoney } from "@/lib/money";

export const dynamic = "force-dynamic";

const TYPE_LABELS: Record<string, string> = {
  RETAIL: "Retail",
  WHOLESALE: "Wholesale",
  KEY_ACCOUNT: "Key account",
};

export default async function RepCustomersPage() {
  const rep = await getCurrentRep();
  const customers = await getRepCustomers(rep.id);

  return (
    <main className="px-5 pt-6 pb-6">
      <header>
        <h1 className="text-[22px] font-bold tracking-tight text-gray-900">Customers</h1>
        <p className="text-[13px] text-gray-500 mt-0.5">
          {customers.length} in your book
        </p>
      </header>

      <section className="mt-5 flex flex-col gap-2">
        {customers.map((c) => (
          <Link
            key={c.customerId}
            href={`/rep/customers/${c.customerId}`}
            className="flex items-center gap-3 rounded-[14px] bg-white border border-gray-100 px-4 py-3 active:bg-gray-50 transition-colors"
          >
            <div className="flex-1 min-w-0">
              <span className="text-[14px] font-semibold text-gray-900 truncate block">
                {c.name}
              </span>
              <span className="text-[12px] text-gray-400 mt-0.5 truncate block">
                {c.code}
                {c.customerType ? ` · ${TYPE_LABELS[c.customerType] ?? c.customerType}` : ""}
              </span>
            </div>
            {c.outstanding > 0 && (
              <span className="text-[12px] font-mono font-semibold text-amber-700 shrink-0">
                {formatMoney(c.outstanding)}
              </span>
            )}
            <ChevronRight size={18} className="text-gray-300 shrink-0" aria-hidden="true" />
          </Link>
        ))}
        {customers.length === 0 && (
          <p className="text-[13px] text-gray-400 py-8 text-center">
            No customers assigned yet.
          </p>
        )}
      </section>
    </main>
  );
}
