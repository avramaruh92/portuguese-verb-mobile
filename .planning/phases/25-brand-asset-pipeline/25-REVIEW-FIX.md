---
phase: 25-brand-asset-pipeline
fixed_at: 2026-08-13T21:55:00Z
review_path: .planning/phases/25-brand-asset-pipeline/25-REVIEW.md
iteration: 1
findings_in_scope: 2
fixed: 2
skipped: 0
status: all_fixed
---

# Phase 25: Code Review Fix Report

**Fixed at:** 2026-08-13T21:55:00Z
**Source review:** .planning/phases/25-brand-asset-pipeline/25-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 2 (fix_scope: critical_warning — 0 critical, 2 warning; the 2 info
  findings, IN-01 and IN-02, were out of scope for this run and were not touched)
- Fixed: 2
- Skipped: 0

## Fixed Issues

### WR-01: Background color and canvas size are duplicated as untracked literals, risking silent drift

**Files modified:** `scripts/generate-brand-assets.ts`
**Commit:** 9374b5b
**Applied fix:** Changed `BACKGROUND_RECT` and `FLAT_BACKGROUND_RECT` from hardcoded
string literals (`'<rect width="1024" height="1024" ... fill="#FFF9F6"/>'`) to template
literals interpolating `CANVAS_PX` and `ICON_BACKGROUND_HEX`, matching the research doc's
reference implementation. Both constants now stay in sync automatically if either source
constant changes.

### WR-02: `extractMarkOnly`'s "well-formed SVG" guard can be bypassed when `<svg` is absent

**Files modified:** `scripts/generate-brand-assets.ts`
**Commit:** 2cff675
**Applied fix:** Introduced an explicit `svgTagStart = svg.indexOf("<svg")` check before
computing `rootTagEnd`, so a missing `<svg` tag (`svgTagStart === -1`) short-circuits to
`rootTagEnd = -1` instead of degrading into `svg.indexOf(">", 0)`, which could previously
match an unrelated `>` character elsewhere in a corrupted/non-SVG source file. The guard's
`if` condition now also checks `svgTagStart === -1` directly.

## Skipped Issues

None — both in-scope findings were fixed.

_Note: IN-01 (dead arithmetic in `renderCenteredOnSafeZone`) and IN-02 (missing dimension
assertion on `splash-icon.png`) were not addressed in this run — they are Info-severity
and outside `fix_scope: critical_warning`. Re-run with `fix_scope: all` to address them._

---

_Fixed: 2026-08-13T21:55:00Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
