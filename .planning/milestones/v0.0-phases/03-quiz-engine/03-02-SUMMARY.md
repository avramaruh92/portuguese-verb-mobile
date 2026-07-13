---
phase: 03-quiz-engine
plan: 02
subsystem: quiz-engine
tags: [typescript, jest, tdd, fisher-yates, quiz-generation]

# Dependency graph
requires:
  - phase: 03-quiz-engine
    plan: 01
    provides: "Triple/Question/QuizSession/GenerateOptions type contracts, InsufficientVerbsError, injectable-RNG shuffle() in src/quiz/random.ts"
  - phase: 02-dataset-domain-vocabulary
    provides: "verbs: Verb[] (50 verbs, 12 irregular), Tense/Subject types, SUBJECTS constant"
provides:
  - "generate(options, random?) — pure quiz session generator, 10 unique (verb,tense,subject) questions per call"
  - "sampleTriples, buildQuestion, pickDistractors exported helpers for direct unit testing"
affects: [quiz-scoring, quiz-ui-phase4]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Mandatory random parameter threaded through every internal helper (sampleTriples, buildQuestion, pickDistractors); only generate() defaults to Math.random"
    - "Distractor selection: same-verb same-tense forms across other 5 subjects, deduped via Set, backfilled from other verbs' same tense+subject form when fewer than 3 unique candidates exist"

key-files:
  created:
    - src/quiz/engine.ts
    - __tests__/quiz-engine.test.ts
  modified: []

key-decisions:
  - "D-07 same-verb-repeat test uses a deterministic synthetic 10-triple pool + mockRandom instead of the real dataset + Math.random — the original RESEARCH.md-style probabilistic assertion over real Math.random occasionally failed (no repeat verb drawn in 10 random samples from a 228-triple pool), so it was rewritten to be provably deterministic (Rule 1 auto-fix: flaky test is a bug)."

patterns-established:
  - "pickDistractors(verb, tense, subject, allVerbs, random) takes the resolved Verb object (not a Triple), letting synthetic single-verb fixtures exercise distractor dedupe/backfill logic in isolation"

requirements-completed: [QUIZ-04]

# Metrics
duration: 25min
completed: 2026-07-12
---

# Phase 3 Plan 2: Quiz Session Generation Engine Summary

**Implemented `generate()` and its pure helpers (`sampleTriples`, `buildQuestion`, `pickDistractors`) that filter the dataset by tense/irregular toggle, sample 10 unique triples, and build fully-shuffled 4-choice questions — all deterministic under an injected RNG, proven by a 9-test TDD suite.**

## Performance

- **Duration:** ~25 min
- **Started:** 2026-07-12T17:25:00Z (approx)
- **Completed:** 2026-07-12T17:50:00Z
- **Tasks:** 1 TDD feature (RED then GREEN)
- **Files modified:** 2 (both new)

## Accomplishments
- `generate(options, random = Math.random)` filters `verbs` by `includeIrregular`, builds the flat `Triple` pool via `flatMap` over eligible verbs × tenses × `SUBJECTS`, and returns a 10-question `QuizSession`.
- `sampleTriples(pool, count, random)` throws `InsufficientVerbsError(pool.length, count)` when the pool is short of `count`, otherwise returns `shuffle(pool, random).slice(0, count)`.
- `buildQuestion(triple, allVerbs, random)` looks up the verb, computes `correctAnswer`, calls `pickDistractors`, and shuffles `[correctAnswer, ...distractors]` into `choices` so the correct-answer position is randomized.
- `pickDistractors(verb, tense, subject, allVerbs, random)` dedupes same-verb same-tense forms across the other 5 subjects via `Set`, shuffles and takes up to 3, then backfills from other verbs' same tense+subject forms (excluding already-chosen/correct values) until exactly 3 distinct distractors are returned.
- 9-test suite in `__tests__/quiz-engine.test.ts` covers filter (both toggle states), duplicate-triple uniqueness, same-verb repeat (D-07), `InsufficientVerbsError` (both throw and boundary non-throw cases), distractor correctness, distractor dedupe/backfill via a synthetic colliding-verb fixture, and shuffle determinism/position-randomization.

## Task Commits

TDD cycle for the single feature:

1. **RED — failing test suite** - `6edfc0d` (test): `__tests__/quiz-engine.test.ts` written first, confirmed failing with "Cannot find module '../src/quiz/engine'" before any implementation existed.
2. **GREEN — engine implementation** - `70ab268` (feat): `src/quiz/engine.ts` implemented; all 9 tests pass. Also includes the D-07 test-flakiness fix (see Deviations).

**Plan metadata:** commit pending (docs: complete plan)

_No refactor commit was needed — implementation matched the plan's structure directly._

## Files Created/Modified
- `src/quiz/engine.ts` - `generate`, `sampleTriples`, `buildQuestion`, `pickDistractors` (all exported)
- `__tests__/quiz-engine.test.ts` - 9 deterministic tests covering all `<behavior>` items in the plan

## TDD Gate Compliance

- RED gate: `6edfc0d` (test commit, verified failing — module-not-found error before `src/quiz/engine.ts` existed)
- GREEN gate: `70ab268` (feat commit, 9/9 tests + typecheck passed after)
- REFACTOR gate: not needed, no refactor commit

## Verification

- `npx jest __tests__/quiz-engine.test.ts` — 9/9 passed, run 5x consecutively with no flakes
- `npm run typecheck` — exits 0
- `npx jest` (full suite) — 20/20 passed across 5 suites, run 5x consecutively with no flakes, no regressions
- `grep -c 'export function sampleTriples' src/quiz/engine.ts` — 1
- `grep -c 'Math.random()' src/quiz/engine.ts` — 0 (only the `= Math.random` default parameter on `generate` exists; no direct calls anywhere)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] D-07 same-verb-repeat test was probabilistically flaky**
- **Found during:** Initial full-suite verification run (`npx jest`) after GREEN
- **Issue:** The first draft of the "same-verb repeat" test called `generate({ tenses: ["future"], includeIrregular: false }, Math.random)` against the real 228-triple dataset pool and asserted a repeated verb appeared among the 10 sampled questions. Because it used real, unseeded `Math.random`, this occasionally failed when 10 random draws from 38 eligible verbs × 6 subjects happened to land on 10 distinct verbs.
- **Fix:** Rewrote the test to call `sampleTriples` directly against a small, hand-constructed 10-triple synthetic pool (5 verbs × 2 subjects each) with a scripted `mockRandom` sequence. Since `pool.length === count`, `sampleTriples` returns every entry (shuffled), deterministically guaranteeing a same-verb repeat is present and provable without relying on chance.
- **Files modified:** `__tests__/quiz-engine.test.ts`
- **Commit:** `70ab268` (folded into the GREEN commit, discovered and fixed before that commit was made)

## Known Stubs

None — `generate()` is fully wired against the real Phase 2 dataset (`src/dataset/verbs.ts`); no placeholder/mock data ships in `src/quiz/engine.ts`.

## Threat Flags

None — no new trust boundary, network, or persistence surface introduced. `T-03-02` (DoS via `sampleTriples` under a narrow filter) from the plan's threat model is mitigated as specified: `InsufficientVerbsError` is thrown instead of looping, covered by a dedicated test.

## Self-Check: PASSED

All created files and commit hashes verified present:
- FOUND: src/quiz/engine.ts
- FOUND: __tests__/quiz-engine.test.ts
- FOUND: 6edfc0d, 70ab268
