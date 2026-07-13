# Phase 7: Dataset Seam & Fetch/Fallback Pipeline - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-13
**Phase:** 7-Dataset Seam & Fetch/Fallback Pipeline
**Areas discussed:** Fetch timing/trigger, Timeout & cold-start tolerance, Per-session caching

---

## Fetch timing/trigger

| Option | Description | Selected |
|--------|-------------|----------|
| Prefetch on app load, use whatever's ready by Start Quiz | Fetch kicks off at app open; Start Quiz never waits on network, uses whatever resolveVerbs() currently holds | ✓ |
| Fetch only at quiz-start, block Start until resolved | No prefetch; Start Quiz button shows a loading state until the resolver settles | |
| Both: prefetch on load AND re-check at quiz-start | Prefetch on load, plus a fresh attempt at quiz-start if not yet resolved | |

**User's choice:** Prefetch on app load, use whatever's ready by Start Quiz (recommended option)
**Notes:** None — recommended option selected directly.

---

## Timeout & cold-start tolerance

| Option | Description | Selected |
|--------|-------------|----------|
| Long timeout, cold-start tolerant (~90s, matches feedback) | Same ~90s grace as POST /feedback since the fetch is non-blocking | ✓ |
| Short timeout (~8-10s), fail fast to local | Give up quickly and commit to local fallback for the rest of the session | |

**User's choice:** Long timeout, cold-start tolerant (~90s, matches feedback) (recommended option)
**Notes:** Framed around the fact that prefetch-on-load (previous decision) removes any UX cost from a long timeout, since it no longer blocks Start Quiz.

---

## Per-session caching

| Option | Description | Selected |
|--------|-------------|----------|
| Reuse the resolved result for the whole session | One fetch attempt at app load; result reused for every startQuiz() until relaunch | ✓ |
| Re-fetch fresh on every quiz start | Each Start Quiz tap triggers a new fetch attempt with its own fallback | |

**User's choice:** Reuse the resolved result for the whole session (recommended option)
**Notes:** Matches REQUIREMENTS.md's explicit "fetch once per app session" scope.

---

## Claude's Discretion

- Exact module structure/file naming (e.g. `src/dataset/remote.ts` vs
  `src/dataset/source.ts` split, per ARCHITECTURE.md's suggestion).
- Whether the resolver's public API is a sync getter + fire-and-forget
  prefetch trigger, or a single memoized async function — as long as it
  satisfies the locked behavioral decisions (non-blocking startQuiz, fetch-
  once-per-session).

## Deferred Ideas

None — discussion stayed within phase scope. (The querer.isIrregular
reconciliation and the "skip the mock, use the real live endpoint" decision
were both already resolved in the prior conversation turn, before this
discuss-phase session started — carried into CONTEXT.md as D-01/D-02 rather
than re-discussed here.)
