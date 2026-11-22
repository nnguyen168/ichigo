import { japanese } from "./ja";
import type { LanguagePack } from "./types";

const packs: Record<string, LanguagePack> = { ja: japanese };

export function getPack(code: string): LanguagePack {
  const pack = packs[code];
  if (!pack) throw new Error(`No language pack for "${code}"`);
  return pack;
}

export const availablePacks = Object.values(packs);
