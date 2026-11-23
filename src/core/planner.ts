/**
 * Builds today's plan from the time budget, the review load and the day of the program.
 * Pure function — easy to test and tune.
 */

export type BlockKind = "review" | "kana" | "learn" | "listen" | "talk" | "shadow";

export interface PlanBlock {
  kind: BlockKind;
  title: string;
  detail: string;
  minutes: number;
  /** Planned amount: cards to review, kana groups, or new chunks. */
  target: number;
  /** Already done today. */
  done: number;
  available: boolean;
}

export interface PlanInput {
  day: number;
  dailyMinutes: number;
  due: number;
  reviewedToday: number;
  kanaGroupsRemaining: number;
  kanaGroupsAddedToday: number;
  chunksRemaining: number;
  chunksAddedToday: number;
  /** Not-yet-added phrases the placement check says are probably known (offered as quick checks). */
  quickChecksRemaining?: number;
  /** Placement showed prior knowledge: skip the "sounds & survival" framing. */
  experienced?: boolean;
}

export interface Plan {
  day: number;
  phase: string;
  blocks: PlanBlock[];
  /** New-chunk target after throttling. */
  newChunks: number;
}

/** Average seconds per review card (spoken cards take longer than recognition). */
export const SECONDS_PER_REVIEW = 12;

const NEW_CHUNKS_BY_BUDGET: Record<number, number> = { 30: 8, 60: 12, 90: 18, 120: 24 };
const KANA_GROUPS_BY_BUDGET: Record<number, number> = { 30: 3, 60: 5, 90: 6, 120: 7 };

export function phaseFor(day: number, experienced = false): string {
  if (day <= 0) return "Not started yet";
  if (experienced && day <= 5) return "Calibrating & core phrases";
  if (day <= 3) return "Sounds & survival";
  if (day <= 5) return "Katakana & first conversations";
  if (day <= 14) return "Core phrases";
  if (day === 15) return "Mid-point check";
  if (day <= 23) return "Your life in Japanese";
  if (day <= 29) return "Unscripted conversations";
  if (day === 30) return "Mission day";
  return "Continuing";
}

export function newChunkTarget(dailyMinutes: number, due: number): number {
  const base = NEW_CHUNKS_BY_BUDGET[dailyMinutes] ?? 12;
  const reviewMinutes = (due * SECONDS_PER_REVIEW) / 60;
  const share = reviewMinutes / dailyMinutes;
  // If reviews would eat more than 40% of the day, scale new material down (never below 3).
  if (share <= 0.4) return base;
  return Math.max(3, Math.round(base * (0.4 / share)));
}

export function buildPlan(input: PlanInput): Plan {
  const { day, dailyMinutes } = input;
  const newChunks = newChunkTarget(dailyMinutes, input.due);
  const kanaTarget = Math.min(KANA_GROUPS_BY_BUDGET[dailyMinutes] ?? 5, input.kanaGroupsAddedToday + input.kanaGroupsRemaining);

  const blocks: PlanBlock[] = [
    {
      kind: "review",
      title: "Review",
      detail: input.due > 0 ? `${input.due} cards due — say answers out loud` : "All caught up",
      minutes: Math.max(input.due > 0 ? 3 : 0, Math.round((input.due * SECONDS_PER_REVIEW) / 60)),
      target: input.due + input.reviewedToday,
      done: input.reviewedToday,
      available: true,
    },
  ];

  if (input.kanaGroupsRemaining > 0) {
    blocks.push({
      kind: "kana",
      title: "Kana",
      detail: `${input.kanaGroupsRemaining} groups left to learn`,
      minutes: Math.max(0, kanaTarget - input.kanaGroupsAddedToday) * 4,
      target: kanaTarget,
      done: input.kanaGroupsAddedToday,
      available: true,
    });
  }

  const quick = input.quickChecksRemaining ?? 0;
  const learnDetail =
    input.chunksRemaining === 0
      ? "Seed deck complete — personal phrases arrive in a later update"
      : quick > 0
        ? `Quick-check phrases you probably know (${quick} left), then ${newChunks} new ones`
        : `${newChunks} new phrases today`;
  blocks.push({
    kind: "learn",
    title: "New phrases",
    detail: learnDetail,
    minutes: Math.round(Math.max(0, newChunks - input.chunksAddedToday) * 0.8),
    target: Math.min(newChunks, input.chunksAddedToday + input.chunksRemaining),
    done: input.chunksAddedToday,
    available: input.chunksRemaining > 0,
  });

  blocks.push(
    { kind: "listen", title: "Listen & read", detail: "Graded stories — coming in milestone 4", minutes: 0, target: 0, done: 0, available: false },
    { kind: "talk", title: "Talk", detail: "AI conversation missions — coming in milestone 3", minutes: 0, target: 0, done: 0, available: false },
    { kind: "shadow", title: "Shadow", detail: "Shadowing & retelling — coming in milestone 2", minutes: 0, target: 0, done: 0, available: false },
  );

  return { day, phase: phaseFor(day, input.experienced), blocks, newChunks };
}
