import { useLiveQuery } from "dexie-react-hooks";
import { useCallback, useEffect, useMemo } from "react";
import { AppContext, type AppCtx, type Route } from "./app/context";
import { useHashRoute } from "./app/useHashRoute";
import { HomeIcon, KanaIcon, RepeatIcon, SparkIcon, GearIcon } from "./components/icons";
import { dayNumber } from "./core/dates";
import { db, requestPersistentStorage } from "./core/db";
import { speak } from "./core/speech";
import type { Profile } from "./core/types";
import { KanaScreen } from "./features/kana/KanaScreen";
import { LearnScreen } from "./features/learn/LearnScreen";
import { ReviewScreen } from "./features/review/ReviewScreen";
import { SettingsScreen } from "./features/settings/SettingsScreen";
import { SetupScreen } from "./features/setup/SetupScreen";
import { TodayScreen } from "./features/today/TodayScreen";
import { getPack } from "./lang/registry";

const NAV: { route: Route; label: string; Icon: typeof HomeIcon }[] = [
  { route: "today", label: "Today", Icon: HomeIcon },
  { route: "review", label: "Review", Icon: RepeatIcon },
  { route: "learn", label: "Learn", Icon: SparkIcon },
  { route: "kana", label: "Kana", Icon: KanaIcon },
  { route: "settings", label: "Settings", Icon: GearIcon },
];

export function App() {
  // undefined = still loading; null = no profile yet.
  const profile = useLiveQuery(async () => ((await db.meta.get("profile"))?.value as Profile | undefined) ?? null);
  const dueCount = useLiveQuery(() => db.cards.where("due").belowOrEqual(Date.now()).count(), [], 0);

  useEffect(() => {
    void requestPersistentStorage();
  }, []);

  if (profile === undefined) return <Splash />;
  if (profile === null) return <SetupScreen />;
  return <Shell profile={profile} dueCount={dueCount} />;
}

function Splash() {
  return (
    <div className="grid min-h-dvh place-items-center">
      <span className="jp text-4xl text-accent">一語</span>
    </div>
  );
}

function Shell({ profile, dueCount }: { profile: Profile; dueCount: number }) {
  const [route, navigate] = useHashRoute();
  const pack = getPack(profile.lang);
  const day = dayNumber(profile.startDate);

  const say = useCallback(
    (text: string, opts?: { slow?: boolean; vary?: boolean }) =>
      speak(text, {
        locale: pack.speechLocale,
        voiceURI: profile.voiceURI,
        rate: opts?.slow ? Math.max(0.5, profile.speechRate * 0.65) : profile.speechRate,
        varyVoice: opts?.vary,
      }),
    [pack.speechLocale, profile.voiceURI, profile.speechRate],
  );

  const ctx: AppCtx = useMemo(
    () => ({
      pack,
      profile,
      day,
      romajiOn: profile.romaji === "on" || (profile.romaji === "auto" && day <= 5),
      furiganaOn: profile.furigana === "always",
      say,
      navigate,
    }),
    [pack, profile, day, say, navigate],
  );

  return (
    <AppContext.Provider value={ctx}>
      <div className="mx-auto flex min-h-dvh max-w-2xl flex-col">
        <header className="flex items-center justify-between px-4 pt-[max(env(safe-area-inset-top),1rem)] pb-2">
          <button className="flex items-baseline gap-2" onClick={() => navigate("today")}>
            <span className="text-lg font-bold tracking-tight">Ichigo</span>
            <span className="jp text-lg text-accent">一語</span>
          </button>
          <span className="chip">{day >= 1 ? `Day ${day}` : `Starts in ${1 - day}d`}</span>
        </header>
        <main className="flex-1 px-4 pb-28">
          {route === "today" && <TodayScreen />}
          {route === "review" && <ReviewScreen />}
          {route === "learn" && <LearnScreen />}
          {route === "kana" && <KanaScreen />}
          {route === "settings" && <SettingsScreen />}
        </main>
        <nav
          className="fixed inset-x-0 bottom-0 z-10 border-t border-border bg-surface/95 backdrop-blur pb-[env(safe-area-inset-bottom)]"
          aria-label="Main"
        >
          <ul className="mx-auto grid max-w-2xl grid-cols-5">
            {NAV.map(({ route: r, label, Icon }) => (
              <li key={r}>
                <button
                  onClick={() => navigate(r)}
                  className={`relative flex w-full flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium transition ${
                    route === r ? "text-accent" : "text-muted hover:text-text"
                  }`}
                  aria-current={route === r ? "page" : undefined}
                >
                  <Icon className="size-6" />
                  {label}
                  {r === "review" && dueCount > 0 && (
                    <span className="absolute top-1.5 left-[calc(50%+6px)] min-w-5 rounded-full bg-accent px-1 text-[10px] leading-5 text-on-accent">
                      {dueCount > 99 ? "99+" : dueCount}
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </AppContext.Provider>
  );
}
