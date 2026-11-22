import { describe, expect, it } from "vitest";
import { expandLongVowels, parseText, plainText, readingOf, romanize, toComparable } from "./text";

describe("Japanese text markup", () => {
  const s = "[私|わたし]^は [学生|がくせい] です";

  it("strips markup for display and reading", () => {
    expect(plainText(s)).toBe("私は学生です");
    expect(readingOf(s)).toBe("わたしはがくせいです");
  });

  it("parses furigana segments", () => {
    expect(parseText(s)).toEqual([
      { base: "私", reading: "わたし" },
      { base: "は" },
      { base: "学生", reading: "がくせい" },
      { base: "です" },
    ]);
  });

  it("romanizes with word spacing and particle pronunciation", () => {
    expect(romanize(s)).toBe("watashi wa gakusei desu");
    expect(romanize("こんにち^は")).toBe("konnichi wa");
    expect(romanize("[日本語|にほんご] を [勉強|べんきょう]して います")).toBe("nihongo o benkyoushite imasu");
    expect(romanize("[今|いま]、[何|なん] と [言|い]いましたか")).toBe("ima, nan to iimashitaka");
  });

  it("expands long vowel marks", () => {
    expect(expandLongVowels("こーひー")).toBe("こおひい");
  });

  it("compares leniently: romaji, katakana, particles, long vowels, punctuation", () => {
    expect(toComparable(s)).toBe(toComparable("watashi wa gakusei desu"));
    expect(toComparable("コーヒー を ください")).toBe(toComparable("koohii o kudasai"));
    expect(toComparable("[今|いま]、[何|なん]と")).toBe(toComparable("いまなんと"));
  });
});
