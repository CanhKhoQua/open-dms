"use client";

import { useRef, useState } from "react";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Crosshair, X } from "lucide-react";
import { formatMoney } from "@/lib/money";

export type MapPoint = {
  id: string;
  name: string;
  code: string;
  lat: number;
  lng: number;
  status: "visited" | "debt" | "default";
  outstanding: number;
  repName?: string | null;
};

const COLOR: Record<MapPoint["status"], string> = {
  visited: "#059669",
  debt: "#d97706",
  default: "#0e9a9a",
};

const STATUS_LABEL: Record<MapPoint["status"], string> = {
  visited: "Visited today",
  debt: "Has balance",
  default: "To visit",
};

function pinIcon(status: MapPoint["status"], selected: boolean) {
  const c = COLOR[status];
  const pulse = status === "debt"; // draw attention to customers with a balance
  const size = selected ? 24 : 18;
  const off = (26 - size) / 2;
  const shadow = selected ? "var(--shadow-marker-active)" : "var(--shadow-marker)";
  return L.divIcon({
    className: "odms-pin",
    html: `<div style="position:relative;width:26px;height:26px">
      ${pulse ? `<span class="rep-marker-pulse" style="inset:1px;background:${c}"></span>` : ""}
      ${selected ? `<span style="position:absolute;inset:-2px;border-radius:50%;border:2px solid ${c};opacity:.5"></span>` : ""}
      <span style="position:absolute;left:${off}px;top:${off - 2}px;display:block;width:${size}px;height:${size}px;border-radius:50% 50% 50% 0;background:${c};border:2px solid #fff;box-shadow:${shadow};transform:rotate(-45deg)"></span>
    </div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 24],
  });
}

export function CustomerMap({ points, hrefBase }: { points: MapPoint[]; hrefBase?: string }) {
  const mapRef = useRef<L.Map | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = points.find((p) => p.id === selectedId) ?? null;

  const center: [number, number] = points.length ? [points[0].lat, points[0].lng] : [10.78, 106.7];
  const bounds = points.length
    ? L.latLngBounds(points.map((p) => [p.lat, p.lng] as [number, number]))
    : undefined;

  const recenter = () => {
    if (mapRef.current && bounds) mapRef.current.fitBounds(bounds, { padding: [40, 40] });
  };

  return (
    <div className="relative h-full w-full">
      <MapContainer
        ref={mapRef}
        center={center}
        zoom={12}
        bounds={bounds}
        scrollWheelZoom
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {points.map((p) => (
          <Marker
            key={p.id}
            position={[p.lat, p.lng]}
            icon={pinIcon(p.status, p.id === selectedId)}
            eventHandlers={{
              click: () => {
                setSelectedId(p.id);
                mapRef.current?.panTo([p.lat, p.lng]);
              },
            }}
          />
        ))}
      </MapContainer>

      <button
        onClick={recenter}
        className="absolute top-3 right-3 z-[1000] inline-flex items-center gap-1.5 rounded-[10px] bg-white/95 backdrop-blur border border-gray-200 px-3 py-2 text-[12px] font-semibold text-gray-700 shadow-sm hover:bg-white"
        aria-label="Recenter map"
      >
        <Crosshair size={14} aria-hidden="true" /> Recenter
      </button>

      {selected && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[1000] w-[min(340px,calc(100%-2rem))] rounded-[14px] bg-white border border-gray-100 shadow-lg p-4 animate-modal-panel">
          <button
            onClick={() => setSelectedId(null)}
            className="absolute top-2.5 right-2.5 text-gray-300 hover:text-gray-500"
            aria-label="Close"
          >
            <X size={16} />
          </button>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: COLOR[selected.status] }} />
            <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
              {STATUS_LABEL[selected.status]}
            </span>
          </div>
          <h3 className="text-[15px] font-bold text-gray-900 mt-1.5 pr-5">{selected.name}</h3>
          <p className="text-[12px] text-gray-400 font-mono mt-0.5">
            {selected.code}
            {selected.repName ? ` · ${selected.repName}` : ""}
          </p>
          {selected.outstanding > 0 && (
            <p className="text-[13px] font-mono font-semibold text-amber-700 mt-2">
              Outstanding {formatMoney(selected.outstanding)}
            </p>
          )}
          {hrefBase && (
            <a
              href={`${hrefBase}/${selected.id}`}
              className="mt-3 inline-flex items-center justify-center w-full py-2.5 rounded-[10px] bg-tnm-teal-600 text-white text-[13px] font-bold hover:bg-tnm-teal-700 transition-colors"
            >
              Open customer →
            </a>
          )}
        </div>
      )}
    </div>
  );
}
