---
phase: 30-build-pipeline-hardening
plan: 01
subsystem: build-pipeline
tags: [node-pin, eas, lockfile, ci]
dependency-graph:
  requires: []
  provides: [node-version-pin, clean-lockfile]
  affects: [30-02]
tech-stack:
  added: []
  patterns: [three-file-version-pin]
key-files:
  created:
    - .nvmrc
  modified:
    - package.json
    - eas.json
    - package-lock.json
decisions:
  - "Pinned Node 22.23.2 (resolved via `nvm install 22` at execution time) — PROVISIONAL, per plan objective, pending plan 30-02's real EAS build-log reconciliation"
metrics:
  duration: "~15 minutes"
  completed: 2026-08-16
---

# Phase 30 Plan 01: Node Version Pin + Clean Lockfile Regeneration Summary

Established the three-file Node 22.23.2 pin (`.nvmrc`, `package.json`
`engines.node`, `eas.json` `build.production.node`) and regenerated
`package-lock.json` from scratch under that exact Node/npm pair, with the
full local verification suite (`npm ci`, typecheck, lint, test) green.

## What Was Built

### Task 1: Three-file Node version pin

- Resolved the exact Node 22 patch via `nvm install 22 && nvm use 22`:
  **`node -v` = `v22.23.2`, `npm -v` = `10.9.8`**.
- Created `.nvmrc` at repo root containing the bare string `22.23.2`
  (no `v` prefix, trailing newline).
- Added `"engines": { "node": "22.23.2" }` to `package.json`, placed
  directly after `"version"`.
- Added `"node": "22.23.2"` to `eas.json`'s `build.production` object
  as a sibling of `autoIncrement` (not added to `development`/`preview`,
  per plan scope).
- Verified all three locations hold the byte-identical string via the
  plan's cross-file Node verification script — passed.

**IMPORTANT — this pin is PROVISIONAL**, per the plan's objective. Plan
30-02 runs the real production EAS build and reconciles this pin against
the build log's actual Node version (research flagged the local `nvm`
resolution may be one patch ahead of what the EAS build image ships,
e.g. 22.23.1 at research time vs 22.23.2 resolved here).

### Task 2: Clean lockfile regeneration + full verification suite

- Under the pinned Node 22.23.2/npm 10.9.8: `rm -rf node_modules
  package-lock.json && npm install` — full clean reinstall (1411
  packages).
- `lockfileVersion` **unchanged at `3`** before and after (both npm 11
  and npm 10 write lockfileVersion 3) — the diff instead shows shifted
  `optionalDependencies`/`os`/`cpu`/`libc` platform-specific fields and
  minor resolved-hash changes, consistent with RESEARCH.md Pitfall 2's
  described npm-version-driven divergence signature, not a regression.
- Ran the proof sequence under the same pinned version:
  - `npm ci --include=dev` — exit 0
  - `npm run typecheck` — exit 0 (`tsc --noEmit` clean)
  - `npm run lint` — exit 0 (`expo lint` clean)
  - `npm test` — exit 0, **251/251 tests passing across 21 suites**

## Verification

- `cat .nvmrc` → `22.23.2` (single bare line, no `v` prefix) — confirmed.
- Cross-file Node script confirmed `.nvmrc`, `package.json`
  `engines.node`, and `eas.json` `build.production.node` all hold the
  identical string `22.23.2`.
- `git diff --stat HEAD~2 HEAD` — changes limited to exactly `.nvmrc`,
  `eas.json`, `package.json`, `package-lock.json`. No application source
  touched.
- `npm ci --include=dev` exits 0 under the pinned Node — confirmed.

## Deviations from Plan

None — plan executed exactly as written. No auto-fixes, no architectural
changes, no auth gates.

## Scope Note

Per the plan's explicit scope boundary: SC1 (BUILD-01) and SC4 (BUILD-04)
are only **partially/half-satisfied** by this plan — `.nvmrc` exists with
an exact patch and the local `npm ci` proof is green, but confirmation
against the real EAS build image's actual Node version is deferred to
plan 30-02, which has not yet run. Do not mark BUILD-01/BUILD-04
requirements complete from this plan alone.

## Known Stubs

None.

## Threat Flags

None — this plan touches only build/version-pin configuration files
(`.nvmrc`, `package.json` `engines`, `eas.json` `build.production.node`,
`package-lock.json`), no new network endpoints, auth paths, file access
patterns, or schema changes.

## Self-Check: PASSED

All claimed files exist on disk (`.nvmrc`, `package.json`, `eas.json`,
`package-lock.json`, this SUMMARY.md) and all 3 task commit hashes
(`4c73523`, `353068d`, `fad49d5`) are present in `git log`.
