# Ichigo — notes for Claude

- Spec and milestones: `docs/SPEC.md`. Keep it in sync when scope changes.
- Before committing: `npm run typecheck && npm test && npm run build`.
- The core (`src/core`, `src/features`) must not import from `src/lang/ja` directly: go through `getPack()` / the `LanguagePack` interface.
- Seed content uses the markup documented in `README.md`; `src/lang/ja/seedDeck.test.ts` enforces that every kanji has a reading.
- The learner's grade is always final; automatic grading only *suggests*.
- No gamification (XP, leagues, guilt streaks). Progress means what the learner can do.
- TypeScript 7 (`tsc`), Vite 8, Tailwind v4 (custom component classes live in `src/index.css`; `@apply` only accepts real utilities).
