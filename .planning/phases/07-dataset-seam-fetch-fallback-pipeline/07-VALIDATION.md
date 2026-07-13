---
phase: 7
slug: dataset-seam-fetch-fallback-pipeline
status: reviewed
nyquist_compliant: true
wave_0_complete: false
created: 2026-07-14
---

# Phase 7 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | `jest-expo@~57.0.1` (wraps `jest@30.x`), confirmed via `package.json` `"jest": { "preset": "jest-expo" }` |
| **Config file** | `package.json`'s `jest` key (no standalone `jest.config.js`) |
| **Quick run command** | `npx jest __tests__/quiz-engine.test.ts __tests__/dataset-remote.test.ts __tests__/dataset-source.test.ts` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx jest <changed-test-file> -x`
- **After every plan wave:** Run `npm test` (full suite)
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 07-01-01 | 01 | 0 | FETCH-01 | V5 | `fetchRemoteVerbs()` performs a GET with a 90s AbortController timeout and resolves with validated `Verb[]` on success | unit | `npx jest __tests__/dataset-remote.test.ts -x` | ❌ W0 | ⬜ pending |
| 07-01-02 | 01 | 0 | FETCH-02 | V5 | Fetched payload failing `validateDataset()` (even on HTTP 200) causes `fetchRemoteVerbs()` to reject | unit | `npx jest __tests__/dataset-remote.test.ts -x` | ❌ W0 | ⬜ pending |
| 07-01-03 | 01 | 0 | FETCH-03 | DoS / Tampering | `resolveVerbs()` returns the local bundled dataset (never throws) on network error, timeout, non-2xx, or invalid-shape | unit | `npx jest __tests__/dataset-source.test.ts -x` | ❌ W0 | ⬜ pending |
| 07-02-01 | 02 | 1 | FETCH-01 | — | `generate()` accepts an optional injected `verbs` parameter overriding the bundled default | unit | `npx jest __tests__/quiz-engine.test.ts -x` | ✅ existing — extend | ⬜ pending |
| 07-02-02 | 02 | 1 | FETCH-03 | — | Full existing 122-test suite (11 suites) still passes unchanged after the `generate()` signature change and the `querer.isIrregular` dataset edit | regression | `npm test` | ✅ existing suites | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `__tests__/dataset-remote.test.ts` — stubs for FETCH-01, FETCH-02 (mocks `global.fetch`)
- [ ] `__tests__/dataset-source.test.ts` — stubs for FETCH-03 (mocks `fetchRemoteVerbs`, not `global.fetch` directly, to isolate fallback-policy logic)

---

## Manual-Only Verifications

*None — all phase behaviors have automated verification (this is a data/state-layer phase with no new user-visible surface).*

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-07-14
