---
phase: 13-verb-mode-selection
plan: 01
subsystem: quiz-engine
tags: [typescript, zustand, jest, quiz-generation]

# Dependency graph
requires: []
provides:
  - "VerbMode union type (\"regular_only\" | \"mixed\" | \"irregular_only\") in src/quiz/types.ts"
  - "GenerateOptions.verbMode contract replacing GenerateOptions.includeIrregular"
  - "3-way pool filter in generate() (src/quiz/engine.ts)"
  - "Updated INSUFFICIENT_VERBS_MESSAGE copy (D-10) with no reference to a removed control"
  - "Unit test coverage for regular_only/mixed/irregular_only including the insufficient-pool path"
affects: [13-02]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "3-way string-union branch (regular_only/irregular_only/default-mixed) replacing a boolean toggle filter"

key-files:
  created: []
  modified:
    - src/quiz/types.ts
    - src/quiz/engine.ts
    - src/store/useQuizStore.ts
    - __tests__/quiz-engine.test.ts
    - __tests__/useQuizStore.test.ts

key-decisions:
  - "VerbMode type lives in src/quiz/types.ts, not src/dataset/types.ts (D-08 — quiz domain, not dataset domain)"
  - "INSUFFICIENT_VERBS_MESSAGE updated verbatim to D-10 text: \"...or a different verb mode.\""

patterns-established:
  - "Renamed includeIrregular:false/true fixtures 1:1 to verbMode: \"regular_only\"/\"mixed\" across test files"

requirements-completed: [MODE-02, MODE-03, TEST-03]

# Metrics
duration: 12min
completed: 2026-07-20
---

# Phase 13 Plan 01: Verb Mode Engine Filter Summary

**Replaced the boolean `includeIrregular` quiz-engine contract with a 3-way `VerbMode` union (`regular_only`/`mixed`/`irregular_only`), added a 3-branch pool filter in `generate()`, and covered all three modes plus the insufficient-pool path with new unit tests.**

## Performance

- **Duration:** ~12 min
- **Started:** 2026-07-20T09:47:00Z
- **Completed:** 2026-07-20T09:58:04Z
- **Tasks:** 2 completed
- **Files modified:** 5

## Accomplishments
- `VerbMode` type + `GenerateOptions.verbMode` contract defined in `src/quiz/types.ts`, replacing `includeIrregular: boolean`
- `generate()` in `src/quiz/engine.ts` now filters the verb pool 3 ways by `verbMode`, reusing the existing `InsufficientVerbsError` path unchanged for the `irregular_only` small-pool case
- `INSUFFICIENT_VERBS_MESSAGE` copy updated to no longer reference "including irregulars" (D-10)
- New test coverage: `irregular_only` restricts every question to `isIrregular === true`, `mixed` allows both classes, and an injected single-irregular-verb pool under `irregular_only` throws `InsufficientVerbsError`
- Full test suite: 158/158 passing (up from 155), no regressions

## Task Commits

Each task was committed atomically:

1. **Task 1: Add VerbMode type, convert engine filter, cover all three modes with tests** - `189174b` (test)
2. **Task 2: Update insufficient-verbs message and store test fixtures** - `8a2032e` (fix)

## Files Created/Modified
- `src/quiz/types.ts` - Added `VerbMode` union type; replaced `GenerateOptions.includeIrregular` with `verbMode: VerbMode`
- `src/quiz/engine.ts` - Replaced single-line `includeIrregular` filter with a 3-way branch on `options.verbMode`
- `src/store/useQuizStore.ts` - Updated `INSUFFICIENT_VERBS_MESSAGE` text to D-10 wording
- `__tests__/quiz-engine.test.ts` - Renamed `includeIrregular` fixtures to `verbMode`; added `irregular_only` filter test, `mixed` both-classes test, and `irregular_only` insufficient-pool test
- `__tests__/useQuizStore.test.ts` - Renamed fixtures to `verbMode`; updated insufficient-verbs message assertion to the new D-10 text

## Decisions Made
- `VerbMode` placed in `src/quiz/types.ts` (quiz domain) per D-08, not `src/dataset/types.ts`, keeping the dataset's `Verb`/`Tense`/`Subject` shape untouched by this UI-facing selection concept.
- Kept snake_case literals (`regular_only`/`mixed`/`irregular_only`) exactly as specified in D-07, matching the existing `Tense`/`Subject` snake_case convention.

## Deviations from Plan

None — plan executed exactly as written. `app/index.tsx` was left untouched: it still references `includeIrregular` and is a known, expected typecheck failure — that file is explicitly owned by Plan 02 (`13-02-PLAN.md`, `depends_on: [13-01]`, wave 2), which replaces the Switch with the verb-mode chip row and updates the `startQuiz` call site. This plan's own scope (`src/quiz/`, `src/store/`, and their tests) typechecks clean and `grep -rn "includeIrregular" src __tests__` returns no matches, matching this plan's stated verification scope.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- `VerbMode`/`GenerateOptions.verbMode` contract is ready for Plan 02's Setup UI to consume (`app/index.tsx`'s Switch → 3-chip selector, and its `startQuiz({ tenses, includeIrregular })` call site → `startQuiz({ tenses, verbMode })`)
- Known, expected typecheck error remains in `app/index.tsx` (line 42, `includeIrregular` prop) until Plan 02 lands — not a blocker for this plan, tracked as Plan 02's Task 1 scope
- Full test suite green (158/158), no regressions introduced

---
*Phase: 13-verb-mode-selection*
*Completed: 2026-07-20*
