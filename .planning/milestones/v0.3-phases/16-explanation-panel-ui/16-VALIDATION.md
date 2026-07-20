---
phase: 16
slug: explanation-panel-ui
status: approved
nyquist_compliant: true
wave_0_complete: true
created: 2026-07-20
---

# Phase 16 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest via `jest-expo` ~57.0.1 preset |
| **Config file** | `package.json`'s `"jest": { "preset": "jest-expo" }` |
| **Quick run command** | `npx jest __tests__/useQuizStore.test.ts` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx jest __tests__/useQuizStore.test.ts`
- **After every plan wave:** Run `npm test`
- **Before `/gsd:verify-work`:** Full suite must be green, plus `npm run typecheck` (catches the `selectExplanation` argument-shape mismatch at compile time — third param is `{ tense; subject }`, not `correctAnswer: string`)
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 16-01-01 | 01 | 1 | EXPL-02 | — / N/A | `useQuizStore` exposes `learning: LearningContent \| undefined` and a formIndex-bearing `verbs: Verb[]` from `resolveVerbs()` | unit | `npx jest __tests__/useQuizStore.test.ts` | ✅ exists, needs new assertions | ⬜ pending |
| 16-01-02 | 01 | 1 | EXPL-02 | — / N/A | `app/quiz.tsx`'s `currentVerb` reads from the store's resolved `verbs` (carries `formIndex`), not the bundled `src/dataset/verbs.ts` import | unit (typecheck-covered; no component-render convention in this project) | `npm run typecheck` | ✅ N/A — no new test file per project convention | ⬜ pending |
| 16-02-01 | 02 | 2 | EXPL-02, EXPL-03 | — / N/A | `ExplanationPanel` renders backend string verbatim per UI-SPEC.md; mounts only when `selectExplanation(...)` returns a string | manual (no `@testing-library/react-native` in this project) | Manual device/simulator check per Manual-Only table below | ✅ N/A | ⬜ pending |
| 16-02-02 | 02 | 2 | EXPL-04 | — / N/A | Scoring, `correctAnswer`, and `POST /feedback` `selectedAnswer` payload unaffected by panel presence | unit (existing, regression-only) | `npx jest __tests__/quiz-scoring.test.ts __tests__/feedback-*.test.ts` | ✅ existing tests already lock this invariant | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements. `__tests__/useQuizStore.test.ts`, `__tests__/learning-explain.test.ts`, and `__tests__/learning-schema.test.ts` already exercise everything below the UI layer; no new Wave 0 scaffolding needed.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|--------------------|
| Explanation panel appears between choices and Next button on wrong answer, with correct visual treatment (surface bg, textSecondary text, no border) | EXPL-02 | No `@testing-library/react-native` in this project (CONVENTIONS.md/STACK.md) — no component-render test convention exists | Run app on simulator/device, answer a question incorrectly for a verb with resolvable `learning` content, confirm panel appears in the right position with UI-SPEC.md's exact styling |
| No panel shown when `learning` content unavailable (missing block, missing verb, no `formIndex` match) or on a correct answer | EXPL-03 | Same as above — visual absence check | Answer correctly (confirm no panel); answer incorrectly for a verb/case known to lack matching learning content (confirm no panel, no crash) |
| Advancing to next question, score tally, and feedback modal's `selectedAnswer` unaffected by panel | EXPL-04 | Full user-journey confirmation beyond unit test scope | Complete a full 10-question quiz including wrong answers with panels shown; confirm final score matches manual tally; submit feedback on a panel-shown question and confirm payload's `selectedAnswer` matches what was tapped |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references (none needed)
- [x] No watch-mode flags
- [x] Feedback latency < 15s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-07-20
