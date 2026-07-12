---
phase: 3
slug: quiz-engine
status: draft
nyquist_compliant: false
wave_0_complete: false
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
| **Quick run command** | `npx jest __tests__/quiz-engine.test.ts __tests__/quiz-scoring.test.ts` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx jest __tests__/quiz-engine.test.ts __tests__/quiz-scoring.test.ts`
- **After every plan wave:** Run `npm test` (full suite — includes `dataset.test.ts`, `useQuizStore.test.ts`, `smoke.test.ts`)
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 03-01-01 | 01 | 1 | QUIZ-04 | — | Filtering by tense + irregular toggle produces correct eligible pool | unit | `npx jest __tests__/quiz-engine.test.ts -t "filter"` | ❌ W0 | ⬜ pending |
| 03-01-02 | 01 | 1 | QUIZ-04 | — | Sampling produces exactly 10 questions with no duplicate (verb,tense,subject) triple (D-06/D-07) | unit | `npx jest __tests__/quiz-engine.test.ts -t "duplicate"` | ❌ W0 | ⬜ pending |
| 03-01-03 | 01 | 1 | QUIZ-04 | — | Insufficient pool throws `InsufficientVerbsError` (D-08) | unit | `npx jest __tests__/quiz-engine.test.ts -t "InsufficientVerbsError"` | ❌ W0 | ⬜ pending |
| 03-01-04 | 01 | 1 | QUIZ-04 | — | Distractors deduped, backfilled to exactly 3 unique wrong answers (D-02/D-03) | unit | `npx jest __tests__/quiz-engine.test.ts -t "distractor"` | ❌ W0 | ⬜ pending |
| 03-01-05 | 01 | 1 | QUIZ-04 | — | Correct-answer position fully randomized across calls, deterministic under mock RNG (D-04/D-09) | unit | `npx jest __tests__/quiz-engine.test.ts -t "shuffle"` | ❌ W0 | ⬜ pending |
| 03-01-06 | 01 | 1 | QUIZ-04 | — | `score()` returns correct `{correct, total}` for known session+answers fixtures (D-10) | unit | `npx jest __tests__/quiz-scoring.test.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `__tests__/quiz-engine.test.ts` — covers QUIZ-04 (filtering, sampling, distractors, D-08 error)
- [ ] `__tests__/quiz-scoring.test.ts` — covers QUIZ-04 (score calculation)
- [ ] No new framework/config install needed — `jest-expo` already covers this; no shared fixtures beyond importing `verbs`/`types` from `src/dataset/` (already available)

---

## Manual-Only Verifications

*None — all phase behaviors have automated verification.*

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
