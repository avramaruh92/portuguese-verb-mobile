---
phase: 14
slug: smarter-distractor-generation
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-07-20
---

# Phase 14 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest via `jest-expo` preset (`"jest": { "preset": "jest-expo" }` in `package.json`) |
| **Config file** | `package.json` (`jest` key) — no standalone `jest.config.js` |
| **Quick run command** | `npx jest __tests__/quiz-engine.test.ts` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx jest __tests__/quiz-engine.test.ts`
- **After every plan wave:** Run `npm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 14-01-01 | 01 | 1 | DIST-01 | — | N/A | unit | `npx jest __tests__/quiz-engine.test.ts -t "distractor"` | ✅ | ⬜ pending |
| 14-01-02 | 01 | 1 | DIST-02 | — | N/A | unit | `npx jest __tests__/quiz-engine.test.ts -t "tier 2\|wrong-tense"` | ❌ W0 | ⬜ pending |
| 14-01-03 | 01 | 1 | DIST-03 | — | N/A | unit | `npx jest __tests__/quiz-engine.test.ts -t "class\|cross-verb"` | ❌ W0 | ⬜ pending |
| 14-01-04 | 01 | 1 | DIST-04 | — | N/A | unit | `npx jest __tests__/quiz-engine.test.ts -t "distractor"` | ✅ | ⬜ pending |
| 14-01-05 | 01 | 1 | TEST-04 | — | N/A | unit | `npm test` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements — `__tests__/quiz-engine.test.ts`
already has the `mockRandom` helper and `simpleVerbs`/`collidingVerb` fixture patterns
needed to extend for tier-2 and tier-3-with-class-preference test cases. No new test
framework install or shared fixture file required.

---

## Manual-Only Verifications

All phase behaviors have automated verification.

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 10s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
