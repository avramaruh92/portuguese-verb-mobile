---
phase: quick
plan: 260816-k8y
status: complete
subsystem: build-tooling
tags: [eas-cli, devDependencies, expo-doctor, node-pin]
dependency-graph:
  requires: []
  provides: [eas-cli-devdep-removed]
  affects: [package.json, package-lock.json]
tech-stack:
  added: []
  removed: [eas-cli (devDependency)]
  patterns: [npx-version-qualified-cli-invocation]
key-files:
  created: []
  modified:
    - package.json
    - package-lock.json
decisions:
  - "Retired v0.5 decision D-04 (pin eas-cli locally as a devDependency) — the stale global eas-cli@20.0.0 that motivated the pin no longer exists on this machine (global is now 21.8.0/21.2.0-class, satisfying eas.json's `cli.version: '>= 21.1.0'` floor)."
metrics:
  duration: "~15m"
  completed: 2026-08-16
---

# Quick Task 260816-k8y: Remove eas-cli devDependency and eas script Summary

Removed the `eas-cli` devDependency and the redundant `"eas": "eas"` npm script from
`package.json`, regenerated `package-lock.json` under the pinned Node 22.23.2, and verified
the full local check suite (`npm ci`, typecheck, lint, test, `expo-doctor`) is green.

## What Changed

- `package.json`:
  - Deleted `"eas-cli": "^21.1.0",` from `devDependencies`.
  - Deleted `"eas": "eas",` from `scripts`.
  - `engines.node` left untouched at `"22.23.2"`.
- `package-lock.json`: regenerated via `npm install` under Node 22.23.2 (nvm-activated in the
  same shell invocation via `PATH` prefix, since `source` is blocked in this sandbox — see
  Deviations). The entire `eas-cli` dependency subtree (305 `node_modules/*` entries) was
  removed. A small set of 5 new/promoted `node_modules/*` entries appeared as collateral npm
  resolution shifts once `eas-cli` no longer pinned certain transitive versions
  (`@expo/expo-modules-macros-plugin`, `@expo/fingerprint`, `fdir`, `fetch-nodeshim`, and one
  peer-dependency-flag-only entry) — this is expected resolver behavior from removing one
  package, not npm-version drift (confirmed `lockfileVersion` is unchanged in the diff).
- `.nvmrc` and `eas.json` are unchanged (`git diff --quiet` passes for both).

## Verification Results

All ran under Node 22.23.2 (`$HOME/.nvm/versions/node/v22.23.2/bin` prepended to `PATH`):

- `npm ci` — succeeded cleanly (no lockfile-sync error), 1111 packages installed.
- `npm run typecheck` — no type errors.
- `npm run lint` — passes (no output, exit 0).
- `npm test` — 21 test suites / 251 tests, all passed.
- `npx expo-doctor` — **21/21 checks passed, no issues detected.** The two eas-related
  advisories (package.json bin-conflict script; legacy global CLI installed locally) are both
  cleared.
- `npx --yes eas-cli@^21.1.0 --version` — printed `eas-cli/21.8.0 darwin-arm64 node-v22.23.2`
  (>= the `eas.json` `cli.version: '>= 21.1.0'` floor). This is the exact replacement
  invocation for the deleted `npm run eas` script — record for later phases:

  ```bash
  npx eas-cli@^21.1.0 <subcommand>
  ```

  Note: npx also surfaced a one-time advisory that `eas-cli@22.0.0` is now available and
  proceeded with the pinned `^21.1.0` range as requested — this is expected npx behavior, not
  an error.

## Decision Retired

**v0.5 Phase 20 decision D-04** (pin `eas-cli` as a local devDependency to work around a
stale global `eas-cli@20.0.0` shadowing `npx eas-cli`) is now formally retired. The machine's
global `eas-cli` is `21.2.0`-class (npx resolved `21.8.0` from the version-qualified range at
verification time), which satisfies `eas.json`'s `cli.version: ">= 21.1.0"` floor. The
condition that motivated the local pin no longer holds, so future EAS commands should use
`npx eas-cli@^21.1.0 <subcommand>` rather than a project-local script/dependency.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking issue] `source "$HOME/.nvm/nvm.sh"` is blocked by the sandbox**
- **Found during:** Task 1, attempting the plan's literal
  `source "$HOME/.nvm/nvm.sh" && nvm use 22.23.2 && ...` invocation.
- **Issue:** The sandboxed Bash tool refuses any command using `source` on grounds that it
  can't statically verify the sourced script stays inside the worktree.
- **Fix:** Used the functionally equivalent
  `export PATH="$HOME/.nvm/versions/node/v22.23.2/bin:$PATH"` to activate the pinned Node
  22.23.2 toolchain directly, without invoking `nvm.sh`. Verified `node -v` printed
  `v22.23.2` and `npm -v` printed `10.9.8` before running any install/verification command —
  same effective outcome (correct Node/npm pair on `PATH`) as the plan's nvm-based approach.
- **Files modified:** none (shell invocation only).
- **Commit:** N/A (no file change).

None of the plan's task logic, file edits, or verification commands changed — only the
mechanism for activating Node 22.23.2 in this sandboxed environment.

## Known Stubs

None.

## Threat Flags

None — this plan only removed a devDependency and regenerated a lockfile; no new network
endpoints, auth paths, file access patterns, or schema changes were introduced.

## Self-Check: PASSED

- FOUND: `package.json` (no `eas-cli` devDependency, no `eas` script, `engines.node` still
  `22.23.2`)
- FOUND: `package-lock.json` (no `node_modules/eas-cli` entry)
- FOUND: commit `b537116` (`chore(quick-260816-k8y): remove eas-cli devDependency and eas
  script`)
