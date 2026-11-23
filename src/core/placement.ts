/**
 * Placement check engine (pure logic + one apply step).
 *
 *   1. Experience (self-report) → where to start; "none" skips everything.
 *   2. Script buckets (e.g. hiragana, katakana): type the romaji for a sample. Pass ≥ 5/6.
 *      A bucket is skipped if the first bucket failed or an earlier bucket of the same script failed.
 *   3. Reading bands A1–B2, adaptive: 4 items per band, pass ≥ 3/4.
 *      Pass → go up; fail → go down once if the lower band is untested; stop when the edge is found.
 */
import type { Band, LanguagePack, PlacementItem, ScriptChar, ScriptTrainerDef } from "../lang/types";
import { saveProfile } from "./db";
import { addKanaGroup } from "./learning";
import type { Experience, PlacementResult, Profile } from "./types";

export const SCRIPT_SAMPLE = 6;
export const SCRIPT_PASS = 5;
export const BAND_SAMPLE = 4;
export const BAND_PASS = 3;

export const EXPERIENCES: { value: Experience; label: string; detail: string }[] = [
  { value: "none", label: "Complete beginner", detail: "I can't read Japanese yet" },
  { value: "kana", label: "I know some kana", detail: "Hiragana and maybe katakana, but few phrases" },
  { value: "beginner", label: "Beginner", detail: "Basic phrases and sentences (around N5)" },
  { value: "elementary", label: "Elementary", detail: "Everyday conversations with effort (around N4)" },
  { value: "intermediate", label: "Intermediate or above", detail: "I can read some kanji and follow most daily topics (N3+)" },
];

/** Starting reading band for each self-reported level (null = skip the reading check). */
export function startBand(exp: Experience): Band | null {
  switch (exp) {
    case "none":
      return null;
    case "kana":
    case "beginner":
      return 1;
    case "elementary":
      return 2;
    case "intermediate":
      return 3;
  }
}

export function sample<T>(items: T[], n: number, rand: () => number = Math.random): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a.slice(0, n);
}

// ── Script buckets ────────────────────────────────────────────────────

function bucketScript(trainer: ScriptTrainerDef, bucketIndex: number): string {
  const groupId = trainer.placementBuckets[bucketIndex]!.groups[0];
  return trainer.groups.find((g) => g.id === groupId)?.script ?? "";
}

/** Index of the next script bucket to test, or null when the script phase is over. */
export function nextBucket(trainer: ScriptTrainerDef, results: Record<string, boolean>): number | null {
  const buckets = trainer.placementBuckets;
  if (buckets.length === 0) return null;
  if (results[buckets[0]!.id] === false) return null;
  for (let i = 0; i < buckets.length; i++) {
    const b = buckets[i]!;
    if (b.id in results) continue;
    const script = bucketScript(trainer, i);
    const earlierFailed = buckets.slice(0, i).some((e, j) => results[e.id] === false && bucketScript(trainer, j) === script);
    if (earlierFailed) continue;
    return i;
  }
  return null;
}

export function bucketChars(trainer: ScriptTrainerDef, bucketIndex: number, rand?: () => number): ScriptChar[] {
  const groups = new Set(trainer.placementBuckets[bucketIndex]!.groups);
  return sample(
    trainer.chars.filter((c) => groups.has(c.group)),
    SCRIPT_SAMPLE,
    rand,
  );
}

// ── Reading bands ─────────────────────────────────────────────────────

export interface BandState {
  passed: Band[];
  failed: Band[];
}

/** Record a band's score; returns the next band to test, or null when done. */
export function nextBand(state: BandState, band: Band, correct: number): { state: BandState; next: Band | null } {
  const pass = correct >= BAND_PASS;
  const s: BandState = {
    passed: pass ? [...state.passed, band] : state.passed,
    failed: pass ? state.failed : [...state.failed, band],
  };
  const tested = (b: number) => s.passed.includes(b as Band) || s.failed.includes(b as Band);
  let next: Band | null = null;
  if (pass && band < 4 && !tested(band + 1)) next = (band + 1) as Band;
  if (!pass && band > 1 && !tested(band - 1)) next = (band - 1) as Band;
  return { state: s, next };
}

export function resultBand(state: BandState): number {
  return state.passed.length ? Math.max(...state.passed) : 0;
}

export function bandItems(items: PlacementItem[], band: Band, rand?: () => number): PlacementItem[] {
  return sample(
    items.filter((i) => i.band === band),
    BAND_SAMPLE,
    rand,
  );
}

// ── Apply ─────────────────────────────────────────────────────────────

/**
 * Save the result and act on it: passed kana become known (no lessons, spread-out check-ups),
 * and the romaji crutch switches off for learners who can read kana.
 */
export async function applyPlacement(pack: LanguagePack, profile: Profile, result: PlacementResult, now = new Date()) {
  const trainer = pack.scriptTrainer;
  if (trainer) {
    for (const bucket of trainer.placementBuckets.filter((b) => result.scriptBucketsKnown.includes(b.id))) {
      for (const group of bucket.groups) await addKanaGroup(pack, group, now, { spreadDays: [2, 21] });
    }
  }
  const readsScript = trainer ? result.scriptBucketsKnown.includes(trainer.placementBuckets[0]?.id ?? "") : false;
  await saveProfile({
    ...profile,
    placement: result,
    romaji: readsScript && profile.romaji === "auto" ? "off" : profile.romaji,
  });
}

export function describeBand(pack: LanguagePack, band: number): { title: string; detail: string } {
  if (band === 0) return { title: "Beginner", detail: "Starting from the foundations" };
  const info = pack.placement.bands.find((b) => b.band === band)!;
  return { title: `${info.label}${band === 4 ? "+" : ""}`, detail: info.local };
}
