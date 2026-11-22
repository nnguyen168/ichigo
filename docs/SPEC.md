# Ichigo 一語 — Version 1 Spec

> *Ichigo* (一語) means "one word", and sounds like いちご (strawberry) 🍓.

| | |
|---|---|
| Status | Draft v0.1 |
| Date | 2026-11-22 |
| User and owner | You (a single learner) |
| Builder | Claude |
| First language pack | Japanese (for English speakers) |
| Later language packs | Spanish, German |

---

## 1. Purpose

Ichigo is a personal language app built on research evidence. Its first job is to take one adult from zero to **holding real conversations in Japanese about their own life** in a 30-day sprint, then keep improving after that.

It is the opposite of a tile-tapping app:
- It is **built around phrases**: you learn ready-made chunks, not isolated words.
- **You speak from Day 1**: most practice is saying things out loud.
- It is **personal**: the content comes from your own goals.

The core is language-agnostic. Everything specific to Japanese lives in a swappable **language pack**.

## 2. Goals and non-goals

### Goals for V1
| # | Goal |
|---|---|
| G1 | **Speak from Day 1.** At least 50% of practice time is spoken production. |
| G2 | **Phrases first.** The basic unit is a *chunk*: a phrase with slots you can fill (e.g. 「〜をください」). |
| G3 | **Personal.** Chunks, dialogues and missions come from your goals and domains. |
| G4 | **Free to run.** It costs $0 by default; paid services are optional upgrades. |
| G5 | **Measurable.** Recorded speaking tests on Days 0, 15 and 30. Progress is "what I can do," not XP. |
| G6 | **Language-agnostic core.** Adding Spanish or German means writing a new language pack, not rewriting the app. |

### Non-goals for V1
- Multiple users, accounts or cloud sync (a backup file replaces these)
- Native iOS or Android apps (V1 is a PWA, a web app you can install from the browser)
- Kanji handwriting or a full kanji curriculum (furigana, the small reading aids above kanji, are always available)
- Automatic pitch-accent scoring (patterns are displayed, not graded)
- A human-tutor marketplace (tutor sessions are booked by hand, outside the app)
- Gamification such as XP, leagues or guilt streaks
- Spanish or German content (only the architecture for them)

## 3. A realistic 30-day target for Japanese

Assumption: about **90 minutes a day on average**, roughly 45 hours in total. With less time, targets scale down; the app adapts.

By Day 30 you can:
- Read **hiragana and katakana** quickly (target: by Day 5)
- Produce **350–450 chunks** actively and recognize **600–800 words**
- Speak politely (the です/ます forms) about **4–6 personal topics**. Defaults:
  - introducing yourself
  - work or study
  - family
  - food and ordering
  - getting around and directions
  - hobbies
- Keep a conversation going when it breaks down: もう一度お願いします, ゆっくりお願いします, 〜は日本語で何ですか
- **Day 30 mission:** a 10-minute unscripted voice conversation on those topics, with the AI and ideally once with a human tutor

That is about **A1+/A2 speaking on the topics you prepared** (CEFR levels: A1 beginner, A2 elementary). Reading kanji stays minimal.

Japanese takes roughly 2,200+ hours to reach professional fluency, so Day 30 is the end of the sprint, not the finish line. The app carries on in "continuing mode" after Day 30.

## 4. Learning design: evidence and how V1 uses it

| Principle | Evidence | What V1 does |
|---|---|---|
| Formulaic language (chunks) | Pawley & Syder 1983; Wray 2002 | Every card is a chunk with slots, taught inside a mini-dialogue |
| Frequency first | Nation 2006 | The seed deck is ranked by frequency; personal chunks are ranked by frequency × relevance |
| Spaced repetition | Cepeda et al. 2006 | FSRS scheduler (`ts-fsrs`) on every card |
| Retrieval practice | Roediger & Karpicke 2006 | Reviews ask you to *produce* (say) the answer, not recognize it |
| Desirable difficulty | Bjork | Retention target is about 85–90%; card types are mixed together |
| Comprehensible input | Krashen; Hu & Nation 2000 | Graded stories in which at least 95% of words are already known (98% is the target) |
| Output and interaction | Swain; Long | Daily voice conversation missions |
| Explicit instruction | Norris & Ortega 2000 | A short grammar note appears *after* you meet a pattern in a dialogue |
| Corrective feedback | Lyster & Ranta 1997; Li 2010 | You get a chance to correct yourself first, then a recast (the correct version); errors become review cards |
| Pronunciation | Thomson 2018 (HVPT, practice with many voices) | Multiple voices, shadowing, A/B playback of your recording, pitch-accent display |
| Fluency | Nation's 4/3/2 | Retell the same story in less time each round |
| Anxiety | Horwitz | Private AI practice comes before human practice; an English escape hatch is always available |
| Habits | Gollwitzer 1999 | An "if-then" study plan set during onboarding, shown on the Today screen |
| Learning styles are a myth | Pashler et al. 2008 | No "learner type" modes |

## 5. User experience

### 5.1 Onboarding (once, about 10 minutes)
1. **Goals interview.** An AI chat, with a plain form as fallback, asks:
   - why you're learning
   - who you'll speak with, and where
   - how many minutes a day you have
   - your start date
   - your if-then study plan (e.g. "After breakfast, at my desk")
2. **What it produces:**
   - a **mission statement**
   - 4–6 **topics**
   - **personal chunk candidates**, merged with the seed deck
3. **Day 0 baseline:** a 3-prompt speaking test, recorded (see §5.3, Speaking tests).

### 5.2 Today screen
- Shows the day number, the mission, your if-then plan, and the plan for today.
- The plan is built from your time budget (30/60/90/120 min), the number of cards due, and where you are in the 30-day schedule.
- Blocks run in order and each can be skipped. For a typical 90-minute day:

| Block | Minutes |
|---|---|
| Review (cards due) | 15–20 |
| Learn (new chunks) | 15 |
| Listen/Read (graded story) | 15 |
| Talk (conversation mission) | 20 |
| Shadow / fluency | 10 |
| Debrief | 2 |

### 5.3 Modules

#### Kana trainer (Days 1–5)
- Hiragana first, then katakana from about Day 3. Every character has audio.
- A text mnemonic for each character (e.g. 「ぬ — noodles」).
- Drills:
  - see the character and say it aloud
  - hear it and pick it
  - type it with romaji that converts to kana as you type (`wanakana`)
  - read short real words
- Scheduled by FSRS like everything else.
- Romaji display is a crutch that switches off automatically after Day 5 (you can turn it back on).

#### Review (FSRS)
Card types are kinds of practice on one item. Each type has its own memory state.

| Type | Prompt | You do |
|---|---|---|
| Listen → Meaning | Japanese audio | Recall the meaning, then reveal (self-grade) |
| Meaning → Say | English cue plus a situation ("At a café, you want water") | **Say it**. Speech recognition converts it to kana, which is compared to the answer (see §8.4) |
| Cloze in dialogue | A dialogue line with the chunk missing | Say the missing chunk |
| Slot swap | A chunk plus a new slot value (コーヒー → お水) | Say the changed phrase |

- The app **suggests** a grade, and you confirm with one tap (Again/Hard/Good/Easy). **Your grade always wins.**
- Typed answers are a fallback for when you can't speak aloud.
- New cards: 15–25 a day by default. The limit drops automatically when the estimated review time exceeds 40% of the daily budget.

#### Learn (new chunks)
1. A mini-dialogue (4–6 lines) from one of your topics, played at natural and slow speed.
2. Tap any word to see its reading, meaning, part of speech and **pitch-accent pattern** (a high/low line).
3. A **noticing prompt** ("What comes after the item you're asking for?"), then the grammar note, the first time that pattern appears.
4. **Immediate retrieval:** say each chunk three ways using slot swaps.
5. The new chunks join the review queue.

#### Listen/Read (graded input)
- An AI-generated story or dialogue (150–300 characters) on your topics, **using only words you already know plus about 2–5% new ones** (see the validator in §8.4).
- Flow: listen only, then answer 2 comprehension questions out loud, then read with furigana, then listen again.
- Unknown words are underlined with short glosses. Tap once to add a useful phrase to your deck.
- Stories are stored, so you can reread and relisten ("narrow input": lots of practice on the same topic).

#### Talk (conversation mission)
- **Scenario card:** your role, the AI's role, the goal, and 3 target chunks to use.
- **Push-to-talk.** The AI persona:
  - speaks politely (です/ます)
  - keeps its turns short
  - mostly sticks to words you know
  - asks you questions so you do most of the talking
- **Help buttons:**
  - **ヒント (hint)**: shows two possible replies with furigana
  - **ゆっくり (slowly)**: repeats the last line slowly
  - **"How do I say…?"**: you ask in English; it answers, then asks you to say it
- **During the conversation:** no interruptions for small errors. When meaning breaks down, it asks you to clarify; otherwise it uses light recasts, repeating your sentence correctly in its reply.
- **Debrief after the conversation:**
  - your **3 most important errors**: first "can you fix this?", then the correct version and a one-line reason
  - **2 things you did well**
  - new chunks you can add with one tap
  - your error items go into the review queue as cards
- The transcript is saved, along with speaking minutes, number of turns and average utterance length.

#### Shadow and fluency
- **Shadowing:** play a sentence, record yourself, then play them back A/B (model, then you). Loop it, and use slow mode.
- **Retelling (a beginner-scaled 4/3/2):** retell today's story in 2:00, then 1:30, then 1:00. The app tracks words per minute (WPM) from the transcript.

#### Speaking tests (Days 0, 15, 30)
- A fixed prompt set (self-introduction, describe your day, ask for something), plus 2 minutes of free talk.
- Recordings are saved. You can listen to Day 0 and Day 30 back to back.
- An AI rubric scores the transcript: range, accuracy, task completion, and fluency (WPM and pause ratio from timestamps).

#### Progress
- A can-do checklist per topic (e.g. "I can order food and ask about ingredients")
- Cards by state (new / learning / known)
- Speaking minutes per day
- Test results over time
- **No XP, leagues or guilt streaks.** A gentle "days studied this week" is the only streak.

#### Settings
- AI provider, API key and model
- Text-to-speech voice and speed
- Daily time budget
- Furigana: always / only for unknown words / off
- Romaji crutch toggle
- **Backup:** export and import a single file. A weekly reminder asks you to export.
- Attributions page (data licenses)

## 6. Default 30-day schedule (adapts to your progress)

| Days | Focus |
|---|---|
| 0 | Onboarding, baseline speaking test |
| 1–3 | Hiragana, the sound system (mora timing, long vowels, っ, pitch basics), 30–50 survival chunks |
| 3–5 | Katakana, self-introduction chunks, first guided conversation missions (very scaffolded) |
| 6–14 | Core chunks for all topics; daily graded stories; daily missions; grammar: です/ます, は/が/を/に/で, 〜たい, 〜てください, past tense |
| 15 | **Mid-point speaking test.** Re-plan the remaining topics based on weaknesses. |
| 16–23 | Personal topics (your life, opinions, short stories); 〜て-form linking, 〜から reasons, 〜と思います; hints fade out |
| 24–29 | Unscripted conversations; **1–2 human sessions** (tutor or language exchange, booked by you); fluency retells |
| 30 | **Day 30 mission plus final test.** Compare with Day 0. Switch to continuing mode. |

## 7. Content

### 7.1 Seed deck
- About **150 hand-written core chunks** across the default topics (V1 ships 147; AI-generated personal phrases (§7.3) add more).
- Each one has: Japanese text, kana reading, English meaning, a literal gloss, register (polite/casual), slots and example fillers, topic, frequency band, and usage notes.
- Written by Claude and **marked "not native-reviewed"**. Wherever possible, cross-checked against real sentences from Tatoeba (an open sentence database).

### 7.2 Open data (all free)
| Data | Used for | License |
|---|---|---|
| JMdict (`jmdict-simplified` JSON) | Dictionary lookups, glosses | CC BY-SA 4.0 |
| Tatoeba ja–en sentence pairs | Example sentences, checking generated content | CC BY 2.0 FR |
| `kuromoji.js` + IPADIC | Splitting text into words, readings, lemmas (dictionary forms) | Apache 2.0 |
| `wanakana` | Romaji ↔ kana conversion, kana normalization | MIT |
| Kanjium pitch-accent data | Pitch-accent display | Confirm before bundling |
| JLPT vocabulary lists (tanos.co.uk) | Level and frequency bands | CC BY |

The app shows all attributions on its Attributions page.

### 7.3 Generated content
- The AI generates: personal chunks, dialogues, stories, scenario cards, debriefs and test scoring.
- Every generated Japanese text is **validated** before you see it:
  - it must parse cleanly with kuromoji
  - every word must exist in JMdict
  - the share of known words must meet the coverage target (§8.4)
  - the register must be polite
- Generated items are **saved once and reused**: no repeat cost, and you see the same stable content each time.

## 8. Architecture

### 8.1 Overview
A **client-only PWA**: all data stays in your browser; there's no server to run or pay for.

```
┌──────────────────────── Browser (PWA) ────────────────────────┐
│ UI (React)                                                     │
│   Today · Kana · Review · Learn · Listen · Talk · Shadow · …  │
├───────────────────────────────────────────────────────────────┤
│ Core services (language-agnostic)                              │
│   Scheduler (FSRS) · Learner model · Session planner           │
│   Grader · Coverage validator · Content cache                  │
├───────────────┬───────────────┬───────────────┬───────────────┤
│ Language pack │ AI adapter    │ Speech in     │ Speech out    │
│ ja: kuromoji, │ Claude/Ollama │ Web Speech API│ speechSynth.  │
│ wanakana,     │ /free tier    │ (V2: Whisper  │ (V2: VOICEVOX)│
│ furigana,     │               │  in browser)  │               │
│ pitch data    │               │               │               │
├───────────────┴───────────────┴───────────────┴───────────────┤
│ Storage: IndexedDB (Dexie): cards, logs, audio blobs, content │
└───────────────────────────────────────────────────────────────┘
```

### 8.2 Stack
| Concern | Choice |
|---|---|
| Language | TypeScript (strict) |
| UI | React + Vite, Tailwind CSS, `vite-plugin-pwa` (installable, works offline except for AI and speech) |
| Storage | Dexie (IndexedDB) |
| Spaced repetition | `ts-fsrs` |
| Japanese text processing | `kuromoji.js`, `wanakana`, HTML `<ruby>` for furigana |
| AI | Provider adapter (§9); Claude via `@anthropic-ai/sdk` in browser mode |
| Tests | Vitest (unit), Playwright (end-to-end) |
| Hosting | Static site on Cloudflare Pages or GitHub Pages. HTTPS is required for the microphone. |

### 8.3 Language pack interface (sketch)
```ts
interface LanguagePack {
  code: "ja" | "es" | "de";
  displayName: string;
  asrLocale: string;                 // "ja-JP"
  ttsLocale: string;
  tokenize(text: string): Promise<Token[]>;      // surface, lemma, reading, POS
  toComparable(text: string): Promise<string>;   // ja: reading in hiragana, normalized
  renderReading?(tokens: Token[]): ReadingSpan[]; // ja: furigana
  pitchAccent?(lemma: string, reading: string): PitchPattern | undefined;
  inputMethod?: InputMethod;         // ja: romaji → kana
  scriptTrainer?: ScriptTrainerDef;  // ja: kana trainer
  seedDeck: SeedChunk[];
  promptProfile: PromptProfile;      // register rules, learner-L1 notes for AI prompts
}
```

### 8.4 Key algorithms
- **Grading spoken answers (Japanese):**
  1. Take the speech-recognition transcript.
  2. Convert it to a kana reading with kuromoji (transcripts come back in kanji).
  3. Normalize: convert to hiragana, strip punctuation and spaces, normalize long vowels.
  4. Compare with every accepted reading of the answer, scoring similarity by edit distance (the number of character changes needed).
  5. Suggest a grade: ≥0.95 → Good, 0.80–0.95 → Hard, <0.80 → Again. You confirm or override.
- **Coverage validator:** tokenize the text, map words to their dictionary forms, and look each one up in the learner model.
  - coverage = known words ÷ content words
  - Coverage below 95% → regenerate with the list of offending words (at most 2 retries, then show the best attempt).
- **Session planner:** inputs are the time budget, cards due (× average seconds per review), the day of the schedule and recent performance. The output is an ordered list of blocks.
- **New-card throttle:** the number of new cards drops when the forecast review load is high or recent retention falls below the target.

### 8.5 Data model
| Entity | Key fields |
|---|---|
| `Profile` | language, start date, daily minutes, mission, topics, if-then plan, settings |
| `Item` | id, kind (`chunk`/`word`/`kana`/`grammar`), text, reading, meaning, slots, topic, source (`seed`/`generated`/`user`), reviewed flag |
| `Card` | itemId, type (`listen-meaning`, `meaning-say`, `cloze`, `slot-swap`, `kana-*`), FSRS state |
| `ReviewLog` | cardId, timestamp, suggested grade, final grade, response time, transcript |
| `ErrorRecord` | source (conversation/test), what you said, correction, explanation, linked itemId |
| `Content` | type (story/dialogue/scenario), text, tokens, coverage, audio refs, created |
| `Conversation` | scenario, transcript turns with timestamps, metrics, debrief |
| `Recording` | kind (shadow/test), audio blob, transcript, metrics |
| `TestResult` | day, rubric scores, WPM, pause ratio, recordings |

## 9. AI providers and cost

The provider-agnostic adapter handles six tasks: the onboarding interview, chunk generation, story generation, conversation, debrief, and test scoring.

| Option | Cost | Notes |
|---|---|---|
| **Ollama (local)** | $0 | Runs on your computer; needs a capable laptop or GPU. Japanese quality from small models is noticeably weaker. Your phone can use it only on the same network with extra setup. |
| **A free hosted tier** | $0 | Availability and limits change often; checked at build time. |
| **Claude Haiku 5.5** | Rough estimate: **under $1/month** for 20 min/day of conversation plus content generation | Fast and very cheap |
| **Claude Opus 5.5** | Rough estimate: **$8–20/month** at the same usage (lower with prompt caching) | Highest-quality Japanese and feedback |

**Why quality matters here:** as a beginner you can't spot when the AI's Japanese is unnatural or wrong. Every mistake it makes, you learn. The model is a setting you choose, and you can change it at any time.

**API key handling:** the key is stored only in your browser's local storage and never committed to git. Set a monthly spend limit in the provider console. That is acceptable for a personal app; it would need a server-side proxy if the app ever had other users.

## 10. Speech

- **Speech recognition:** the Web Speech API with `ja-JP` (free).
  - Works in Chrome (desktop and Android) and Safari (iOS/macOS); **not in Firefox**.
  - Audio is processed by the browser vendor's servers.
  - **Known weakness:** it "auto-corrects" learner speech into fluent Japanese, so grading is too generous. Mitigations:
    - the transcript is always shown
    - grading compares readings
    - your self-grade is final
  - V2: in-browser Whisper, which can detect real pronunciation errors better.
- **Text-to-speech:** `speechSynthesis` with `ja-JP` voices (free). Quality depends on your device; Apple and Google voices are decent. Multiple voices are used where available (for HVPT). V2: VOICEVOX (free, local, high quality) or pre-generated audio.
- **Recording:** `MediaRecorder`; audio is saved in IndexedDB.

## 11. Milestones

Each milestone ends with something you can use that day. **You can start learning after M1**, while later milestones are being built.

| # | Milestone | Contents | You can… |
|---|---|---|---|
| M0 | Foundation | Repo, scaffold, CI, deployment, language-pack skeleton, data import scripts (JMdict, Tatoeba, kana) | open the app on your phone |
| M1 | Usable Day 1 | Kana trainer, seed deck, FSRS review (typed and self-graded), Today screen, backup | **start Days 1–5** |
| M2 | Speaking | Spoken answers with suggested grades, Learn lessons, shadowing with A/B playback, text-to-speech voices | review and learn out loud |
| M3 | Conversation | AI adapter, Talk missions with hints and debrief → cards | have daily conversations |
| M4 | Personalization | Onboarding interview, personal chunks, graded stories with the coverage validator | get content about *your* life |
| M5 | Measurement | Speaking tests (Days 0/15/30), progress page, can-do checklists | see real progress |

## 12. V1 is done when

1. A complete 90-minute day runs end to end on a phone browser (Chrome Android or Safari iOS) **and** a laptop.
2. At least 50% of a typical session's active time is spoken production (measured).
3. Every generated story meets ≥95% known-word coverage, or is flagged.
4. A conversation mission produces a debrief, and its errors appear in the next day's review.
5. Day 0 and Day 30 recordings can be played back to back, with rubric scores.
6. Exporting a backup and importing it into a clean browser restores everything.
7. With AI set to "none", the kana trainer, review, learn and shadowing still work (offline-capable core).
8. Unit tests cover the scheduler integration, grader, coverage validator and session planner; one end-to-end test runs a full day.

## 13. Risks

| Risk | Mitigation |
|---|---|
| AI Japanese is unnatural or wrong | Validation pipeline; seed deck cross-checked against Tatoeba; stronger model as an option; you can flag bad content with one tap; native check during tutor sessions |
| Speech recognition too lenient or wrong | Show the transcript; self-grade is final; Whisper in V2 |
| Browser data cleared → progress lost | Weekly backup reminder; export file; the PWA requests persistent storage |
| Burnout from a 90-min/day sprint | The planner shrinks the day automatically; "minimum viable day" (15 min of review plus 5 min of talk) keeps the habit |
| Free AI tiers change or disappear | Provider adapter; local Ollama fallback; core features work without AI |
| Data licensing | Attributions page; share-alike data (JMdict) kept as separate data files |

## 14. Open questions (for you)

1. **Main device:** phone, laptop, or both equally?
2. **Daily time budget:** 30 / 60 / 90 / 120 minutes?
3. **AI choice for V1:** free (local or free tier), Claude Haiku 5.5 (about $1/month or less), or Claude Opus 5.5 (about $8–20/month)?
4. **Start date** for Day 1.
5. **Your topics:** why Japanese? (travel, work, anime and media, partner or family, moving to Japan…)

## 15. Ideas for V2 and later
- Pitch-accent and pronunciation scoring (Whisper or a paid pronunciation assessment service)
- VOICEVOX or neural text-to-speech; real native recordings
- A kanji module (by frequency, through words you already know)
- Sync across devices
- Spanish and German language packs
- Notifications; calendar integration for the if-then plan
- A "real-world bridge": prep cards before tutor sessions, and importing a tutor's corrections
