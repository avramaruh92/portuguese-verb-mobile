---
phase: 22-icon-splash-asset-pipeline
plan: 01
subsystem: infra
tags: [resvg, resvg-js, sharp, svg, png, expo-icon, asset-pipeline, node-scripts]

# Dependency graph
requires: []
provides:
  - "scripts/generate-brand-assets.ts: reproducible SVG-to-PNG generation script"
  - "assets/images/icon.png: 1024x1024 alpha-free branded app icon"
  - "assets/images/splash-icon.png: 228px white monochrome splash glyph"
  - "@resvg/resvg-js + sharp devDependencies for future brand-asset regeneration"
affects: [22-02, future-icon-splash-work, eas-build-submit]

# Tech tracking
tech-stack:
  added: ["@resvg/resvg-js@^2.6.2 (devDependency, SVG rasterization)", "sharp@^0.35.3 (devDependency, alpha-channel post-processing)"]
  patterns: ["scripts/ top-level folder for one-off Node build tooling", "extract-and-patch-in-memory pattern for deriving generated assets from an unmodified source file"]

key-files:
  created: [scripts/generate-brand-assets.ts]
  modified: [package.json, package-lock.json, assets/images/icon.png, assets/images/splash-icon.png, assets/brand/lafa-logo-v2.svg (added, not modified), assets/brand/lafa-logo-v2-concept.png (added)]

key-decisions:
  - "Committed assets/brand/lafa-logo-v2.svg and lafa-logo-v2-concept.png as the very first commit (D-10), establishing a git baseline so ICON-04 unmodified-source verification uses git diff --exit-code"
  - "Added sharp as a second devDependency beyond the plan's original resvg-only scope, because resvg's background render option flattens alpha values to opaque but still encodes an RGBA PNG color type — sips reported hasAlpha: yes until sharp's removeAlpha() re-encoded a true RGB PNG"
  - "Patched the swoop stroke path with an in-memory fill=\"none\" override (never touching the source SVG file) after discovering the source's implicit SVG default fill (black) rendered a solid crescent instead of the smile-line shape shown in the brand concept reference image"

patterns-established:
  - "Extract-and-patch-in-memory: read the canonical SVG source once, string-slice out the relevant group, apply any per-variant string replacements to a throwaway in-memory copy, and never call writeFileSync on any path under assets/brand/ — this is the reusable shape for any future brand-asset regeneration script"

requirements-completed: [ICON-01, ICON-03, ICON-04]

# Metrics
duration: 45min
completed: 2026-07-23
---

# Phase 22 Plan 01: Icon & Splash Asset Pipeline Summary

**Node script rasterizes a 1024x1024 alpha-free app icon and a 228px transparent white splash glyph from the Lafa brand SVG using @resvg/resvg-js + sharp, with the source SVG kept byte-for-byte unmodified and committed to git as the pipeline's git-diffable baseline.**

## Performance

- **Duration:** ~45 min
- **Started:** 2026-07-23T21:49:00Z (approx, worktree dispatch)
- **Completed:** 2026-07-23
- **Tasks:** 3/3 completed
- **Files modified:** 7 (2 brand assets added, package.json, package-lock.json, 1 script created, 2 PNGs regenerated)

## Accomplishments
- `assets/brand/lafa-logo-v2.svg` and `lafa-logo-v2-concept.png` committed to git before any generation ran, establishing the ICON-04 unmodified-source baseline
- `scripts/generate-brand-assets.ts` authored: extracts the SVG's `<g id="icon">` group, renders a 1024x1024 alpha-free peach-backed icon PNG and a 228px transparent white splash-glyph PNG, with fail-loud invariant checks at every string-manipulation boundary
- `assets/images/icon.png` regenerated: 1024x1024, no alpha channel, isolated Lafa "a" mark bled edge-to-edge on `#FCE4DA`
- `assets/images/splash-icon.png` regenerated: 228px wide, white monochrome "a" silhouette on a transparent background, no green accent dot
- `npm run generate-assets` is fully reproducible; `assets/brand/lafa-logo-v2.svg` verified byte-for-byte unmodified via `git diff --exit-code`
- Full Jest suite (251 tests, 21 suites) passes with zero regressions

## Task Commits

Each task was committed atomically:

1. **Task 1a: Commit brand source assets** - `b3fa230` (chore) — commits `lafa-logo-v2.svg` + `lafa-logo-v2-concept.png` per D-10
2. **Task 1b: Add rasterizer devDependency + npm script** - `5a7cfd2` (chore) — `@resvg/resvg-js@^2.6.2` + `generate-assets` script
3. **Task 2: Write the SVG-to-PNG generation script** - `beb76a5` (feat) — `scripts/generate-brand-assets.ts`
4. **Task 2 fix: Correct swoop fill + true alpha-free icon** - `6f6fda0` (fix) — see Deviations below
5. **Task 2 fix: Add sharp devDependency** - `127ffee` (chore) — see Deviations below
6. **Task 3: Regenerate and verify both PNGs** - `8fbcede` (feat) — `assets/images/icon.png`, `assets/images/splash-icon.png`

_Note: Task 1 was split into two commits (brand-source commit first, per D-10's explicit ordering requirement, then the devDependency/script addition) since the plan itself describes them as two sequential actions within one task._

## Files Created/Modified
- `scripts/generate-brand-assets.ts` - SVG-to-PNG rasterization script (icon + splash variants)
- `assets/brand/lafa-logo-v2.svg` - canonical brand mark source, newly committed (unmodified thereafter)
- `assets/brand/lafa-logo-v2-concept.png` - reference concept image, newly committed
- `assets/images/icon.png` - regenerated 1024x1024 alpha-free app icon
- `assets/images/splash-icon.png` - regenerated 228px white monochrome splash glyph
- `package.json` - added `@resvg/resvg-js` + `sharp` devDependencies, `generate-assets` script
- `package-lock.json` - lockfile updates for the two new devDependencies

## Decisions Made
- Kept `node scripts/generate-brand-assets.ts` as the script runner (Node 25 strips TypeScript types natively) rather than falling back to `ts-node` — the plain `node` invocation worked without modification.
- Normalized the swoop stroke path to `fill="none"` only in the in-memory extracted copy passed to the renderer, never touching the source file, to preserve ICON-04's byte-for-byte guarantee while still fixing the rendering bug.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Swoop stroke path rendered as a solid black crescent instead of a smile line**
- **Found during:** Task 3 (visual verification of the generated icon/splash PNGs)
- **Issue:** The source SVG's swoop path (`stroke="#E8663D" stroke-width="30" stroke-linecap="round"`, no `fill` attribute) relies on SVG's implicit default fill (solid black). Resvg rendered this as a filled black crescent bridging the stroke's endpoints in both the icon and splash variants — visibly wrong compared to `assets/brand/lafa-logo-v2-concept.png`, where the swoop reads as an open smile line. In the splash variant this bug was total: the entire splash render was a black shape instead of a white silhouette.
- **Fix:** Added a `normalizeSwoopFill()` step in the script that patches `fill="none"` onto the swoop path in the in-memory extracted copy only, with a fail-loud `Error` if the expected unclosed-tag pattern isn't found. The source SVG file itself is never touched.
- **Files modified:** `scripts/generate-brand-assets.ts`
- **Verification:** Re-ran `npm run generate-assets`, visually confirmed both PNGs now show the correct smile-line shape; `git diff --exit-code assets/brand/lafa-logo-v2.svg` still exits 0.
- **Committed in:** `6f6fda0`

**2. [Rule 1 - Bug] `@resvg/resvg-js`'s `background` option did not produce a true alpha-free PNG**
- **Found during:** Task 3 (`sips -g hasAlpha` verification)
- **Issue:** Resvg's `background` render option flattens all pixel alpha values to opaque, but the library always encodes output PNGs with an RGBA color type — `sips -g hasAlpha` still reported `yes` even though every pixel was fully opaque, failing the ICON-01 "no alpha channel" acceptance criterion.
- **Fix:** Added `sharp` (already package-legitimacy-audited `[OK]` in `22-RESEARCH.md`, listed there as the researched fallback specifically for this role — prebuilt binaries, no postinstall compile step, `^0.35.3` matches the audited version) as a devDependency. `generateIcon()` now pipes the resvg PNG buffer through `sharp(...).removeAlpha().png().toBuffer()` before writing, producing a true RGB (alpha-free) PNG. The splash variant intentionally keeps its alpha channel (transparency is required there per D-05) and was left untouched.
- **Files modified:** `scripts/generate-brand-assets.ts`, `package.json`, `package-lock.json`
- **Verification:** `sips -g pixelWidth -g pixelHeight -g hasAlpha assets/images/icon.png` now reports `1024 / 1024 / no`.
- **Committed in:** `6f6fda0` (script change), `127ffee` (dependency addition)

---

**Total deviations:** 2 auto-fixed (both Rule 1 - bug fixes discovered during Task 3 verification)
**Impact on plan:** Both fixes were required to meet the plan's own must_haves/acceptance criteria (correct smile shape matching brand intent; true alpha-free icon PNG). The plan's Task 1 explicitly said "Do NOT install sharp... not needed" based on an assumption that resvg's `background` option alone was sufficient — that assumption did not hold in practice. Sharp was already vetted as `[OK]` in RESEARCH.md for exactly this contingency, so no new unaudited package was introduced. No scope creep beyond what was needed to satisfy ICON-01/ICON-03.

## Issues Encountered
- The dispatch context stated `assets/brand/lafa-logo-v2.svg` and `lafa-logo-v2-concept.png` were untracked in this worktree, but on inspection this worktree's working directory only had the older, unrelated `lafa-logo.svg`/`lafa-logo-concept.png` files (already tracked, unrelated content — no `id="icon"` group, different geometry). The actual v2 files existed only in the main repo checkout's working directory (uncommitted there too, but not synced into this worktree's separate working tree). Copied both files from the main checkout into this worktree before proceeding with Task 1, since worktrees have independent working directories that don't share untracked files.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- `assets/images/icon.png` and `assets/images/splash-icon.png` are ready to be wired into `app.json`'s icon/splash config (Icon Composer removal, ICON-02, is out of scope for this plan — deferred to a later plan in this phase per the phase's task breakdown).
- `npm run generate-assets` is a stable, reusable entry point for any future brand-mark rebrand.
- No blockers.

## Self-Check: PASSED

All created files verified present on disk; all 6 task commit hashes verified present in git history.

---
*Phase: 22-icon-splash-asset-pipeline*
*Completed: 2026-07-23*
