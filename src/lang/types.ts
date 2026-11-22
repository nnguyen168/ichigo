/**
 * A language pack holds everything that is specific to one target language.
 * The core (scheduler, planner, storage, UI shell) never imports a pack directly;
 * it goes through `getPack()` in `registry.ts`.
 */

export type Register = "polite" | "casual" | "neutral";

/** One value that can fill a chunk's slot, e.g. コーヒー / "coffee". */
export interface SlotOption {
  /** Target-language text, may contain reading markup (see `LanguagePack.parseText`). */
  text: string;
  /** English meaning. */
  en: string;
}

/**
 * A chunk is the basic unit of learning: a ready-made phrase, optionally with one slot.
 * In `text` and `en`, the slot is written as `{}`. The first slot option is the canonical example.
 */
export interface SeedChunk {
  id: string;
  topic: TopicId;
  /** Ordering within the deck: 1 = learn first. */
  level: 1 | 2 | 3;
  text: string;
  en: string;
  /** Literal word-by-word gloss, to help the learner notice structure. */
  lit?: string;
  /** Situation cue shown on "say it" cards, e.g. "At a café". */
  cue?: string;
  note?: string;
  register: Register;
  slot?: SlotOption[];
}

export type TopicId =
  | "survival"
  | "greetings"
  | "self"
  | "work"
  | "family"
  | "food"
  | "travel"
  | "shopping"
  | "hobbies"
  | "time"
  | "opinions";

export interface Topic {
  id: TopicId;
  label: string;
  description: string;
  /** Always included regardless of the learner's choices. */
  core?: boolean;
}

/** One segment of display text: plain text, or a base with a reading shown above it (furigana). */
export interface TextSegment {
  base: string;
  reading?: string;
}

export interface ScriptChar {
  id: string;
  char: string;
  /** Canonical romanization, e.g. "shi". */
  romaji: string;
  /** Group for lessons, e.g. "hiragana-k". */
  group: string;
  mnemonic?: string;
}

export interface ScriptGroup {
  id: string;
  script: string;
  label: string;
  /** Short explanation shown when the group is introduced. */
  intro?: string;
}

export interface ScriptTrainerDef {
  groups: ScriptGroup[];
  chars: ScriptChar[];
  /** Check a typed answer for a character. */
  checkTyped(char: ScriptChar, input: string): boolean;
  /** Distractors for listening multiple choice. */
  distractors(char: ScriptChar, count: number): ScriptChar[];
}

export interface LanguagePack {
  code: string;
  name: string;
  nativeName: string;
  /** BCP-47 locale for speech synthesis/recognition. */
  speechLocale: string;
  topics: Topic[];
  seedDeck: SeedChunk[];
  scriptTrainer?: ScriptTrainerDef;
  /** Split display text with reading markup into segments. */
  parseText(text: string): TextSegment[];
  /** Plain text without markup (what gets spoken by TTS). */
  plainText(text: string): string;
  /** Pronunciation form (e.g. kana reading for Japanese). */
  readingOf(text: string): string;
  /** Romanization, for beginners. */
  romanize?(text: string): string;
  /**
   * Normalize an answer for comparison (both learner input and expected answer go through this).
   * For Japanese: hiragana, no punctuation, particle and long-vowel equivalences.
   */
  toComparable(text: string): string;
  /** Convert keyboard input as the learner types (e.g. romaji → kana). */
  convertInput?(input: string): string;
}
