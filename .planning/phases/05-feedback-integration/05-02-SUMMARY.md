---
phase: 05-feedback-integration
plan: 02
subsystem: feedback
tags: [fetch, abortcontroller, network, tdd]
dependency-graph:
  requires: [05-01]
  provides: [submitFeedback]
  affects: [05-03]
tech-stack:
  added: []
  patterns: [manual-settimeout-abortcontroller-timeout, typed-failure-over-throw, rn-decoupled-network-module]
key-files:
  created:
    - src/feedback/submit.ts
    - __tests__/feedback-submit.test.ts
  modified: []
decisions: []
metrics:
  duration: ~10 min
  completed: 2026-07-13
---

# Phase 05 Plan 02: Feedback Network Transport Summary

`submitFeedback(payload)` — the app's first outbound network call, POSTing to the live `POST /feedback` backend with a manual 90s `setTimeout` + `AbortController` timeout (not `AbortSignal.timeout`, which is unimplemented on Hermes) and status-branching into a `SubmitResult` discriminated union.

## What Was Built

- `src/feedback/submit.ts` — `submitFeedback(payload: FeedbackPayload): Promise<SubmitResult>`. Creates an `AbortController`, arms a `setTimeout(() => controller.abort(), 90_000)`, POSTs JSON to `https://portuguese-verb-api.onrender.com/feedback` with `signal: controller.signal`. Branches on response status: `201` → `{ status: "success", data: await response.json() }`; `400` → `{ status: "validation-error" }` (body never read/parsed, per D-06); anything else (500, 503, etc.) → `{ status: "server-error" }`. `catch` (covers both real network failure and abort-triggered rejection) → `{ status: "network-error" }`. `finally` always clears the timeout. No RN or `useQuizStore` imports — pure `fetch`/`AbortController` module, fully decoupled from quiz lifecycle (FDBK-03 defense).

## Tests

- `__tests__/feedback-submit.test.ts` — 6 tests covering all required branches: 201 success (with returned data), 400 validation-error (asserts no `fields` leak into the result), 500 server-error, 503-as-server-error (any non-201/400 collapses the same way), fetch-reject network-error, and the fake-timer 90s timeout case (mock `fetch` returns a never-resolving promise that only rejects when the `AbortSignal`'s `abort` event fires; `jest.advanceTimersByTime(90_000)` triggers it — no real wall-clock wait).
- Full suite: 11 suites / 122 tests passing. `npx tsc --noEmit` zero errors.

## TDD Gate Compliance

RED → GREEN followed:
- RED: `3309608` (test, confirmed failing — `Cannot find module '../src/feedback/submit'`)
- GREEN: `a8818b7` (feat, implementation + a small test-only fix swapping `global.fetch` for `globalThis.fetch` to satisfy strict `tsc` under the `types: ["jest"]` tsconfig — no `global` ambient type is declared in this project's tsconfig, only `globalThis` resolves)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking issue] `global.fetch` doesn't type-check under this project's strict tsconfig**
- **Found during:** Task 1 acceptance criteria (`npx tsc --noEmit` check)
- **Issue:** The test file initially used `global.fetch = ...` (a common Jest pattern), but this project's `tsconfig.json` only declares `"types": ["jest"]` with no Node `@types/node` global augmentation, so `global` is not a recognized identifier under strict mode — `tsc` reported `TS2304: Cannot find name 'global'` across all 8 usages.
- **Fix:** Replaced all `global.fetch` references with `globalThis.fetch`, which is a standard ECMAScript global already typed by `lib.dom.d.ts`/`lib.es2020.d.ts` pulled in via `expo/tsconfig.base`. Behaviorally identical — Jest's `jest-expo` environment mutates the same underlying global object either way.
- **Files modified:** `__tests__/feedback-submit.test.ts`
- **Commit:** `a8818b7` (folded into the GREEN commit alongside the implementation, since it was discovered only when running the full acceptance-criteria check after GREEN)

## Known Stubs

None. `submitFeedback` is fully implemented per the plan's Pattern 1 spec, no placeholder branches.

## Threat Flags

None — this plan implements exactly the network transport already registered in the plan's own `<threat_model>` (T-05-02 information disclosure, T-05-03 DoS/hung-request). No new surface introduced beyond what was scoped: the 400/500 branches never parse or surface response bodies, and the manual timeout bounds the request per plan.

## Self-Check: PASSED

- FOUND: src/feedback/submit.ts
- FOUND: __tests__/feedback-submit.test.ts
- FOUND commit: 3309608
- FOUND commit: a8818b7
