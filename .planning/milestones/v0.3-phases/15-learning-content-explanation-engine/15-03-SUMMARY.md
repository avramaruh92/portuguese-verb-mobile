---
phase: 15-learning-content-explanation-engine
plan: 03
subsystem: learning
tags: [pure-function, tdd, explanation-engine]

requires:
  - "15-01: src/learning/types.ts (FormMatch, MismatchCategory, LearningContent), Verb.formIndex"
provides:
  - "src/learning/explain.ts: selectExplanation pure function (verb, selectedAnswer, correctAnswer slot, learning) -> string | undefined"
affects: [16]

tech-stack:
  added: []
  patterns:
    - "Silent-degrade (return undefined, never throw) mirrored from src/dataset/source.ts, applied to every missing-learning-data path"
    - "Regex-based single-brace interpolation helper (no templating library), per Don't-Hand-Roll guidance in 15-RESEARCH.md"

key-files:
  created:
    - src/learning/explain.ts
    - __tests__/learning-explain.test.ts
  modified: []

key-decisions:
  - "Tie-break-to-generic (D-01) implemented as: map every formIndex match to a category, use it only if all matches agree, otherwise fall back to generic — prevents emitting a grammatically-wrong confident template"
  - "correctAnswerReveal template intentionally never referenced — out of scope per plan interfaces block"

patterns-established:
  - "classify() helper isolates the per-match category mapping + tie-break logic as one small, independently-reasoned function inside explain.ts"

requirements-completed: [TEST-05]

duration: 14min
completed: 2026-07-20
---

# Phase 15 Plan 03: Explanation Selection Engine Summary

Implemented the pure `selectExplanation` function in a new `src/learning/explain.ts` — given a verb, a wrong selected answer, the correct slot, and parsed learning content, it resolves the mismatch category via `formIndex` and returns an interpolated backend-template string, or `undefined` when no confident match exists. Followed the full TDD RED->GREEN cycle.

## Performance

- **Duration:** 14 min
- **Started:** 2026-07-20T19:02:00Z
- **Completed:** 2026-07-20T19:16:00Z
- **Tasks:** 2 completed
- **Files modified:** 2 (both new)

## Accomplishments
- `src/learning/explain.ts` exports `selectExplanation` with the exact four-parameter signature from the plan's interfaces block, plus internal `classify` and `interpolate` helpers (not exported, matching the plan's "pure function + classify + interpolate helpers" artifact description).
- Every missing-data path (`learning` undefined, missing `learning.verbs[verb.verb]` entry, missing `verb.formIndex`, empty/absent `formIndex[selectedAnswer]`) returns `undefined` without throwing — verified by both dedicated unit tests and a `grep -n "throw"` source assertion (no matches).
- Tie-break logic (D-01): when 2+ formIndex matches for the same selected answer classify to different categories, the function falls back to the `generic` template rather than risk a confidently-wrong grammar explanation; when tied matches agree, that shared category's template is used.
- Purity proven via a dedicated test that snapshots both `verb` and `learning` inputs with `JSON.stringify` before four separate `selectExplanation` calls (including the tied-disagree and no-match paths) and asserts deep equality afterward.
- Interpolation uses a small regex helper (`/\{(\w+)\}/g`) with no templating library dependency, filling `{verb}`, `{correctAnswer}`, `{selectedAnswer}`, `{tenseLabel}`, `{subjectLabel}` from the correct answer slot — `tenseLabel`/`subjectLabel` sourced from the existing `src/quiz/labels.ts` lookup tables, never re-declared.

## Task Commits

Each task was committed atomically (TDD RED -> GREEN):

1. **Task 1 (RED): Write the failing selectExplanation test suite** - `d0da2a3` (test)
   - Confirmed failing on `Cannot find module '../src/learning/explain'` before any implementation existed.
2. **Task 2 (GREEN): Implement selectExplanation** - `f94fccc` (feat)
   - All 11 RED-suite assertions pass; no REFACTOR commit needed (implementation was clean on first pass).

**Plan metadata:** committed alongside this SUMMARY.

## Files Created/Modified
- `__tests__/learning-explain.test.ts` - 11 `it(...)` cases: per-category templates (wrongTense/wrongSubject/wrongTenseAndSubject), tied-agree, tied-disagree-to-generic, undefined-learning, missing-verb-entry, missing-formIndex, empty-matches, unknown-selectedAnswer-key, and the purity snapshot check
- `src/learning/explain.ts` - `selectExplanation` (exported), `classify` and `interpolate` (internal helpers)

## Deviations from Plan

None - plan executed exactly as written.

## TDD Gate Compliance

Both tasks together form the plan-level RED -> GREEN cycle (frontmatter `type: tdd`):
- RED commit `d0da2a3`: test file added; run failed as expected (`Cannot find module '../src/learning/explain'`) — confirmed no false-pass before implementation existed.
- GREEN commit `f94fccc`: `selectExplanation` implemented; all 11 tests pass; no REFACTOR commit needed.

## Verification

- `npm test -- __tests__/learning-explain.test.ts` — 11/11 passing.
- `npm test` (full suite) — 187/187 tests pass across 17 suites (no regressions from the parallel 15-02 work already merged into this branch's base).
- `npx tsc --noEmit` — clean.
- `grep -n "throw" src/learning/explain.ts` — no matches (fully fail-closed).
- `grep -n "correctAnswerReveal" src/learning/explain.ts` — no matches (out of scope, not referenced).

## Self-Check: PASSED

- FOUND: src/learning/explain.ts
- FOUND: __tests__/learning-explain.test.ts
- FOUND commit d0da2a3
- FOUND commit f94fccc
