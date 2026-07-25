---
phase: 24-quality-gates-preflight-first-submit
plan: 03
subsystem: infra
tags: [eas, testflight, app-store-connect, release, checkpoint, human-verify]

# Dependency graph
requires:
  - phase: 24-01
    provides: "npm run lint exits 0"
  - phase: 24-02
    provides: "npm run preflight script, verified warm"
provides:
  - "IDENT-04 resolved: app.json slug reverted to portuguese-verb-mobile to match the EAS project's server-side registration (no dashboard rename path exists, confirmed by 21-02)"
  - "package-lock.json regenerated under npm 10 (Node 22) to match the EAS build image, fixing an npm ci drift (typescript@5.9.3 missing from lock)"
  - "First real production iOS build (958a7e22-b933-420e-ba9e-a97870cb8f1b) built, submitted via App Store Connect API Key auth, and confirmed Ready to Submit in TestFlight"
  - "Internal TestFlight tester (account holder) added, installed, and launched the build"
affects: [v0.5-milestone-close]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "EAS submit in the pinned eas-cli version no longer offers interactive Apple ID/password auth for iOS submit — App Store Connect API Key is the only supported method now. Future submits should either configure submit.production.ios.ascApiKeyPath in eas.json or expect the interactive API-key-generation prompt each time."

key-files:
  created: []
  modified:
    - app.json
    - package-lock.json

key-decisions:
  - "IDENT-04 (carried forward from Phase 21): resolved by reverting app.json's local slug to portuguese-verb-mobile (matching the EAS project's immutable server-side slug) rather than creating a new EAS project under the lafa slug. User-facing branding (name 'Lafa', scheme 'lafa', bundleIdentifier com.avram.aruh.lafa) is unaffected — slug is an internal EAS/build-routing identifier only. Avoids orphaning the Phase 20 proof build and re-provisioning Apple distribution credentials, per D-01's original rationale."
  - "package-lock.json regenerated under Node 22/npm 10 (nvm) after eas build's remote npm ci failed with 'Missing: typescript@5.9.3 from lock file' — same root cause and fix as prior commit 9b48acf; local npm 11 and the EAS build image's npm 10 resolve the lockfile differently."
  - "eas submit used App Store Connect API Key auth (generated during the operator's interactive submit session) instead of the plan's anticipated interactive Apple ID login — the current eas-cli version does not offer Apple ID/password submit for iOS at all, this is a version-driven change, not a choice made against the plan's intent (D-05 was already 'operator-executed, not agent-run'; only the specific auth mechanism differed)."
  - "External TestFlight testers were created in App Store Connect by the operator but explicitly NOT submitted for Beta App Review or populated with testers, per REQUIREMENTS.md's Out of Scope constraint (internal-only this milestone). Left as an empty/unused group for a future milestone."

patterns-established: []

requirements-completed: [SHIP-03, SHIP-04, SHIP-05]

# Metrics
duration: "~1h (spread across operator checkpoints, including a >15min cold-instance wait)"
completed: 2026-07-25
---

# Phase 24 Plan 03: Human-Only Release Checkpoints Summary

**Ran the three operator-only release steps to their conclusion: cold-instance preflight passed, the first real production iOS build was built and submitted (surviving two blocking config bugs surfaced along the way), and an internal TestFlight tester confirmed install — completing the v0.5 milestone's terminal deliverable.**

## Performance

- **Duration:** ~1h across three sequential checkpoints (includes an intentional >15min idle wait for Task 1)
- **Tasks:** 3 (all `checkpoint:human-verify`)
- **Files modified:** 2 (`app.json`, `package-lock.json` — both fixes to unblock Task 2, applied directly since this plan has `files_modified: []` and no autonomous executor)

## Accomplishments

- **Task 1 (SHIP-03):** Operator left the Render backend idle >15 minutes, then ran `npm run preflight` cold. All four checks passed: `/health` 200, `/content/verbs` 200, `/feedback` 201, `/product-feedback` 201, exit 0.
- **Task 2 (SHIP-04):** `eas build --profile production --platform ios` initially failed twice before succeeding:
  1. `Project config: Slug ... does not match` — resolved IDENT-04 by reverting `app.json`'s `slug` to `portuguese-verb-mobile`.
  2. `npm ci --include=dev` failed on the EAS build image (`Missing: typescript@5.9.3 from lock file`) — resolved by regenerating `package-lock.json` under Node 22/npm 10 locally, matching the build image's npm version.
  After both fixes, the build succeeded: **958a7e22-b933-420e-ba9e-a97870cb8f1b** (`https://expo.dev/accounts/avram.aruh/projects/portuguese-verb-mobile/builds/958a7e22-b933-420e-ba9e-a97870cb8f1b`). `eas submit --profile production --platform ios` then completed via an App Store Connect API Key (generated interactively during submit, since this eas-cli version has no Apple ID/password submit path) — build confirmed **Ready to Submit** in App Store Connect TestFlight.
- **Task 3 (SHIP-05):** Operator added their own Apple ID (account holder) as an internal tester in the Internal Testing group in App Store Connect, accepted the resulting TestFlight invite on an iOS device, and confirmed a successful install and launch of the Lafa build via the TestFlight app.

## Files Created/Modified

- `app.json` — `slug` reverted `"lafa"` → `"portuguese-verb-mobile"` (commit `cab654b`)
- `package-lock.json` — regenerated under npm 10/Node 22 (commit `d005442`)
- `.planning/phases/24-quality-gates-preflight-first-submit/24-03-SUMMARY.md` — this file

## Decisions Made

See `key-decisions` in frontmatter above — IDENT-04 resolution, lockfile regeneration, ASC API Key auth (version-driven, not a plan deviation), and explicit exclusion of external testers.

## Deviations from Plan

### Auto-fixed Issues (with user sign-off via AskUserQuestion at each blocking point)

**1. [Rule 1 - Bug] IDENT-04 slug mismatch blocked `eas build`**
- **Found during:** Task 2, first `eas build` attempt.
- **Issue:** `app.json` local `slug` (`lafa`, set in Phase 21) did not match the EAS project's immutable server-side slug (`portuguese-verb-mobile`) — exactly the condition Phase 21 flagged as IDENT-04 and explicitly deferred to this plan, after confirming no dashboard rename path exists (21-02-SUMMARY.md).
- **Fix:** Presented the user two options (revert local slug vs. create a new EAS project); user chose reverting the local slug. Applied, verified via `eas project:info` succeeding, committed.
- **Files modified:** `app.json`.
- **Verification:** `eas project:info --non-interactive` resolves cleanly; `npm run typecheck` exits 0.
- **Committed in:** `cab654b`.

**2. [Rule 1 - Bug] `npm ci` lockfile drift on the EAS build image**
- **Found during:** Task 2, second `eas build` attempt (after the slug fix).
- **Issue:** EAS's remote `npm ci --include=dev` failed with `Missing: typescript@5.9.3 from lock file`, even though local `npm ci` succeeded — same class of npm-version-dependent lockfile resolution difference previously fixed in commit `9b48acf`.
- **Fix:** Regenerated `package-lock.json` locally under Node 22 (npm 10, via `nvm use 22`), matching the EAS build image's npm version, then verified `npm ci --include=dev` succeeds locally.
- **Files modified:** `package-lock.json`.
- **Verification:** `npm ci --include=dev`, `npm run typecheck`, `npm run lint`, `npm test` (251/251) all pass under Node 22.
- **Committed in:** `d005442`.

### User-directed scope decisions (not auto-fixed, explicit checkpoint)

**3. External TestFlight testers excluded per REQUIREMENTS.md**
- **Found during:** Task 3.
- **Issue:** Operator created both internal and external testing groups in App Store Connect; App Store Connect prompted for a Beta App Description to proceed with external testing (which requires Apple's Beta App Review).
- **Resolution:** Flagged to the user that external testing was explicitly out of scope for this milestone (`REQUIREMENTS.md` §Out of Scope). User confirmed: skip external, internal-only. No Beta App Description was written; the external group remains empty/unsubmitted.

**Total deviations:** 2 auto-fixed (Rule 1 - Bug, both required to reach a working build), 1 user-directed scope hold (external testers deferred).
**Impact on plan:** Both bugs were pre-existing conditions (IDENT-04 explicitly carried forward from Phase 21; the lockfile drift is an environment-version mismatch unrelated to this phase's code changes) that blocked the plan's own Task 2 acceptance criteria — fixing them was necessary to satisfy SHIP-04, not scope creep. The external-tester hold keeps the milestone's scope exactly as specified.

## Issues Encountered

- `expo doctor` flagged two pre-existing, non-blocking advisory issues (the `eas` npm script and the `eas-cli` devDependency, both added deliberately in Phase 20) during the build. These did not block the build and are optional future cleanup, not addressed here.

## User Setup Required

None further. An App Store Connect API Key now exists (generated during the interactive `eas submit` session) for future non-interactive submits if desired — not tracked in-repo, managed entirely on Apple's/Expo's side.

## Next Phase Readiness

**v0.5 milestone ("iOS TestFlight Readiness") terminal deliverable reached:**
- `npm run lint` and `npm run typecheck` pass (Plan 01).
- `npm run preflight` passes warm and cold against the live Render backend (Plan 02, Task 1).
- A signed production build (958a7e22-b933-420e-ba9e-a97870cb8f1b) is submitted and Ready to Submit in App Store Connect (Task 2).
- An internal TestFlight tester has installed and launched the build (Task 3).

No further phases are required to close v0.5; this SUMMARY documents the milestone's closing evidence.

---
*Phase: 24-quality-gates-preflight-first-submit*
*Completed: 2026-07-25*

## Self-Check: PASSED

- CONFIRMED: `app.json` `slug` = `"portuguese-verb-mobile"` (commit `cab654b`)
- CONFIRMED: `package-lock.json` regenerated, `npm ci --include=dev` succeeds locally under Node 22 (commit `d005442`)
- CONFIRMED: Build `958a7e22-b933-420e-ba9e-a97870cb8f1b` exists at the reported EAS URL, operator-reported Ready to Submit in TestFlight
- CONFIRMED: Operator-reported internal tester install + launch
