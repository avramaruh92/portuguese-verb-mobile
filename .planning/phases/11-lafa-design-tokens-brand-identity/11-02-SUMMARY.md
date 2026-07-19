---
phase: 11-lafa-design-tokens-brand-identity
plan: 02
subsystem: ui-screens
tags: [design-tokens, rebrand, expo-router]
dependency_graph:
  requires: [11-01]
  provides: [screens-on-lafa-tokens]
  affects: [app/index.tsx, app/quiz.tsx, app/results.tsx]
tech_stack:
  added: []
  patterns: ["token-key rename (colors.accent -> colors.primary, colors.secondary -> colors.surface)"]
key_files:
  created: []
  modified:
    - app/index.tsx
    - app/quiz.tsx
    - app/results.tsx
decisions: []
metrics:
  duration: "~15 minutes"
  completed: 2026-07-19
---

# Phase 11 Plan 2: Screen Token Migration + Lafa Rebrand Summary

Renamed `colors.accent`/`colors.secondary` to `colors.primary`/`colors.surface` across all three Expo Router screens and changed the Setup screen heading to "Lafa" — a mechanical token-key and one-string migration with zero structural or logic changes.

## What Was Built

- **Setup screen (`app/index.tsx`)**: heading changed from "Portuguese Verb Quiz" to "Lafa" (D-07/BRAND-01). `colors.accent` → `colors.primary` (chip selected state, start button); `colors.secondary` → `colors.surface` (chip default background).
- **Quiz screen (`app/quiz.tsx`)**: `colors.accent` → `colors.primary` (exit button text, progress fill, next button, report button text); `colors.secondary` → `colors.surface` (progress track, choice default/choice background). Answer-choice correct/wrong states already referenced `colors.success`/`colors.error` with `colors.background` text — left untouched per BRAND-03/D-10, confirming `choiceStyle()` selection logic is unmodified.
- **Results screen (`app/results.tsx`)**: `colors.accent` → `colors.primary` (share button, try again button, back button text); `colors.secondary` → `colors.surface` (back button background).

## Verification

- `grep -Eq 'colors\.(accent|secondary)' app/index.tsx app/quiz.tsx app/results.tsx` returns non-zero (no old keys remain in any of the three screens)
- `app/index.tsx` contains `>Lafa<` and no longer contains `Portuguese Verb Quiz`
- `npm test` — 151 tests passing across 15 suites (unchanged from before this plan; no test files touched)
- `npm run typecheck` — one remaining error in `src/components/OfflinePill.tsx` (`colors.secondary` does not exist), which is out of scope for this plan and owned by sibling plan 11-03 per the plan's own verification note ("Typecheck may still fail until 11-03 lands")

## Deviations from Plan

None — plan executed exactly as written. All three tasks were mechanical key renames plus one heading string change, matching the plan's rename map and acceptance criteria exactly.

## Known Stubs

None.

## Threat Flags

None — presentational token-key and copy edits only, no new trust boundaries introduced (matches the plan's threat model disposition of "accept").

## Self-Check: PASSED

- FOUND: app/index.tsx (contains `>Lafa<`, no `colors.accent`/`colors.secondary`)
- FOUND: app/quiz.tsx (no `colors.accent`/`colors.secondary`, `colors.success`/`colors.error` present)
- FOUND: app/results.tsx (no `colors.accent`/`colors.secondary`, `colors.primary` present)
- FOUND commit a396b50: feat(11-02): migrate Setup screen to Lafa tokens and heading
- FOUND commit 6672dea: feat(11-02): migrate Quiz screen to Lafa tokens
- FOUND commit 3331228: feat(11-02): migrate Results screen to Lafa tokens
