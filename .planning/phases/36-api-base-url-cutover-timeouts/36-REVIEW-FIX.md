---
phase: 36-api-base-url-cutover-timeouts
fixed_at: 2026-10-11T14:00:00Z
review_path: .planning/phases/36-api-base-url-cutover-timeouts/36-REVIEW.md
iteration: 1
findings_in_scope: 4
fixed: 3
skipped: 1
status: partial
---

# Phase 36: Code Review Fix Report

**Fixed at:** 2026-10-11T14:00:00Z
**Source review:** .planning/phases/36-api-base-url-cutover-timeouts/36-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 4 (fix_scope: critical_warning, so IN-01 and IN-02 are out of scope)
- Fixed: 3
- Skipped: 1

Gates after all fixes: `npm run typecheck` passed, `npm run lint` passed, and `npm test` passed (23 suites, 277 tests). `npm run preflight` was not run because it writes rows to the live backend.

## Fixed Issues

### WR-01: 15s content timeout plus a never-retried cache makes a cold boot cost the whole session

**Files modified:** `src/dataset/source.ts`, `src/store/useQuizStore.ts`, `src/components/OfflinePill.tsx`, `app/quiz.tsx`, `app/results.tsx`, `__tests__/dataset-source.test.ts`, `__tests__/useQuizStore.test.ts`
**Commit:** 7f1fb29
**Status:** fixed: requires human verification (this changes caching logic)
**Applied fix:** I did not clear the cache on failure as the review suggested, because that would make every later quiz start block for up to 15s again. Instead, a cached `"local"` result now works as stale-while-revalidate:
- `resolveVerbs()` still returns the local result immediately.
- It also starts one background `fetchRemoteVerbs()` retry. Only one retry runs at a time.
- If the retry succeeds, remote content is cached and the next call gets it.
- A cached remote result is never fetched again.

FETCH-04 still holds: the store snapshots verbs, learning and `source` at `startQuiz`. To keep OfflinePill consistent, the quiz and results screens now pass the snapshotted `source` to `<OfflinePill source={...} />`. This means a retry that succeeds mid-session cannot hide the pill while the session is still running on bundled content. The setup screen keeps the live resolver behavior. `src/dataset` stays framework-free. New tests cover:
- the immediate local return plus a background retry
- the single in-flight retry
- a failed retry followed by a later retry
- no refetch after a remote result
- the store's `source` snapshot

### WR-03: The Oregon host guard skips `app/`, root config files and other runtime-read locations

**Files modified:** `__tests__/api-host-guard.test.ts`
**Commit:** a613c26
**Applied fix:**
- The guard now walks `src`, `scripts` and `app`.
- It also checks `app.json`, `package.json` and `eas.json` when they exist.
- `walk()` resolves symlinks explicitly with `isSymbolicLink()` and `statSync`, so a symlinked directory is traversed instead of throwing `EISDIR`.

### WR-04: Preflight still uses a 90s timeout, so it can pass when the app would fall back

**Files modified:** `scripts/preflight.ts`
**Commit:** 7f004d1
**Status:** fixed: requires human verification (not run against the live backend)
**Applied fix:**
- The 90s overall abort stays.
- Each check now records elapsed time and fails if it goes over its budget:
  - `/content/verbs`: 15s (NET-01)
  - `/feedback` and `/product-feedback`: 45s (NET-02)
  - `/health`: no budget beyond the 90s abort, so it absorbs any cold boot before the budgeted checks run.
- The output now shows `status in Nms`.
- There are still exactly four network calls. A warm, healthy Frankfurt should still exit 0. Confirm this on the next real preflight run.

## Skipped Issues

### WR-02: 45s feedback timeout is shorter than cold boot plus observed latency, and Retry can create duplicate rows

**File:** `src/feedback/submit.ts:5`, `src/productFeedback/submit.ts:5`
**Reason:** Both remedies the review suggests are out of bounds:
- Raising the timeout breaks NET-02, which locks both feedback timeouts at exactly 45s.
- An idempotency key would need a backend change to the `POST /feedback` and `/product-feedback` contract, and this mobile-only fix must not touch that contract.

I found no client-only mitigation that prevents a duplicate row without changing the payload or the timeout. Aborting on the client cannot cancel the server-side insert. The NET-02 rationale in REQUIREMENTS.md (45s "covers" 40s cold boot + 11s latency) is still arithmetically wrong. Correcting that wording, or raising the timeout or adding idempotency, needs a product or requirements decision.
**Original issue:** A submit that lands on a cold instance can abort on the client after 45s while the server still inserts the row. Retry then posts the same payload again and creates a duplicate row.

---

_Fixed: 2026-10-11T14:00:00Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
