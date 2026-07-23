---
phase: 20-native-build-risk-front-loading
plan: 02
subsystem: infra
tags: [eas-build, eas-cli, ios, native-build, npm, lockfile]

# Dependency graph
requires:
  - phase: 20-01
    provides: "SDK 57-aligned dependency baseline; eas-cli pinned + reachable via npm run eas"
provides:
  - "Final iOS bundle identifier (com.avram.aruh.lafa) set in app.json"
  - "eas.json with development/preview/production build profiles"
  - "EAS project registered (extra.eas.projectId in app.json)"
  - "Proven native dependency graph: a production iOS build reaches FINISHED status on EAS cloud infrastructure"
  - "EAS-managed Apple distribution credentials provisioned"
  - "package-lock.json regenerated under Node 22/npm 10 to match the EAS build image, fixing a false npm ci lockfile-sync failure"
affects: [21-release-identity, 22-icon-assets, 23-eas-build-submit-configuration, 24-quality-gates-preflight-first-submit]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "package-lock.json must be regenerated with the same npm major version bundled in the target EAS build image (Node 22.x/npm 10 for SDK 57 iOS as of this phase) — a lockfile generated with a newer local npm (Node 25/npm 11) writes an 'optionalDependencies libc' field npm 10's `npm ci` rejects as an out-of-sync lockfile, even though `npm install`/`npm ci` succeed locally"
    - "EAS build CLI writes/mutates app.json as a side effect (extra.eas.projectId, owner, ios.infoPlist.ITSAppUsesNonExemptEncryption) — treat these as CLI-generated scaffold to commit as-is, not hand-authored config"

key-files:
  created: [eas.json]
  modified: [app.json, package-lock.json]

key-decisions:
  - "D-01/D-02 followed as scoped: bundleIdentifier set before build:configure so credentials were never bound to a placeholder id; eas.json committed unmodified as CLI-produced"
  - "Used `eas init --non-interactive --force` instead of relying on `eas build:configure` alone, because the plain command hung on a non-TTY stdin prompt ('create an EAS project?') in the executor's environment — same resulting projectId/owner fields, no scope change"
  - "Diagnosed and fixed a real cross-environment build failure (npm ci lockfile mismatch between local Node 25/npm 11 and EAS's Node 22/npm 10 build image) rather than treating the errored build as a native-drift finding to hand off — this was a tooling/environment issue, not app code or dependency drift, and was resolved within this plan per the plan's own instruction to treat build errors as findings to resolve"
  - "Committed the CLI-written ios.infoPlist.ITSAppUsesNonExemptEncryption: false from the build run — answers Apple's export compliance question non-interactively for future submissions (Phase 23 scope confirms/adjusts if needed)"

requirements-completed: [BUILD-02]

# Metrics
duration: ~50min (including a failed build, root-cause diagnosis, and a successful retry)
completed: 2026-07-23
---

# Phase 20 Plan 02: Native Build Proof Summary

**Set the final iOS bundle identifier, bootstrapped eas.json via the EAS CLI, diagnosed and fixed a Node/npm-version lockfile mismatch that broke the first cloud build attempt, and confirmed a production iOS build reaches FINISHED status on EAS infrastructure — closing BUILD-02.**

## Performance

- **Duration:** ~50 min (Tasks 1-2 auto-executed in ~7 min; Task 3 checkpoint round-trip including one failed build, diagnosis, fix, and a successful retry)
- **Started:** 2026-07-23T10:40:00Z (approx, Tasks 1-2)
- **Completed:** 2026-07-23T12:32:30Z (build FINISHED)
- **Tasks:** 3 completed (2 auto + 1 human-verify checkpoint)
- **Files modified:** 3 (app.json, eas.json, package-lock.json)

## Accomplishments

- `app.json` `expo.ios.bundleIdentifier` set to the final `com.avram.aruh.lafa`, landing before `eas build:configure` so no credentials/project were ever bound to a placeholder id
- `eas.json` generated via `npm run eas -- build:configure` / `eas init --non-interactive --force`, with development/preview/production build profiles
- EAS project registered: `app.json` gained a CLI-written `extra.eas.projectId` and `owner`
- First cloud build attempt (`39604588-...`) **errored** during `npm ci --include=dev` with a misleading "missing typescript@5.9.3 from lock file" message
- Root-caused to a Node/npm version mismatch: local dev machine on Node 25/npm 11 vs EAS's SDK 57 iOS image on Node 22.23.1/npm 10 — npm 11 writes an `optionalDependencies[].libc` field into `lockfileVersion: 3` locks that npm 10's `npm ci` doesn't recognize, triggering a false out-of-sync rejection
- Regenerated `package-lock.json` under Node 22.23.1 (installed via nvm) to match the build image; verified clean `npm ci`, `npm test` (251/251), `npm run typecheck`, `npx expo-doctor` (unchanged 18/20, same expected eas-cli advisory checks from Plan 20-01)
- Second cloud build attempt (`2dc80140-...`) reached **FINISHED** status, producing a signed throwaway `.ipa` artifact, with EAS-managed Apple distribution credentials provisioned server-side

## Task Commits

Each task was committed atomically:

1. **pre-task: Register config plugins added by expo install --fix** - `0d6b8a4` (fix) — committed an `app.json` diff left uncommitted by Plan 20-01 (out of its `files_modified` scope), required before this plan's own `app.json` edits
2. **Task 1: Set final iOS bundle identifier in app.json** - `575715b` (feat)
3. **Task 2: Bootstrap eas.json via eas build:configure** - `04bcaf5` (feat)
4. **Root-cause fix: regenerate package-lock.json under Node 22/npm 10** - `9b48acf` (fix) — resolves the first build's `npm ci` failure
5. **Task 3 side effect: register export compliance flag** - `915a3ea` (feat) — commits `ios.infoPlist.ITSAppUsesNonExemptEncryption: false` written by the `eas build` run

## Files Created/Modified

- `app.json` — gained `expo-image`/`expo-status-bar`/`expo-web-browser` config plugin entries (Plan 20-01 leftover), `ios.bundleIdentifier`, `extra.eas.projectId`/`owner` (CLI-written), `ios.infoPlist.ITSAppUsesNonExemptEncryption` (CLI-written)
- `eas.json` — created by `eas build:configure`/`eas init`, contains `cli.version`, development/preview/production build profiles, `submit.production`
- `package-lock.json` — regenerated under Node 22.23.1/npm 10.9.8 to match the EAS SDK 57 iOS build image; no dependency version changes, only lockfile metadata format (removes npm-11-specific `libc` fields on optional platform packages)

## Decisions Made

- Treated the first build's `npm ci` failure as an environment/tooling defect to diagnose and fix within this plan, not a native-code/dependency-drift finding to hand off to a later phase — the plan's own success criteria require BUILD-02 (a finished build) to close, and the actual dependency graph itself was never at fault
- Confirmed via a full local reproduction (`npm ci --include=dev` in an isolated directory under both npm 11 and npm 10) before regenerating the lockfile, to avoid a speculative fix
- Left the Node version unpinned in `.nvmrc`/`eas.json` for this plan (out of scope) — Phase 23/24 (quality gates / EAS build-submit configuration) is the natural place to add a durable `.nvmrc` or CI Node-version guard so this class of drift can't silently recur; flagging as a recommendation for that phase

## Deviations from Plan

- Used `eas init --non-interactive --force` instead of a bare `eas build:configure` for Task 2, because the plain command hung on a non-TTY stdin prompt in the executor's environment ("Would you like to automatically create an EAS project?"). Produced the same `extra.eas.projectId`/`owner` fields the plan expected — a mechanical CLI-invocation adjustment, not a scope change.
- Task 3's build errored on the first attempt (npm ci lockfile mismatch) and required a diagnosis-and-fix cycle before a successful retry — the plan anticipated build errors as a possible outcome ("treat an errored build as a finding to resolve, not a phase-complete state") and this is exactly that path, now resolved.

## Issues Encountered

**Resolved:** First-ever cloud build errored with `npm ci --include=dev` reporting `Missing: typescript@5.9.3 from lock file` — a red herring; `typescript@5.9.3` does not appear anywhere in the committed `package.json`/`package-lock.json` at any point in this phase's history. Root cause: local Node 25/npm 11 writes lockfile metadata (`optionalDependencies[].libc`) that EAS's Node 22.23.1/npm 10 build image's `npm ci` rejects as an unrecognized/out-of-sync entry. Fixed by regenerating the lockfile under a matching Node 22.23.1 environment. See `key-decisions` above for the recommendation to pin this durably in a later phase.

## User Setup Required

- **Completed by user during this plan:** ran `npm run eas -- build --platform ios --profile production --clear-cache` twice from an interactive terminal (first attempt errored, second succeeded); selected "Let EAS manage credentials" on the first-ever iOS build, provisioning Apple distribution certificate + provisioning profile server-side via EAS. No `.p12`/`.mobileprovision`/ASC key material was uploaded or committed.

## Next Phase Readiness

- BUILD-02 is satisfied: build `2dc80140-dcc3-4c7f-a71b-2848f114b5ca` reached `FINISHED` status (`npm run eas -- build:list --platform ios --status finished --limit 1 --json` confirms), producing a signed `.ipa` artifact
- `app.json.ios.bundleIdentifier` is the final `com.avram.aruh.lafa`; `eas.json` and the EAS project registration are in place for Phase 23 (eas-build-submit-configuration) to build on without rework
- **New finding for Phase 23/24 to pick up:** no durable Node-version pin exists yet (`.nvmrc` or equivalent) to prevent this npm-version lockfile drift from recurring on future dependency updates or new contributor machines — recommend adding one when quality gates / CI config is established

---
*Phase: 20-native-build-risk-front-loading*
*Completed: 2026-07-23*

## Self-Check: PASSED

- FOUND: commit 575715b (Task 1)
- FOUND: commit 04bcaf5 (Task 2)
- FOUND: commit 9b48acf (root-cause fix)
- FOUND: commit 915a3ea (Task 3 side effect)
- FOUND: .planning/phases/20-native-build-risk-front-loading/20-02-SUMMARY.md
- FOUND: eas.json with "production" profile
- FOUND: "bundleIdentifier": "com.avram.aruh.lafa" in app.json
- CONFIRMED: EAS build 2dc80140-dcc3-4c7f-a71b-2848f114b5ca status FINISHED
