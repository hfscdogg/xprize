export function quarterOf(date: Date = new Date()): string {
  const year = date.getUTCFullYear();
  const q = Math.floor(date.getUTCMonth() / 3) + 1;
  return `${year}-Q${q}`;
}

export function previousQuarter(quarter: string): string {
  const m = quarter.match(/^(\d{4})-Q([1-4])$/);
  if (!m) return quarter;
  const year = Number(m[1]);
  const q = Number(m[2]);
  return q === 1 ? `${year - 1}-Q4` : `${year}-Q${q - 1}`;
}

export function quarterChoices(): string[] {
  const current = quarterOf();
  const prev = previousQuarter(current);
  return [current, prev];
}
