import { createContext, useContext } from "react";
import type { LanguagePack } from "../lang/types";
import type { Profile } from "../core/types";

export interface AppCtx {
  pack: LanguagePack;
  profile: Profile;
  day: number;
  /** Romaji crutch currently shown (auto = Days 1–5). */
  romajiOn: boolean;
  furiganaOn: boolean;
  say: (text: string, opts?: { slow?: boolean; vary?: boolean }) => Promise<void>;
  navigate: (route: Route) => void;
}

export type Route = "today" | "review" | "learn" | "kana" | "settings";

export const AppContext = createContext<AppCtx | null>(null);

export function useApp(): AppCtx {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp outside AppContext");
  return ctx;
}
