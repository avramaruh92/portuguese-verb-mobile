---
phase: 05
slug: feedback-integration
status: draft
nyquist_compliant: false
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

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 05-01-01 | 01 | 0 | FDBK-04 | V5 | Zod schema accepts every valid tense/subject/platform literal, rejects invalid ones | unit | `npm test -- __tests__/feedback-schema.test.ts` | ❌ W0 | ⬜ pending |
| 05-01-02 | 01 | 0 | FDBK-01, FDBK-04 | V5 | Payload builder maps quiz-question context + form input to correct `FeedbackPayload` shape for all combinations | unit | `npm test -- __tests__/feedback-payload.test.ts` | ❌ W0 | ⬜ pending |
| 05-01-03 | TBD | TBD | FDBK-02 | — | `submitFeedback` returns success/validation-error/server-error/network-error on mocked 201/400/500/reject/timeout | unit | `npm test -- __tests__/feedback-submit.test.ts` | ❌ W0 | ⬜ pending |
| 05-01-04 | TBD | TBD | FDBK-03 | — | No `useQuizStore` writes anywhere in `src/feedback/` or the modal component; Quiz screen state unaffected while modal is open | manual-only | — (code review + on-device check) | — | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

*Exact task IDs above are placeholders pending planner output — the planner MUST wire real task IDs from PLAN.md files back into this table as part of Wave 0 setup.*

---

## Wave 0 Requirements

- [ ] `__tests__/feedback-schema.test.ts` — stubs for FDBK-04 (schema round-trips for every tense/subject/platform combination)
- [ ] `__tests__/feedback-payload.test.ts` — stubs for FDBK-01, FDBK-04 (payload-builder mapping correctness, including D-03 reason+freetext message composition)
- [ ] `__tests__/feedback-submit.test.ts` — stubs for FDBK-02 (mocked fetch: 201/400/500/network-error/timeout branches, using `jest.useFakeTimers()` for the 90s timeout case)
- No new test framework/config needed — `jest-expo` preset already fully covers this; existing `__tests__/` directory convention continues unchanged

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Quiz screen (`currentIndex`, `lockedChoice`) stays fully interactive/untouched while the report modal is open or submitting | FDBK-03 | Requires actual RN rendering + timing to observe non-interruption; a unit test on pure functions can't prove a UI didn't block | Code review: confirm no `useQuizStore` writes in `src/feedback/` or the modal component. Manual on-device check: open report modal, submit, and confirm the Quiz screen underneath remains responsive during the in-flight request. |
| Live round-trip against the real deployed backend, including realistic cold-start latency | FDBK-01, FDBK-02 | Cold-start timing on Render's free tier cannot be simulated or predicted by research/unit tests — must be observed against the live API | During execution: submit one real feedback payload to `https://portuguese-verb-api.onrender.com/feedback` and confirm a live 201 with the expected persisted-row shape. Final full cold-start manual test is deferred to Phase 6 per STATE.md, but at least one live round-trip must happen in this phase. |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
