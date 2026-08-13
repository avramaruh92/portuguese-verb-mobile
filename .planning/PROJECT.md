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

**Shipped in v0.3:** the quiz becomes a genuine learning loop instead of a
plain answer-checker. A 3-way verb-mode selector (Regular only / Mixed /
Irregular only) replaces the old boolean toggle on Setup, filtering both the
question pool and the distractor pool. Wrong-answer distractors now follow a
pedagogical 3-tier strategy (same-verb wrong-subject → same-verb wrong-tense,
prioritizing the Completed-past/Imperfect-past confusion pair → cross-verb
same-conjugation-class fallback) instead of arbitrary wrong forms. After an
incorrect answer, a short backend-authored explanation appears in a new
`ExplanationPanel` between the choices and the Next button — built by
Zod-validated parsing of the backend's optional `learning`/`formIndex`
content and a pure `selectExplanation` resolver, fail-closed (no panel, no
crash) whenever content is unavailable or a cross-verb distractor's form
doesn't resolve. Scoring, `correctAnswer`, and the `POST /feedback` payload
are untouched by the panel's presence.

**Shipped in v0.4:** the mobile app is proven to accept the backend's actual
v0.4 content/learning contract shape (via a byte-for-byte copied fixture, not
live coupling at test time), the wrong-answer explanation panel now
interpolates the selected (wrong) answer's tense/subject labels alongside the
correct answer's and appends backend-authored `tenseNotes`/`subjectHints`
lines, and a brand-new "Help us improve" general product-feedback channel
(bug/idea/other + free-text message) is available from all 3 screens,
structurally independent of the existing quiz-answer "Report a problem" flow
— zero shared code, zero coupling, confirmed submitting to a newly-shipped
`POST /product-feedback` live backend endpoint.

**Shipped in v0.5:** zero new product features — this was a pure
release-engineering milestone getting the app into TestFlight for the
first time. The native dependency graph was proven to build on EAS's
cloud infrastructure; release identity (bundle id, slug/scheme, build
number) was locked; a Lafa-branded app icon and splash were generated
and baked in via a reproducible pipeline; `eas.json` build/submit
profiles were declared; the two remaining `npm run lint` failures were
fixed; a reusable live-backend preflight script was built and passed
both warm and cold; and the first real signed production iOS build was
built, submitted, and installed by an internal TestFlight tester —
surviving two real blocking bugs along the way (an EAS project
slug/local-slug mismatch inherited from the rebrand, and an npm-version
lockfile drift between the local dev machine and the EAS build image).

## Current State (v0.5 shipped)

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
- 3-way verb-mode selector (Regular only / Mixed / Irregular only) filtering
  both the quiz pool and the distractor pool, replacing the old boolean toggle
- 3-tier pedagogical distractor strategy (same-verb wrong-subject → same-verb
  wrong-tense with Completed/Imperfect-past priority → cross-verb same-class
  fallback), still guaranteeing exactly 4 unique choices / 1 correct answer
- Wrong-answer explanation panel (`ExplanationPanel`) on the Quiz screen,
  populated from the backend's optional `learning`/`formIndex` content via a
  pure `selectExplanation` resolver, fail-closed when content is unavailable
  — never affects scoring, `correctAnswer`, or the feedback payload
- Explanation panel now also interpolates the selected (wrong) answer's
  tense/subject labels (`selectedTenseLabel`/`selectedSubjectLabel`, resolved
  via `verb.formIndex[selectedAnswer]`, `matches[0]` convention, omitted on
  tied-disagree) and appends backend-authored `tenseNotes`/`subjectHints` as
  separate newline-joined lines — zero signature change, fail-closed contract
  fully preserved
- Mobile's runtime parsing paths (`validateDataset`, `LearningContentSchema`,
  `fetchRemoteVerbs`) proven to accept the real backend v0.4 sample payload
  byte-for-byte via a self-contained test fixture, zero cross-repo coupling
  at test time
- New `src/productFeedback/` domain (Zod schema, category picker Bug/Idea/
  Other, payload builder, submit transport) — a zero-shared-code structural
  mirror of `src/feedback/` — with a "Help us improve" entry point on all 3
  screens (footer link on Setup/Results, two-action row on Quiz alongside
  "Report a problem" with divergent visibility gating), submitting to a live
  `POST /product-feedback` backend endpoint, never including quiz-answer
  context
- 251 tests passing across 21 suites, strict TypeScript clean, zero blocking
  gaps (see `.planning/v0.4-MILESTONE-AUDIT.md` for non-blocking tech debt)
- Release identity locked: `ios.bundleIdentifier` `com.avram.aruh.lafa`,
  `app.json` `slug` `portuguese-verb-mobile` (matches the EAS project's
  server-side registration; `name`/`scheme` stay `"Lafa"`/`"lafa"`),
  `ios.buildNumber` `"1"`, `version` `1.0.0`
- Lafa-branded 1024x1024 alpha-free app icon and splash mark baked in via
  `scripts/generate-brand-assets.ts` (reproducible, `npm run generate-assets`)
- `eas.json` production build/submit profiles with EAS-managed iOS
  credentials and a real App Store Connect app id (`6794382182`)
- `scripts/preflight.ts` (`npm run preflight`) — reusable live-backend
  smoke test across all 4 mobile-facing endpoints, warm- and
  cold-instance verified
- First real signed production iOS build shipped to internal TestFlight;
  an internal tester has installed and launched the app
- No new product features or UI in v0.5 — this was entirely release
  engineering; the Setup → Quiz → Results loop is unchanged since v0.4

## Core Value

A learner can open the app, pick what to practice, complete a 10-question
conjugation quiz entirely offline, and see an accurate score. Everything else
(sharing, feedback) supports that loop but must never block it.

**Still the right priority after shipping v0.0** — nothing during development
surfaced a different core value; the feedback and share features stayed
firmly secondary to the offline quiz loop throughout, exactly as scoped.

**Still the right priority after shipping v0.3** — verb mode, smarter
distractors, and the explanation panel all deepen the *quality* of the
existing quiz loop (more meaningful practice, better wrong-answer feedback)
rather than introducing a competing feature; none of them add friction or a
new blocking step to "pick what to practice → complete 10 questions → see a
score."

**Still the right priority after shipping v0.4** — the contract-fixture proof
and explanation upgrade are backend-sync work with zero new UI, and the new
"Help us improve" product-feedback channel is explicitly secondary (same
non-blocking pattern as the existing "Report a problem" flow) — it never
gates or interrupts the quiz loop, confirmed structurally (zero shared code
with quiz-answer feedback) and on-device.

**Still the right priority after shipping v0.5** — a release-engineering
milestone by design, with zero product/UI changes; the core loop is
byte-for-byte the same app v0.4 shipped, now distributed via TestFlight
instead of Expo Go.

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

- ✓ User can select verb mode (Regular only / Mixed / Irregular only) on Setup, replacing the boolean toggle, default Regular only — v0.3 (MODE-01)
- ✓ Quiz generation filters the eligible verb pool by `isIrregular` per selected mode — v0.3 (MODE-02)
- ✓ Insufficient-eligible-verbs error path still triggers under Irregular-only's smaller pool — v0.3 (MODE-03)
- ✓ Distractor selection prefers same-verb wrong-subject forms — v0.3 (DIST-01)
- ✓ Distractor selection adds same-verb wrong-tense forms, prioritizing Completed-past/Imperfect-past — v0.3 (DIST-02)
- ✓ Distractor selection falls back to cross-verb same-class forms when same-verb options run out — v0.3 (DIST-03)
- ✓ Every question keeps exactly 4 unique choices / 1 correct answer under the new strategy — v0.3 (DIST-04)
- ✓ App parses the optional `learning`/`formIndex` block, Zod-validated, fail-closed on omission — v0.3 (EXPL-01)
- ✓ Explanation panel shown after an incorrect answer, correctly placed and template-resolved — v0.3 (EXPL-02)
- ✓ No explanation panel when learning content is unavailable — never fabricated prose — v0.3 (EXPL-03)
- ✓ Explanation rendering never mutates `correctAnswer`, scoring, or the feedback payload, never blocks advance — v0.3 (EXPL-04)
- ✓ Verb-mode filter unit tests (all 3 modes + insufficient-pool path) — v0.3 (TEST-03)
- ✓ Distractor-strategy unit tests (wrong-subject/wrong-tense/cross-verb + invariant) — v0.3 (TEST-04)
- ✓ Explanation-selection unit tests (template choice, fail-closed fallback, purity) — v0.3 (TEST-05)

All 14 v0.3 requirements shipped and independently verified, including
on-device confirmation of both the verb-mode chip UI and the explanation
panel (see `.planning/milestones/v0.3-MILESTONE-AUDIT.md`).

- ✓ Backend's v0.4 sample fixture copied into mobile as a self-contained test fixture, no cross-repo import at test runtime — v0.4 (CONTRACT-01)
- ✓ Fixture payload proven to parse through `validateDataset`/`LearningContentSchema`/`fetchRemoteVerbs` — v0.4 (CONTRACT-02)
- ✓ Fixture test asserts accented (`pôr`/`pôs`) and tied (`falam`) forms survive parsing unchanged — v0.4 (CONTRACT-03)
- ✓ `selectExplanation` provides all 7 backend v0.4 template variables (verb, selectedAnswer, correctAnswer, tenseLabel, subjectLabel, selectedTenseLabel, selectedSubjectLabel) — v0.4 (EXPL-05)
- ✓ Selected tense/subject resolved via `verb.formIndex[selectedAnswer]`, `matches[0]` convention, omitted on disagreement — v0.4 (EXPL-06)
- ✓ Backend-authored `tenseNotes[correctTense]`/`subjectHints[correctSubject]` appended when present — v0.4 (EXPL-07)
- ✓ Fail-closed behavior preserved — no fabricated grammar text — v0.4 (EXPL-08)
- ✓ Explanation unit tests cover new interpolation/appending/fail-closed paths — v0.4 (TEST-06)
- ✓ "Help us improve" entry point on Setup, Quiz, and Results — v0.4 (PFDBK-01)
- ✓ Quiz two-action row: "Report a problem" + "Help us improve" as distinct flows, divergent visibility gating — v0.4 (PFDBK-02)
- ✓ Product feedback payload submitted via `POST /product-feedback` matching the backend v0.4 contract exactly — v0.4 (PFDBK-03)
- ✓ Same 90s `AbortController` timeout + success/validation-error/server-error/network-error result union as existing feedback — v0.4 (PFDBK-04)
- ✓ Product feedback never includes quiz-answer context (verb/tense/subject/correctAnswer/selectedAnswer) — v0.4 (PFDBK-05)
- ✓ Product-feedback unit tests mirror existing feedback test coverage — v0.4 (TEST-07)

All 14 v0.4 requirements shipped and independently verified, including a
live human-verify checkpoint that caught and resolved a real cross-repo
contract gap (backend's `POST /product-feedback` wasn't deployed yet at
first check; confirmed via direct curl, backend team shipped the route,
re-verified 201 success on all 3 screens) — see `.planning/v0.4-MILESTONE-AUDIT.md`.

- ✓ `npx expo-doctor`/`npx expo install --check` run clean before release-config polish; throwaway `eas build` proves the native dependency graph on EAS cloud infra — v0.5 (BUILD-01, BUILD-02)
- ✓ Release identity locked: `app.json` `ios.bundleIdentifier` = `com.avram.aruh.lafa`, `ios.buildNumber` = `1`, `version` unchanged at `1.0.0`; EAS project id checked/reconciled before the first real build — v0.5 (IDENT-01, IDENT-02, IDENT-03, IDENT-04)
- ✓ Lafa-branded 1024x1024 alpha-free app icon generated from `assets/brand/lafa-logo-v2.svg`, Icon Composer bundle removed, splash reconciled, brand source files preserved unmodified — v0.5 (ICON-01, ICON-02, ICON-03, ICON-04)
- ✓ `eas.json` production build profile (EAS-managed credentials, `appVersionSource: remote`, `autoIncrement: true`) and submit profile with `ascAppId`; `app.json` export-compliance flag set — v0.5 (EASCFG-01, EASCFG-02, EASCFG-03)
- ✓ `npm run lint` clean (both `react-hooks/set-state-in-effect` failures fixed); reusable live-backend preflight script (`npm run preflight`) passes warm and cold; first real `eas build`+`eas submit` cycle reaches TestFlight; internal tester confirms install — v0.5 (SHIP-01, SHIP-02, SHIP-03, SHIP-04, SHIP-05)

All 18 v0.5 requirements shipped and independently verified — including two
retroactively-backfilled phase verifications (Phase 20, 22) written during
the milestone audit itself, both corroborated by live re-checks rather than
just trusted from SUMMARY claims — see `.planning/v0.5-MILESTONE-AUDIT.md`.
`app.json`'s `slug` reverted mid-milestone from `lafa` back to
`portuguese-verb-mobile` (IDENT-04's resolution) to match the EAS project's
immutable server-side registration; user-facing branding (`name: "Lafa"`,
`scheme: "lafa"`, `bundleIdentifier`) is unaffected.

### Active

To be defined in `.planning/REQUIREMENTS.md` for the next milestone
(run `/gsd:new-milestone` to start).

Full historical detail in `.planning/milestones/v0.1-REQUIREMENTS.md`,
`.planning/milestones/v0.2-REQUIREMENTS.md`, `.planning/milestones/v0.3-REQUIREMENTS.md`,
`.planning/milestones/v0.4-REQUIREMENTS.md`, and `.planning/milestones/v0.5-REQUIREMENTS.md`.

## Current Milestone: v0.6 Lafa Branding + Expo Splash Cleanup

**Goal:** Replace the AI-generated Lafa brand assets with the user-supplied
SVG icon as the canonical source, update the app palette to the new brand
guideline, regenerate every Expo app/startup asset from that source, and
eliminate the blue Expo default launch flash on cold start.

**Target features:**
- `assets/brand/lafa-icon.svg` (the user-supplied icon) becomes the sole
  source consumed by `scripts/generate-brand-assets.ts`; old AI-concept
  assets (`lafa-logo.svg`, `lafa-logo-v2.svg`, concept PNGs) are removed or
  unreferenced.
- `src/theme/tokens.ts` updated to the new guideline palette (primary
  orange `#F2643E`, deep orange `#C94A2D`, soft peach `#FDE7DF`, teal
  `#36799A`, green `#1F7F66`, ink `#24201E`, stone `#746D69`, canvas
  `#F1EFED`, warm background `#FFF9F6`), keeping existing semantic token
  names where possible.
- Regenerated `icon.png`, `favicon.png`, `splash-icon.png` (transparent,
  mark-only), Android adaptive foreground + monochrome images; Android
  adaptive background image usage removed in favor of a solid background
  color.
- `app.json` splash/adaptive-icon config updated off Expo blue
  (`#208AEF` → `#FFF9F6`), `imageWidth` set to `160`, Android
  `backgroundImage` removed, `userInterfaceStyle` set to `"light"`.
- `app/_layout.tsx` applies brand tokens to the Stack/header/status bar and
  sets the runtime root background via `expo-system-ui` to prevent a
  post-splash flash.
- New palette applied across Setup, Quiz, Results, feedback modals,
  `OfflinePill`, and `ExplanationPanel` — no screen still hardcodes/depends
  on the old Expo-blue or old brand hex values.
- A brand validation script/check confirming no blue splash/adaptive
  background remains, generated PNG dimensions are correct, `icon.png` has
  no alpha channel, and the generator no longer references old SVG sources.

**Key context:** Sourced from a plan document
(`Lafa Branding + Expo Splash Cleanup Plan.md`) already reviewed and
confirmed against the current codebase (verified `#208AEF` blue splash,
old `#E8663D`/`#2FA84F` palette, and existing
`scripts/generate-brand-assets.ts` all match the plan's assumptions before
scoping). Final splash/flash verification must happen on an EAS
release/preview build, not Expo Go/dev client, per Expo's splash-screen
docs. No precise vector wordmark exists yet — do not invent one; typography
stays system-based.

New tech debt surfaced during v0.4 (non-blocking, see
`.planning/v0.4-MILESTONE-AUDIT.md` for full detail, carried forward —
none addressed by v0.5's release-engineering scope):
- `selectExplanation`'s `selectedTenseLabel`/`selectedSubjectLabel` are only
  populated when matches agree — if a future backend `templates.generic`
  string ever adds a placeholder for either, it would render un-replaced
  rather than fail closed. No current template exercises this path.
- Phases 17/18/19's `VALIDATION.md` task tables were never updated
  post-execution (stale "pending" status despite each phase's independent
  VERIFICATION.md confirming all tests pass) — a pre-existing
  documentation-habit gap in this project, not unique to v0.4.

New tech debt surfaced during v0.5 (non-blocking, see
`.planning/v0.5-MILESTONE-AUDIT.md` for full detail):
- `npx expo-doctor` reports 2 advisory failures (`eas` npm script vs.
  `.bin` conflict, `eas-cli` as a project dependency) — a deliberate,
  documented Phase 20 tradeoff (D-04) to bypass a stale global `eas-cli`
  shadowing this dev machine's `npx` resolution, not a regression.
- Phase 20 and 22's `VERIFICATION.md` were backfilled retroactively during
  the milestone audit rather than generated immediately post-execution —
  flagged `retroactive: true` in both files' frontmatter for traceability.

Full v0.3/v0.4/v0.5 goal/scope detail archived at
`.planning/milestones/v0.3-ROADMAP.md`, `.planning/milestones/v0.4-ROADMAP.md`,
and `.planning/milestones/v0.5-ROADMAP.md`.

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
- Prepositions quiz type / verb-preposition mappings — explicitly deferred to a future cross-repo milestone in v0.3; backend owns canonical data, mobile should not invent it. **Still valid.**
- Fixing the cross-verb distractor formIndex-miss gap (a Phase-14 cross-verb wrong answer's conjugation string is looked up against the *question's own verb's* `formIndex`, which rarely matches, so no explanation renders for that specific wrong answer) — explicitly deferred in both Phase 15 and 16 CONTEXT.md as out of scope for v0.3. Degrades gracefully (fail-closed per EXPL-03, no crash), just an occasional silent absence of an explanation. **Still valid** — candidate for a future phase if a broader per-verb-pair data shape is worth the backend investment.
- Modifying or reinterpreting backend grammar content — backend v0.4 is the source of truth; mobile only consumes and displays it. **Still valid**, confirmed by Phase 17's zero-cross-repo-coupling fixture approach.
- Collecting personal contact info in product feedback — not part of the backend v0.4 contract; `category`/`message`/`screen`/`appVersion`/`platform` only. **Still valid**, confirmed by Phase 19's payload shape.
- Changes to the existing quiz-specific `POST /feedback` — explicitly untouched by v0.4; product feedback is a new, separate endpoint/domain. **Still valid**, confirmed by zero cross-imports between `src/feedback/` and `src/productFeedback/`.
- External (non-Apple-Developer-team) TestFlight testers — triggers Apple's first-time Beta App Review (~24-48h); explicitly deferred to keep v0.5's timeline predictable. **Still valid** — operator created an external testing group but deliberately left it unpopulated/unsubmitted this milestone; candidate for a future milestone.
- Full public App Store listing (screenshots, description, privacy nutrition label) — TestFlight-only distribution this milestone. **Still valid.**
- `.eas/workflows/` automated build+submit CI pipeline — one-shot manual build/submit was sufficient for the first release; automation is premature before a second release cycle. **Still valid**, tracked as v2 candidate `RELEASE-01`.
- Fastlane / manually-managed `.p12` credentials — EAS-managed (remote) Apple credentials chosen instead; no existing fastlane/match infrastructure to build on. **Still valid.**
- Durable Node-version pin (`.nvmrc` or CI guard) — the npm-version lockfile drift (Node 25/npm 11 local vs. Node 22/npm 10 EAS build image) recurred twice in v0.5 (Phase 20's throwaway build, then again in Phase 24's real build) despite Phase 20 explicitly flagging it as a recommendation for a later phase. **Not yet addressed** — real recurring friction, strong candidate for the next milestone rather than deferred indefinitely.

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

**Current codebase state (end of v0.5):**
- ~6,900 LOC across TypeScript/TSX (`src/`, `app/`, `__tests__/`) — unchanged
  from v0.4, since v0.5 touched only release config (`app.json`, `eas.json`),
  two lint fixes with no behavior change, and two new standalone `scripts/`
  files (`generate-brand-assets.ts`, `preflight.ts`)
- 251 tests passing across 21 suites; strict TypeScript (`tsc --noEmit`)
  and `npm run lint` both clean project-wide
- 24 phases total (6 in v0.0, 5 in v0.1 incl. inserted 10.1, 2 in v0.2, 4 in
  v0.3, 3 in v0.4, 5 in v0.5), 61 plans, v0.5 built in 3 days (2026-07-23
  kickoff → 2026-07-25 ship)
- Both feedback modals (`ReportFeedbackModal`, `ProductFeedbackModal`) now
  use a React Compiler-safe render-time `useState` reset pattern (swapped
  from the originally-planned `useRef` mid-Phase-24, since this project has
  `experiments.reactCompiler: true` enabled) instead of `setState`-in-effect
- App icon/splash now Lafa-branded end-to-end (`assets/images/icon.png`,
  `splash-icon.png`), generated reproducibly from `assets/brand/lafa-logo-v2.svg`
  via `npm run generate-assets`; Icon Composer bundle removed
- `eas.json` fully configured (production build + submit profiles, real
  `ascAppId`); first real signed iOS build submitted and TestFlight-installed
- New `src/productFeedback/` domain module (types, Zod schema, categories,
  payload, submit, `ProductFeedbackModal`) added in v0.4, a deliberate
  zero-shared-code structural mirror of `src/feedback/` — untouched by v0.5
- Known non-blocking tech debt (see `.planning/v0.4-MILESTONE-AUDIT.md` and
  `.planning/v0.5-MILESTONE-AUDIT.md` for full detail): `selectExplanation`'s
  selected-label interpolation is only populated on match-agreement, a
  template-content edge case to watch (not an active bug); Phases 17/18/19's
  `VALIDATION.md` task tables never updated post-execution (stale "pending"
  status, cosmetic doc-sync gap, pre-existing pattern also seen in Phase 15);
  a Phase-14 cross-verb distractor's wrong-answer form still occasionally
  doesn't resolve in the explanation `formIndex` lookup (fail-closed,
  explicitly accepted scope limit, carried from v0.3); carried-forward v0.2
  tech debt (WCAG contrast, `OfflinePill` on Results' no-session fallback,
  `handleBackToSetup()` not calling `reset()`); `npx expo-doctor` 2 advisory
  failures from the deliberate `eas-cli` devDependency pin (v0.5, D-04); no
  durable Node-version pin exists yet despite the lockfile-drift bug
  recurring twice in v0.5 (flagged above in Out of Scope as a strong
  candidate for the next milestone).

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
| `VerbMode` replaces `GenerateOptions.includeIrregular: boolean` outright (not additive) | A 3-way union properly models `regular_only`/`mixed`/`irregular_only`; keeping a redundant boolean alongside it would let the two disagree | ✓ Good — single source of truth, zero drift risk, all call sites updated same-phase |
| Distractor tier 2 (same-verb wrong-tense) prioritizes the Completed-past/Imperfect-past confusion pair specifically | That's the single highest-value pedagogical confusion for A1-A2 European Portuguese learners, per user's domain knowledge | ✓ Good — tier ordering verified by dedicated unit tests, no regressions to the 4-unique/1-correct invariant |
| Tier 3 cross-verb distractors are not excluded from the explanation-selection pipeline, even though their `formIndex` lookup often misses | Excluding them would mean irregular-only mode (smaller same-verb pool, more tier-3 usage) systematically shows fewer explanations — worse for exactly the learners who need them most | ✓ Good, ⚠️ known gap — fail-closed (no crash, no fabricated content) per EXPL-03; explanation coverage is uneven across distractor tiers, logged as accepted limitation, not reopened this milestone |
| `selectExplanation` is a pure function taking `(verb, selectedAnswer, question, learning)`, never throws | Matches this project's established pattern (`generate()`, `score()`) of pure, framework-free, unit-testable domain logic with fail-closed `undefined` returns instead of exceptions | ✓ Good — 11/11 unit tests including an explicit purity assertion, zero UI coupling until Phase 16 |
| `useQuizStore` gained `verbs`/`learning` fields rather than Phase 16 re-fetching or re-deriving them | The session-snapshot `resolveVerbs()` result already had both fields threaded through since Phase 15 — the store was the only layer silently discarding them | ✓ Good — closed two real wiring bugs (store discarding `learning`, `quiz.tsx` reading the bundled dataset instead of the session snapshot) that pre-dated Phase 16's own scope |
| Conditional mount (no reserved space) for `ExplanationPanel`, unlike the opacity-0 pattern used elsewhere in `quiz.tsx` | User's explicit choice (D-02) — matches EXPL-03's literal "no panel is shown" requirement; accepted tradeoff of choices/Next button shifting position slightly | ✓ Good — user-approved, on-device confirmed, zero complaints about layout shift |
| Backend v0.4 fixture copied byte-for-byte into mobile's test tree (not imported cross-repo at test runtime) | Proves the real contract shape parses without introducing a runtime or build-time dependency on the sibling backend repo | ✓ Good — `diff`-verified identical to backend source, zero cross-repo coupling, 5/5 fixture tests pass |
| `src/productFeedback/` built as a zero-shared-code structural mirror of `src/feedback/` (D-07) rather than generalizing a shared feedback abstraction | Two genuinely independent domains (quiz-answer report vs. general product feedback) with different payload shapes; premature abstraction risked coupling them | ✓ Good — confirmed zero cross-imports in either direction; "Report a problem" and "Help us improve" remain fully independent flows on the Quiz screen |
| Product feedback entry point uses a hardcoded literal `screen` prop per call site, not `usePathname()` (D-08) | Simpler, explicit, and avoids a runtime dependency on router internals for a value that's static per screen | ✓ Good — zero ambiguity, `screen="setup"/"quiz"/"results"` set once per call site |
| `POST /product-feedback` cross-repo blocker (backend hadn't shipped the route, 404) resolved live during the Phase 19 human-verify checkpoint rather than deferred as a known gap | User pushed the corresponding backend route mid-checkpoint instead of shipping mobile with an unverified endpoint | ✓ Good — re-verified 201 success on all 3 screens by both the human operator and an independent gsd-verifier live curl check |
| Pin `eas-cli` as a devDependency + `npm run eas` script (D-04) despite triggering 2 new `expo-doctor` advisory checks | A stale global `eas-cli@20.0.0` shadowed bare `npx eas-cli` on the dev machine; pinning locally + an explicit npm script was the documented mitigation | ✓ Good — deliberate, accepted tradeoff; BUILD-01's "expo-doctor 0 failures" truth was independently satisfied *before* this change landed |
| `app.json` `slug`/`scheme` locked to `lafa` in Phase 21 despite the EAS project's server-side slug still being `portuguese-verb-mobile` (IDENT-04) | Release identity should be finalized before any real build, even with a known reconciliation gap; Phase 21 investigated thoroughly (CLI + dashboard) and found no rename path, explicitly handing the decision to Phase 24 | ⚠️ Revisit → resolved — Phase 24 reverted `slug` back to `portuguese-verb-mobile` (matching the immutable server-side registration) rather than creating a new EAS project, which would have orphaned the Phase 20 proof build and required re-provisioning Apple credentials; `name`/`scheme`/`bundleIdentifier` unaffected |
| `package-lock.json` must be regenerated under the same npm major version bundled in the EAS build image (Node 22/npm 10), not whatever npm version the local dev machine runs | A lockfile written by a newer local npm (Node 25/npm 11) encodes an `optionalDependencies[].libc` field that npm 10's `npm ci` rejects as out-of-sync, causing a misleading "missing package" error | ✓ Good, but recurring — this bug was found and fixed once in Phase 20 (`9b48acf`) and recurred identically in Phase 24 (`d005442`) since no durable `.nvmrc`/CI Node-version guard was ever added; flagged in Out of Scope as a strong candidate for the next milestone |
| `eas submit`'s current pinned CLI version has no interactive Apple ID/password auth path for iOS submit — App Store Connect API Key is the only supported method | Version-driven change in `eas-cli`, not a choice made against the plan's original intent (which assumed interactive Apple ID login) | ✓ Good — operator generated an ASC API Key interactively during the first real submit; works, though it creates a persistent credential rather than a one-off login |
| External TestFlight testers explicitly excluded from v0.5, even though the operator had already created an external testing group | Matches REQUIREMENTS.md's Out-of-Scope entry (Beta App Review triggers a ~24-48h delay); operator confirmed mid-checkpoint to skip it rather than expand scope | ✓ Good — kept v0.5's scope exactly as specified; external group left empty/unsubmitted for a future milestone |

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
*Last updated: 2026-07-25 after v0.5 milestone (iOS TestFlight Readiness)*
