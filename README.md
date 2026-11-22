# Ichigo 一語

**Speak a new language, one phrase at a time.**

Ichigo is a personal, evidence-based language app. It is built around phrases instead of single words, has you speaking from day one, and schedules every review with spaced repetition (FSRS). Japanese is the first language pack; the core is language-agnostic, so Spanish and German can be added later.

- 📄 **Spec:** [`docs/SPEC.md`](docs/SPEC.md): goals, learning science, architecture, milestones
- 🧭 **Status:** Milestone 1 (usable Day 1): kana trainer, ~150 seed phrases, FSRS reviews, Today plan, backup

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
```

```bash
npm test           # unit tests (Vitest)
npm run build      # type-check + production build into dist/
```

Requires Node 22+. All data is stored in the browser (IndexedDB); nothing is sent to a server.

## Deploy (Vercel)

Import the repository in Vercel. It detects Vite automatically (build: `npm run build`, output: `dist`). The app uses hash routing (`#/review`), so no rewrites are needed. HTTPS, which Vercel provides, is required for the microphone in later milestones.

## Project layout

```
src/
  core/        language-agnostic: storage (Dexie), FSRS scheduler, planner, grading, backup, speech
  lang/        language packs; lang/ja = Japanese (text markup, kana, seed deck)
  features/    screens: setup, today, review, learn, kana, settings
  components/  shared UI (JaText with furigana/romaji, SpeakButton, KanaInput)
```

### Japanese text markup

Seed content uses a small markup so one string gives the display text, the reading, the romaji and the comparison form:

| Markup | Meaning | Example |
|---|---|---|
| `[漢字\|かんじ]` | base + furigana | `[日本語\|にほんご]` |
| `^は`, `^へ` | particle pronounced *wa* / *e* | `[私\|わたし]^は` |
| space | word boundary (hidden in Japanese, used for romaji) | `[私\|わたし]^は [学生\|がくせい] です` |
| `{}` | slot (filled from the chunk's slot options) | `{} を ください` |

## Data and credits

- Seed phrases and kana mnemonics were written with AI assistance and are **not yet native-reviewed**. Flag anything odd from a review card.
- [ts-fsrs](https://github.com/open-spaced-repetition/ts-fsrs) (MIT), [WanaKana](https://github.com/WaniKani/WanaKana) (MIT), [Dexie](https://dexie.org) (Apache-2.0), React, Vite, Tailwind CSS.
