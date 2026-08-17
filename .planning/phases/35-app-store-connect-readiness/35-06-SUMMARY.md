---
phase: 35-app-store-connect-readiness
plan: 06
subsystem: infra
tags: [eas, eas-build, eas-submit, ios, app-store-connect, expo-doctor]

requires:
  - phase: 35-app-store-connect-readiness (plan 01)
    provides: "Rebranded, re-verified app.json config (name Lafa, bundleIdentifier com.avram.aruh.lafa, version 1.0.0, supportsTablet false, ITSAppUsesNonExemptEncryption false)"
provides:
  - "A production EAS build delivered to App Store Connect, attached to version 1.0.0"
  - "Real-artifact confirmation the app icon has no alpha channel (closes Phase 31 / BRAND-04 / D-10 deferral)"
affects: [35-07]

tech-stack:
  added: []
  patterns: []

key-files:
  created: []
  modified:
    - "package.json (expo/expo-constants/expo-router/expo-splash-screen patch bumps)"
    - "package-lock.json"

key-decisions:
  - "Fixed a genuine expo-doctor gate failure (20/21) by bumping 4 packages to their expected SDK 57 patch versions via `npx expo install <pkg>@<expected>`, per coordinator decision, before starting the cloud build"

patterns-established: []

requirements-completed: []

duration: TBD
completed: TBD
---

# Phase 35 Plan 06: App Store Connect Readiness — Production Build & Submit Summary

**Pre-build gates fixed and verified green; production EAS build and submission are in progress / pending human checkpoints.**

## Pre-build gate results (Task 1)

Initial run surfaced one failing gate:

| Gate | Initial result | Final result |
|---|---|---|
| `npm run typecheck` | PASS | PASS |
| `npm test` | PASS — 22 suites, 261/261 tests | PASS — 22 suites, 261/261 tests |
| `npm run lint` | PASS (exit 0) | PASS (exit 0) |
| `npm run validate-brand` | PASS — 21/21 checks | PASS — 21/21 checks |
| `npx expo-doctor` | **FAIL — 20/21 checks** (4 packages behind expected SDK 57 patch versions) | PASS — 21/21 checks |

### Deviation: fixed expo-doctor gate failure (coordinator-approved)

- **Found during:** Task 1
- **Issue:** `expo-doctor` reported `expo@57.0.13` (expected `~57.0.14`), `expo-constants@57.0.11` (expected `~57.0.12`), `expo-router@57.0.13` (expected `~57.0.14`), `expo-splash-screen@57.0.6` (expected `~57.0.7`). `package.json`/`package-lock.json` had no uncommitted diff prior to the fix — this was a committed version mismatch, not local drift.
- **Fix:** Ran `npx expo install expo@~57.0.14 expo-constants@~57.0.12 expo-router@~57.0.14 expo-splash-screen@~57.0.7`, per expo-doctor's own recommendation and explicit coordinator decision ("Fix now"). Re-ran all 5 gates — all green, `expo-doctor` now 21/21.
- **Files modified:** `package.json`, `package-lock.json`
- **Commit:** `b2979b9` — `fix(35-06): bump expo/expo-constants/expo-router/expo-splash-screen to SDK 57 expected patch versions`

### Config assertions

- `node -e "const c=require('./app.json').expo.ios; console.log(c.supportsTablet, c.infoPlist.ITSAppUsesNonExemptEncryption)"` → `false false` ✅
- `git diff --quiet eas.json` → unchanged ✅ (`ascAppId: "6794382182"`, `autoIncrement: true`, `node: "22.23.2"` all intact)
- `package.json` — no `eas` script, no `eas-cli` devDependency ✅
- `eas --version` → `eas-cli/21.2.0 darwin-arm64 node-v25.0.0` (satisfies `cli.version: ">= 21.1.0"`)

### Baseline highest existing iOS build number

Read via `eas build:list --platform ios --limit 5 --non-interactive --json`:

| Status | Profile | Version | Build # | Created |
|---|---|---|---|---|
| FINISHED | production | 1.0.0 | **5** | 2026-08-16T13:18:51Z |
| FINISHED | preview | 1.0.0 | 4 | 2026-08-15T22:21:44Z |
| ERRORED | preview | 1.0.0 | 4 | 2026-08-15T22:14:42Z |
| FINISHED | production | 1.0.0 | 4 | 2026-07-25T17:35:06Z |
| ERRORED | production | 1.0.0 | 3 | 2026-07-25T17:28:38Z |

**Baseline: production build number 5.** Task 2's new build must report a strictly greater `appBuildVersion`.

### Pre-existing, out-of-scope working-tree state (not blocking, noted for visibility)

- `.planning/.continue-here.md` — modified, stale content from a prior session unrelated to this plan
- `assets/brand/candidates/` — untracked exploratory brand PNGs from Phase 31, not referenced by `app.json`
- `.planning/phases/33-quiz-press-state-color-fix/33-PATTERNS.md` — untracked, unrelated to this plan

None of these are under `src/`, `app/`, `app.json`, or the build-relevant portion of the tree in a way that changes the reviewed source; not modified by this plan.

## Task 2: Production build and icon-alpha closure — COMPLETE

The developer ran the build themselves (`npx eas-cli build --platform ios --profile production`,
since plain `eas` was not globally on PATH in their shell at the time — noted as a minor
divergence from the plan's "invoke `eas` directly" interface note, with no functional
difference; `eas --version` in this agent's shell resolves the same `eas-cli/21.2.0`).

### Build record

| Field | Value |
|---|---|
| Build id | `a89da11a-b874-41d8-9184-06a18033b1eb` |
| Status | `FINISHED` |
| Platform | iOS |
| Profile | `production` |
| App version | `1.0.0` |
| Build number (`appBuildVersion`) | **6** |
| Source commit | `d927681ca0eb7118cab0c66836d5bb85935b9ae1` |
| Created | 2026-08-17T12:35:51.572Z |
| Artifact URL | https://expo.dev/artifacts/eas/N9g3cJPbSDSd2zyX-UGHnY9_O6eHLmno2U1Mnuy-xvw.ipa |

- Baseline check: build **6 > baseline 5** ✅ — strictly incremented, per `eas.json`'s
  `autoIncrement: true` / `cli.appVersionSource: "remote"`.
- Source-commit check: `d927681` is a **descendant** of `b2979b9` (this plan's Task 1
  dependency-version fix commit), confirmed via `git merge-base --is-ancestor b2979b9 d927681`
  → `b2979b9 IS ancestor of build commit`. The build was produced from source that includes
  the expo-doctor fix. (Additional unrelated `docs(35-04)` commits from a concurrently-running
  agent landed on the same branch between `b2979b9` and the build's commit — expected in this
  shared-branch execution model, not a concern for this build's correctness.)
- `git diff --quiet eas.json app.json` → unchanged, confirmed after the build ✅

### Icon-alpha evidence (closes Phase 31 / BRAND-04 / D-10 deferral)

Downloaded the `.ipa` from the artifact URL, unzipped it, and located loose
`AppIcon*.png` files directly under `Payload/Lafa.app/` (icons were NOT compiled into
`Assets.car` for this build, so the primary `sips` path was used — no visual/reinstall
fallback needed):

```
=== AppIcon60x60@2x.png ===
  hasAlpha: no
  pixelWidth: 120
  pixelHeight: 120
=== AppIcon76x76@2x~ipad.png ===
  hasAlpha: no
  pixelWidth: 152
  pixelHeight: 152
```

**Both `AppIcon*.png` files in the real production build artifact report `hasAlpha: no`.**
This closes the Phase 31 criterion 4 / BRAND-04 (D-10) deferral — the icon has now been
verified alpha-free on a real EAS build artifact, not only on the source PNG via
`npm run validate-brand`.

The extracted `.ipa` contents were deleted from the scratch directory after inspection;
no build artifacts were added to the repo.

## Task 3: Submit to App Store Connect

**Status: not started — this is the next blocking checkpoint.**

Per the plan, `eas submit --platform ios --profile production --id a89da11a-b874-41d8-9184-06a18033b1eb`
must be run next, explicitly pinning the build id recorded above so the correct build is
submitted. This requires interactive Apple ID authentication with 2FA (no App Store Connect
API key is configured in `eas.json` by design — only `ascAppId: "6794382182"`), so this step
requires the developer to run the command and complete the Apple ID / 2FA prompt themselves.
This agent will not attempt to run `eas submit` automatically.
