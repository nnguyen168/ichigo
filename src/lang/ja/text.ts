/**
 * Japanese text markup used throughout the seed data and generated content:
 *
 *   [漢字|かんじ]  base text with its reading (rendered as furigana)
 *   ^は  ^へ        particle whose pronunciation differs from its spelling (wa / e)
 *   (space)        word boundary — hidden in Japanese display, used for romaji spacing
 *
 * Example: "[私|わたし]^は [学生|がくせい] です" → 私は学生です / わたしはがくせいです / watashi wa gakusei desu
 */
import { isKana, toHiragana, toRomaji } from "wanakana";
import type { TextSegment } from "../types";

const RUBY = /\[([^|\]]+)\|([^\]]+)\]/g;

export function parseText(text: string): TextSegment[] {
  const segments: TextSegment[] = [];
  let last = 0;
  const clean = (s: string) => s.replace(/\^/g, "").replace(/ /g, "");
  for (const m of text.matchAll(RUBY)) {
    const idx = m.index ?? 0;
    if (idx > last) pushPlain(segments, clean(text.slice(last, idx)));
    segments.push({ base: m[1]!, reading: m[2]! });
    last = idx + m[0].length;
  }
  if (last < text.length) pushPlain(segments, clean(text.slice(last)));
  return segments;
}

function pushPlain(segments: TextSegment[], s: string) {
  if (!s) return;
  const prev = segments[segments.length - 1];
  if (prev && prev.reading === undefined) prev.base += s;
  else segments.push({ base: s });
}

/** Display text without markup: 私は学生です */
export function plainText(text: string): string {
  return text.replace(RUBY, "$1").replace(/\^/g, "").replace(/ /g, "");
}

/** Kana reading (spelling, not pronunciation): わたしはがくせいです */
export function readingOf(text: string): string {
  return text.replace(RUBY, "$2").replace(/\^/g, "").replace(/ /g, "");
}

/** Hepburn-style romaji with word spacing and particle pronunciation: watashi wa gakusei desu */
export function romanize(text: string): string {
  const withReadings = text.replace(RUBY, "$2");
  return withReadings
    .split(" ")
    .filter(Boolean)
    .map((word) => {
      // Split off marked particles so they become separate romaji words.
      const parts = word.split("^");
      return parts
        .map((part, i) => {
          if (i > 0) {
            // First char of a marked part is the particle.
            const particle = part[0];
            const rest = part.slice(1);
            const p = particle === "は" ? "wa" : particle === "へ" ? "e" : toRomaji(particle ?? "");
            return rest ? `${p} ${romajiWord(rest)}` : p;
          }
          return romajiWord(part);
        })
        .filter(Boolean)
        .join(" ");
    })
    .join(" ")
    .replace(/\s+([,.!?])/g, "$1")
    .replace(/\s{2,}/g, " ");
}

function romajiWord(word: string): string {
  const r = toRomaji(word.replace(/[、]/g, ", ").replace(/[。]/g, ". ").replace(/[？]/g, "? ").replace(/[！]/g, "! ")).trim();
  // Object particle を is pronounced "o".
  return r === "wo" ? "o" : r;
}

const VOWEL_KANA: Record<string, string> = { a: "あ", i: "い", u: "う", e: "え", o: "お" };

/** Replace the long-vowel mark ー with the vowel of the preceding kana: こーひー → こおひい */
export function expandLongVowels(hira: string): string {
  let out = "";
  for (const ch of hira) {
    if (ch === "ー" && out.length > 0) {
      const romaji = toRomaji(out[out.length - 1]!);
      const v = romaji[romaji.length - 1] ?? "";
      out += VOWEL_KANA[v] ?? "";
    } else {
      out += ch;
    }
  }
  return out;
}

/**
 * Normalize for answer comparison. Both the expected answer (with markup) and the learner's
 * input go through this. Lenient on things that don't change what is heard.
 */
export function toComparable(text: string): string {
  // Expand ー before converting: wanakana turns katakana "オー" into "おう".
  const reading = expandLongVowels(readingOf(text));
  // Learner input may be romaji: convert; katakana → hiragana.
  let hira = toHiragana(reading.toLowerCase(), { passRomaji: false });
  hira = hira
    // Long vowels spelled either way sound the same: おう≈おお, えい≈ええ.
    .replace(/([おこそとのほもよろごぞどぼぽょ])う/g, "$1お")
    .replace(/([えけせてねへめれげぜでべぺ])い/g, "$1え")
    .replace(/は/g, "わ")
    .replace(/へ/g, "え")
    .replace(/を/g, "お")
    .replace(/ぢ/g, "じ")
    .replace(/づ/g, "ず");
  // Keep only kana.
  return [...hira].filter((ch) => isKana(ch)).join("");
}
