---
phase: 25-brand-asset-pipeline
plan: 01
subsystem: brand-asset-pipeline
tags: [assets, svg, png, resvg, sharp, icon, splash, android-adaptive-icon]
dependency-graph:
  requires: []
  provides:
    - assets/brand/lafa-icon.svg (sole brand source SVG)
    - scripts/generate-brand-assets.ts (five-output generator)
    - assets/images/icon.png
    - assets/images/favicon.png
    - assets/images/splash-icon.png
    - assets/images/android-icon-foreground.png
    - assets/images/android-icon-monochrome.png
  affects:
    - Phase 27 (app.json splash + adaptive icon config, consumes these regenerated PNGs)
    - Phase 28 (Setup-screen icon usage)
tech-stack:
  added: []
  patterns:
    - "Defensive string-based SVG extraction (throw on shape mismatch) carried forward from the old script, rewritten around the new two-shape (background rect + 2 mark paths) source structure"
    - "Resvg.getBBox() + sharp.composite(gravity: center) for Android adaptive-icon safe-zone centering, no manual offset math"
    - "Recolor-before-rasterize for monochrome silhouette (pixel-exact, no raster thresholding)"
key-files:
  created:
    - assets/brand/lafa-icon.svg
  modified:
    - scripts/generate-brand-assets.ts
    - assets/images/icon.png
    - assets/images/favicon.png
    - assets/images/splash-icon.png
    - assets/images/android-icon-foreground.png
    - assets/images/android-icon-monochrome.png
  deleted:
    - assets/brand/lafa-logo.svg
    - assets/brand/lafa-logo-v2.svg
    - assets/brand/lafa-logo-concept.png
    - assets/brand/lafa-logo-v2-concept.png
decisions:
  - "D-01/D-02/D-03/D-04/D-05/D-06/D-07 (from 25-CONTEXT.md) all implemented as specified — no deviations"
metrics:
  duration: "~40 minutes"
  completed: 2026-08-13
---

# Phase 25 Plan 01: Brand Asset Pipeline Summary

Rewrote the brand-asset generation pipeline around a single new source SVG
(`assets/brand/lafa-icon.svg`, a background rect + two-path speech-bubble/"a"
mark), retiring the old AI-concept SVGs entirely and producing all five app
assets (icon, favicon, splash, Android adaptive foreground + monochrome) from
one `npm run generate-assets` run.

## What Was Built

**Task 1 — Source rename + legacy cleanup:** `assets/brand/Lafa_final_logo.svg`
(untracked) was moved to `assets/brand/lafa-icon.svg` and staged; the four
legacy AI-generated brand assets (`lafa-logo.svg`, `lafa-logo-v2.svg`,
`lafa-logo-concept.png`, `lafa-logo-v2-concept.png`) were `git rm`'d outright.
`assets/brand/` now contains exactly one file.

**Task 2 — Generator rewrite:** `scripts/generate-brand-assets.ts` was fully
rewritten (same path, same npm script, same direct-`node` invocation, zero new
dependencies). The old extraction logic (`ICON_GROUP` tags, `GREEN_ACCENT_DOT`,
`CROP_VIEWBOX`, stroke-tail patching) — built for the old source's structurally
different shape — was retired entirely. New functions: `extractMarkOnly`,
`wrapMarkDoc`, `buildFullIconDoc`, `getMarkBBox`, `renderCenteredOnSafeZone`,
`toMonochromeSilhouette`, and a single unconditional `main()` producing all
five outputs.

**Task 3 — Regeneration + verification (checkpoint):** Ran `npm run
generate-assets`, machine-verified every dimension/alpha spec via `sips`,
verified the Android safe-zone bounding box (676px longest side, matching
both outputs exactly), verified idempotency (byte-identical MD5 across two
consecutive runs), confirmed zero live-code references to the old filenames,
confirmed `android-icon-background.png`/`app.json` untouched, and ran the
full test suite (251/251 passing) plus `typecheck`/`lint` (both clean). The
human then visually reviewed all five PNGs and approved.

## Verification Results

- `npm run generate-assets` exits 0, idempotent (byte-identical MD5 across
  two runs)
- `icon.png` — 1024x1024, `hasAlpha: no`, flat `#FFF9F6` square background
  (no baked-in `rx` rounding)
- `favicon.png` — 48x48, `hasAlpha: no`
- `splash-icon.png` — 1024x1024, `hasAlpha: yes`, mark only
- `android-icon-foreground.png` / `android-icon-monochrome.png` — both
  1024x1024, `hasAlpha: yes`, identical trimmed bounding box (676px longest
  side, matching the 66% Android safe-zone convention)
- `grep -rln "lafa-logo" --include="*.ts" --include="*.tsx" --include="*.json" .`
  (excluding `.planning/`, `node_modules/`) returns empty
- `assets/brand/` contains only `lafa-icon.svg`
- `git status --porcelain assets/images` showed exactly the five expected
  PNGs modified; `android-icon-background.png` absent from the diff
- `npm test`: 251/251 passing across 21 suites (unaffected — no `src/`/`app/`
  runtime code changed)
- `npm run typecheck` and `npm run lint`: both clean
- `git diff package.json`: empty (zero new dependencies)
- Human visually confirmed all five PNGs (icon, favicon, splash, Android
  foreground, Android monochrome) — approved

## Deviations from Plan

None — plan executed exactly as written. All 7 `must_haves.truths` (D-01
through D-07) satisfied without modification.

## Checkpoints

Task 3 was a `checkpoint:human-verify` with `gate="blocking"`. All automated
spec/idempotency/regression checks were run and passed before pausing for
sign-off. The human reviewed all five generated PNGs directly (icon, favicon,
splash-icon, android-icon-foreground, android-icon-monochrome) and responded
"approved." No issues were found; no rework was required.

## Self-Check

- `assets/brand/lafa-icon.svg` — FOUND
- `scripts/generate-brand-assets.ts` — FOUND (rewritten)
- `assets/images/icon.png` — FOUND
- `assets/images/favicon.png` — FOUND
- `assets/images/splash-icon.png` — FOUND
- `assets/images/android-icon-foreground.png` — FOUND
- `assets/images/android-icon-monochrome.png` — FOUND
- Commit `3ff6165` (Task 1) — FOUND in `git log`
- Commit `1f40fe5` (Task 2) — FOUND in `git log`
- Commit `e3828cd` (Task 3) — FOUND in `git log`

## Self-Check: PASSED
