# Phase 37 Evidence — Lafa 1.0.1

This document records the build, TestFlight install, real-device E2E and backend handoff for Lafa 1.0.1. It must contain no Apple ID, tester email, device UDID, credentials or API keys.

## Pre-build gates

Gate commit SHA: `1d5fdd1`
Gate time (UTC): 2026-10-11T12:55:45Z

| Gate | Command | Result |
|------|---------|--------|
| typecheck | `npm run typecheck` | exit 0, tsc clean |
| lint | `npm run lint` | exit 0, 0 warnings |
| test | `npm test` | exit 0, 23 suites / 277 tests passed (baseline 23 / 268) |
| expo config | `npx expo config --type public --json` | version 1.0.1, ios.bundleIdentifier com.avram.aruh.lafa |
| Oregon grep | `grep -rn "portuguese-verb-api.onrender.com" src app scripts app.json eas.json` | exit 1, no matches |
| preflight | `npm run preflight` (https://portuguese-verb-api-fra.onrender.com) | exit 0, 4/4 passed: /health 200 266ms, /content/verbs 200 247ms, /feedback 201 178ms, /product-feedback 201 74ms |

## REL-01 — EAS production build

| Field | Value |
|-------|-------|
| EAS build id | `c5c481e4-4ebe-49ea-a32a-7ef76ca87563` |
| Build number (appBuildVersion) | 8 |
| Version | 1.0.1 |
| Profile | production |
| Status | FINISHED |
| gitCommitHash | `caa9aa898989bcbae78fc8cfb81c7d49489850eb` |
| createdAt (UTC) | 2026-10-11T12:57:14Z |
| completedAt (UTC) | 2026-10-11T13:02:30Z |
| Build page | https://expo.dev/accounts/avram.aruh/projects/portuguese-verb-mobile/builds/c5c481e4-4ebe-49ea-a32a-7ef76ca87563 |

Provenance: the gate SHA is `1d5fdd1`; the build commit `caa9aa8` differs from it only by `.planning/` commits (`git diff --stat 1d5fdd1 HEAD -- . ':!.planning'` is empty). Build started without `--auto-submit`.

## REL-02 — TestFlight install

| Field | Value |
|-------|-------|
| Submitted EAS build id | `c5c481e4-4ebe-49ea-a32a-7ef76ca87563` (equals REL-01) |
| `eas submit` outcome | Succeeded |
| App Store Connect status (verbatim) | "Ready to Submit" |
| ASC status observed | 2026-10-11 (before ~15:41Z) |
| Install date | 2026-10-11 |
| TestFlight on device shows | 1.0.1 (8) (matches REL-01 build number 8) |
| Device | iPhone 14 Pro, iOS 26.6.1 at install time |

Installed by an internal tester from TestFlight (not a dev/preview build)

Notes:
- The ASC status "Ready to Submit" is the App Store Connect build status showing the build was processed and is available; the TestFlight install succeeded.
- An OS update to iOS 27.0.1 was requested/pending on the device after install. Plan 37-03 must record the iOS version actually used for E2E.
- The developer subjectively noted the app feels much faster (anecdotal, consistent with the Frankfurt cutover; not evidence).

## E2E-01 — Content from Frankfurt

_Pending — filled by plan 37-03._

## E2E-02 — Report a problem (quiz feedback)

_Pending — filled by plan 37-03._

## E2E-03 — Help us improve (product feedback)

_Pending — filled by plan 37-03._

## E2E-04 — Airplane mode

_Pending — filled by plan 37-03._

## HAND-01 — Backend handoff status line

_Pending — filled by plan 37-04._
