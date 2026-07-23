"use client";

import { useState, useTransition } from "react";
import { MapPin } from "lucide-react";
import { checkIn } from "../actions";

export function CheckInButton({ customerId }: { customerId: string }) {
  const [pending, startT] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  function doCheckIn(lat: number | null, lng: number | null) {
    startT(async () => {
      const res = await checkIn({ customerId, latitude: lat, longitude: lng });
      const label =
        res.gpsStatus === "OK"
          ? "in range"
          : res.gpsStatus === "OUT_OF_RANGE"
            ? `out of range (${res.distanceM}m)`
            : "no GPS location";
      setMsg(`Checked in — ${label}.`);
    });
  }

  function onClick() {
    setMsg(null);
    if (!("geolocation" in navigator)) {
      doCheckIn(null, null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => doCheckIn(pos.coords.latitude, pos.coords.longitude),
      () => doCheckIn(null, null),
      { enableHighAccuracy: true, timeout: 8000 },
    );
  }

  return (
    <div>
      <button
        className="inline-flex items-center justify-center gap-2 rounded-[10px] bg-tnm-teal-600 px-4 py-2.5 text-[13.5px] font-bold text-white active:bg-tnm-teal-700 disabled:opacity-60"
        disabled={pending}
        onClick={onClick}
      >
        <MapPin size={16} aria-hidden="true" />
        {pending ? "Checking in…" : "Check in (GPS)"}
      </button>
      {msg && <p className="text-[12.5px] text-tnm-teal-700 mt-2">{msg}</p>}
    </div>
  );
}
