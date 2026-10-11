---
phase: 30-build-pipeline-hardening
verified: 2026-10-11T12:00:00Z
status: passed
score: 4/4 must-haves verified (roadmap SC1-SC4 / BUILD-01..04); 7/7 plan truths verified
overrides_applied: 0
re_verification: false
notes:
  - "BUILD-01 nuance: the EAS base image's default Node was 22.23.1. The pin (22.23.2) does not equal the image default; it equals the Node that EAS actually installs and runs npm ci under, because eas.json build.production.node forces it. Read against the phase goal (close local-vs-EAS drift), this satisfies the requirement. Evidence is the real build #6 log, not a local assumption."
  - "30-02-SUMMARY.md is factually wrong where it says the build image's own Node was 22.23.2 ('Case A, exact match'). 30-UAT.md test 3 corrects this. The outcome is unchanged, but the SUMMARY narrative should not be cited as evidence."
---

# Phase 30: Build Pipeline Hardening Verification Report

**Phase Goal:** Close the Node/npm version drift between the local dev machine and the real EAS build image for good, with a structural fix instead of a fourth ad hoc patch.
**Verified:** 2026-10-11
**Status:** passed
**Re-verification:** No. This is the initial verification.

## Goal Achievement

### Observable Truths (Roadmap Success Criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | `.nvmrc` exists at the repo root and pins the exact Node version confirmed from real EAS build logs | VERIFIED (with nuance) | `.nvmrc` = `22.23.2`. Build #6 log (`a89da11a-b874-41d8-9184-06a18033b1eb`, 2026-08-17, commit `d927681`) shows "Installing node v22.23.2" (npm 10.9.8) from `eas.json` before `npm ci`. The base image default was 22.23.1. See the nuance section. |
| 2 | `package.json` `engines.node` matches the pinned version | VERIFIED | `node -e` read gives `{ node: '22.23.2' }`. The lockfile root `packages[""].engines` also gives `{ node: '22.23.2' }`. |
| 3 | `eas.json` production profile declares a matching `node` field | VERIFIED | `build.production` = `{"autoIncrement":true,"node":"22.23.2"}` |
| 4 | A fresh lockfile built under the pinned Node/npm gives a clean `npm ci`, and a real EAS production build succeeds with no lockfile-drift error | VERIFIED | Clean regeneration in `353068d` under Node 22.23.2/npm 10.9.8. Verifier re-ran checks under nvm 22.23.2/npm 10.9.8: `npm ci --dry-run --include=dev` exit 0 (no ERESOLVE), and `package.json` deps/devDeps match the lockfile root exactly (0 mismatches). Build #6 FINISHED with an .ipa, and `npm ci --include=dev` installed 1078 packages with no ERESOLVE or lockfile error. |

### Plan must-have truths (30-01 / 30-02)

| Truth | Status | Evidence |
|-------|--------|----------|
| One exact patch string is declared identically in all 3 files (D-02) | VERIFIED | All three read `22.23.2`. None is a range. |
| The pin is a real, installable Node 22.x, not the local v25 (D-01/D-02) | VERIFIED | `nvm use` in the repo root gives v22.23.2. EAS installed v22.23.2. |
| The lockfile was regenerated from scratch under the pinned pair (D-03) | VERIFIED | Commit `353068d` "regenerate package-lock.json clean under Node 22.23.2". `lockfileVersion` 3. |
| `npm ci`, typecheck, lint and test all exit 0 under the pin (D-03) | VERIFIED | Verifier re-ran typecheck (exit 0) and jest (22 suites, 261/261 passed) under 22.23.2. Lint and full `npm ci` passed in UAT test 2. |
| A real `eas build --profile production --platform ios` succeeded with no `npm ci` drift error (D-04) | VERIFIED | Build #6 (UAT test 3) and the earlier build #5 `b20e4c67-...` (30-02-SUMMARY) both succeeded. |
| The Node version was read from the actual build log (D-01) | VERIFIED | UAT test 3 downloaded and read the build #6 log via `eas build:view`. |
| The three pins hold the version the real build log reported | VERIFIED (with nuance) | The log reports the install and use of 22.23.2. The image default before the custom-tools step was 22.23.1. |

**Score:** 4/4 roadmap SCs verified. 7/7 plan truths verified.

### BUILD-01 nuance (recorded on purpose)

BUILD-01 says: "`.nvmrc` pins the Node version to match the real EAS build image (verified from actual build logs, not assumed from the local dev machine)."

- **Literal reading:** this does not hold. The EAS SDK-57 base image ships Node **22.23.1** by default. The pin is **22.23.2**. 30-02-PLAN's own Case B rule ("even a single patch digit... correct the pin to the build-log value") would have required a change to 22.23.1 if the image default were the reference.
- **Effective reading:** this holds. Because `eas.json` `build.production.node` = 22.23.2, EAS's INSTALL_CUSTOM_TOOLS step installs v22.23.2 (npm 10.9.8) before `npm ci --include=dev`. The Node/npm pair that resolves the lockfile on EAS is therefore byte-identical to the local pair (22.23.2 / 10.9.8). That is what the drift bug needs, and the evidence comes from the real build log rather than an assumption. The eas.json pin also makes local and EAS match whatever the image default happens to be, which is stronger than tracking the image default (that default can move under an unchanged pin).
- **Verdict:** SATISFIED on intent. Both halves of the parenthetical hold: the evidence came from real build logs, and the version was not assumed from local. The "match the image" wording is met by the image as configured.
- **Documentation defect:** 30-02-SUMMARY.md says the "Spin up build environment" step reported 22.23.2 and records "Case A — exact match, no reconciliation." Per UAT, that misdescribes what the log shows. It does not change the code outcome. If anyone needs exact wording, the follow-up is to amend the 30-02-SUMMARY or the BUILD-01 text to say "matches the Node the EAS build runs under (enforced via eas.json)". No code change is needed.

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `.nvmrc` | Bare `22.x.y`, no `v` prefix | VERIFIED | `22.23.2`. `nvm use` resolves it. |
| `package.json` | `engines.node` equal to the pin | VERIFIED | `"engines": { "node": "22.23.2" }` |
| `eas.json` | `build.production.node` equal to the pin | VERIFIED | Sibling of `autoIncrement`. Consumed by EAS, as shown in the build #6 log. |
| `package-lock.json` | Clean, consistent with package.json, installable with `npm ci` | VERIFIED | v3. Root deps match. Dry-run `npm ci` is clean. Later intentional edits (31-01 linkedom, quick-260816-k8y eas-cli removal, 35-06 expo patch bump) all predate or equal build #6's commit `d927681`. `git diff d927681 HEAD` touches no lockfile, package.json, eas.json or .nvmrc, so build #6 proves the current committed lockfile. |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|----|--------|---------|
| `.nvmrc` | `package.json` engines.node | identical string | WIRED | Both are `22.23.2` |
| `.nvmrc` | `eas.json` build.production.node | identical string | WIRED | Both are `22.23.2` |
| `eas.json` build.production.node | EAS build Node runtime | EAS custom-tools install step | WIRED | Build #6 log: "Installing node v22.23.2" before `npm ci` |
| `package-lock.json` | EAS `npm ci` | npm 10.9.8 on both sides | WIRED | Build #6 `npm ci --include=dev` succeeded with 1078 packages |

### Data-Flow Trace (Level 4)

Not applicable. This is a config-only phase with no dynamic-data rendering artifacts.

### Behavioral Spot-Checks (run by verifier, 2026-10-11)

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Pin resolves locally | `nvm use; node -v; npm -v` | v22.23.2 / 10.9.8 | PASS |
| Pins identical | `node -e` read of package.json/eas.json + `cat .nvmrc` | all `22.23.2` | PASS |
| Lockfile/package.json consistent | `npm ci --dry-run --include=dev` | exit 0, no ERESOLVE | PASS |
| Lockfile root vs package.json | node script comparing deps/devDeps | 0 mismatches | PASS |
| Typecheck under pin | `npm run typecheck` | exit 0 | PASS |
| Tests under pin | `npx jest --silent` | 22 suites, 261/261 passed | PASS |
| Working tree untouched | `git status --short` | clean | PASS |

The verifier could not pull the EAS build log directly because `eas` CLI is not installed globally (removed as a devDependency in quick-260816-k8y). The EAS evidence therefore comes from 30-UAT.md test 3 and 30-SECURITY.md T-30-03. Both cite the downloaded build #6 log with build ID, commit and log lines.

### Probe Execution

No probes are declared and no `scripts/*/tests/probe-*.sh` exist for this phase. Skipped.

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| BUILD-01 | 30-01, 30-02 | `.nvmrc` pins Node to match the real EAS build image, verified from actual build logs | SATISFIED (nuance) | `.nvmrc` = 22.23.2, the Node EAS installs and runs `npm ci` under per the build #6 log. The image default was 22.23.1 and the eas.json pin overrides it. |
| BUILD-02 | 30-01 | `engines.node` matches the pin | SATISFIED | `22.23.2` |
| BUILD-03 | 30-01 | `eas.json` production `node` matches the pin | SATISFIED | `22.23.2`. Shown to take effect in the build log. |
| BUILD-04 | 30-01, 30-02 | Lockfile regenerated clean under the pinned Node/npm and proven by a real EAS build | SATISFIED | `353068d` regen. Local `npm ci` is clean. EAS builds #5 and #6 FINISHED with no ERESOLVE/lockfile error. The app installed and launched (UAT 4), and Lafa 1.0.0 is Ready for Distribution. |

No orphaned requirements. REQUIREMENTS.md maps only BUILD-01..04 to Phase 30, and all four are claimed by plans. REQUIREMENTS.md still shows them as `[ ]` / Pending. The orchestrator should update that; this verifier did not.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| (none) | - | No TBD/FIXME/XXX in `.nvmrc`, `eas.json`, `package.json` | - | - |
| `30-02-SUMMARY.md` | Accomplishments/Decisions | Claims the image's Node was 22.23.2 ("Case A") | Info | Narrative inaccuracy, corrected in UAT. No code impact. |

`expo doctor` noted 2 non-blocking warnings in the 30-02 build (local `eas-cli` dep and `eas` script conflict). Quick task 260816-k8y has since removed both.

### Human Verification Required

None outstanding. The items that need a human (a real EAS build and device install/launch) were already done and recorded in 30-UAT.md tests 3 and 4 (4/4 pass, 2026-10-11).

### Gaps Summary

No blocking gaps. The phase goal is met in the codebase: an exact Node/npm pair (22.23.2 / 10.9.8) is pinned in three places. EAS enforces it via `eas.json`, so drift no longer depends on the base image default. The committed lockfile installs cleanly both locally and on a real EAS production build that shipped to App Store Connect. The only caveat is the BUILD-01 wording/SUMMARY nuance described above. It is documentation-level and does not warrant a gap.

---

_Verified: 2026-10-11_
_Verifier: Claude (gsd-verifier)_
