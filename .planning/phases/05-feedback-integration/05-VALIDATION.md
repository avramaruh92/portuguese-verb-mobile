---
phase: 05
slug: feedback-integration
status: wired
nyquist_compliant: true
wave_0_complete: false
created: 2026-07-13
---

# Phase 05 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest 30.x via `jest-expo@57.0.1` preset (confirmed in `package.json`: `"jest": { "preset": "jest-expo" }`) |
| **Config file** | `package.json` (`jest` key) — no standalone `jest.config.js` |
| **Quick run command** | `npm test -- __tests__/feedback-schema.test.ts __tests__/feedback-payload.test.ts __tests__/feedback-submit.test.ts` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test -- __tests__/feedback-*.test.ts`
- **After every plan wave:** Run `npm test` (full suite, catches regressions in existing quiz/dataset tests)
- **Before `/gsd:verify-work`:** Full suite must be green, plus a live round-trip check against the real deployed backend (`https://portuguese-verb-api.onrender.com/feedback`) — not a Jest test, a manual/scripted check (see Manual-Only Verifications)
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

Task IDs wired from PLAN.md files ({phase}-{plan}-{taskNum}).

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 05-01-01 | 01 | 1 | FDBK-04 | T-05-V5 | Zod schema accepts every valid tense/subject/platform literal, rejects invalid ones + empty strings | unit | `npm test -- __tests__/feedback-schema.test.ts` | ❌ W0 (created in this task) | ⬜ pending |
| 05-01-02 | 01 | 1 | FDBK-01, FDBK-04 | T-05-V5 | Payload builder maps quiz-question context + form input to correct `FeedbackPayload` shape; message composition per D-03 | unit | `npm test -- __tests__/feedback-payload.test.ts` | ❌ W0 (created in this task) | ⬜ pending |
| 05-02-01 | 02 | 2 | FDBK-02 | T-05-02, T-05-03 | `submitFeedback` returns success/validation-error/server-error/network-error on mocked 201/400/500/reject/90s-timeout | unit | `npm test -- __tests__/feedback-submit.test.ts` | ❌ W0 (created in this task) | ⬜ pending |
| 05-03-01 | 03 | 3 | FDBK-01, FDBK-03 | T-05-04 | Modal state fully local; no `useQuizStore`/zustand imports in the modal component | unit (grep + tsc) | `npx tsc --noEmit` + `grep -cE "useQuizStore|zustand" src/feedback/ReportFeedbackModal.tsx` == 0 | — | ⬜ pending |
| 05-03-02 | 03 | 3 | FDBK-01, FDBK-03 | T-05-04 | Quiz screen wires trigger + modal; `src/store/useQuizStore.ts` unchanged (git diff empty) | integration (suite + git diff) | `npm test` + `git diff --stat src/store/useQuizStore.ts` empty | — | ⬜ pending |
| 05-04-01 | 04 | 4 | FDBK-02 | T-05-06 | Live `POST /feedback` returns 201 with persisted-row shape; client enum literals match backend (no 400) | manual/scripted | `curl … https://portuguese-verb-api.onrender.com/feedback` → 201 | — | ⬜ pending |
| 05-04-02 | 04 | 4 | FDBK-03 | T-05-05 | On-device: Quiz screen (`currentIndex`, `lockedChoice`) stays interactive/untouched while modal is open/submitting | manual-only (human-verify checkpoint) | — (on-device check) | — | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Wave 0 test scaffolds are created inline as the first (RED) step of each TDD task, not as a separate plan:

- [ ] `__tests__/feedback-schema.test.ts` — FDBK-04 (schema round-trips for every tense/subject/platform combination) — created in task 05-01-01
- [ ] `__tests__/feedback-payload.test.ts` — FDBK-01, FDBK-04 (payload-builder mapping incl. D-03 message composition) — created in task 05-01-02
- [ ] `__tests__/feedback-submit.test.ts` — FDBK-02 (mocked fetch: 201/400/500/network-error/timeout, `jest.useFakeTimers()` for the 90s case) — created in task 05-02-01
- No new test framework/config needed — `jest-expo` preset already covers this; existing `__tests__/` convention continues unchanged

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Quiz screen (`currentIndex`, `lockedChoice`) stays fully interactive/untouched while the report modal is open or submitting | FDBK-03 | Requires actual RN rendering + timing to observe non-interruption; a unit test on pure functions can't prove a UI didn't block | Code review (automated grep): no `useQuizStore` writes in `src/feedback/` or the modal; `git diff` on the store empty (05-03-01/02). Manual on-device check (05-04-02): open report modal, submit, confirm the Quiz screen underneath stays responsive and loses no progress. |
| Live round-trip against the real deployed backend, including realistic cold-start latency | FDBK-01, FDBK-02 | Cold-start timing on Render's free tier cannot be simulated or predicted by research/unit tests — must be observed against the live API | Task 05-04-01: submit one real feedback payload to `https://portuguese-verb-api.onrender.com/feedback` and confirm a live 201 with the persisted-row shape. Final full cold-start manual test deferred to Phase 6 per STATE.md; at least one live round-trip happens this phase. |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies (submit/modal covered by tests + grep/tsc gates; live round-trip is the documented manual exception)
- [x] Sampling continuity: no 3 consecutive tasks without automated verify (Waves 1-3 all carry automated commands)
- [x] Wave 0 covers all MISSING references (three feedback test files created inline as RED steps)
- [x] No watch-mode flags
- [x] Feedback latency < 10s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** wired by planner — task IDs bound to PLAN.md files
