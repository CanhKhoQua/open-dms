"use client";

import dynamic from "next/dynamic";
import type { MapPoint } from "./CustomerMap";

const CustomerMap = dynamic(() => import("./CustomerMap").then((m) => m.CustomerMap), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center text-[13px] text-gray-400">
      Loading map…
    </div>
  ),
});

export function MapPanel({ points, hrefBase }: { points: MapPoint[]; hrefBase?: string }) {
  return <CustomerMap points={points} hrefBase={hrefBase} />;
}

export function MapLegend() {
  const items = [
    { c: "#0e9a9a", label: "To visit" },
    { c: "#059669", label: "Visited today" },
    { c: "#d97706", label: "Has balance" },
  ];
  return (
    <div className="flex items-center gap-4 px-4 py-2 text-[12px] text-gray-500 bg-white border-b border-gray-100">
      {items.map((i) => (
        <span key={i.label} className="inline-flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: i.c }} />
          {i.label}
        </span>
      ))}
    </div>
  );
}
