import { useLiveQuery } from "dexie-react-hooks";
import { useEffect, useRef, useState } from "react";
import { useApp } from "../../app/context";
import { downloadText, exportBackup, importBackup } from "../../core/backup";
import { localDate } from "../../core/dates";
import { db, saveProfile } from "../../core/db";
import { voicesFor } from "../../core/speech";
import type { ChunkItem, Profile } from "../../core/types";
import { MinutesPicker, TopicPicker } from "../setup/pickers";

export function SettingsScreen() {
  const { pack, profile, say } = useApp();
  const update = (patch: Partial<Profile>) => saveProfile({ ...profile, ...patch });

  return (
    <div className="space-y-6 pt-2">
      <h1 className="text-2xl font-bold tracking-tight">Settings</h1>

      <Section title="Your goal">
        <label className="label" htmlFor="mission">
          Day 30 mission
        </label>
        <textarea
          id="mission"
          className="input min-h-20"
          defaultValue={profile.mission}
          onBlur={(e) => void update({ mission: e.target.value.trim() })}
        />
        <span className="label mt-4">Topics</span>
        <TopicPicker pack={pack} value={profile.topics} onChange={(topics) => void update({ topics })} />
        <span className="label mt-4">Daily time</span>
        <MinutesPicker value={profile.dailyMinutes} onChange={(dailyMinutes) => void update({ dailyMinutes })} />
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="start">
              Day 1
            </label>
            <input
              id="start"
              type="date"
              className="input"
              defaultValue={profile.startDate}
              onChange={(e) => e.target.value && void update({ startDate: e.target.value })}
            />
          </div>
          <div>
            <span className="label">Study plan</span>
            <div className="grid grid-cols-2 gap-2">
              <input
                className="input"
                aria-label="After"
                placeholder="After…"
                defaultValue={profile.ifThen.when}
                onBlur={(e) => void update({ ifThen: { ...profile.ifThen, when: e.target.value.trim() } })}
              />
              <input
                className="input"
                aria-label="At"
                placeholder="At…"
                defaultValue={profile.ifThen.where}
                onBlur={(e) => void update({ ifThen: { ...profile.ifThen, where: e.target.value.trim() } })}
              />
            </div>
          </div>
        </div>
      </Section>

      <Section title="Reading aids">
        <Segmented
          label="Romaji under Japanese"
          value={profile.romaji}
          options={[
            ["auto", "Days 1–5"],
            ["on", "Always"],
            ["off", "Never"],
          ]}
          onChange={(romaji) => void update({ romaji })}
        />
        <p className="mt-1.5 text-xs text-muted">Romaji is a crutch: it helps on day one and slows you down by week two.</p>
        <div className="mt-4">
          <Segmented
            label="Furigana over kanji"
            value={profile.furigana}
            options={[
              ["always", "Show"],
              ["off", "Hide"],
            ]}
            onChange={(furigana) => void update({ furigana })}
          />
        </div>
      </Section>

      <Section title="Voice">
        <VoiceSettings
          locale={pack.speechLocale}
          profile={profile}
          onChange={(p) => void update(p)}
          onTest={() => void say("こんにちは。一緒に日本語を勉強しましょう。")}
        />
      </Section>

      <Section title="Backup">
        <BackupSettings profile={profile} onExported={() => void update({ lastBackupAt: new Date() })} />
      </Section>

      <Section title="Reported phrases">
        <Flagged />
      </Section>

      <Section title="About">
        <div className="space-y-2 text-sm text-muted">
          <p>
            Ichigo 一語 · v0.1 (milestone 1). Speaking-first, phrase-based, spaced repetition with FSRS. All data stays in this
            browser.
          </p>
          <p>
            The seed phrases were written by an AI and have not yet been checked by a native speaker. Use "Something looks
            wrong" on any card to flag it.
          </p>
          <p>
            Built with open-source software: ts-fsrs (MIT), WanaKana (MIT), Dexie (Apache-2.0), React (MIT). Speech uses your
            device's built-in voices.
          </p>
        </div>
        <DangerZone />
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="card">
      <h2 className="mb-4 text-base font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: [T, string][];
  onChange: (v: T) => void;
}) {
  return (
    <div>
      <span className="label">{label}</span>
      <div className="inline-flex rounded-xl border border-border bg-surface-2 p-1" role="radiogroup" aria-label={label}>
        {options.map(([v, text]) => (
          <button
            key={v}
            role="radio"
            aria-checked={value === v}
            onClick={() => onChange(v)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
              value === v ? "bg-surface text-text shadow-sm" : "text-muted hover:text-text"
            }`}
          >
            {text}
          </button>
        ))}
      </div>
    </div>
  );
}

function VoiceSettings({
  locale,
  profile,
  onChange,
  onTest,
}: {
  locale: string;
  profile: Profile;
  onChange: (p: Partial<Profile>) => void;
  onTest: () => void;
}) {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[] | null>(null);
  useEffect(() => {
    void voicesFor(locale).then(setVoices);
  }, [locale]);

  if (voices === null) return <p className="text-sm text-muted">Loading voices…</p>;
  return (
    <div className="space-y-4">
      {voices.length === 0 ? (
        <p className="rounded-xl bg-warn-soft p-3 text-sm text-warn">
          No Japanese voice found on this device. On iOS/macOS add one in Settings → Accessibility → Spoken Content → Voices; on
          Android install Google Text-to-speech; on Windows add the Japanese language pack.
        </p>
      ) : (
        <div>
          <label className="label" htmlFor="voice">
            Default voice ({voices.length} available)
          </label>
          <select
            id="voice"
            className="input"
            value={profile.voiceURI ?? ""}
            onChange={(e) => onChange({ voiceURI: e.target.value || undefined })}
          >
            <option value="">Automatic</option>
            {voices.map((v) => (
              <option key={v.voiceURI} value={v.voiceURI}>
                {v.name}
              </option>
            ))}
          </select>
          <p className="mt-1.5 text-xs text-muted">Listening cards rotate through all voices — hearing many speakers trains your ear.</p>
        </div>
      )}
      <div>
        <label className="label" htmlFor="rate">
          Speed: {profile.speechRate.toFixed(2)}×
        </label>
        <input
          id="rate"
          type="range"
          min={0.6}
          max={1.2}
          step={0.05}
          value={profile.speechRate}
          onChange={(e) => onChange({ speechRate: Number(e.target.value) })}
          className="w-full accent-[var(--accent)]"
        />
      </div>
      <button className="btn-secondary" onClick={onTest}>
        Test voice
      </button>
    </div>
  );
}

function BackupSettings({ profile, onExported }: { profile: Profile; onExported: () => void }) {
  const file = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState<string | null>(null);

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted">
        Your progress lives only in this browser. Export a backup weekly, and import it to move to another device.
        {profile.lastBackupAt && ` Last backup: ${profile.lastBackupAt.toLocaleDateString()}.`}
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          className="btn-primary"
          onClick={async () => {
            downloadText(`ichigo-backup-${localDate()}.json`, await exportBackup());
            onExported();
            setMsg("Backup downloaded.");
          }}
        >
          Export backup
        </button>
        <button className="btn-secondary" onClick={() => file.current?.click()}>
          Import backup…
        </button>
        <input
          ref={file}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={async (e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            if (!f) return;
            if (!confirm("Importing replaces ALL progress in this browser with the backup. Continue?")) return;
            try {
              const r = await importBackup(await f.text());
              setMsg(`Restored ${r.items} items, ${r.cards} cards and ${r.reviews} reviews.`);
            } catch (err) {
              setMsg(err instanceof Error ? err.message : "Import failed.");
            }
          }}
        />
      </div>
      {msg && <p className="text-sm text-leaf" role="status">{msg}</p>}
    </div>
  );
}

function Flagged() {
  const { pack } = useApp();
  const flagged = useLiveQuery(
    async () => ((await db.items.where("kind").equals("chunk").toArray()) as ChunkItem[]).filter((i) => i.flagged),
    [],
  );
  if (!flagged) return null;
  if (flagged.length === 0) return <p className="text-sm text-muted">Nothing reported. Flag a phrase from any review card.</p>;
  return (
    <ul className="space-y-2">
      {flagged.map((i) => (
        <li key={i.id} className="flex items-center justify-between gap-3 rounded-xl bg-surface-2 px-3 py-2 text-sm">
          <span>
            <span className="jp">{pack.plainText(i.chunk.text)}</span> <span className="text-muted">— {i.chunk.en}</span>
          </span>
          <button
            className="btn-ghost !px-2 !py-1 text-xs"
            onClick={() => void db.items.update(i.id, { flagged: undefined } as Partial<ChunkItem>)}
          >
            Unflag
          </button>
        </li>
      ))}
    </ul>
  );
}

function DangerZone() {
  return (
    <div className="mt-5 border-t border-border pt-4">
      <button
        className="btn-ghost !px-0 text-accent-strong"
        onClick={async () => {
          if (!confirm("Delete ALL progress in this browser? Export a backup first if you want to keep it.")) return;
          await db.delete();
          location.reload();
        }}
      >
        Delete all data…
      </button>
    </div>
  );
}
