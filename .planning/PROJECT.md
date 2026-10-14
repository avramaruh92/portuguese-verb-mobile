# Lafa — Portuguese Verb Conjugation App (Mobile)

## What This Is

**Lafa** is the product/brand name for this app, and as of v0.2
(shipped 2026-07-19) the in-app display name genuinely says "Lafa" —
`app.json` `expo.name` and the native share message read "Lafa", and
(since v1.0) the Setup screen shows a branded "Lafa" image lockup. The repo, slug, and backend sibling repo name
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

**Shipped in v0.6:** the app's visual identity is rebuilt from a single
user-supplied source. `assets/brand/lafa-icon.svg` replaces the old
AI-generated concept assets as the sole input to
`scripts/generate-brand-assets.ts`, regenerating icon/favicon/splash/Android
adaptive assets. `src/theme/tokens.ts` carries the new 10-key Lafa guideline
palette (primary orange `#F2643E`, deep orange `#C94A2D`, teal `#36799A`,
warm background `#FFF9F6`, etc.), with `pressed`/`info`/`infoSoft` added as
new alias keys. The Expo-blue splash and adaptive-icon backgrounds are gone
— cold launch now shows the warm Lafa canvas with no unbranded flash, native
headers/status bar are themed, and `userInterfaceStyle` is locked to light.
Every screen and shared component (Setup, Quiz, Results, both feedback
modals, `OfflinePill`, `ExplanationPanel`) consumes the new tokens, including
new pressed-state visuals on primary-action buttons, with zero remaining
old-palette hex anywhere in `app/`/`src/`. A new `scripts/validate-brand.ts`
automates the rebrand's correctness proof (config hex, PNG dimensions/alpha,
generator source hygiene) as a permanent regression gate, and the rebrand
was confirmed end-to-end on a real EAS preview build with dated developer
sign-off.

**Shipped in v1.0 (2026-10-11) — Lafa 1.0.0 is live-ready on the App Store:**
the Warm Bold Mark is the canonical brand source (id-based layer extraction in
the asset generator), the Setup screen shows a branded image lockup instead
of a plain-text title, unsubmitted answer presses use a neutral
`choicePressed` color so they no longer read as "wrong", `validate-brand`
also gates the lockup, and Node 22.23.2 is pinned in `.nvmrc`/`engines`/
`eas.json` — structurally closing the 3x-recurring lockfile drift. Lafa
1.0.0 (build #6) went through full App Store Connect submission (versioned
listing/privacy/screenshots in `store/`, Support + Privacy pages on GitHub
Pages) and is **Ready for Distribution** after a Guideline 2.1 info request
and resubmission.

**Shipped in v1.1 (2026-10-14) — Lafa 1.0.1 is live on the App Store against
the Frankfurt API:** every request goes through one `API_BASE_URL`
(`https://portuguese-verb-api-fra.onrender.com`) with a Jest guard against the
retired Oregon host. Content fetch times out at 15s and feedback POSTs at 45s.
Build 8 was verified end to end on a real iPhone from TestFlight, then went
Ready for Distribution on 2026-10-12 with automatic release. The backend has
an explicit Oregon-deletion gate (HAND-02). `validate-brand` was also hardened
to 40 checks (pixel colour and lockup crop).

## Current State (v1.1 shipped)

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
- Full visual rebrand shipped in v0.6: brand assets regenerated from a
  single user-supplied SVG source, `src/theme/tokens.ts` carries the new
  Lafa guideline palette, Expo-blue splash/adaptive-icon backgrounds and
  the post-splash white flash are gone, every screen/shared component
  consumes the new tokens (incl. pressed-state visuals), and
  `scripts/validate-brand.ts` gates the rebrand as a permanent regression
  check — confirmed on a real EAS preview build with developer sign-off.
  No product/UX-flow changes; the Setup → Quiz → Results loop is
  unchanged since v0.4.
- v1.0: Warm Bold Mark brand source, Setup-screen image lockup, neutral
  quiz press-state color, lockup-aware `validate-brand` (21 checks), and a
  durable Node 22.23.2 pin enforced on EAS via `eas.json`
- **Lafa 1.0.0 is Ready for Distribution in App Store Connect** (build #6,
  bundle `com.avram.aruh.lafa`); listing, privacy answers, screenshots and
  submission log versioned in `store/`, public Support/Privacy pages in
  `docs/` (GitHub Pages — repo is now public)
- v1.1: all three network calls use the Frankfurt `API_BASE_URL` from
  `src/config/api.ts`. Timeouts are 15s for content and 45s for both feedback
  POSTs. `__tests__/api-host-guard.test.ts` blocks the Oregon host, and
  `scripts/preflight.ts` keeps its own matching literal
- **Lafa 1.0.1 (build 8) is live on the App Store** (Ready for Distribution
  2026-10-12, automatic release, phased release off). Oregon deletion is now
  the backend's call (REGION-05), under the HAND-02 gate
- `validate-brand` checks pixel colour on all 6 brand PNGs and the Setup
  lockup crop constants. Brand hex values live in `scripts/brand-colors.ts`
  and crop constants in `src/theme/lockup.ts` (40 checks)
- 277 tests / 23 suites; typecheck, lint, `validate-brand` all green

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

**Still the right priority after shipping v0.6** — a brand/visual pass by
design, with zero product/UX-flow changes; the core loop is functionally
identical to what v0.5 shipped, now wearing the correct brand identity
end-to-end (assets, palette, splash, on-screen tokens).

**Still the right priority after shipping v1.1.** v1.1 was a forced
infrastructure move with no product or UI changes. The device E2E confirmed
the loop still degrades gracefully: in airplane mode the quiz ran on bundled
content with the offline pill showing.

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

- ✓ `assets/brand/lafa-icon.svg` (user-supplied SVG) is the sole source
  `scripts/generate-brand-assets.ts` consumes — v0.6 (BRAND-01)
- ✓ Old AI-generated brand assets removed/unreferenced — v0.6 (BRAND-02)
- ✓ Generator produces icon/favicon/splash/Android adaptive
  foreground+monochrome to spec (opaque icon, transparent splash mark,
  centered Android safe-zone mark) — v0.6 (BRAND-03)
- ✓ `src/theme/tokens.ts` carries the new guideline palette with existing
  semantic names preserved, new pressed/info aliases added — v0.6
  (THEME-01)
- ✓ `tokens.test.ts` asserts the new palette values exactly — v0.6
  (THEME-02)
- ✓ `app.json` splash/adaptive-icon config off Expo blue, warm background,
  `imageWidth` 160, no `backgroundImage` — v0.6 (CONFIG-01, CONFIG-02)
- ✓ `userInterfaceStyle` locked to `"light"` — v0.6 (CONFIG-03)
- ✓ `app/_layout.tsx` themes headers/status bar/runtime root background,
  eliminating the post-splash flash — v0.6 (CONFIG-04)
- ✓ Setup heading stays token-styled text, no invented wordmark — v0.6
  (UI-01)
- ✓ Setup, Quiz, Results, both feedback modals, `OfflinePill`,
  `ExplanationPanel` all consume updated tokens, zero old-palette hex
  remains — v0.6 (UI-02)
- ✓ `scripts/validate-brand.ts` automates config/asset/generator-hygiene
  validation as a permanent gate — v0.6 (VALID-01)
- ✓ Full test/typecheck/lint suite passes after the palette/config
  changes — v0.6 (VALID-02)
- ✓ Manually verified on a real EAS preview build (not Expo Go/dev
  client): splash, icon, palette all correct — v0.6 (VALID-03)

All 14 v0.6 requirements shipped and independently verified, including a
dated developer sign-off on a real EAS preview build — see
`.planning/milestones/v0.6-REQUIREMENTS.md`.

- ✓ Node 22.23.2 pinned in `.nvmrc`, `engines.node`, `eas.json`; lockfile
  regenerated clean and proven on a real EAS production build — v1.0
  (BUILD-01..04)
- ✓ Warm Bold Mark promoted to `assets/brand/lafa-icon.svg`; generator uses
  id-based layer lookup; all brand assets regenerated; `icon.png` opaque,
  confirmed on the real `.ipa` — v1.0 (BRAND-01..04)
- ✓ Homepage lockup SVG → generated 3200×1040 PNG → Setup screen `Image`
  replacing the plain-text title — v1.0 (LOCKUP-01..03)
- ✓ `colors.choicePressed` for unsubmitted answer presses; locked
  correct/incorrect colors always win — v1.0 (UX-01..03)
- ✓ `validate-brand` checks canonical source, asset dimensions, icon alpha,
  and lockup presence — v1.0 (VALID-01..04)
- ✓ Full App Store submission: versioned metadata, live Support/Privacy
  URLs, accurate privacy label (all 3 network calls), 4+ age rating,
  `supportsTablet: false`, 3 alpha-free 1320×2868 screenshots, export
  compliance, production EAS build + submit, App Review — Ready for
  Distribution — v1.0 (STORE-01..09)

All 27 v1.0 requirements shipped and verified (milestone audit: 27/27,
no blockers, 12 non-blocking debt items) — see
`.planning/milestones/v1.0-REQUIREMENTS.md` and
`.planning/milestones/v1.0-MILESTONE-AUDIT.md`.

- ✓ All requests (content, quiz feedback, product feedback) use one shared
  Frankfurt `API_BASE_URL`; a Jest guard fails on the Oregon host in `src/`
  or `scripts/`; preflight passes live against Frankfurt; docs no longer
  present Oregon as current — v1.1 (API-01..04). Validated in Phase 36.
- ✓ Content fetch aborts at 15s, both feedback POSTs at 45s; content fetch
  proven to send no cache-busting and to fall back on any non-200 incl. 304
  — v1.1 (NET-01..03). Validated in Phase 36.
- ✓ Lafa 1.0.1 (EAS build 8) built, installed from TestFlight and verified on
  a real iPhone against Frankfurt (online content + both feedback 201s;
  airplane-mode fallback with pill, quiz, graceful Retry); backend handoff
  status line committed — v1.1 (REL-01/02, E2E-01..04, HAND-01). Validated in
  Phase 37.
- ✓ Lafa 1.0.1 (build 8) submitted to App Review 2026-10-11 with Frankfurt
  review notes, automatic release, phased release off; Ready for
  Distribution and live on the App Store 2026-10-12; HAND-02 Oregon-deletion
  gate line committed to the backend handoff log — v1.1 (REL-03, REL-04,
  HAND-02). Validated in Phase 38.
- ✓ v1.0 audit tech debt closed: `validate-brand` now gates pixel colour on
  all 6 brand PNGs, resolves paths from the repo root, and gates the Setup
  lockup crop constants (shared via `scripts/brand-colors.ts` and
  `src/theme/lockup.ts`, 37 checks); ignored `ios.buildNumber` documented;
  stale 30-02/35-06 SUMMARYs and screenshots README corrected — v1.1
  (DEBT-01..05). Validated in Phase 39.

### Active

No milestone is active. The next one is defined via `/gsd:new-milestone`,
which creates a fresh `.planning/REQUIREMENTS.md`.

- [ ] Analytics SDK for usage metrics (backlog item 999.1)

Full historical detail in `.planning/milestones/v0.1-REQUIREMENTS.md` …
`.planning/milestones/v1.1-REQUIREMENTS.md`.

## Next Milestone Goals

Not yet chosen. Candidates carried out of v1.1:
- `POST /events` quiz-completion tracking. The backend already supports it,
  and it relates to backlog 999.1 (analytics)
- A custom API domain, so a future host move needs no app release (v1.1 was
  forced into a release purely to change the host)
- A minimum-version / update prompt, so stragglers like the remaining 1.0.0
  installs can be nudged off old builds
- Reconsidering the 45s cold-boot duplicate-feedback risk (NET-02 / WR-02),
  for example an idempotency key, if duplicates show up in backend data

<details>
<summary>v1.1 Frankfurt API Cutover — milestone brief (archived)</summary>


**Goal:** Ship Lafa 1.0.1 pointing at the Frankfurt API
(`https://portuguese-verb-api-fra.onrender.com`) to TestFlight and the App
Store before **2026-11-01**, and hand the backend a clear Oregon-deletion
gate.

**Target features:**
- One shared API base-URL constant used by `src/dataset/remote.ts`,
  `src/feedback/submit.ts` and `src/productFeedback/submit.ts`; a guard test
  that fails if the Oregon host (`portuguese-verb-api.onrender.com`) appears
  in `src/` or `scripts/`; Oregon references updated in `scripts/preflight.ts`,
  `store/metadata/review-notes.md`, `store/privacy/nutrition-label-answers.md`,
  `CLAUDE.md`, `AGENTS.md`
- Timeouts lowered: content fetch 90s → 15s, quiz feedback and product
  feedback 90s → 45s (covers a ~40s Render cold boot or the observed ~11s
  product-feedback latency, not both; the rare cold-boot duplicate row on
  Retry is an accepted risk — Phase 36 review WR-02)
- HTTP revalidation (ETag/304): no behaviour change — a guard test proves
  the content fetch sends no cache headers/query params and any non-200
  (incl. a raw 304) falls back to the local dataset
- Release 1.0.1 (build #7+, remote autoIncrement) via EAS → TestFlight →
  App Store, automatic release on approval; build number, dates, status
  strings and release option recorded verbatim in `store/submission-log.md`
- Real-device E2E against Frankfurt on the TestFlight build: content from
  API (no offline pill), quiz feedback 201, product feedback 201,
  airplane-mode/timeout fallback intact
- Hand-back: status line + Oregon-deletion gate recommendation appended to
  `../portuguese-verb-backend/docs/mobile-handoff.md`
- Droppable tech-debt phase (runs during App Review wait, never blocks the
  release): buildNumber-drift note, validate-brand WR-01/WR-02 + lockup crop
  gating, doc fixes (30-02 Node claim, 35-06 ending, `ios/` README)

**Key context:**
- Lafa 1.0.0 build #6 is **live on the App Store** (confirmed 2026-10-11) and
  calls Oregon. Once 1.0.1 is live, all new downloads get Frankfurt; only
  existing 1.0.0 installs keep hitting Oregon until iOS auto-updates them.
- **Oregon-deletion gate recommendation:** delete Oregon once 1.0.1 is live
  on the App Store AND (≈48h of no real Oregon requests OR 2026-10-30),
  whichever comes first. Rationale: a 1.0.0 straggler after deletion still
  gets a fully working quiz (bundled dataset + offline pill) and only loses
  feedback submission (error + Retry), whereas missing 1 Nov returns
  Frankfurt to cold starts for *every* user. The date clause replaces a
  "48h quiet" condition that 1.0.0 users could block indefinitely.
- Contract and response bodies unchanged; no API contract change in scope.

**Later-milestone candidates (not v1.1):** `POST /events` quiz-completion
tracking (backend supports it; relates to backlog 999.1), a custom API
domain so future host moves need no app release, a minimum-version /
update prompt.

**Outcome:** Shipped 2026-10-14. Phases 36-39, 11 plans, 22/22 requirements.
Lafa 1.0.1 went live on 2026-10-12, five days ahead of the ~2026-10-17 target.
HAND-02 was committed to the backend log on 2026-10-13.

</details>

## Carried-forward tech debt

See `milestones/v1.1-MILESTONE-AUDIT.md`, `milestones/v1.0-MILESTONE-AUDIT.md`
and prior audits:
- A 45s feedback timeout during a Render cold boot can create a duplicate
  feedback row on Retry. Accepted risk (v1.1, NET-02 / WR-02).
- 39-REVIEW info items IN-01..IN-04 are unfixed: the 1600×520 lockup size is
  duplicated in `app/index.tsx` and the validator, `main()` rejection is
  unhandled, and `hexToRgb` accepts malformed input (v1.1).
- `allowImportingTsExtensions: true` is safe while only `scripts/` uses
  `.ts`-suffixed imports. Copying that style into `app/`/`src/` could break
  Metro (v1.1).
- Backend `disableRequestLogging` (which the privacy label's "no IPs
  logged" claim relies on) is deprecated in Fastify 6 — re-verify the label
  claim on that upgrade (v1.0).
- SUMMARY `requirements-completed` frontmatter and per-phase `VALIDATION.md`
  files are inconsistently maintained (v1.0 Phases 30-34 have none) — a
  recurring documentation-habit gap (v0.3/v0.4/v1.0).
- `selectExplanation`'s `selectedTenseLabel`/`selectedSubjectLabel` are only
  populated when matches agree — a future backend `templates.generic`
  placeholder for either would render un-replaced rather than fail closed (v0.4).
- The Lafa palette was not independently WCAG-AA contrast-audited after the
  v0.6 replacement — spot-check if accessibility becomes a priority (v0.2/v0.6).

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
- ~~Full public App Store listing (screenshots, description, privacy nutrition label) — TestFlight-only distribution this milestone.~~ **Reversed in v1.0** — full App Store submission was the v1.0 goal; Lafa 1.0.0 is Ready for Distribution.
- `.eas/workflows/` automated build+submit CI pipeline — one-shot manual build/submit was sufficient for the first release; automation is premature before a second release cycle. **Still valid**, tracked as v2 candidate `RELEASE-01`.
- Fastlane / manually-managed `.p12` credentials — EAS-managed (remote) Apple credentials chosen instead; no existing fastlane/match infrastructure to build on. **Still valid.**
- ~~Durable Node-version pin (`.nvmrc` or CI guard)~~ — **Resolved in v1.0** (Phase 30): Node 22.23.2 pinned in `.nvmrc`, `engines.node` and `eas.json`; no drift since.
- Hand-drawn/vector wordmark — no precise vector wordmark was supplied for v0.6 either; typography stayed system-based per plan assumptions. **Still valid.**
- Full dark mode / dual theme system — `userInterfaceStyle` stayed locked to `"light"` through v1.0; no dual-theme system exists yet. **Still valid.**
- Redesigning icon/screen layout or IA — v0.6 was a brand-asset/token substitution pass only, confirmed zero layout/IA changes across all 5 phases. **Still valid.**

## Context

- Sibling repo `portuguese-verb-api` (`avramaruh92/portuguese-verb-backend`) is
  live at `https://portuguese-verb-api-fra.onrender.com` (Frankfurt) since the
  v1.1 cutover. The old Oregon host (`portuguese-verb-api.onrender.com`) is
  only called by un-updated 1.0.0 installs and is scheduled for deletion by
  the backend (HAND-02 gate, no later than 2026-10-30).
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

**Current codebase state (end of v1.1):**
- ~8.3k LOC across TypeScript/TSX (`src/`, `app/`, `__tests__/`,
  `scripts/`). v1.1 touched 22 app/src/scripts/test/config files (+576/−92);
  the rest of the milestone was release, store and handoff work
- 277 tests passing across 23 suites; `tsc --noEmit`, `npm run lint` and
  `npm run validate-brand` (40 checks) all clean
- 39 phases total (6 in v0.0, 5 in v0.1 incl. inserted 10.1, 2 in v0.2, 4 in
  v0.3, 3 in v0.4, 5 in v0.5, 5 in v0.6, 6 in v1.0, 4 in v1.1), 96 plans
- Toolchain pinned: Node 22.23.2 / npm 10.9.8 (`.nvmrc`, `engines.node`,
  `eas.json` `build.production.node`)
- Brand source `assets/brand/lafa-icon.svg` and
  `assets/brand/lafa-homepage-lockup.svg`, rendered by
  `scripts/generate-brand-assets.ts` and gated by `scripts/validate-brand.ts`
  (shared hex values in `scripts/brand-colors.ts`, crop constants in
  `src/theme/lockup.ts`)
- `store/` holds versioned App Store Connect metadata, privacy answers,
  screenshots and a multi-version submission log (1.0.0 and 1.0.1); `docs/`
  serves Support and Privacy pages via GitHub Pages
- `eas.json`: `appVersionSource: remote` + `autoIncrement`. 1.0.0 shipped as
  build 6 and 1.0.1 as build 8
- Network calls: `GET /content/verbs`, `POST /feedback`,
  `POST /product-feedback`, all on the Frankfurt `API_BASE_URL`
- Known non-blocking tech debt: see "Carried-forward tech debt" above and
  `milestones/v1.1-MILESTONE-AUDIT.md`.

## Constraints

- **Tech stack**: Expo (React Native) + TypeScript + Expo Router — iOS-first — locked by CLAUDE.md and confirmed at project setup
- **State management**: Zustand for quiz session state — chosen over plain React state for nicer ergonomics as quiz logic grows; app remains small so no heavier state library needed
- **Testing**: Jest with the Expo preset — standard for Expo/RN, works out of the box with TypeScript
- **Backend contract**: Mobile only ever calls `POST /feedback`, `POST /product-feedback` and `GET /content/verbs` (dataset fetch, with local fallback) on the live backend at `API_BASE_URL` (`src/config/api.ts`); never connects to Supabase directly or stores credentials — locked cross-repo constraint
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
| Pin `eas-cli` as a devDependency + `npm run eas` script (D-04) despite triggering 2 new `expo-doctor` advisory checks | A stale global `eas-cli@20.0.0` shadowed bare `npx eas-cli` on the dev machine; pinning locally + an explicit npm script was the documented mitigation | ✓ Good → retired — superseded 2026-08-16 by quick task 260816-k8y once the global `eas-cli` satisfied `eas.json`'s `cli.version` floor; devDependency and script removed, `expo-doctor` clean |
| `app.json` `slug`/`scheme` locked to `lafa` in Phase 21 despite the EAS project's server-side slug still being `portuguese-verb-mobile` (IDENT-04) | Release identity should be finalized before any real build, even with a known reconciliation gap; Phase 21 investigated thoroughly (CLI + dashboard) and found no rename path, explicitly handing the decision to Phase 24 | ⚠️ Revisit → resolved — Phase 24 reverted `slug` back to `portuguese-verb-mobile` (matching the immutable server-side registration) rather than creating a new EAS project, which would have orphaned the Phase 20 proof build and required re-provisioning Apple credentials; `name`/`scheme`/`bundleIdentifier` unaffected |
| `package-lock.json` must be regenerated under the same npm major version bundled in the EAS build image (Node 22/npm 10), not whatever npm version the local dev machine runs | A lockfile written by a newer local npm (Node 25/npm 11) encodes an `optionalDependencies[].libc` field that npm 10's `npm ci` rejects as out-of-sync, causing a misleading "missing package" error | ✓ Good, but recurring — this bug was found and fixed once in Phase 20 (`9b48acf`) and recurred identically in Phase 24 (`d005442`) since no durable `.nvmrc`/CI Node-version guard was ever added; flagged in Out of Scope as a strong candidate for the next milestone |
| `eas submit`'s current pinned CLI version has no interactive Apple ID/password auth path for iOS submit — App Store Connect API Key is the only supported method | Version-driven change in `eas-cli`, not a choice made against the plan's original intent (which assumed interactive Apple ID login) | ✓ Good — operator generated an ASC API Key interactively during the first real submit; works, though it creates a persistent credential rather than a one-off login |
| External TestFlight testers explicitly excluded from v0.5, even though the operator had already created an external testing group | Matches REQUIREMENTS.md's Out-of-Scope entry (Beta App Review triggers a ~24-48h delay); operator confirmed mid-checkpoint to skip it rather than expand scope | ✓ Good — kept v0.5's scope exactly as specified; external group left empty/unsubmitted for a future milestone |
| `assets/brand/lafa-icon.svg` (user-supplied) fully replaces the prior AI-generated concept SVGs as the sole brand-asset source, rather than iterating on the existing `lafa-logo-v2.svg` | User supplied a definitive SVG mark ahead of v0.6 kickoff; generator was rewritten around its two-shape structure instead of patching the old generator to accept a new input shape | ✓ Good — zero remaining references to any retired asset, verified by both `25-VERIFICATION.md` and `scripts/validate-brand.ts`'s generator-hygiene checks |
| `colors.pressed`/`colors.infoSoft` added as new token aliases rather than reusing/overloading existing keys | Pressed-state and OfflinePill-teal are visually and semantically distinct from any existing token; keeps `primary`/`primarySoft` etc. meaning stable | ✓ Good — zero drift, `tokens.test.ts`'s exhaustive `toEqual()` catches any future accidental key removal |
| Pressed-state visuals wired via `Pressable`'s function-form `style` prop (first use in this codebase), not `onPressIn`/`onPressOut` + `useState` | Function-form `style` is declarative and avoids introducing manual press-tracking state that could desync from the actual gesture | ✓ Good — regression-gated (`grep -rn "onPressIn\|onPressOut"` returns zero matches), 9 call sites across 5 files all correctly gated so locked-answer success/error coloring always wins over the pressed override |
| `scripts/validate-brand.ts` built as a standalone node script (mirroring `scripts/preflight.ts`'s shape) rather than a Jest test or a check folded into an existing script | Keeps the fast, dependency-light `node script.js` invocation pattern this project already uses for release-adjacent gates, separate from the unit-test suite's concerns | ✓ Good — 20/20 checks passing, empirically proved to actually gate (forced-failure test confirmed exit 1 + correct FAIL lines before reverting) |
| `validate-brand.ts` declares its forbidden-hex/retired-asset literals independently rather than importing them from `generate-brand-assets.ts` | A validator that imports its "source of truth" from the same script it's meant to catch regressions in isn't an independent check — a broken generator could ship a broken literal and the validator would agree with it | ✓ Good — deliberate independence, confirmed by design review during Phase 29 planning |
| `package-lock.json` drift (react-native `0.86.2` in `package.json` vs `0.86.0` locked) fixed via lockfile regeneration, discovered a third time via EAS's `npm ci` failure | Same root cause as the twice-prior v0.5 drift (local npm tolerates mismatches `npm ci` doesn't) — fixed the same way (regenerate against a clean slate), not `--legacy-peer-deps`/`--force` | ✓ Good → structurally resolved in v1.0 Phase 30 by the durable Node 22.23.2 pin |
| App Review notes and privacy label disclose all three network calls, and the backend stops logging client IPs (`disableRequestLogging`, backend `f06c46b`) so the label can truthfully say no identifiers are collected | Under-counting calls or logging IPs would contradict the privacy label and risk rejection or misrepresentation | ✓ Good — approved by Apple; Lafa 1.0.0 Ready for Distribution (2026-10-11). Watch: `disableRequestLogging` is deprecated in Fastify 6 |
| Node 22.23.2 pinned in `.nvmrc` + `engines.node` + `eas.json` `build.production.node`, with the `eas.json` pin as the enforcement point (v1.0 Phase 30) | The EAS image's own default Node (22.23.1) can drift; an explicit `node` field makes EAS install the exact local Node/npm pair before `npm ci` | ✓ Good — lockfile drift (3 prior incidents) did not recur; real build #6 installed 22.23.2/npm 10.9.8 and `npm ci` ran clean |
| Brand generator selects SVG layers by stable ids (`mark-depth`/`mark-fill`/`mark-highlight`) via `linkedom`, failing loudly on a missing id (v1.0 Phase 31) | Fill-count parsing was brittle against any source edit; ids make the source→asset contract explicit | ✓ Good — corruption path proven to fail with a clear error; lockup render reuses the same composed mark |
| Setup lockup rendered in a fixed 304×110pt box cropped to the measured content bounding box, not `width: 100%` + `aspectRatio` (v1.0 Phase 32) | The full 1600×520 canvas carried large empty margins that misaligned the lockup; required 5 on-device iterations to land | ✓ Good, ⚠️ minor debt — crop constants are hand-measured and ungated; must be re-measured if the lockup SVG changes |
| `colors.choicePressed` scoped only to unsubmitted answer presses, resolved in a pure `resolveChoiceStyle` with locked-state precedence (v1.0 Phase 33) | Red/error must stay reserved for actual wrong-answer feedback; precedence needs an explicit, testable rule rather than style-array last-writer-wins | ✓ Good — 4 explicit precedence tests; `colors.pressed` unchanged for primary buttons |
| Repo made public so GitHub Pages can host the Support/Privacy URLs on the free plan (v1.0 Phase 35) | Avoided paying for GitHub Pro or standing up separate hosting that would contradict the no-new-repo constraint | ✓ Good — both URLs live (HTTP 200) and accepted by App Review; accepted tradeoff of full source visibility |
| One `API_BASE_URL` in `src/config/api.ts` for all three network modules, plus a Jest guard that fails on the Oregon host anywhere in code or config (v1.1 Phase 36) | A host move must be a one-line change, and nothing may silently reintroduce Oregon once it is deleted | ✓ Good — 1.0.1 verified hitting Frankfurt on all three calls; `scripts/preflight.ts` keeps its own literal because Node type stripping can't import the RN module |
| Content timeout 90s → 15s and feedback 90s → 45s, accepting a possible duplicate feedback row on Retry after a slow cold boot (v1.1 Phase 36, WR-02) | 15s keeps the quiz start snappy because the fallback is silent. 45s covers a ~40s Render cold boot or the slow product-feedback path, but not both | ✓ Good, ⚠️ accepted risk — no duplicates observed yet; revisit with an idempotency key if they appear |
| No ETag/304 handling: a guard test proves the content fetch sends no cache headers and treats any non-200 as fallback (v1.1 Phase 36) | The backend added revalidation, but the app's in-memory, once-per-process fetch gains nothing from it | ✓ Good — zero behaviour change, locked by test |
| Submit 1.0.1 only after the real-device E2E passed, with automatic release and phased release off (v1.1 Phases 37-38) | The Oregon deadline rewarded getting all new installs onto Frankfurt fast; phased release would have slowed that | ✓ Good — live 2026-10-12, five days early |
| Oregon-deletion gate: once 1.0.1 is live AND (~48h with no real Oregon requests OR 2026-10-30), whichever comes first (v1.1 HAND-02) | A 1.0.0 straggler after deletion keeps a working quiz (bundled dataset) and only loses feedback, while missing 1 Nov would put every user back on cold starts. The date clause stops stragglers from blocking deletion indefinitely | ✓ Good — handed to the backend 2026-10-13; deletion now owned there (REGION-05) |
| Tech-debt phase (39) declared droppable and run during the App Review wait (v1.1) | Debt cleanup must never delay a deadline-driven release | ✓ Good — completed in the review window without touching the release path |

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
*Last updated: 2026-10-14 after v1.1 milestone*
