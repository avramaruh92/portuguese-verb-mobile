# Roadmap: Portuguese Verb Conjugation App — Mobile

## Milestones

- ✅ **v0.0 Offline Quiz MVP** — Phases 1-6 (shipped 2026-07-13)
- ✅ **v0.1 Online Quiz, Exit Flow & UI Polish** — Phases 7-10.1 (shipped 2026-07-17)
- ✅ **v0.2 Lafa Design System + Tense Label Refresh** — Phases 11-12 (shipped 2026-07-19)
- ✅ **v0.3 Learning Quality Upgrade** — Phases 13-16 (shipped 2026-07-21)
- 🚧 **v0.4 Backend v0.4 Contract Sync + Product Feedback** — Phases 17-19 (in progress)

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

<details>
<summary>✅ v0.3 Learning Quality Upgrade (Phases 13-16) — SHIPPED 2026-07-21</summary>

- [x] Phase 13: Verb Mode Selection (2/2 plans) — completed 2026-07-20
- [x] Phase 14: Smarter Distractor Generation (1/1 plan) — completed 2026-07-20
- [x] Phase 15: Learning Content & Explanation Engine (3/3 plans) — completed 2026-07-20
- [x] Phase 16: Explanation Panel UI (2/2 plans) — completed 2026-07-20

Full phase details, plan breakdowns, and success criteria archived in
`.planning/milestones/v0.3-ROADMAP.md`.

</details>

### 🚧 v0.4 Backend v0.4 Contract Sync + Product Feedback (In Progress)

**Milestone Goal:** Consume the backend v0.4 contract exactly as shipped,
and add general product feedback via a new `/product-feedback` endpoint.

- [ ] **Phase 17: Contract Fixture Verification** - Prove mobile's existing runtime parsing paths accept the real backend v0.4 payload shape, self-contained
- [ ] **Phase 18: Explanation Compatibility Upgrade** - `selectExplanation` gains selected-answer interpolation and backend-authored notes/hints, staying fail-closed
- [ ] **Phase 19: General Product Feedback** - New `/product-feedback` domain + UI entry points on all 3 screens, independent of quiz-answer context

## Phase Details

### Phase 17: Contract Fixture Verification
**Goal**: Prove mobile's existing runtime parsing paths (`validateDataset`, `LearningContentSchema`, `fetchRemoteVerbs`) accept the real backend v0.4 sample payload exactly as shipped, with zero cross-repo coupling at test time.
**Depends on**: Nothing (first v0.4 phase; validates existing v0.3 schemas against new backend-shaped data)
**Requirements**: CONTRACT-01, CONTRACT-02, CONTRACT-03
**Success Criteria** (what must be TRUE):
  1. A copy of the backend's v0.4 sample fixture exists in the mobile repo's test tree, with no cross-repo import at test runtime.
  2. A test proves the fixture's verb payload passes `validateDataset(payload.verbs)` with zero errors.
  3. A test proves the fixture's `learning` block passes `LearningContentSchema.safeParse(payload.learning)`.
  4. A test proves the fixture parses successfully through `fetchRemoteVerbs`'s parsing path.
  5. A test asserts accented forms (e.g. `pôr`/`pôs`) and tied forms (e.g. `falam`) survive parsing byte-for-byte unchanged.
**Plans**: 1 plan
- [ ] 17-01-PLAN.md — Copy backend v0.4 fixture into test tree + prove it parses through validateDataset/LearningContentSchema/fetchRemoteVerbs with byte-for-byte accent/tie fidelity

### Phase 18: Explanation Compatibility Upgrade
**Goal**: `selectExplanation` matches the backend v0.4 explanation template contract — resolving the selected (wrong) answer's tense/subject labels and appending backend-authored notes/hints — while remaining fail-closed exactly as it was in v0.3.
**Depends on**: Phase 17 (fixture proves the v0.4 `learning`/`formIndex` shape this phase's logic consumes actually parses)
**Requirements**: EXPL-05, EXPL-06, EXPL-07, EXPL-08, TEST-06
**Success Criteria** (what must be TRUE):
  1. `selectExplanation`'s output includes all v0.4 template variables when data is present: `verb`, `selectedAnswer`, `correctAnswer`, `tenseLabel`, `subjectLabel`, `selectedTenseLabel`, `selectedSubjectLabel`.
  2. Selected tense/subject labels are resolved via `verb.formIndex[selectedAnswer]`, reusing the same selected match that drove the mismatch category when ambiguous, otherwise falling back to the generic template.
  3. When `tenseNotes[correctTense]` and/or `subjectHints[correctSubject]` are present in the backend content, they are appended to the returned explanation text.
  4. When `learning`, `formIndex`, or a selected-answer match is missing, no explanation is returned — never fabricated grammar text, matching v0.3's fail-closed contract (EXPL-08).
  5. Unit tests cover `selectedTenseLabel`/`selectedSubjectLabel` interpolation, appended `tenseNotes`/`subjectHints`, and the missing-selected-answer-match fail-closed path.
**Plans**: TBD

### Phase 19: General Product Feedback
**Goal**: A learner can submit general app feedback (bug/idea/other) from any of the 3 screens, independent of and without ever including quiz-answer context, via a new `POST /product-feedback` endpoint matching the backend v0.4 contract exactly.
**Depends on**: Nothing from Phase 17/18 (separate, additive domain — existing `POST /feedback` untouched); sequenced last as the largest, most UI-facing chunk of this milestone
**Requirements**: PFDBK-01, PFDBK-02, PFDBK-03, PFDBK-04, PFDBK-05, TEST-07
**Success Criteria** (what must be TRUE):
  1. A "Help us improve" entry point is visible and functional on Setup, Quiz, and Results screens.
  2. On the Quiz screen, after an answer is locked, a two-action row offers "Report a problem" and "Help us improve" as distinct, independently launchable flows.
  3. Submitting product feedback sends exactly `category` (`bug`/`idea`/`other`), `message` (1-2000 chars), `screen` (`setup`/`quiz`/`results`), `appVersion` (1-20 chars), `platform` (`ios`/`android`) to `POST /product-feedback`, with zero quiz-answer fields (verb/tense/subject/correctAnswer/selectedAnswer) present in the payload.
  4. Submission handles success (201), validation error (400), server error (500-or-other), and network error/cold-start using the same 90s `AbortController` timeout pattern and result-union shape as the existing feedback flow, without ever blocking quiz progress.
  5. Unit tests mirror existing feedback coverage: schema validation (valid payload; invalid category/screen/platform; empty/over-2000 message; empty/over-20 appVersion), payload-builder field mapping, and submit-status branching (201/400/500-or-other/network-error).
**Plans**: TBD
**UI hint**: yes

## Progress

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
| 13. Verb Mode Selection | v0.3 | 2/2 | Complete | 2026-07-20 |
| 14. Smarter Distractor Generation | v0.3 | 1/1 | Complete | 2026-07-20 |
| 15. Learning Content & Explanation Engine | v0.3 | 3/3 | Complete | 2026-07-20 |
| 16. Explanation Panel UI | v0.3 | 2/2 | Complete | 2026-07-20 |
| 17. Contract Fixture Verification | v0.4 | 0/1 | Not started | - |
| 18. Explanation Compatibility Upgrade | v0.4 | 0/? | Not started | - |
| 19. General Product Feedback | v0.4 | 0/? | Not started | - |

---

*Milestones v0.0, v0.1, v0.2, and v0.3 shipped. v0.4 roadmap created
2026-07-21 — 3 phases (17-19) covering all 14 v1 requirements. Run
`/gsd:plan-phase 17` to begin.*
