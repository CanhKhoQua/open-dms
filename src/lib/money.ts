// Format a numeric/Decimal value as Vietnamese đồng (₫). VND has no minor unit,
// so amounts are always whole (₫1.650.000). Used app-wide for prices, credit
// limits, and receivables.
export function formatMoney(value: number | { toString(): string }): string {
  const n = typeof value === "number" ? value : Number(value.toString());
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(n);
}
