---
phase: 03-quiz-engine
reviewed: 2026-07-12T17:48:24Z
depth: standard
files_reviewed: 7
files_reviewed_list:
  - src/quiz/types.ts
  - src/quiz/random.ts
  - src/quiz/engine.ts
  - src/quiz/scoring.ts
  - __tests__/quiz-random.test.ts
  - __tests__/quiz-engine.test.ts
  - __tests__/quiz-scoring.test.ts
findings:
  critical: 0
  warning: 2
  info: 2
  total: 4
status: issues_found
---

# Phase 3: Code Review Report

**Reviewed:** 2026-07-12T17:48:24Z
**Depth:** standard
**Files Reviewed:** 7
**Status:** issues_found

## Summary

Reviewed the quiz-engine subsystem (type contracts, injectable-RNG shuffle, session
generation, and scoring) plus their three test suites. The implementation matches the
plans closely: pure functions, mandatory `random` threading (only `generate()` defaults to
`Math.random`), `noUncheckedIndexedAccess`-safe indexing, and no direct `Math.random()`
calls outside the one permitted default parameter. `npm run typecheck` passes and
`npx jest __tests__/quiz-engine.test.ts` was re-run 5x with no flakes. I independently
verified the Fisher-Yates determinism test by hand-tracing the algorithm against the
asserted output, and wrote a throwaway exhaustive probe (removed before finishing this
review) iterating `pickDistractors` over every verb/tense/subject combination in the real
50-verb dataset to confirm it never returns fewer than 3 distractors in practice.

No critical (security/correctness-breaking-in-practice) issues found. Two warnings concern
latent robustness gaps that are not exercised by the current 50-verb dataset but would
silently violate the "exactly 4 choices" and "typed-error" contracts if the dataset changes
shape later (e.g., a future verb added with unusually collision-prone conjugations, or the
eligible pool shrinks). Two info-level code-quality nits round out the findings.

## Warnings

### WR-01: `pickDistractors` can silently return fewer than 3 distractors, breaking the "4 choices" invariant

**File:** `src/quiz/engine.ts:52-84`
**Issue:** `pickDistractors` backfills from `otherVerbForms` only up to whatever distinct,
non-excluded forms exist across the rest of the dataset. If both the same-verb same-tense
pool (5 candidates) and the cross-verb backfill pool are exhausted by collisions/dedup
before reaching `DISTRACTOR_COUNT` (3), the function returns an array shorter than 3 with
no error, warning, or assertion. `buildQuestion` then produces a `Question.choices` array
with fewer than 4 entries, silently violating the plan's `must_haves` truth ("Every question
has exactly 4 choices"). I confirmed via an exhaustive sweep of the real 50-verb dataset
(all verb × tense × subject combinations) that this does not currently trigger — the
observed minimum is exactly 3 — but nothing in the code enforces or documents this
invariant, so it is a silent contract violation waiting to happen the next time the dataset
is edited (e.g., adding a verb with many homophonic conjugation forms, or narrowing the
`allVerbs` pool passed in from a future caller).
**Fix:** Add a defensive check at the end of `pickDistractors` (or in `buildQuestion`) that
throws a descriptive error if fewer than `DISTRACTOR_COUNT` distinct distractors could be
assembled, so a future dataset regression fails loudly in CI/tests instead of shipping a
3-choice question to the UI:
```typescript
if (chosen.length < DISTRACTOR_COUNT) {
  throw new Error(
    `Could not find ${DISTRACTOR_COUNT} distinct distractors for ${verb.verb}/${tense}/${subject}; only found ${chosen.length}`,
  );
}
return chosen;
```

### WR-02: `buildQuestion` throws an untyped `Error` for the "unknown verb" branch, inconsistent with the module's typed-error convention

**File:** `src/quiz/engine.ts:42-45`
**Issue:** Every other engine failure mode uses the typed `InsufficientVerbsError`
(carrying structured fields callers can branch on), but the "verb not found in provided
verb list" branch throws a plain `Error` with only a message string. This branch is
currently unreachable from `generate()` (the triple pool and `allVerbs` are always built
from the same `eligibleVerbs` array), but `buildQuestion` and `pickDistractors` are
intentionally exported for direct testing/reuse per the plan (`"Export sampleTriples,
buildQuestion, pickDistractors ... so the synthetic D-08 and distractor-backfill tests can
exercise them with fixtures"`), which means external callers (including Phase 4 UI code, if
it ever calls these helpers directly with a mismatched triple/verb-list pair) get an
undifferentiated `Error` they cannot distinguish from any other failure.
**Fix:** Either introduce a small typed error (e.g., `class VerbNotFoundError extends
Error`) mirroring `InsufficientVerbsError`'s pattern, or at minimum document in a comment
that this branch is a defensive assertion that should never fire given `generate()`'s
current call pattern, so future maintainers don't mistake it for a reachable/tested path.

## Info

### IN-01: Unused variable retained via `void` in the "shuffle" test instead of being removed

**File:** `__tests__/quiz-engine.test.ts:246-260`
**Issue:** `const rngA = mockRandom([0.1, 0.2, 0.3, 0.4, 0.9]);` is declared but never
passed anywhere — the actual calls to `buildQuestion` construct their own fresh
`mockRandom([...])` instances inline (lines 247-248). The test suppresses the resulting
unused-variable complaint with a trailing `void rngA;` (line 260) rather than deleting the
dead declaration.
**Fix:** Delete the unused `rngA` declaration and the `void rngA;` line; they add nothing to
the test's assertions.

### IN-02: `pickDistractors`'s early-exit branch on `chosen.length < DISTRACTOR_COUNT` is not covered when the same-verb pool has zero collisions

**File:** `src/quiz/engine.ts:69-81`
**Issue:** Minor test-coverage gap rather than a bug: the "distractor" happy-path test
(`__tests__/quiz-engine.test.ts:178-185`, verb "falar") never explicitly asserts the
non-backfill branch (`sameVerbCandidates.length >= 3`, no backfill needed) is exercised
correctly on its own — the backfill path is covered by the "distractor dedupe/backfill"
test but the pure-no-backfill path is only implicitly exercised. Not a defect, just a
documentation nit for future maintainers reading the test file to understand branch
coverage.
**Fix:** Optional — no action required; noting for completeness. If desired, add a comment
in the "distractor" test noting it exercises the no-backfill branch.

---

_Reviewed: 2026-07-12T17:48:24Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
