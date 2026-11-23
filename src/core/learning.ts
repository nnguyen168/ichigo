import type { LanguagePack, SeedChunk, TopicId } from "../lang/types";
import { startOfLocalDay } from "./dates";
import { db } from "./db";
import { gradeCard, newFsrsCard, type GradeValue } from "./scheduler";
import type { CardType, ChunkItem, Item, KanaItem, Profile, ReviewRecord, StudyCard } from "./types";

function makeCard(itemId: string, type: CardType, dueAt: Date, now: Date): StudyCard {
  const fsrs = newFsrsCard(dueAt);
  return { id: `${itemId}#${type}`, itemId, type, due: fsrs.due.getTime(), fsrs, createdAt: now };
}

export interface KnownOptions {
  /** First check-up is spread randomly over this many days, so known items don't all land on one day. */
  spreadDays: [min: number, max: number];
  rand?: () => number;
}

/**
 * A card for something the learner already knows: scheduled as if its first review was "Easy",
 * with the first check-up spread out (never later than FSRS would schedule it).
 */
function makeKnownCard(itemId: string, type: CardType, now: Date, opts: KnownOptions): StudyCard {
  const fsrs = gradeCard(newFsrsCard(now), 4, now);
  const [min, max] = opts.spreadDays;
  const days = min + (opts.rand ?? Math.random)() * (max - min);
  const due = Math.min(fsrs.due.getTime(), now.getTime() + days * 86_400_000);
  fsrs.due = new Date(due);
  return { id: `${itemId}#${type}`, itemId, type, due, fsrs, createdAt: now };
}

/** Add only the cards that don't exist yet (never reset progress). */
async function addNewCards(cards: StudyCard[]) {
  const existing = new Set((await db.cards.bulkGet(cards.map((c) => c.id))).filter(Boolean).map((c) => c!.id));
  await db.cards.bulkAdd(cards.filter((c) => !existing.has(c.id)));
}

// ── Kana ──────────────────────────────────────────────────────────────

export async function learnedKanaGroups(): Promise<Set<string>> {
  const items = (await db.items.where("kind").equals("kana").toArray()) as KanaItem[];
  return new Set(items.map((i) => i.kana.group));
}

export function nextKanaGroups(pack: LanguagePack, learned: Set<string>) {
  return (pack.scriptTrainer?.groups ?? []).filter((g) => !learned.has(g.id));
}

/**
 * Start learning a kana group. With `known`, the group was passed in the placement check:
 * no lesson, just occasional check-ups.
 */
export async function addKanaGroup(pack: LanguagePack, groupId: string, now = new Date(), known?: KnownOptions): Promise<void> {
  const chars = pack.scriptTrainer?.chars.filter((c) => c.group === groupId) ?? [];
  const items: KanaItem[] = chars.map((kana) => ({
    id: `${pack.code}.kana.${kana.id}`,
    kind: "kana",
    lang: pack.code,
    kana,
    addedAt: now,
    ...(known ? { fastTracked: true } : {}),
  }));
  const card = (id: string, type: CardType) => (known ? makeKnownCard(id, type, now, known) : makeCard(id, type, now, now));
  const cards = items.flatMap((it) => [card(it.id, "kana-read"), card(it.id, "kana-listen")]);
  await db.transaction("rw", db.items, db.cards, async () => {
    const existing = new Set((await db.items.bulkGet(items.map((i) => i.id))).filter(Boolean).map((i) => i!.id));
    await db.items.bulkAdd(items.filter((i) => !existing.has(i.id)));
    await addNewCards(cards);
  });
}

// ── Chunks ────────────────────────────────────────────────────────────

/** Topics in play: the pack's core topics plus the learner's choices, in pack order. */
export function activeTopics(pack: LanguagePack, profile: Profile): TopicId[] {
  return pack.topics.filter((t) => t.core || profile.topics.includes(t.id)).map((t) => t.id);
}

/**
 * Seed chunks not yet learned, in teaching order: by level, and within a level
 * round-robin across topics so each day mixes situations (interleaving).
 */
export function chunkQueue(pack: LanguagePack, profile: Profile, learnedIds: Set<string>): SeedChunk[] {
  const topics = activeTopics(pack, profile);
  const out: SeedChunk[] = [];
  for (const level of [1, 2, 3] as const) {
    const byTopic = topics.map((t) =>
      pack.seedDeck.filter((c) => c.topic === t && c.level === level && !learnedIds.has(c.id)),
    );
    let i = 0;
    while (byTopic.some((list) => list.length > i)) {
      for (const list of byTopic) if (list[i]) out.push(list[i]!);
      i++;
    }
  }
  return out;
}

export async function learnedChunkIds(): Promise<Set<string>> {
  const items = (await db.items.where("kind").equals("chunk").toArray()) as ChunkItem[];
  return new Set(items.map((i) => i.chunk.id));
}

/**
 * Start learning a chunk. With `known`, the learner confirmed it in a quick check:
 * it skips the lesson and is scheduled for a later check-up instead.
 */
export async function addChunk(
  lang: string,
  chunk: SeedChunk,
  source: ChunkItem["source"] = "seed",
  now = new Date(),
  known?: KnownOptions,
) {
  const item: ChunkItem = { id: chunk.id, kind: "chunk", lang, chunk, source, addedAt: now, ...(known ? { fastTracked: true } : {}) };
  const hasSlot = (chunk.slot?.length ?? 0) >= 2;
  let cards: StudyCard[];
  if (known) {
    cards = [makeKnownCard(item.id, "chunk-listen", now, known), makeKnownCard(item.id, "chunk-say", now, known)];
    if (hasSlot) cards.push(makeKnownCard(item.id, "chunk-slot", now, known));
  } else {
    cards = [makeCard(item.id, "chunk-listen", now, now), makeCard(item.id, "chunk-say", now, now)];
    // Slot practice starts the next day, once the base phrase has had a first review.
    if (hasSlot) cards.push(makeCard(item.id, "chunk-slot", new Date(now.getTime() + 86_400_000), now));
  }
  await db.transaction("rw", db.items, db.cards, async () => {
    await db.items.put(item);
    await addNewCards(cards);
  });
}

/** Seed chunks at levels the placement check says the learner probably knows: offered as quick checks. */
export function isQuickCheck(pack: LanguagePack, profile: Profile, chunk: SeedChunk): boolean {
  if (!profile.placement) return false;
  return pack.knownSeedLevels(profile.placement.band).includes(chunk.level);
}

export async function flagChunk(itemId: string, reason: string) {
  await db.items.update(itemId, { flagged: reason } as Partial<Item>);
}

// ── Reviews ───────────────────────────────────────────────────────────

export interface DueCard {
  card: StudyCard;
  item: Item;
}

/** Cards due now; optionally cards due within `aheadMs` (learning steps) when nothing else is left. */
export async function getDueCards(now = new Date(), aheadMs = 0): Promise<DueCard[]> {
  const cards = await db.cards.where("due").belowOrEqual(now.getTime() + aheadMs).toArray();
  const items = await db.items.bulkGet(cards.map((c) => c.itemId));
  return cards
    .map((card, i) => ({ card, item: items[i] }))
    .filter((d): d is DueCard => Boolean(d.item));
}

export async function countDue(now = new Date()): Promise<number> {
  return db.cards.where("due").belowOrEqual(now.getTime()).count();
}

export async function recordReview(
  card: StudyCard,
  grade: GradeValue,
  info: Omit<ReviewRecord, "id" | "cardId" | "at" | "grade">,
  now = new Date(),
): Promise<StudyCard> {
  const fsrs = gradeCard(card.fsrs, grade, now);
  const updated: StudyCard = { ...card, fsrs, due: fsrs.due.getTime() };
  await db.transaction("rw", db.cards, db.reviews, async () => {
    await db.cards.put(updated);
    await db.reviews.add({ cardId: card.id, at: now, grade, ...info });
  });
  return updated;
}

// ── Stats ─────────────────────────────────────────────────────────────

export interface TodayStats {
  due: number;
  reviewedToday: number;
  chunksAddedToday: number;
  kanaGroupsAddedToday: number;
  totalChunks: number;
  totalKana: number;
  spokenToday: number;
}

export async function todayStats(now = new Date()): Promise<TodayStats> {
  const start = startOfLocalDay(now);
  const [due, reviewsToday, itemsToday, totalChunks, totalKana] = await Promise.all([
    countDue(now),
    db.reviews.where("at").aboveOrEqual(start).toArray(),
    db.items.where("addedAt").aboveOrEqual(start).toArray(),
    db.items.where("kind").equals("chunk").count(),
    db.items.where("kind").equals("kana").count(),
  ]);
  // Items confirmed as already known don't use up today's new-material budget.
  const taught = itemsToday.filter((i) => !i.fastTracked);
  const kanaGroups = new Set(taught.filter((i): i is KanaItem => i.kind === "kana").map((i) => i.kana.group));
  return {
    due,
    reviewedToday: reviewsToday.length,
    chunksAddedToday: taught.filter((i) => i.kind === "chunk").length,
    kanaGroupsAddedToday: kanaGroups.size,
    totalChunks,
    totalKana,
    spokenToday: reviewsToday.filter((r) => r.mode === "spoken").length,
  };
}
