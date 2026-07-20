---
status: complete
phase: 13-verb-mode-selection
source: [13-VERIFICATION.md]
started: 2026-07-20T14:20:00Z
updated: 2026-07-21T00:00:00Z
---

## Current Test

[complete]

## Tests

### 1. Verb-mode chip row renders correctly
expected: Run `npm run ios` (or `npm start` and open in Expo Go). On the Setup screen, below the tense chips, a "Verb mode" label with three chips — "Regular only", "Mixed", "Irregular only" — appears where the old "Include irregular verbs" switch used to be. "Regular only" is highlighted by default. No switch control remains.
result: confirmed on-device (physical iPhone via custom dev-client build)

### 2. Single-select (radio) behavior
expected: Tap each of the three chips in sequence. Exactly one chip is highlighted at a time; tapping a new chip deselects the previously selected one.
result: confirmed on-device

### 3. End-to-end quiz start under Irregular-only
expected: Select some tenses + "Irregular only" verb mode, tap Start Quiz. The quiz starts normally, or (if the tense selection yields too small a pool) the insufficient-verbs error message displays — no crash in either case.
result: confirmed on-device

## Summary

total: 3
passed: 3
issues: 0
pending: 0
skipped: 0
blocked: 0

## Gaps

None.
