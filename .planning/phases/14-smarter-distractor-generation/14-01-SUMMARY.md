---
phase: 14-smarter-distractor-generation
plan: 01
subsystem: quiz
tags: [quiz-engine, distractor-generation, jest, typescript]

# Dependency graph
requires: []
provides:
  - 3-tier pickDistractors strategy in src/quiz/engine.ts (same-verb wrong-subject → same-verb wrong-tense pair-prioritized → cross-verb same-conjugation-class-preferred)
  - TENSE_PAIRS constant mapping preterite<->imperfect for pedagogically meaningful tier-2 ordering
  - Re-verified 4-unique/1-correct invariant and tier-1 priority across all tenses and mode-shaped pools
affects: [quiz, distractor-generation, quiz-engine-tests]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Multi-tier fill-then-fallback candidate selection: guard on chosen.length < DISTRACTOR_COUNT, build an exclude Set seeded with correctAnswer + already-chosen forms, iterate an ordered candidate list with break/continue/push/add"
    - "Conjugation class derived at selection time via verb.verb.slice(-2), no schema change"

key-files:
  created: []
  modified:
    - src/quiz/engine.ts
    - __tests__/quiz-engine.test.ts

key-decisions:
  - "Tier 2 (same-verb wrong-tense) inserted between tier 1 and tier 3, reusing the exact fill idiom (exclude Set + break/continue/push/add loop) already used by tier 3, per plan instruction to mirror the existing pattern"
  - "TENSE_PAIRS is a Partial<Record<Tense, Tense>> with only preterite/imperfect entries — present_indicative/future intentionally have no pair, branched via `if (pairedTense)` rather than a non-null assertion"
  - "Conjugation class computed inline via verb.verb.slice(-2) at call time in pickDistractors — no new Verb field, no dataset change"
  - "Tasks committed by reverting the tier-3 block after initial combined authoring so each commit's diff matched its task's actual scope (tier-2-only in Task 1, tier-3-only in Task 2)"

patterns-established:
  - "3-tier distractor fill: tier 1 same-verb/other-subject, tier 2 same-verb/other-tense (pair-prioritized for preterite/imperfect), tier 3 cross-verb (same-class preferred, then any verb) — each tier shares the same exclude/dedupe/fill loop shape"

requirements-completed: [DIST-01, DIST-02, DIST-03, DIST-04, TEST-04]

# Metrics
duration: 25min
completed: 2026-07-20
---

# Phase 14 Plan 01: Smarter Distractor Generation Summary

**3-tier pickDistractors strategy (same-verb wrong-subject → same-verb wrong-tense with preterite/imperfect pair prioritization → cross-verb same-conjugation-class preference) replacing the prior 2-tier same-verb/cross-verb fallback in src/quiz/engine.ts.**

## Performance

- **Duration:** ~25 min
- **Started:** 2026-07-20T17:19:00Z (approx, prior to first file read)
- **Completed:** 2026-07-20T17:43:38Z
- **Tasks:** 3 completed
- **Files modified:** 2 (`src/quiz/engine.ts`, `__tests__/quiz-engine.test.ts`)

## Accomplishments
- Added tier-2 same-verb wrong-tense distractor candidates with preterite/imperfect pair prioritization (DIST-02), landing between the unchanged tier-1 block and the (now two-pass) tier-3 fallback
- Extended tier-3 cross-verb fallback to prefer same-conjugation-class verbs (matching infinitive `slice(-2)`) before any other verb (DIST-03), with no dataset/schema change
- Re-verified the 4-unique/1-correct invariant across all four tenses and mode-shaped pools (`regular_only`/`irregular_only`/`mixed`), and confirmed tier-1 still wins when 3+ unique same-verb wrong-subject forms exist (DIST-01/DIST-04)
- `pickDistractors` and `buildQuestion` signatures are byte-for-byte unchanged; no caller (`app/quiz.tsx`, `src/store/useQuizStore.ts`) touched

## Task Commits

Each task was committed atomically:

1. **Task 1: Insert tier-2 same-verb wrong-tense distractors with preterite/imperfect pair prioritization** - `221588b` (feat)
2. **Task 2: Extend tier-3 cross-verb fallback with same-conjugation-class preference** - `80faf19` (feat)
3. **Task 3: Re-verify 4-unique/1-correct invariant across all tiers, tenses, and modes; confirm tier-1 priority** - `960e669` (test)

**Plan metadata:** (this commit, added after SUMMARY.md)

## Files Created/Modified
- `src/quiz/engine.ts` - Added `TENSES` import, `TENSE_PAIRS` constant, tier-2 same-verb-wrong-tense block, and a two-pass (same-class-then-other-class) tier-3 cross-verb fallback
- `__tests__/quiz-engine.test.ts` - Added tier-2 tests (pair prioritization for preterite/imperfect, no-pair-ordering for present_indicative, correct-answer/tier-1 dedupe), tier-3 tests (same-class-before-other-class ordering, `pôr` unmatched-class edge case, small mode-shaped-pool invariant), and re-verification tests (tier-1 priority, all-four-tenses invariant, mode-shaped-pool invariant)

## Decisions Made
- Reused the exact fill-loop idiom (`exclude` Set + `break`/`continue`/`push`/`add`) for both new tiers, matching the plan's explicit instruction to mirror tier-1/tier-3's existing shape rather than introduce a new pattern
- Branched on `TENSE_PAIRS[tense]` being possibly `undefined` with an `if (pairedTense)` check instead of a non-null assertion, since present_indicative/future legitimately have no pair (keeps `noUncheckedIndexedAccess` clean without suppressing the check)
- Computed conjugation class inline (`verb.verb.slice(-2)`) at selection time only — no `Verb` schema/dataset change, per D-04

## Deviations from Plan

None - plan executed exactly as written. (One process note: implementation for tier-2 and tier-3 was drafted together during initial authoring, then the tier-3 block was temporarily reverted before the Task 1 commit and re-applied for the Task 2 commit, so each commit's diff matches its task's stated scope exactly — no functional deviation from the plan.)

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- `pickDistractors`' 3-tier strategy is complete and fully covered by unit tests (tier-1 priority, tier-2 pair prioritization/dedupe, tier-3 class-preference/edge cases, and cross-tense/cross-mode invariants)
- Full `npm test` suite green (168 tests, 15 suites); `npm run typecheck` clean
- No blockers for subsequent phases; `buildQuestion`/`pickDistractors` signatures remain stable for any future caller

---
*Phase: 14-smarter-distractor-generation*
*Completed: 2026-07-20*

## Self-Check: PASSED
