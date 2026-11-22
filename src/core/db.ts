import Dexie, { type EntityTable } from "dexie";
import type { Item, Profile, ReviewRecord, StudyCard } from "./types";

export interface MetaRow {
  key: string;
  value: unknown;
}

export class IchigoDB extends Dexie {
  meta!: EntityTable<MetaRow, "key">;
  items!: EntityTable<Item, "id">;
  cards!: EntityTable<StudyCard, "id">;
  reviews!: EntityTable<ReviewRecord, "id">;

  constructor(name = "ichigo") {
    super(name);
    this.version(1).stores({
      meta: "key",
      items: "id, kind, lang, addedAt",
      cards: "id, itemId, type, due",
      reviews: "++id, cardId, at",
    });
  }
}

export const db = new IchigoDB();

export async function getProfile(): Promise<Profile | undefined> {
  const row = await db.meta.get("profile");
  return row?.value as Profile | undefined;
}

export async function saveProfile(profile: Profile): Promise<void> {
  await db.meta.put({ key: "profile", value: profile });
}

/** Ask the browser not to evict our data under storage pressure. */
export async function requestPersistentStorage(): Promise<boolean> {
  try {
    if (navigator.storage?.persist) return await navigator.storage.persist();
  } catch {
    /* not supported */
  }
  return false;
}
