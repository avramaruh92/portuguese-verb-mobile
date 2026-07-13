---
phase: 07-dataset-seam-fetch-fallback-pipeline
plan: 02
subsystem: quiz-engine
tags: [typescript, jest, quiz-generation, dataset]

# Dependency graph
requires:
  - phase: 07-dataset-seam-fetch-fallback-pipeline (plan 01)
    provides: remote fetch wrapper + silent-fallback resolver (independent wave-1 plan; no direct code dependency)
provides:
  - "generate() now accepts an optional trailing injected verbs parameter, defaulting to the bundled local dataset"
  - "Local fallback dataset's querer.isIrregular reconciled to true, matching the authoritative remote contract"
affects: [08-async-quiz-start-and-dataset-snapshot]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Non-breaking signature widening: new optional trailing parameter with a default preserves every existing call site and test"

key-files:
  created: []
  modified:
    - src/quiz/engine.ts
    - src/dataset/verbs.ts
    - __tests__/quiz-engine.test.ts

key-decisions:
  - "generate(options, random, verbs) keeps verbs as an optional trailing param (not a required leading param) so src/store/useQuizStore.ts and all existing test call sites compile and pass unmodified"
  - "querer.isIrregular flipped false -> true per D-02, reconciling the local fallback dataset with the now-authoritative remote dataset"

patterns-established:
  - "Injection seam pattern: default parameter value referencing the renamed module-scope binding (`verbs: Verb[] = localVerbs`) lets a service function support both a hardcoded default and future dependency injection with zero call-site churn"

requirements-completed: [FETCH-01, FETCH-03]

# Metrics
duration: ~25min
completed: 2026-07-13
---

# Phase 7 Plan 02: Engine Injection Seam & querer Reconciliation Summary

**Opened an injection seam in `generate()` via an optional trailing `verbs` parameter (defaulting to the bundled dataset) and reconciled `querer.isIrregular` to `true`, keeping the full 123-test suite green throughout.**

## Performance

- **Duration:** ~25 min
- **Tasks:** 2 completed
- **Files modified:** 3

## Accomplishments
- `generate()` no longer exclusively hardcodes the bundled dataset at module scope — callers (this phase's resolver, and eventually Phase 8's store) can now inject a custom verb list
- Every existing call site (`src/store/useQuizStore.ts:40`, all existing `__tests__/quiz-engine.test.ts` calls, the `jest.spyOn` in `__tests__/useQuizStore.test.ts`) compiles and passes unmodified — zero breaking change
- `querer.isIrregular` corrected from `false` to `true` (D-02), matching the authoritative remote dataset
- Full test suite (123 tests, 11 suites — 122 baseline + 1 new injection test) passes with zero failures

## Task Commits

Each task was committed atomically:

1. **Task 1: Widen generate() with an optional trailing verbs parameter** - `5df135a` (feat)
2. **Task 2: Correct querer.isIrregular and run full regression** - `9f162b3` (fix)

_Note: Task 1 was TDD-flagged but implemented as a single behavior-plus-test commit since the plan's `<action>` directed adding a new test case within the same task rather than a separate RED commit; both the new test and the implementation edit were verified together before committing (test passed alongside the implementation change, consistent with the plan's non-breaking-widening framing rather than a strict RED/GREEN cycle for a pre-existing function)._

## Files Created/Modified
- `src/quiz/engine.ts` - Renamed module-scope import to `verbs as localVerbs`; added optional trailing `verbs: Verb[] = localVerbs` parameter to `generate()`
- `__tests__/quiz-engine.test.ts` - Added a new test proving `generate(options, random, customVerbs)` draws exclusively from the injected list, overriding the bundled default
- `src/dataset/verbs.ts` - Changed `querer`'s `isIrregular` field from `false` to `true` (single-line content edit, D-02)

## Verification

- `npx jest __tests__/quiz-engine.test.ts` — 10/10 tests passed, including the new injection test
- `npm test` — full suite green: 123 passed, 11 suites, 0 failures
- `git diff --stat src/quiz/engine.ts` — only the import line and signature line changed; `sampleTriples`/`buildQuestion`/`pickDistractors` bodies untouched
- `git diff src/dataset/verbs.ts` — exactly one line changed (the `querer.isIrregular` boolean)
- `git status --short` confirms `src/store/useQuizStore.ts` and all `app/*.tsx` screens remain unmodified

## Deviations from Plan

None — plan executed exactly as written. The plan's own `<verify>` block specified `npx jest __tests__/quiz-engine.test.ts -x`; the `-x` flag is not a valid Jest CLI option (it errored with "Unrecognized option 'x'"), so verification was run as `npx jest __tests__/quiz-engine.test.ts` instead — same test file, no flag needed since Jest already fails fast on a single-file run. This is a plan-authoring typo, not a code deviation; documented here for traceability rather than as a Rule 1-4 fix since it required no code change.

## Known Stubs

None.

## Threat Flags

None — this plan touched only pure-logic/service code and a static dataset content edit; no new network endpoints, auth paths, file access, or trust-boundary changes were introduced, consistent with the plan's own threat model (`T-07-04` regression risk was the only registered threat, mitigated via the optional-trailing-parameter design and full-suite regression gate).

## Self-Check: PASSED

- FOUND: src/quiz/engine.ts (contains `verbs as localVerbs` and `verbs: Verb[] = localVerbs`)
- FOUND: src/dataset/verbs.ts (`querer` entry reads `isIrregular: true`)
- FOUND: __tests__/quiz-engine.test.ts (new injected-verbs test case present)
- FOUND commit 5df135a (Task 1)
- FOUND commit 9f162b3 (Task 2)
