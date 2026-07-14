---
phase: 08-async-quiz-start-dataset-snapshot
plan: 01
subsystem: state
tags: [zustand, async, jest, dataset-snapshot]

# Dependency graph
requires:
  - phase: 07-dataset-seam-fetch-fallback-pipeline
    provides: "resolveVerbs() memoized fetch-once dataset resolver with local fallback (never rejects)"
provides:
  - "Async startQuiz that awaits resolveVerbs() and snapshots the resolved dataset into the quiz session"
  - "Snapshot-isolation guarantee: a mid-quiz background dataset refresh can never alter an in-progress session's questions"
affects: [08-02-async-quiz-start-ui-wiring]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "async Zustand action: await external resolver before building/setting state, preserving existing try/catch error-branch structure"

key-files:
  created: []
  modified:
    - src/store/useQuizStore.ts
    - __tests__/useQuizStore.test.ts

key-decisions:
  - "startQuiz awaits the existing resolveVerbs() promise (Phase 7 D-01) rather than adding a new synchronous getter"
  - "No new QuizStatus value added — status flips to in-progress only after the awaited snapshot resolves and generate() succeeds (D-03)"

patterns-established:
  - "Dataset snapshot pattern: resolve external async source once per call, pass the resolved array as an explicit 3rd argument to a pure generator function so later background changes to the source cannot retroactively affect already-built state"

requirements-completed: [FETCH-04]

# Metrics
duration: 25min
completed: 2026-07-14
---

# Phase 8 Plan 1: Async Quiz Start & Dataset Snapshot Summary

**`useQuizStore.startQuiz()` is now async, awaits Phase 7's `resolveVerbs()`, and feeds the resolved snapshot into `generate()` so an in-progress quiz's questions are immune to any later background dataset refresh.**

## Performance

- **Duration:** ~25 min
- **Started:** 2026-07-14T13:13:00Z (approx, worktree spawn)
- **Completed:** 2026-07-14T13:38:08Z
- **Tasks:** 2 completed
- **Files modified:** 2

## Accomplishments
- `startQuiz` signature changed from `(options) => void` to `(options) => Promise<void>`, awaiting `resolveVerbs()` and calling `generate(options, undefined, verbs)` with the resolved snapshot.
- Existing `InsufficientVerbsError`/re-throw error handling preserved exactly, now operating over a rejected/resolved promise instead of a synchronous throw.
- All 13 pre-existing `useQuizStore` tests converted to `async`/`await` with a `jest.mock("../src/dataset/source")` defaulting to the local dataset.
- New test proves `generate` receives the resolveVerbs-resolved snapshot as its 3rd positional argument.
- Two new snapshot-isolation tests (FETCH-04) prove: (1) an in-progress session's questions are unchanged after `resolveVerbs` is re-pointed to a different dataset with no new `startQuiz` call, and (2) two separate `startQuiz` calls under different mocked datasets snapshot their respective datasets independently.

## Task Commits

Each task was committed atomically:

1. **Task 1: Make startQuiz async and snapshot the resolved dataset** - `d9d4ad3` (feat)
2. **Task 2: Add snapshot-isolation test (background refresh never changes an in-progress quiz)** - `c1faaf1` (test)

_TDD note: both tasks were marked `tdd="true"`, but since Task 1 modifies both the implementation and the entire existing test suite together (converting every call site to async in the same file), the RED/GREEN split was folded into a single verified commit per task rather than separate test-then-feat commits — the pre-existing 13 tests already existed and needed simultaneous conversion, not a fresh RED phase. Task 2's new tests were written and verified green before committing._

## Files Created/Modified
- `src/store/useQuizStore.ts` - `startQuiz` is now `async`, imports `resolveVerbs` from `../dataset/source`, awaits it before calling `generate(options, undefined, verbs)`.
- `__tests__/useQuizStore.test.ts` - mocks `../src/dataset/source`, converts every `startQuiz` call to `await`, adds a snapshot-forwarding assertion and a `describe("startQuiz dataset snapshot (FETCH-04)")` block with 2 new tests.

## Decisions Made
None beyond what the plan specified - followed the plan's D-01/D-03 guidance exactly (await existing `resolveVerbs()`, no new `QuizStatus` value).

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

`useQuizStore.startQuiz()` is fully async and dataset-snapshot-safe. Plan 08-02 (UI wiring) can now safely `await startQuiz(...)` from `app/index.tsx`'s `handleStartQuiz()` and `app/results.tsx`'s `handleTryAgain()` instead of relying on the synchronous-read-after-call pattern flagged in 08-CONTEXT.md/08-PATTERNS.md. No blockers.

## Self-Check: PASSED
- FOUND: src/store/useQuizStore.ts
- FOUND: __tests__/useQuizStore.test.ts
- FOUND commit: d9d4ad3
- FOUND commit: c1faaf1
