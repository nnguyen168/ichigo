import { describe, expect, it } from "vitest";
import { buildPlan, newChunkTarget, phaseFor } from "./planner";

const base = {
  day: 1,
  dailyMinutes: 90,
  due: 0,
  reviewedToday: 0,
  kanaGroupsRemaining: 28,
  kanaGroupsAddedToday: 0,
  chunksRemaining: 150,
  chunksAddedToday: 0,
};

describe("planner", () => {
  it("scales new phrases with the time budget", () => {
    expect(newChunkTarget(30, 0)).toBe(8);
    expect(newChunkTarget(120, 0)).toBe(24);
  });

  it("throttles new phrases when reviews pile up", () => {
    // 300 due × 12s = 60 min of a 90-min day → share 0.67 → 18 × 0.4/0.67 ≈ 11
    expect(newChunkTarget(90, 300)).toBe(11);
    expect(newChunkTarget(30, 1000)).toBe(3);
  });

  it("includes kana only while groups remain", () => {
    expect(buildPlan(base).blocks.some((b) => b.kind === "kana")).toBe(true);
    expect(buildPlan({ ...base, kanaGroupsRemaining: 0 }).blocks.some((b) => b.kind === "kana")).toBe(false);
  });

  it("names the phases of the 30 days", () => {
    expect(phaseFor(1)).toBe("Sounds & survival");
    expect(phaseFor(15)).toBe("Mid-point check");
    expect(phaseFor(30)).toBe("Mission day");
    expect(phaseFor(45)).toBe("Continuing");
  });
});
