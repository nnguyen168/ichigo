import { useLiveQuery } from "dexie-react-hooks";
import { useState } from "react";
import { useApp } from "../../app/context";
import { addKanaGroup, learnedKanaGroups } from "../../core/learning";
import type { ScriptGroup } from "../../lang/types";
import { SpeakButton } from "../../components/SpeakButton";

/** Kana lessons: a few characters at a time, each with sound and a mnemonic, then into reviews. */
export function KanaScreen() {
  const { pack, navigate } = useApp();
  const trainer = pack.scriptTrainer;
  const learned = useLiveQuery(() => learnedKanaGroups(), []);
  const [open, setOpen] = useState<string | null>(null);

  if (!trainer || !learned) return null;
  const nextGroup = trainer.groups.find((g) => !learned.has(g.id));
  const lessonGroup = trainer.groups.find((g) => g.id === open) ?? nextGroup;
  const scripts = [...new Set(trainer.groups.map((g) => g.script))];

  return (
    <div className="space-y-6 pt-2">
      <section>
        <h1 className="text-2xl font-bold tracking-tight">Kana</h1>
        <p className="mt-1 text-sm text-muted">
          Japanese sounds are written with two syllable alphabets. Learn a few at a time; reviews take care of the rest.
          Aim to finish hiragana by Day 3 and katakana by Day 5.
        </p>
      </section>

      {lessonGroup ? (
        <Lesson
          key={lessonGroup.id}
          group={lessonGroup}
          learned={learned.has(lessonGroup.id)}
          onDone={async () => {
            await addKanaGroup(pack, lessonGroup.id);
            setOpen(null);
          }}
          onReview={() => navigate("review")}
        />
      ) : (
        <div className="card text-center">
          <p className="text-lg font-semibold">All kana learned 🎉</p>
          <p className="mt-1 text-sm text-muted">Keep reviewing; they'll fade into the background as you read phrases.</p>
        </div>
      )}

      {scripts.map((script) => (
        <section key={script} className="space-y-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">{script}</h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {trainer.groups
              .filter((g) => g.script === script)
              .map((g) => {
                const done = learned.has(g.id);
                const isNext = g.id === nextGroup?.id;
                return (
                  <button
                    key={g.id}
                    onClick={() => setOpen(g.id)}
                    className={`flex items-center justify-between rounded-xl border px-3 py-2.5 text-left text-sm transition hover:border-accent ${
                      lessonGroup?.id === g.id ? "border-accent" : "border-border"
                    } ${done ? "bg-leaf-soft/60" : "bg-surface"}`}
                  >
                    <span className="jp">{g.label}</span>
                    <span className={`text-xs font-semibold ${done ? "text-leaf" : isNext ? "text-accent" : "text-muted"}`}>
                      {done ? "✓" : isNext ? "next" : ""}
                    </span>
                  </button>
                );
              })}
          </div>
        </section>
      ))}
    </div>
  );
}

function Lesson({
  group,
  learned,
  onDone,
  onReview,
}: {
  group: ScriptGroup;
  learned: boolean;
  onDone: () => Promise<void>;
  onReview: () => void;
}) {
  const { pack, say } = useApp();
  const chars = pack.scriptTrainer!.chars.filter((c) => c.group === group.id);
  const [heard, setHeard] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  return (
    <section className="card space-y-4 !p-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-accent">{learned ? "Learned" : "Lesson"}</p>
        <h2 className="jp mt-1 text-xl font-bold">{group.label}</h2>
        {group.intro && <p className="mt-2 text-sm text-muted">{group.intro}</p>}
      </div>
      <p className="text-sm font-medium">Tap each one, listen, and say it out loud.</p>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {chars.map((c) => (
          <button
            key={c.id}
            onClick={() => {
              void say(c.char);
              setHeard((h) => new Set(h).add(c.id));
            }}
            className={`flex items-center gap-3 rounded-xl border p-3 text-left transition hover:border-accent ${
              heard.has(c.id) ? "border-leaf/40 bg-leaf-soft" : "border-border bg-surface"
            }`}
          >
            <span className="jp w-14 shrink-0 text-center text-4xl" lang="ja">
              {c.char}
            </span>
            <span className="min-w-0">
              <span className="block font-semibold">{c.romaji}</span>
              {c.mnemonic && <span className="block text-xs text-muted">{c.mnemonic}</span>}
            </span>
          </button>
        ))}
      </div>
      {chars.length > 0 && (
        <div className="flex gap-2">
          <SpeakButton text={chars.map((c) => c.char).join("、")} label="Play all" />
          {learned ? (
            <button className="btn-primary flex-1" onClick={onReview}>
              Go to review
            </button>
          ) : (
            <button
              className="btn-primary flex-1"
              disabled={saving}
              onClick={async () => {
                setSaving(true);
                await onDone();
                setSaving(false);
              }}
            >
              Add {chars.length} to reviews
            </button>
          )}
        </div>
      )}
    </section>
  );
}
