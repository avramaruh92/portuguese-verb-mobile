# Portuguese Verb Conjugation App — Mobile

## What This Is

An iOS-first Expo React Native app (TypeScript, Expo Router) that lets beginner
(A1-A2) learners of European Portuguese practice verb conjugation through short
quizzes, now backend-served with a silent local fallback. It is the companion
mobile client to the already-shipped `portuguese-verb-api` backend, but ships
as its own independent sibling repo, not a monorepo package.

**Shipped in v0.0:** the full core loop — pick tenses + irregular-verb toggle,
complete a 10-question quiz against a hand-verified 50-verb European Portuguese
dataset, see a score, share it, and optionally report a problem with any
question straight to the live backend.

**Shipped in v0.1:** quiz content now fetches from the live backend
(`GET /content/verbs`) with automatic, validated, silent fallback to the
bundled local dataset on any failure — the dataset source is snapshotted at
quiz-start so a background refresh can never swap questions mid-session. A
learner can cleanly exit an in-progress quiz via a header control or native
back gesture, both routed through one shared confirmation with no bypass. All
3 screens (Setup, Quiz, Results) share a consistent, safe-area-aware visual
language via a tokens module, verified on a real notched device. A small
"Using saved content" indicator (pulled forward from v2 to close a milestone
audit gap) makes the local-fallback signal visible to the learner without
reopening the fetch step's zero-blocking guarantee.

## Current State (v0.1 shipped)

- Setup → Quiz → Results loop, now backed by a live-fetched dataset with
  silent local fallback, snapshotted per session (Zustand store)
- 50-verb European Portuguese dataset (37 regular / 13 irregular), typed,
  Zod-validated
- Pure, deterministic, fully unit-tested quiz generation + scoring engine,
  now accepting an injected verb list (`generate()` seam from Phase 7)
- Clean exit-quiz flow (header control + swipe-back/hardware-back), single
  shared confirmation, full-state reset, no bypass path
- Shared design tokens (`src/theme/tokens.ts`) driving consistent
  spacing/typography/color across all 3 screens, safe-area-correct layout
  (no notch/home-indicator overlap), verified on a real device
- Non-blocking "Using saved content" indicator (`OfflinePill`) surfacing the
  local-fallback signal on all 3 screens without any new error state
- In-app "Report a problem" feedback flow wired to the live `POST /feedback`
  backend, cold-start-tolerant (90s timeout), verified never to block the quiz
- 150 tests passing across 15 suites, strict TypeScript clean, zero known
  blockers (see v0.1 audit for non-blocking tech debt)

## Next Milestone Goals

Not yet defined — run `/gsd:new-milestone` to scope the next milestone. Candidates
carried over from v0.1's deferred/tech-debt list (not yet committed):
- Deferred v2 requirements: PROG-01 (typed-answer mode), PROG-02 (progress/streak
  tracking), PROG-03 (spaced repetition), FETCH-06 (dataset staleness metadata),
  QUIZ-09 (question-progress indicator), UI-04 (answer-selection animation)
- Tech debt from the v0.1 audit: `OfflinePill` not shown on Results' no-session
  fallback branch; `handleBackToSetup()` inconsistent `reset()` contract vs the
  Phase 9 exit path; a few code-review quality items (test coverage, a11y) —
  see `.planning/milestones/v0.1-MILESTONE-AUDIT.md`

## Core Value

A learner can open the app, pick what to practice, complete a 10-question
conjugation quiz entirely offline, and see an accurate score. Everything else
(sharing, feedback) supports that loop but must never block it.

**Still the right priority after shipping v0.0** — nothing during development
surfaced a different core value; the feedback and share features stayed
firmly secondary to the offline quiz loop throughout, exactly as scoped.

## Requirements

### Validated

- ✓ User can select one or more tenses to practice (present indicative, preterite, imperfect, future) — v0.0 (SETUP-01)
- ✓ User can toggle "Include irregular verbs" (default off), independent of tense selection — v0.0 (SETUP-02)
- ✓ Starting a quiz creates a 10-question session from the local dataset, respecting tense and irregular-toggle filters — v0.0 (SETUP-03)
- ✓ Each question shows infinitive verb, English translation, tense, and subject pronoun label — v0.0 (QUIZ-01)
- ✓ Each question presents 4 answer choices with exactly 1 correct answer — v0.0 (QUIZ-02)
- ✓ Immediate right/wrong feedback after selecting an answer, then continue to next question — v0.0 (QUIZ-03)
- ✓ Quiz generation and scoring logic is unit-tested (filtering, randomization, correct-answer selection, score calculation) — v0.0 (QUIZ-04)
- ✓ Results screen shows score out of 10 — v0.0 (RSLT-01)
- ✓ Native iOS share sheet from results with short score + app name message — v0.0 (RSLT-02)
- ✓ Local verb dataset includes translation, regular/irregular flag, conjugations for 4 tenses × 6 subjects, up to 50 verbs — v0.0 (DATA-01, DATA-02)
- ✓ Dataset shape/completeness is automatically validated — v0.0 (DATA-03)
- ✓ In-app feedback submission (message + question context) via `POST /feedback` to the live backend — v0.0 (FDBK-01)
- ✓ Feedback submission handles 201/400/500/network/cold-start gracefully — v0.0 (FDBK-02, independently re-verified live against a genuinely cold Render instance in Phase 6)
- ✓ Feedback submission failure never blocks or interrupts quiz completion — v0.0 (FDBK-03)
- ✓ Feedback payload mapping (UI labels → locked backend enum literals) is unit-tested — v0.0 (FDBK-04)

All 16 v0.0 requirements shipped and independently verified (see
`.planning/milestones/v0.0-MILESTONE-AUDIT.md`).

- ✓ App fetches the verb dataset from a live backend content endpoint on app load/quiz-start — v0.1 (FETCH-01)
- ✓ Fetched payload validated against the existing Zod dataset schema before acceptance — v0.1 (FETCH-02)
- ✓ Silent fallback to the local dataset on any fetch failure, zero user-facing blocking — v0.1 (FETCH-03)
- ✓ Dataset source snapshotted at `startQuiz()` — mid-quiz refresh never swaps questions — v0.1 (FETCH-04)
- ✓ Header exit control on an in-progress quiz — v0.1 (QUIZ-05)
- ✓ Confirmation dialog with distinct labels before discarding progress — v0.1 (QUIZ-06)
- ✓ Swipe-back/hardware-back gesture triggers the same confirmation — no bypass — v0.1 (QUIZ-07)
- ✓ Confirming exit discards progress, returns to Setup, no partial results — v0.1 (QUIZ-08)
- ✓ Safe-area-correct layout on all 3 screens — v0.1 (UI-01)
- ✓ Consistent spacing/typography/color across Setup/Quiz/Results — v0.1 (UI-02)
- ✓ Styled loading/error states for the fetch step — v0.1 (UI-03, error-state half compensated for by FETCH-05 rather than directly triggerable — see v0.1 audit)
- ✓ Non-blocking "using saved content" indicator on local fallback, pulled forward from v2 — v0.1 via inserted Phase 10.1 (FETCH-05)

All 12 v0.1 requirements shipped and independently verified (see
`.planning/milestones/v0.1-MILESTONE-AUDIT.md`).

### Active

Not yet defined for the next milestone — run `/gsd:new-milestone` to scope new
requirements. See "Next Milestone Goals" above for carried-over candidates.

Full historical detail in `.planning/milestones/v0.1-REQUIREMENTS.md`.

### Out of Scope

- Login, accounts, sessions, user history — v0 has none of these, matches backend, no persistence beyond a single quiz session — deliberate product scope. **Still valid** — no user feedback during v0.0 build suggested this needs revisiting.
- Spaced repetition — not part of the v0 learning loop. **Still valid**, tracked as v2 candidate `PROG-03` if a future milestone wants it.
- ~~Backend quiz-content fetching — there is no content-serving API; dataset lives locally in the app by design.~~ **Reversed in v0.1** — backend-served content is now this milestone's primary goal (with local fallback). The reasoning held for exactly one milestone; superseded by explicit user decision at v0.1 kickoff. The actual backend endpoint work remains out of scope *for this repo* — owned separately by `portuguese-verb-api`.
- Subscriptions, ads — no monetization in v0. **Still valid.**
- Android release work — platform enum stays compatible (`ios | android`) but no Android build/release effort in this milestone. **Still valid.**
- Direct Supabase access or credentials in the mobile app — all persistence goes through backend `POST /feedback` only. **Still valid**, confirmed with zero violations across all 6 phases.
- Typed-answer quiz mode with diacritic normalization — deferred v2 candidate (`PROG-01`), not started.
- On-device (no-account) progress or streak tracking — deferred v2 candidate (`PROG-02`), not started.
- ~~Backend-served dataset updates (`PROG-04`)~~ — **promoted into v0.1**, shipped.
- Persistent on-disk caching of the fetched dataset across app restarts — would reopen the no-persistence-beyond-session scope decision. **Still valid** after v0.1 — the fetched dataset stays in-memory only for the session.
- Resume-in-progress / save-and-continue-later on quiz exit — contradicts no-persistence-beyond-session. **Still valid**, confirmed by Phase 9's always-discard exit contract.
- Partial-results screen on early exit — muddies score semantics. **Still valid**, confirmed by Phase 9.
- Full theming engine / dark mode toggle — disproportionate for a single visual pass. **Still valid** after Phase 10's single-token-file approach.
- Heavy animation libraries (Reanimated, Lottie) — not requested. **Still valid**; deferred `UI-04` (subtle tap feedback) could use built-in `Animated` if pursued later.
- Continuous polling / websocket live content updates — fetch-once-per-session is sufficient. **Still valid.**
- Merge/conflict-resolution logic between local and remote datasets — simple remote-if-fetched-else-local precedence is sufficient. **Still valid**, confirmed by Phase 7's implementation.
- Dataset staleness/version metadata (`FETCH-06`) — depends on what the real backend ships; deferred v2 candidate, not started.
- Question-progress indicator ("Question X of 10") (`QUIZ-09`) — deferred v2 candidate, not started.

## Context

- Sibling repo `portuguese-verb-api` (`avramaruh92/portuguese-verb-backend`) is
  already live at `https://portuguese-verb-api.onrender.com`. Its v0.0 is
  shipped and closed out; no new backend requirements are expected alongside
  this milestone.
- The backend's `tense`/`subject`/`platform` enum literals were chosen ahead of
  this app's existence and are flagged (backend Phase 3 decisions D-07/D-08) as
  best-guess pending verification against actual app UI. This app's dataset and
  quiz UI must use these exact literals in API payloads:
  - `tense`: `present_indicative | preterite | imperfect | future`
  - `subject`: `eu | tu | ele_ela | nos | voces | eles_elas`
  - `platform`: `ios | android`
  - Display labels can use accented/friendly Portuguese ("nós", "ele/ela") but
    payloads must map to the literals above exactly — mismatches 400.
  - **Verified, not just assumed, during v0.0:** `src/feedback/schema.ts`
    imports `TENSES`/`SUBJECTS` directly from `src/dataset/types.ts` rather
    than redeclaring literals (zero drift possible), and Phase 5 verification
    independently re-ran the live round-trip plus a negative-control request
    confirming the backend's actual validator accepts exactly this literal set.
- Render free-tier cold starts are a known real-world condition the feedback
  flow must tolerate gracefully (loading state, doesn't block quiz completion).
  **Verified in Phase 6** against a genuinely idle instance: 45-50s cold
  start, spinner held throughout, quiz stayed interactive, resolved to success.
- No content-serving API exists or is planned for v0 — confirmed explicitly
  during project setup after a clarifying question about whether the backend
  could serve verb data. It cannot/should not for this milestone.

**Current codebase state (end of v0.1):**
- ~4,900 LOC across TypeScript/TSX (`src/`, `app/`, `__tests__/`)
- 150 tests passing across 15 suites; strict TypeScript (`tsc --noEmit`) clean
- 11 phases total (6 in v0.0, 5 in v0.1 incl. inserted 10.1), 31 plans, 35
  `feat()` commits in v0.1 alone, v0.1 built over 6 days (2026-07-12 → 2026-07-18)
- Known non-blocking tech debt (see `.planning/milestones/v0.1-MILESTONE-AUDIT.md`
  for full detail): `OfflinePill` not rendered on Results' no-session fallback
  branch (deliberate scope choice, low impact); `app/results.tsx`'s
  `handleBackToSetup()` doesn't call `reset()` before navigating (inconsistent
  with Phase 9's exit path, currently harmless); `07-01-SUMMARY.md`
  frontmatter omits FETCH-02 (doc-hygiene only); ESLint still not installed as
  a devDependency (carried over from v0.0, `expo lint` currently a no-op).

## Constraints

- **Tech stack**: Expo (React Native) + TypeScript + Expo Router — iOS-first — locked by CLAUDE.md and confirmed at project setup
- **State management**: Zustand for quiz session state — chosen over plain React state for nicer ergonomics as quiz logic grows; app remains small so no heavier state library needed
- **Testing**: Jest with the Expo preset — standard for Expo/RN, works out of the box with TypeScript
- **Backend contract**: Mobile only ever calls `POST /feedback` on the live backend; never connects to Supabase directly or stores credentials — locked cross-repo constraint
- **Dataset authoring**: Full 50-verb target dataset (4 tenses × 6 subjects each) is significant hand-authored content; drafted by the assistant and reviewed by the user for conjugation accuracy before it ships

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Full 50-verb dataset targeted for v0.0 (not a smaller seed) | User chose full target over a smaller seed set despite added authoring effort | ✓ Good — shipped all 50 (37 regular/13 irregular), independently re-derived cell-by-cell in Phase 6 with zero discrepancies |
| Zustand for quiz session state | Nicer ergonomics than raw useState/Context as session logic grows; small added dependency accepted | ✓ Good — clean idle/error/in-progress/completed state machine, no coupling issues across Phases 3-6 |
| "Include irregular verbs" toggle filters the verb pool only | Toggle does not restrict which tenses are eligible — independent axes | ✓ Good — confirmed working as designed; Phase 6 also confirmed the toggle only affects the *next* `startQuiz`, never an in-progress session (filters-snapshot invariant holds) |
| Jest + Expo preset for testing | Standard, well-supported RN/Expo test tooling | ✓ Good — `jest-expo` wired in Phase 1, scaled to 122 tests/11 suites by v0.0 ship with zero tooling friction |
| Share message includes app name alongside score | Light organic promotion via the native share sheet | ✓ Good — RN core `Share` API, tested, share-sheet cancellation confirmed non-disruptive in Phase 6 |
| No backend content-serving API — dataset stays local/offline | Explicitly reconfirmed at project setup; backend v0.0 scope is closed, only `POST /feedback` is used | ✓ Good — held throughout all 6 phases, zero Supabase/DB coupling anywhere in the mobile app |
| Manual `AbortController` (not `AbortSignal.timeout`) for the 90s feedback timeout | `AbortSignal.timeout` is unimplemented on Hermes (Phase 5 research finding) | ✓ Good — avoided a runtime crash; verified working via a real 45-50s cold-start round-trip in Phase 6 |
| `querer` stays `isIrregular: false` despite a Phase 6 classification-boundary argument for `true` | Flag is functionally load-bearing (gates the quiz engine's `includeIrregular` filter) — flipping it would remove `querer` from the default quiz pool, a real behavior change with no conjugation-accuracy upside | ✓ Good — deliberate, discussed decision; documented in `portuguese-verb-memory` so it isn't mistaken for an oversight later |
| Feedback payload validated with Zod only for `z.infer` typing, never `.parse()`'d at runtime before dispatch | Lower priority than shipping the core loop; call site is fully typed so risk was assessed as low for v0.0 | ⚠️ Revisit — integration audit flagged this as defense-in-depth debt; a future refactor loosening types could silently send an invalid payload with no client-side signal |
| Backend content fetch reverses v0.0's "no content-serving API" stance | Explicit user decision at v0.1 kickoff — backend became source of truth, mobile still owns fetch/fallback/caching logic against a mock/real URL | ✓ Good — shipped with full silent-fallback contract (FETCH-01/02/03), zero blocking on failure |
| `generate()` takes an optional trailing `verbs` param instead of a new function | Minimal seam, keeps the 123-test v0.0 suite green with a default-bundled-dataset fallback | ✓ Good — zero regressions across the seam change |
| Manual `AbortController`-style single-flight memoization for `resolveVerbs()` (never a second fetch) | Avoids duplicate network calls when multiple screens/components need the resolved dataset | ✓ Good — confirmed by Phase 10.1's `OfflinePill` reusing the same memoized result with zero new fetches |
| Shared `confirmExit()` used by both the header Exit button and the `beforeRemove` gesture guard | Single code path guarantees no bypass between the two exit triggers | ✓ Good — verified via both call sites in Phase 9's on-device human-verify |
| Single `src/theme/tokens.ts` module (not per-screen styling) for the v0.1 visual pass | Establishes one style/token file so all 3 screens share spacing/typography/color, disproportionate to build a full theming engine | ✓ Good — verified consistent across Setup/Quiz/Results, reused directly by Phase 10.1's `OfflinePill` |
| Pull FETCH-05 forward from v2 (Phase 10.1, inserted) rather than reopening FETCH-03's silent-fallback contract | Milestone audit found UI-03's fetch-error UI unreachable by design; a non-blocking indicator gives the local-fallback signal a real surface without violating FETCH-03 | ✓ Good — closed the audit gap; human-verified on a physical device under real Airplane Mode fallback |
| `OfflinePill` self-resolves `source` via its own `useEffect` + `resolveVerbs()`, not a new `useQuizStore` field | Avoids a `reset()`-clears-the-flag edge case a store field would introduce; the memoized `cachedResult` is already constant for the session | ✓ Good, ⚠️ minor debt — each screen instance re-reads independently rather than sharing one store value; safe today only because of the underlying memoization (code-review WARNING, non-blocking) |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-07-17 after v0.1 milestone (Online Quiz, Exit Flow & UI Polish)*
