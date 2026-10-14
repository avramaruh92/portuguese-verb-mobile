---
phase: 39-v1-0-tech-debt-cleanup
plan: 01
subsystem: brand-asset-validation
tags: [validate-brand, sharp, tech-debt]
requires: []
provides:
  - scripts/brand-colors.ts shared brand hex constants
  - src/theme/lockup.ts single source of lockup crop constants
  - validate-brand pixel, repo-root and lockup-bbox gates (37 checks)
affects: [scripts/validate-brand.ts, scripts/generate-brand-assets.ts, app/index.tsx, tsconfig.json]
key-files:
  created: [scripts/brand-colors.ts, src/theme/lockup.ts]
  modified: [scripts/validate-brand.ts, scripts/generate-brand-assets.ts, app/index.tsx, tsconfig.json]
requirements-completed: [DEBT-02, DEBT-03, DEBT-04]
duration: ~20min
completed: 2026-10-14
---

# Phase 39 Plan 01: validate-brand hardening Summary

validate-brand now fails on wrong pixel colour in all 6 brand PNGs, resolves all paths from the repo root via `import.meta.dirname`, and gates the Setup lockup crop constants against the measured bounding box (+-2 px).

## Commits
- 1e1f39a refactor: shared brand-colors.ts + lockup.ts, generator/app rewired, allowImportingTsExtensions
- d6b85cf feat: validate-brand hardened (12 pixel checks, 4 lockup edge checks, ROOT-based paths)

## Results
- Check count: 37/37 (21 + 12 + 4). `import.meta.dirname` worked under tsc; no fallback needed.
- Lockup measured bbox: 176 / 93 / 976.5 / 382.5 (matches constants).
- Task 1: `npm run generate-assets` then validate-brand 21/21; assets restored with git checkout, clean.

## Negative-run proof (D-13), all restored, nothing committed
- cwd: repo root, `scripts/`, and `/tmp` (`node .../scripts/validate-brand.ts`) all give identical PASS/FAIL lines, 37/37.
- Opaque blue #208AEF over icon.png: exit 1; `FAIL icon.png pixel (2,2)` and `(512,307)`; dimensions and no-alpha still PASS (35/37).
- Opaque blue 4-channel over splash-icon.png: exit 1; `FAIL splash-icon.png pixel (2,2)` and `(512,307)` (35/37).
- LOCKUP_CONTENT_X0 = 180: exit 1, exactly one `FAIL lockup crop LOCKUP_CONTENT_X0 ... expected 180 +-2 got 176` (36/37). X0 = 177.5: exit 0.
- Final: typecheck, lint exit 0; jest 277/277; validate-brand 37/37; `git status` clean apart from the untracked node_modules symlink.
- Metro smoke (`npx expo export --platform ios`): succeeded, so the extension-less `../src/theme/lockup` import bundles (RESEARCH assumption A1 retired).

## Deviations from Plan
- [Rule 3 - Blocking] The worktree had no node_modules; added an untracked symlink to the main checkout's node_modules (not a package install, not committed).
- Worktree base was corrected with `git reset --hard a51c1f5` per the startup check (merge-base mismatch, no work lost).

None otherwise; plan executed as written. No stubs, no new threat surface.

## Self-Check: PASSED
Files and commits 1e1f39a, d6b85cf verified present.
