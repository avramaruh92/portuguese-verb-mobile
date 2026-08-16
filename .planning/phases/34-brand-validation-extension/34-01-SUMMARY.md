---
phase: 34-brand-validation-extension
plan: 01
subsystem: infra
tags: [validate-brand, build-gate, sharp, brand-assets, png-dimensions]

# Dependency graph
requires:
  - phase: 31-brand-asset-source-generator
    provides: canonical Warm Bold Mark source (assets/brand/lafa-icon.svg) + id-based generator the gate asserts against
  - phase: 32-homepage-lockup
    provides: lafa-homepage-lockup.png at 3200x1040, the new output this gate now covers
provides:
  - "validate-brand.ts gates the Phase 32 homepage lockup output at 3200x1040 in the same results array / PASS-FAIL loop / exit-code contract as every other check"
  - "Documented VALID-01..04 -> concrete-check mapping proving each requirement is satisfied"
affects: [35-app-store-connect-readiness]

# Tech tracking
tech-stack:
  added: []  # zero dependencies added; reused existing sharp + node:fs + checkPngDimensions helper
  patterns:
    - "New asset checks slot into main()'s single results: CheckResult[] array as an await checkPngDimensions(...) call — no new helper, no separate section"
    - "Path/dimension constants declared bare relative at top level (LOCKUP_PATH, LOCKUP_WIDTH_PX, LOCKUP_HEIGHT_PX) mirroring scripts/generate-brand-assets.ts"

key-files:
  created: [".planning/phases/34-brand-validation-extension/34-01-SUMMARY.md"]
  modified: ["scripts/validate-brand.ts"]

key-decisions:
  - "D-01: checkGeneratorSource() stays a string-match only; no lafa-icon.svg id-layer parse (Phase 31 owns that)"
  - "D-02: exactly one new check — checkPngDimensions(\"lafa-homepage-lockup.png dimensions\", LOCKUP_PATH, 3200, 1040) — reusing the existing helper"
  - "D-03: no checkNoAlpha for the lockup (legitimately RGBA), no lockup generator-source check, no stable-id parse"
  - "D-04: no new section header / results array; same PASS-FAIL loop, summary line, and process.exit(1) contract"

patterns-established:
  - "Each brand output the gate must cover = one checkPngDimensions call in the shared results array, dimensioned from generator-mirroring constants"
  - "The gate's exit-code contract (0 = all pass, 1 = any fail) is stable and re-runnable by downstream phases"

requirements-completed: [VALID-01, VALID-02, VALID-03, VALID-04]

# Metrics
duration: 2min
completed: 2026-08-16
---

# Phase 34 Plan 01: Brand Validation Extension Summary

**`npm run validate-brand` now gates the Phase 32 homepage lockup PNG at 3200x1040 (one new `checkPngDimensions` call + three constants), and the VALID-01..04 requirements are proven traceable to concrete checks — VALID-04 shown to fail the gate (exit 1) when the lockup asset is missing.**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-08-16T21:59:57Z
- **Completed:** 2026-08-16T22:01:30Z
- **Tasks:** 2
- **Files modified:** 1 source (`scripts/validate-brand.ts`) + this summary

## Accomplishments

- Added `LOCKUP_PATH` (bare relative path, no `./`), `LOCKUP_WIDTH_PX = 3200` (with trailing comment noting it mirrors `scripts/generate-brand-assets.ts`), and `LOCKUP_HEIGHT_PX = 1040` to the top-level constants block.
- Appended `await checkPngDimensions("lafa-homepage-lockup.png dimensions", LOCKUP_PATH, LOCKUP_WIDTH_PX, LOCKUP_HEIGHT_PX)` to `main()`'s `results` array, grouped with the other `checkPngDimensions` calls and before `checkForbiddenHexAbsent()`.
- Reused the existing `checkPngDimensions` helper — no new helper function was added.
- Verified `npm run typecheck` exits 0 and `npm run validate-brand` prints `PASS lafa-homepage-lockup.png dimensions -> 3200x1040` with `21/21 checks passed` (exactly +1 vs the pre-change 20 checks) and no `FAIL` lines.
- Proved VALID-04 genuinely gates: with the lockup PNG removed, `npm run validate-brand` printed `FAIL lafa-homepage-lockup.png dimensions -> expected 3200x1040 got error: Input file is missing: assets/images/lafa-homepage-lockup.png`, reported `20/21 checks passed`, and exited 1; after restoring the asset it returned to exit 0 with `21/21 checks passed`.
- `scripts/generate-brand-assets.ts` is byte-identical to its pre-plan state; nothing under `assets/` changed and no `.bak` file remains.

## Task Commits

Each task was committed atomically:

1. **Task 1: Add the homepage lockup dimension check to validate-brand.ts** - `12149b1` (feat)
2. **Task 2: Verify and document the VALID-01..04 requirement-to-check mapping** - (docs, this summary)

_Plan metadata (STATE.md / ROADMAP.md / REQUIREMENTS.md) is owned by the orchestrator and updated centrally after the wave._

## Files Created/Modified

- `scripts/validate-brand.ts` - Added `LOCKUP_PATH` / `LOCKUP_WIDTH_PX` / `LOCKUP_HEIGHT_PX` constants and the single `checkPngDimensions("lafa-homepage-lockup.png dimensions", LOCKUP_PATH, 3200, 1040)` call in `main()`'s results array.
- `.planning/phases/34-brand-validation-extension/34-01-SUMMARY.md` - This summary, including the Requirement Coverage mapping below.

## Requirement Coverage

| Requirement | Check function call | Printed label string | Status |
|-------------|--------------------|----------------------|--------|
| VALID-01 (canonical Warm Bold Mark source) | `checkGeneratorSource()` — string-matches `ALLOWED_SVG_SOURCE` (`assets/brand/lafa-icon.svg`) in `scripts/generate-brand-assets.ts` | `generator references allowed SVG source` | PRE-EXISTING, no change (D-01) |
| VALID-02 (generated assets exist at expected dimensions) | `checkPngDimensions(...)` calls for `icon.png` (1024x1024), `favicon.png` (48x48), `splash-icon.png` (1024x1024), `android-icon-foreground.png` (1024x1024), `android-icon-monochrome.png` (1024x1024) | `icon.png dimensions`, `favicon.png dimensions`, `splash-icon.png dimensions`, `android-icon-foreground.png dimensions`, `android-icon-monochrome.png dimensions` | PRE-EXISTING, no change |
| VALID-03 (icon.png has no alpha) | `checkNoAlpha("icon.png no alpha", ICON_PATH)` | `icon.png no alpha` | PRE-EXISTING, no change |
| VALID-04 (homepage lockup output present) | `checkPngDimensions("lafa-homepage-lockup.png dimensions", LOCKUP_PATH, LOCKUP_WIDTH_PX, LOCKUP_HEIGHT_PX)` (3200x1040) | `lafa-homepage-lockup.png dimensions` | NEW in this phase (D-02) |

**Observed gate behavior:**

- Restored-run final summary line (asset present): `21/21 checks passed`, exit code **0**.
- Negative run (lockup PNG renamed to `.bak`): `FAIL lafa-homepage-lockup.png dimensions -> expected 3200x1040 got error: Input file is missing: assets/images/lafa-homepage-lockup.png`, `20/21 checks passed`, exit code **1**.
- Asset restored before task completion; `git status --porcelain assets/` reports no changes and no `.bak` file remains.

**Phase 35 note:** the gate's exit-code contract is unchanged — `0` = all checks pass, `1` = any check fails — so Phase 35 can re-run `npm run validate-brand` as-is before the real EAS submission.

## Decisions Made

Followed the plan's decisions exactly — no new decisions required during execution:

- D-01: kept `checkGeneratorSource()` as a string-match only; no `lafa-icon.svg` id-layer parse (that is Phase 31's concern).
- D-02: added exactly one new check reusing the existing `checkPngDimensions` helper — no new helper written.
- D-03: did not add `checkNoAlpha` for the lockup (the lockup PNG is legitimately RGBA), did not add a lockup generator-source check, and did not parse `lafa-icon.svg` for `mark-depth`/`mark-fill`/`mark-highlight`.
- D-04: no new section header, no separate results array; same PASS/FAIL loop, same summary line, same `process.exit(1)`.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None. The only output noise was the pre-existing Node `MODULE_TYPELESS_PACKAGE_JSON` ESM warning from `node scripts/validate-brand.ts`, which is unrelated to this change and was present before.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- `npm run validate-brand` now covers every generated brand asset (source canonicality, icon/splash/favicon/Android dimensions, icon.png no-alpha, and the Phase 32 homepage lockup at 3200x1040) under one exit-code contract.
- Phase 35 (App Store Connect Readiness) can re-run `npm run validate-brand` as the pre-EAS-submit brand gate with no further changes.
- Requirements VALID-01 through VALID-04 are all satisfied and traceable to named checks (see Requirement Coverage above).

---
*Phase: 34-brand-validation-extension*
*Completed: 2026-08-16*

## Self-Check: PASSED

- `scripts/validate-brand.ts` modified: confirmed via git (Task 1 commit `12149b1`).
- `34-01-SUMMARY.md` created: confirmed on disk.
- Task 1 commit `12149b1` exists: confirmed via `git log --all`.
- `assets/images/lafa-homepage-lockup.png` present, no `.bak` remains, `git status --porcelain assets/` clean: confirmed.
