import { toHiragana } from "wanakana";
import type { LanguagePack, Topic } from "../types";
import { kanaTrainer } from "./kana";
import { bands, placementItems } from "./placement";
import { seedDeck } from "./seedDeck";
import { parseText, plainText, readingOf, romanize, toComparable } from "./text";

const topics: Topic[] = [
  { id: "survival", label: "Survival", description: "Keep any conversation alive", core: true },
  { id: "greetings", label: "Greetings", description: "Hello, goodbye, nice to meet you", core: true },
  { id: "self", label: "About me", description: "Name, origin, where you live", core: true },
  { id: "work", label: "Work & study", description: "Your job and daily routine" },
  { id: "family", label: "Family", description: "Family, partner, pets" },
  { id: "food", label: "Food & ordering", description: "Restaurants, cafés, allergies" },
  { id: "travel", label: "Getting around", description: "Stations, taxis, directions, hotels" },
  { id: "shopping", label: "Shopping", description: "Prices, sizes, paying" },
  { id: "hobbies", label: "Hobbies", description: "Free time, weekends, interests" },
  { id: "time", label: "Time & plans", description: "Times, days, making plans" },
  { id: "opinions", label: "Opinions & feelings", description: "Reacting, agreeing, how you feel" },
];

export const japanese: LanguagePack = {
  code: "ja",
  name: "Japanese",
  nativeName: "日本語",
  speechLocale: "ja-JP",
  topics,
  seedDeck,
  scriptTrainer: kanaTrainer,
  placement: { items: placementItems, bands },
  // Seed levels 1 ≈ A1 survival basics; 2–3 ≈ upper A1 / A2.
  knownSeedLevels: (band) => (band >= 2 ? [1, 2, 3] : band >= 1 ? [1] : []),
  parseText,
  plainText,
  readingOf,
  romanize,
  toComparable,
  convertInput: (input) => toHiragana(input, { IMEMode: true }),
};
