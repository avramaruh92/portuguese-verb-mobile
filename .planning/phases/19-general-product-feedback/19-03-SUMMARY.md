---
phase: 19-general-product-feedback
plan: 03
subsystem: productFeedback-entry-points
tags: [react-native, expo-router, product-feedback, footer-link]
dependency-graph:
  requires:
    - src/productFeedback/ProductFeedbackModal.tsx (Plan 02)
  provides:
    - "Help us improve" footer-link entry point on Setup screen (app/index.tsx)
    - "Help us improve" footer-link entry point on Results screen (app/results.tsx)
  affects:
    - Plan 04 (Quiz screen entry point, separate parallel worktree)
    - Plan 05 (on-device checkpoint verifying all 3 entry points)
tech-stack:
  added: []
  patterns:
    - "screen prop passed as a hardcoded literal (\"setup\"/\"results\"), not derived via usePathname() (D-08)"
    - "appVersion/platform computed locally per-screen, verbatim from app/quiz.tsx's existing derivation"
    - "footer-link visual treatment: Pressable/Text, no background/border/icon, typography.caption + colors.primary, minHeight 44, marginTop spacing.md"
key-files:
  created: []
  modified:
    - app/index.tsx
    - app/results.tsx
decisions: []
metrics:
  duration: ~10min
  completed: 2026-07-22
---

# Phase 19 Plan 03: Setup + Results Entry Points Summary

Wired the "Help us improve" footer-link entry point into the Setup (`app/index.tsx`) and Results (`app/results.tsx`) screens, each rendering `ProductFeedbackModal` with a hardcoded literal `screen` prop and locally-computed `appVersion`/`platform`.

## What Was Built

- `app/index.tsx`: added `expo-constants`/`Platform` imports and `ProductFeedbackModal` import, computed `appVersion`/`platform` (verbatim from `app/quiz.tsx`), added `productFeedbackVisible` state, and rendered a caption-weight "Help us improve" `Pressable`/`Text` footer link directly below the Start Quiz button, plus the modal itself with `screen="setup"`.
- `app/results.tsx`: same pattern, footer link placed below the `styles.actions` group (Share Score / Try Again / Back to Setup) on the primary completed-results branch (not the no-session fallback branch), modal rendered with `screen="results"`.
- Both screens use the identical `productFeedbackLink`/`productFeedbackLinkText` style shape (`minHeight: 44`, centered, `marginTop: spacing.md`; `typography.caption` + `colors.primary`), matching the UI-SPEC footer-link contract.
- Neither screen uses `usePathname()` — `screen` is a hardcoded literal per D-08.

## Deviations from Plan

None — plan executed exactly as written. (Note: worktree branch had to be fast-forward merged with `main` at execution start to pick up Wave 2's `ProductFeedbackModal` component before this plan could proceed — a pre-execution branch-sync step, not a plan deviation.)

## Verification

- `npm run typecheck`: clean, no errors.
- `npm test`: 21 suites, 251 tests, all passing (no regression).
- All acceptance-criteria greps passed on both files: `screen="setup"`/`screen="results"` present, "Help us improve" copy present, `Constants.expoConfig?.version` present, no `usePathname` usage, `typography.caption` present.

## Self-Check: PASSED

`app/index.tsx` and `app/results.tsx` modifications found on disk; commit hashes `57736cd` and `8e63908` found in git log.
