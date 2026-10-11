---
phase: 36-api-base-url-cutover-timeouts
plan: 01
subsystem: network
tags: [api, timeouts, frankfurt-cutover]
requires: []
provides:
  - "Shared API_BASE_URL (Frankfurt) in src/config/api.ts"
  - "Oregon-host regression guard test"
affects: [src/dataset/remote.ts, src/feedback/submit.ts, src/productFeedback/submit.ts, scripts/preflight.ts]
key-files:
  created: [src/config/api.ts, __tests__/api-host-guard.test.ts]
  modified: [src/dataset/remote.ts, src/feedback/submit.ts, src/productFeedback/submit.ts, scripts/preflight.ts, __tests__/dataset-remote.test.ts, __tests__/feedback-submit.test.ts, __tests__/productFeedback-submit.test.ts]
decisions:
  - "Per-file TIMEOUT_MS kept separate: content 15s, feedback x2 45s"
  - "preflight.ts keeps its own self-contained BASE_URL literal, kept in sync via guard test"
requirements-completed: [API-01, API-02, API-03, NET-01, NET-02, NET-03]
duration: ~10min
completed: 2026-10-11
---

# Phase 36 Plan 01: API Base-URL Cutover and Timeouts Summary

All app requests now go to https://portuguese-verb-api-fra.onrender.com via one shared API_BASE_URL constant, with a 15s content timeout, 45s feedback timeouts, and tests that lock this in.

## Commits
- 6748ea6: feat - API_BASE_URL, rewired three network modules, timeouts, preflight literal
- 1c00484: test - api-host-guard test
- (third) test - updated dataset-remote, feedback-submit, productFeedback-submit tests (exact URLs, 14_999/44_999 boundary checks, NET-03 init is exactly { signal }, 304 rejects)

## Verification
- npm test: 23 suites, 268 tests pass; npm run typecheck clean; npm run lint clean.
- Guard sanity check: appending the Oregon host to src/config/api.ts made "no Oregon host in src/" fail (1 failed, 3 passed); reverted before commit.
- `npm run preflight` was NOT run (hits live backend; gated in 36-02).

## Deviations from Plan
None in code. Environment note: the worktree had no node_modules, so a symlink to the main checkout's node_modules was created (untracked, not committed).

## Self-Check: PASSED
