import { useLiveQuery } from "dexie-react-hooks";
import { useApp, type Route } from "../../app/context";
import { buildPlan, type PlanBlock } from "../../core/planner";
import { chunkQueue, learnedChunkIds, learnedKanaGroups, nextKanaGroups, todayStats } from "../../core/learning";
import { db } from "../../core/db";

const ROUTE_FOR: Partial<Record<PlanBlock["kind"], Route>> = { review: "review", kana: "kana", learn: "learn" };

export function TodayScreen() {
  const { pack, profile, day, navigate } = useApp();

  const data = useLiveQuery(async () => {
    const [stats, kanaLearned, chunkIds, itemCount] = await Promise.all([
      todayStats(),
      learnedKanaGroups(),
      learnedChunkIds(),
      db.items.count(),
    ]);
    const kanaRemaining = nextKanaGroups(pack, kanaLearned).length;
    const chunksRemaining = chunkQueue(pack, profile, chunkIds).length;
    return { stats, kanaRemaining, chunksRemaining, itemCount };
  }, [pack, profile]);

  if (!data) return null;
  const { stats } = data;
  const plan = buildPlan({
    day,
    dailyMinutes: profile.dailyMinutes,
    due: stats.due,
    reviewedToday: stats.reviewedToday,
    kanaGroupsRemaining: data.kanaRemaining,
    kanaGroupsAddedToday: stats.kanaGroupsAddedToday,
    chunksRemaining: data.chunksRemaining,
    chunksAddedToday: stats.chunksAddedToday,
  });
  const progressDay = Math.min(Math.max(day, 0), 30);
  const backupStale =
    data.itemCount > 0 && (!profile.lastBackupAt || Date.now() - profile.lastBackupAt.getTime() > 7 * 86_400_000);

  return (
    <div className="space-y-5">
      <section className="pt-2">
        <p className="text-sm font-medium text-accent">{plan.phase}</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">
          {day < 1 ? "Your sprint hasn't started yet" : day <= 30 ? `Day ${day} of 30` : `Day ${day}`}
        </h1>
        <div
          className="mt-3 h-2 overflow-hidden rounded-full bg-surface-2"
          role="progressbar"
          aria-valuenow={progressDay}
          aria-valuemin={0}
          aria-valuemax={30}
          aria-label="Sprint progress"
        >
          <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${(progressDay / 30) * 100}%` }} />
        </div>
        {profile.mission && (
          <p className="mt-3 text-sm text-muted">
            <span className="font-semibold text-text">Mission: </span>
            {profile.mission}
          </p>
        )}
        {(profile.ifThen.when || profile.ifThen.where) && (
          <p className="mt-1 text-sm text-muted">
            <span className="font-semibold text-text">Plan: </span>
            {[profile.ifThen.when && `after ${profile.ifThen.when}`, profile.ifThen.where && `at ${profile.ifThen.where}`]
              .filter(Boolean)
              .join(", ")}
          </p>
        )}
      </section>

      <section className="grid grid-cols-3 gap-2 text-center">
        <Stat value={stats.totalChunks} label="phrases" />
        <Stat value={stats.totalKana} label="kana" />
        <Stat value={stats.spokenToday} label="said aloud today" />
      </section>

      <section className="space-y-2.5" aria-label="Today's plan">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Today's plan</h2>
        {plan.blocks.map((b) => (
          <BlockRow key={b.kind} block={b} onStart={ROUTE_FOR[b.kind] ? () => navigate(ROUTE_FOR[b.kind]!) : undefined} />
        ))}
      </section>

      {backupStale && (
        <section className="card border-warn/40 bg-warn-soft text-sm">
          <p className="font-semibold text-warn">Back up your progress</p>
          <p className="mt-1 text-muted">Everything lives in this browser. Export a backup file weekly in Settings.</p>
          <button className="btn-secondary mt-3" onClick={() => navigate("settings")}>
            Go to backup
          </button>
        </section>
      )}
    </div>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="card !p-3">
      <div className="text-2xl font-bold tabular-nums">{value}</div>
      <div className="text-xs text-muted">{label}</div>
    </div>
  );
}

function BlockRow({ block, onStart }: { block: PlanBlock; onStart?: () => void }) {
  const complete = block.available && block.target > 0 && block.done >= block.target;
  const nothing = block.kind === "review" && block.target === 0;
  return (
    <div className={`card flex items-center gap-4 !py-3.5 ${block.available ? "" : "opacity-55"}`}>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold">{block.title}</h3>
          {block.minutes > 0 && !complete && <span className="chip">~{block.minutes} min</span>}
          {(complete || nothing) && (
            <span className="chip !border-leaf/30 !bg-leaf-soft !text-leaf">{nothing ? "Nothing due" : "Done"}</span>
          )}
        </div>
        <p className="mt-0.5 text-sm text-muted">{block.detail}</p>
        {block.available && block.target > 0 && (
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-2">
            <div
              className={`h-full rounded-full ${complete ? "bg-leaf" : "bg-accent"}`}
              style={{ width: `${Math.min(100, (block.done / block.target) * 100)}%` }}
            />
          </div>
        )}
      </div>
      {onStart && block.available && (
        <button className={complete || nothing ? "btn-secondary" : "btn-primary"} onClick={onStart}>
          {complete || nothing ? "More" : "Start"}
        </button>
      )}
    </div>
  );
}
