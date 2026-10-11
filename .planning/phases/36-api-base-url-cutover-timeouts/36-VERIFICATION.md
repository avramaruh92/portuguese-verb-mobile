---
phase: 36-api-base-url-cutover-timeouts
verified: 2026-10-11T00:00:00Z
status: passed
score: 9/9 must-haves verified
---

# Phase 36 Verification

**Goal:** The app talks only to the Frankfurt API, with Render-cold-boot timeouts, and nothing can silently reintroduce Oregon.

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | All three requests built from shared API_BASE_URL (Frankfurt) | VERIFIED | src/config/api.ts; imported by remote.ts, feedback/submit.ts, productFeedback/submit.ts |
| 2 | Jest fails if Oregon host in src/ or scripts/ | VERIFIED | __tests__/api-host-guard.test.ts walks both dirs; no occurrences in repo grep |
| 3 | preflight targets Frankfurt | VERIFIED | scripts/preflight.ts BASE_URL literal; guard test asserts equal to API_BASE_URL |
| 4 | Content fetch aborts at 15s, falls back | VERIFIED | TIMEOUT_MS = 15_000; test advances 14_999/1 |
| 5 | Feedback and product feedback abort at 45s, network-error | VERIFIED | TIMEOUT_MS = 45_000; tests at 44_999/1 |
| 6 | Content fetch init is only { signal }; 304 rejects | VERIFIED | remote.ts fetch init and !response.ok throw; NET-03 tests present |
| 7 | Four docs have no Oregon host, Frankfurt current | VERIFIED | grep shows only fra host in CLAUDE.md, AGENTS.md, review-notes.md, nutrition-label-answers.md |
| 8 | Nutrition record honest (former Oregon, no fabricated date/SHA) | VERIFIED | line 157 reworded, states not re-run |
| 9 | Preflight exit 0 against Frankfurt | VERIFIED | 36-02-SUMMARY records 4/4 pass at 2026-10-11T12:33:46Z (not re-run, per instruction) |

**Spot-checks:** `npm test` 23 suites / 268 tests pass; `npm run typecheck` clean.

## Requirements Coverage

| ID | Status |
|----|--------|
| API-01 | SATISFIED |
| API-02 | SATISFIED |
| API-03 | SATISFIED (preflight evidence from summary) |
| API-04 | SATISFIED |
| NET-01 | SATISFIED |
| NET-02 | SATISFIED |
| NET-03 | SATISFIED |

All 7 IDs in plans (01: API-01..03, NET-01..03; 02: API-03, API-04) are present in REQUIREMENTS.md; no orphans. Note: REQUIREMENTS.md checkboxes/traceability still show Pending and should be updated by the orchestrator.

## Anti-patterns
None blocking. Preflight keeps its own BASE_URL literal by design, guarded by test. 36-REVIEW.md is advisory.
