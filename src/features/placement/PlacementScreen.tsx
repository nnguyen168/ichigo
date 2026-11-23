import { useMemo, useRef, useState } from "react";
import { useApp } from "../../app/context";
import {
  applyPlacement,
  bandItems,
  bucketChars,
  describeBand,
  EXPERIENCES,
  nextBand,
  nextBucket,
  resultBand,
  SCRIPT_PASS,
  startBand,
  type BandState,
} from "../../core/placement";
import type { Experience, PlacementResult } from "../../core/types";
import type { Band, PlacementItem, ScriptChar } from "../../lang/types";
import { JaText } from "../../components/JaText";
import { KanaInput, type KanaInputHandle } from "../../components/KanaInput";

type Phase =
  | { kind: "experience" }
  | { kind: "script"; bucket: number; chars: ScriptChar[]; index: number; correct: number }
  | { kind: "reading"; band: Band; items: PlacementItem[]; index: number; correct: number }
  | { kind: "result" };

/**
 * Placement check: a few minutes to find what the learner already knows, so training starts at
 * the right place (no alphabet drills for someone who reads kana).
 */
export function PlacementScreen() {
  const { pack, profile, navigate } = useApp();
  const trainer = pack.scriptTrainer;
  const [phase, setPhase] = useState<Phase>({ kind: "experience" });
  const [experience, setExperience] = useState<Experience>("none");
  const [buckets, setBuckets] = useState<Record<string, boolean>>({});
  const [bands, setBands] = useState<BandState>({ passed: [], failed: [] });
  const [answers, setAnswers] = useState<PlacementResult["answers"]>([]);
  const [saving, setSaving] = useState(false);

  const startReading = (exp: Experience, bucketResults: Record<string, boolean>) => {
    const first = trainer?.placementBuckets[0];
    const canRead = !trainer || (first ? bucketResults[first.id] === true : true);
    const band = startBand(exp);
    if (!band || !canRead) return setPhase({ kind: "result" });
    setPhase({ kind: "reading", band, items: bandItems(pack.placement.items, band), index: 0, correct: 0 });
  };

  const chooseExperience = (exp: Experience) => {
    setExperience(exp);
    if (exp === "none") return setPhase({ kind: "result" });
    const b = trainer ? nextBucket(trainer, {}) : null;
    if (trainer && b !== null) setPhase({ kind: "script", bucket: b, chars: bucketChars(trainer, b), index: 0, correct: 0 });
    else startReading(exp, {});
  };

  const answerScript = (ok: boolean) => {
    if (phase.kind !== "script" || !trainer) return;
    const correct = phase.correct + (ok ? 1 : 0);
    if (phase.index + 1 < phase.chars.length) return setPhase({ ...phase, index: phase.index + 1, correct });
    const results = { ...buckets, [trainer.placementBuckets[phase.bucket]!.id]: correct >= SCRIPT_PASS };
    setBuckets(results);
    const b = nextBucket(trainer, results);
    if (b !== null) setPhase({ kind: "script", bucket: b, chars: bucketChars(trainer, b), index: 0, correct: 0 });
    else startReading(experience, results);
  };

  const answerReading = (item: PlacementItem, ok: boolean) => {
    if (phase.kind !== "reading") return;
    setAnswers((a) => [...a, { itemId: item.id, correct: ok }]);
    const correct = phase.correct + (ok ? 1 : 0);
    if (phase.index + 1 < phase.items.length) return setPhase({ ...phase, index: phase.index + 1, correct });
    const { state, next } = nextBand(bands, phase.band, correct);
    setBands(state);
    if (next) setPhase({ kind: "reading", band: next, items: bandItems(pack.placement.items, next), index: 0, correct: 0 });
    else setPhase({ kind: "result" });
  };

  const finish = async () => {
    setSaving(true);
    const result: PlacementResult = {
      takenAt: new Date(),
      experience,
      scriptBucketsKnown: Object.entries(buckets)
        .filter(([, ok]) => ok)
        .map(([id]) => id),
      band: resultBand(bands),
      answers,
    };
    await applyPlacement(pack, profile, result);
    navigate("today");
  };

  return (
    <div className="space-y-5 pt-2">
      <Steps phase={phase} />
      {phase.kind === "experience" && <ExperienceStep onChoose={chooseExperience} />}
      {phase.kind === "script" && trainer && (
        <ScriptStep
          key={`${phase.bucket}:${phase.index}`}
          label={trainer.placementBuckets[phase.bucket]!.label}
          char={phase.chars[phase.index]!}
          index={phase.index}
          total={phase.chars.length}
          check={(c, v) => trainer.checkTyped(c, v)}
          onAnswer={answerScript}
        />
      )}
      {phase.kind === "reading" && (
        <ReadingStep
          key={`${phase.band}:${phase.index}`}
          item={phase.items[phase.index]!}
          index={phase.index}
          total={phase.items.length}
          readingAids={pack.placement.bands.find((b) => b.band === phase.band)?.readingAids ?? true}
          onAnswer={answerReading}
        />
      )}
      {phase.kind === "result" && (
        <ResultStep
          experience={experience}
          buckets={buckets}
          band={resultBand(bands)}
          saving={saving}
          onFinish={() => void finish()}
        />
      )}
    </div>
  );
}

function Steps({ phase }: { phase: Phase }) {
  const steps = ["Background", "Reading kana", "Understanding", "Your plan"];
  const current = { experience: 0, script: 1, reading: 2, result: 3 }[phase.kind];
  return (
    <ol className="flex gap-1.5" aria-label="Placement steps">
      {steps.map((s, i) => (
        <li key={s} className="flex-1">
          <div className={`h-1.5 rounded-full ${i <= current ? "bg-accent" : "bg-surface-2"}`} />
          <span className={`mt-1 block text-[11px] ${i === current ? "font-semibold text-text" : "text-muted"}`}>{s}</span>
        </li>
      ))}
    </ol>
  );
}

function ExperienceStep({ onChoose }: { onChoose: (e: Experience) => void }) {
  const { pack } = useApp();
  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Let's find your level</h1>
        <p className="mt-1 text-muted">
          A short check — about 5 minutes — so you never sit through things you already know. How much {pack.name} do you
          know?
        </p>
      </div>
      <div className="space-y-2">
        {EXPERIENCES.map((e) => (
          <button
            key={e.value}
            onClick={() => onChoose(e.value)}
            className="card flex w-full flex-col items-start !py-3.5 text-left transition hover:border-accent"
          >
            <span className="font-semibold">{e.label}</span>
            <span className="text-sm text-muted">{e.detail}</span>
          </button>
        ))}
      </div>
      <p className="text-xs text-muted">
        You'll be asked to read characters and pick what sentences mean. "I don't know" is always fine — guessing only makes the
        result less useful.
      </p>
    </section>
  );
}

function ScriptStep({
  label,
  char,
  index,
  total,
  check,
  onAnswer,
}: {
  label: string;
  char: ScriptChar;
  index: number;
  total: number;
  check: (c: ScriptChar, v: string) => boolean;
  onAnswer: (ok: boolean) => void;
}) {
  const input = useRef<KanaInputHandle>(null);
  return (
    <section className="card space-y-5 !p-6">
      <div className="flex items-center justify-between text-sm text-muted">
        <span className="font-semibold text-text">{label}</span>
        <span>
          {index + 1} / {total}
        </span>
      </div>
      <p className="text-center text-sm text-muted">Type how it's read in romaji, then press Enter.</p>
      <p className="jp text-center text-7xl" lang="ja">
        {char.char}
      </p>
      <KanaInput
        ref={input}
        toKana={false}
        autoFocus
        ariaLabel="Romaji"
        placeholder="romaji"
        onSubmit={(v) => v.trim() && onAnswer(check(char, v))}
      />
      <div className="grid grid-cols-2 gap-2">
        <button className="btn-secondary" onClick={() => onAnswer(false)}>
          I don't know
        </button>
        <button
          className="btn-primary"
          onClick={() => {
            const v = input.current?.value() ?? "";
            if (v.trim()) onAnswer(check(char, v));
          }}
        >
          Next
        </button>
      </div>
    </section>
  );
}

function ReadingStep({
  item,
  index,
  total,
  readingAids,
  onAnswer,
}: {
  item: PlacementItem;
  index: number;
  total: number;
  readingAids: boolean;
  onAnswer: (item: PlacementItem, ok: boolean) => void;
}) {
  const options = useMemo(
    () =>
      [
        { text: item.en, ok: true },
        ...item.distractors.map((d) => ({ text: d, ok: false })),
      ].sort(() => Math.random() - 0.5),
    [item],
  );
  return (
    <section className="card space-y-5 !p-6">
      <div className="flex items-center justify-between text-sm text-muted">
        <span className="font-semibold text-text">What does this mean?</span>
        <span>
          {index + 1} / {total}
        </span>
      </div>
      <JaText text={item.text} className="text-2xl font-medium" romaji={false} furigana={readingAids} />
      <div className="space-y-2">
        {options.map((o) => (
          <button
            key={o.text}
            onClick={() => onAnswer(item, o.ok)}
            className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-left transition hover:border-accent"
          >
            {o.text}
          </button>
        ))}
        <button className="btn-ghost w-full" onClick={() => onAnswer(item, false)}>
          I don't know
        </button>
      </div>
    </section>
  );
}

function ResultStep({
  experience,
  buckets,
  band,
  saving,
  onFinish,
}: {
  experience: Experience;
  buckets: Record<string, boolean>;
  band: number;
  saving: boolean;
  onFinish: () => void;
}) {
  const { pack } = useApp();
  const trainer = pack.scriptTrainer;
  const level = describeBand(pack, band);
  const known = trainer?.placementBuckets.filter((b) => buckets[b.id]) ?? [];
  const toLearn = trainer?.placementBuckets.filter((b) => !buckets[b.id]) ?? [];
  const quickLevels = pack.knownSeedLevels(band);
  const beyondSeed = band >= 3;

  return (
    <section className="space-y-4">
      <div>
        <p className="text-sm font-medium text-accent">Your starting point</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">{level.title}</h1>
        <p className="text-muted">
          {level.detail}
          {band > 0 && " · reading comprehension"}
        </p>
      </div>

      <div className="card space-y-3 text-sm">
        <h2 className="text-base font-semibold">What this changes</h2>
        <ul className="space-y-2">
          {trainer && known.length > 0 && (
            <li>
              <span className="font-semibold text-leaf">✓ Skipping lessons for:</span>{" "}
              {known.length === trainer.placementBuckets.length ? "all of hiragana and katakana" : known.map((b) => b.label).join(" · ")}.
              They'll show up only for occasional check-ups.
            </li>
          )}
          {trainer && toLearn.length > 0 && experience !== "none" && (
            <li>
              <span className="font-semibold">To learn:</span> {toLearn.map((b) => b.label).join(" · ")}.
            </li>
          )}
          {experience === "none" && <li>We'll start with the sounds and writing system, plus survival phrases from Day 1.</li>}
          {trainer && buckets[trainer.placementBuckets[0]?.id ?? ""] && (
            <li>Romaji is turned off: you can already read kana, and romaji would slow you down.</li>
          )}
          {quickLevels.length > 0 && (
            <li>
              Basic phrases become <span className="font-semibold">quick checks</span>: say it, then mark "Knew it" or "Teach
              me". Only what you don't know gets a full lesson.
            </li>
          )}
          {beyondSeed && (
            <li className="rounded-xl bg-warn-soft p-3 text-warn">
              Most of the current starter deck is below your level. Your main practice will be the AI conversation missions and
              personal phrases from upcoming updates — use the deck for a quick tune-up of everyday phrases meanwhile.
            </li>
          )}
        </ul>
        <p className="text-xs text-muted">
          This checks reading only. Speaking usually lags behind reading — the daily practice targets exactly that.
        </p>
      </div>

      <button className="btn-primary w-full py-3.5 text-base" disabled={saving} onClick={onFinish}>
        {saving ? "Setting things up…" : "Start my plan"}
      </button>
    </section>
  );
}
