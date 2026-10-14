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

Build: 1.0.1 (8), device: iPhone 14 Pro, iOS 27.0.1 (OS update completed before E2E; REL-02 recorded 26.6.1 at install time), date: 2026-10-11

Render times were reported in local WEST (UTC+1); UTC in brackets.

- Cold start (online): ~17:29 WEST.
- "Using saved content" pill: absent (stayed hidden on the setup screen and during the quiz).
- Render service: `portuguese-verb-api-fra`. Frankfurt log stream line "content cache filled" at 17:29:10 WEST (16:29:10Z). No HTTP status code was reported for GET /content/verbs.
- Corroboration: the pill staying hidden only happens (per `src/components/OfflinePill.tsx` and `src/dataset/source.ts`) when the remote GET /content/verbs succeeded and validated.
- Frankfurt log line for POST /product-feedback ("product feedback submitted"): 17:29:32 WEST (16:29:32Z).
- Frankfurt log line for POST /feedback ("feedback submitted"): 17:30:06 WEST (16:30:06Z).
- Both submitted rows persisted with appVersion 1.0.1 (see E2E-02 and E2E-03).

Content evidence method: Render log stream (application info line "content cache filled"), NOT the HTTP request log view or the Metrics graph. Known limitation: no HTTP status code was captured for GET /content/verbs, because the backend sets disableRequestLogging and the content route does not log per request; the "content cache filled" app line plus the hidden pill is the evidence.

Informational (not part of verdict): Oregon service (`portuguese-verb-api`) observation: not checked.

**Verdict:** PASS

## E2E-02 — Report a problem (quiz feedback)

Build: 1.0.1 (8), device: iPhone 14 Pro, iOS 27.0.1, date: 2026-10-11

- Success state shown (only appears on HTTP 201).
- feedback_reports row id: `cmv41h59s000529axhhzuj7bd`
- appVersion: 1.0.1
- createdAt: 2026-10-11 16:30:06.832 (UTC)

**Verdict:** PASS

## E2E-03 — Help us improve (product feedback)

Build: 1.0.1 (8), device: iPhone 14 Pro, iOS 27.0.1, date: 2026-10-11

- Success state shown (only appears on HTTP 201).
- product_feedback_reports row id: `cmv41gegh000429axzhemkcte`
- appVersion: 1.0.1
- createdAt: 2026-10-11 16:29:32.081 (UTC)

**Verdict:** PASS

## E2E-04 — Airplane mode

Build: 1.0.1 (8), device: iPhone 14 Pro, iOS 27.0.1, date: 2026-10-11

- First attempt: the "Using saved content" pill did NOT appear. Likely test-setup issue: the app was not fully swiped away so the in-memory remote result from the online run was reused, and/or Wi-Fi was still on. Not treated as an app defect.
- Clean retest: airplane mode on, Wi-Fi verified off, Lafa swiped away and reopened, waited ~20s. The "Using saved content" pill APPEARED. The verdict is based on this clean retest.
- A full 10-question quiz was completed offline; the results screen showed 10/10.
- Offline submissions: the developer gave a single combined answer covering both "Report a problem" and "Help us improve": an error state with "Retry submission" appeared fast (under 1 second), with no crash or freeze. Recorded as reported for both modals; it was one combined answer, not separate per-modal timings.
- Anecdotal only (not evidence): online the app "works perfectly with almost no waiting".

**Verdict:** PASS

## HAND-01 — Backend handoff status line

| Field | Value |
|-------|-------|
| Backend repo | `portuguese-verb-backend` (branch main) |
| Backend commit | `eada0fb` |
| Commit date | 2026-10-11 |
| File | `docs/mobile-handoff.md` (single-file commit; also bumps `last_updated` to "2026-10-11") |

Status line appended to the 2026-10-09 entry, quoted exactly:

> **Status 2026-10-11 (mobile):** Lafa 1.0.1 (build 8, EAS build c5c481e4-4ebe-49ea-a32a-7ef76ca87563) is live on TestFlight with the Frankfurt base URL, installed 2026-10-11 and verified on a real device (content from Frankfurt, both feedback POSTs 201, offline fallback OK). The REGION-05 deletion clock can start. App Store 1.0.0 installs still call the old URL until 1.0.1 is live on the App Store; mobile will append a second status line then.

Committed locally in portuguese-verb-backend; not pushed by this plan.

## Phase 37 result

| Requirement | Verdict | Section |
|-------------|---------|---------|
| REL-01 | PASS | REL-01 — EAS production build |
| REL-02 | PASS | REL-02 — TestFlight install |
| E2E-01 | PASS | E2E-01 — Content from Frankfurt |
| E2E-02 | PASS | E2E-02 — Report a problem (quiz feedback) |
| E2E-03 | PASS | E2E-03 — Help us improve (product feedback) |
| E2E-04 | PASS | E2E-04 — Airplane mode |
| HAND-01 | PASS | HAND-01 — Backend handoff status line |
