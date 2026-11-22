import { isKana } from "wanakana";
import { describe, expect, it } from "vitest";
import { seedDeck } from "./seedDeck";
import { readingOf } from "./text";
import { japanese } from ".";

const ALLOWED_NON_KANA = /[、。？！]/;

describe("seed deck integrity", () => {
  it("has unique ids and known topics", () => {
    const ids = seedDeck.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    const topics = new Set(japanese.topics.map((t) => t.id));
    for (const c of seedDeck) expect(topics.has(c.topic)).toBe(true);
  });

  it("every reading is pure kana (all kanji have furigana)", () => {
    const texts = seedDeck.flatMap((c) => [c.text.replace("{}", ""), ...(c.slot ?? []).map((s) => s.text)]);
    for (const t of texts) {
      const bad = [...readingOf(t)].filter((ch) => !isKana(ch) && !ALLOWED_NON_KANA.test(ch));
      expect(bad, `"${t}" has unannotated characters`).toEqual([]);
    }
  });

  it("slots are consistent", () => {
    for (const c of seedDeck) {
      const hasSlot = c.text.includes("{}");
      expect(hasSlot, c.id).toBe(Boolean(c.slot?.length));
      if (hasSlot) expect(c.en.includes("{}"), `${c.id} en`).toBe(true);
    }
  });

  it("markup is balanced", () => {
    for (const c of seedDeck) {
      const opens = (c.text.match(/\[/g) ?? []).length;
      const pairs = (c.text.match(/\[[^|\]]+\|[^\]]+\]/g) ?? []).length;
      expect(opens, c.id).toBe(pairs);
    }
  });

  it("has a deck large enough for the first weeks", () => {
    expect(seedDeck.length).toBeGreaterThanOrEqual(140);
  });
});
