/**
 * Suggests a grade for a typed or spoken answer. The learner always has the final say —
 * speech recognition and fuzzy matching are hints, not judges.
 */
import type { GradeValue } from "./scheduler";

export function levenshtein(a: string, b: string): number {
  const A = [...a];
  const B = [...b];
  const prev = Array.from({ length: B.length + 1 }, (_, i) => i);
  for (let i = 1; i <= A.length; i++) {
    let diag = prev[0]!;
    prev[0] = i;
    for (let j = 1; j <= B.length; j++) {
      const tmp = prev[j]!;
      prev[j] = Math.min(prev[j]! + 1, prev[j - 1]! + 1, diag + (A[i - 1] === B[j - 1] ? 0 : 1));
      diag = tmp;
    }
  }
  return prev[B.length]!;
}

export function similarity(a: string, b: string): number {
  if (!a && !b) return 1;
  const len = Math.max([...a].length, [...b].length);
  return 1 - levenshtein(a, b) / len;
}

export interface GradeSuggestion {
  grade: GradeValue;
  similarity: number;
  /** Best-matching accepted answer (comparable form). */
  matched: string;
}

/** Compare an answer to one or more accepted answers, all already normalized with the pack's `toComparable`. */
export function suggestGrade(answer: string, accepted: string[]): GradeSuggestion {
  let best = { sim: -1, matched: accepted[0] ?? "" };
  for (const acc of accepted) {
    const sim = similarity(answer, acc);
    if (sim > best.sim) best = { sim, matched: acc };
  }
  const sim = Math.max(0, best.sim);
  const grade: GradeValue = sim >= 0.95 ? 3 : sim >= 0.8 ? 2 : 1;
  return { grade, similarity: sim, matched: best.matched };
}
