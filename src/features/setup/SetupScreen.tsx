import { useState } from "react";
import { localDate } from "../../core/dates";
import { saveProfile } from "../../core/db";
import type { Profile } from "../../core/types";
import type { TopicId } from "../../lang/types";
import { getPack } from "../../lang/registry";
import { TopicPicker, MinutesPicker } from "./pickers";

/** First-run setup. A plain form for now; the AI goals interview replaces it in milestone 4. */
export function SetupScreen() {
  const pack = getPack("ja");
  const [mission, setMission] = useState("");
  const [topics, setTopics] = useState<TopicId[]>(["work", "food", "hobbies"]);
  const [minutes, setMinutes] = useState<Profile["dailyMinutes"]>(60);
  const [startDate, setStartDate] = useState(localDate());
  const [when, setWhen] = useState("");
  const [where, setWhere] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Next stop: the placement check.
    window.location.hash = "/placement";
    await saveProfile({
      lang: pack.code,
      startDate,
      dailyMinutes: minutes,
      topics,
      mission: mission.trim(),
      ifThen: { when: when.trim(), where: where.trim() },
      romaji: "auto",
      furigana: "always",
      speechRate: 0.95,
      createdAt: new Date(),
    });
  };

  return (
    <div className="mx-auto max-w-xl px-4 py-8 pt-[max(env(safe-area-inset-top),2rem)]">
      <div className="mb-8">
        <p className="jp text-5xl text-accent">一語</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight">Welcome to Ichigo</h1>
        <p className="mt-2 text-muted">
          Speak {pack.name} from day one, one phrase at a time. Five quick questions, then a short check of what you already know.
        </p>
      </div>

      <form onSubmit={submit} className="space-y-7">
        <section>
          <label className="label" htmlFor="mission">
            1. What do you want to do in {pack.name} by Day 30?
          </label>
          <textarea
            id="mission"
            className="input min-h-24"
            placeholder="e.g. Have a 10-minute chat with a tutor about my job, my family and food I like."
            value={mission}
            onChange={(e) => setMission(e.target.value)}
          />
          <p className="mt-1.5 text-xs text-muted">A concrete, spoken goal works best. You can change it later.</p>
        </section>

        <section>
          <span className="label">2. Which topics matter to you?</span>
          <p className="mb-2 text-xs text-muted">Survival, greetings and self-introduction are always included.</p>
          <TopicPicker pack={pack} value={topics} onChange={setTopics} />
        </section>

        <section>
          <span className="label">3. How much time can you give each day?</span>
          <MinutesPicker value={minutes} onChange={setMinutes} />
          <p className="mt-1.5 text-xs text-muted">A 30-day sprint works best at 60–90 minutes. Even 30 is real progress.</p>
        </section>

        <section>
          <label className="label" htmlFor="start">
            4. When is Day 1?
          </label>
          <input id="start" type="date" className="input" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
        </section>

        <section>
          <span className="label">5. Make a plan: when and where will you study?</span>
          <p className="mb-2 text-xs text-muted">
            "If-then" plans roughly double follow-through (Gollwitzer, 1999). Tie it to something you already do.
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            <input className="input" placeholder="After… (e.g. my morning coffee)" value={when} onChange={(e) => setWhen(e.target.value)} aria-label="After" />
            <input className="input" placeholder="At… (e.g. the kitchen table)" value={where} onChange={(e) => setWhere(e.target.value)} aria-label="At" />
          </div>
        </section>

        <button type="submit" className="btn-primary w-full py-3.5 text-base">
          Next: find my level
        </button>
      </form>
    </div>
  );
}
