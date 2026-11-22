import type { LanguagePack, SeedChunk, TopicId } from "../lang/types";
import { startOfLocalDay } from "./dates";
import { db } from "./db";
import { gradeCard, newFsrsCard, type GradeValue } from "./scheduler";
import type { CardType, ChunkItem, Item, KanaItem, Profile, ReviewRecord, StudyCard } from "./types";

function makeCard(itemId: string, type: CardType, dueAt: Date, now: Date): StudyCard {
  const fsrs = newFsrsCard(dueAt);
  return { id: `${itemId}#${type}`, itemId, type, due: fsrs.due.getTime(), fsrs, createdAt: now };
}

// ── Kana ──────────────────────────────────────────────────────────────

export async function learnedKanaGroups(): Promise<Set<string>> {
  const items = (await db.items.where("kind").equals("kana").toArray()) as KanaItem[];
  return new Set(items.map((i) => i.kana.group));
}

export function nextKanaGroups(pack: LanguagePack, learned: Set<string>) {
  return (pack.scriptTrainer?.groups ?? []).filter((g) => !learned.has(g.id));
}

export async function addKanaGroup(pack: LanguagePack, groupId: string, now = new Date()): Promise<void> {
  const chars = pack.scriptTrainer?.chars.filter((c) => c.group === groupId) ?? [];
  const items: KanaItem[] = chars.map((kana) => ({ id: `${pack.code}.kana.${kana.id}`, kind: "kana", lang: pack.code, kana, addedAt: now }));
  const cards = items.flatMap((it) => [makeCard(it.id, "kana-read", now, now), makeCard(it.id, "kana-listen", now, now)]);
  await db.transaction("rw", db.items, db.cards, async () => {
    await db.items.bulkPut(items);
    // Don't reset existing progress if a group is re-added.
    const existing = new Set((await db.cards.bulkGet(cards.map((c) => c.id))).filter(Boolean).map((c) => c!.id));
    await db.cards.bulkAdd(cards.filter((c) => !existing.has(c.id)));
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

export async function addChunk(lang: string, chunk: SeedChunk, source: ChunkItem["source"] = "seed", now = new Date()) {
  const item: ChunkItem = { id: chunk.id, kind: "chunk", lang, chunk, source, addedAt: now };
  const cards = [makeCard(item.id, "chunk-listen", now, now), makeCard(item.id, "chunk-say", now, now)];
  if ((chunk.slot?.length ?? 0) >= 2) {
    // Slot practice starts the next day, once the base phrase has had a first review.
    cards.push(makeCard(item.id, "chunk-slot", new Date(now.getTime() + 86_400_000), now));
  }
  await db.transaction("rw", db.items, db.cards, async () => {
    await db.items.put(item);
    const existing = new Set((await db.cards.bulkGet(cards.map((c) => c.id))).filter(Boolean).map((c) => c!.id));
    await db.cards.bulkAdd(cards.filter((c) => !existing.has(c.id)));
  });
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
  const kanaGroups = new Set(itemsToday.filter((i): i is KanaItem => i.kind === "kana").map((i) => i.kana.group));
  return {
    due,
    reviewedToday: reviewsToday.length,
    chunksAddedToday: itemsToday.filter((i) => i.kind === "chunk").length,
    kanaGroupsAddedToday: kanaGroups.size,
    totalChunks,
    totalKana,
    spokenToday: reviewsToday.filter((r) => r.mode === "spoken").length,
  };
}
