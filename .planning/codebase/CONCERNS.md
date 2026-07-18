# Codebase Concerns

**Analysis Date:** 2026-07-18

## Documentation Drift (CLAUDE.md vs. actual code)

**Stale "no content-serving API" claim:**
- Issue: The project's own `CLAUDE.md` (checked into the repo) states under "Key Domain Facts" that "the mobile app holds a **local, offline verb dataset** for quiz play — it does not fetch quiz content from any backend. There is currently no content-serving API." This is no longer true: `src/dataset/remote.ts` calls `GET https://portuguese-verb-api.onrender.com/content/verbs` on every app load, and `src/dataset/source.ts` (`resolveVerbs`/`prefetch`) prefers that remote result over the bundled local dataset, falling back to local only on any fetch/validation failure.
- Files: `CLAUDE.md:29-35`, `src/dataset/remote.ts`, `src/dataset/source.ts`, `src/store/useQuizStore.ts`
- Impact: A future agent or contributor reading `CLAUDE.md` top-to-bottom will operate on a wrong mental model (assuming pure offline-only content) and could reintroduce regressions or misjudge cross-repo risk when touching dataset code. This is exactly the kind of drift `CLAUDE.md` itself warns about for `[TBD]` sections, except this section isn't marked `[TBD]` — it reads as settled fact and isn't.
- Fix approach: Update the "Key Domain Facts" section of `CLAUDE.md` to describe the actual remote-with-local-fallback behavior (this was a deliberate, documented decision in `.planning/phases/07-dataset-seam-fetch-fallback-pipeline/07-CONTEXT.md`, D-01 through D-04) rather than the pre-Phase-7 offline-only description.

**Remaining `[TBD]` placeholders in CLAUDE.md:**
- Issue: `CLAUDE.md` still contains `[TBD]` markers for "State management approach" (`CLAUDE.md:17`), verb dataset "format/storage details" (`CLAUDE.md:18`), the `Commands` code block (`CLAUDE.md:23`), "Testing conventions" (`CLAUDE.md:67`), and the "File/Folder Structure" tree (`CLAUDE.md:73`) — despite all five of these being fully resolved elsewhere in the same repo (Zustand is used and documented lower in the same file under "Constraints"; the dataset lives in `src/dataset/verbs.ts`; `package.json` `scripts` defines `start`/`test`/`lint`/`typecheck`; Jest+`jest-expo` is configured and 13 test files exist; `app/`, `src/` structure is established).
- Files: `CLAUDE.md:8-24`, `CLAUDE.md:67`, `CLAUDE.md:73`
- Impact: Low functional impact (the answers exist further down the same file or in `package.json`), but it's a documentation freshness gap that could mislead a reader skimming only the top "starter skeleton" section.
- Fix approach: Fill in or remove the five `[TBD]` markers now that the project has moved well past initial scaffolding (50-verb dataset, full quiz/feedback flow, 13 test files).

## Cross-Repo Contract Risk — `POST /feedback` enums

**No issue found — enums match the documented backend contract.**
- `src/feedback/schema.ts` builds `tense`/`subject` enums directly from `TENSES`/`SUBJECTS` in `src/dataset/types.ts` (`present_indicative | preterite | imperfect | future` and `eu | tu | ele_ela | nos | voces | eles_elas`), and hardcodes `platform: z.enum(["ios", "android"])`. All three match the literals documented in `CLAUDE.md`'s "Key Domain Facts" section verbatim.
- `src/feedback/payload.ts` (`buildFeedbackPayload`) passes through `tense`/`subject`/`platform` from typed call-site data (`Tense`, `Subject`, `"ios" | "android"`) with no ad hoc string literals, so there is no drift surface between the local type system and the payload shape.
- Files verified: `src/feedback/schema.ts`, `src/feedback/payload.ts`, `src/dataset/types.ts`, `app/quiz.tsx:53-54` (platform/appVersion sourcing via `Platform.OS` and `Constants.expoConfig?.version`).
- Residual risk (not a code bug, but worth flagging): this match is only as good as the backend staying in lockstep. `CLAUDE.md` itself flags the enum literals as originally a "best-guess" from the backend team (D-07/D-08) — if the backend ever changes these enums, `__tests__/dataset.test.ts`'s "matches the locked backend enums" test (`__tests__/dataset.test.ts:34-46`) would need corresponding updates, and there is no automated cross-repo contract test (e.g., a shared schema package or contract test hitting the live API) that would catch drift automatically.

## Dataset Completeness

**No gap found — dataset meets its 50-verb × 4-tense × 6-subject target.**
- `src/dataset/verbs.ts` contains exactly 50 verbs (`grep -c '^    verb:'` = 50), each with all 4 tenses (`present_indicative`, `preterite`, `imperfect`, `future`) × all 6 subjects (`eu`, `tu`, `ele_ela`, `nos`, `voces`, `eles_elas`) populated — no empty/placeholder conjugation cells observed while reading the full file.
- 13 of the 50 verbs are marked `isIrregular: true` (`ser`, `estar`, `ter`, `ir`, `fazer`, `poder`, `querer`, `dizer`, `ver`, `dar`, `vir`, `saber`, `pôr`).
- Shape/completeness is enforced by `src/dataset/validate.ts` (Zod schema requiring all tense × subject cells as non-empty strings) and exercised by `__tests__/dataset.test.ts`, which explicitly asserts `verbs.length === 50`, unique infinitives, zero `validateDataset` errors, and a negative case (deleting one conjugation cell fails validation).
- One historical data-quality fix is documented but worth knowing about: `querer.isIrregular` was flipped from `false` to `true` in Phase 7 (`.planning/phases/07-dataset-seam-fetch-fallback-pipeline/07-CONTEXT.md`, D-02) to match the authoritative remote dataset — confirmed correct in the current `src/dataset/verbs.ts:1684`.

## Test Coverage Gaps

**UI screen components (`app/*.tsx`) have no dedicated component tests:**
- What's not tested: `app/index.tsx` (199 lines), `app/quiz.tsx` (273 lines), `app/results.tsx` (188 lines), and `app/_layout.tsx` have no corresponding test files. `@testing-library/react-native` is not installed (`package.json` has no such devDependency), consistent with the stack decision documented in `CLAUDE.md`'s tech-stack notes to keep pure-logic testing in plain Jest and skip RN component rendering unless a phase specifically calls for it.
- Files: `app/index.tsx`, `app/quiz.tsx`, `app/results.tsx`, `app/_layout.tsx`
- Risk: All underlying pure logic these screens call into (quiz generation/scoring/random selection, feedback payload building/schema/submit, dataset validation/remote/source resolution, share text building, offline-pill state) is well covered by the 13 files in `__tests__/`. The gap is screen-level wiring/rendering bugs (e.g., a prop passed incorrectly between `app/quiz.tsx` and `ReportFeedbackModal`, or a state transition not reflected in the UI) that pure-function tests cannot catch. Low-to-medium priority given the project's explicit choice to keep UI thin and push logic into tested modules — worth watching if `app/quiz.tsx` (already the largest screen at 273 lines) keeps growing in complexity.

**`ReportFeedbackModal.tsx` itself has no direct test:**
- What's not tested: `src/feedback/ReportFeedbackModal.tsx` (269 lines) — a component that manages its own local state machine (`idle | submitting | success | error`), a timer ref, and reset-on-visibility-change effect — has no test file, even though every function it calls (`buildFeedbackPayload`, `submitFeedback`, `reasonLabels`/`FEEDBACK_REASONS`) is tested individually.
- Files: `src/feedback/ReportFeedbackModal.tsx`
- Risk: State-machine bugs (e.g., a stale timer not cleared on rapid open/close, or `lastStatus` not resetting correctly) would only surface at runtime/manual QA, not in CI. Medium priority — this is the most stateful piece of UI logic in the app without test coverage.

## Tech Debt / Fragile Areas

**Large hand-authored dataset file with no per-entry test isolation:**
- Issue: `src/dataset/verbs.ts` is a single 1954-line hand-authored TypeScript object literal (50 verbs × 4 tenses × 6 subjects = 1200 individual conjugation strings). There is no per-verb or per-conjugation-cell test that checks linguistic correctness (only shape/completeness is validated by `__tests__/dataset.test.ts` — a wrong-but-present conjugation string like a typo would pass validation).
- Files: `src/dataset/verbs.ts`
- Impact: A single incorrect conjugation form (e.g., swapped `voces`/`eles_elas`, an accent typo) would ship silently — validated as "complete" but linguistically wrong — and would only be caught by manual review or a user's in-app feedback report via `POST /feedback`. This is explicitly the accepted tradeoff called out in the project's `PROJECT.md` constraints ("drafted by the assistant and reviewed by the user for conjugation accuracy before it ships"), so it's a known, accepted risk rather than an oversight — flagged here for visibility, not as a new finding.
- Fix approach: No code fix needed; this is a process/review concern. If it becomes a recurring source of bug reports via the feedback endpoint, consider spot-check tests for a curated subset of high-frequency/high-risk verbs (e.g., all 13 irregulars) asserting specific conjugation strings against a second authoritative source.

**No dedicated `.planning/codebase/STRUCTURE.md`/`ARCHITECTURE.md` yet at time of writing:**
- Not a code concern — noted only because this CONCERNS.md is being generated in isolation from the other codebase-map documents (tech/arch/quality focuses may not have run yet in this session). No action needed here; this is informational for whoever reads this file next.

## Security Considerations

**No accidental credentials found.**
- No `.env`, `.env.*`, or other secret files exist in the repo (`ls .env*` returns no matches), and `.gitignore` already excludes `.env`/`.env.local` preemptively.
- Grepped `src/`, `app/`, and `app.json` for common credential patterns (`sk-`, `apikey`, `api_key`, `API_KEY`, `secret`) — zero matches.
- `app.json` contains only public Expo config (app name, slug, icon paths, splash colors) — no embedded tokens.
- Per `CLAUDE.md`'s locked constraint, this app never holds Supabase credentials or connects to a database directly — confirmed: the only outbound network calls found anywhere in `src/`/`app/` are `fetch()` to `https://portuguese-verb-api.onrender.com/feedback` (`src/feedback/submit.ts:3`) and `https://portuguese-verb-api.onrender.com/content/verbs` (`src/dataset/remote.ts:4`), both public unauthenticated backend endpoints, no API keys attached.

## Logging / Debug Output

**No stray `console.log`/`console.warn`/`console.error` calls found** in `src/` or `app/` — clean of debug output that might leak into production builds.

## TODO/FIXME Comments

**None found.** A grep for `TODO|FIXME|HACK|XXX|\[TBD\]` across `src/`, `app/`, and `__tests__/` returned zero matches — all outstanding placeholder markers live only in `CLAUDE.md` (see "Documentation Drift" above), not in source code.

---

*Concerns audit: 2026-07-18*
