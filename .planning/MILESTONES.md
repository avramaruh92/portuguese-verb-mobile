# Milestones

## v0.5 iOS TestFlight Readiness (Shipped: 2026-07-25)

**Phases completed:** 5 phases, 11 plans, 19 tasks

**Key accomplishments:**

- Applied `expo install --fix`'s 7-package SDK 57 version realignment and pinned eas-cli@^21.1.0 with a local-resolving npm script, closing BUILD-01's clean-baseline requirement.
- Set the final iOS bundle identifier, bootstrapped eas.json via the EAS CLI, diagnosed and fixed a Node/npm-version lockfile mismatch that broke the first cloud build attempt, and confirmed a production iOS build reaches FINISHED status on EAS infrastructure — closing BUILD-02.
- Locked `app.json`'s release identity (bundle id, slug/scheme, build number) and confirmed via `eas project:info` that the existing EAS project registration still resolves, surfacing a real server-slug/local-slug mismatch (IDENT-04) rather than a research prediction gap.
- Confirmed no EAS dashboard mechanism exists to rename a project's slug — IDENT-04 closes with the mismatch explicitly documented and handed to Phase 24, not silently accepted or hidden.
- Node script rasterizes a 1024x1024 alpha-free app icon and a 228px transparent white splash glyph from the Lafa brand SVG using @resvg/resvg-js + sharp, with the source SVG kept byte-for-byte unmodified and committed to git as the pipeline's git-diffable baseline.
- Deleted the `assets/expo.icon/` Icon Composer bundle and its `ios.icon` app.json reference so the flat `expo.icon` PNG (`./assets/images/icon.png`) is the sole iOS app-icon source.
- Added an `ascAppId` placeholder to `eas.json`'s submit profile; confirmed EASCFG-01 and EASCFG-03 fields were already satisfied by Phase 20's bootstrap with no edit needed.
- Replaced effect-based form resets in both feedback modals with render-time `useState`-tracked previous-visible comparisons, eliminating both `react-hooks/set-state-in-effect` lint errors so `npm run lint` exits 0 project-wide.
- Ran the three operator-only release steps to their conclusion: cold-instance preflight passed, the first real production iOS build was built and submitted (surviving two blocking config bugs surfaced along the way), and an internal TestFlight tester confirmed install — completing the v0.5 milestone's terminal deliverable.

---

## v0.4 Backend v0.4 Contract Sync + Product Feedback (Shipped: 2026-07-22)

**Phases completed:** 3 phases, 7 plans, 4 tasks

**Key accomplishments:**

- Proved mobile's validateDataset, LearningContentSchema, and fetchRemoteVerbs all accept the real backend v0.4 content fixture (50 verbs + learning block) byte-for-byte, via a self-contained test fixture with zero cross-repo coupling at test time.
- Extended `selectExplanation` to interpolate selected-answer tense/subject labels (matches[0]-derived, omitted on tied-disagree) and append backend-authored tenseNotes/subjectHints as separate newline-joined lines, matching the backend v0.4 explanation template contract with zero signature changes and all existing fail-closed behavior intact.

---

## v0.3 Learning Quality Upgrade (Shipped: 2026-07-20)

**Phases completed:** 4 phases, 8 plans, 16 tasks

**Key accomplishments:**

- Replaced the boolean `includeIrregular` quiz-engine contract with a 3-way `VerbMode` union (`regular_only`/`mixed`/`irregular_only`), added a 3-branch pool filter in `generate()`, and covered all three modes plus the insufficient-pool path with new unit tests.
- Replaced the "Include irregular verbs" `Switch` on the Setup screen with a single-select 3-chip "Verb mode" row (Regular only/Mixed/Irregular only, default Regular only), wiring the selected `verbMode` into `startQuiz`.
- 3-tier pickDistractors strategy (same-verb wrong-subject → same-verb wrong-tense with preterite/imperfect pair prioritization → cross-verb same-conjugation-class preference) replacing the prior 2-tier same-verb/cross-verb fallback in src/quiz/engine.ts.
- Built a Zod-validated `learning`/`formIndex` parser (`src/learning/`) and a pure `selectExplanation` function that resolves a wrong answer's exact `{tense, subject}` slot to a backend-authored explanation template, fail-closed on any missing data.
- Wired explanations into the Quiz screen via a new `ExplanationPanel` component, fixing two pre-existing wiring gaps (`useQuizStore` discarding `learning`, `quiz.tsx` reading the bundled dataset instead of the session snapshot) along the way.
- All 14 v0.3 requirements verified end-to-end including on-device confirmation of the verb-mode chip UI and the explanation panel; 192/192 tests passing, 0 broken cross-phase flows.

---

## v0.2 Lafa Design System + Tense Label Refresh (Shipped: 2026-07-19)

**Phases completed:** 2 phases, 4 plans, 3 tasks

**Key accomplishments:**

- Displayed tense labels for preterite/imperfect changed to "Completed past"/"Imperfect past" with inline Portuguese grammar names, zero backend-contract impact

---

## v0.1 Online Quiz, Exit Flow & UI Polish (Shipped: 2026-07-17)

**Phases completed:** 5 phases, 13 plans, 16 tasks

**Key accomplishments:**

- `src/dataset/remote.ts`
- Opened an injection seam in `generate()` via an optional trailing `verbs` parameter (defaulting to the bundled dataset) and reconciled `querer.isIrregular` to `true`, keeping the full 123-test suite green throughout.
- The live backend's `GET /content/verbs` returns 50 verbs in the exact shape the app expects, verified by running the actual payload through `validateDataset()`.
- `useQuizStore.startQuiz()` is now async, awaits Phase 7's `resolveVerbs()`, and feeds the resolved snapshot into `generate()` so an in-progress quiz's questions are immune to any later background dataset refresh.
- Root layout now fires `prefetch()` once at app mount, and both quiz-start call sites (`app/index.tsx` Start, `app/results.tsx` Try Again) correctly `await` the now-async `startQuiz` before reading status, with a local `starting` flag keeping each button inert and labeled "Starting…" during the await.
- Native header "Exit" control and beforeRemove gesture guard added to app/quiz.tsx, both routed through one shared Alert.alert confirmation that calls the existing reset() before returning to Setup.
- All 8 manual verification checks passed on an iOS simulator — the exit flow built in 09-01 has no bypass path.
- 1. [Rule 4-adjacent, documented not auto-fixed] `headerTitle: ""` appears twice in `app/results.tsx`, not once
- Quiz screen (`app/quiz.tsx`) now draws all colors/spacing/radius/typography from `src/theme/tokens` and applies `useSafeAreaInsets().bottom` to its ScrollView content so the Next/Report buttons clear the iOS home indicator, while the existing titleless header, `headerLeft` Exit control, and `beforeRemove` exit guard remain untouched.
- Approved.
- Human-verified on a physical iPhone: "Using saved content" pill renders correctly on Setup, Quiz, and Results under a real Airplane Mode fallback, and is absent when the network is restored.

---

## v0.0 Offline Quiz MVP (Shipped: 2026-07-13)

**Phases completed:** 6 phases, 18 plans, 25 tasks

**Key accomplishments:**

- Expo Router + strict TypeScript + Zustand + jest-expo walking-skeleton app booting from a single root route, with a green two-test suite.
- Human-confirmed the Expo Router scaffold boots cleanly on the iOS Simulator via Expo Go — closing out ROADMAP Phase 1 SC-1's visual confirmation
- Typed Tense/Subject/Verb contracts, an exhaustive Zod validation harness (no z.record), and a 4-verb seed (falar/comer/partir/ser) with a green 5-case test suite proving completeness and backend enum reconciliation.
- Scaled the seeded 4-verb dataset to the full 50-verb European Portuguese target (37 regular / 13 irregular), applying the D-01/D-02 verb-selection mix and D-05 present-indicative irregularity criterion, with the count test tightened to exactly 50 and all validation green.
- User-verified 50-verb European Portuguese dataset for conjugation accuracy, one isIrregular flag corrected (querer)
- Established the Question/QuizSession/GenerateOptions type contracts and a deterministic, injectable-RNG Fisher-Yates shuffle utility that Wave 2's engine and scoring plans build against.
- Implemented `generate()` and its pure helpers (`sampleTriples`, `buildQuestion`, `pickDistractors`) that filter the dataset by tense/irregular toggle, sample 10 unique triples, and build fully-shuffled 4-choice questions — all deterministic under an injected RNG, proven by a 9-test TDD suite.
- Pure `score(session, answers)` function counting positional matches against `Question.correctAnswer`, returning `{ correct, total }` with `total` always equal to session length.
- Zustand quiz store state machine (idle/error/in-progress/completed) plus exhaustive Subject/Tense display labels and a pure D-10 share-message builder, all covered by plain Jest unit tests.
- Full setup-to-quiz-to-results user flow implemented as three Expo Router screens, each a thin renderer over the Plan 01 Zustand store and label/share helpers.
- Zod schema mirroring the locked backend `POST /feedback` contract, plus a pure `buildFeedbackPayload()` mapper — enum literals reused from `src/dataset/types.ts` with zero retyping risk.
- `submitFeedback(payload)` — the app's first outbound network call, POSTing to the live `POST /feedback` backend with a manual 90s `setTimeout` + `AbortController` timeout (not `AbortSignal.timeout`, unimplemented on Hermes) and status-branching into a `SubmitResult` discriminated union.
- The user-facing feedback vertical slice: a `ReportFeedbackModal` wired into the Quiz screen, letting a learner who has locked in an answer report a problem — reason picker, optional free text, inline spinner, success auto-dismiss, conditional Retry — entirely in modal-local state with zero `useQuizStore` coupling.
- Independently re-verified the live `POST /feedback` round-trip and on-device non-interruption behavior — fresh HTTP 201 against the real deployed backend, confirmed the quiz never freezes or loses progress during an in-flight submission.
- Independently re-derived all 1,200 conjugation cells (50 verbs × 4 tenses × 6 subjects) in `src/dataset/verbs.ts` from European Portuguese grammar rules and found zero discrepancies — a clean verification pass, with one classification observation flagged for user awareness.
- User confirmed zero discrepancies in the 50-verb dataset — no corrections applied, verbs.ts unchanged
- Confirmed the feedback flow degrades gracefully against a genuinely cold Render backend — 45-50s cold start, spinner held throughout, quiz stayed interactive, resolved to success
- Confirmed all three research-flagged edge cases (insufficient verbs, share-sheet cancellation, irregular-toggle mid-session) are handled cleanly — no code changes needed

---
