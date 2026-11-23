import { beforeEach, describe, expect, it } from "vitest";
import { japanese } from "../lang/ja";
import { db, getProfile, saveProfile } from "./db";
import { addChunk, todayStats } from "./learning";
import { applyPlacement, bandItems, bucketChars, nextBand, nextBucket, resultBand, startBand } from "./placement";
import type { Profile } from "./types";

const trainer = japanese.scriptTrainer!;

describe("script buckets", () => {
  it("tests hiragana first, then the rest in order", () => {
    expect(nextBucket(trainer, {})).toBe(0);
    expect(nextBucket(trainer, { "hiragana-basic": true })).toBe(1);
    expect(nextBucket(trainer, { "hiragana-basic": true, "hiragana-extended": true })).toBe(2);
  });

  it("stops when basic hiragana fails", () => {
    expect(nextBucket(trainer, { "hiragana-basic": false })).toBeNull();
  });

  it("skips a script's extended set when its basic set fails", () => {
    expect(nextBucket(trainer, { "hiragana-basic": true, "hiragana-extended": true, "katakana-basic": false })).toBeNull();
    // Failing extended hiragana still allows katakana.
    expect(nextBucket(trainer, { "hiragana-basic": true, "hiragana-extended": false })).toBe(2);
  });

  it("samples characters only from the bucket's groups", () => {
    const chars = bucketChars(trainer, 2);
    expect(chars).toHaveLength(6);
    expect(chars.every((c) => c.id.startsWith("katakana:") && c.mnemonic)).toBe(true);
  });
});

describe("reading bands", () => {
  it("climbs while passing and stops at the first failure", () => {
    let s = { passed: [], failed: [] } as Parameters<typeof nextBand>[0];
    let r = nextBand(s, 1, 4);
    expect(r.next).toBe(2);
    r = nextBand(r.state, 2, 3);
    expect(r.next).toBe(3);
    r = nextBand(r.state, 3, 1);
    expect(r.next).toBeNull();
    s = r.state;
    expect(resultBand(s)).toBe(2);
  });

  it("steps down once when the starting band fails", () => {
    const r1 = nextBand({ passed: [], failed: [] }, 3, 2);
    expect(r1.next).toBe(2);
    const r2 = nextBand(r1.state, 2, 4);
    expect(r2.next).toBeNull(); // band 3 already failed
    expect(resultBand(r2.state)).toBe(2);
  });

  it("ends at band 0 when A1 fails", () => {
    const r = nextBand({ passed: [], failed: [] }, 1, 1);
    expect(r.next).toBeNull();
    expect(resultBand(r.state)).toBe(0);
  });

  it("starts where the self-report says", () => {
    expect(startBand("none")).toBeNull();
    expect(startBand("kana")).toBe(1);
    expect(startBand("elementary")).toBe(2);
    expect(startBand("intermediate")).toBe(3);
  });

  it("has six items per band and samples four", () => {
    for (const band of [1, 2, 3, 4] as const) {
      expect(japanese.placement.items.filter((i) => i.band === band)).toHaveLength(6);
      expect(bandItems(japanese.placement.items, band)).toHaveLength(4);
    }
  });
});

describe("applying a placement", () => {
  const profile: Profile = {
    lang: "ja",
    startDate: "2026-11-23",
    dailyMinutes: 60,
    topics: [],
    mission: "",
    ifThen: { when: "", where: "" },
    romaji: "auto",
    furigana: "always",
    speechRate: 0.95,
    createdAt: new Date(),
  };

  beforeEach(async () => {
    await Promise.all([db.meta.clear(), db.items.clear(), db.cards.clear(), db.reviews.clear()]);
    await saveProfile(profile);
  });

  it("marks passed kana as known with spread-out check-ups, and turns romaji off", async () => {
    const now = new Date();
    await applyPlacement(
      japanese,
      profile,
      { takenAt: now, experience: "elementary", scriptBucketsKnown: ["hiragana-basic", "katakana-basic"], band: 2, answers: [] },
      now,
    );
    const cards = await db.cards.toArray();
    expect(cards).toHaveLength(46 * 2 * 2);
    // Nothing due today; check-ups land between 2 and 21 days out.
    const days = cards.map((c) => (c.due - now.getTime()) / 86_400_000);
    expect(Math.min(...days)).toBeGreaterThanOrEqual(2);
    expect(Math.max(...days)).toBeLessThanOrEqual(21);
    const saved = await getProfile();
    expect(saved!.romaji).toBe("off");
    expect(saved!.placement!.band).toBe(2);
    // Known kana don't count as today's new material.
    expect((await todayStats(now)).kanaGroupsAddedToday).toBe(0);
  });

  it("known phrases skip the daily new-phrase budget", async () => {
    const now = new Date();
    const [a, b] = japanese.seedDeck;
    await addChunk("ja", a!, "seed", now, { spreadDays: [2, 10] });
    await addChunk("ja", b!, "seed", now);
    const stats = await todayStats(now);
    expect(stats.chunksAddedToday).toBe(1);
    expect(stats.due).toBe(2); // only the taught phrase's two cards
  });

  it("keeps the starter deck mapping sensible", () => {
    expect(japanese.knownSeedLevels(0)).toEqual([]);
    expect(japanese.knownSeedLevels(1)).toEqual([1]);
    expect(japanese.knownSeedLevels(3)).toEqual([1, 2, 3]);
  });
});
