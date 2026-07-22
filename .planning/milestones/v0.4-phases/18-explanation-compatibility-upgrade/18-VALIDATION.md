---
phase: 18
slug: explanation-compatibility-upgrade
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-07-22
---

# Phase 18 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest via `jest-expo` ~57.0.1 preset (existing, `package.json`) |
| **Config file** | `package.json`'s `"jest": { "preset": "jest-expo" }` field |
| **Quick run command** | `npx jest __tests__/learning-explain.test.ts` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~10 seconds (quick), ~30 seconds (full suite, 192+ tests per v0.3 baseline) |

---

## Sampling Rate

- **After every task commit:** Run `npx jest __tests__/learning-explain.test.ts`
- **After every plan wave:** Run `npm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 18-01-01 | 01 | 1 | EXPL-05 | — | Context includes all 7 template variables | unit | `npx jest __tests__/learning-explain.test.ts -t "template"` | ✅ existing file, extend | ⬜ pending |
| 18-01-02 | 01 | 1 | EXPL-06 | — | selectedTenseLabel/selectedSubjectLabel resolved from matches[0] when agreed; omitted when disagreed | unit | `npx jest __tests__/learning-explain.test.ts -t "selected"` | ✅ existing file, extend | ⬜ pending |
| 18-01-03 | 01 | 1 | EXPL-07 | — | tenseNotes/subjectHints appended as separate lines, correct order, skip-if-absent | unit | `npx jest __tests__/learning-explain.test.ts -t "notes\|hints"` | ✅ existing file, extend | ⬜ pending |
| 18-01-04 | 01 | 1 | EXPL-08 | — | Fail-closed paths (no learning/formIndex/match) still return undefined | unit | `npx jest __tests__/learning-explain.test.ts -t "undefined"` | ✅ existing file, verify still passes after extension | ⬜ pending |
| 18-01-05 | 01 | 1 | TEST-06 | — | All of the above covered explicitly | unit | `npm test` | ✅ existing file, extend | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing test infrastructure (`__tests__/learning-explain.test.ts`, Jest + `jest-expo` preset)
fully covers this phase's requirements; only new test cases need to be added to the existing
file, no new framework/config/fixtures required.

*Existing infrastructure covers all phase requirements.*

---

## Manual-Only Verifications

*All phase behaviors have automated verification.*

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references (none — existing infra sufficient)
- [x] No watch-mode flags
- [x] Feedback latency < 30s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
