---
phase: 08-async-quiz-start-dataset-snapshot
fixed_at: 2026-07-14T16:15:33Z
review_path: .planning/phases/08-async-quiz-start-dataset-snapshot/08-REVIEW.md
iteration: 1
findings_in_scope: 4
fixed: 4
skipped: 0
status: all_fixed
---

# Phase 08: Code Review Fix Report

**Fixed at:** 2026-07-14T16:15:33Z
**Source review:** .planning/phases/08-async-quiz-start-dataset-snapshot/08-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 4 (Critical + Warning; fix_scope = critical_warning; IN-01 excluded)
- Fixed: 4
- Skipped: 0

## Fixed Issues

### CR-01: `app/index.tsx` swallows no exceptions from `startQuiz` — unexpected errors become unhandled promise rejections with no user feedback

**Files modified:** `app/index.tsx`
**Commit:** c6536dc
**Applied fix:** Added a `catch` block to `handleStartQuiz` (previously `try { ... } finally { ... }` with no `catch`). Unexpected errors are now caught and surfaced via a new local `unexpectedError` state, rendered in the existing error-text style below the form, instead of propagating as an unhandled promise rejection. `setUnexpectedError(null)` is called at the start of each attempt so stale errors from a previous attempt don't linger.

### CR-02: `app/results.tsx` has no error handling for `startQuiz` failures and renders a dead-end blank screen when `session` is null

**Files modified:** `app/results.tsx`
**Commit:** eda413b
**Applied fix:** Replaced the `if (!session) return null;` dead end with a fallback view that reads `status`/`errorMessage` from the store (for the handled `InsufficientVerbsError` path) and a new local `unexpectedError` state (for unexpected `startQuiz` failures), and always offers a "Back to Setup" button so the user is never stuck on a blank screen. `handleTryAgain` now has a `catch` block that sets `unexpectedError` instead of letting the exception become an unhandled rejection. Added the `errorText` style (mirroring the one already used in `app/index.tsx`) since it did not previously exist in this file.

### WR-01: `startQuiz`'s error branch leaves stale `currentIndex`/`answers`/`lockedChoice`/`filters` in place

**Files modified:** `src/store/useQuizStore.ts`
**Commit:** 65d7392
**Applied fix:** Extended the `InsufficientVerbsError` branch's `set(...)` call to also reset `filters: options`, `currentIndex: 0`, `answers: []`, and `lockedChoice: null`, matching the reviewer's suggested fix exactly. Verified the existing `useQuizStore.test.ts` suite (15 tests) still passes — no test asserted the old stale-field behavior.

### WR-02: `startQuiz` has no guard against concurrent/out-of-order invocations

**Files modified:** `src/store/useQuizStore.ts`
**Commit:** 1ab3f1b
**Applied fix:** Added a module-level incrementing `startToken` counter. Each `startQuiz` call captures its own token at entry; after the `await resolveVerbs()` resolves, both the success path and the catch path check `token !== startToken` and bail out early (`return`) if a newer call has since started, so a stale/superseded call can no longer overwrite state set by a more recent call. Verified against the full `useQuizStore.test.ts` suite (15 tests, all passing) and a project-wide `tsc --noEmit` type check (no errors).

## Skipped Issues

None — all in-scope findings were fixed.

**Note:** IN-01 (`app/results.tsx` — `handleShare` silently discards all share errors) was intentionally excluded because `fix_scope` for this run is `critical_warning`, which excludes Info-tier findings.

---

_Fixed: 2026-07-14T16:15:33Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
