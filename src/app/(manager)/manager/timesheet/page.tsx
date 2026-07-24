import { getTimesheet } from "@/lib/manager/queries";

export const dynamic = "force-dynamic";

const THL = "font-medium text-gray-400 text-[11px] uppercase tracking-wide px-3 py-2 border-b border-gray-100 text-left sticky left-0 bg-white z-10";
const THC = "font-medium text-gray-400 text-[11px] px-2 py-2 border-b border-gray-100 text-center";
const THR = "font-medium text-gray-400 text-[11px] uppercase tracking-wide px-3 py-2 border-b border-gray-100 text-right";

export default async function ManagerTimesheetPage() {
  const { columns, rows, days } = await getTimesheet(14);

  return (
    <div className="px-6 py-6 max-w-[1200px]">
      <p className="text-[13px] text-gray-500 mb-4">Shift attendance · last {days} days · {rows.length} reps</p>
      <div className="rounded-[14px] bg-white border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px] border-collapse">
            <thead>
              <tr>
                <th className={THL}>Rep</th>
                {columns.map((c) => (
                  <th key={c.key} className={`${THC} ${c.isSunday ? "text-gray-300" : ""}`}>
                    <div>{c.dow}</div>
                    <div className="text-gray-400 font-normal">{c.day}</div>
                  </th>
                ))}
                <th className={THR}>Days</th>
                <th className={THR}>Hours</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.repId}>
                  <td className="px-3 py-2.5 border-b border-gray-100 font-medium text-gray-900 sticky left-0 bg-white z-10 whitespace-nowrap">
                    {r.name}
                  </td>
                  {r.cells.map((cell) => (
                    <td key={cell.key} className="px-2 py-2.5 border-b border-gray-100 text-center">
                      {cell.active ? (
                        <span className="inline-flex items-center justify-center w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="On duty" />
                      ) : cell.worked ? (
                        <span
                          className="inline-block text-[11px] font-mono tabular-nums px-1.5 py-0.5 rounded"
                          style={{
                            backgroundColor: cell.hours >= 8 ? "#ecfdf5" : "#fffbeb",
                            color: cell.hours >= 8 ? "#047857" : "#B4791E",
                          }}
                        >
                          {cell.hours}
                        </span>
                      ) : (
                        <span className="text-gray-200">–</span>
                      )}
                    </td>
                  ))}
                  <td className="px-3 py-2.5 border-b border-gray-100 text-right font-mono tabular-nums text-gray-800">{r.daysWorked}</td>
                  <td className="px-3 py-2.5 border-b border-gray-100 text-right font-mono tabular-nums font-semibold text-gray-900">{r.totalHours}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {rows.length === 0 && <p className="text-[13px] text-gray-400 px-4 py-8 text-center">No reps.</p>}
      </div>
      <div className="flex items-center gap-4 mt-3 text-[11px] text-gray-400">
        <span className="inline-flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500" /> On duty now</span>
        <span className="inline-flex items-center gap-1.5"><span className="w-3 h-3 rounded" style={{ backgroundColor: "#ecfdf5" }} /> Full day (≥8h)</span>
        <span className="inline-flex items-center gap-1.5"><span className="w-3 h-3 rounded" style={{ backgroundColor: "#fffbeb" }} /> Partial</span>
        <span className="inline-flex items-center gap-1.5"><span className="text-gray-300">–</span> Absent</span>
      </div>
    </div>
  );
}
