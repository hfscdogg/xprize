export function formatMoney(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

export function parseMoneyToCents(input: string): number {
  const cleaned = input.replace(/[^0-9.]/g, "");
  if (!cleaned) return 0;
  const dollars = Number.parseFloat(cleaned);
  if (Number.isNaN(dollars)) return 0;
  return Math.round(dollars * 100);
}
