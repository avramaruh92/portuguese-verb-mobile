# Requirements: Lafa — Portuguese Verb Conjugation App (Mobile) — v0.4

**Defined:** 2026-07-21
**Core Value:** A learner can open the app, pick what to practice, complete a 10-question conjugation quiz entirely offline, and see an accurate score.

Source: external codex-generated implementation plan
(`Mobile v0.4 Updated Implementation Plan.md`), scoped against this repo's
actual conventions during milestone kickoff.

## v1 Requirements

Requirements for this milestone. Each maps to roadmap phases.

### Contract Fixture Verification

- [ ] **CONTRACT-01**: Backend's v0.4 sample fixture (`contracts/content-verbs-v0.4.sample.json`) is copied into the mobile repo as a self-contained test fixture — no cross-repo import at test runtime
- [ ] **CONTRACT-02**: Fixture payload is proven to parse through the actual mobile runtime paths — `validateDataset(payload.verbs)`, `LearningContentSchema.safeParse(payload.learning)`, and `fetchRemoteVerbs` parsing
- [ ] **CONTRACT-03**: Fixture test asserts accented forms (e.g. `pôr`/`pôs`) and tied forms (e.g. `falam`) survive parsing unchanged

### Explanation Compatibility Upgrade

- [ ] **EXPL-05**: `selectExplanation` provides all backend v0.4 template variables (`verb`, `selectedAnswer`, `correctAnswer`, `tenseLabel`, `subjectLabel`, `selectedTenseLabel`, `selectedSubjectLabel`)
- [ ] **EXPL-06**: Selected tense/subject are resolved from `verb.formIndex[selectedAnswer]`; for ambiguous selected-answer matches, reuse the same selected match that drove the mismatch category when possible, otherwise fall back to the generic template
- [ ] **EXPL-07**: Backend-authored `tenseNotes[correctTense]` and `subjectHints[correctSubject]` are appended to the explanation when present
- [ ] **EXPL-08**: Fail-closed behavior is preserved — if `learning`, `formIndex`, or a selected-answer match is missing, no explanation is shown, never fabricated grammar text
- [ ] **TEST-06**: Explanation unit tests cover `selectedTenseLabel`/`selectedSubjectLabel` interpolation, appended `tenseNotes`/`subjectHints`, and the missing-selected-answer-match fail-closed path

### General Product Feedback

- [ ] **PFDBK-01**: User can open a "Help us improve" entry point from Setup, Quiz, and Results screens
- [ ] **PFDBK-02**: On Quiz, after an answer is locked, a two-action row offers "Report a problem" and "Help us improve" as distinct flows
- [ ] **PFDBK-03**: Product feedback payload (`category: bug | idea | other`, `message` 1-2000 chars, `screen: setup | quiz | results`, `appVersion` 1-20 chars, `platform: ios | android`) is submitted via `POST /product-feedback`, matching the backend v0.4 contract exactly
- [ ] **PFDBK-04**: Product feedback submission uses the same 90s `AbortController` timeout pattern and success/validation-error/server-error/network-error result union as existing feedback
- [ ] **PFDBK-05**: Product feedback sends only screen/app metadata — never quiz-answer context (verb/tense/subject/correctAnswer/selectedAnswer)
- [ ] **TEST-07**: Product-feedback unit tests mirror existing feedback test coverage — schema validation (valid payload; invalid category/screen/platform; empty/over-2000 message; empty/over-20 appVersion), payload-builder field mapping, and submit-status branching (201/400/500-or-other/network-error)

## v2 Requirements

None newly deferred by this milestone. See PROJECT.md's existing deferred
list (`PROG-01`, `PROG-02`, `PROG-03`, `FETCH-06`, `QUIZ-09`, `UI-04`) —
unchanged.

## Out of Scope

| Feature | Reason |
|---------|--------|
| Modifying or reinterpreting backend grammar content | Backend v0.4 is the source of truth; mobile only consumes and displays it |
| Collecting personal contact info in product feedback | Not part of the backend v0.4 contract; `category`/`message`/`screen`/`appVersion`/`platform` only |
| Changes to existing quiz-specific `POST /feedback` | Explicitly untouched by this milestone — product feedback is a new, separate endpoint/domain |
| Reinterpreting `isIrregular` semantics | Stays backend-owned: irregular in at least one supported taught tense, unchanged from v0.3 |
| Fixing the Phase-14 cross-verb distractor `formIndex`-miss gap | Pre-existing, explicitly deferred tech debt from v0.3, not part of this milestone's scope |

## Traceability

Populated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| CONTRACT-01 | TBD | Pending |
| CONTRACT-02 | TBD | Pending |
| CONTRACT-03 | TBD | Pending |
| EXPL-05 | TBD | Pending |
| EXPL-06 | TBD | Pending |
| EXPL-07 | TBD | Pending |
| EXPL-08 | TBD | Pending |
| TEST-06 | TBD | Pending |
| PFDBK-01 | TBD | Pending |
| PFDBK-02 | TBD | Pending |
| PFDBK-03 | TBD | Pending |
| PFDBK-04 | TBD | Pending |
| PFDBK-05 | TBD | Pending |
| TEST-07 | TBD | Pending |

**Coverage:**
- v1 requirements: 14 total
- Mapped to phases: 0
- Unmapped: 14 ⚠️ (roadmap creation next)

---
*Requirements defined: 2026-07-21*
*Last updated: 2026-07-21 after initial v0.4 definition*
