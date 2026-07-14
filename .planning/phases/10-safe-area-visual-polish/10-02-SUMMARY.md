---
phase: 10-safe-area-visual-polish
plan: 02
subsystem: setup-results-screens
tags: [design-tokens, safe-area, expo-router, activity-indicator]
dependency-graph:
  requires:
    - "src/theme/tokens.ts (colors, spacing, radius, typography flat exports) — 10-01"
    - "SafeAreaProvider mounted at app root — 10-01"
  provides:
    - "Tokenized, safe-area-correct Setup screen (app/index.tsx)"
    - "Tokenized, safe-area-correct Results screen (app/results.tsx)"
  affects:
    - "app/quiz.tsx (Wave 2 sibling plan 10-03 applies the same treatment)"
tech-stack:
  added: []
  patterns:
    - "Titleless native Stack.Screen header (headerShown: true, headerTitle: \"\"), chrome-only, no headerLeft"
    - "useSafeAreaInsets() bottom padding merged onto outermost container View"
    - "ActivityIndicator alongside 'Starting…' text inside loading buttons, minHeight: 44 preserved via flexDirection: row + gap"
key-files:
  created: []
  modified:
    - app/index.tsx
    - app/results.tsx
decisions:
  - "Results' legacy paddingTop: 64 (spacing.xl3) reduced to spacing.lg (24) now that the native header supplies the top inset — avoids doubled top whitespace. Flagged here for the Wave-3 human-verify pass to confirm visually."
metrics:
  duration: ~20 min
  completed: 2026-07-14
---

# Phase 10 Plan 02: Setup + Results Screen Polish Summary

Applied the Wave-1 foundations (shared tokens, root SafeAreaProvider) to the
Setup (`app/index.tsx`) and Results (`app/results.tsx`) screens: titleless
native headers, bottom safe-area inset padding, a native `ActivityIndicator`
augmenting the existing "Starting…" loading text, and token-based restyling
of the shared error-text blocks. Both screens share verbatim
`starting`/`unexpectedError` state and error-text structure, so both were
executed in this one plan to keep their treatments from drifting.

## What Was Built

### Task 1: Polish Setup screen (app/index.tsx)

- Added `<Stack.Screen options={{ headerShown: true, headerTitle: "" }} />` as
  the first child, chrome-only (no `headerLeft`/`headerRight`), matching
  `app/quiz.tsx`'s canonical shape minus the Exit control.
- Added `useSafeAreaInsets()` and applied `insets.bottom` as additional
  `paddingBottom` on the outermost `container` View so the Start button
  clears the home indicator.
- Augmented the Start button's loading state: when `starting` is true, an
  `<ActivityIndicator size="small" color={colors.background} />` now renders
  alongside the "Starting…" text (white glyph on the blue accent button).
  `startButton` gained `flexDirection: "row"` and `gap: spacing.sm` so the
  spinner and text sit side by side without changing `minHeight: 44`.
- Replaced every hex/number literal in `StyleSheet.create` with the matching
  token from `src/theme/tokens.ts` (`colors`, `spacing`, `radius`,
  `typography`) — zero visible change, pure extraction.
- Wrapped both error `Text` blocks (`status === "error"` and
  `unexpectedError`) in a `styles.errorBlock` container View using
  `typography.caption` + `colors.error`, preserving the exact conditional
  rendering and copy.

### Task 2: Polish Results screen (app/results.tsx)

- Added the same titleless `Stack.Screen` header to **both** render paths —
  the no-session fallback branch and the main score-display branch — since
  Results has an early `return` for the `!session` case. Both branches keep
  Results' existing "Back to Setup" in-body button as the sole back
  affordance (no header back button, matching UI-SPEC's "redundant" call-out).
- Added `useSafeAreaInsets()` and applied `insets.bottom` to the container in
  both branches.
- **Reduced the legacy `paddingTop: 64` (`spacing.xl3`) to `spacing.lg` (24)**
  now that the native header supplies its own top inset — avoids doubled top
  whitespace. This is a visual change from the pre-header layout and is
  flagged here explicitly for the Wave-3 human-verify pass to confirm it
  looks correct on device/simulator.
- Added the identical `ActivityIndicator` treatment to the Try Again button
  (same `flexDirection: row` + `gap: spacing.sm` approach as Setup's Start
  button, per UI-SPEC's "same loading treatment" requirement).
- Replaced every hex/number literal with token references, including
  `typography.display` for the score number and `colors.textSecondary` for
  the score caption.
- Restyled both error `Text` blocks in the no-session fallback branch with
  the same `errorBlock` + `errorText` token treatment as Setup, keeping the
  two screens' error presentation identical.

## Verification

- `npm run typecheck` — exits 0
- `npm test` (full suite) — 148/148 tests pass across 14 suites, zero
  regressions
- `grep -Ec` for all locked hex literals (`#007AFF|#F2F2F7|#FF3B30|#34C759|#8E8E93|#FFFFFF|#000000`)
  returns 0 in both `app/index.tsx` and `app/results.tsx`
- `useSafeAreaInsets` present (import + call) in both files
- `ActivityIndicator` present (import + JSX) in both files, `minHeight: 44`
  preserved on `startButton`/`tryAgainButton`
- `"Starting…"` copy unchanged (1 occurrence each)
- `spacing.xl3` no longer present in `app/results.tsx` (legacy 64px offset
  reduced)

## Deviations from Plan

### Auto-fixed / Documented Adjustments

**1. [Rule 4-adjacent, documented not auto-fixed] `headerTitle: ""` appears twice in `app/results.tsx`, not once**
- **Found during:** Task 2
- **Issue:** The plan's acceptance criteria expected `grep -c 'headerTitle: ""' app/results.tsx` to return 1. Because Results has two separate JSX return statements (the `!session` fallback branch and the main score-display branch), and the task instructions explicitly required keeping "both render branches unchanged — styling + chrome only," a single shared `Stack.Screen` would have required restructuring the early-return control flow into a single-return/conditional-body shape. That refactor was attempted and then reverted: it changed the shape of existing logic (converting the early return + top-level function declarations into an IIFE-based conditional), which risked violating the plan's stricter "keep logic unchanged" directive.
- **Resolution:** Kept the plan's original early-return structure and duplicated the identical `<Stack.Screen options={{ headerShown: true, headerTitle: "" }} />` line into both branches. Functionally equivalent (only one branch ever renders), and the automated verification step only checks `grep -q` (existence), which passes. The literal-count acceptance criterion is a soft heuristic, not a gating check.
- **Files modified:** `app/results.tsx`
- **Commit:** ddcaf91

## Known Stubs

None.

## Threat Flags

None — pure UI/chrome/styling pass, no new network/auth/storage/schema surface introduced, consistent with the plan's threat model (all dispositions `accept`).

## Self-Check: PASSED

- FOUND: app/index.tsx (modified — header, tokens, inset, ActivityIndicator present)
- FOUND: app/results.tsx (modified — header, tokens, inset, ActivityIndicator present)
- FOUND commit d3fda08 (Task 1: Setup screen)
- FOUND commit ddcaf91 (Task 2: Results screen)
