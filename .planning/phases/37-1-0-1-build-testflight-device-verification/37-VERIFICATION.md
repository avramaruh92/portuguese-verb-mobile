---
phase: 37-1-0-1-build-testflight-device-verification
verified: 2026-10-11T17:00:00Z
status: passed
score: 6/6 must-haves verified
overrides_applied: 0
gaps: []
---

# Phase 37: 1.0.1 Build, TestFlight & Device Verification Report

**Phase Goal:** Lafa 1.0.1 is built, installed from TestFlight, verified on a real device against Frankfurt, and the backend is told it can start its Oregon-deletion gate.
**Status:** passed
**Re-verification:** No (initial)

## Observable Truths

| # | Truth (ROADMAP SC) | Status | Evidence |
|---|---|---|---|
| 1 | EAS production build of 1.0.1, number and id recorded | VERIFIED | `eas build:view c5c481e4-...` independently returned FINISHED, buildProfile production, appVersion 1.0.1, appBuildVersion 8, distribution STORE, gitCommitHash caa9aa8. This matches 37-EVIDENCE.md. Build 8 is at least 7. |
| 2 | Installed on a real device from TestFlight, date recorded | VERIFIED (developer-attested) | The evidence records the submit outcome, the TestFlight version 1.0.1 (8) matching the build number, the device, and the date 2026-10-11. This is not machine-checkable; the developer signed off. |
| 3 | Content loads with no pill; request in Frankfurt logs | VERIFIED (limitation noted) | The evidence records the "content cache filled" line on `portuguese-verb-api-fra` at 16:29:10Z and the pill hidden. There is no HTTP status because the backend disables request logging. The pill-hidden corroboration is sound per `source.ts`, so this is accepted. |
| 4 | Report a problem and Help us improve each return 201, rows exist | VERIFIED | Row ids `cmv41h59s000529axhhzuj7bd` (feedback, 16:30:06Z) and `cmv41gegh000429axzhemkcte` (product feedback, 16:29:32Z), both appVersion 1.0.1. The Frankfurt log timestamps line up with the row createdAt values (within 1s). |
| 5 | Airplane mode: quiz completes, pill shows, feedback fails with Retry | VERIFIED (limitation noted) | The clean retest showed the pill, the 10-question offline quiz completed, and the error state with Retry appeared. The first attempt was a test-setup issue and the evidence does not hide it. The offline submission answer was combined for both modals. This is minor and not contradictory. |
| 6 | Status line appended to the 2026-10-09 entry in backend mobile-handoff.md | VERIFIED | Backend commit eada0fb is a single-file change to docs/mobile-handoff.md. Line 40 contains "Status 2026-10-11 (mobile): Lafa 1.0.1 (build 8, EAS build c5c481e4-...)" with version, build number and date. It is committed locally and not pushed, as intended. |

## Behavioral Checks

| Check | Result |
|---|---|
| `npx expo config --type public --json` | version 1.0.1, bundleIdentifier com.avram.aruh.lafa |
| `npm test` | 23 suites / 277 tests passed |
| Oregon host grep over src, app, scripts, app.json, eas.json | 0 matches |
| `git diff 1d5fdd1 caa9aa8 -- . ':!.planning'` | empty. The built commit is code-identical to the gated commit. The only code change in the phase is the app.json version bump. |

## Requirements Coverage

| ID | Status | Evidence |
|---|---|---|
| REL-01 | SATISFIED | SC1, verified independently via EAS. |
| REL-02 | SATISFIED | SC2, developer-attested and recorded with date. |
| E2E-01 | SATISFIED | SC3, with the noted log limitation. |
| E2E-02 | SATISFIED | SC4, row id and Frankfurt log timestamp. |
| E2E-03 | SATISFIED | SC4, row id and Frankfurt log timestamp. |
| E2E-04 | SATISFIED | SC5, clean retest. |
| HAND-01 | SATISFIED | SC6, verified in the backend repo. |

All 7 IDs map to Phase 37 in REQUIREMENTS.md and are marked complete. No orphaned requirements. REL-03, REL-04 and HAND-02 belong to Phase 38.

## Anti-Patterns

None. The only code change is the app.json version bump, and no TBD, FIXME or XXX markers were introduced.

## Warnings (non-blocking)

- E2E-01 has no HTTP status code for GET /content/verbs; it rests on the app log line plus the hidden pill.
- The offline feedback result was one combined answer for both modals. Both modals share the same submit path and the 45s timeout/network-error handling is unit-tested.
- The backend handoff commit is local only. It must be pushed for the backend to see it; this is out of scope for the phase but is a follow-up.

## Human Verification

None outstanding. The device checkpoints were completed and signed off by the developer, and the recorded evidence is present and consistent.

## Gaps Summary

No gaps. The phase goal is achieved.

_Verifier: Claude (gsd-verifier)_
