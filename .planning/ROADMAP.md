# Roadmap: Portuguese Verb Conjugation App — Mobile

## Milestones

- ✅ **v0.0 Offline Quiz MVP** — Phases 1-6 (shipped 2026-07-13)
- ✅ **v0.1 Online Quiz, Exit Flow & UI Polish** — Phases 7-10.1 (shipped 2026-07-17)
- ✅ **v0.2 Lafa Design System + Tense Label Refresh** — Phases 11-12 (shipped 2026-07-19)
- 🚧 **v0.3 Learning Quality Upgrade** — Phases 13-16 (in progress)

## Phases

<details>
<summary>✅ v0.0 Offline Quiz MVP (Phases 1-6) — SHIPPED 2026-07-13</summary>

- [x] Phase 1: Scaffold (2/2 plans) — completed 2026-07-12
- [x] Phase 2: Dataset & Domain Vocabulary (3/3 plans) — completed 2026-07-12
- [x] Phase 3: Quiz Engine (3/3 plans) — completed 2026-07-12
- [x] Phase 4: Quiz Experience (Setup → Quiz → Results) (2/2 plans) — completed 2026-07-12
- [x] Phase 5: Feedback Integration (4/4 plans) — completed 2026-07-13
- [x] Phase 6: Polish & Verification (4/4 plans) — completed 2026-07-13

Full phase details, plan breakdowns, and success criteria archived in
`.planning/milestones/v0.0-ROADMAP.md`.

</details>

<details>
<summary>✅ v0.1 Online Quiz, Exit Flow & UI Polish (Phases 7-10.1) — SHIPPED 2026-07-17</summary>

- [x] Phase 7: Dataset Seam & Fetch/Fallback Pipeline (3/3 plans) — completed 2026-07-13
- [x] Phase 8: Async Quiz Start & Dataset Snapshot (2/2 plans) — completed 2026-07-14
- [x] Phase 9: End-Quiz-Early Flow (2/2 plans) — completed 2026-07-14
- [x] Phase 10: Safe-Area & Visual Polish (4/4 plans) — completed 2026-07-14
- [x] Phase 10.1: Close gap: UI-03 — Offline Content Indicator (INSERTED) (2/2 plans) — completed 2026-07-17

Full phase details, plan breakdowns, and success criteria archived in
`.planning/milestones/v0.1-ROADMAP.md`.

</details>

<details>
<summary>✅ v0.2 Lafa Design System + Tense Label Refresh (Phases 11-12) — SHIPPED 2026-07-19</summary>

- [x] Phase 11: Lafa Design Tokens & Brand Identity (3/3 plans) — completed 2026-07-19
- [x] Phase 12: Tense Label Refresh (1/1 plan) — completed 2026-07-19

Full phase details, plan breakdowns, and success criteria archived in
`.planning/milestones/v0.2-ROADMAP.md`.

</details>

### 🚧 v0.3 Learning Quality Upgrade (In Progress)

**Milestone Goal:** Turn the quiz from an answer-checker into a learning loop by
adding irregular-only practice, smarter diagnostic distractors, and
backend-authored wrong-answer explanations — consuming the `learning`/
`formIndex` contract the backend already shipped in its own v0.3.

- [x] **Phase 13: Verb Mode Selection** - Replace the boolean irregular toggle with a 3-option verb mode selector that correctly filters the quiz pool (completed 2026-07-20)
- [x] **Phase 14: Smarter Distractor Generation** - Wrong-choice options become pedagogically meaningful (same-verb wrong-subject/wrong-tense, cross-verb fallback) (completed 2026-07-20)
- [ ] **Phase 15: Learning Content & Explanation Engine** - Parse the backend's optional `learning`/`formIndex` data and derive explanation text via pure logic
- [ ] **Phase 16: Explanation Panel UI** - Show the derived explanation on the Quiz screen after a wrong answer, without affecting scoring or feedback

## Phase Details

### Phase 13: Verb Mode Selection

**Goal**: Learner can choose among three verb-difficulty scopes (Regular only / Mixed / Irregular only) and the quiz reliably respects that choice, including graceful failure when the eligible pool is too small.
**Depends on**: Phase 12 (v0.2, shipped)
**Requirements**: MODE-01, MODE-02, MODE-03, TEST-03
**Success Criteria** (what must be TRUE):

  1. Setup screen shows a 3-option verb mode selector (Regular only / Mixed / Irregular only) replacing the old "Include irregular verbs" boolean toggle, defaulting to Regular only.
  2. Starting a quiz in "Regular only" mode only draws questions from verbs where `isIrregular` is `false`; "Irregular only" only from `isIrregular === true`; "Mixed" draws from all eligible verbs.
  3. Selecting "Irregular only" with a tense combination that has too few eligible verbs shows the existing insufficient-verbs error message pattern, without crashing.
  4. Unit tests verify pool filtering and the existing 10-question/no-duplicate-triple guarantee under all three modes.

**Plans**: 2 plans
Plans:
**Wave 1**

- [x] 13-01-PLAN.md — VerbMode type, 3-way engine pool filter, insufficient-verbs message, and per-mode unit tests (MODE-02, MODE-03, TEST-03)

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 13-02-PLAN.md — Setup screen single-select verb-mode chip row replacing the irregular Switch (MODE-01)

**UI hint**: yes

### Phase 14: Smarter Distractor Generation

**Goal**: Wrong-answer choices are pedagogically meaningful confusions (same-verb, tense-pair, cross-verb) rather than arbitrary wrong forms.
**Depends on**: Phase 13
**Requirements**: DIST-01, DIST-02, DIST-03, DIST-04, TEST-04
**Success Criteria** (what must be TRUE):

  1. When available, a question's wrong-choice options preferentially include same-verb, wrong-subject forms.
  2. Same-verb wrong-tense forms are included next, prioritizing the Completed-past vs. Imperfect-past confusion pair when both are eligible.
  3. When same-verb options are exhausted, distractors fall back to same-subject/tense forms drawn from another verb.
  4. Every question still shows exactly 4 unique choices with exactly 1 correct answer under the new strategy, across tense/mode combinations.
  5. Unit tests cover each distractor-priority case (wrong-subject, wrong-tense pair, cross-verb fallback) and the 4-unique/1-correct invariant.

**Plans**: 1 plan
Plans:
**Wave 1**

- [x] 14-01-PLAN.md — 3-tier pickDistractors (same-verb wrong-subject → same-verb wrong-tense w/preterite-imperfect pair → cross-verb same-class fallback) + tier-2/tier-3/invariant unit tests (DIST-01..04, TEST-04)

### Phase 15: Learning Content & Explanation Engine

**Goal**: The app can parse the backend's optional `learning` block and per-verb `formIndex`, and a pure function can derive the correct explanation string for an incorrect answer — independent of any Quiz-screen UI.
**Depends on**: Phase 13
**Requirements**: EXPL-01, TEST-05
**Success Criteria** (what must be TRUE):

  1. `GET /content/verbs` responses that include a `learning` block are Zod-validated and parsed into typed learning content without altering existing `verbs`/`formIndex` handling.
  2. Responses that omit `learning` (backend's fail-closed omission) resolve the dataset exactly as before — no error, no missing-field crash, `verbs` unaffected.
  3. A pure explanation-selection function, given a verb, selected answer, correct answer, and the parsed learning content, resolves the selected answer's `{tense, subject}` slot via `formIndex` and returns the correctly-templated explanation string, or `undefined` when no match exists.
  4. Unit tests cover correct template selection per mismatch type (`wrongTense` / `wrongSubject` / `wrongTenseAndSubject` / `generic`) and the missing-content fallback (no throw, `undefined` result).

**Plans**: TBD

### Phase 16: Explanation Panel UI

**Goal**: A learner who answers incorrectly sees a short, backend-authored explanation on the Quiz screen without ever losing the ability to advance or affecting their score or feedback data.
**Depends on**: Phase 15
**Requirements**: EXPL-02, EXPL-03, EXPL-04
**Success Criteria** (what must be TRUE):

  1. After selecting an incorrect answer, an explanation panel appears between the answer choices and the Next button whenever Phase 15's explanation logic resolves a string.
  2. When learning content is unavailable for that verb/answer (missing `learning` block, missing verb entry, or no `formIndex` match), no panel is shown — never fabricated or unreviewed grammar prose.
  3. Correct-answer questions never show the explanation panel.
  4. Advancing to the next question, scoring, and the `POST /feedback` payload's `selectedAnswer` string are unaffected by the panel's presence — verified unchanged.

**Plans**: TBD
**UI hint**: yes

## Progress

**Execution Order:**
Phases execute in numeric order: 13 → 14 → 15 → 16

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|-----------------|--------|-----------|
| 1. Scaffold | v0.0 | 2/2 | Complete | 2026-07-12 |
| 2. Dataset & Domain Vocabulary | v0.0 | 3/3 | Complete | 2026-07-12 |
| 3. Quiz Engine | v0.0 | 3/3 | Complete | 2026-07-12 |
| 4. Quiz Experience (Setup → Quiz → Results) | v0.0 | 2/2 | Complete | 2026-07-12 |
| 5. Feedback Integration | v0.0 | 4/4 | Complete | 2026-07-13 |
| 6. Polish & Verification | v0.0 | 4/4 | Complete | 2026-07-13 |
| 7. Dataset Seam & Fetch/Fallback Pipeline | v0.1 | 3/3 | Complete | 2026-07-13 |
| 8. Async Quiz Start & Dataset Snapshot | v0.1 | 2/2 | Complete | 2026-07-14 |
| 9. End-Quiz-Early Flow | v0.1 | 2/2 | Complete | 2026-07-14 |
| 10. Safe-Area & Visual Polish | v0.1 | 4/4 | Complete | 2026-07-14 |
| 10.1. Close gap: UI-03 — Offline Content Indicator | v0.1 | 2/2 | Complete | 2026-07-17 |
| 11. Lafa Design Tokens & Brand Identity | v0.2 | 3/3 | Complete | 2026-07-19 |
| 12. Tense Label Refresh | v0.2 | 1/1 | Complete | 2026-07-19 |
| 13. Verb Mode Selection | v0.3 | 2/2 | Complete   | 2026-07-20 |
| 14. Smarter Distractor Generation | v0.3 | 1/1 | Complete   | 2026-07-20 |
| 15. Learning Content & Explanation Engine | v0.3 | 0/? | Not started | - |
| 16. Explanation Panel UI | v0.3 | 0/? | Not started | - |

---

*Milestones v0.0, v0.1, and v0.2 shipped. v0.3 Learning Quality Upgrade roadmap
created 2026-07-20 — 4 phases derived from 14 v0.3 requirements. Run
`/gsd:plan-phase 13` to begin.*
