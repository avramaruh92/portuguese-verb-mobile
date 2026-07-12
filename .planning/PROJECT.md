# Portuguese Verb Conjugation App — Mobile

## What This Is

An iOS-first Expo React Native app (TypeScript, Expo Router) that lets beginner
(A1-A2) learners of European Portuguese practice verb conjugation through short,
offline quizzes. It is the companion mobile client to the already-shipped
`portuguese-verb-api` backend, but ships as its own independent sibling repo,
not a monorepo package.

## Core Value

A learner can open the app, pick what to practice, complete a 10-question
conjugation quiz entirely offline, and see an accurate score. Everything else
(sharing, feedback) supports that loop but must never block it.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] User can select one or more tenses to practice: present indicative, preterite, imperfect, future
- [ ] User can toggle "Include irregular verbs" (default off) before starting a quiz
- [ ] Starting a quiz creates a 10-question session drawn from the local dataset, respecting tense and irregular-toggle filters
- [ ] Each question shows the infinitive verb, its English translation, the tense, the subject pronoun (learner-friendly Portuguese label), and 4 answer choices with exactly 1 correct
- [ ] User gets immediate right/wrong feedback after selecting an answer, then can continue to the next question
- [ ] After 10 questions, user sees a results screen with score out of 10
- [ ] User can open the native iOS share sheet from results with a short "score + app name" message
- [ ] User can submit in-app feedback (message + verb/tense/subject/correctAnswer/selectedAnswer context) via `POST /feedback` to the live backend
- [ ] Feedback submission handles success (201), validation error (400), server error (500), and network/cold-start delay without blocking or losing quiz completion
- [ ] Local verb dataset includes English translation, regular/irregular flag, and conjugations for all 4 tenses × 6 subject forms, for up to 50 curated European Portuguese verbs (architecture supports 50; initial content may seed smaller if needed for velocity)
- [ ] Automated tests cover: quiz generation (correct filtering/randomization), scoring, dataset completeness/shape validation, and feedback payload mapping (UI labels → locked backend enum literals)

### Out of Scope

- Login, accounts, sessions, user history — v0 has none of these, matches backend, no persistence beyond a single quiz session — deliberate product scope
- Spaced repetition — not part of the v0 learning loop, may be considered in a later milestone
- Backend quiz-content fetching — there is no content-serving API; dataset lives locally in the app by design
- Subscriptions, ads — no monetization in v0
- Android release work — platform enum stays compatible (`ios | android`) but no Android build/release effort in this milestone
- Direct Supabase access or credentials in the mobile app — all persistence goes through backend `POST /feedback` only

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
- Render free-tier cold starts are a known real-world condition the feedback
  flow must tolerate gracefully (loading state, doesn't block quiz completion).
- No content-serving API exists or is planned for v0 — confirmed explicitly
  during project setup after a clarifying question about whether the backend
  could serve verb data. It cannot/should not for this milestone.

## Constraints

- **Tech stack**: Expo (React Native) + TypeScript + Expo Router — iOS-first — locked by CLAUDE.md and confirmed at project setup
- **State management**: Zustand for quiz session state — chosen over plain React state for nicer ergonomics as quiz logic grows; app remains small so no heavier state library needed
- **Testing**: Jest with the Expo preset — standard for Expo/RN, works out of the box with TypeScript
- **Backend contract**: Mobile only ever calls `POST /feedback` on the live backend; never connects to Supabase directly or stores credentials — locked cross-repo constraint
- **Dataset authoring**: Full 50-verb target dataset (4 tenses × 6 subjects each) is significant hand-authored content; drafted by the assistant and reviewed by the user for conjugation accuracy before it ships

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Full 50-verb dataset targeted for v0.0 (not a smaller seed) | User chose full target over a smaller seed set despite added authoring effort | — Pending |
| Zustand for quiz session state | Nicer ergonomics than raw useState/Context as session logic grows; small added dependency accepted | — Pending |
| "Include irregular verbs" toggle filters the verb pool only | Toggle does not restrict which tenses are eligible — independent axes | — Pending |
| Jest + Expo preset for testing | Standard, well-supported RN/Expo test tooling | — Pending |
| Share message includes app name alongside score | Light organic promotion via the native share sheet | — Pending |
| No backend content-serving API — dataset stays local/offline | Explicitly reconfirmed at project setup; backend v0.0 scope is closed, only `POST /feedback` is used | ✓ Good |

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
*Last updated: 2026-07-12 after initialization*
