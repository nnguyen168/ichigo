import type { Card as FsrsCard } from "ts-fsrs";
import type { SeedChunk, ScriptChar, TopicId } from "../lang/types";

export type RomajiMode = "auto" | "on" | "off";
export type FuriganaMode = "always" | "off";

export interface Profile {
  lang: string;
  /** Local date (YYYY-MM-DD) of Day 1. */
  startDate: string;
  dailyMinutes: 30 | 60 | 90 | 120;
  topics: TopicId[];
  mission: string;
  /** Implementation intention: "After <when>, at <where>, I study." */
  ifThen: { when: string; where: string };
  romaji: RomajiMode;
  furigana: FuriganaMode;
  voiceURI?: string;
  speechRate: number;
  createdAt: Date;
  lastBackupAt?: Date;
  placement?: PlacementResult;
}

export type Experience = "none" | "kana" | "beginner" | "elementary" | "intermediate";

export interface PlacementResult {
  takenAt: Date;
  experience: Experience;
  /** Script placement buckets passed (e.g. "hiragana-basic"). */
  scriptBucketsKnown: string[];
  /** Highest reading band passed: 0 = none, 1 = A1 … 4 = B2. */
  band: number;
  /** Raw answers, for later analysis. */
  answers: { itemId: string; correct: boolean }[];
}

export type ItemKind = "chunk" | "kana";

export interface ChunkItem {
  id: string;
  kind: "chunk";
  lang: string;
  chunk: SeedChunk;
  source: "seed" | "generated" | "user";
  addedAt: Date;
  /** Already known (confirmed in a quick check), so it skipped the full lesson. */
  fastTracked?: boolean;
  flagged?: string;
}

export interface KanaItem {
  id: string;
  kind: "kana";
  lang: string;
  kana: ScriptChar;
  addedAt: Date;
  /** Passed in the placement check rather than taught. */
  fastTracked?: boolean;
}

export type Item = ChunkItem | KanaItem;

export type CardType = "kana-read" | "kana-listen" | "chunk-listen" | "chunk-say" | "chunk-slot";

export interface StudyCard {
  /** `${itemId}#${type}` */
  id: string;
  itemId: string;
  type: CardType;
  /** Mirrors fsrs.due as a number for indexing. */
  due: number;
  fsrs: FsrsCard;
  createdAt: Date;
}

export interface ReviewRecord {
  id?: number;
  cardId: string;
  at: Date;
  grade: 1 | 2 | 3 | 4;
  suggested?: 1 | 2 | 3 | 4;
  ms: number;
  answer?: string;
  /** Whether the learner answered aloud/typed (spoken production) or only recognized. */
  mode: "spoken" | "typed" | "recognize";
}
