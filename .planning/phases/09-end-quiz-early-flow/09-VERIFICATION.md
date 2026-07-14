---
phase: 09-end-quiz-early-flow
verified: 2026-07-14T00:00:00Z
status: passed
score: 5/5 must-haves verified
overrides_applied: 0
---

# Phase 9: End-Quiz-Early Flow Verification Report

**Phase Goal:** A learner can cleanly exit an in-progress quiz at any time — via a visible control or a back gesture — with a clear confirmation, discarding progress with no partial results shown.
**Verified:** 2026-07-14
**Status:** passed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths (ROADMAP Success Criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | An in-progress quiz shows a visible exit control in the header | ✓ VERIFIED | `app/quiz.tsx` renders `<Stack.Screen options={{ headerShown: true, headerLeft: () => <Pressable onPress={handleExitPress}><Text>Exit</Text></Pressable> }} />` (lines 89-99). Quiz screen is only reachable via `router.replace("/quiz")` after `startQuiz()` resolves to `status === "in-progress"` (app/index.tsx:40-41), and `session` (required to render past the `if (!session) return null` guard) is only non-null while in-progress/completed (src/store/useQuizStore.ts), so the header is visible exactly when a quiz is in progress. |
| 2 | Tapping the exit control shows a confirmation dialog with distinct action labels ("Quit Quiz"/"Keep Practicing"), not generic OK/Cancel | ✓ VERIFIED | Single shared `confirmExit()` (quiz.tsx:22-27) calls `Alert.alert("Quit Quiz?", "Your progress will be lost.", [{text:"Keep Practicing", style:"cancel"}, {text:"Quit Quiz", style:"destructive", onPress:onConfirm}])`. `handleExitPress` (line 44-47) invokes it, gated on `status === "in-progress"`. Confirmed on-device in 09-02-SUMMARY.md ("dialog with distinct 'Quit Quiz'/'Keep Practicing' labels, not generic OK/Cancel"). |
| 3 | Swiping back or pressing hardware back during an in-progress quiz triggers the same confirmation dialog — no bypass path | ✓ VERIFIED | `useEffect` (quiz.tsx:34-42) registers `navigation.addListener("beforeRemove", (e) => { if (status !== "in-progress") return; e.preventDefault(); confirmExit(onConfirm); })` — the required Pitfall-8 mitigation (not `gestureEnabled:false`). Native gesture behavior is not statically verifiable; 09-02-SUMMARY.md (human-verify checkpoint, user typed "approved") confirms an actual iOS left-edge swipe-back gesture triggers the same dialog and hardware back does too (steps 3-5 of the 8-check protocol). |
| 4 | Confirming exit returns the learner to Setup with progress discarded and no partial score/results shown | ✓ VERIFIED | `onConfirm()` (quiz.tsx:29-32) calls `reset()` (the existing full-state-reset store action — see below) synchronously before `router.replace("/")`. No results/partial-score screen exists between Quiz and Setup in this navigation path. `__tests__/useQuizStore.test.ts:186-211` proves `reset()` after an in-progress, mutated quiz restores all seven fields (`status`, `filters`, `session`, `currentIndex`, `answers`, `lockedChoice`, `errorMessage`) to `initialState` — not just `status`. On-device confirmation in 09-02-SUMMARY.md (step 6: "no partial-results shown; subsequent quiz starts cleanly"). |
| 5 | Declining ("Keep Practicing") returns to the exact in-progress question with no state lost | ✓ VERIFIED | `Alert.alert`'s "Keep Practicing" button has `style: "cancel"` and no `onPress` handler — it is a pure no-op, leaving all store state untouched (no `reset()`/`selectAnswer`/`advance` call fires). Since Quiz screen re-renders from the same unchanged store state, the learner sees the same question/progress. Confirmed on-device in 09-02-SUMMARY.md (steps 4-5: decline returns to the exact same question with progress unchanged, for both header button and swipe paths). |

**Score:** 5/5 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `app/quiz.tsx` | Header Exit control, shared confirmExit handler, beforeRemove gesture guard, status-gated exit availability | ✓ VERIFIED | All present: `Alert.alert` (1 call, lines 23-26), `Stack.Screen` header override with `headerLeft` Exit button (lines 89-99), `beforeRemove` listener (lines 34-42), both `handleExitPress` and the listener gate on `status !== "in-progress"` before acting. |
| `__tests__/useQuizStore.test.ts` | Full-state-equality test proving `reset()` after an in-progress quiz restores every field | ✓ VERIFIED | Test at line 186 drives store to in-progress + mutated (`currentIndex: 1`, `answers: ["choice-0"]`, `lockedChoice: "choice-1"`), calls `reset()`, asserts all 7 fields match `initialState`. Passes (`npm test` — 140/140). |

### Key Link Verification

| From | To | Via | Status | Details |
|------|-----|-----|--------|---------|
| `app/quiz.tsx confirmExit` (destructive button) | `useQuizStore.reset()` + `router.replace("/")` | `onPress: onConfirm` | ✓ WIRED | `onConfirm()` calls `reset()` then `router.replace("/")` synchronously (lines 29-32); wired as the destructive button's `onPress` in the shared `Alert.alert` (line 25). |
| `app/quiz.tsx beforeRemove listener` | `confirmExit` | `navigation.addListener("beforeRemove", ...)` | ✓ WIRED | Listener registered in `useEffect` (lines 34-42); calls `e.preventDefault()` then `confirmExit(onConfirm)` when `status === "in-progress"`; unsubscribe returned/cleaned up. Same `confirmExit`/`onConfirm` functions used by both the header button and the gesture listener (single shared implementation, no duplication). |

### Data-Flow Trace (Level 4)

Not applicable in the classic sense (no remote/DB data rendered) — the relevant "data" is Zustand store state (`status`, `session`) flowing into conditional rendering and the exit-confirmation gates. Traced above in Truths #1 and #5; store transitions are unit-tested directly (`useQuizStore.test.ts`), and the flow from store mutation → UI gating was confirmed both by code inspection and the on-device checkpoint (09-02).

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Full test suite (incl. new full-state-equality reset test) | `npm test -- --silent` | 13 suites / 140 tests passed | ✓ PASS |
| Typecheck | `npm run typecheck` | exits 0, no errors | ✓ PASS |
| No debt markers introduced | `grep -n "TODO\|FIXME\|XXX\|HACK\|PLACEHOLDER" app/quiz.tsx __tests__/useQuizStore.test.ts` | no matches | ✓ PASS |
| `app/_layout.tsx` untouched by this phase | `git log --oneline -- app/_layout.tsx` | last touched in Phase 8 (`ad097c1`), not touched by Phase 9 commits | ✓ PASS |
| Native swipe-back / hardware-back gesture (cannot be exercised by a headless test runner) | manual on-device (Plan 09-02) | User approved all 8 checks | ✓ PASS (human-verified, see below) |

### Probe Execution

No `scripts/*/tests/probe-*.sh` probes declared or found for this phase. N/A.

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| QUIZ-05 | 09-01 | Visible header exit control | ✓ SATISFIED | `Stack.Screen` headerLeft "Exit" button, gated by session/status as traced in Truth #1 |
| QUIZ-06 | 09-01 | Confirmation dialog with distinct action labels | ✓ SATISFIED | Shared `Alert.alert` with "Quit Quiz"/"Keep Practicing" (Truth #2) |
| QUIZ-07 | 09-01 + 09-02 | Same confirmation on swipe-back/hardware-back, no bypass | ✓ SATISFIED | `beforeRemove` listener (code) + on-device gesture verification (09-02-SUMMARY.md) |
| QUIZ-08 | 09-01 | Confirming exit discards progress, returns to Setup, no partial results | ✓ SATISFIED | `reset()` + `router.replace("/")`, full-state-equality test (Truth #4) |

Note: `.planning/REQUIREMENTS.md` still shows QUIZ-05..08 as unchecked `[ ]` / "Pending" in its tracking table. This is a pre-existing documentation-sync gap in this project (FETCH-03/FETCH-04 from already-shipped Phases 7-8 show the identical unchecked pattern), not something introduced by this phase, and does not reflect an implementation gap — informational only, not a blocker.

### Anti-Patterns Found

None. No `TODO`/`FIXME`/`XXX`/`HACK`/`PLACEHOLDER` markers, no empty-return stubs, no hardcoded-empty state in the modified files (`app/quiz.tsx`, `__tests__/useQuizStore.test.ts`).

### Human Verification Required

None outstanding. Plan 09-02 was the designated human-verify checkpoint for this phase's on-device-only behaviors (native swipe-back gesture, hardware back, decline-resumes-exact-question) — required because these cannot be verified via static code reading or a headless Jest run. The user typed "approved" for all 8 checks per `09-02-SUMMARY.md`, and that SUMMARY documents specifics (which button labels appeared, which question was resumed, etc.) matching the plan's `how-to-verify` steps rather than a bare rubber-stamp, so it is accepted as evidence per this phase's verification instructions.

### Gaps Summary

No gaps found. All 5 ROADMAP success criteria are supported by code that exists, is substantive (not a stub), and is wired end-to-end (header button and gesture listener both route through one shared `confirmExit`/`onConfirm` pair, which calls the pre-existing whole-state `reset()`). The two behaviors that are inherently native/gesture-based and cannot be exercised by a headless test runner (swipe-back, hardware back) were closed by the dedicated on-device human-verify checkpoint in Plan 09-02, whose approval is accepted as evidence for those specific truths per this phase's verification scope. `npm run typecheck` and the full `npm test` suite (140/140, no regressions) both pass.

---

_Verified: 2026-07-14_
_Verifier: Claude (gsd-verifier)_
