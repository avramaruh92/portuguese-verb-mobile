---
phase: 19
slug: general-product-feedback
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-07-22
---

# Phase 19 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest via `jest-expo` ~57.0.1 preset |
| **Config file** | `"jest": { "preset": "jest-expo" }` in `package.json` |
| **Quick run command** | `npx jest __tests__/productFeedback-schema.test.ts __tests__/productFeedback-payload.test.ts __tests__/productFeedback-submit.test.ts` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx jest __tests__/productFeedback-*.test.ts`
- **After every plan wave:** Run `npm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 19-01-xx | 01 | 0 | PFDBK-03 | V5 | Schema validates category/message/screen/appVersion/platform per contract | unit | `npx jest __tests__/productFeedback-schema.test.ts` | ❌ W0 | ⬜ pending |
| 19-01-xx | 01 | 0 | PFDBK-03, PFDBK-05 | — | Payload builder maps exact 5 fields, never quiz-answer fields | unit | `npx jest __tests__/productFeedback-payload.test.ts` | ❌ W0 | ⬜ pending |
| 19-01-xx | 01 | 0 | PFDBK-04 | — | Submit returns success/validation-error/server-error/network-error with 90s timeout | unit | `npx jest __tests__/productFeedback-submit.test.ts` | ❌ W0 | ⬜ pending |
| 19-01-xx | 01 | 1+ | PFDBK-01, PFDBK-02 | — | Entry points render on Setup/Quiz/Results with correct visibility timing | manual | on-device/simulator check | n/a | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `__tests__/productFeedback-schema.test.ts` — covers PFDBK-03 (mirrors `feedback-schema.test.ts`: valid-combination matrix + invalid-literal + empty-string rejection, plus new max-length rejection cases for `message` (2000) and `appVersion` (20))
- [ ] `__tests__/productFeedback-payload.test.ts` — covers PFDBK-03/PFDBK-05 (mirrors `feedback-payload.test.ts` minus reason-label composition; add explicit "never includes quiz-answer fields" assertion)
- [ ] `__tests__/productFeedback-submit.test.ts` — covers PFDBK-04 (structural mirror of `feedback-submit.test.ts`: 201/400/500/other-non-201/network-error/90s-timeout)
- [ ] No new Jest config or fixtures needed — existing `jest-expo` preset and `globalThis.fetch` mocking pattern reused identically

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|--------------------|
| Entry-point visibility/placement on Setup, Quiz, Results | PFDBK-01, PFDBK-02 | No `@testing-library/react-native` in this repo — screen components are never unit-tested (existing project convention) | Launch app on simulator/device; confirm "Help us improve" footer link on Setup and Results, and the two-action row (Report a problem gated on lock, Help us improve ungated) on Quiz |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
