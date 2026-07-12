---
phase: 1
slug: scaffold
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-07-12
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest 30.x via `jest-expo@57.0.1` preset (no config exists yet — Wave 0 creates it) |
| **Config file** | `package.json` `"jest"` key (created this phase) |
| **Quick run command** | `npm test` (maps to `jest`, single run — NOT `--watchAll`) |
| **Full suite command** | `npm test` (same — suite is trivial, 2 test files total this phase) |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test && npx tsc --noEmit`
- **After every plan wave:** Run `npm test && npx tsc --noEmit && npx expo export --platform ios`
- **Before `/gsd:verify-work`:** Full suite must be green, plus one `checkpoint:human-verify` confirming actual iOS Simulator boot and empty-screen render
- **Max feedback latency:** ~10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 1-01-01 | 01 | 0 | SC-1 (empty root screen boots) | — / N/A | App bundles and renders without error | smoke (bundling) | `npx expo export --platform ios` | ❌ W0 | ⬜ pending |
| 1-01-02 | 01 | 0 | SC-2 (test suite passes) | — / N/A | jest-expo preset runs and passes | unit | `npm test` | ❌ W0 — `__tests__/smoke.test.ts` | ⬜ pending |
| 1-01-03 | 01 | 0 | SC-3 (strict TS compiles) | — / N/A | Static type check passes with zero errors | typecheck | `npx tsc --noEmit` | ❌ W0 — `tsconfig.json` (`strict: true`) | ⬜ pending |
| 1-01-04 | 01 | 0 | SC-4 (Zustand store importable) | — / N/A | Store module loads, initial state readable, no runtime error | unit | `npm test` (covers `useQuizStore.test.ts`) | ❌ W0 — `src/store/useQuizStore.ts` | ⬜ pending |
| 1-01-05 | 01 | 0 | SC-1 (visual confirmation) | — / N/A | Simulator renders empty root screen with no errors | manual (checkpoint) | `checkpoint:human-verify` | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `package.json` `"jest"` key + `"test": "jest"` script — no test runner wired yet (greenfield repo)
- [ ] `tsconfig.json` with `"strict": true`, `"types": ["jest"]` — doesn't exist yet
- [ ] `__tests__/smoke.test.ts` — covers SC-2
- [ ] `__tests__/useQuizStore.test.ts` — covers SC-4
- [ ] `src/store/useQuizStore.ts` — the scaffold itself, covers SC-4
- [ ] A `checkpoint:human-verify` task for SC-1's visual simulator confirmation — no automated equivalent exists for "renders correctly with no errors" beyond the bundling-level proxy

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| iOS Simulator boots to empty root screen with no errors | SC-1 | No automated visual-inspection mechanism exists in this environment (no screenshot/render-diff tooling installed); `npx expo export --platform ios` only proves bundling succeeds, not visual correctness | Run `npx expo start`, open iOS Simulator, confirm app launches to a blank/placeholder screen with zero red-box errors or console errors |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
