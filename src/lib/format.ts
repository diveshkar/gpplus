/**
 * Display helpers. Points keep their decimals (a balance can be 2.5), so we
 * show up to two fraction digits and drop trailing zeros for whole numbers.
 */

const pointsFormatter = new Intl.NumberFormat("en-LK", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

const lkrFormatter = new Intl.NumberFormat("en-LK", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatPoints(value: number): string {
  return pointsFormatter.format(value);
}

export function formatLKR(value: number): string {
  return `LKR ${lkrFormatter.format(value)}`;
}

export function formatDate(value: string | null): string {
  if (!value) return "Not set";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not set";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}
