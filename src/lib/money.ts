// Format a numeric/Decimal value as USD. Whole amounts drop the cents so large
// figures read cleanly ($10,000); fractional amounts keep two decimals ($0.40).
export function formatMoney(value: number | { toString(): string }): string {
  const n = typeof value === "number" ? value : Number(value.toString());
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: Number.isInteger(n) ? 0 : 2,
  }).format(n);
}
