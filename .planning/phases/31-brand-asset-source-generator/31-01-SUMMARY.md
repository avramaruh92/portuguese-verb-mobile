---
phase: 31-brand-asset-source-generator
plan: 01
subsystem: infra
tags: [svg, linkedom, brand-assets, devdependency, node]

# Dependency graph
requires:
  - phase: 30-build-pipeline-hardening
    provides: ".nvmrc"-pinned Node 22.23.2 toolchain, resolving the recurring npm-version lockfile-drift bug
provides:
  - "assets/brand/lafa-icon.svg promoted to the Warm Bold Mark with stable mark-depth/mark-fill/mark-highlight layer ids"
  - "linkedom@0.18.13 installed as a build-time-only devDependency, verified importable and typecheck-clean"
affects: [31-02-generator-rewrite, 34-brand-validation-extension]

# Tech tracking
tech-stack:
  added: ["linkedom@0.18.13 (devDependency, build-time SVG DOM parsing)"]
  patterns:
    - "Package-legitimacy blocking-human checkpoint gates any new devDependency install when no phase-level Package Legitimacy Audit exists ([ASSUMED] fallback policy)"
    - "Stable <g id>/<path id> layer ids on canonical brand-asset SVGs replace brittle fill-count/clip-path structural parsing"

key-files:
  created: []
  modified:
    - "assets/brand/lafa-icon.svg"
    - "package.json"
    - "package-lock.json"

key-decisions:
  - "linkedom package legitimacy approved by the coordinator on behalf of the human operator after verifying WebReflection authorship/repo match against npm registry data (T-31-SC mitigation satisfied)"
  - "Worktree isolation failed to provision for this plan (no worktree-agent-* branch/worktree was ever created); coordinator switched phase 31 execution to sequential mode on the existing plan/phase-20 branch instead of self-recovering or discarding work"
  - "Per plan D-04, promoted lafa-icon.svg keeps the candidate's exact element nesting (no restructuring), only adding three id attributes and dropping title/desc/role/aria-labelledby candidate-review metadata"

patterns-established:
  - "SVG DOM verification via linkedom's DOMParser + querySelectorAll('[id]') as the standard way to assert exact-id-set invariants on brand-asset sources going forward (used by plan 31-02's generator and future validate-brand.ts checks)"

requirements-completed: [BRAND-01]

# Metrics
duration: 25min
completed: 2026-08-16
---

# Phase 31 Plan 01: Brand Asset Source Promotion + linkedom Dependency Summary

**Promoted the Warm Bold Mark candidate to the canonical `assets/brand/lafa-icon.svg` with three stable layer ids (`mark-depth`/`mark-fill`/`mark-highlight`), and added `linkedom@0.18.13` as a build-time-only devDependency for plan 31-02's upcoming id-based SVG extraction.**

## Performance

- **Duration:** ~25 min
- **Started:** 2026-08-16T15:14:14Z (approx, per STATE.md session start)
- **Completed:** 2026-08-16T15:22:33Z
- **Tasks:** 3 (1 checkpoint + 2 auto)
- **Files modified:** 3 (`package.json`, `package-lock.json`, `assets/brand/lafa-icon.svg`)

## Accomplishments
- Cleared the blocking-human package-legitimacy checkpoint for `linkedom` (WebReflection-authored, matches `.planning/research/SUMMARY.md`'s recommended stack)
- Installed `linkedom@0.18.13` into `devDependencies` only (never `dependencies`), regenerated `package-lock.json` under the `.nvmrc`-pinned Node 22.23.2, confirmed importable via `require('linkedom').DOMParser`
- Rewrote `assets/brand/lafa-icon.svg` from the old 2-path `clip-path`/`<defs>`-wrapped structure to the Warm Bold Mark's 3-layer geometry, with exactly the ids `mark-depth` (the depth `<g>`), `mark-fill` (main outline `<path>`), and `mark-highlight` (accent `<path>`)
- Verified all three `d=` path-data strings are byte-identical to `assets/brand/candidates/lafa-icon-warm-bold.svg`, which remains unmodified
- Full verification suite green: `npm run typecheck`, `npm run lint`, `npm test` (251/251 tests, 21/21 suites)

## Task Commits

Each task was committed atomically:

1. **Task 1: Package legitimacy gate for linkedom** — checkpoint, no commit (human/coordinator approval only)
2. **Task 2: Add linkedom as a build-time devDependency** - `e929b69` (chore)
3. **Task 3: Promote the Warm Bold Mark to assets/brand/lafa-icon.svg with stable layer ids** - `3d9d208` (feat)

**Plan metadata:** (this commit, docs: complete plan)

## Files Created/Modified
- `package.json` - added `linkedom: "^0.18.13"` to `devDependencies` only
- `package-lock.json` - regenerated under Node 22.23.2, added `node_modules/linkedom` entry, no other version changes
- `assets/brand/lafa-icon.svg` - replaced with the Warm Bold Mark: root `<svg>` drops `role`/`aria-labelledby`; `<title>`/`<desc>` removed; `<g id="mark-depth">` wraps the depth path; `<path id="mark-fill">` is the main outline; `<path id="mark-highlight">` is the accent shape; the `translate(512 512) scale(0.96) translate(-512 -512)` wrapper is preserved with no id

## Decisions Made
- linkedom package legitimacy: approved after verifying npm registry facts (WebReflection/Andrea Giammarchi authorship, https://github.com/WebReflection/linkedom repository, dual CJS/ESM exports) against the plan's `[ASSUMED]` fallback policy — see `T-31-SC` in the plan's threat register
- Execution mode: worktree isolation never provisioned for this plan run (confirmed via `git worktree list` showing only the main checkout, and no `worktree-agent-*` branch existing anywhere); the coordinator explicitly switched to sequential execution on `plan/phase-20` rather than having the executor self-recover, since phase 31 has no parallel waves to lose

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking, environment] Worktree isolation not provisioned — switched to sequential execution**
- **Found during:** Task 2, immediately after the linkedom install completed
- **Issue:** Initial branch check reported HEAD on `worktree-agent-a4084504f0aaf0140`, but every subsequent Bash call landed on `plan/phase-20` in the main repo checkout (`.git` is a directory, not a worktree file; `git worktree list` shows only the main checkout; no `worktree-agent-*` branch exists anywhere). This is the cwd-drift class of failure (#3097) the pre-commit HEAD safety assertion is designed to catch.
- **Fix:** Halted before committing, surfaced the discrepancy to the coordinator rather than self-recovering. Coordinator confirmed the worktree was never provisioned and explicitly authorized proceeding as a sequential executor directly on `plan/phase-20`, since phase 31 has only one plan per wave (no parallelism lost).
- **Files modified:** None (environment/process deviation only, no code changes beyond the plan's own scope)
- **Verification:** Re-ran the branch check after coordinator's message; proceeded only after explicit authorization
- **Committed in:** N/A (process deviation, not a code change)

---

**Total deviations:** 1 auto-fixed (1 blocking/environment)
**Impact on plan:** No scope creep — all plan-scoped file changes (`package.json`, `package-lock.json`, `assets/brand/lafa-icon.svg`) match the plan exactly. The only deviation was an execution-environment correction (worktree → sequential), authorized explicitly by the coordinator before any commit was made.

## Issues Encountered
- Worktree isolation failure — see Deviations above. Resolved by coordinator directive to run sequentially on `plan/phase-20`.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- `assets/brand/lafa-icon.svg` now carries the exact `mark-depth`/`mark-fill`/`mark-highlight` id set plan 31-02's generator rewrite needs for id-based layer extraction
- `linkedom` is installed, devDependency-only, importable, and typecheck-clean — ready for plan 31-02 to build its parser against
- **Known, intended break:** `npm run generate-assets` will fail until plan 31-02 lands, because the old `extractMarkOnly()` still keys on `EXPECTED_MARK_PATH_COUNT = 2` and a `clip-path="url("` reference, neither of which the promoted source satisfies. This is the plan's documented fail-loud signal, not a regression — do not attempt to fix or work around it in this plan or before 31-02.
- No blockers for 31-02.

---
*Phase: 31-brand-asset-source-generator*
*Completed: 2026-08-16*
