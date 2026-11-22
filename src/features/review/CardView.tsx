import { useEffect, useMemo, useRef, useState } from "react";
import { useApp } from "../../app/context";
import { filled, randomAlternateVariant } from "../../core/chunks";
import { suggestGrade } from "../../core/grading";
import { flagChunk, type DueCard } from "../../core/learning";
import type { GradeValue } from "../../core/scheduler";
import type { ChunkItem, KanaItem, ReviewRecord } from "../../core/types";
import { FlagIcon } from "../../components/icons";
import { JaText } from "../../components/JaText";
import { KanaInput, type KanaInputHandle } from "../../components/KanaInput";
import { SpeakButton } from "../../components/SpeakButton";

export interface Outcome {
  mode: ReviewRecord["mode"];
  suggested?: GradeValue;
  answer?: string;
  answeredAt: number;
}

interface Props {
  due: DueCard;
  outcome: Outcome | null;
  onOutcome: (o: Outcome) => void;
}

export function CardView({ due, outcome, onOutcome }: Props) {
  const { card, item } = due;
  if (item.kind === "kana") {
    return card.type === "kana-listen" ? (
      <KanaListen item={item} outcome={outcome} onOutcome={onOutcome} />
    ) : (
      <KanaRead item={item} outcome={outcome} onOutcome={onOutcome} />
    );
  }
  switch (card.type) {
    case "chunk-listen":
      return <ChunkListen item={item} outcome={outcome} onOutcome={onOutcome} />;
    case "chunk-slot":
      return <ChunkSay item={item} outcome={outcome} onOutcome={onOutcome} slot />;
    default:
      return <ChunkSay item={item} outcome={outcome} onOutcome={onOutcome} />;
  }
}

type Inner<T> = { item: T; outcome: Outcome | null; onOutcome: (o: Outcome) => void };

function Shell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="card min-h-72 space-y-5 !p-6">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
      {children}
    </div>
  );
}

/** Enter/Space reveals when no input is focused. */
function useRevealKey(onReveal: () => void, enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        onReveal();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onReveal, enabled]);
}

// ── Kana ──────────────────────────────────────────────────────────────

function KanaRead({ item, outcome, onOutcome }: Inner<KanaItem>) {
  const { pack, say } = useApp();
  const input = useRef<KanaInputHandle>(null);
  const [typed, setTyped] = useState<{ value: string; ok: boolean } | null>(null);

  const check = (value: string) => {
    if (outcome) return;
    const v = value.trim();
    if (!v) return reveal();
    const ok = pack.scriptTrainer!.checkTyped(item.kana, v);
    setTyped({ value: v, ok });
    void say(item.kana.char);
    onOutcome({ mode: "typed", suggested: ok ? 3 : 1, answer: v, answeredAt: Date.now() });
  };
  const reveal = () => {
    if (outcome) return;
    void say(item.kana.char);
    onOutcome({ mode: "spoken", answeredAt: Date.now() });
  };
  useRevealKey(reveal, !outcome);

  return (
    <Shell label="Read it aloud — or type the romaji">
      <p className="jp text-center text-7xl font-medium" lang="ja">
        {item.kana.char}
      </p>
      {!outcome ? (
        <div className="space-y-3">
          <KanaInput ref={input} toKana={false} ariaLabel="Romaji" placeholder="romaji (optional)" onSubmit={check} autoFocus={false} />
          <div className="grid grid-cols-2 gap-2">
            <button className="btn-secondary" onClick={reveal}>
              I said it — show
            </button>
            <button className="btn-primary" onClick={() => check(input.current?.value() ?? "")}>
              Check
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-2 text-center">
          <p className="text-3xl font-semibold">{item.kana.romaji}</p>
          {typed && (
            <p className={typed.ok ? "text-leaf" : "text-accent-strong"}>
              {typed.ok ? "Correct" : `You typed "${typed.value}"`}
            </p>
          )}
          {item.kana.mnemonic && <p className="text-sm text-muted">{item.kana.mnemonic}</p>}
          <SpeakButton text={item.kana.char} />
        </div>
      )}
    </Shell>
  );
}

function KanaListen({ item, outcome, onOutcome }: Inner<KanaItem>) {
  const { pack, say } = useApp();
  const options = useMemo(() => {
    const opts = [item.kana, ...pack.scriptTrainer!.distractors(item.kana, 3)];
    return opts.sort(() => Math.random() - 0.5);
  }, [item.kana, pack]);
  const [picked, setPicked] = useState<string | null>(null);

  useEffect(() => {
    void say(item.kana.char);
  }, [item.kana.char, say]);

  const pick = (id: string) => {
    if (outcome) return;
    setPicked(id);
    const ok = id === item.kana.id;
    onOutcome({ mode: "recognize", suggested: ok ? 3 : 1, answer: id, answeredAt: Date.now() });
  };

  return (
    <Shell label="Which one did you hear?">
      <div className="flex justify-center">
        <SpeakButton text={item.kana.char} label="Play again" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        {options.map((o) => {
          const isAnswer = o.id === item.kana.id;
          const state = !outcome ? "" : isAnswer ? "border-leaf bg-leaf-soft" : picked === o.id ? "border-accent bg-accent-soft" : "opacity-50";
          return (
            <button
              key={o.id}
              onClick={() => pick(o.id)}
              className={`jp rounded-2xl border border-border bg-surface py-5 text-5xl transition hover:border-accent ${state}`}
              lang="ja"
            >
              {o.char}
            </button>
          );
        })}
      </div>
      {outcome && <p className="text-center text-muted">{item.kana.char} = {item.kana.romaji}</p>}
    </Shell>
  );
}

// ── Chunks ────────────────────────────────────────────────────────────

function ChunkListen({ item, outcome, onOutcome }: Inner<ChunkItem>) {
  const { say, pack } = useApp();
  const v = filled(item.chunk);
  const reveal = () => !outcome && onOutcome({ mode: "recognize", answeredAt: Date.now() });
  useRevealKey(reveal, !outcome);

  useEffect(() => {
    void say(pack.plainText(v.text), { vary: true });
  }, [v.text, say, pack]);

  return (
    <Shell label="Listen — what does it mean?">
      <div className="flex justify-center gap-2">
        <SpeakButton text={v.text} vary label="Play" />
        <SpeakButton text={v.text} slow />
      </div>
      {!outcome ? (
        <button className="btn-primary w-full" onClick={reveal}>
          Show meaning
        </button>
      ) : (
        <ChunkAnswer item={item} text={v.text} en={v.en} />
      )}
    </Shell>
  );
}

function ChunkSay({ item, outcome, onOutcome, slot }: Inner<ChunkItem> & { slot?: boolean }) {
  const { pack, say } = useApp();
  const base = filled(item.chunk);
  // Slot cards ask for a different filler than the canonical one; stable for this showing.
  const target = useMemo(() => (slot ? randomAlternateVariant(item.chunk) : filled(item.chunk)), [slot, item.chunk]);
  const input = useRef<KanaInputHandle>(null);
  const [typed, setTyped] = useState<{ value: string; sim: number } | null>(null);

  const finish = (value: string) => {
    if (outcome) return;
    void say(pack.plainText(target.text));
    const v = value.trim();
    if (!v) return onOutcome({ mode: "spoken", answeredAt: Date.now() });
    const s = suggestGrade(pack.toComparable(v), [pack.toComparable(target.text)]);
    setTyped({ value: v, sim: s.similarity });
    onOutcome({ mode: "typed", suggested: s.grade, answer: v, answeredAt: Date.now() });
  };
  useRevealKey(() => finish(""), !outcome);

  return (
    <Shell label={slot ? "Swap the slot — say the new version" : "Say it in Japanese"}>
      {slot ? (
        <div className="space-y-3">
          <div className="rounded-xl bg-surface-2 p-3">
            <JaText text={base.text} className="text-xl" />
            <p className="text-sm text-muted">{base.en}</p>
          </div>
          <p className="text-lg">
            Now say: <span className="font-semibold">{target.en}</span>
          </p>
        </div>
      ) : (
        <div className="space-y-1">
          {item.chunk.cue && <p className="text-sm text-muted">{item.chunk.cue}</p>}
          <p className="text-2xl font-semibold leading-snug">{target.en}</p>
        </div>
      )}
      {!outcome ? (
        <div className="space-y-3">
          <KanaInput ref={input} ariaLabel="Your answer" placeholder="Type it (optional) — romaji turns into kana" onSubmit={finish} />
          <div className="grid grid-cols-2 gap-2">
            <button className="btn-secondary" onClick={() => finish("")}>
              I said it — show
            </button>
            <button className="btn-primary" onClick={() => finish(input.current?.value() ?? "")}>
              Check
            </button>
          </div>
        </div>
      ) : (
        <>
          {typed && (
            <p className={`text-sm ${typed.sim >= 0.95 ? "text-leaf" : typed.sim >= 0.8 ? "text-warn" : "text-accent-strong"}`}>
              You typed <span className="jp">{typed.value}</span> · {Math.round(typed.sim * 100)}% match
            </p>
          )}
          <ChunkAnswer item={item} text={target.text} en={target.en} />
        </>
      )}
    </Shell>
  );
}

function ChunkAnswer({ item, text, en }: { item: ChunkItem; text: string; en: string }) {
  const [flagged, setFlagged] = useState(Boolean(item.flagged));
  return (
    <div className="space-y-3 border-t border-border pt-4">
      <div className="flex items-start justify-between gap-3">
        <JaText text={text} className="text-3xl font-medium" />
        <div className="flex shrink-0 gap-1.5">
          <SpeakButton text={text} />
          <SpeakButton text={text} slow />
        </div>
      </div>
      <p className="text-lg">{en}</p>
      {item.chunk.lit && <p className="text-sm text-muted">Literally: {item.chunk.lit}</p>}
      {item.chunk.note && <p className="rounded-xl bg-surface-2 p-3 text-sm text-muted">{item.chunk.note}</p>}
      <button
        className="btn-ghost !px-2 !py-1 text-xs"
        disabled={flagged}
        onClick={() => {
          void flagChunk(item.id, "Reported from review");
          setFlagged(true);
        }}
      >
        <FlagIcon />
        {flagged ? "Reported — thanks" : "Something looks wrong"}
      </button>
    </div>
  );
}
