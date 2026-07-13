---
phase: 07-dataset-seam-fetch-fallback-pipeline
plan: 03
subsystem: cross-repo-contract
tags: [fetch, backend-contract, checkpoint]

requires:
  - phase: 07-dataset-seam-fetch-fallback-pipeline
    provides: fetchRemoteVerbs() built in 07-01, validates against src/dataset/validate.ts
provides:
  - Live-endpoint smoke check result for GET /content/verbs
affects: [phase-8-async-startQuiz, backend-content-endpoint]

tech-stack:
  added: []
  patterns: []

key-files:
  created: []
  modified: []

key-decisions:
  - "BLOCKED: live GET /content/verbs returns 404, not the expected { verbs: [...] } envelope — phase completion paused pending backend confirmation"

patterns-established: []

requirements-completed: []  # BLOCKED — see status below; FETCH-01's live path is unverified

duration: 5min
completed: 2026-07-14
---

# Phase 07 Plan 03: Live Endpoint Contract Smoke Check — BLOCKED

**The live backend does not expose `GET /content/verbs` at all (404 Not Found), so FETCH-01's live path is unverified and the checkpoint is not resolved.**

## What was checked

```
GET https://portuguese-verb-api.onrender.com/content/verbs
→ HTTP 404
→ {"message":"Route GET:/content/verbs not found","error":"Not Found","statusCode":404}
```

Confirmed the backend itself is reachable and running (not a Render cold-start/timeout issue):

```
GET https://portuguese-verb-api.onrender.com/health → HTTP 200 {"status":"ok"}
```

Also probed nearby path variants, all 404:
- `GET /verbs`
- `GET /api/content/verbs`

## Assessment

This is **not** the field-name/casing drift the plan anticipated (research Pitfall 4 / A1) — it's a missing route. The endpoint assumed by D-01 (`GET /content/verbs`) is either:
- not yet deployed on `portuguese-verb-api`,
- deployed under a different path, or
- gated behind a different HTTP method/auth this check didn't try.

**App-side safety is unaffected:** `fetchRemoteVerbs()` (07-01) correctly throws on this 404 (`!response.ok`), and `resolveVerbs()` silently falls back to the bundled local dataset (FETCH-03) — no user-facing break. But the remote path is effectively dead code in production until this is resolved, since it will always fail closed to local.

## Status: BLOCKED — human decision required

Per user instruction (2026-07-14): **pause phase completion**. This plan and Phase 07 overall
are not being marked complete. Do not treat FETCH-01's live-path acceptance criterion as satisfied.

## Next step

Confirm with the `portuguese-verb-api` (backend) repo/team:
1. Is `GET /content/verbs` deployed on the live Render service?
2. If deployed under a different path, what is the correct path?
3. If not yet deployed, what phase/milestone ships it?

Once confirmed, re-run this checkpoint's curl check against the corrected endpoint (or wait for
deploy) before closing out Phase 07.
