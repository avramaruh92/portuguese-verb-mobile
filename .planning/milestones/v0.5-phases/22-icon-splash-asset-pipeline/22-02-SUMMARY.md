---
phase: 22-icon-splash-asset-pipeline
plan: 02
subsystem: infra
tags: [expo, app.json, ios-icon, icon-composer]

requires:
  - phase: 21-release-identity-lock
    provides: locked bundleIdentifier/slug/scheme (com.avram.aruh.lafa / lafa)
provides:
  - "Removal of the SDK 54+ Icon Composer `.icon` bundle adoption"
  - "app.json ios block with no icon override, flat expo.icon PNG as sole iOS icon source"
affects: [22-03, 22-04]

tech-stack:
  added: []
  patterns: []

key-files:
  created: []
  modified:
    - app.json
    - assets/expo.icon (deleted)

key-decisions:
  - "Un-adopted the Icon Composer bundle per D-07 — regenerating a proper multi-appearance bundle needs macOS-only Icon Composer tooling not used here; flat PNG is simpler and sufficient"

patterns-established: []

requirements-completed: [ICON-02]

duration: 5min
completed: 2026-07-23
---

# Phase 22 Plan 02: Icon Composer Bundle Removal Summary

**Deleted the `assets/expo.icon/` Icon Composer bundle and its `ios.icon` app.json reference so the flat `expo.icon` PNG (`./assets/images/icon.png`) is the sole iOS app-icon source.**

## Performance

- **Duration:** ~5 min
- **Tasks:** 1
- **Files modified:** 4 (app.json, plus 3 deleted files under assets/expo.icon/)

## Accomplishments
- Removed the `"icon": "./assets/expo.icon"` line from `app.json`'s `expo.ios` block
- Deleted the entire `assets/expo.icon/` Icon Composer bundle directory (`icon.json` + `Assets/`)
- Confirmed `bundleIdentifier`, `buildNumber`, `infoPlist`, and the `expo-splash-screen` plugin config are all unchanged

## Task Commits

1. **Task 1: Remove ios.icon key and delete the Icon Composer bundle** - `f5c5d85` (feat)

## Files Created/Modified
- `app.json` - removed `ios.icon` key; top-level `expo.icon` (`./assets/images/icon.png`) is now the sole iOS icon source
- `assets/expo.icon/` - deleted (Icon Composer bundle: `icon.json`, `Assets/grid.png`, `Assets/expo-symbol 2.svg`)

## Decisions Made
None - followed plan as specified (D-07 already locked the un-adopt decision in CONTEXT.md).

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- ICON-02 satisfied: `app.json` has no `ios.icon` key, `assets/expo.icon/` no longer exists, flat `expo.icon` PNG governs the iOS app icon.
- Ready for subsequent 22-xx plans (icon generation from `assets/brand/lafa-logo-v2.svg`, splash screen work).

---
*Phase: 22-icon-splash-asset-pipeline*
*Completed: 2026-07-23*

## Self-Check: PASSED
