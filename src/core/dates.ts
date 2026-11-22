/** Local calendar date as YYYY-MM-DD. */
export function localDate(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function startOfLocalDay(d: Date = new Date()): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/** Day number in the program: the start date is Day 1. Can be ≤ 0 before the start. */
export function dayNumber(startDate: string, now: Date = new Date()): number {
  const [y, m, d] = startDate.split("-").map(Number);
  const start = new Date(y!, m! - 1, d!);
  const diff = Math.round((startOfLocalDay(now).getTime() - start.getTime()) / 86_400_000);
  return diff + 1;
}
