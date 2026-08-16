---
phase: 25-brand-asset-pipeline
reviewed: 2026-08-13T00:00:00Z
depth: standard
files_reviewed: 1
files_reviewed_list:
  - scripts/generate-brand-assets.ts
findings:
  critical: 0
  warning: 2
  info: 2
  total: 4
status: issues_found
---

# Phase 25: Code Review Report

**Reviewed:** 2026-08-13
**Depth:** standard
**Files Reviewed:** 1
**Status:** issues_found

## Summary

`scripts/generate-brand-assets.ts` was reviewed in full against the phase's locked
decisions (25-CONTEXT.md D-01 through D-07), the researched implementation patterns
(25-RESEARCH.md), and the summary of what was actually built. I re-ran the generator
against the real `assets/brand/lafa-icon.svg`, confirmed byte-identical idempotent
output across two runs, confirmed `sips`-verified dimensions/alpha for all five
outputs match spec (`icon.png` 1024×1024 no-alpha, `favicon.png` 48×48 no-alpha,
`splash-icon.png`/`android-icon-foreground.png`/`android-icon-monochrome.png`
1024×1024 with alpha), confirmed `npm run typecheck` and `npm run lint` both pass
clean, and deliberately corrupted a copy of the source SVG to confirm the defensive
"source may have changed shape" error paths fire correctly and the script exits
non-zero on failure.

No critical/blocker-level defects were found — the core rasterization, cropping,
safe-zone-centering, and monochrome-recolor logic are all correct and match the
locked decisions. The issues below are maintainability/robustness gaps: duplicated
magic constants that could silently drift out of sync on a future edit, an
inconsistent defensive-check pattern between `icon.png` and `splash-icon.png`, an
edge case in the "well-formed SVG" guard, and a piece of dead/misleading arithmetic
in the safe-zone scaling helper.

## Warnings

### WR-01: Background color and canvas size are duplicated as untracked literals, risking silent drift

**File:** `scripts/generate-brand-assets.ts:19, 25, 28`
**Issue:** `ICON_BACKGROUND_HEX = "#FFF9F6"` is declared as the canonical background
color constant (used for the `Resvg` `background` render option at line 143), but
`BACKGROUND_RECT` (line 25) and `FLAT_BACKGROUND_RECT` (line 28) independently
hardcode the literal string `"#FFF9F6"` again, and both also hardcode `"1024"`
instead of interpolating `CANVAS_PX`. This is a deviation from the research doc's
own reference implementation, which built these as template literals interpolating
`CANVAS_PX`/`ICON_BACKGROUND_HEX` (see `25-RESEARCH.md` lines 168 and 191-193).

Concretely, if a future change updates `ICON_BACKGROUND_HEX` (e.g. a palette tweak)
without also updating the two hardcoded rect strings:
- `BACKGROUND_RECT` (used only to *match/strip* the source SVG's own rect) would
  simply fail to match and throw the "missing expected background rect" error —
  loud and safe.
- `FLAT_BACKGROUND_RECT` (used to *render* `icon.png`'s background) would silently
  keep rendering the **old** background color with no error at all — a
  correctness bug that would ship undetected, since nothing validates the rendered
  background color against `ICON_BACKGROUND_HEX`.

Similarly, if `CANVAS_PX` is ever changed from `1024`, `buildFullIconDoc`'s viewBox
would scale to the new size but `FLAT_BACKGROUND_RECT`'s hardcoded `width="1024"
height="1024"` would not, producing a background rect that either doesn't cover the
full canvas or overflows it.

**Fix:**
```ts
const BACKGROUND_RECT = `<rect width="${CANVAS_PX}" height="${CANVAS_PX}" rx="230" fill="${ICON_BACKGROUND_HEX}"/>`;
const FLAT_BACKGROUND_RECT = `<rect width="${CANVAS_PX}" height="${CANVAS_PX}" fill="${ICON_BACKGROUND_HEX}"/>`;
```

### WR-02: `extractMarkOnly`'s "well-formed SVG" guard can be bypassed when `<svg` is absent

**File:** `scripts/generate-brand-assets.ts:44-50`
**Issue:**
```ts
const rootTagEnd = svg.indexOf(">", svg.indexOf("<svg"));
const svgCloseIndex = svg.lastIndexOf("</svg>");
if (rootTagEnd === -1 || svgCloseIndex === -1) { throw ... }
```
`String.prototype.indexOf` clamps a negative `fromIndex` to `0`. If `svg.indexOf("<svg")`
returns `-1` (the `<svg` tag is missing entirely — e.g. a corrupted/truncated source
file, or someone accidentally points `SOURCE_SVG_PATH` at a non-SVG file that still
contains a stray `>` character), `svg.indexOf(">", -1)` becomes equivalent to
`svg.indexOf(">", 0)`, which will very likely find *some* `>` character elsewhere in
the file and return a non-`-1` value. The intended "no `<svg` tag found" failure
mode silently degrades into "found *a* `>` somewhere," so `rootTagEnd !== -1` and the
guard doesn't fire — `innerMarkup` is then sliced from a bogus offset, producing
mangled output instead of the intended descriptive "does not look like a well-formed
SVG document" error.

**Fix:**
```ts
const svgTagStart = svg.indexOf("<svg");
const rootTagEnd = svgTagStart === -1 ? -1 : svg.indexOf(">", svgTagStart);
const svgCloseIndex = svg.lastIndexOf("</svg>");
if (svgTagStart === -1 || rootTagEnd === -1 || svgCloseIndex === -1) {
  throw new Error(
    `${SOURCE_SVG_PATH} does not look like a well-formed SVG document — source may have changed shape`,
  );
}
```

## Info

### IN-01: `renderCenteredOnSafeZone`'s `scale`/`fitValue` computation is dead arithmetic that always resolves to `SAFE_ZONE_PX`

**File:** `scripts/generate-brand-assets.ts:95-98`
**Issue:**
```ts
const scale = SAFE_ZONE_PX / Math.max(bbox.width, bbox.height);
const fitMode: "width" | "height" = bbox.width >= bbox.height ? "width" : "height";
const fitValue =
  fitMode === "width" ? Math.round(bbox.width * scale) : Math.round(bbox.height * scale);
```
Algebraically, whichever branch of `fitValue` is taken always multiplies the
*dominant* dimension (`bbox.width` when `fitMode === "width"`, i.e. exactly when
`bbox.width === Math.max(bbox.width, bbox.height)`) by `SAFE_ZONE_PX / Math.max(bbox.width, bbox.height)`,
which cancels out to exactly `SAFE_ZONE_PX` every time (modulo the `Math.round` no-op
since `SAFE_ZONE_PX` is already an integer). This isn't a bug — output is correct —
but it's misleading: a future reader will reasonably assume `scale` is doing
meaningful aspect-ratio-dependent work, when the whole block is equivalent to
`const fitValue = SAFE_ZONE_PX;`. This kind of "looks load-bearing but isn't" code
is a common source of regressions when someone "fixes" a perceived issue in logic
that never actually varied.
**Fix:** Simplify to `const fitValue = SAFE_ZONE_PX;` and drop the unused `scale`
variable, or add a comment explaining that the multiplication is intentionally a
no-op identity to keep the "conceptual" scale-then-fit steps visible for future
maintainers.

### IN-02: `splash-icon.png` has no output-dimension assertion, unlike `icon.png`

**File:** `scripts/generate-brand-assets.ts:169-173`
**Issue:** `icon.png`'s render is explicitly checked (`iconRender.width !== CANVAS_PX
|| iconRender.height !== CANVAS_PX`, lines 146-150) before being written, matching
this codebase's established "throw on shape mismatch rather than silently ship a
wrong asset" convention (confirmed in `25-RESEARCH.md`'s "Pattern 1" and this
project's `CLAUDE.md`/`CONVENTIONS.md` general defensive-error-handling style).
`splashRender` (lines 169-173) is written directly via `writeFileSync(SPLASH_OUTPUT_PATH,
splashRender.asPng())` with no equivalent dimension check, so a future change to
`SPLASH_WIDTH_PX`, the source SVG's aspect ratio, or `fitTo` configuration that
silently produces a non-square or wrong-sized splash asset would ship without any
build-time signal — same class of failure the icon check exists to catch.
**Fix:**
```ts
if (splashRender.width !== SPLASH_WIDTH_PX || splashRender.height !== SPLASH_WIDTH_PX) {
  throw new Error(
    `rendered splash icon is ${splashRender.width}x${splashRender.height}, expected ${SPLASH_WIDTH_PX}x${SPLASH_WIDTH_PX} — check fitTo/viewBox config`,
  );
}
```

---

_Reviewed: 2026-08-13_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
