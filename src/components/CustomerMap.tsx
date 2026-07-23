"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
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

function pinIcon(status: MapPoint["status"]) {
  const c = COLOR[status];
  return L.divIcon({
    className: "odms-pin",
    html: `<span style="display:block;width:18px;height:18px;border-radius:50% 50% 50% 0;background:${c};border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.4);transform:rotate(-45deg)"></span>`,
    iconSize: [18, 18],
    iconAnchor: [9, 18],
    popupAnchor: [0, -16],
  });
}

export function CustomerMap({ points, hrefBase }: { points: MapPoint[]; hrefBase?: string }) {
  const center: [number, number] = points.length ? [points[0].lat, points[0].lng] : [10.78, 106.7];
  const bounds = points.length
    ? L.latLngBounds(points.map((p) => [p.lat, p.lng] as [number, number]))
    : undefined;

  return (
    <MapContainer center={center} zoom={12} bounds={bounds} scrollWheelZoom style={{ height: "100%", width: "100%" }}>
      <TileLayer
        attribution="&copy; OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {points.map((p) => (
        <Marker key={p.id} position={[p.lat, p.lng]} icon={pinIcon(p.status)}>
          <Popup>
            <div style={{ minWidth: 160 }}>
              <div style={{ fontWeight: 600 }}>{p.name}</div>
              <div style={{ color: "#6b7280", fontSize: 12 }}>
                {p.code}
                {p.repName ? ` · ${p.repName}` : ""}
              </div>
              {p.outstanding > 0 && (
                <div style={{ color: "#b45309", fontSize: 12, marginTop: 2 }}>
                  Outstanding {formatMoney(p.outstanding)}
                </div>
              )}
              {hrefBase && (
                <a href={`${hrefBase}/${p.id}`} style={{ color: "#0e9a9a", fontSize: 12 }}>
                  Open →
                </a>
              )}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
