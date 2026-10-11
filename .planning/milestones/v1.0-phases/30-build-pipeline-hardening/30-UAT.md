---
status: complete
phase: 30-build-pipeline-hardening
source: [30-01-SUMMARY.md, 30-02-SUMMARY.md]
started: 2026-10-11T11:06:00Z
updated: 2026-10-11T11:14:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Node version pin is consistent across all three files
expected: `.nvmrc`, `package.json` `engines.node`, and `eas.json` `build.production.node` all read exactly `22.23.2`. Running `nvm use` in the repo root switches you to Node v22.23.2 without errors.
result: pass

### 2. Clean install + checks pass under pinned Node
expected: Under Node 22.23.2 (after `nvm use`), `npm ci --include=dev` completes with no ERESOLVE or lockfile-mismatch errors, and `npm run typecheck`, `npm run lint`, and `npm test` all exit 0.
result: pass
note: "Run by Claude at user's request — node v22.23.2/npm 10.9.8; npm ci, typecheck, lint exit 0; jest 22 suites / 261 tests passed"

### 3. EAS production build uses the pinned Node and succeeds
expected: `eas build --profile production --platform ios` (or the most recent production build on expo.dev) shows Node 22.23.2 in the "Spin up build environment" step, the `npm ci` install step completes cleanly, and the build finishes successfully with an `.ipa` artifact.
result: pass
note: "Checked by Claude via eas build:list/view + log download — latest iOS production build #6 (a89da11a-b874-41d8-9184-06a18033b1eb, 2026-08-17, commit d927681, pin 22.23.2) FINISHED with .ipa. Base image shipped Node 22.23.1; INSTALL_CUSTOM_TOOLS installed v22.23.2 (npm 10.9.8) from eas.json build.production.node before npm ci --include=dev (1078 packages, no ERESOLVE/lockfile errors). Correction to 30-02-SUMMARY: the image's own default Node was 22.23.1, not 22.23.2 — the eas.json pin is what enforces the match."

### 4. Built app installs and launches
expected: The `.ipa` from the production build installs (TestFlight or direct) on an iOS device and opens to the Setup screen without crashing; a quiz can be started.
result: pass

## Summary

total: 4
passed: 4
issues: 0
pending: 0
skipped: 0
blocked: 0

## Gaps

[none yet]
