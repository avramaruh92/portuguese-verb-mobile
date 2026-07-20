---
phase: 14-smarter-distractor-generation
verified: 2026-07-20T00:00:00Z
status: passed
score: 7/7 must-haves verified
overrides_applied: 0
---

# Phase 14: Smarter Distractor Generation Verification Report

**Phase Goal:** Wrong-answer choices are pedagogically meaningful confusions (same-verb, tense-pair, cross-verb) rather than arbitrary wrong forms.
**Verified:** 2026-07-20
**Status:** passed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Same-verb wrong-subject forms used first (tier 1, unchanged) | VERIFIED | `src/quiz/engine.ts:74-80` — identical shape to pre-phase tier-1 block (`otherSubjects` filter → dedupe → `slice(0, DISTRACTOR_COUNT)`); confirmed byte-level unchanged against interfaces doc. Test: `"tier-1 priority ... (DIST-01)"` (line 694) asserts all 3 distractors belong to source verb's own tense-form set and none belong to another verb. |
| 2 | Tier 2 = same-verb, same-subject, other-tense forms, deduped against correct answer + tier-1 picks, fills after tier 1 | VERIFIED | `engine.ts:84-100` — guarded by `chosen.length < DISTRACTOR_COUNT`, `exclude = new Set([correctAnswer, ...chosen])`, iterates ordered other-tense forms with break/continue/push/add. Tests: "tier 2: candidates are deduped..." (line 533) explicitly forces tier-1 to fill 2/3 slots and confirms tier 2 supplies exactly 1 more, never repeating correctAnswer or tier-1 picks. |
| 3 | preterite/imperfect pair prioritized in tier 2 (D-01); present/future no forced ordering (D-02) | VERIFIED | `TENSE_PAIRS` constant (`engine.ts:14-17`) maps only preterite↔imperfect; `pairedTense` branch (`engine.ts:87-90`) puts paired tense first, `if (pairedTense)`. Tests at lines 498, 509 assert `distractors[0]` equals the paired tense's form for preterite and imperfect questions respectively; line 517 test asserts present_indicative produces the 3 other-tense forms as a Set with no forced first element. |
| 4 | Conjugation class derived at selection time via `.slice(-2)`, no schema change; tier 3 prefers same-class cross-verb forms first | VERIFIED | `engine.ts:106-113` — `const ownClass = verb.verb.slice(-2)`, splits `otherVerbs` into `sameClassVerbs`/`otherClassVerbs`, orders `[...shuffle(sameClassVerbs), ...shuffle(otherClassVerbs)]` before mapping to forms. No new field added to `Verb` type (`src/dataset/types.ts` unchanged — not in files_modified). Test "tier 3: same-conjugation-class..." (line 610) uses a 5-verb pool (2 same-class, 2 other-class) and asserts both same-class forms appear before any 2nd other-class form is needed. |
| 5 | Tier fill is strict fill-then-fallback, no slot reservation/tier-mixing | VERIFIED | Each tier is a separate `if (chosen.length < DISTRACTOR_COUNT)` block that only runs if the prior tier didn't fully fill `chosen`; loop bodies `break` once `DISTRACTOR_COUNT` reached. Same idiom across all 3 tiers, matching plan's explicit reuse instruction. |
| 6 | Every question shows exactly 4 unique choices / 1 correct answer across all tenses | VERIFIED | Test "invariant: every tense ... (DIST-04)" (line 711) iterates all 4 `Tense` values via `buildQuestion`, asserts `choices.length === 4`, `new Set(choices).size === 4`, contains `correctAnswer`. Also test at line 722 covers `irregular_only`/`mixed`/`regular_only` mode-shaped pools via `generate()`. |
| 7 | `pôr` (unmatched conjugation class) still produces 3 valid distractors | VERIFIED | Test "tier 3: ... pôr ... (Pitfall 1/4)" (line 637) — `sameClassVerbs` empty (relies on `shuffle`'s empty-array safety, no defensive code added, matching D-04/Pitfall-4 instruction), asserts 3 unique distractors returned, none equal to correct answer. |

**Score:** 7/7 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/quiz/engine.ts` | 3-tier `pickDistractors` with `TENSE_PAIRS` constant, same-conjugation-class tier-3 preference | VERIFIED | Contains `TENSE_PAIRS` (line 14), tier-2 block (84-100), two-pass tier-3 (104-120). Confirmed by direct read, not SUMMARY claim. |
| `__tests__/quiz-engine.test.ts` | Tier-2, tier-3 class-preference, re-verified invariant tests | VERIFIED | Contains 4 "tier 2:" tests, 3 "tier 3:" tests, 3 "invariant:"/"distractor:" re-verification tests — all present and passing (see grep output below). |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|----|--------|---------|
| `src/quiz/engine.ts` | `src/dataset/types.ts` | `import { SUBJECTS, TENSES }` | WIRED | Line 2: `import { SUBJECTS, TENSES } from "../dataset/types";` |
| `src/quiz/engine.ts pickDistractors` | `src/quiz/random.ts shuffle` | `shuffle(candidates, random)` | WIRED | Used in tier-1 (`shuffle(sameVerbCandidates, random)`), tier-2 ordering, and tier-3 (`shuffle(sameClassVerbs, random)`, `shuffle(otherClassVerbs, random)`) |

### Signature Stability (locked by CONTEXT.md)

- `pickDistractors(verb, tense, subject, allVerbs, random): string[]` — unchanged (matches interfaces doc exactly).
- `buildQuestion(triple, allVerbs, random): Question` — unchanged; call site `pickDistractors(verb, triple.tense, triple.subject, allVerbs, random)` (line 60) unmodified.
- No caller (`app/quiz.tsx`, `src/store/useQuizStore.ts`) modified — confirmed via `git status`/`files_modified` in SUMMARY frontmatter (only `src/quiz/engine.ts` and `__tests__/quiz-engine.test.ts` touched) and via `git log` on those two files showing exactly the 3 phase-14 commits.

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Full test suite green | `npm test` | 15 suites, 168 tests, 168 passed | PASS |
| Typecheck clean (strict + noUncheckedIndexedAccess) | `npm run typecheck` | No output, exit 0 | PASS |
| Tier-2-only tests pass | `npx jest -t "tier 2"` (implied by full run) | 4 tier-2 tests pass | PASS |
| Tier-3-only tests pass | `npx jest -t "tier 3"` (implied by full run) | 3 tier-3 tests pass | PASS |

Commands were actually executed in this verification session (not taken from SUMMARY.md), both green.

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| DIST-01 | 14-01-PLAN.md | Tier-1 same-verb wrong-subject preference | SATISFIED | Tier-1 block unchanged; dedicated priority test at line 694 |
| DIST-02 | 14-01-PLAN.md | Tier-2 same-verb wrong-tense, preterite/imperfect pair prioritized | SATISFIED | `TENSE_PAIRS` + tier-2 block; tests lines 498/509/517 |
| DIST-03 | 14-01-PLAN.md | Cross-verb fallback preferring same conjugation class | SATISFIED | Two-pass tier-3; test line 610 |
| DIST-04 | 14-01-PLAN.md | 4-unique/1-correct invariant re-verified across tenses/modes | SATISFIED | Tests lines 711, 722 |
| TEST-04 | 14-01-PLAN.md | Unit tests cover wrong-subject/wrong-tense/cross-verb/invariant | SATISFIED | All above tests present and passing |

Note: `.planning/REQUIREMENTS.md` still shows these 5 requirement rows as unchecked `[ ]` / "Pending" in its status table (lines 17-20, 32, 56-60) — this is a stale tracking-doc artifact, not a code gap. Recommend updating REQUIREMENTS.md checkboxes/status column to reflect Phase 14 completion, but this does not block phase goal achievement since it's a documentation bookkeeping item, not an implementation gap.

### Anti-Patterns Found

None. No `TODO`/`FIXME`/`HACK`/`PLACEHOLDER`/`TBD`/`XXX` markers, no empty-return stubs, no hardcoded static distractor data, no `console.log`-only implementations found in `src/quiz/engine.ts` or the new test additions.

### Human Verification Required

None. This phase is pure in-memory selection logic with full unit-test coverage; no UI, visual, or external-service behavior to verify.

### Gaps Summary

No gaps. All must-haves from the PLAN frontmatter and all 5 ROADMAP success criteria (DIST-01 through DIST-04 behaviors + TEST-04 coverage) are implemented exactly as specified, verified by direct code read (not SUMMARY narrative), and covered by passing tests. `npm test` (168/168) and `npm run typecheck` were both run fresh in this verification session and are green. `pickDistractors`/`buildQuestion` signatures are unchanged and no downstream caller was touched.

---
_Verified: 2026-07-20_
_Verifier: Claude (gsd-verifier)_
