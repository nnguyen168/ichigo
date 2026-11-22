import type { Profile } from "../../core/types";
import type { LanguagePack, TopicId } from "../../lang/types";

export function TopicPicker({ pack, value, onChange }: { pack: LanguagePack; value: TopicId[]; onChange: (t: TopicId[]) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {pack.topics
        .filter((t) => !t.core)
        .map((t) => {
          const on = value.includes(t.id);
          return (
            <button
              type="button"
              key={t.id}
              aria-pressed={on}
              title={t.description}
              onClick={() => onChange(on ? value.filter((v) => v !== t.id) : [...value, t.id])}
              className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${
                on ? "border-accent bg-accent-soft text-accent-strong" : "border-border bg-surface text-muted hover:text-text"
              }`}
            >
              {t.label}
            </button>
          );
        })}
    </div>
  );
}

const MINUTES: Profile["dailyMinutes"][] = [30, 60, 90, 120];

export function MinutesPicker({ value, onChange }: { value: Profile["dailyMinutes"]; onChange: (m: Profile["dailyMinutes"]) => void }) {
  return (
    <div className="grid grid-cols-4 gap-2" role="radiogroup">
      {MINUTES.map((m) => (
        <button
          type="button"
          role="radio"
          aria-checked={value === m}
          key={m}
          onClick={() => onChange(m)}
          className={`rounded-xl border py-2.5 text-sm font-semibold transition ${
            value === m ? "border-accent bg-accent-soft text-accent-strong" : "border-border bg-surface text-muted hover:text-text"
          }`}
        >
          {m} min
        </button>
      ))}
    </div>
  );
}
