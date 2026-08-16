---
phase: 32-homepage-lockup
plan: 02
subsystem: setup-screen-ui
tags: [image, accessibility, lockup, layout, react-native]

dependency-graph:
  requires:
    - assets/images/lafa-homepage-lockup.png (Phase 32 plan 01, 3200x1040 rendered lockup)
  provides:
    - app/index.tsx renders the Lafa brand lockup as a centered, cropped-to-content
      header image in place of the retired plain-Text "Lafa" heading
  affects: []

tech-stack:
  added: []
  patterns:
    - Crop-to-content-bounding-box pattern for a source image whose canvas has a
      blank margin baked in — an overflow:hidden wrapper View carrying the
      accessibility role/label, containing an absolutely-positioned, scaled and
      offset Image with the inner Image hidden from the accessibility tree
      (accessibilityElementsHidden + importantForAccessibility="no-hide-descendants")
      so the single outer element is announced exactly once

key-files:
  created: []
  modified:
    - app/index.tsx

decisions:
  - "Lockup rendered as a content-cropped image (measured bounding box of
     non-background pixels), not the full 1600x520 canvas, because the source
     PNG's own background rect leaves a large blank margin that skewed
     box-based centering/alignment; the locked source SVG itself was not
     modified (D-04 forbids cropping/trimming it)."

metrics:
  duration: ~2h (including 5 rounds of on-device developer feedback/iteration)
  completed: 2026-08-16
---

# Phase 32 Plan 02: Homepage Lockup Integration Summary

Replaced the Setup screen's plain `<Text>Lafa</Text>` heading with the generated
brand lockup image, rendered as a content-cropped, centered header logo with
full accessibility semantics preserved.

## What Was Built

**Task 1 (commit `a790bcb`):** Added `Image` to the `react-native` import,
replaced `<Text style={styles.heading}>Lafa</Text>` with an `Image` sourced
from `require("../assets/images/lafa-homepage-lockup.png")`, `resizeMode="contain"`,
explicit `accessibilityRole="image"` and `accessibilityLabel="Lafa — Learn it. Say it."`.
Replaced the retired `styles.heading` block with `styles.lockup` sized by
`aspectRatio: 1600 / 520` and a `spacing.lg` bottom margin.

**Task 2 (checkpoint, commits `6858ba2`, `b039275`, `1fb7519`, `1079a16`, `e7a090b`):**
The on-device developer verification round surfaced that the source lockup PNG's
1600x520 canvas has a large blank margin around its visible content (the source
SVG paints its own background rect the same color as the app background), which
made every box-alignment strategy (full-width banner, centered box, left-aligned
box) visually mis-center or mis-size the actual glyphs. After four rounds of
on-device feedback and iteration, the final approach measures the real
non-background pixel bounding box of the rendered PNG with a one-off `sharp`
scan (tolerance 6/channel per pixel, alpha ≥ 200 to exclude antialiased
rounded-corner edges — not committed, throwaway per the plan's checkpoint
recovery scope) and crops the displayed image to just that content region:

- `styles.lockupCrop`: a `width`/`height`-bounded, `overflow: "hidden"`,
  `alignSelf: "center"` wrapper `View` carrying the single accessible image
  role/label (`accessibilityRole="image"`, the exact locked
  `accessibilityLabel`)
- An inner `Image`, absolutely positioned and scaled/offset by constants
  derived from the measured bounding box (`{ x0: 176, y0: 93, x1: 976.5,
  y1: 382.5 }` in the 1600x520 source coordinate space), `resizeMode="stretch"`
  (correct here since the computed dimensions already preserve the source's
  aspect ratio), hidden from the accessibility tree
  (`accessibilityElementsHidden` + `importantForAccessibility="no-hide-descendants"`)
  so VoiceOver announces the lockup exactly once via the outer wrapper
- Target display height locked at `110`pt, computed crop width ≈ `304`pt

The source SVG (`assets/brand/lafa-homepage-lockup.svg`) was never modified —
cropping happens entirely at render time in `app/index.tsx`, respecting D-04's
lock on that asset.

## Verification

- `npm run typecheck`, `npm run lint`, `npm test` (251/251 across 21 suites),
  and `npm run validate-brand` (20/20) all pass at the final committed state.
- `git diff --stat` at every commit in this plan showed only `app/index.tsx`
  as the changed file.
- Developer approved all 10 checklist items on-device after the final
  crop-to-content fix, including confirming VoiceOver announces the lockup
  exactly once and the whole Setup screen (lockup, tense chips, verb mode
  chips, Start Quiz button, feedback link) fits on one screen without
  scrolling.

## Deviations from Plan

### Auto-fixed Issues (Rule 1/3 — checkpoint-driven bug fixes)

The plan's Task 1 acceptance criteria (grep-based checks on `styles.lockup`,
`aspectRatio: 1600 / 520`, `require(...)`, accessibility props) were satisfied
by the first commit exactly as specified. However, the Task 2 on-device
checkpoint uncovered that the plan's specified sizing (`width: "100%",
maxWidth: 400, aspectRatio: 1600 / 520`) did not account for the source
canvas's blank margin, producing real layout/visual bugs only visible on a
device:

**1. [Rule 1 - Bug] Content clipped off-screen with no scroll**
- **Found during:** first Task 2 checkpoint round
- **Issue:** The plan-specified full-width lockup was taller than the retired
  text heading, pushing total screen content past the viewport; `styles.container`
  had `justifyContent: "center"` with no scroll container, so overflow was
  clipped symmetrically top/bottom
- **Fix (later superseded):** Converted the root `View` to a `ScrollView`
- **Files:** `app/index.tsx`
- **Commit:** `6858ba2`

**2. [Rule 1 - Bug] Lockup too large / hero-banner sized, not a header logo**
- **Found during:** second Task 2 checkpoint round
- **Issue:** Developer feedback: fits without scrolling now, but the lockup
  itself reads as an oversized banner rather than a compact header logotype
- **Fix (later superseded):** Reverted the `ScrollView`, shrunk `styles.lockup`
  to a fixed `height: 56` (aspect-ratio-derived width)
- **Files:** `app/index.tsx`
- **Commit:** `b039275`

**3. [Rule 1 - Bug] Content vertically centered leaves large dead space**
- **Found during:** third Task 2 checkpoint round
- **Issue:** `justifyContent: "center"` on the container left large empty gaps
  above/below the content block, making the lockup read as floating
- **Fix (later superseded):** Anchored content near the top
  (`justifyContent: "flex-start"` + `paddingTop: spacing.xl2`), enlarged
  lockup height to `84`
- **Files:** `app/index.tsx`
- **Commit:** `1fb7519`

**4. [Rule 1 - Bug] Visible glyphs shifted left of true center**
- **Found during:** fourth Task 2 checkpoint round
- **Issue:** `alignSelf: "center"` centered the image's bounding box, but the
  box's blank right margin (from the source canvas's own background rect)
  shifted the visible glyphs left of true center
- **Fix (later superseded):** Left-aligned the box (`alignSelf: "flex-start"`)
  to approximate the visible content's true left edge
- **Files:** `app/index.tsx`
- **Commit:** `1079a16`

**5. [Rule 1 - Bug] Left-alignment still didn't read as centered/large enough**
- **Found during:** fifth Task 2 checkpoint round
- **Issue:** Left-aligning the box still wasn't visually centered (stacked
  margins), and the developer wanted the lockup genuinely bigger
- **Fix (final):** Measured the true non-background pixel bounding box of the
  rendered PNG and cropped the displayed image to just that region via an
  `overflow: hidden` wrapper + absolutely-positioned inner `Image`, then
  centered the crop box; increased target height to `110`
- **Files:** `app/index.tsx`
- **Commit:** `e7a090b`

All five fixes were scoped entirely to `app/index.tsx`; no other files were
touched, no dependencies were added, and the locked source SVG
(`assets/brand/lafa-homepage-lockup.svg`) was never modified.

## Self-Check: PASSED

- FOUND: app/index.tsx (modified)
- FOUND commit a790bcb (Task 1)
- FOUND commit 6858ba2 (Task 2 fix — ScrollView, superseded)
- FOUND commit b039275 (Task 2 fix — compact header logo, superseded)
- FOUND commit 1fb7519 (Task 2 fix — anchor top + enlarge, superseded)
- FOUND commit 1079a16 (Task 2 fix — left-align, superseded)
- FOUND commit e7a090b (Task 2 fix — crop-to-content, final)
- FOUND: `grep -c 'styles.heading' app/index.tsx` = 0
- FOUND: developer approval recorded ("approved" — all 10 checklist items)
