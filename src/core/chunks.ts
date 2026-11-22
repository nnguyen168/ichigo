import type { SeedChunk, SlotOption } from "../lang/types";

/** The chunk with its slot filled, as text + English. Without a slot option, uses the canonical (first) one. */
export function filled(chunk: SeedChunk, option?: SlotOption): { text: string; en: string } {
  const opt = option ?? chunk.slot?.[0];
  if (!opt) return { text: chunk.text, en: chunk.en };
  return { text: chunk.text.replace("{}", opt.text), en: chunk.en.replace("{}", opt.en) };
}

/** All variants of a chunk (one per slot option). */
export function variants(chunk: SeedChunk): { text: string; en: string; option?: SlotOption }[] {
  if (!chunk.slot?.length) return [{ text: chunk.text, en: chunk.en }];
  return chunk.slot.map((option) => ({ ...filled(chunk, option), option }));
}

/** A non-canonical slot variant for slot-swap practice. */
export function randomAlternateVariant(chunk: SeedChunk, rand: () => number = Math.random) {
  const all = variants(chunk);
  const alts = all.length > 1 ? all.slice(1) : all;
  return alts[Math.floor(rand() * alts.length)]!;
}
