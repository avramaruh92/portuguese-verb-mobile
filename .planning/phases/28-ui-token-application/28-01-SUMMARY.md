---
phase: 28-ui-token-application
plan: 01
subsystem: theme-tokens
tags: [tokens, offline-pill, ui-02]
dependency-graph:
  requires: []
  provides:
    - "colors.infoSoft token"
    - "OfflinePill teal info palette styling"
  affects:
    - src/theme/tokens.ts
    - src/components/OfflinePill.tsx
tech-stack:
  added: []
  patterns:
    - "TDD RED/GREEN cycle for token addition (test(28-01) then feat(28-01))"
key-files:
  created: []
  modified:
    - src/theme/tokens.ts
    - src/theme/tokens.test.ts
    - src/components/OfflinePill.tsx
decisions:
  - "infoSoft placed immediately after info in both tokens.ts and the exhaustive toEqual() test, mirroring the existing primary/primarySoft adjacency convention"
metrics:
  duration: "~15 minutes"
  completed: 2026-08-14
---

# Phase 28 Plan 1: Add infoSoft token and restyle OfflinePill Summary

One-liner: Added `colors.infoSoft` (#DCEBF0) paired with the existing `info`
token, then switched `OfflinePill`'s background/text from the orange
`primarySoft`/`primary` pairing to the teal `infoSoft`/`info` pairing.

## What Was Built

- **Task 1 (TDD):** Added `colors.infoSoft: "#DCEBF0"` to `src/theme/tokens.ts`,
  positioned directly after `info` and before `success`. Updated the
  exhaustive `colors export the exact Lafa palette` test in
  `src/theme/tokens.test.ts` to include the new key in the same position.
  Followed RED → GREEN: wrote the failing test assertion first (`020e0ff`),
  confirmed it failed against the un-updated `colors` object, then added the
  token (`f66b38e`) and confirmed all 9 existing test blocks pass unchanged
  in structure.
- **Task 2:** In `src/components/OfflinePill.tsx`'s `StyleSheet.create`
  block, changed `styles.container.backgroundColor` from `colors.primarySoft`
  to `colors.infoSoft`, and `styles.text.color` from `colors.primary` to
  `colors.info`. No other styling (`alignSelf`, `radius.pill`,
  `spacing.sm`/`spacing.md`, `typography.caption` spread) or copy
  (`OFFLINE_PILL_TEXT`) changed.

## Verification

- `npx jest src/theme/tokens.test.ts __tests__/offline-pill.test.ts` — 11/11
  pass
- `npm run typecheck` — exits 0
- `npm run lint` — no new errors (`expo lint` clean)
- `npm test` (full suite) — 251/251 tests pass across 21 suites, unchanged
  count from pre-plan baseline (no new `it()` blocks added, only an
  assertion-line update inside existing blocks)
- `grep -rEn "#[0-9A-Fa-f]{6}" src/components/ app/` — zero matches (no
  literal hex leaked outside `src/theme/`)
- All plan acceptance-criteria greps (line-adjacency, key presence, `it()`
  count, `colors.primarySoft`/`colors.primary` absence in `OfflinePill.tsx`)
  independently re-confirmed after edits

## Deviations from Plan

None - plan executed exactly as written.

## Commits

- `020e0ff` test(28-01): add failing assertion for colors.infoSoft token
- `f66b38e` feat(28-01): add infoSoft color token
- `3c9698c` feat(28-01): switch OfflinePill to teal infoSoft/info token pairing

## TDD Gate Compliance

Task 1 (`tdd="true"`) followed the mandatory RED → GREEN gate sequence:
- RED: `020e0ff` (test commit) — confirmed the new assertion failed before
  any implementation change
- GREEN: `f66b38e` (feat commit) — confirmed all 9 tests pass after adding
  the token
- No REFACTOR commit needed (no cleanup required)

## Known Stubs

None.

## Threat Flags

None — styling-only change per the plan's threat model; no new network,
auth, storage, or dependency surface introduced.
