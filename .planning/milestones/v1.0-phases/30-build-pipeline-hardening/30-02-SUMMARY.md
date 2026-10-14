---
phase: 30-build-pipeline-hardening
plan: 02
subsystem: infra
tags: [eas, expo, node, nvm, ci]

requires:
  - phase: 30-build-pipeline-hardening (plan 01)
    provides: "Provisional Node 22.23.2 pin across .nvmrc, package.json engines.node, eas.json build.production.node, and a clean local npm ci/typecheck/lint/test proof"
provides:
  - "Real EAS production build (eas build --profile production --platform ios) proving the Node pin against the actual build image, not just local resolution"
  - "Confirmation that the locally-resolved Node 22.23.2 exactly matches the EAS build image's Node version — no reconciliation required"
affects: [future EAS build/submit phases, any future Node/Expo SDK version bump]

tech-stack:
  added: []
  patterns:
    - "Node version pin must be proven against a real EAS build log, not just local nvm resolution — local and remote can diverge by a patch digit even when both 'work'"

key-files:
  created: []
  modified: []

key-decisions:
  - "Build-log Node version (22.23.2) matched the plan 30-01 pin exactly — Case A (no reconciliation), so Task 2/Task 3 required no file changes and no second build"

patterns-established:
  - "Treat local nvm resolution as provisional until confirmed against a real EAS build log's 'Spin up build environment' step"

requirements-completed: [BUILD-01, BUILD-04]

duration: ~15min (human checkpoint + build wait)
completed: 2026-08-16
---

# Phase 30 Plan 02: EAS Production Build Reconciliation Summary

**Real `eas build --profile production --platform ios` confirmed the Node 22.23.2 pin from plan 30-01 exactly matches the EAS build image — no reconciliation needed.**

> Correction (2026-10-14, Phase 39): the EAS SDK-57 base image's default Node was 22.23.1, not 22.23.2. The `eas.json` `build.production.node` pin installs and runs 22.23.2, which is what the build #6 log showed in "Spin up build environment". The pin worked and the outcome is unchanged, but the "exact match with the build image / Case A" framing is wrong; see 30-VERIFICATION.md.

## Performance

- **Duration:** ~15 min (human-run build + checkpoint confirmation)
- **Completed:** 2026-08-16
- **Tasks:** 3/3 (2 blocking human-verify checkpoints + 1 auto reconciliation task, which was a no-op)
- **Files modified:** 0 (Case A — no pin correction required)

## Accomplishments
- Ran a real production EAS build (Build ID `b20e4c67-93e2-4190-885a-661c70545071`, Build number 5, SDK 57.0.0, EAS CLI 21.8.0) from the committed Wave 1 state
- Build log's "Spin up build environment" step reported Node version **22.23.2** — character-for-character identical to `.nvmrc` / `package.json engines.node` / `eas.json build.production.node`

> Correction (2026-10-14, Phase 39): see the correction under the headline — 22.23.2 is the pinned version, the image default was 22.23.1.
- Install step (`npm ci`) completed cleanly — no ERESOLVE, no lockfile-mismatch, no missing-package error (the two failure signatures from Phase 24 and Phase 29)
- Build finished successfully, producing an installable `.ipa` artifact: https://expo.dev/artifacts/eas/IFTiAj-JeyZ9_3T0jHls_sg_XcPG3FSJgB-QGnHdjwE.ipa
- Confirmed Case A per plan's decision tree — since the build-log version matched the local resolution exactly, Task 2 required no file changes and Task 3 required no second confirming build

## Task Commits

No code commits — Task 1 and Task 3 were human-run verification checkpoints (real EAS cloud build), and Task 2 was a no-op reconciliation (Case A: versions already matched).

## Files Created/Modified
None — the pin from plan 30-01 (`.nvmrc`, `package.json`, `eas.json`, `package-lock.json`) required no changes.

## Decisions Made
- Case A confirmed: local `nvm install 22` resolution (22.23.2) matched the EAS build image's Node version exactly at build time. RESEARCH.md Pitfall 1 flagged this as a live, verified-today discrepancy risk (local 22.23.2 vs Expo's documented 22.23.1) — that risk did not materialize in this build, but the plan's Case A/B branching existed specifically to catch it if it had.

> Correction (2026-10-14, Phase 39): see the correction under the headline — 22.23.2 is the pinned version, the image default was 22.23.1.

## Deviations from Plan

None - plan executed exactly as written. Task 1 and Task 3 both resolved to their "no second build needed" branch since Task 1's single build already proved the exact committed pin.

## Issues Encountered

`expo doctor` (run as part of the EAS build's dependency install phase) reported 2 non-blocking check failures unrelated to the Node/npm pin:
1. `package.json` script `eas` conflicts with `node_modules/.bin/eas`
2. `eas-cli` is installed as a local project dependency rather than global/npx

Both are pre-existing project configuration issues, out of scope for BUILD-01..04 (this phase is scoped strictly to the Node/npm version pin per RESEARCH.md's "Don't Hand-Roll" guidance against scope creep). They did not block or affect the build outcome. Flagging for a future cleanup phase if desired.

## User Setup Required

None - no external service configuration required. The EAS build itself was run manually by the user as the blocking human-verify checkpoint required by this plan.

## Next Phase Readiness

- BUILD-01 and BUILD-04 fully satisfied: the Node/npm pin is now proven against a real EAS build, not just local resolution.
- BUILD-02 and BUILD-03 re-confirmed still matching (no changes made in this plan).
- Phase 30 (build-pipeline-hardening) is complete — the three-file Node pin closes the drift source behind the Phase 20/24/29 `npm ci` failures.
- No blockers for subsequent phases; the pinned Node version should be treated as durable until a deliberate future Node/Expo SDK bump.

---
*Phase: 30-build-pipeline-hardening*
*Completed: 2026-08-16*
