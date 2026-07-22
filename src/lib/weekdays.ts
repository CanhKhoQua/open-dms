// plannedWeekdays is stored as CSV ("1,3,5") for cross-DB portability (SQLite has
// no scalar-list type). 1=Mon .. 7=Sun.
export function parseWeekdays(csv: string): number[] {
  return csv
    .split(",")
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isInteger(n) && n >= 1 && n <= 7);
}

export function serializeWeekdays(days: number[]): string {
  return [...new Set(days)]
    .filter((n) => n >= 1 && n <= 7)
    .sort((a, b) => a - b)
    .join(",");
}
