"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";

type Item = {
  id: string;
  kind: string;
  title: string;
  body: string | null;
  readAt: string | null;
  createdAt: string;
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function NotificationsBell({ initialUnread = 0 }: { initialUnread?: number }) {
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(initialUnread);
  const [items, setItems] = useState<Item[] | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    let alive = true;
    fetch("/api/notifications")
      .then((r) => r.json())
      .then((d) => {
        if (!alive) return;
        setItems(d.items ?? []);
        setUnread(d.unread ?? 0);
      })
      .catch(() => alive && setItems([]));
    return () => {
      alive = false;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative w-9 h-9 rounded-[10px] flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors"
        aria-label="Notifications"
      >
        <Bell size={18} strokeWidth={1.8} />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-tnm-red-500 text-white text-[9px] font-bold inline-flex items-center justify-center">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 z-50 w-[320px] rounded-[14px] bg-white border border-gray-100 shadow-lg overflow-hidden animate-modal-panel">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <span className="text-[13px] font-semibold text-gray-900">Notifications</span>
            {unread > 0 && (
              <span className="text-[11px] font-semibold text-tnm-teal-600">{unread} unread</span>
            )}
          </div>
          <div className="max-h-[360px] overflow-y-auto">
            {items === null && (
              <div className="px-4 py-6 text-center text-[12.5px] text-gray-400">Loading…</div>
            )}
            {items?.length === 0 && (
              <div className="px-4 py-6 text-center text-[12.5px] text-gray-400">You&rsquo;re all caught up.</div>
            )}
            {items?.map((n) => (
              <div key={n.id} className={`flex gap-3 px-4 py-3 border-b border-gray-50 ${n.readAt ? "" : "bg-tnm-teal-50/40"}`}>
                <span
                  className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ background: n.readAt ? "#d1d5db" : "var(--tnm-teal-600)" }}
                  aria-hidden="true"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-[12.5px] font-semibold text-gray-900">{n.title}</p>
                  {n.body && <p className="text-[11.5px] text-gray-500 mt-0.5 leading-snug">{n.body}</p>}
                  <p className="text-[10.5px] text-gray-400 mt-1 font-mono">{timeAgo(n.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
          <Link
            href="/manager/notifications"
            onClick={() => setOpen(false)}
            className="block text-center px-4 py-2.5 text-[12px] font-semibold text-tnm-teal-600 hover:bg-gray-50 border-t border-gray-100"
          >
            View all
          </Link>
        </div>
      )}
    </div>
  );
}
