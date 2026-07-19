---
phase: 11-lafa-design-tokens-brand-identity
plan: 03
subsystem: shared-ui-and-brand-copy
tags: [tokens, rebrand, offline-pill, feedback-modal]
dependency-graph:
  requires: [11-01]
  provides:
    - OfflinePill on Lafa primarySoft/primary/pill tokens
    - ReportFeedbackModal fully migrated off hardcoded hex to tokens
    - App name and share message read "Lafa"
  affects:
    - src/components/OfflinePill.tsx
    - src/feedback/ReportFeedbackModal.tsx
    - app.json
    - src/quiz/share.ts
tech-stack:
  added: []
  patterns:
    - "Neutral surfaces (reason options, text input) use colors.surface, not colors.primarySoft (D-03: primarySoft reserved for OfflinePill)"
key-files:
  created: []
  modified:
    - src/components/OfflinePill.tsx
    - src/feedback/ReportFeedbackModal.tsx
    - app.json
    - src/quiz/share.ts
    - __tests__/quiz-share.test.ts
decisions: []
metrics:
  duration: "~15m"
  completed: 2026-07-19
---

# Phase 11 Plan 03: Shared Components + Brand Copy Migration Summary

One-liner: Migrated OfflinePill and ReportFeedbackModal off the removed `colors.secondary`/hardcoded-hex styling onto the Lafa token set, and finished the brand-name rollout in `app.json` and the share message.

## What Was Built

- **OfflinePill** (`src/components/OfflinePill.tsx`): container background changed from
  `colors.secondary` (removed key) to `colors.primarySoft`, border radius from
  `radius.control` to `radius.pill`, text color from `colors.textSecondary` to
  `colors.primary`. Component logic, `OFFLINE_PILL_TEXT` copy, and the
  `resolveVerbs` polling effect were untouched.
- **ReportFeedbackModal** (`src/feedback/ReportFeedbackModal.tsx`): added the
  `colors, radius, spacing, typography` import from `../theme/tokens` and
  replaced every hardcoded hex/pixel value in the `StyleSheet.create` block,
  plus the two inline JSX props (`placeholderTextColor`, `ActivityIndicator`
  `color`). Neutral surfaces (reason-option default background, text-input
  background) map to `colors.surface`, not `colors.primarySoft`, per D-03.
  State machine (`ModalState`), `handleSubmit`, the reset-on-visible effect,
  and JSX structure are unchanged.
- **Brand-name copy**: `app.json` `expo.name` changed to `"Lafa"` (slug,
  scheme, splash config untouched per D-08); `src/quiz/share.ts`'s
  `buildShareMessage` template literal now ends `on Lafa!`; the three
  `toBe` assertions in `__tests__/quiz-share.test.ts` updated to match.

## Deviations from Plan

None — plan executed exactly as written.

## Verification

- `npx jest __tests__/offline-pill.test.ts` — PASS (2/2)
- `npx jest __tests__/feedback-submit.test.ts` — PASS (6/6)
- `npx jest __tests__/quiz-share.test.ts` — PASS (3/3)
- Zero `colors.accent`/`colors.secondary` references remain in this plan's
  files; zero hex literals remain in `ReportFeedbackModal.tsx`.
- `npx tsc --noEmit` still reports pre-existing `colors.accent`/`colors.secondary`
  errors in `app/index.tsx`, `app/quiz.tsx`, `app/results.tsx` — these files
  are owned by sibling plan 11-02 (parallel wave-2 plan, not in this plan's
  `files_modified` list) and are out of this plan's scope. The plan's own
  phase-level verification step ("no colors.accent/colors.secondary remain
  anywhere in app/ or src/") is expected to be satisfied once 11-02 lands;
  it cannot be satisfied by 11-03 alone since 11-03 does not touch `app/`.

## Self-Check: PASSED

- FOUND: src/components/OfflinePill.tsx (contains `primarySoft`)
- FOUND: src/feedback/ReportFeedbackModal.tsx (imports `../theme/tokens`)
- FOUND: app.json (`"name": "Lafa"`)
- FOUND: src/quiz/share.ts (`on Lafa!`)
- FOUND commit f93bea4 (Task 1)
- FOUND commit cc2962a (Task 2)
- FOUND commit a77b3de (Task 3)
