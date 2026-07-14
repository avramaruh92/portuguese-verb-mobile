---
phase: 09-end-quiz-early-flow
plan: 01
subsystem: ui
tags: [expo-router, react-navigation, zustand, alert, quiz-exit]

requires:
  - phase: 08-fetch-and-fallback
    provides: existing useQuizStore with reset() restoring initialState wholesale
provides:
  - Native header "Exit" control on the Quiz screen, visible only while status === "in-progress"
  - Shared confirmExit Alert.alert handler ("Quit Quiz?" / "Your progress will be lost.", distinct "Keep Practicing"/"Quit Quiz" labels)
  - beforeRemove navigation listener intercepting swipe-back/hardware-back and routing through the same confirmation
  - Full-state-equality store test proving reset() after an in-progress, mutated quiz restores every field
affects: [10-visual-polish]

tech-stack:
  added: []
  patterns:
    - "Per-route Stack.Screen options override merges over app/_layout.tsx's global headerShown:false (Expo Router v6)"
    - "beforeRemove navigation listener as the required gesture-bypass guard, not gestureEnabled:false"
    - "Single shared confirmExit(onConfirm) handler invoked from both header button and beforeRemove listener"

key-files:
  created: []
  modified:
    - app/quiz.tsx
    - __tests__/useQuizStore.test.ts

key-decisions:
  - "Followed D-01/D-02/D-03/D-04 from 09-CONTEXT.md verbatim: native header exit control, Alert.alert with distinct labels, plain-text 'Exit' button, Claude's-discretion dialog copy ('Quit Quiz?' / 'Your progress will be lost.')"
  - "Reused existing reset() store action directly rather than hand-rolling a partial reset, per Pitfall 7"

patterns-established:
  - "Exit-control and beforeRemove guard both gate strictly on status === \"in-progress\" to avoid double-dialog after auto-completion on the last question"

requirements-completed: [QUIZ-05, QUIZ-06, QUIZ-07, QUIZ-08]

duration: 12min
completed: 2026-07-14
---

# Phase 9 Plan 01: End-Quiz-Early Flow (Exit control + beforeRemove guard) Summary

**Native header "Exit" control and beforeRemove gesture guard added to app/quiz.tsx, both routed through one shared Alert.alert confirmation that calls the existing reset() before returning to Setup.**

## Performance

- **Duration:** 12 min
- **Started:** 2026-07-14T18:05:00Z
- **Completed:** 2026-07-14T18:17:00Z
- **Tasks:** 2 completed
- **Files modified:** 2

## Accomplishments
- Quiz screen now shows a native-header "Exit" button while a quiz is in-progress, hidden once completed/idle/error
- Swipe-back and hardware-back gestures are intercepted via `navigation.addListener("beforeRemove", ...)` and routed through the same confirmation dialog as the header button — no bypass path
- Confirming exit calls the existing `reset()` (not a hand-rolled partial reset) then `router.replace("/")`, guaranteeing no partial-results screen and no stale-session leakage into the next quiz
- Added a full-state-equality test asserting `reset()` after an in-progress, mutated quiz (via `selectAnswer` + `advance`) restores every one of the seven store fields, not just `status`

## Task Commits

Each task was committed atomically:

1. **Task 1: Add header Exit control, shared confirmExit handler, and beforeRemove gesture guard to app/quiz.tsx** - `9a8f030` (feat)
2. **Task 2: Add store test proving reset() after an in-progress quiz restores full initialState** - `a3634de` (test)

**Plan metadata:** committed alongside this SUMMARY.md (docs)

## Files Created/Modified
- `app/quiz.tsx` - Added `Alert`, `Stack`, `useNavigation` imports; `status`/`reset` selectors; shared `confirmExit`/`onConfirm` handlers; `beforeRemove` listener effect; per-route `Stack.Screen` header override with an "Exit" `headerLeft` button gated on `status === "in-progress"`
- `__tests__/useQuizStore.test.ts` - Added a test driving the store to in-progress with `currentIndex`/`answers`/`lockedChoice` diverged from `initialState`, then asserting `reset()` restores all seven fields

## Deviations from Plan

None - plan executed exactly as written. Minor whitespace re-indentation of the pre-existing `ScrollView` JSX block was done as part of wrapping it in a `<>...</>` fragment alongside the new `<Stack.Screen>` sibling — no behavior change.

## Verification

- `npm run typecheck` exits 0
- `npm test` passes with no regressions: 140/140 tests passing (13 suites), up from 139 before this plan
- `grep -n "addListener" app/quiz.tsx` shows the `beforeRemove` listener
- `grep -n "Alert.alert" app/quiz.tsx` shows exactly one call; both "Quit Quiz" and "Keep Practicing" labels present
- `grep -n "Stack.Screen" app/quiz.tsx` shows the per-route header override with `headerLeft`; `>Exit<` matches the button text
- `git diff --stat app/_layout.tsx` shows no changes (root layout untouched)
- Both the `beforeRemove` handler and header-button `onPress` early-return unless `status === "in-progress"`

## Self-Check: PASSED

- FOUND: app/quiz.tsx (modified, contains beforeRemove/Alert.alert/Stack.Screen/Exit as verified above)
- FOUND: __tests__/useQuizStore.test.ts (modified, new full-state-equality test present and passing)
- FOUND: commit 9a8f030 (feat: header Exit control + beforeRemove guard)
- FOUND: commit a3634de (test: full-state-equality reset test)
