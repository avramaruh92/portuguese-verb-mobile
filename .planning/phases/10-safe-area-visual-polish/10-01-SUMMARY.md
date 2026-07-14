---
phase: 10-safe-area-visual-polish
plan: 01
subsystem: theme-foundation
tags: [design-tokens, safe-area, root-layout, expo-router]
dependency-graph:
  requires: []
  provides:
    - "src/theme/tokens.ts (colors, spacing, radius, typography flat exports)"
    - "SafeAreaProvider mounted at app root"
    - "app-wide native header (headerShown: true default)"
  affects:
    - "app/index.tsx, app/quiz.tsx, app/results.tsx (Wave 2 will import tokens + call useSafeAreaInsets)"
tech-stack:
  added: []
  patterns:
    - "Flat named-const-export module shape (mirrors src/quiz/labels.ts), no default export"
    - "Single root-level SafeAreaProvider mount point, no per-screen providers"
key-files:
  created:
    - src/theme/tokens.ts
    - src/theme/tokens.test.ts
  modified:
    - app/_layout.tsx
decisions: []
metrics:
  duration: ~15 min
  completed: 2026-07-14
---

# Phase 10 Plan 01: Design Tokens + Root Layout Safe-Area Wiring Summary

Extracted the app's existing color/spacing/typography literals into a single
`src/theme/tokens.ts` module and wired `SafeAreaProvider` + an app-wide native
header into `app/_layout.tsx` — the two foundations every Wave 2 screen plan
depends on, with zero user-visible change.

## What Was Built

### Task 1: Shared design-tokens module + verbatim-value guard test

Created `src/theme/tokens.ts` mirroring the flat named-const-export shape of
`src/quiz/labels.ts` (no default export). Exports:

- `colors` — background, secondary, accent, error, success, text, textSecondary
- `spacing` — sm=8, md=16, lg=24, xl2=48, xl3=64, choiceGap=12 (12px kept as a
  documented exception per D-03, not snapped to the 8-point scale)
- `radius` — control=12 (kept as a separate named token from `choiceGap` even
  though the value coincides — radius and spacing mean different things)
- `typography` — caption/body/bodyStrong/heading/display, each with `fontSize`
  and `fontWeight` (`as const` literals so they're assignable to RN's
  `TextStyle.fontWeight`), `display` additionally carries `lineHeight: 62`

Every value was verified against the literals actually present in
`app/index.tsx`, `app/quiz.tsx`, and `app/results.tsx` before centralizing —
no new values were introduced (D-03 lock). `src/theme/tokens.test.ts` asserts
each value with `toEqual`, guarding against accidental drift in future edits.

### Task 2: SafeAreaProvider + app-wide native header in root layout

Modified `app/_layout.tsx`:
- Imported `SafeAreaProvider` from `react-native-safe-area-context` (already a
  resolved dependency at `~5.7.0` — no package install needed)
- Wrapped the returned `<Stack>` in `<SafeAreaProvider>` as the single, only
  mount point
- Changed `screenOptions` from `{ headerShown: false }` to
  `{ headerShown: true }` so all 3 screens get a native header (top safe-area
  chrome) by default
- Left the existing `prefetch()` `useEffect` byte-for-byte unchanged

## Verification

- `npm test -- src/theme/tokens.test.ts` — 8/8 assertions pass
- `npm test` (full suite) — 148/148 tests pass across 14 suites, zero
  regressions
- `npm run typecheck` — exits 0
- `grep -c 'export const' src/theme/tokens.ts` — 4
- `grep -c 'SafeAreaProvider' app/_layout.tsx` — 3 (import + opening/closing JSX)
- `grep -c 'headerShown: true' app/_layout.tsx` — 1; `headerShown: false` — 0
- `grep -c 'prefetch' app/_layout.tsx` — 2 (import + useEffect call)

## Deviations from Plan

None - plan executed exactly as written.

## Known Stubs

None.

## Threat Flags

None — pure UI/wiring pass, no new network/auth/storage/schema surface
introduced, consistent with the plan's threat model (all dispositions
`accept`, no `mitigate` actions required beyond "no package installs," which
held).

## Self-Check: PASSED

- FOUND: src/theme/tokens.ts
- FOUND: src/theme/tokens.test.ts
- FOUND: app/_layout.tsx (modified, SafeAreaProvider present)
- FOUND commit 3e0d466 (Task 1)
- FOUND commit cbd0f7b (Task 2)
