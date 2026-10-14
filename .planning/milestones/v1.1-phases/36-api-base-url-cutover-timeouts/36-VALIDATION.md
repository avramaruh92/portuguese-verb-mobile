---
phase: 36
slug: api-base-url-cutover-timeouts
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-10-11
---

# Phase 36 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest via jest-expo ~57 |
| **Config file** | `package.json` (`"jest": { "preset": "jest-expo" }`) |
| **Quick run command** | `npx jest __tests__/dataset-remote.test.ts __tests__/feedback-submit.test.ts __tests__/productFeedback-submit.test.ts __tests__/api-host-guard.test.ts` |
| **Full suite command** | `npm test && npm run typecheck && npm run lint` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run quick run command
- **After every plan wave:** Run full suite command
- **Before `/gsd:verify-work`:** Full suite must be green, plus `npm run preflight` against Frankfurt
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

To be filled in by the planner/executor once the plans assign task IDs. Requirement-to-command map, taken from the Validation Architecture section of RESEARCH.md:

| Requirement | Behavior | Test Type | Automated Command | File Exists | Status |
|-------------|----------|-----------|-------------------|-------------|--------|
| API-01 | All three endpoints build from `API_BASE_URL` in `src/config/api.ts` (Frankfurt) | unit | `npx jest __tests__/dataset-remote.test.ts __tests__/feedback-submit.test.ts __tests__/productFeedback-submit.test.ts` | edit existing | ⬜ pending |
| API-02 | Oregon host absent from `src/` and `scripts/` | guard | `npx jest __tests__/api-host-guard.test.ts` | ❌ W0 | ⬜ pending |
| API-03 | preflight targets Frankfurt and passes | live smoke | `npm run preflight` | script edit | ⬜ pending |
| API-04 | Four docs no longer present Oregon as current | grep | `! grep -n "portuguese-verb-api\.onrender\.com" CLAUDE.md AGENTS.md store/metadata/review-notes.md store/privacy/nutrition-label-answers.md` | n/a | ⬜ pending |
| NET-01 | Content fetch aborts at 15s → local fallback | unit (fake timers) | `npx jest __tests__/dataset-remote.test.ts` | add test | ⬜ pending |
| NET-02 | Both feedback submits abort at 45s → `network-error` | unit (fake timers) | `npx jest __tests__/feedback-submit.test.ts __tests__/productFeedback-submit.test.ts` | edit existing | ⬜ pending |
| NET-03 | No cache-busting headers/params; 304/non-200 → fallback | unit | `npx jest __tests__/dataset-remote.test.ts __tests__/dataset-source.test.ts` | add tests | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `__tests__/api-host-guard.test.ts` — guard for API-02
- [ ] `src/config/api.ts` — shared `API_BASE_URL` constant

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Preflight passes against Frankfurt | API-03 | Live network; POSTs dummy rows to the Frankfurt backend | Run `npm run preflight`; expect exit 0 |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
