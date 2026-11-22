import { describe, expect, it } from "vitest";
import { japanese } from "../lang/ja";
import { levenshtein, suggestGrade } from "./grading";

describe("grading", () => {
  it("computes edit distance", () => {
    expect(levenshtein("かきくけこ", "かきくけこ")).toBe(0);
    expect(levenshtein("かき", "かく")).toBe(1);
  });

  it("suggests Good for a correct romaji answer", () => {
    const expected = japanese.toComparable("お[会計|かいけい] お[願|ねが]いします");
    const s = suggestGrade(japanese.toComparable("okaikei onegaishimasu"), [expected]);
    expect(s.grade).toBe(3);
  });

  it("suggests Hard for a near miss and Again for a miss", () => {
    const expected = japanese.toComparable("もう [一度|いちど] お[願|ねが]いします");
    expect(suggestGrade(japanese.toComparable("mou ichido onegaishimas"), [expected]).grade).toBe(2);
    expect(suggestGrade(japanese.toComparable("sumimasen"), [expected]).grade).toBe(1);
  });
});
