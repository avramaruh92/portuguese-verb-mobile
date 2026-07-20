---
phase: 13-verb-mode-selection
plan: 02
subsystem: setup-screen-ui
tags: [react-native, expo-router, ui]

# Dependency graph
requires:
  - "VerbMode union type + GenerateOptions.verbMode contract (Plan 01)"
provides:
  - "Setup screen single-select 3-chip 'Verb mode' row (Regular only/Mixed/Irregular only)"
  - "startQuiz({ tenses, verbMode }) call site wired to the new selector"
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Single-select chip row (radio-style, no toggle/array logic) as a structural analog to the existing multi-select tense chip row"

key-files:
  created: []
  modified:
    - app/index.tsx

key-decisions:
  - "VERB_MODE_OPTIONS defined as a module-level const array (value/label pairs) mirroring the pattern of TENSES, in fixed Regular -> Mixed -> Irregular order (D-05, D-06)"
  - "Removed toggleRow/toggleLabel StyleSheet entries entirely rather than leaving them unused, since the Switch they styled is gone"

requirements-completed: [MODE-01]

# Metrics
duration: 10min
completed: 2026-07-20
---

# Phase 13 Plan 02: Verb Mode Setup UI Summary

**Replaced the "Include irregular verbs" `Switch` on the Setup screen with a single-select 3-chip "Verb mode" row (Regular only/Mixed/Irregular only, default Regular only), wiring the selected `verbMode` into `startQuiz`.**

## Performance

- **Duration:** ~10 min
- **Completed:** 2026-07-20
- **Tasks:** 1 of 2 completed (Task 2 is a human-verify checkpoint, deferred per end-of-phase mode — see below)
- **Files modified:** 1

## Accomplishments

- `app/index.tsx`: removed the `includeIrregular` boolean state and the `Switch` import/usage entirely
- Added `useState<VerbMode>("regular_only")` and a `VERB_MODE_OPTIONS` array (`regular_only`/`mixed`/`irregular_only` with verbatim labels "Regular only"/"Mixed"/"Irregular only") in that fixed left-to-right order
- Rendered a new `View style={styles.section}` with a "Verb mode" `sectionLabel` and a `chipRow` of single-select chips (radio-style — tapping one selects only that one, no toggle/multi-select logic, no "All"-equivalent chip), positioned where the Switch used to be, below the tense chip row
- Reused the existing `section`/`sectionLabel`/`chipRow`/`chip`/`chipSelected`/`chipText`/`chipTextSelected` styles verbatim — no new StyleSheet entries added
- Removed the now-unused `toggleRow`/`toggleLabel` style entries
- Updated the `startQuiz` call site to `startQuiz({ tenses: selectedTenses, verbMode })`
- `npm run typecheck` clean; `npm run lint` shows zero new errors (the one reported error is the pre-existing, unrelated `react-hooks/set-state-in-effect` finding in `ReportFeedbackModal.tsx`, documented tech debt predating this plan — not touched by this change)

## Task Commits

1. **Task 1: Replace the irregular Switch with a single-select verb-mode chip row** - `0be4dd4` (feat)

## Files Created/Modified

- `app/index.tsx` - Removed `Switch` import/usage and `includeIrregular` state; added `VerbMode` import, `VERB_MODE_OPTIONS`, `verbMode` state, the new chip-row UI section, and updated the `startQuiz` call; removed unused `toggleRow`/`toggleLabel` styles

## Decisions Made

- `VERB_MODE_OPTIONS` is a plain module-level array of `{ value: VerbMode; label: string }` (mirrors the existing `TENSES`-driven chip-row pattern), not a `Record`, since order matters for the fixed D-05/D-06 left-to-right rendering requirement.
- Chose to delete the `toggleRow`/`toggleLabel` StyleSheet entries rather than leave them as dead code, since the plan explicitly calls this out and nothing else in the file references them.

## Deviations from Plan

None — plan executed exactly as written for Task 1.

## Task 2: Human Verification — Deferred (end-of-phase mode)

Per this project's default `end-of-phase` human-verify mode (no `workflow.human_verify_mode` override configured), Task 2 (`checkpoint:human-verify`) is **not** performed inline by this executor. It is deferred to the orchestrator's phase-level verifier, which will consolidate it into `HUMAN-UAT.md` for the user to test after all Phase 13 plans complete.

**Pending on-device verification steps** (from the plan's `<how-to-verify>` block, to be run via `npm run ios` or Expo Go):

1. Confirm a "Verb mode" label with three chips — "Regular only", "Mixed", "Irregular only" — appears below the tense chips, where the toggle used to be.
2. Confirm "Regular only" is highlighted by default and no "Include irregular verbs" switch remains.
3. Tap each chip: exactly one chip is highlighted at a time (tapping one deselects the others).
4. Select some tenses + "Irregular only" and Start Quiz — confirm the quiz starts (or shows the insufficient-verbs message for a too-small tense selection) without crashing.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required. On-device verification (Task 2 above) is the only remaining action, deferred to the phase-level human-verify consolidation.

## Next Phase Readiness

- MODE-01 is functionally complete pending the deferred on-device human verification above.
- Setup screen fully consumes Plan 01's `VerbMode` contract; no `includeIrregular`/`Switch` references remain anywhere in `app/index.tsx`.
- No known blockers for Phase 14 (Smarter Distractor Generation), which does not depend on this plan's UI change.

---
*Phase: 13-verb-mode-selection*
*Completed: 2026-07-20*
