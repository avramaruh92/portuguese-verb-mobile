---
phase: 39
slug: v1-0-tech-debt-cleanup
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-10-14
---

# Phase 39 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | jest (jest-expo) for regressions; the gate itself is `scripts/validate-brand.ts` run with Node type stripping |
| **Config file** | `package.json` (`jest.preset: jest-expo`), `tsconfig.json` |
| **Quick run command** | `npm run validate-brand` |
| **Full suite command** | `npm run typecheck && npm run lint && npm test && npm run validate-brand` |
| **Estimated runtime** | ~60 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run validate-brand` (Plan 01) or the grep checks (Plan 02)
- **After every plan wave:** Run the full suite command
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 60 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 39-01-xx | 01 | 1 | DEBT-03 | — | Paths resolve from the repo root only; no user-supplied path args | negative run | `cd /tmp && node <repo>/scripts/validate-brand.ts` gives the same N/N as the repo root | ✅ | ⬜ pending |
| 39-01-xx | 01 | 1 | DEBT-02 | — | N/A | negative run | Recolour a brand PNG, then `npm run validate-brand` exits 1; `git checkout -- assets/images`, then exit 0 | ✅ | ⬜ pending |
| 39-01-xx | 01 | 1 | DEBT-04 | — | N/A | negative run | Set X0 to 180 in `src/theme/lockup.ts`, then `npm run validate-brand` exits 1; restore, then exit 0 | ❌ (new module) | ⬜ pending |
| 39-01-xx | 01 | 1 | D-14 | — | N/A | regression | `npm run typecheck && npm run lint && npm test` | ✅ | ⬜ pending |
| 39-02-xx | 02 | 1 | DEBT-01 | — | N/A | grep | `grep -n "appVersionSource" CLAUDE.md .planning/codebase/STACK.md` | ✅ | ⬜ pending |
| 39-02-xx | 02 | 1 | DEBT-05 | — | N/A | grep | `grep -n "Correction (2026-10" <30-02-SUMMARY> <35-06-SUMMARY>`; `! grep -n "checked-in" store/screenshots/README.md` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements. D-13 requires no new Jest tests. The only config change is `allowImportingTsExtensions` in `tsconfig.json`, made inside Plan 01.

---

## Manual-Only Verifications

All phase behaviors have automated verification. The negative runs are scripted and restored inside the executing task.

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 60s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
