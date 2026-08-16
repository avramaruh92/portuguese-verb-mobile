---
phase: 29-brand-validation-release-verification
plan: 01
subsystem: release-tooling
tags: [validation, brand, scripts, ci-gate]
dependency_graph:
  requires: [scripts/generate-brand-assets.ts, app.json]
  provides: [scripts/validate-brand.ts, "npm run validate-brand"]
  affects: [package.json]
tech_stack:
  added: []
  patterns: [check-runner-shape (mirrors scripts/preflight.ts), independent-forbidden-literal-assertion]
key_files:
  created:
    - scripts/validate-brand.ts
  modified:
    - package.json
decisions:
  - "D-01/D-02/D-03 from 29-CONTEXT.md applied verbatim: standalone node script (not Jest, not folded into preflight.ts), sharp(path).metadata() for PNG inspection (never sips), forbidden-hex/retired-asset literals declared independently in validate-brand.ts (never imported from generate-brand-assets.ts)"
metrics:
  duration: "~25 minutes"
  completed: 2026-08-15
---

# Phase 29 Plan 01: Brand Validation Script Summary

Added `scripts/validate-brand.ts`, a committed, exit-code-carrying validator
that automates the Phase 25-28 rebrand's correctness proof (app.json config
hex values, generated PNG dimensions/alpha, generator source-path hygiene)
and wired it to `npm run validate-brand`.

## What Was Built

**Task 1 — `scripts/validate-brand.ts`:** A plain node-runnable TypeScript
script mirroring `scripts/preflight.ts`'s `CheckResult`/per-check-function/
`main()`/`process.exit(1)` shape (widened `expected: number | string`).
20 checks across 4 categories:

1. PNG dimensions (icon/favicon/splash/android-foreground/android-monochrome)
   and icon no-alpha, via `sharp(path).metadata()` — never a `sips` shell-out
   (D-02).
2. `app.json` config: forbidden Expo-blue hex absence (`#208AEF`, `#E6F4FE`,
   declared as independent literals per D-03, never imported from
   `generate-brand-assets.ts`), adaptive-icon background color, splash plugin
   background+image (located via tuple search since `expo-splash-screen` is a
   `[name, config]` entry, not a bare string).
3. Referenced-asset existence (`icon`, `favicon`, both Android adaptive
   images, splash image) via `existsSync`, one `CheckResult` per reference so
   a single run names every broken path.
4. Generator source-path hygiene: `generate-brand-assets.ts` references the
   allowed SVG source and none of the four retired AI-concept assets, neither
   in generator text nor on disk.

Every check function try/catches its fs/`sharp` access and returns
`{ ok: false, actual: "error: ..." }` rather than throwing to `main()`
(mitigates T-29-02, denial-of-service via a malformed/missing input file).

**Task 2 — npm wiring + fail-path proof:** Added
`"validate-brand": "node scripts/validate-brand.ts"` to `package.json`'s
scripts block immediately after `"preflight"`. Empirically proved the gate
gates (mitigates T-29-03, repudiation): temporarily changed `app.json`'s
`android.adaptiveIcon.backgroundColor` to the forbidden `#E6F4FE`, ran
`npm run validate-brand`, observed exit code 1 with exactly 2 `FAIL` lines
(`app.json forbidden hex absent`, `android adaptiveIcon backgroundColor`),
then reverted `app.json` to `#FFF9F6` and confirmed `git diff --exit-code
app.json` succeeded (byte-identical) before re-running to confirm exit 0
(20/20 checks passed).

**Task 3 — VALID-02 gate suite:** Ran `npm test -- src/theme/tokens.test.ts`
(9/9 passed), `npm run typecheck` (clean, zero errors — no
`noUncheckedIndexedAccess` issues arose; the plugin-tuple lookup and
`sharp` metadata optionals were already guarded with `??` defaults in Task
1's implementation), `npm run lint` (clean, zero errors/warnings), and
`npm run validate-brand` (20/20 passed) — all green with zero fixes needed.
Full `npm test` run: **251/251 tests passing across 21 suites** — identical
count to the pre-plan baseline recorded in PROJECT.md (v0.5: 251 tests/21
suites), confirming the new script introduced zero regressions (it is not
imported by any app code). `tsconfig.json` and `eslint.config.js` are both
byte-identical to their pre-plan state (`git diff --exit-code` succeeded on
both).

## Deviations from Plan

None - plan executed exactly as written. No `noUncheckedIndexedAccess`
typecheck errors surfaced (the plan anticipated this as a likely fix point;
the script was written with `??` defaults from the start, so Task 3 required
zero code changes).

## Verification

- `node scripts/validate-brand.ts` and `npm run validate-brand` both exit 0,
  20/20 checks passed, zero FAIL lines
- Fail-path proof: temporary `#E6F4FE` perturbation produced exit 1, 2 FAIL
  lines, `app.json` reverted byte-identical
- `npm test -- src/theme/tokens.test.ts`, `npm run typecheck`, `npm run lint`
  all exit 0
- Full `npm test`: 251/251 tests, 21/21 suites passing
- `git diff --exit-code app.json tsconfig.json eslint.config.js` succeeds

## Self-Check: PASSED

- FOUND: scripts/validate-brand.ts
- FOUND: package.json contains `"validate-brand": "node scripts/validate-brand.ts"`
- FOUND commit 4cf60bd (Task 1)
- FOUND commit 3d53dcd (Task 2)
