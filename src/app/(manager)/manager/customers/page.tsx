import Link from "next/link";
import { getAllCustomers } from "@/lib/manager/queries";
import { formatMoney } from "@/lib/money";

export const dynamic = "force-dynamic";

const TYPE_LABELS: Record<string, string> = {
  RETAIL: "Retail",
  WHOLESALE: "Wholesale",
  KEY_ACCOUNT: "Key account",
};

const THL = "font-medium text-gray-400 text-[11px] uppercase tracking-wide px-3 py-2 border-b border-gray-100 text-left";
const THR = "font-medium text-gray-400 text-[11px] uppercase tracking-wide px-3 py-2 border-b border-gray-100 text-right";
const TD = "px-3 py-2.5 border-b border-gray-100 text-gray-800";
const TDR = "px-3 py-2.5 border-b border-gray-100 text-gray-800 text-right font-mono";

export default async function ManagerCustomersPage() {
  const rows = await getAllCustomers();

  return (
    <div className="px-6 py-6 max-w-[1100px]">
      <p className="text-[13px] text-gray-500 mb-4">{rows.length} active customers</p>
      <div className="rounded-[14px] bg-white border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px] border-collapse">
            <thead>
              <tr>
                <th className={THL}>Customer</th>
                <th className={THL}>Type</th>
                <th className={THL}>Rep</th>
                <th className={THR}>Outstanding</th>
                <th className={THR}>Limit</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id}>
                  <td className={TD}>
                    <Link href={`/manager/customers/${c.id}`} className="font-medium text-gray-900 hover:text-tnm-teal-700 hover:underline">
                      {c.name}
                    </Link>{" "}
                    <span className="text-gray-400 text-[12px]">{c.code}</span>
                  </td>
                  <td className={TD}>{c.customerType ? (TYPE_LABELS[c.customerType] ?? c.customerType) : "—"}</td>
                  <td className={TD}>{c.repName ?? "—"}</td>
                  <td className={TDR}>{formatMoney(c.outstanding)}</td>
                  <td className={TDR}>{formatMoney(c.creditLimit)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {rows.length === 0 && <p className="text-[13px] text-gray-400 px-4 py-8 text-center">No customers.</p>}
      </div>
    </div>
  );
}
