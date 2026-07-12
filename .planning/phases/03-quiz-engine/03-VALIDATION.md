---
phase: 3
slug: quiz-engine
status: approved
nyquist_compliant: true
wave_0_complete: true
created: 2026-07-12
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest 30.x via `jest-expo` preset `~57.0.1` `[VERIFIED: package.json]` |
| **Config file** | `package.json` → `"jest": { "preset": "jest-expo" }` (no separate `jest.config.js`) `[VERIFIED: package.json]` |
| **Quick run command** | `npx jest __tests__/quiz-random.test.ts __tests__/quiz-engine.test.ts __tests__/quiz-scoring.test.ts` |
| **Full suite command** | `npm test` |
| **Typecheck command** | `npm run typecheck` (tsc --noEmit, strict + noUncheckedIndexedAccess) |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run the relevant test file plus `npm run typecheck`
- **After every plan wave:** Run `npm test` (full suite — includes `dataset.test.ts`, `useQuizStore.test.ts`, `smoke.test.ts`)
- **Before `/gsd:verify-work`:** Full suite must be green and `npm run typecheck` exits 0
- **Max feedback latency:** 15 seconds

---

## Test-First / Wave Structure

This phase's tests are authored as part of the plans that own their source files
(TDD, RED→GREEN), so there is no separate stub-only wave — each test file is created
in the same plan as (and before) its implementation. Coverage mapping:

- `__tests__/quiz-random.test.ts` → Plan 03-01 (Wave 1), tests `src/quiz/random.ts`
- `__tests__/quiz-engine.test.ts` → Plan 03-02 (Wave 2), tests `src/quiz/engine.ts`
- `__tests__/quiz-scoring.test.ts` → Plan 03-03 (Wave 2), tests `src/quiz/scoring.ts`

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 03-01-T1 | 01 | 1 | QUIZ-04 | T-03-01 | Type contracts exist; Tense/Subject imported not redeclared; typecheck clean | typecheck | `npm run typecheck` | ✅ this plan | ⬜ pending |
| 03-01-T2 | 01 | 1 | QUIZ-04 | — | shuffle() deterministic under injected RNG, non-mutating, permutation-preserving | unit | `npx jest __tests__/quiz-random.test.ts` | ✅ this plan | ⬜ pending |
| 03-02-F | 02 | 2 | QUIZ-04 | T-03-02 | Filtering by tense + irregular toggle produces correct eligible pool | unit | `npx jest __tests__/quiz-engine.test.ts -t "filter"` | ✅ this plan | ⬜ pending |
| 03-02-F | 02 | 2 | QUIZ-04 | — | Session has exactly 10 questions, no duplicate (verb,tense,subject) triple (D-06/D-07) | unit | `npx jest __tests__/quiz-engine.test.ts -t "duplicate"` | ✅ this plan | ⬜ pending |
| 03-02-F | 02 | 2 | QUIZ-04 | T-03-02 | Insufficient pool throws `InsufficientVerbsError` (D-08) | unit | `npx jest __tests__/quiz-engine.test.ts -t "InsufficientVerbsError"` | ✅ this plan | ⬜ pending |
| 03-02-F | 02 | 2 | QUIZ-04 | — | Distractors deduped + backfilled to exactly 3 unique wrong answers (D-02/D-03) | unit | `npx jest __tests__/quiz-engine.test.ts -t "distractor"` | ✅ this plan | ⬜ pending |
| 03-02-F | 02 | 2 | QUIZ-04 | — | Correct-answer position randomized across calls, deterministic under mock RNG (D-04/D-09) | unit | `npx jest __tests__/quiz-engine.test.ts -t "shuffle"` | ✅ this plan | ⬜ pending |
| 03-02-F | 02 | 2 | QUIZ-04 | — | Same verb CAN repeat with different tense/subject; only full triple must be unique (D-07) | unit | `npx jest __tests__/quiz-engine.test.ts -t "same-verb repeat"` | ✅ this plan | ⬜ pending |
| 03-03-F | 03 | 2 | QUIZ-04 | T-03-03 | `score()` returns correct `{correct, total}` for known session+answers fixtures (D-10) | unit | `npx jest __tests__/quiz-scoring.test.ts` | ✅ this plan | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Satisfied inline (test-first within each owning plan — see "Test-First / Wave Structure" above):

- [x] `__tests__/quiz-random.test.ts` — planned in 03-01, covers shuffle determinism/immutability
- [x] `__tests__/quiz-engine.test.ts` — planned in 03-02, covers QUIZ-04 (filtering, sampling, distractors, D-08 error, shuffle)
- [x] `__tests__/quiz-scoring.test.ts` — planned in 03-03, covers QUIZ-04 (score calculation)
- [x] No new framework/config install needed — `jest-expo` already covers this; fixtures import `verbs`/`types` from `src/dataset/` (already available)

---

## Manual-Only Verifications

*None — all phase behaviors have automated verification.*

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references (satisfied test-first within owning plans)
- [x] No watch-mode flags
- [x] Feedback latency < 15s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved
