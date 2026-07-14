---
phase: 08-async-quiz-start-dataset-snapshot
plan: 02
subsystem: ui
tags: [expo-router, async, react, quiz-flow]

# Dependency graph
requires:
  - phase: 08-async-quiz-start-dataset-snapshot
    plan: 01
    provides: "Async startQuiz that awaits resolveVerbs() and snapshots the resolved dataset into the quiz session"
provides:
  - "prefetch() fired once at root-layout mount, kicking off dataset resolution before any screen needs it"
  - "Setup Start and Results Try Again both correctly await async startQuiz before reading status, eliminating the stale-status race"
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "async button handler with local starting boolean: guard re-entry, setStarting(true), await in try, read status after await, setStarting(false) in finally"

key-files:
  created: []
  modified:
    - app/_layout.tsx
    - app/index.tsx
    - app/results.tsx

key-decisions:
  - "prefetch() called fire-and-forget (no await, no loading state) in a useEffect with empty deps on RootLayout mount, per D-04"
  - "No new QuizStatus value added for the transient starting state — local component-level boolean instead, per D-03"

patterns-established:
  - "Loading-flag async button pattern mirrored from src/feedback/ReportFeedbackModal.tsx: disabled={...||starting}, label swap to 'Starting…', finally-guaranteed reset"

requirements-completed: [FETCH-04]

# Metrics
duration: 15min
completed: 2026-07-14
---

# Phase 8 Plan 2: Async Quiz Start & Dataset Snapshot — UI Wiring Summary

**Root layout now fires `prefetch()` once at app mount, and both quiz-start call sites (`app/index.tsx` Start, `app/results.tsx` Try Again) correctly `await` the now-async `startQuiz` before reading status, with a local `starting` flag keeping each button inert and labeled "Starting…" during the await.**

## Performance

- **Duration:** ~15 min
- **Tasks:** 3 completed
- **Files modified:** 3

## Accomplishments
- `app/_layout.tsx` imports `prefetch` from `../src/dataset/source` and fires it once via `useEffect(() => { prefetch(); }, [])` — non-blocking, memoized internally by Phase 7.
- `app/index.tsx`'s `handleStartQuiz` is now `async`: guards `!canStart || starting`, sets `starting`, awaits `startQuiz(...)`, reads `useQuizStore.getState().status` only after the await resolves, navigates only when `status === "in-progress"`, and resets `starting` in a `finally`. The Start `Pressable` is `disabled={!canStart || starting}` and its label swaps to `"Starting…"` while `starting` is true.
- `app/results.tsx`'s `handleTryAgain` follows the identical shape, preserving the existing early-return `if (!filters)` guard before the async work begins. The Try Again `Pressable` is `disabled={starting}` with the same label swap.
- No spinners or color changes added — plain label swap per Phase 10 deferral.

## Task Commits

Each task was committed atomically:

1. **Task 1: Fire prefetch() once at root-layout mount** - `ad097c1` (feat)
2. **Task 2: Make Setup Start await async startQuiz with a loading flag** - `bea625c` (feat)
3. **Task 3: Make Results Try Again await async startQuiz with a loading flag** - `5f215f8` (feat)

## Files Created/Modified
- `app/_layout.tsx` - added `useEffect(() => { prefetch(); }, [])`, imports `useEffect` and `prefetch`.
- `app/index.tsx` - `handleStartQuiz` converted to async with `starting` state; Start button gated and relabeled during the await.
- `app/results.tsx` - `handleTryAgain` converted to async with `starting` state; Try Again button gated and relabeled during the await; `useState` import added.

## Decisions Made
None beyond what the plan specified — followed D-02, D-03, D-04 exactly as written.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

The async quiz-start flow is fully wired end to end: `prefetch()` kicks off dataset resolution at app load, and both Start/Try Again buttons correctly await `startQuiz` before reading status and navigating, with inert/labeled feedback during the await. Phase 10 owns final visual treatment (spinners, colors) for the `starting` state. No blockers for downstream phases.

## Self-Check: PASSED
- FOUND: app/_layout.tsx
- FOUND: app/index.tsx
- FOUND: app/results.tsx
- FOUND commit: ad097c1
- FOUND commit: bea625c
- FOUND commit: 5f215f8
