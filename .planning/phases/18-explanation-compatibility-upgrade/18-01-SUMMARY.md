---
phase: 18-explanation-compatibility-upgrade
plan: 01
subsystem: learning
tags: [zod, jest, typescript, explanation-templates]

# Dependency graph
requires:
  - phase: 17
    provides: "Backend v0.4 learning content contract (LearningContent/VerbLearningEntry types, Zod-validated) already proven to parse"
provides:
  - "selectExplanation resolves and interpolates selected-answer tense/subject labels (selectedTenseLabel/selectedSubjectLabel) alongside correct-answer labels"
  - "selectExplanation appends backend-authored tenseNotes/subjectHints as separate newline-joined lines, unconditional across mismatch categories"
  - "classify() returns { category, agreed } disambiguating true-agreement from disagree-fallback-to-generic"
affects: [learning-explain-consumers, app/quiz.tsx (no signature change, future rendering of appended lines)]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "classify() returns a { category, agreed } tuple instead of a bare category so callers can distinguish 'all matches agreed' from 'disagreement fell back to generic'"
    - "Optional backend-authored strings (tenseNotes/subjectHints) are appended via a filter-then-join pattern rather than conditional string concatenation, avoiding empty lines"

key-files:
  created: []
  modified:
    - src/learning/explain.ts
    - __tests__/learning-explain.test.ts

key-decisions:
  - "selectedTenseLabel/selectedSubjectLabel are resolved from matches[0] only when classify() reports agreed:true; on tied-disagree they are omitted from the interpolation context entirely (D-02) rather than computed from an arbitrary match"
  - "tenseNotes/subjectHints appending is unconditional across all four mismatch categories including generic (D-04) — no category-based gating"
  - "Extra lines are built via [interpolated, ...extraLines].join('\\n') with extraLines pre-filtered by Boolean() so an absent note/hint never produces an empty trailing line"

patterns-established:
  - "When a classifier needs to expose both a resolved category and whether that resolution was unambiguous, return an object ({ category, agreed }) rather than overloading the category value itself"

requirements-completed: [EXPL-05, EXPL-06, EXPL-07, EXPL-08, TEST-06]

# Metrics
duration: 15min
completed: 2026-07-22
---

# Phase 18 Plan 01: Explanation Compatibility Upgrade Summary

**Extended `selectExplanation` to interpolate selected-answer tense/subject labels (matches[0]-derived, omitted on tied-disagree) and append backend-authored tenseNotes/subjectHints as separate newline-joined lines, matching the backend v0.4 explanation template contract with zero signature changes and all existing fail-closed behavior intact.**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-07-22T09:45:00Z
- **Completed:** 2026-07-22T10:01:42Z
- **Tasks:** 2 (Task 2 folded into Task 1's single coherent test-file edit — see Deviations)
- **Files modified:** 2

## Accomplishments
- `classify()` now returns `{ category, agreed }`, disambiguating genuine category agreement from tied-disagree's fallback to `generic` (previously indistinguishable via a bare `MismatchCategory`).
- `selectExplanation`'s interpolation context now includes `selectedTenseLabel`/`selectedSubjectLabel`, resolved deterministically from `matches[0]` (per the same reference-match convention `classify()` already used), only when matches agreed.
- Backend-authored `tenseNotes[correctTense]` and `subjectHints[correctSubject]` are appended as separate lines after the interpolated text, unconditionally across all four mismatch categories, with absent values silently skipped (no empty lines).
- Full TEST-06 coverage matrix added: named tests matching `-t "template"`, `-t "selected"`, `-t "notes|hints"`, and `-t "undefined"` filters, plus a purity (non-mutation) test for the new append path.
- Every pre-existing test (11 original + all pre-existing fail-closed cases) still passes unchanged.

## Task Commits

Each task was committed atomically:

1. **Task 1: Resolve selected-answer labels and append notes/hints in selectExplanation** (TDD) - `b08c95e` (feat)

**Task 2** required no additional diff: the full TEST-06 coverage matrix (EXPL-05/06/07/08 named tests, only-one-of notes/hints cases, and the purity assertion) was already written as part of Task 1's single test-file edit, since the plan's TDD flow for Task 1 already specified writing those exact test cases. Verified independently via the `-t` filter commands from Task 2's `<verify>` block — all pass with no further code changes needed. See Deviations below.

**Plan metadata:** (this commit, to follow)

## Files Created/Modified
- `src/learning/explain.ts` - `classify()` returns `{ category, agreed }`; `selectExplanation` interpolates `selectedTenseLabel`/`selectedSubjectLabel` from `matches[0]` when agreed, and appends `tenseNotes`/`subjectHints` as filtered, newline-joined extra lines
- `__tests__/learning-explain.test.ts` - 12 new tests covering EXPL-05 (full template interpolation), EXPL-06 (selected-label resolution: single-match wrongSubject/wrongTense, tied-agree, tied-disagree omission), EXPL-07 (notes/hints appending: both present, only-tenseNotes, only-subjectHints, neither, unconditional-across-categories), EXPL-08 (fail-closed with notes/hints present), and a purity/non-mutation test for the append path

## Decisions Made
- Resolved `selectedTenseLabel`/`selectedSubjectLabel` from `matches[0]` under an `if (agreed)` guard rather than computing them unconditionally and letting `interpolate()` silently ignore unused keys — this makes the D-02 omission explicit and testable (asserted via the tied-disagree test expecting the exact plain generic string with no stray tokens).
- Used `[interpolated, ...extraLines].join("\n")` with `extraLines` pre-filtered by `Boolean()` rather than building the string with conditional `+=` branches, to guarantee no empty line is ever introduced regardless of which of tenseNotes/subjectHints is present.
- Combined all of Task 2's required coverage into Task 1's test-writing step (both tasks target the same file and the TDD behavior spec for Task 1 already enumerated the full matrix) — verified this satisfies Task 2's acceptance criteria independently before treating it as complete, rather than skipping Task 2's verification.

## Deviations from Plan

None requiring auto-fixes (no Rule 1/2/3 triggers). One process deviation, documented for transparency:

**Task 2 folded into Task 1's commit** - Task 1's `<behavior>`/`<action>` blocks already required writing every test case Task 2's coverage-matrix action also calls for (named tests matching "template"/"selected"/"notes|hints"/"undefined", only-one-of notes/hints cases, and a purity assertion). Rather than duplicating those same tests in a second pass, they were written once during Task 1's TDD cycle. Task 2's full `<verify>` command set (the four `-t` filter runs plus `npm test`) was still run independently after Task 1's commit to confirm every Task 2 acceptance criterion holds, with no gaps found and no additional diff required.

**Total deviations:** 0 auto-fixed. 1 process note (no functional impact — all Task 2 acceptance criteria independently verified).

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- `selectExplanation`'s output now matches the backend v0.4 explanation template contract; no caller changes needed (signature unchanged, `app/quiz.tsx` continues to work as-is and will render the richer appended text automatically once/if it displays multi-line explanation strings).
- Fail-closed contract fully preserved and now covered for the notes/hints append path specifically (no fabricated text possible even with notes/hints configured, if the match itself is missing).
- Full test suite green at 209 tests (up from the 197-test pre-phase baseline: 11 original explain tests + 12 new = 23 in `learning-explain.test.ts`, no regressions across the other 17 suites).

---
*Phase: 18-explanation-compatibility-upgrade*
*Completed: 2026-07-22*

## Self-Check: PASSED
- FOUND: src/learning/explain.ts
- FOUND: __tests__/learning-explain.test.ts
- FOUND: .planning/phases/18-explanation-compatibility-upgrade/18-01-SUMMARY.md
- FOUND commit: b08c95e
