import { db } from "./db";

export const BACKUP_FORMAT = "ichigo-backup";
export const BACKUP_VERSION = 1;

interface BackupFile {
  format: typeof BACKUP_FORMAT;
  version: number;
  exportedAt: string;
  tables: Record<"meta" | "items" | "cards" | "reviews", unknown[]>;
}

// Dates survive JSON as {"$date": "<iso>"}.
function replacer(this: Record<string, unknown>, key: string, value: unknown) {
  const raw = this[key];
  if (raw instanceof Date) return { $date: raw.toISOString() };
  return value;
}

function reviver(_key: string, value: unknown) {
  if (value && typeof value === "object" && "$date" in value && Object.keys(value).length === 1) {
    return new Date((value as { $date: string }).$date);
  }
  return value;
}

export async function exportBackup(): Promise<string> {
  const [meta, items, cards, reviews] = await Promise.all([
    db.meta.toArray(),
    db.items.toArray(),
    db.cards.toArray(),
    db.reviews.toArray(),
  ]);
  const file: BackupFile = {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    tables: { meta, items, cards, reviews },
  };
  return JSON.stringify(file, replacer);
}

/** Replaces ALL local data with the backup's contents. */
export async function importBackup(json: string): Promise<{ items: number; cards: number; reviews: number }> {
  const file = JSON.parse(json, reviver) as BackupFile;
  if (file.format !== BACKUP_FORMAT) throw new Error("This file is not an Ichigo backup.");
  if (file.version > BACKUP_VERSION) throw new Error("This backup was made by a newer version of Ichigo.");
  const t = file.tables;
  await db.transaction("rw", [db.meta, db.items, db.cards, db.reviews], async () => {
    await Promise.all([db.meta.clear(), db.items.clear(), db.cards.clear(), db.reviews.clear()]);
    await db.meta.bulkAdd(t.meta as never[]);
    await db.items.bulkAdd(t.items as never[]);
    await db.cards.bulkAdd(t.cards as never[]);
    await db.reviews.bulkAdd(t.reviews as never[]);
  });
  return { items: t.items.length, cards: t.cards.length, reviews: t.reviews.length };
}

export function downloadText(filename: string, text: string) {
  const blob = new Blob([text], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
