// Format a numeric/Decimal value as Vietnamese dong.
export function formatVnd(value: number | { toString(): string }): string {
  const n = typeof value === "number" ? value : Number(value.toString());
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(n);
}
