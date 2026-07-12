# Roadmap: Portuguese Verb Conjugation App — Mobile

## Overview

The app is built bottom-up through three foundational, dependency-ordered
phases (scaffold, dataset/vocabulary, quiz engine) because the quiz UI and
feedback-mapping layer cannot exist correctly until the internal
`Verb`/`Tense`/`Subject` vocabulary and quiz logic are settled and tested.
Once that foundation is proven, the remaining phases are framed as
end-to-end, user-visible vertical slices: Phase 4 delivers the complete
setup → quiz → results loop a learner actually experiences, Phase 5 adds
the feedback capability as its own complete slice, and Phase 6 is a final
cross-cutting verification pass against the two highest-severity risks
research surfaced (enum-literal mismatch, hand-authored dataset accuracy)
plus real-world backend cold-start behavior.

## Phases

**Phase Numbering:**

- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Scaffold** - Working Expo Router + TypeScript + Zustand + Jest-expo project skeleton (completed 2026-07-12)
- [x] **Phase 2: Dataset & Domain Vocabulary** - Typed, validated local verb dataset with backend-aligned internal vocabulary (completed 2026-07-12)
- [x] **Phase 3: Quiz Engine** - Tested pure-function logic for generating and scoring a quiz session (completed 2026-07-12)
- [x] **Phase 4: Quiz Experience (Setup → Quiz → Results)** - Learner can complete a full 10-question quiz and see their score (completed 2026-07-12)
- [ ] **Phase 5: Feedback Integration** - Learner can submit in-app feedback tied to a question, handled gracefully end-to-end
- [ ] **Phase 6: Polish & Verification** - Cross-cutting verification of dataset accuracy, cold-start UX, and edge cases

## Phase Details

### Phase 1: Scaffold

**Goal**: A working Expo Router + TypeScript + Zustand + Jest project exists that runs on the iOS simulator and has a green test suite.
**Mode:** mvp
**Depends on**: Nothing (first phase)
**Requirements**: None (infrastructure only)
**Success Criteria** (what must be TRUE):

  1. Running `npx expo start` boots the app on the iOS simulator to an empty root screen with no errors.
  2. Running the test suite executes and passes a trivial smoke test using the `jest-expo` preset.
  3. TypeScript strict mode compiles with zero errors.
  4. A basic Zustand store scaffold exists and can be imported without runtime error.

**Plans**: 2 plans
Plans:
**Wave 1**

- [x] 01-01-PLAN.md — Scaffold Expo Router + strict TS + jest-expo + Zustand store, stripped to a single root route, green test suite

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 01-02-PLAN.md — Human-verify checkpoint: iOS Simulator boots to the empty root screen with no errors (SC-1 visual confirmation)

### Phase 2: Dataset & Domain Vocabulary

**Goal**: The app's quiz content is backed by a typed, validated local verb dataset, with internal `Tense`/`Subject` vocabulary reconciled against the backend's locked enum literals before anything else is built on top of it.
**Mode:** mvp
**Depends on**: Phase 1
**Requirements**: DATA-01, DATA-02, DATA-03
**Success Criteria** (what must be TRUE):

  1. The dataset module exposes typed verbs with English translation, regular/irregular flag, and conjugations for all 4 tenses × 6 subjects for every seeded verb.
  2. Running dataset validation reports zero shape/completeness errors across all seeded verbs.
  3. Internal `Tense`/`Subject` vocabulary types have been reviewed once against CLAUDE.md's exact backend enum literals (`present_indicative | preterite | imperfect | future`, `eu | tu | ele_ela | nos | voces | eles_elas`) with no unresolved mismatches.

**Plans**: 3 plans
Plans:
**Wave 1**

- [x] 02-01-PLAN.md — Type contracts (Tense/Subject/Verb) + exhaustive Zod validation harness + seeded dataset (3 regular classes + 1 irregular) + green test suite (DATA-01, DATA-03, SC-3 reconciliation)

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 02-02-PLAN.md — Author full 50-verb European-Portuguese dataset per D-01/D-02/D-05 (~35-40 regular + ~10-15 irregular), tighten count assertion to exactly 50 (DATA-01, DATA-02)

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 02-03-PLAN.md — Human-verify checkpoint: user reads the 50-verb dataset for European-Portuguese conjugation accuracy and D-05 flag correctness (D-04)

### Phase 3: Quiz Engine

**Goal**: Correct, independently tested logic exists to generate a quiz session and score it, with no UI involved.
**Mode:** mvp
**Depends on**: Phase 2
**Requirements**: QUIZ-04
**Success Criteria** (what must be TRUE):

  1. Calling the generate function with tense and irregular-verb filters returns a 10-question session drawn only from matching verbs, with no immediate repeats.
  2. Running the engine's automated tests shows passing coverage for filtering, randomization, and score calculation.
  3. Given a completed set of answers, the scoring function returns a correct score out of 10.

**Plans**: 3 plans
Plans:
**Wave 1**

- [x] 03-01-PLAN.md — Type contracts (Triple/Question/QuizSession/GenerateOptions/InsufficientVerbsError) + injectable-RNG Fisher-Yates shuffle utility + shuffle tests (QUIZ-04)

**Wave 2** *(blocked on Wave 1; the two plans below run in parallel — no shared files)*

- [x] 03-02-PLAN.md — TDD: quiz generation engine (filter, unique-triple sampling, distractor dedupe/backfill, randomized choice order, D-08 InsufficientVerbsError) + engine tests (QUIZ-04)
- [x] 03-03-PLAN.md — TDD: pure score(session, answers) → {correct, total} + scoring tests (QUIZ-04)

### Phase 4: Quiz Experience (Setup → Quiz → Results)

**Goal**: A learner can open the app, pick what to practice, complete a 10-question quiz, and see an accurate score — the full core-value loop, end-to-end.
**Mode:** mvp
**Depends on**: Phase 3
**Requirements**: SETUP-01, SETUP-02, SETUP-03, QUIZ-01, QUIZ-02, QUIZ-03, RSLT-01, RSLT-02
**Success Criteria** (what must be TRUE):

  1. User can select one or more tenses to practice and toggle "Include irregular verbs" (default off) on a setup screen, then start a quiz.
  2. Each question displays the infinitive verb, its English translation, the tense, the subject pronoun (learner-friendly Portuguese label), and 4 answer choices with exactly 1 correct.
  3. Selecting an answer shows immediate right/wrong feedback and lets the user continue to the next question.
  4. After 10 questions, a results screen shows the score out of 10.
  5. User can open the native iOS share sheet from results with a short score + app name message.

**Plans**: 2 plans
**UI hint**: yes
Plans:
**Wave 1**

- [x] 04-01-PLAN.md — Logic layer: display labels (subject/tense), share message builder, full Zustand store state machine with unit test coverage (SETUP-01, SETUP-02, SETUP-03, QUIZ-01, QUIZ-03, RSLT-02)

**Wave 2** *(blocked on Wave 1 — imports Plan 01's store/labels/share)*

- [x] 04-02-PLAN.md — Screens: Setup (tense multi-select + irregular toggle + Start Quiz), Quiz (question + answer feedback + progress), Results (score + share + replay) (SETUP-01, SETUP-02, SETUP-03, QUIZ-01, QUIZ-02, QUIZ-03, RSLT-01, RSLT-02)

### Phase 5: Feedback Integration

**Goal**: A learner can report a problem with any question directly from the app, and the app handles the backend's real-world success/error/cold-start behavior gracefully without ever interrupting the quiz.
**Mode:** mvp
**Depends on**: Phase 4
**Requirements**: FDBK-01, FDBK-02, FDBK-03, FDBK-04
**Success Criteria** (what must be TRUE):

  1. User can submit feedback (message + verb/tense/subject/correctAnswer/selectedAnswer context) via `POST /feedback` to the live backend.
  2. Submitting feedback shows a clear success state on 201, a validation error on 400, and a generic error on 500 with no internals leaked.
  3. A slow or cold-starting backend response never blocks or interrupts quiz completion.
  4. Automated tests confirm the feedback payload mapping (UI labels → locked backend enum literals) is correct for every tense/subject/platform value.

**Plans**: TBD
**UI hint**: yes

### Phase 6: Polish & Verification

**Goal**: The shipped v0.0 experience holds up under the real-world conditions research flagged as highest-risk — conditions that automated tests structurally cannot cover.
**Mode:** mvp
**Depends on**: Phase 5
**Requirements**: None (cross-cutting verification of already-covered requirements)
**Success Criteria** (what must be TRUE):

  1. The full seeded dataset has been read through against an authoritative European Portuguese source (Ciberdúvidas/Infopédia/Priberam) with no outstanding discrepancies.
  2. A manual test against a genuinely cold live Render backend confirms the feedback flow degrades gracefully (loading state, no crash, no lost quiz progress).
  3. Edge cases (fewer than 10 eligible verbs for a filter combination, share-sheet cancellation, irregular-toggle locked mid-session) are handled without crashes or dead ends.

**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Scaffold | 2/2 | Complete   | 2026-07-12 |
| 2. Dataset & Domain Vocabulary | 3/3 | Complete   | 2026-07-12 |
| 3. Quiz Engine | 3/3 | Complete   | 2026-07-12 |
| 4. Quiz Experience (Setup → Quiz → Results) | 2/2 | Complete   | 2026-07-12 |
| 5. Feedback Integration | 0/TBD | Not started | - |
| 6. Polish & Verification | 0/TBD | Not started | - |
