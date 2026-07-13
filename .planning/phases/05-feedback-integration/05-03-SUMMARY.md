---
phase: 05-feedback-integration
plan: 03
subsystem: feedback
tags: [react-native, modal, ui, feedback]
dependency-graph:
  requires: [05-01, 05-02]
  provides: [ReportFeedbackModal]
  affects: [05-04]
tech-stack:
  added: []
  patterns: [modal-local-state, pageSheet-dismiss, reset-on-open-effect, ref-held-timer-cleanup]
key-files:
  created:
    - src/feedback/ReportFeedbackModal.tsx
  modified:
    - app/quiz.tsx
decisions: []
metrics:
  duration: ~15 min
  completed: 2026-07-13
---

# Phase 05 Plan 03: Report-a-Problem UI Slice Summary

The user-facing feedback vertical slice: a `ReportFeedbackModal` wired into the Quiz screen, letting a learner who has locked in an answer report a problem with the current question — reason picker, optional free text, inline spinner, success auto-dismiss, and conditional Retry — entirely in modal-local state with zero `useQuizStore` coupling.

## What Was Built

- `src/feedback/ReportFeedbackModal.tsx` — new component, props `{ visible, verb, tense, subject, correctAnswer, selectedAnswer, appVersion, platform, onClose }`. Uses RN core `Modal` with `presentationStyle="pageSheet"` + `onDismiss={onClose}` (iOS native swipe-to-dismiss, no cancel button per UI-SPEC) and `onRequestClose={onClose}` for Android back-gesture parity. All state is local `useState` (`reason`, `message`, `state: idle|submitting|success|error`, `lastStatus`) — no `useQuizStore`/`zustand` import anywhere in the file. A `useEffect` keyed on `visible` resets all local state to defaults whenever the modal opens, and clears any pending auto-dismiss `setTimeout` (held in a ref) both on open and on unmount, so a stale timer from a prior question can never fire `onClose` unexpectedly. `handleSubmit` builds the payload via `buildFeedbackPayload`, calls `submitFeedback`, and on success shows "✓ Feedback sent — thank you!" then auto-dismisses after 1500ms; on any error shows the generic "Something went wrong. Please try again." and shows a "Retry submission" button only when the last status was `server-error` or `network-error` (not `validation-error`, per D-06 vs D-07/D-08) — preserving the entered reason and free text so Retry resubmits the same input. An `ActivityIndicator` replaces the submit label and all reason options + the text input are disabled while submitting.
- `app/quiz.tsx` — added a "Report a problem" secondary text trigger (`#007AFF`, `minHeight: 44`) beneath the Next button, gated on `lockedChoice !== null` using the same opacity/`pointerEvents` hide pattern as the existing Next button. Sources `appVersion` via `Constants.expoConfig?.version ?? "unknown"` and `platform` via `Platform.OS`. Renders `<ReportFeedbackModal>` wired to the live question context (`question.verb/tense/subject/correctAnswer`, `lockedChoice ?? ""`). The three existing `useQuizStore` selectors and `selectAnswer`/`advance` calls are unmodified — no new store writes were added.

## Verification

- `npx tsc --noEmit` — zero errors.
- `npm test` — 11 suites / 122 tests passing (no regression).
- `git diff --stat src/store/useQuizStore.ts` — empty (store untouched this plan, confirming FDBK-03 at the code level).
- All grep-based acceptance criteria from the plan (pageSheet, onDismiss, useEffect reset, clearTimeout, no useQuizStore/zustand references, buildFeedbackPayload/submitFeedback calls, exact copy strings, 1500ms auto-dismiss) passed as run during Task 1 and Task 2.
- No new hex colors, font sizes, or spacing values were introduced — all styles reuse the existing tokens documented in 05-UI-SPEC.md.

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None. The modal is fully wired to `submitFeedback`/`buildFeedbackPayload` with no placeholder branches; live network behavior (cold-start non-interruption) is deferred to Plan 04 per the plan's own scope, not stubbed here.

## Threat Flags

None — this plan implements exactly the UI surface registered in its own `<threat_model>` (T-05-02 generic error copy, T-05-04 no store writes, T-05-05 modal-local async never awaited by the Quiz screen, T-05-06 pageSheet dismiss + timer cleanup). No new network endpoint, auth path, or schema was introduced; the only external call (`submitFeedback`) was already built and threat-modeled in Plan 02.

## Self-Check: PASSED

- FOUND: src/feedback/ReportFeedbackModal.tsx
- FOUND: app/quiz.tsx (modified)
- FOUND commit: 98b93a1
- FOUND commit: 4da52e0
