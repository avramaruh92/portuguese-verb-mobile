# Lafa — Portuguese Verb Conjugation App (Mobile)

## What This Is

**Lafa** is the product/brand name for this app, and as of v0.2
(shipped 2026-07-19) the in-app display name genuinely says "Lafa" —
Setup screen heading, `app.json` `expo.name`, and the native share
message all read "Lafa". The repo, slug, and backend sibling repo name
remain unchanged (`portuguese-verb-mobile`).

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

**Shipped in v0.2:** the app is visually and verbally rebranded as Lafa —
`src/theme/tokens.ts` carries the Lafa palette (colors, typography, spacing,
radius incl. a new `pill` radius), consumed by all 3 screens and both shared
components (`OfflinePill`, `ReportFeedbackModal`) with zero hardcoded hex
remaining anywhere. Displayed tense labels are friendlier for A1-A2 learners
— `preterite` → "Completed past", `imperfect` → "Imperfect past" — with the
exact Portuguese grammar term ("Pretérito perfeito"/"Pretérito imperfeito")
shown inline-parenthesized on the Quiz screen only, never as the primary
label. Internal enum literals and the `POST /feedback` payload are
byte-for-byte unchanged — this was a display/copy-only pass, independently
verified (`src/feedback/` has zero references to any label map).

## Current State (v0.2 shipped)

- Setup → Quiz → Results loop, backed by a live-fetched dataset with silent
  local fallback, snapshotted per session (Zustand store) — unchanged since
  v0.1, rebranded on top
- 50-verb European Portuguese dataset (37 regular / 13 irregular), typed,
  Zod-validated
- Pure, deterministic, fully unit-tested quiz generation + scoring engine,
  accepting an injected verb list (`generate()` seam from Phase 7)
- Clean exit-quiz flow (header control + swipe-back/hardware-back), single
  shared confirmation, full-state reset, no bypass path
- Lafa design tokens (`src/theme/tokens.ts`) driving every screen and shared
  component — no default iOS-blue or hardcoded hex anywhere in `app/`/`src/`
- Friendly, A1-A2-appropriate tense labels ("Completed past"/"Imperfect
  past") with Portuguese grammar names as inline secondary text on the Quiz
  meta row; internal enum literals and backend payload untouched
- Non-blocking "Using saved content" indicator (`OfflinePill`) surfacing the
  local-fallback signal on all 3 screens without any new error state
- In-app "Report a problem" feedback flow wired to the live `POST /feedback`
  backend, cold-start-tolerant (90s timeout), verified never to block the quiz
- 155 tests passing across 15 suites, strict TypeScript clean, zero blocking
  gaps (see `.planning/v0.2-MILESTONE-AUDIT.md` for non-blocking tech debt)

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

- ✓ App displays "Lafa" as its name (Setup heading, `app.json` `expo.name`) — v0.2 (BRAND-01)
- ✓ All screens + shared components render using Lafa design tokens, no hardcoded hex — v0.2 (BRAND-02)
- ✓ Answer-choice visual states restyled with `success`/`error` tokens, white text on colored choices — v0.2 (BRAND-03)
- ✓ `OfflinePill` uses `primarySoft`/`primary`/`pill` tokens, copy unchanged — v0.2 (BRAND-04)
- ✓ Displayed tense labels updated to friendly English (`preterite` → "Completed past", `imperfect` → "Imperfect past"), internal enum literals unchanged — v0.2 (LABEL-01)
- ✓ Portuguese grammar names shown only as secondary/inline text, never the primary label; "Perfect past" never used — v0.2 (LABEL-02)
- ✓ `POST /feedback` payload continues to send the exact locked backend enum literals, zero payload impact — v0.2 (LABEL-03)
- ✓ `quiz-labels.test.ts` asserts the new displayed labels while confirming internal literals unchanged — v0.2 (TEST-01)
- ✓ Token-completeness test confirms required Lafa token keys exist — v0.2 (TEST-02)

All 9 v0.2 requirements shipped and independently verified (see
`.planning/v0.2-MILESTONE-AUDIT.md`).

### Active

To be defined in `.planning/REQUIREMENTS.md` for v0.3 (this milestone).

Full historical detail in `.planning/milestones/v0.1-REQUIREMENTS.md` and
`.planning/milestones/v0.2-REQUIREMENTS.md`.

## Current Milestone: v0.3 Learning Quality Upgrade

**Goal:** Turn the quiz from an answer-checker into a learning loop by adding
irregular-only practice, smarter diagnostic distractors, and backend-authored
wrong-answer explanations — consuming the `learning`/`formIndex` contract the
backend already shipped in its own v0.3, not building anything backend-side.

**Target features:**
- Replace the boolean "Include irregular verbs" toggle with a 3-option verb
  mode selector (`regular_only` default / `mixed` / `irregular_only`)
- Smarter distractor generation: prefer same-verb-wrong-subject, same-verb
  wrong-tense (especially Completed past vs. Imperfect past), and
  same-subject/tense-from-another-verb, over arbitrary wrong forms
- Wrong-answer explanation panel on the Quiz screen, populated from the
  backend's `learning` block (templates + per-verb `tenseNotes`/
  `subjectHints`) and each verb's `formIndex` reverse lookup, shown only
  after an incorrect answer, never blocking advance
- No explanation panel (not invented prose) when `learning` content is
  unavailable — remote payloads without it, and the local fallback dataset,
  must keep working exactly as today

**Key context:**
- The backend's `GET /content/verbs` already returns
  `{ verbs: ContentVerb[], learning?: LearningContent }` as of its own
  already-shipped v0.3 (2026-07-19) — `ContentVerb.formIndex` maps every
  conjugated form string to its `{tense, subject}` slot(s) (ties preserved,
  never collapsed), and `learning.verbs[verb]` carries
  `irregularTenses`/`tenseNotes`/`subjectHints` plus shared
  `learning.templates` (`wrongTense`/`wrongSubject`/`wrongTenseAndSubject`/
  `correctAnswerReveal`/`generic`) with a closed interpolation-variable set
  (`{verb}`, `{selectedAnswer}`, `{correctAnswer}`, `{tenseLabel}`,
  `{subjectLabel}`, `{selectedTenseLabel}`, `{selectedSubjectLabel}`).
- Backend's `isIrregular` on each `ContentVerb` is now derived from
  `learning.verbs[verb].irregularTenses.length > 0` when a learning entry
  exists (falling back to the DB/local value otherwise) — mobile should keep
  treating `isIrregular` as the source-of-truth verb-mode filter flag, not
  reclassify verbs itself.
- Backend validates `learning` independently of `verbs` and fail-closed-omits
  just the `learning` key on any authoring/shape problem — mobile's dataset
  layer must treat `learning` as always-optional even on a 200 response, and
  must not throw or degrade the core quiz loop if it's missing.
- `POST /feedback`'s contract (enum literals, payload shape) is unchanged by
  this milestone — `selectedAnswer` stays the raw selected choice string.
- Prepositions are explicitly out of scope for this milestone on both sides
  (deferred as a future cross-repo milestone).
- Source doc: `/Users/avi/Downloads/v0.3 Learning Quality Upgrade.md`
  (codex-authored plan, reconciled against the backend's actual shipped
  contract during `/gsd:new-milestone`).

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
- ~~No content-serving API exists or is planned for v0~~ — **reversed in v0.1**:
  the backend now serves `GET /content/verbs` and the app is remote-first with
  local fallback (see "Shipped in v0.1" above and Constraints below).

**Current codebase state (end of v0.2):**
- ~4,930 LOC across TypeScript/TSX (`src/`, `app/`, `__tests__/`)
- 155 tests passing across 15 suites; strict TypeScript (`tsc --noEmit`) clean
- 13 phases total (6 in v0.0, 5 in v0.1 incl. inserted 10.1, 2 in v0.2), 35
  plans, v0.2 built over 7 days (2026-07-12 kickoff → 2026-07-19 ship, most
  work landed same-day 2026-07-19)
- ESLint now installed (`eslint` + `eslint-config-expo`, auto-scaffolded by
  `expo lint`'s first-run behavior during v0.2's milestone audit) — resolves
  the v0.1-carried "ESLint not installed" tech debt item; one pre-existing,
  unrelated `react-hooks/set-state-in-effect` lint finding remains in
  `ReportFeedbackModal.tsx` (predates v0.1/v0.2, not touched by either)
- Known non-blocking tech debt (see `.planning/v0.2-MILESTONE-AUDIT.md` for
  full detail): locked Lafa palette computes below WCAG AA 4.5:1 contrast on
  several text/background pairings (white-on-`primary`/`success`,
  `primary`-on-`primarySoft`) — user reviewed on-device in Expo Go and
  accepted as-is; LABEL-02's Portuguese grammar name renders in the primary
  text color/size rather than visually de-emphasized (documented implementer
  discretion, satisfies the requirement's letter); `OfflinePill` not rendered
  on Results' no-session fallback branch (carried from v0.1, deliberate scope
  choice); `app/results.tsx`'s `handleBackToSetup()` doesn't call `reset()`
  before navigating (carried from v0.1, currently harmless).

## Constraints

- **Tech stack**: Expo (React Native) + TypeScript + Expo Router — iOS-first — locked by CLAUDE.md and confirmed at project setup
- **State management**: Zustand for quiz session state — chosen over plain React state for nicer ergonomics as quiz logic grows; app remains small so no heavier state library needed
- **Testing**: Jest with the Expo preset — standard for Expo/RN, works out of the box with TypeScript
- **Backend contract**: Mobile only ever calls `POST /feedback` (submit) and `GET /content/verbs` (dataset fetch, with local fallback) on the live backend; never connects to Supabase directly or stores credentials — locked cross-repo constraint
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
| Lafa palette values locked pre-Phase-11 (D-01/D-02) accepted as-is despite sub-WCAG-AA contrast on several pairings | Contrast/legibility is a visual-perception judgment call, not a wiring defect; user reviewed on a real device (Expo Go) rather than trusting computed ratios alone | ✓ Good — user explicitly approved after live device review; tracked as informational tech debt, not reopened |
| `tenseGrammarNames` added as a separate `Partial<Record<Tense, string>>` export rather than overloading `tenseLabels` | `tenseLabels` is the primary-label contract asserted by `quiz-labels.test.ts`; a partial map keeps the full/partial shapes distinct | ✓ Good — zero test regressions, `present_indicative`/`future` correctly have no grammar-name entry |
| Portuguese grammar name rendered inline-parenthesized in the primary text color, not a nested de-emphasized `<Text>` | User's explicit placement/format choice (D-04) over a caption-sized secondary row; styling treatment (D-07) left to implementer discretion | ✓ Good, ⚠️ minor debt — satisfies LABEL-02's letter (never the primary label) but not a strict visual-secondary treatment; flagged non-blocking by the integration checker |
| Both v0.2 phases (11, 12) skipped formal research/VALIDATION.md at plan-phase time | User judgment call — small, well-scoped, display-only changes with wording/placement already locked in each phase's CONTEXT.md; research adds little value for changes this narrow | ✓ Good — both phases shipped clean, zero rework, plan-checker and verifier both passed without needing research artifacts |

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
*Last updated: 2026-07-19 after v0.2 milestone*
