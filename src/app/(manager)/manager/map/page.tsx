import { getAllMapPoints } from "@/lib/manager/queries";
import { MapPanel, MapLegend } from "@/components/MapPanel";

export const dynamic = "force-dynamic";

export default async function ManagerMapPage() {
  const points = await getAllMapPoints();
  return (
    <div className="flex flex-col h-[calc(100vh-60px)]">
      <MapLegend />
      <div className="flex-1 min-h-0">
        <MapPanel points={points} hrefBase="/manager/customers" />
      </div>
    </div>
  );
}
