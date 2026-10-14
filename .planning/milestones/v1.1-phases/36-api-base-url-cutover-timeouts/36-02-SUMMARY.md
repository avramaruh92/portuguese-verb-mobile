---
phase: 36-api-base-url-cutover-timeouts
plan: 02
subsystem: docs
tags: [docs, frankfurt-cutover, preflight]
requires: [36-01]
provides:
  - "Docs present Frankfurt as the current API host"
  - "Live preflight gate passed against Frankfurt"
affects: [CLAUDE.md, AGENTS.md, store/metadata/review-notes.md, store/privacy/nutrition-label-answers.md]
key-files:
  created: []
  modified: [CLAUDE.md, AGENTS.md, store/metadata/review-notes.md, store/privacy/nutrition-label-answers.md]
decisions:
  - "Nutrition-label 2026-08-17 verification kept as a historical record against the former Oregon service; no new date or SHA invented"
requirements-completed: [API-03, API-04]
duration: ~5min
completed: 2026-10-11
---

# Phase 36 Plan 02: Doc Cutover and Live Preflight Summary

The four user/agent-facing docs now name https://portuguese-verb-api-fra.onrender.com as the current API, and the live preflight gate passed 4/4 against Frankfurt.

## Commits
- f572f1a: docs - CLAUDE.md, AGENTS.md, review-notes.md, nutrition-label-answers.md point at Frankfurt

## Verification
- No `portuguese-verb-api.onrender.com` literal remains in the four docs; review-notes.md has 4 Frankfurt URL matches, CLAUDE.md and AGENTS.md 1 each.
- Nutrition-label line reworded to the "former Oregon service"; 2026-08-17 date and f06c46b SHA unchanged.
- Live preflight (Task 2, human-verify): user approved, run once from main at 2026-10-11T12:33:46Z. Writes two dummy rows labelled "preflight smoke test — ignore".

```
> portuguese-verb-mobile@1.0.0 preflight
> node scripts/preflight.ts

PASS /health -> 200
PASS /content/verbs -> 200
PASS /feedback -> 201
PASS /product-feedback -> 201
4/4 checks passed
```
Exit code: 0

## Deviations from Plan
None. Task 2 was run by the orchestrator on main after user approval rather than by a continuation agent.

## Self-Check: PASSED
