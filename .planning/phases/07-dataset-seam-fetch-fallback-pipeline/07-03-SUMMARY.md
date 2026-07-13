---
phase: 07-dataset-seam-fetch-fallback-pipeline
plan: 03
subsystem: cross-repo-contract
tags: [fetch, backend-contract, checkpoint]

requires:
  - phase: 07-dataset-seam-fetch-fallback-pipeline
    provides: fetchRemoteVerbs() built in 07-01, validates against src/dataset/validate.ts
provides:
  - Live-endpoint smoke check result for GET /content/verbs — confirmed matching
affects: [phase-8-async-startQuiz]

tech-stack:
  added: []
  patterns: []

key-files:
  created: []
  modified: []

key-decisions:
  - "RESOLVED: live GET /content/verbs returns 200 with { verbs: [...] } × 50, shape confirmed identical to src/dataset/types.ts and passes the app's actual validateDataset() (zod) — no drift"
  - "Initial 404 (2026-07-14, first check) was caused by the backend's main branch never being pushed to origin — only the v0.1 tag was pushed, so Render deployed pre-v0.1 code with no /content/verbs route. Fixed by backend team pushing origin main; not a contract mismatch."

patterns-established: []

requirements-completed: [FETCH-01]

duration: 5min
completed: 2026-07-14
---

# Phase 07 Plan 03: Live Endpoint Contract Smoke Check — RESOLVED

**The live backend's `GET /content/verbs` returns 50 verbs in the exact shape the app expects, verified by running the actual payload through `validateDataset()`.**

## What was checked (final, after backend fix)

```
GET https://portuguese-verb-api.onrender.com/content/verbs → HTTP 200
```

- Top-level shape: `{ "verbs": [...] }` — object with a `verbs` array, 50 entries.
- First entry keys: `verb`, `translation`, `isIrregular` (camelCase, not `is_irregular`), `conjugations`.
- `conjugations` tense keys: `present_indicative`, `preterite`, `imperfect`, `future`.
- Each tense's subject keys: `eu`, `tu`, `ele_ela`, `nos`, `voces`, `eles_elas`, all non-empty strings.
- Ran the live payload through the app's real `validateDataset()` (from `src/dataset/validate.ts`,
  the same Zod schema `fetchRemoteVerbs()` uses) in a throwaway Jest test: **all 50 verbs pass, zero
  validation errors.**

## Root cause of the earlier 404 (first check, same day)

Not a field-name/casing contract drift as anticipated by research Pitfall 4 / A1. The backend team
had pushed the `v0.1` git tag but never pushed the `main` branch itself — 53 commits (Phase 6, 7, 8,
and the milestone close, including the `/content/verbs` route) were local-only on their side. Render
auto-deploys from `main` pushes, so the live service was still running pre-v0.1 code with no
`/content/verbs` route at all. Fixed by `git push origin main`; Render redeployed; endpoint now live
and correctly shaped.

## Status: RESOLVED — checkpoint passed

FETCH-01's live path is now confirmed exercised in production, not just unit-tested against mocks.
`fetchRemoteVerbs()` will now resolve real remote data on a healthy connection; `resolveVerbs()`
still falls back to local on any transient failure (FETCH-03, unaffected by this checkpoint).

No production code changes required — the contract matches `src/dataset/types.ts` /
`src/dataset/validate.ts` exactly as authored in 07-01.
