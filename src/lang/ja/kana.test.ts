import { describe, expect, it } from "vitest";
import { kanaTrainer, checkKanaTyped } from "./kana";

const find = (ch: string) => kanaTrainer.chars.find((c) => c.char === ch)!;

describe("kana data", () => {
  it("has the full basic sets", () => {
    const basicHira = kanaTrainer.chars.filter((c) => c.id.startsWith("hiragana:") && c.mnemonic);
    const basicKata = kanaTrainer.chars.filter((c) => c.id.startsWith("katakana:") && c.mnemonic);
    expect(basicHira).toHaveLength(46);
    expect(basicKata).toHaveLength(46);
  });

  it("has unique ids and characters, and every char belongs to a group", () => {
    const ids = kanaTrainer.chars.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    const chars = kanaTrainer.chars.map((c) => c.char);
    expect(new Set(chars).size).toBe(chars.length);
    const groups = new Set(kanaTrainer.groups.map((g) => g.id));
    for (const c of kanaTrainer.chars) expect(groups.has(c.group)).toBe(true);
  });

  it("derives katakana and labels correctly", () => {
    expect(find("シ").romaji).toBe("shi");
    expect(kanaTrainer.groups.find((g) => g.id === "katakana-vowels")!.label).toBe("Vowels アイウエオ");
  });

  it("accepts Hepburn and Kunrei spellings", () => {
    expect(checkKanaTyped(find("し"), "shi")).toBe(true);
    expect(checkKanaTyped(find("し"), "si")).toBe(true);
    expect(checkKanaTyped(find("つ"), "tu")).toBe(true);
    expect(checkKanaTyped(find("ん"), "n")).toBe(true);
    expect(checkKanaTyped(find("ぢ"), "ji")).toBe(true);
    expect(checkKanaTyped(find("を"), "o")).toBe(true);
    expect(checkKanaTyped(find("きゃ"), "kya")).toBe(true);
    expect(checkKanaTyped(find("シ"), "tsu")).toBe(false);
    expect(checkKanaTyped(find("は"), "wa")).toBe(false);
  });

  it("gives distinct distractors, preferring lookalikes", () => {
    const target = find("シ");
    const d = kanaTrainer.distractors(target, 3);
    expect(d).toHaveLength(3);
    expect(d.map((c) => c.char)).toContain("ツ");
    expect(d.every((c) => c.char !== "シ")).toBe(true);
  });
});
