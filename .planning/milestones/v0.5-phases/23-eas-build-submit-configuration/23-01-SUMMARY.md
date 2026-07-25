---
phase: 23-eas-build-submit-configuration
plan: 01
subsystem: infra
tags: [eas, expo, eas-cli, release-config, app-store-connect]

# Dependency graph
requires:
  - phase: 20-native-build-risk-front-loading
    provides: "eas.json bootstrapped via eas build:configure (cli.appVersionSource, build.production.autoIncrement, ITSAppUsesNonExemptEncryption)"
  - phase: 21-release-identity-lock
    provides: "Final release identity (bundleIdentifier com.avram.aruh.lafa, slug/scheme lafa) that this eas.json/app.json build on top of"
provides:
  - "eas.json submit.production.ios.ascAppId placeholder (REPLACE_WITH_ASC_APP_ID) ready for Phase 24 to fill with the real ASC App ID"
  - "Confirmed eas.json cli.appVersionSource/build.production.autoIncrement unchanged (EASCFG-01)"
  - "Confirmed app.json ITSAppUsesNonExemptEncryption: false unchanged (EASCFG-03)"
affects: [24-quality-gates-preflight-first-submit]

# Tech tracking
tech-stack:
  added: []
  patterns: ["eas.json/app.json edit-in-place discipline (hand-edit only the requirement-specific key, never regenerate)"]

key-files:
  created: []
  modified: ["eas.json"]

key-decisions:
  - "D-01: Used all-caps sentinel placeholder REPLACE_WITH_ASC_APP_ID for submit.production.ios.ascAppId since no real ASC App Store Connect record exists yet"
  - "D-02: Left EAS-managed iOS credential defaults and distribution: \"store\" implicit in build.production/submit.production.ios rather than spelling them out"

patterns-established:
  - "Config-file edit discipline: every eas.json/app.json field change traceable to a requirement ID in the commit message, with sibling fields explicitly confirmed unchanged"

requirements-completed: [EASCFG-01, EASCFG-02, EASCFG-03]

# Metrics
duration: 8min
completed: 2026-07-23
---

# Phase 23 Plan 01: EAS Build/Submit Configuration Summary

**Added an `ascAppId` placeholder to `eas.json`'s submit profile; confirmed EASCFG-01 and EASCFG-03 fields were already satisfied by Phase 20's bootstrap with no edit needed.**

## Performance

- **Duration:** 8 min
- **Started:** 2026-07-23T22:20:00Z
- **Completed:** 2026-07-23T22:28:00Z
- **Tasks:** 2 completed
- **Files modified:** 1 (`eas.json`)

## Accomplishments
- `eas.json` `submit.production.ios.ascAppId` now holds `"REPLACE_WITH_ASC_APP_ID"` (EASCFG-02), the only real edit in this plan
- Confirmed `eas.json` `cli.appVersionSource: "remote"` and `build.production.autoIncrement: true` remain present and unchanged (EASCFG-01), satisfied by Phase 20's `eas build:configure` bootstrap
- Confirmed `app.json` `ios.infoPlist.ITSAppUsesNonExemptEncryption: false` remains present and unchanged (EASCFG-03), also satisfied by Phase 20 — no edit was made to `app.json` in this plan

## Task Commits

Each task was committed atomically:

1. **Task 1: Add ascAppId placeholder to eas.json submit profile (EASCFG-01, EASCFG-02)** - `970c278` (feat)
2. **Task 2: Confirm app.json export-compliance flag survives unchanged (EASCFG-03)** - no commit (read-only verification, no file change)

## Files Created/Modified
- `eas.json` - Added `submit.production.ios.ascAppId: "REPLACE_WITH_ASC_APP_ID"` placeholder; all other fields (`cli.version`, `cli.appVersionSource`, `build.development`, `build.preview`, `build.production.autoIncrement`) left byte-for-byte unchanged

## Decisions Made
- Used the exact placeholder string `REPLACE_WITH_ASC_APP_ID` per D-01 — unambiguous all-caps TODO-style sentinel, no real numeric ASC App ID exists yet
- Left `build.production`/`submit.production.ios` with no explicit `credentialsSource` or `distribution` key per D-02, trusting EAS-managed iOS credential defaults (matches Phase 20's "trust `eas build:configure` output as-is" convention)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

**Critical follow-up for Phase 24:** the `ascAppId` placeholder (`REPLACE_WITH_ASC_APP_ID`) in `eas.json`'s `submit.production.ios` section must be replaced with the real numeric App Store Connect App ID before the first real `eas submit` run. This ID is created when the App Store Connect app record for Lafa is set up — Phase 24 is where that record is created and this value gets filled in. `eas submit` will fail or target the wrong app if this placeholder is not replaced first.

## Next Phase Readiness
- `eas.json` and `app.json` have no remaining config gaps for EASCFG-01 through EASCFG-03 — Phase 24 can proceed straight to quality gates, preflight, and the first real build/submit cycle
- Blocker/reminder carried forward: replace `REPLACE_WITH_ASC_APP_ID` with the real ASC App ID in Phase 24 before submitting

---
*Phase: 23-eas-build-submit-configuration*
*Completed: 2026-07-23*
