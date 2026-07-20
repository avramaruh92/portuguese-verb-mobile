---
phase: 15
slug: learning-content-explanation-engine
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-07-20
---

# Phase 15 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest via `jest-expo` preset (already configured) |
| **Config file** | `package.json`'s `"jest": { "preset": "jest-expo" }` |
| **Quick run command** | `npm test -- __tests__/learning-explain.test.ts` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test -- __tests__/learning-explain.test.ts` (and whichever `dataset-*.test.ts` file was touched)
- **After every plan wave:** Run `npm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 15-01-0x | 01 | 1 | EXPL-01 | V5 / — | `learning`/`formIndex` Zod-validated (`.safeParse`, never `.parse`) from `GET /content/verbs`, `verbs` handling unaffected | unit | `npm test -- __tests__/dataset-remote.test.ts` | ❌ W0 (extend existing file) | ⬜ pending |
| 15-01-0x | 01 | 1 | EXPL-01 | — | Response omitting `learning` resolves dataset exactly as before, no crash | unit | `npm test -- __tests__/dataset-remote.test.ts` | ❌ W0 (extend existing file) | ⬜ pending |
| 15-01-0x | 01 | 1 | EXPL-01 | — | `resolveVerbs()` snapshot carries `learning` alongside `verbs`/`source` | unit | `npm test -- __tests__/dataset-source.test.ts` | ❌ W0 (extend existing file) | ⬜ pending |
| 15-02-0x | 02 | 1/2 | TEST-05 | — | Correct template per mismatch type (`wrongTense`/`wrongSubject`/`wrongTenseAndSubject`/`generic`, incl. ambiguous-tie → `generic`) | unit | `npm test -- __tests__/learning-explain.test.ts` | ❌ W0 (new file) | ⬜ pending |
| 15-02-0x | 02 | 1/2 | TEST-05 | — | Missing-content fallback (no `learning`, no verb entry, zero `formIndex` matches) → `undefined`, no throw | unit | `npm test -- __tests__/learning-explain.test.ts` | ❌ W0 (new file) | ⬜ pending |
| 15-02-0x | 02 | 1/2 | TEST-05 | — | Explanation generation never mutates scoring/feedback data (`selectExplanation` is pure) | unit | `npm test -- __tests__/learning-explain.test.ts` | ❌ W0 (new file) | ⬜ pending |
| 15-0x-0x | — | — | EXPL-01 | V5 | `LearningContentSchema`/`FormMatchSchema` safeParse success/failure | unit | `npm test -- __tests__/learning-schema.test.ts` | ❌ W0 (new file, recommended) | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*
*Exact task IDs are assigned by the planner; this map will be reconciled once PLAN.md files exist.*

---

## Wave 0 Requirements

- [ ] `__tests__/learning-explain.test.ts` — new file, covers TEST-05 (template selection per category + tie-break-to-generic + missing-content fallback + purity)
- [ ] `__tests__/learning-schema.test.ts` — new file (recommended, matches `dataset.test.ts`'s existing pattern of a standalone schema-validation test file) covering `LearningContentSchema`/`FormMatchSchema` safeParse success/failure cases
- [ ] Extend `__tests__/dataset-remote.test.ts` — add cases for `payload.learning` present-valid / present-invalid / absent, confirm `verbs` handling unaffected in all three
- [ ] Extend `__tests__/dataset-source.test.ts` — update mock return shapes to `{ verbs, learning }` from `fetchRemoteVerbs`, add assertions that `resolveVerbs()`'s result includes `learning`
- [ ] No new framework install needed — `jest-expo` already covers this

---

## Manual-Only Verifications

*None — all Phase 15 behaviors have automated unit-test verification (pure functions, no UI in this phase).*

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
