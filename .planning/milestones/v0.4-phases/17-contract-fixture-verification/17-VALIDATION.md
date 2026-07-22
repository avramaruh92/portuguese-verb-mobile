---
phase: 17
slug: contract-fixture-verification
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-07-21
---

# Phase 17 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest via `jest-expo` preset ~57.0.1 |
| **Config file** | `package.json`'s `"jest": { "preset": "jest-expo" }` field — no standalone `jest.config.*` file |
| **Quick run command** | `npm test -- __tests__/contract-fixture.test.ts` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test -- __tests__/contract-fixture.test.ts`
- **After every plan wave:** Run `npm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 17-01-01 | 01 | 0 | CONTRACT-01 | — / N/A | Fixture copied verbatim into mobile test tree, no cross-repo import at runtime | static/structural | `git ls-files __tests__/fixtures/content-verbs-v0.4.sample.json` | ❌ W0 | ⬜ pending |
| 17-01-02 | 01 | 1 | CONTRACT-02 | — / N/A | `validateDataset(fixture.verbs)` returns zero errors | unit | `npm test -- __tests__/contract-fixture.test.ts -t "validateDataset"` | ❌ W0 | ⬜ pending |
| 17-01-03 | 01 | 1 | CONTRACT-02 | — / N/A | `LearningContentSchema.safeParse(fixture.learning)` succeeds | unit | `npm test -- __tests__/contract-fixture.test.ts -t "LearningContentSchema"` | ❌ W0 | ⬜ pending |
| 17-01-04 | 01 | 1 | CONTRACT-02 | — / N/A | Fixture parses successfully through `fetchRemoteVerbs` (fetch mocked) | unit | `npm test -- __tests__/contract-fixture.test.ts -t "fetchRemoteVerbs"` | ❌ W0 | ⬜ pending |
| 17-01-05 | 01 | 1 | CONTRACT-03 | — / N/A | Accented (`pôr`/`pôs`) and tied (`falam`) forms survive parsing byte-for-byte | unit | `npm test -- __tests__/contract-fixture.test.ts -t "byte-for-byte"` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `__tests__/fixtures/content-verbs-v0.4.sample.json` — verbatim copy from `~/portuguese-verb/portuguese-verb-backend/contracts/content-verbs-v0.4.sample.json` (byte-for-byte, no reformatting)
- [ ] `__tests__/contract-fixture.test.ts` — new test file stubs covering CONTRACT-01/02/03
- Framework install: none — Jest/`jest-expo`/Zod already installed and configured

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
