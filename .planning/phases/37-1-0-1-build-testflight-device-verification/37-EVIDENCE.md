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

_Pending — filled by plan 37-02._

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
