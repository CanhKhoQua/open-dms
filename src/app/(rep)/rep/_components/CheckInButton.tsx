"use client";

import { useState, useTransition } from "react";
import { checkIn } from "../actions";

export function CheckInButton({ customerId }: { customerId: string }) {
  const [pending, startT] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  function doCheckIn(lat: number | null, lng: number | null) {
    startT(async () => {
      const res = await checkIn({ customerId, latitude: lat, longitude: lng });
      const label =
        res.gpsStatus === "OK"
          ? "trong bán kính"
          : res.gpsStatus === "OUT_OF_RANGE"
            ? `ngoài bán kính (${res.distanceM}m)`
            : "không có GPS";
      setMsg(`Đã check-in — ${label}.`);
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
      <button className="btn primary" disabled={pending} onClick={onClick}>
        {pending ? "Đang check-in..." : "Check-in GPS"}
      </button>
      {msg && <p className="hint">{msg}</p>}
    </div>
  );
}
