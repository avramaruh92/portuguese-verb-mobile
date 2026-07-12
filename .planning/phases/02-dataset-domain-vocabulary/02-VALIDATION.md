---
phase: 02
slug: dataset-domain-vocabulary
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-07-12
---

# Phase 02 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest 30.x via `jest-expo@~57.0.1` preset |
| **Config file** | `package.json` (`jest` key) — no separate `jest.config.js` |
| **Quick run command** | `npm test -- __tests__/dataset.test.ts` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test -- __tests__/dataset.test.ts`
- **After every plan wave:** Run `npm test` (full suite, includes Phase 1's `smoke.test.ts` and `useQuizStore.test.ts`)
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 02-01-01 | 01 | 0 | DATA-01 | — | N/A | unit | `npm test -- __tests__/dataset.test.ts -t "shape"` | ❌ W0 | ⬜ pending |
| 02-01-02 | 01 | 0 | DATA-02 | — | N/A | unit | `npm test -- __tests__/dataset.test.ts -t "count"` | ❌ W0 | ⬜ pending |
| 02-01-03 | 01 | 0 | DATA-03 | T-02-01 | Fail closed on incomplete dataset — no silent partial acceptance | unit | `npm test -- __tests__/dataset.test.ts -t "zero shape/completeness errors"` | ❌ W0 | ⬜ pending |
| 02-01-04 | 01 | 0 | DATA-03 (negative case) | T-02-01 | Validation actually rejects an incomplete verb, proving the schema is not a no-op | unit | `npm test -- __tests__/dataset.test.ts -t "rejects a verb missing"` | ❌ W0 | ⬜ pending |
| 02-01-05 | 01 | 0 | SC-3 (no dedicated REQ ID) | — | N/A | unit | `npm test -- __tests__/dataset.test.ts -t "locked backend enums"` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/dataset/types.ts` — does not exist yet, needed before any test can import types
- [ ] `src/dataset/verbs.ts` — does not exist yet, dataset content itself
- [ ] `src/dataset/validate.ts` — does not exist yet, the `VerbSchema` + `validateDataset()` this phase's tests exercise
- [ ] `__tests__/dataset.test.ts` — does not exist yet; follows the existing `__tests__/*.test.ts` convention (no new Jest config needed — `jest-expo` preset already handles plain-TS test files with zero RN imports)

*(No framework install needed — `jest-expo` and `zod` are already dependencies.)*

---

## Manual-Only Verifications

*All phase behaviors have automated verification.*

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
