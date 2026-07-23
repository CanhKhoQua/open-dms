"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import { Search, Building2, UserCog, CornerDownLeft } from "lucide-react";

type Customer = { id: string; name: string; code: string; customerType: string | null };
type Rep = { id: string; name: string; email: string };
type Results = { customers: Customer[]; reps: Rep[] };

const EMPTY: Results = { customers: [], reps: [] };

export function GlobalSearch() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [res, setRes] = useState<Results>(EMPTY);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // ⌘K / Ctrl+K toggles the palette.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 20);
    else {
      setQ("");
      setRes(EMPTY);
    }
  }, [open]);

  // Debounced fetch.
  useEffect(() => {
    if (!open) return;
    const term = q.trim();
    if (!term) {
      setRes(EMPTY);
      setLoading(false);
      return;
    }
    setLoading(true);
    const t = setTimeout(() => {
      fetch(`/api/search?q=${encodeURIComponent(term)}`)
        .then((r) => r.json())
        .then((d: Results) => setRes({ customers: d.customers ?? [], reps: d.reps ?? [] }))
        .catch(() => setRes(EMPTY))
        .finally(() => setLoading(false));
    }, 200);
    return () => clearTimeout(t);
  }, [q, open]);

  const go = (href: string) => {
    setOpen(false);
    router.push(href as Route);
  };

  const flat: { href: string; label: string; sub: string; kind: "customer" | "rep" }[] = [
    ...res.customers.map((c) => ({ href: `/manager/customers/${c.id}`, label: c.name, sub: c.code, kind: "customer" as const })),
    ...res.reps.map((r) => ({ href: `/manager/reps/${r.id}`, label: r.name, sub: r.email, kind: "rep" as const })),
  ];

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="hidden sm:flex items-center gap-2 rounded-[10px] border border-gray-200 bg-gray-50 px-3 py-1.5 text-[12.5px] text-gray-400 hover:bg-gray-100 transition-colors w-[200px]"
      >
        <Search size={14} aria-hidden="true" />
        <span className="flex-1 text-left">Search…</span>
        <kbd className="text-[10px] font-mono font-semibold bg-white border border-gray-200 rounded px-1.5 py-0.5 text-gray-400">⌘K</kbd>
      </button>
      <button
        onClick={() => setOpen(true)}
        className="sm:hidden w-9 h-9 rounded-[10px] flex items-center justify-center text-gray-500 hover:bg-gray-100"
        aria-label="Search"
      >
        <Search size={18} strokeWidth={1.8} />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-start justify-center pt-[12vh] px-4 bg-black/30 animate-modal-backdrop"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-[520px] rounded-[16px] bg-white shadow-2xl overflow-hidden animate-modal-panel"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 px-4 border-b border-gray-100">
              <Search size={17} className="text-gray-400 shrink-0" aria-hidden="true" />
              <input
                ref={inputRef}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search customers and reps…"
                className="flex-1 py-3.5 text-[14px] text-gray-900 placeholder:text-gray-400 focus:outline-none"
              />
              <kbd className="text-[10px] font-mono font-semibold bg-gray-50 border border-gray-200 rounded px-1.5 py-0.5 text-gray-400">esc</kbd>
            </div>

            <div className="max-h-[52vh] overflow-y-auto py-2">
              {q.trim() && loading && (
                <p className="px-4 py-6 text-center text-[12.5px] text-gray-400">Searching…</p>
              )}
              {q.trim() && !loading && flat.length === 0 && (
                <p className="px-4 py-6 text-center text-[12.5px] text-gray-400">No results for “{q.trim()}”.</p>
              )}
              {!q.trim() && (
                <p className="px-4 py-6 text-center text-[12.5px] text-gray-400">Type to search customers and reps.</p>
              )}

              {res.customers.length > 0 && (
                <div className="px-2">
                  <p className="px-2 pt-1 pb-1.5 text-[10.5px] font-semibold uppercase tracking-wide text-gray-400">Customers</p>
                  {res.customers.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => go(`/manager/customers/${c.id}`)}
                      className="flex items-center gap-3 w-full px-2 py-2 rounded-lg hover:bg-gray-50 text-left"
                    >
                      <span className="w-7 h-7 rounded-[8px] bg-tnm-teal-50 flex items-center justify-center shrink-0">
                        <Building2 size={15} className="text-tnm-teal-600" aria-hidden="true" />
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className="text-[13px] font-medium text-gray-900 block truncate">{c.name}</span>
                        <span className="text-[11.5px] text-gray-400 font-mono">{c.code}</span>
                      </span>
                      <CornerDownLeft size={13} className="text-gray-300 shrink-0" aria-hidden="true" />
                    </button>
                  ))}
                </div>
              )}

              {res.reps.length > 0 && (
                <div className="px-2 mt-1">
                  <p className="px-2 pt-1 pb-1.5 text-[10.5px] font-semibold uppercase tracking-wide text-gray-400">Reps</p>
                  {res.reps.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => go(`/manager/reps/${r.id}`)}
                      className="flex items-center gap-3 w-full px-2 py-2 rounded-lg hover:bg-gray-50 text-left"
                    >
                      <span className="w-7 h-7 rounded-[8px] bg-blue-50 flex items-center justify-center shrink-0">
                        <UserCog size={15} className="text-blue-600" aria-hidden="true" />
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className="text-[13px] font-medium text-gray-900 block truncate">{r.name}</span>
                        <span className="text-[11.5px] text-gray-400">{r.email}</span>
                      </span>
                      <CornerDownLeft size={13} className="text-gray-300 shrink-0" aria-hidden="true" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
