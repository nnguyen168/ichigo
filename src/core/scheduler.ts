import { createEmptyCard, fsrs, Rating, type Card as FsrsCard, type Grade } from "ts-fsrs";

/**
 * FSRS scheduler. Target retention 0.9: hard enough to be a "desirable difficulty",
 * easy enough that sessions stay encouraging.
 */
export const scheduler = fsrs({ request_retention: 0.9, enable_fuzz: true });

export type GradeValue = 1 | 2 | 3 | 4;

export const GRADES: { value: GradeValue; label: string; key: string }[] = [
  { value: 1, label: "Again", key: "1" },
  { value: 2, label: "Hard", key: "2" },
  { value: 3, label: "Good", key: "3" },
  { value: 4, label: "Easy", key: "4" },
];

export function newFsrsCard(now: Date = new Date()): FsrsCard {
  return createEmptyCard(now);
}

export function gradeCard(card: FsrsCard, grade: GradeValue, now: Date = new Date()): FsrsCard {
  return scheduler.next(card, now, grade as Grade).card;
}

/** Human-readable next interval for each grade, for the grade buttons. */
export function previewIntervals(card: FsrsCard, now: Date = new Date()): Record<GradeValue, string> {
  const preview = scheduler.repeat(card, now);
  const out = {} as Record<GradeValue, string>;
  for (const g of [Rating.Again, Rating.Hard, Rating.Good, Rating.Easy] as const) {
    out[g as GradeValue] = formatInterval(preview[g].card.due.getTime() - now.getTime());
  }
  return out;
}

export function formatInterval(ms: number): string {
  const min = Math.max(1, Math.round(ms / 60_000));
  if (min < 60) return `${min}m`;
  const h = Math.round(min / 60);
  if (h < 24) return `${h}h`;
  const d = Math.round(h / 24);
  if (d < 31) return `${d}d`;
  const mo = Math.round(d / 30);
  if (mo < 12) return `${mo}mo`;
  return `${(d / 365).toFixed(1)}y`;
}
