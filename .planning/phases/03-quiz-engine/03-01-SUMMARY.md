---
phase: 03-quiz-engine
plan: 01
subsystem: quiz-engine
tags: [typescript, fisher-yates, rng, jest, domain-types]

# Dependency graph
requires:
  - phase: 02-dataset-domain-vocabulary
    provides: "Tense/Subject/Verb types and TENSES/SUBJECTS constants in src/dataset/types.ts"
provides:
  - "Triple, Question, QuizSession, GenerateOptions type contracts in src/quiz/types.ts"
  - "InsufficientVerbsError typed error carrying eligibleCount/required"
  - "shuffle<T>() injectable-RNG Fisher-Yates utility in src/quiz/random.ts"
affects: [quiz-engine-generation, quiz-scoring]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Injectable-RNG convention: shared utilities require `random: () => number` as a mandatory (non-default) parameter; only top-level generate() in Wave 2 may default to Math.random"
    - "Pure framework-free domain module under src/quiz/, mirroring src/dataset/ structure"

key-files:
  created:
    - src/quiz/types.ts
    - src/quiz/random.ts
    - __tests__/quiz-random.test.ts
  modified: []

key-decisions:
  - "Question/QuizSession carry no denormalized translation/label fields — Phase 4 derives display strings by verb lookup against the dataset"
  - "shuffle() has no default RNG so any missed thread-through in a caller is a compile error, not a silent bug"

patterns-established:
  - "import type vs value-import split (import type { Tense, Subject } from \"../dataset/types\") matching src/dataset/verbs.ts convention"
  - "Mock RNG test helper: mockRandom(sequence) returning a cycling closure, no mocking library"

requirements-completed: [QUIZ-04]

# Metrics
duration: 20min
completed: 2026-07-12
---

# Phase 3 Plan 1: Quiz Engine Type Contracts & Shuffle Utility Summary

**Established the Question/QuizSession/GenerateOptions type contracts and a deterministic, injectable-RNG Fisher-Yates shuffle utility that Wave 2's engine and scoring plans build against.**

## Performance

- **Duration:** ~20 min
- **Started:** 2026-07-12T17:00:00Z (approx)
- **Completed:** 2026-07-12T17:21:00Z
- **Tasks:** 2 completed
- **Files modified:** 3 (all new)

## Accomplishments
- Defined `Triple`, `Question`, `QuizSession`, `GenerateOptions`, and `InsufficientVerbsError` in `src/quiz/types.ts`, importing `Tense`/`Subject` from `src/dataset/types.ts` without redeclaration.
- Implemented `shuffle<T>()` as a Durstenfeld Fisher-Yates variant in `src/quiz/random.ts` with a mandatory (non-default) `random` parameter, `noUncheckedIndexedAccess`-safe swap via non-null assertions.
- Wrote 4 deterministic unit tests (`__tests__/quiz-random.test.ts`) covering exact-permutation determinism, immutability, permutation-preservation, and zero/one-element edge cases — following TDD RED/GREEN.

## Task Commits

Each task was committed atomically:

1. **Task 1: Define quiz-engine type contracts** - `50cab50` (feat)
2. **Task 2: Implement injectable-RNG Fisher-Yates shuffle + tests (RED)** - `962c8b8` (test)
3. **Task 2: Implement injectable-RNG Fisher-Yates shuffle + tests (GREEN)** - `af73670` (feat)

**Plan metadata:** commit pending (docs: complete plan)

_Note: Task 2 followed TDD (test commit → feat commit); no refactor commit was needed._

## Files Created/Modified
- `src/quiz/types.ts` - Triple/Question/QuizSession/GenerateOptions type contracts + InsufficientVerbsError
- `src/quiz/random.ts` - Injectable-RNG Fisher-Yates `shuffle<T>()`
- `__tests__/quiz-random.test.ts` - 4 deterministic tests for `shuffle()`

## TDD Gate Compliance

- RED gate: `962c8b8` (test commit, verified failing — "Cannot find module" before implementation existed)
- GREEN gate: `af73670` (feat commit, all 4 tests + typecheck passed after)
- REFACTOR gate: not needed, no refactor commit

## Verification

- `npx jest __tests__/quiz-random.test.ts` — 4/4 passed
- `npm run typecheck` — exits 0
- `npx jest` (full suite) — 11/11 passed across 4 suites, no regressions
- `grep -c '"present_indicative"' src/quiz/types.ts` — 0 (no Tense redeclaration)
- `grep -c 'class InsufficientVerbsError extends Error' src/quiz/types.ts` — 1
- `grep -c '= Math.random' src/quiz/random.ts` — 0 (no default RNG in shared utility)

## Deviations from Plan

None - plan executed exactly as written.

## Self-Check: PASSED

All created files and commit hashes verified present:
- FOUND: src/quiz/types.ts
- FOUND: src/quiz/random.ts
- FOUND: __tests__/quiz-random.test.ts
- FOUND: 50cab50, 962c8b8, af73670
