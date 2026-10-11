---
phase: 29-brand-validation-release-verification
plan: 02
subsystem: release
tags: [eas, ios, brand, uat, release-verification]

requires:
  - phase: 29-01
    provides: scripts/validate-brand.ts automated config/asset gate (VALID-01, VALID-02)
provides:
  - HUMAN-UAT.md checklist covering all four VALID-03 criteria with a dated developer sign-off
  - A confirmed-clean `npm ci` (EAS build server install path), fixing a lockfile/package.json drift that blocked the preview build
affects: [release, ci]

tech-stack:
  added: []
  patterns: []

key-files:
  created:
    - .planning/phases/29-brand-validation-release-verification/HUMAN-UAT.md
  modified:
    - package-lock.json

key-decisions:
  - "Split execution across two sessions: authored HUMAN-UAT.md and paused before the real EAS build/device verification, since those require the developer physically present with a device and EAS credentials"
  - "Fixed a pre-existing package.json/package-lock.json drift (react-native 0.86.2 declared vs 0.86.0 locked) discovered when the EAS build's `npm ci` failed with ERESOLVE — local `npm install` had silently tolerated the drift, but `npm ci` does not"

patterns-established: []

requirements-completed: [VALID-03]

duration: ~15min (across two sessions, excluding EAS cloud build wait time)
completed: 2026-08-15
---

# Phase 29 Plan 02: EAS Preview Build + Human Brand Verification Summary

**Dated developer sign-off on a real EAS preview build confirming the Lafa rebrand (splash, icon, palette) renders correctly outside Expo Go, after fixing a lockfile drift that was blocking the build**

## Performance

- **Duration:** ~15 min of active work (split across two sessions; excludes EAS cloud build queue/compile time and device inspection)
- **Completed:** 2026-08-15
- **Tasks:** 3/3
- **Files modified:** 2 (HUMAN-UAT.md, package-lock.json)

## Accomplishments
- Authored `HUMAN-UAT.md` in the Phase 28 house style: 5 sections covering build/install, cold-launch splash color, iOS icon design, Android adaptive-icon mask fit (no Android build required), and cross-screen palette consistency
- Diagnosed and fixed a blocking `npm ci` ERESOLVE failure on EAS's build server (package.json declared `react-native@0.86.2`, package-lock.json was still pinned at `0.86.0` from an earlier incomplete patch bump) — regenerated the lockfile and verified `npm ci`, full test suite, typecheck, lint, and `validate-brand` all pass clean
- Produced and installed an EAS `preview`-profile iOS build (build ID `f86867ab-5f84-4ec4-83ca-ad0fe26b563b`), recorded its URLs/build ID/timestamp in HUMAN-UAT.md
- Developer confirmed all five checklist items on the installed build and replied "approved"; HUMAN-UAT.md's status line now reads `**Status: APPROVED by developer, 2026-08-15.**`

## Task Commits

Each task was committed atomically:

1. **Task 1: Author HUMAN-UAT.md for VALID-03** - `b2b000a` (docs)
2. **Task 2: Produce the iOS EAS preview build** - `a965e30` (docs — build details recorded); blocking fix along the way: `410e401` (fix — package-lock.json drift)
3. **Task 3: Capture developer sign-off in HUMAN-UAT.md** - see plan metadata commit below

**Plan metadata:** (this commit)

## Files Created/Modified
- `.planning/phases/29-brand-validation-release-verification/HUMAN-UAT.md` - VALID-03 checklist + build record + dated approval
- `package-lock.json` - regenerated to match package.json's react-native@0.86.2 (was drifted at 0.86.0), unblocking `npm ci` on EAS's build server

## Decisions Made
- Deferred Tasks 2-3 to a follow-up session (per explicit developer instruction) since they require live device access and EAS credentials that can't be exercised unattended
- Treated the `npm ci` ERESOLVE failure as a blocking pre-existing bug (not scope creep) since it prevented any preview build from succeeding at all — fixed via lockfile regeneration rather than `--legacy-peer-deps`/`--force`, keeping the dependency tree's actual resolution correct instead of masking the conflict

## Deviations from Plan

### Auto-fixed Issues

**1. [Blocking] package-lock.json drift blocking `npm ci` on EAS build server**
- **Found during:** Task 2 (Produce the iOS EAS preview build) — first `eas build` attempt failed during `npm ci --include=dev` on Expo's build infrastructure
- **Issue:** An earlier commit (`8192297`, "bump expo SDK 57 patch versions") updated `package.json`'s `react-native` to `0.86.2` but left `package-lock.json` pinned at `0.86.0`. Local `npm install` tolerated the mismatch (stale `node_modules` masked the conflict), but `npm ci` — which EAS's build server uses — enforces exact lockfile/package.json agreement and failed with an ERESOLVE peer-dependency conflict on `@react-native/jest-preset`.
- **Fix:** Removed `node_modules` and regenerated `package-lock.json` via `npm install --package-lock-only` against a clean slate, resolving `react-native` to `0.86.2` consistently; re-ran `npm ci` to confirm the exact command EAS uses succeeds
- **Files modified:** `package-lock.json`
- **Verification:** `npm ci` clean install; `npm test` (251/251), `npm run typecheck`, `npm run lint`, `npm run validate-brand` (20/20) all pass; retried `eas build --profile preview --platform ios` and it completed successfully
- **Committed in:** `410e401`

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Necessary to unblock the EAS build entirely — no scope creep, no application code touched.

## Issues Encountered
Initial `eas build --profile preview --platform ios --non-interactive` attempt failed separately with "couldn't find any credentials suitable for internal distribution" — resolved by the developer running the build interactively themselves in their own terminal (this session's sandboxed shell has no TTY for credential prompts), after which the account's existing remote iOS credentials were reused successfully.

## User Setup Required
None - no external service configuration required beyond the EAS build the developer already ran.

## Next Phase Readiness
VALID-01, VALID-02, and VALID-03 are all closed. Phase 29 (and the v0.6 "Lafa Branding + Expo Splash Cleanup" milestone) is complete pending orchestrator tracking updates.

---
*Phase: 29-brand-validation-release-verification*
*Completed: 2026-08-15*
