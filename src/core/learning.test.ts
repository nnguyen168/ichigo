import { beforeEach, describe, expect, it } from "vitest";
import { japanese } from "../lang/ja";
import { exportBackup, importBackup } from "./backup";
import { db } from "./db";
import {
  addChunk, addKanaGroup, chunkQueue, getDueCards, learnedChunkIds, learnedKanaGroups, recordReview, todayStats,
} from "./learning";
import type { Profile } from "./types";

const profile: Profile = {
  lang: "ja",
  startDate: "2026-11-23",
  dailyMinutes: 90,
  topics: ["food", "work"],
  mission: "",
  ifThen: { when: "", where: "" },
  romaji: "auto",
  furigana: "always",
  speechRate: 0.95,
  createdAt: new Date(),
};

beforeEach(async () => {
  await Promise.all([db.meta.clear(), db.items.clear(), db.cards.clear(), db.reviews.clear()]);
});

describe("learning flow", () => {
  it("orders the chunk queue by level, interleaving active topics only", () => {
    const q = chunkQueue(japanese, profile, new Set());
    expect(q[0]!.level).toBe(1);
    const topics = new Set(q.map((c) => c.topic));
    expect(topics.has("family")).toBe(false);
    expect(topics.has("food")).toBe(true);
    expect(topics.has("survival")).toBe(true);
    // Interleaving: the first few chunks come from different topics.
    expect(new Set(q.slice(0, 5).map((c) => c.topic)).size).toBeGreaterThan(3);
  });

  it("adds a kana group with two cards per character", async () => {
    await addKanaGroup(japanese, "hiragana-vowels");
    expect(await db.cards.count()).toBe(10);
    expect((await learnedKanaGroups()).has("hiragana-vowels")).toBe(true);
  });

  it("adds a chunk; slot practice starts tomorrow", async () => {
    const chunk = japanese.seedDeck.find((c) => (c.slot?.length ?? 0) >= 2)!;
    const now = new Date();
    await addChunk("ja", chunk, "seed", now);
    expect((await learnedChunkIds()).has(chunk.id)).toBe(true);
    const due = await getDueCards(now);
    expect(due.map((d) => d.card.type).sort()).toEqual(["chunk-listen", "chunk-say"]);
  });

  it("records a review and reschedules the card", async () => {
    await addKanaGroup(japanese, "hiragana-vowels");
    const now = new Date();
    const [first] = await getDueCards(now);
    const updated = await recordReview(first!.card, 3, { ms: 2000, mode: "typed" }, now);
    expect(updated.due).toBeGreaterThan(now.getTime());
    const stats = await todayStats(now);
    expect(stats.reviewedToday).toBe(1);
    expect(stats.due).toBe(9);
  });

  it("round-trips a backup, including dates", async () => {
    await db.meta.put({ key: "profile", value: profile });
    await addKanaGroup(japanese, "hiragana-k");
    const json = await exportBackup();
    await Promise.all([db.meta.clear(), db.items.clear(), db.cards.clear()]);
    const res = await importBackup(json);
    expect(res.cards).toBe(10);
    const card = await db.cards.toCollection().first();
    expect(card!.fsrs.due).toBeInstanceOf(Date);
    const p = (await db.meta.get("profile"))!.value as Profile;
    expect(p.createdAt).toBeInstanceOf(Date);
  });
});
