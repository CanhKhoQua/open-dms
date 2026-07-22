export function startOfToday(now: Date = new Date()): Date {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  return d;
}

// plannedWeekdays uses 1=Mon..7=Sun; JS getDay() is 0=Sun..6=Sat.
export function isoWeekday(d: Date = new Date()): number {
  const js = d.getDay();
  return js === 0 ? 7 : js;
}
