import { useCallback, useEffect, useRef, useState } from "react";
import { useApp } from "../../app/context";
import { getDueCards, recordReview, type DueCard } from "../../core/learning";
import type { GradeValue } from "../../core/scheduler";
import type { ReviewRecord } from "../../core/types";
import { CardView, type Outcome } from "./CardView";
import { GradeBar } from "./GradeBar";

/** Cards whose next step is due within this window come back in the same session (learning steps). */
const LEARN_AHEAD_MS = 20 * 60_000;

interface SessionStats {
  reviewed: number;
  correct: number;
  spoken: number;
}

function interleave(cards: DueCard[]): DueCard[] {
  const a = [...cards];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  // Avoid two cards of the same item back to back where possible.
  for (let i = 1; i < a.length; i++) {
    if (a[i]!.item.id === a[i - 1]!.item.id) {
      const k = a.findIndex((c, idx) => idx > i && c.item.id !== a[i - 1]!.item.id);
      if (k > 0) [a[i], a[k]] = [a[k]!, a[i]!];
    }
  }
  return a;
}

/** Index of the next card that is due, or (when `early`) the soonest upcoming learning-step card. */
function pickNext(queue: DueCard[], now: number, early = false): number {
  const ready = queue.findIndex((d) => d.card.due <= now);
  if (ready >= 0 || !early) return ready;
  let best = -1;
  queue.forEach((d, i) => {
    if (d.card.due <= now + LEARN_AHEAD_MS && (best < 0 || d.card.due < queue[best]!.card.due)) best = i;
  });
  return best;
}

export function ReviewScreen() {
  const { navigate } = useApp();
  const [queue, setQueue] = useState<DueCard[] | null>(null);
  const [current, setCurrent] = useState<DueCard | null>(null);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [stats, setStats] = useState<SessionStats>({ reviewed: 0, correct: 0, spoken: 0 });
  const [busy, setBusy] = useState(false);
  const shownAt = useRef(Date.now());
  const [round, setRound] = useState(0);

  const advance = useCallback((q: DueCard[], early = false) => {
    const idx = pickNext(q, Date.now(), early);
    if (idx < 0) {
      setCurrent(null);
      setQueue(q);
      return;
    }
    const next = q[idx]!;
    setQueue(q.filter((_, i) => i !== idx));
    setCurrent(next);
    setOutcome(null);
    setRound((r) => r + 1);
    shownAt.current = Date.now();
  }, []);

  const load = useCallback(async () => {
    const due = await getDueCards(new Date());
    advance(interleave(due));
  }, [advance]);

  useEffect(() => {
    void load();
  }, [load]);

  // While waiting on learning-step cards, resume automatically once one is due.
  useEffect(() => {
    if (current || !queue?.length) return;
    const t = setInterval(() => {
      if (queue.some((d) => d.card.due <= Date.now())) advance(queue);
    }, 10_000);
    return () => clearInterval(t);
  }, [current, queue, advance]);

  const grade = async (g: GradeValue) => {
    if (!current || !outcome || busy || !queue) return;
    setBusy(true);
    const info: Omit<ReviewRecord, "id" | "cardId" | "at" | "grade"> = {
      ms: outcome.answeredAt - shownAt.current,
      mode: outcome.mode,
      suggested: outcome.suggested,
      answer: outcome.answer,
    };
    const updated = await recordReview(current.card, g, info);
    setStats((s) => ({
      reviewed: s.reviewed + 1,
      correct: s.correct + (g >= 3 ? 1 : 0),
      spoken: s.spoken + (outcome.mode === "spoken" ? 1 : 0),
    }));
    const q = [...queue];
    if (updated.due <= Date.now() + LEARN_AHEAD_MS) q.push({ card: updated, item: current.item });
    setBusy(false);
    advance(q);
  };

  if (queue === null) return null;

  // Only learning-step cards remain: spacing works best if you wait, but allow reviewing early.
  if (!current && queue.length > 0) {
    const soonest = Math.min(...queue.map((d) => d.card.due));
    const mins = Math.max(1, Math.ceil((soonest - Date.now()) / 60_000));
    return (
      <div className="space-y-4 pt-6 text-center">
        <p className="jp text-5xl">⏳</p>
        <h1 className="text-2xl font-bold">Short break</h1>
        <p className="text-muted">
          {queue.length} {queue.length === 1 ? "card comes" : "cards come"} back in about {mins} min. A little forgetting before
          recalling makes memories stronger — do some new phrases or kana meanwhile.
        </p>
        <div className="flex flex-wrap justify-center gap-2 pt-2">
          <button className="btn-secondary" onClick={() => advance(queue, true)}>
            Review early
          </button>
          <button className="btn-primary" onClick={() => navigate("learn")}>
            Learn new phrases
          </button>
        </div>
        <p className="text-xs text-muted">
          {stats.reviewed > 0 && `This session: ${stats.reviewed} reviews · ${stats.spoken} said out loud`}
        </p>
      </div>
    );
  }

  if (!current) {
    return (
      <div className="space-y-4 pt-6 text-center">
        <p className="jp text-5xl">🍓</p>
        <h1 className="text-2xl font-bold">{stats.reviewed > 0 ? "Session complete" : "Nothing due right now"}</h1>
        {stats.reviewed > 0 ? (
          <p className="text-muted">
            {stats.reviewed} reviews · {Math.round((stats.correct / stats.reviewed) * 100)}% recalled · {stats.spoken} said out loud
          </p>
        ) : (
          <p className="text-muted">Learn new phrases or kana, and they'll show up here when it's time to recall them.</p>
        )}
        <div className="flex justify-center gap-2 pt-2">
          <button className="btn-secondary" onClick={() => navigate("today")}>
            Back to today
          </button>
          <button className="btn-primary" onClick={() => navigate("learn")}>
            Learn new phrases
          </button>
        </div>
      </div>
    );
  }

  const remaining = queue.length + 1;
  return (
    <div className="space-y-4 pt-2">
      <div className="flex items-center justify-between text-sm text-muted">
        <span>{stats.reviewed} done</span>
        <span>{remaining} left</span>
      </div>
      <CardView key={`${current.card.id}:${round}`} due={current} onOutcome={setOutcome} outcome={outcome} />
      {outcome && <GradeBar card={current.card} suggested={outcome.suggested} onGrade={grade} disabled={busy} />}
    </div>
  );
}
