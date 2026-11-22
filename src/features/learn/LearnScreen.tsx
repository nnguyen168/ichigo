import { useEffect, useState } from "react";
import { useApp } from "../../app/context";
import { variants } from "../../core/chunks";
import { addChunk, chunkQueue, countDue, learnedChunkIds, todayStats } from "../../core/learning";
import { newChunkTarget } from "../../core/planner";
import type { SeedChunk } from "../../lang/types";
import { JaText } from "../../components/JaText";
import { SpeakButton } from "../../components/SpeakButton";

/**
 * New phrases: hear it, notice its structure, say it in several variants (immediate retrieval),
 * then it joins the review queue.
 */
export function LearnScreen() {
  const { pack, profile, navigate } = useApp();
  const [queue, setQueue] = useState<SeedChunk[] | null>(null);
  const [left, setLeft] = useState(0);
  const [addedNow, setAddedNow] = useState(0);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    void (async () => {
      const [ids, stats, due] = await Promise.all([learnedChunkIds(), todayStats(), countDue()]);
      const target = newChunkTarget(profile.dailyMinutes, due);
      setQueue(chunkQueue(pack, profile, ids));
      setLeft(Math.max(0, target - stats.chunksAddedToday));
    })();
  }, [pack, profile]);

  if (!queue) return null;

  const chunk = queue[index];
  if (!chunk || left - addedNow <= 0) {
    return (
      <div className="space-y-4 pt-6 text-center">
        <p className="jp text-5xl text-accent">一語</p>
        <h1 className="text-2xl font-bold">
          {!chunk ? "You've learned every seed phrase" : addedNow > 0 ? `${addedNow} new phrases learned` : "Today's new phrases are done"}
        </h1>
        <p className="text-muted">
          {!chunk
            ? "Personal phrases generated from your goals arrive in a later update."
            : "Recall beats re-reading: they'll come back in Review at the right moment."}
        </p>
        <div className="flex flex-wrap justify-center gap-2 pt-2">
          <button className="btn-primary" onClick={() => navigate("review")}>
            Review now
          </button>
          {chunk && (
            <button className="btn-secondary" onClick={() => setLeft((l) => l + 5)}>
              Learn 5 more
            </button>
          )}
        </div>
      </div>
    );
  }

  const next = async (learn: boolean) => {
    if (learn) {
      await addChunk(pack.code, chunk);
      setAddedNow((n) => n + 1);
    }
    setIndex((i) => i + 1);
  };

  return (
    <div className="space-y-4 pt-2">
      <div className="flex items-center justify-between text-sm text-muted">
        <span className="chip">{pack.topics.find((t) => t.id === chunk.topic)?.label}</span>
        <span>{left - addedNow} to go today</span>
      </div>
      <ChunkLesson key={chunk.id} chunk={chunk} onLearn={() => void next(true)} onSkip={() => void next(false)} />
    </div>
  );
}

function ChunkLesson({ chunk, onLearn, onSkip }: { chunk: SeedChunk; onLearn: () => void; onSkip: () => void }) {
  const { say, pack } = useApp();
  const all = variants(chunk);
  const main = all[0]!;
  const practice = all.slice(0, 3);
  const [said, setSaid] = useState<boolean[]>(practice.map(() => false));

  useEffect(() => {
    void say(pack.plainText(main.text));
  }, [main.text, say, pack]);

  const allSaid = said.every(Boolean);

  return (
    <div className="card space-y-5 !p-6">
      <div>
        {chunk.cue && <p className="mb-1 text-sm text-muted">{chunk.cue}</p>}
        <div className="flex items-start justify-between gap-3">
          <JaText text={main.text} className="text-3xl font-medium" />
          <div className="flex shrink-0 gap-1.5">
            <SpeakButton text={main.text} />
            <SpeakButton text={main.text} slow />
          </div>
        </div>
        <p className="mt-2 text-lg">{main.en}</p>
        {chunk.lit && <p className="text-sm text-muted">Literally: {chunk.lit}</p>}
        {chunk.note && <p className="mt-3 rounded-xl bg-surface-2 p-3 text-sm text-muted">{chunk.note}</p>}
      </div>

      <div className="space-y-2">
        <p className="text-sm font-semibold">
          {practice.length > 1 ? "Say each version out loud" : "Say it out loud three times"}
        </p>
        {(practice.length > 1 ? practice : [main, main, main]).map((v, i) => (
          <button
            key={i}
            onClick={() => {
              void say(pack.plainText(v.text));
              setSaid((s) => s.map((x, j) => (j === i ? true : x)));
            }}
            className={`flex w-full items-center justify-between gap-3 rounded-xl border px-3 py-2.5 text-left transition ${
              said[i] ? "border-leaf/40 bg-leaf-soft" : "border-border bg-surface hover:border-accent"
            }`}
          >
            <span>
              <JaText text={v.text} className="text-lg" romaji={false} />
              {practice.length > 1 && <span className="block text-xs text-muted">{v.en}</span>}
            </span>
            <span className="text-xs font-semibold text-muted">{said[i] ? "✓ said" : "tap, listen, repeat"}</span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-[auto_1fr] gap-2">
        <button className="btn-ghost" onClick={onSkip}>
          Skip
        </button>
        <button className="btn-primary" onClick={onLearn}>
          {allSaid ? "Got it — add to reviews" : "Add to reviews"}
        </button>
      </div>
    </div>
  );
}
