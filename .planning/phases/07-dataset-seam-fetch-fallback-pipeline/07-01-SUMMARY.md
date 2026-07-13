---
phase: 07-dataset-seam-fetch-fallback-pipeline
plan: 01
subsystem: dataset
tags: [fetch, fallback, validation, memoization]
requires: []
provides:
  - "src/dataset/remote.ts#fetchRemoteVerbs"
  - "src/dataset/source.ts#resolveVerbs"
  - "src/dataset/source.ts#prefetch"
  - "src/dataset/source.ts#VerbSource"
affects:
  - "Phase 8 startQuiz() wiring (consumes resolveVerbs/prefetch)"
tech-stack:
  added: []
  patterns:
    - "AbortController + setTimeout(90_000) timeout, mirrored from src/feedback/submit.ts"
    - "throw-on-any-failure network wrapper (remote.ts) + single-catch fallback orchestrator (source.ts)"
    - "module-level Promise memoization guard for fetch-once-per-session semantics"
key-files:
  created:
    - src/dataset/remote.ts
    - src/dataset/source.ts
    - __tests__/dataset-remote.test.ts
    - __tests__/dataset-source.test.ts
  modified: []
decisions:
  - "Followed D-01 through D-06 from 07-CONTEXT.md exactly: real live endpoint (no mock), 90s cold-start-tolerant timeout, prefetch-on-load non-blocking trigger, fetch-once in-memory-only memoization, reuse of existing validateDataset()/VerbSchema."
  - "Test files use require() + jest.resetModules() instead of dynamic import() for source.ts module-state isolation between tests — this project's Babel/Jest transform does not support dynamic import() (TypeError: A dynamic import callback was invoked without --experimental-vm-modules). Deviation documented below."
metrics:
  duration: "~10 minutes"
  completed: "2026-07-14"
---

# Phase 7 Plan 1: Dataset Seam Fetch/Fallback Pipeline Summary

Network fetch of the live `GET /content/verbs` backend with Zod-validated acceptance
and silent, memoized fallback to the bundled local verb dataset.

## What Was Built

**`src/dataset/remote.ts`** — `fetchRemoteVerbs(): Promise<Verb[]>`. Mirrors the
`AbortController` + `setTimeout(90_000)` timeout pattern from `src/feedback/submit.ts`
exactly, GET instead of POST. Rejects (throws, never returns a status object) on
every failure path: non-2xx (`!response.ok`), network error, missing/non-array
`payload.verbs`, `validateDataset()` failure (even on HTTP 200), or a 90s timeout
abort. No catch block inside the function — every failure propagates to the caller,
per the plan's explicit design (single fallback decision point lives in `source.ts`).

**`src/dataset/source.ts`** — `resolveVerbs()`, `prefetch()`, and the `VerbSource`
type (`"remote" | "local"`). A module-level `cachedResult` Promise guard ensures
`fetchRemoteVerbs()` is invoked at most once per app session; both `resolveVerbs()`
and `prefetch()` populate/reuse the same cached promise. The private `resolve()`
helper wraps `fetchRemoteVerbs()` in a single try/catch — remote data flows through
on success, any failure (of any kind) falls through to the bundled `localVerbs`. The
function never rejects past the module boundary. `prefetch()` is fire-and-forget
(does not return the promise), satisfying the non-blocking prefetch-on-load
requirement.

## Tests

- `__tests__/dataset-remote.test.ts` — 7 tests: success (well-shaped 200), non-2xx
  reject, network-error reject, missing-verbs reject, non-array-verbs reject,
  invalid-shape-on-200 reject, 90s timeout reject (fake timers).
- `__tests__/dataset-source.test.ts` — 5 tests: remote success path, local fallback
  on reject, never-rejects guarantee, fetch-called-once memoization across three
  `resolveVerbs()` calls, and `prefetch()` triggering resolution non-blocking.
- Full suite: 134 tests / 13 suites, all green (no regressions).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking issue] Dynamic `import()` unsupported by project's Jest/Babel transform**
- **Found during:** Task 2 (writing `__tests__/dataset-source.test.ts`)
- **Issue:** The plan's suggested test-isolation mechanic ("dynamic `await
  import(...)` inside each test") throws `TypeError: A dynamic import callback was
  invoked without --experimental-vm-modules` under this project's `jest-expo`/Babel
  CommonJS transform — dynamic `import()` requires ESM support this preset doesn't
  enable.
- **Fix:** Used `require("../src/dataset/remote")` / `require("../src/dataset/source")`
  inside each test body instead, combined with `jest.resetModules()` in `afterEach`.
  This achieves the same per-test module-state reset (fresh `cachedResult` guard
  each test) that dynamic import would have, without relying on unsupported ESM
  dynamic-import syntax.
- **Files modified:** `__tests__/dataset-source.test.ts`
- **Commit:** `96d657e`

None of the plan's other guidance required deviation — file boundaries, exports,
memoization mechanics, and error-propagation design all match the plan and its
`07-PATTERNS.md` code samples verbatim.

## Verification

- `npx jest __tests__/dataset-remote.test.ts __tests__/dataset-source.test.ts` — 12/12 passing
- `npx jest` (full suite) — 134/134 passing, 13 suites
- `git diff package.json` — empty, no new dependency added
- `git status` / `git log --name-only` — only `src/dataset/remote.ts`,
  `src/dataset/source.ts`, and their two test files touched; no changes to
  `src/store/` or `app/*.tsx`

## Acceptance Criteria Checks

- `grep -n 'validateDataset(' src/dataset/remote.ts` → found (line 26)
- `grep -c 'catch' src/dataset/remote.ts` → 0
- `grep -n 'signal: controller.signal'` / `'clearTimeout'` in remote.ts → both found
- `grep -c 'AbortSignal.timeout' src/dataset/remote.ts` → 0
- `grep -n 'export function resolveVerbs\|export function prefetch\|export type VerbSource' src/dataset/source.ts` → all three found
- `grep -c 'cachedResult' src/dataset/source.ts` → 6 (declaration + 5 usages)
- `grep -c 'AsyncStorage\|src/store\|from "../app\|from "app/'  src/dataset/source.ts` → 0

## Known Stubs

None. Both modules are fully wired: `fetchRemoteVerbs` performs a real network call
against the live endpoint, and `resolveVerbs`/`prefetch` compose it with the real
bundled `localVerbs` dataset. Neither module is yet consumed by any UI/store code —
that wiring is explicitly out of scope for this plan (Phase 8), not a stub.

## Threat Flags

None beyond what the plan's `<threat_model>` already covers (T-07-01 mitigated via
`validateDataset()` + `Array.isArray` guard in `remote.ts`; T-07-02 mitigated via the
90s `AbortController` timeout; T-07-03 accepted by design in `source.ts`'s silent
fallback).

## Self-Check: PASSED

- FOUND: src/dataset/remote.ts
- FOUND: src/dataset/source.ts
- FOUND: __tests__/dataset-remote.test.ts
- FOUND: __tests__/dataset-source.test.ts
- FOUND commit 84f88b4 (Task 1)
- FOUND commit 96d657e (Task 2)
