---
phase: 04
slug: quiz-experience-setup-quiz-results
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-07-12
---

# Phase 04 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | `jest-expo@57.0.1` (Jest 30.x transitively) |
| **Config file** | `package.json` `"jest": { "preset": "jest-expo" }` |
| **Quick run command** | `npx jest __tests__/useQuizStore.test.ts` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx jest __tests__/useQuizStore.test.ts`
- **After every plan wave:** Run `npm test`
- **Before `/gsd:verify-work`:** Full suite must be green, plus a manual iOS simulator walkthrough of all 3 screens (screen rendering/styling is not covered by automated tests)
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 04-XX-XX | TBD | 0 | SETUP-01 | — | N/A | unit (store) | `npx jest __tests__/useQuizStore.test.ts -t "tenses"` | ❌ W0 | ⬜ pending |
| 04-XX-XX | TBD | 0 | SETUP-02 | — | N/A | unit (store) | `npx jest __tests__/useQuizStore.test.ts -t "irregular"` | ❌ W0 | ⬜ pending |
| 04-XX-XX | TBD | 0 | SETUP-03 | — | N/A | unit (store) | `npx jest __tests__/useQuizStore.test.ts -t "startQuiz"` | ❌ W0 | ⬜ pending |
| 04-XX-XX | TBD | 0 | SETUP-03 (error path, D-04) | — | N/A | unit (store) | `npx jest __tests__/useQuizStore.test.ts -t "insufficient"` | ❌ W0 | ⬜ pending |
| 04-XX-XX | TBD | 0 | QUIZ-01 | — | N/A | unit (pure) | `npx jest __tests__/quiz-labels.test.ts` | ❌ W0 (new `src/quiz/labels.ts`) | ⬜ pending |
| 04-XX-XX | TBD | 0 | QUIZ-03 (lock, D-06) | — | N/A | unit (store) | `npx jest __tests__/useQuizStore.test.ts -t "locks"` | ❌ W0 | ⬜ pending |
| 04-XX-XX | TBD | 0 | QUIZ-03 (advance, D-07) | — | N/A | unit (store) | `npx jest __tests__/useQuizStore.test.ts -t "advance"` | ❌ W0 | ⬜ pending |
| 04-XX-XX | TBD | 0 | RSLT-01 | — | N/A | unit (pure, reused from Phase 3) | `npx jest __tests__/quiz-scoring.test.ts` | ✅ (Phase 3) | ⬜ pending |
| 04-XX-XX | TBD | 0 | RSLT-02 | — | N/A | unit (pure helper) | `npx jest __tests__/quiz-share.test.ts` | ❌ W0 (new `buildShareMessage()`) | ⬜ pending |
| 04-XX-XX | TBD | 0 | D-11 ("Try Again" re-derives) | — | N/A | unit (store) | `npx jest __tests__/useQuizStore.test.ts -t "try again"` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*
*Task IDs are TBD — the planner assigns real plan/task IDs; this table's Req→Test mapping must be preserved when tasks are created.*

---

## Wave 0 Requirements

- [ ] Extend `__tests__/useQuizStore.test.ts` with the real store shape (filters, session, currentIndex, answers, lockedChoice, status, actions) — current file only asserts the placeholder `{ status: "idle" }`
- [ ] `src/quiz/labels.ts` + `__tests__/quiz-labels.test.ts` — new pure lookup module and its completeness test (QUIZ-01)
- [ ] `__tests__/quiz-share.test.ts` — new pure `buildShareMessage()` helper and test (RSLT-02), extracted so the D-10 message format is testable without mocking `react-native`'s `Share` module
- [ ] No new test framework/config needed — `jest-expo` preset already covers this

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|--------------------|
| Green/red answer-choice coloring on tap | QUIZ-03, D-05 | No `@testing-library/react-native` in this project (pure-logic-first testing posture); visual rendering not covered by store-level unit tests | Run app in iOS simulator, answer a question correctly and incorrectly, confirm color feedback matches D-05 |
| Setup/Quiz/Results screen layout and navigation flow | SETUP-01/02/03, QUIZ-01/02, RSLT-01/02 | Screen composition and Expo Router navigation are not unit-testable without RN rendering, which this project deliberately avoids | Walk through full quiz flow in iOS simulator: setup → quiz (10 questions) → results → share sheet → Try Again |
| Native iOS share sheet opens with correct message | RSLT-02 | `Share.share()` is a native API side effect; message content is unit-tested via `buildShareMessage()`, but the actual sheet invocation is manual-only | Tap Share on results screen, confirm iOS share sheet opens with `"I scored X/10 on Portuguese Verb Quiz!"` |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
