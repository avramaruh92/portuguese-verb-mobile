# Requirements: Portuguese Verb Conjugation App — Mobile

**Defined:** 2026-07-12
**Core Value:** A learner can open the app, pick what to practice, complete a 10-question conjugation quiz entirely offline, and see an accurate score.

## v1 Requirements

Requirements for the v0.0 release. Each maps to roadmap phases.

### Setup

- [ ] **SETUP-01**: User can select one or more tenses to practice (present indicative, preterite, imperfect, future)
- [ ] **SETUP-02**: User can toggle "Include irregular verbs" (default off), independent of tense selection
- [ ] **SETUP-03**: Starting a quiz creates a 10-question session drawn from the local dataset, respecting tense and irregular-toggle filters

### Dataset

- [ ] **DATA-01**: Local verb dataset includes English translation, regular/irregular flag, and conjugations for all 4 tenses × 6 subject forms
- [ ] **DATA-02**: Dataset supports up to 50 curated European Portuguese verbs (initial content may seed smaller for velocity, architecture supports full 50)
- [ ] **DATA-03**: Dataset shape/completeness is automatically validated (every verb has all required cells populated)

### Quiz

- [ ] **QUIZ-01**: Each question shows the infinitive verb, its English translation, the tense, and the subject pronoun (learner-friendly Portuguese label)
- [ ] **QUIZ-02**: Each question presents 4 answer choices with exactly 1 correct answer
- [ ] **QUIZ-03**: User gets immediate right/wrong feedback after selecting an answer, then can continue to the next question
- [ ] **QUIZ-04**: Quiz generation and scoring logic is unit-tested (filtering, randomization, correct-answer selection, score calculation)

### Results

- [ ] **RSLT-01**: After 10 questions, user sees a results screen with score out of 10
- [ ] **RSLT-02**: User can open the native iOS share sheet from results with a short score + app name message

### Feedback

- [ ] **FDBK-01**: User can submit in-app feedback (message + verb/tense/subject/correctAnswer/selectedAnswer context) via `POST /feedback` to the live backend
- [ ] **FDBK-02**: Feedback submission handles success (201), validation error (400), server error (500), and network/cold-start delay gracefully
- [ ] **FDBK-03**: Feedback submission failure never blocks or interrupts quiz completion
- [ ] **FDBK-04**: Feedback payload mapping (UI labels → locked backend enum literals for tense/subject/platform) is unit-tested

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Content & Progression

- **PROG-01**: Typed-answer quiz mode with diacritic normalization
- **PROG-02**: On-device (no-account) progress or streak tracking
- **PROG-03**: Spaced repetition scheduling
- **PROG-04**: Backend-served dataset updates (would require a new content-serving API — explicit scope change)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Login / accounts / sessions | No persistence beyond a single quiz session — locked v0 product scope, matches backend |
| User history | Requires accounts/persistence — deliberately deferred |
| Spaced repetition | Requires persistence across sessions — deliberately deferred |
| Backend quiz-content fetching | No content-serving API exists or is planned for this milestone; dataset stays local/offline by design |
| Subscriptions / ads | No monetization in v0 |
| Android release work | Platform enum stays compatible (`ios | android`) but no Android build/release effort this milestone |
| Direct Supabase access | All persistence goes through backend `POST /feedback` only — locked cross-repo constraint |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| SETUP-01 | Phase 4 | Pending |
| SETUP-02 | Phase 4 | Pending |
| SETUP-03 | Phase 4 | Pending |
| DATA-01 | Phase 2 | Pending |
| DATA-02 | Phase 2 | Pending |
| DATA-03 | Phase 2 | Pending |
| QUIZ-01 | Phase 4 | Pending |
| QUIZ-02 | Phase 4 | Pending |
| QUIZ-03 | Phase 4 | Pending |
| QUIZ-04 | Phase 3 | Pending |
| RSLT-01 | Phase 4 | Pending |
| RSLT-02 | Phase 4 | Pending |
| FDBK-01 | Phase 5 | Pending |
| FDBK-02 | Phase 5 | Pending |
| FDBK-03 | Phase 5 | Pending |
| FDBK-04 | Phase 5 | Pending |

**Coverage:**
- v1 requirements: 16 total
- Mapped to phases: 16
- Unmapped: 0 ✓

---
*Requirements defined: 2026-07-12*
*Last updated: 2026-07-12 after initial definition*
