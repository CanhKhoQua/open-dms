import { getCurrentRep } from "@/lib/session";
import { getRepMapPoints } from "@/lib/rep/queries";
import { MapPanel, MapLegend } from "@/components/MapPanel";

export const dynamic = "force-dynamic";

export default async function RepMapPage() {
  const rep = await getCurrentRep();
  const points = await getRepMapPoints(rep.id);
  return (
    <div className="flex flex-col h-[calc(100dvh-56px)]">
      <MapLegend />
      <div className="flex-1 min-h-0">
        <MapPanel points={points} hrefBase="/rep/customers" />
      </div>
    </div>
  );
}
