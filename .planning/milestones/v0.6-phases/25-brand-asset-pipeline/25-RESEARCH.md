# Phase 25: Brand Asset Pipeline - Research

**Researched:** 2026-08-13
**Domain:** SVG-to-PNG asset generation pipeline (resvg-js + sharp), Android adaptive icon conventions
**Confidence:** HIGH

## Summary

This phase rewrites `scripts/generate-brand-assets.ts` to rasterize a single new
source SVG (`assets/brand/lafa-icon.svg`, currently at `Lafa_final_logo.svg`) into
five outputs instead of the current two. The new source SVG has a much simpler
structure than the old one (one background `rect` + two mark `path`s, both flat
fills, no strokes, no nested groups), so the rewrite is a full replacement of the
extraction/patching logic, not an incremental patch. The existing toolchain
(`@resvg/resvg-js` 2.6.2, `sharp` 0.35.3 — both already installed, confirmed via
`npm view` against `package.json`) is sufficient for every required output; no new
dependency is needed.

The two genuinely new pieces of mechanics are (1) flattening the SVG's own
rounded-rect background into a plain full-bleed square fill for `icon.png`, and
(2) centering the mark inside the Android adaptive-icon safe zone for
`android-icon-foreground.png`/`android-icon-monochrome.png`. Both are solvable with
resvg-js's `getBBox()` (confirmed available and accurate against the actual source
SVG in this session) plus `sharp.composite()` on a transparent canvas — no manual
SVG path-geometry math is required.

**Primary recommendation:** Build the new SVG documents as in-memory string
transforms of the source (same defensive pattern as today: string-match specific
substrings, throw a descriptive error if the source has "changed shape"), rasterize
each variant with `Resvg`, and use `sharp` only for (a) alpha stripping (`icon.png`,
`favicon.png`) and (b) centering a pre-scaled mark render onto a transparent 1024×1024
canvas (both Android outputs).

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| SVG string transforms (strip/recolor background & paths) | Build tooling (`scripts/`) | — | Pure Node script, no app runtime involvement |
| SVG→PNG rasterization | Build tooling (`scripts/`, via `@resvg/resvg-js`) | — | Vector rendering happens once at build time, not on-device |
| Alpha/compositing/resize | Build tooling (`scripts/`, via `sharp`) | — | Post-processing of rasterized PNG buffers, build-time only |
| Consuming generated PNGs | App config (`app.json`) | — | Out of scope for Phase 25 (Phase 27); this phase only writes to `assets/images/*` |

## User Constraints

<user_constraints>
### Locked Decisions (from CONTEXT.md)

- **D-01:** `assets/brand/Lafa_final_logo.svg` must be renamed to `assets/brand/lafa-icon.svg`; the script's `SOURCE_SVG_PATH` points at the new canonical name.
- **D-02:** Source SVG structure is one `<g clip-path>` containing one background `rect` (`rx="230"`, `fill="#FFF9F6"`, full 1024×1024) and two `path` mark elements (both `fill="#F2643E"`). No `<g id="icon">` wrapper, no accent dot, no stroke-based paths. The old extraction/patching logic (targeting `<g id="icon">`, `BACKGROUND_RECT`, `GREEN_ACCENT_DOT`, stroke-tail patching) does not apply and must be rewritten.
- **D-03:** `icon.png` must be a full-bleed square with the background **flattened** — do NOT preserve the SVG's baked-in `rx="230"` rounding. Fill a plain square canvas with `#FFF9F6`, render the mark on top, let iOS/Android apply their own OS-level mask.
- **Splash icon** (low-ambiguity, not separately re-discussed): `splash-icon.png` = mark paths only (both `#F2643E`), transparent background, background rect excluded.
- **D-04:** Delete outright (`git rm`, not just decouple): `assets/brand/lafa-logo.svg`, `assets/brand/lafa-logo-v2.svg`, `assets/brand/lafa-logo-concept.png`, `assets/brand/lafa-logo-v2-concept.png`.
- **D-05:** `android-icon-foreground.png` — mark centered, sized to stay within the ~66% safe-zone circle, standard convention, no custom sizing to match the iOS icon.
- **D-06:** `android-icon-monochrome.png` — solid white silhouette of the mark on transparent background (not `#F2643E`), per Android 13+ themed-icon convention (OS tints at display time; source must be a single flat color).
- **D-07:** No separate brand guide document needed — SVG colors already match the locked palette (confirmed by REQUIREMENTS.md THEME-01).

### Claude's Discretion (research must resolve these; see below)

1. Exact resvg-js/sharp approach for `favicon.png`, `android-icon-foreground.png`, `android-icon-monochrome.png` (none produced by the current script today).
2. Precise safe-zone pixel math for Android adaptive icon centering (~66% convention confirmed, exact calculation needed).
3. How to render a solid-white silhouette mask from the SVG with sharp/resvg.
4. How to flatten `icon.png`'s background to a plain square filled with `#FFF9F6` while excluding the SVG's own `rx="230"` rounding.
5. Confirm sharp can composite a resvg-rasterized transparent PNG onto a solid/transparent background, and resvg can rasterize a modified/stripped SVG string directly.

**All five discretion items are resolved below with verified, tested mechanics (see Code Examples).**

### Deferred Ideas (OUT OF SCOPE)

None — CONTEXT.md confirms discussion stayed within phase scope. Explicitly NOT this phase's job: `src/theme/tokens.ts` (Phase 26), `app.json` splash/adaptive-icon config changes (Phase 27), per-screen palette application (Phase 28). Do not touch `android-icon-background.png` — Phase 25's success criteria list only the five outputs (`icon.png`, `favicon.png`, `splash-icon.png`, `android-icon-foreground.png`, `android-icon-monochrome.png`); the leftover `android-icon-background.png` file and its `app.json` reference are Phase 27's concern.
</user_constraints>

## Phase Requirements

<phase_requirements>
| ID | Description | Research Support |
|----|-------------|------------------|
| BRAND-01 | `assets/brand/lafa-icon.svg` is the sole source the generator consumes | Confirmed: rename source file, update `SOURCE_SVG_PATH`; verified no other code path references the old filenames (grep confirms only `scripts/generate-brand-assets.ts` references `lafa-logo*` in actual code — all other hits are historical `.planning/` docs, out of scope for BRAND-02) |
| BRAND-02 | Old AI-generated assets removed/unreferenced | `git rm` the four files per D-04; confirmed via grep that no other source file (`app.json`, `src/`, `app/`, `__tests__/`) references them |
| BRAND-03 | Generator produces all 5 outputs with exact specs | Full mechanics for each output verified below (bbox math tested live against the actual source SVG in this session) |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@resvg/resvg-js` | 2.6.2 (installed, confirmed via `npm view @resvg/resvg-js version` against `package.json`'s `^2.6.2`) | SVG string → raster PNG buffer | Already the project's chosen rasterizer (Phase 22); native binding, fast, deterministic, no headless browser needed |
| `sharp` | 0.35.3 (installed, confirmed via `npm view sharp version` against `package.json`'s `^0.35.3`) | PNG post-processing: alpha removal, compositing, resizing | Already the project's chosen image library (Phase 22); handles alpha-channel and compositing operations resvg-js does not expose directly |

No new packages are needed for this phase — `[CITED: package.json]` both libraries are already dependencies and CONTEXT.md D (Claude's Discretion note) explicitly directs reuse over new libraries.

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| resvg-js `getBBox()` for safe-zone centering | Manually parsing SVG path `d` coordinates | Unnecessary — resvg-js already exposes an accurate bounding-box API (verified live, see Code Examples); hand-parsing path commands would be far more error-prone for curved paths |
| sharp `composite()` for centering | resvg-js `fitTo: { mode: "zoom" }` + manual `x`/`y` translate string injection | sharp's composite is simpler, already used in the current script, and works on rasterized buffers rather than requiring further SVG string surgery |

**Installation:** None required — both packages are already present in `package.json` dependencies.

## Package Legitimacy Audit

No new packages are installed by this phase. Both `@resvg/resvg-js` and `sharp` are
pre-existing dependencies used since Phase 22 (`22-icon-splash-asset-pipeline`); their
legitimacy was already established in that phase's research. This audit is not
applicable — no `Disposition` table needed.

## Architecture Patterns

### System Architecture Diagram

```
assets/brand/lafa-icon.svg (source, read once)
        │
        ▼
  parse & extract three variants (string transforms, in-memory only)
        │
        ├─► [full doc: bg #FFF9F6 flat square + mark]───► resvg render 1024px ──► sharp.removeAlpha() ──► assets/images/icon.png
        │                                                       │
        │                                                       └─► sharp.resize(48,48) ──► sharp.removeAlpha() ──► assets/images/favicon.png
        │
        ├─► [mark-only doc: transparent bg + mark]──────► resvg render (crop viewBox to bbox) ─┐
        │                                                                                        │
        │                                              ├─(A) render at full width, transparent bg ──► assets/images/splash-icon.png
        │                                              │
        │                                              ├─(B) render scaled to safe-zone px ──► sharp.composite(center, 1024×1024 transparent canvas) ──► assets/images/android-icon-foreground.png
        │                                              │
        └─► [mark-only doc, fill recolored to #FFFFFF]─┴─(C) render scaled to safe-zone px ──► sharp.composite(center, 1024×1024 transparent canvas) ──► assets/images/android-icon-monochrome.png
```

### Recommended Project Structure

No new files/folders — this is a single-file rewrite:
```
scripts/
└── generate-brand-assets.ts   # rewritten; same location, same npm script name
assets/
├── brand/
│   └── lafa-icon.svg          # renamed from Lafa_final_logo.svg (git mv)
└── images/
    ├── icon.png                # regenerated
    ├── favicon.png              # NEW output
    ├── splash-icon.png          # regenerated
    ├── android-icon-foreground.png   # NEW output
    ├── android-icon-monochrome.png   # NEW output
    └── android-icon-background.png   # untouched — out of scope (Phase 27)
```

### Pattern 1: Defensive string-based SVG extraction (carry forward from current script)

**What:** Instead of a full XML/SVG parser dependency, the current script locates
exact substrings (tag names, attribute strings) and throws a descriptive error if
they're missing — treating "shape changed" as a build-time failure, not a silent
wrong render.

**When to use:** Continue this pattern for the new SVG's simpler structure — it's a
much smaller, more brittle surface now (one `rect`, two `path`s) so the same
technique is even easier to keep correct.

**Verified against the actual current source SVG** (`assets/brand/Lafa_final_logo.svg`):
```
<rect width="1024" height="1024" rx="230" fill="#FFF9F6"/>
```
is the exact background rect string to match/strip. Both mark paths use
`fill="#F2643E"` (no other elements use that exact fill string in the file).

```typescript
// Source: scripts/generate-brand-assets.ts (existing pattern, current file read in this session)
const BACKGROUND_RECT = '<rect width="1024" height="1024" rx="230" fill="#FFF9F6"/>';
const MARK_FILL = 'fill="#F2643E"';

function stripBackground(svg: string): string {
  if (!svg.includes(BACKGROUND_RECT)) {
    throw new Error(
      `${SOURCE_SVG_PATH} is missing the expected background rect — source may have changed shape`,
    );
  }
  return svg.replace(BACKGROUND_RECT, "");
}
```

### Pattern 2: Flattening the background without the baked-in rounding (D-03)

**What:** Do not reuse the source SVG's own `rect rx="230"`. Instead, build a new
document with a plain, unrounded, full-bleed `rect` (no `rx` attribute) at the same
`#FFF9F6` fill, so `icon.png`'s corners are square pixels (no visible pre-baked
rounding for the OS mask to double up on).

```typescript
// Source: composed from confirmed SVG structure (this session)
function buildFullIconDoc(markOnly: string): string {
  const flatBackground = '<rect width="1024" height="1024" fill="#FFF9F6"/>'; // no rx
  return `<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">${flatBackground}${markOnly}</svg>`;
}
```
Then rasterize with `Resvg` at `fitTo: { mode: "width", value: 1024 }` and pipe
through `sharp().removeAlpha()` exactly as the current script does for
`icon.png` today (this part of the current script's technique carries forward
unchanged — see `scripts/generate-brand-assets.ts:95-101`).

### Pattern 3: Android safe-zone centering via `getBBox()` + `sharp.composite()`

**Verified live in this session** against the actual `Lafa_final_logo.svg`, using a
mark-only SVG string (background rect stripped):

```
mark bbox = { x: 156.57, y: 185.0, width: 693.43, height: 709.0 }
```

(`width` and `height` above are both ~66-69% of the 1024 canvas — close to, but
not already inside, the Android 66% safe zone, so explicit scaling is required, not
just re-centering.)

**Android safe-zone convention** (`[CITED: developer.android.com/develop/ui/compose/system/icon_design_adaptive]`,
confirmed by `[CITED: Google Design Medium article]`):
- Full adaptive-icon canvas: 108dp × 108dp (→ 1024×1024px at this project's export resolution)
- OS-visible/masked area: 72dp × 72dp (~66.7% of 108dp)
- A centered 66dp-diameter circle is the maximum guaranteed-unclipped safe zone across all launcher mask shapes

**Practical implementation** (standard approach used by icon-asset tooling): scale the
mark so its longest bounding-box dimension equals a target safe-zone pixel size, then
center it on a transparent 1024×1024 canvas.

```typescript
// Source: composed and bbox-verified live against assets/brand/Lafa_final_logo.svg (this session)
import { Resvg } from "@resvg/resvg-js";
import sharp from "sharp";

const CANVAS_PX = 1024;
const SAFE_ZONE_PX = Math.round(CANVAS_PX * 0.66); // 676 — matches the 66% Android safe-zone convention

function getMarkBBox(markOnlyFullCanvasSvg: string) {
  const r = new Resvg(markOnlyFullCanvasSvg, { fitTo: { mode: "width", value: CANVAS_PX } });
  const bbox = r.getBBox(); // { x, y, width, height } in the 1024-unit coordinate space
  if (!bbox || bbox.width === 0 || bbox.height === 0) {
    throw new Error("mark bbox came back empty — source may have changed shape");
  }
  return bbox;
}

async function renderCenteredOnSafeZone(
  markOnlySvg: string, // viewBox cropped to the bbox, e.g. `viewBox="${x} ${y} ${w} ${h}"`
  bbox: { width: number; height: number },
): Promise<Buffer> {
  const longestDim = Math.max(bbox.width, bbox.height);
  const scale = SAFE_ZONE_PX / longestDim;
  const targetW = Math.round(bbox.width * scale);
  const targetH = Math.round(bbox.height * scale);

  const fitMode = bbox.width >= bbox.height ? "width" : "height";
  const fitValue = fitMode === "width" ? targetW : targetH;

  const rendered = new Resvg(markOnlySvg, { fitTo: { mode: fitMode, value: fitValue } }).render().asPng();

  // composite centered on a transparent 1024x1024 canvas
  return sharp({
    create: { width: CANVAS_PX, height: CANVAS_PX, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite([{ input: rendered, gravity: "center" }])
    .png()
    .toBuffer();
}
```

`sharp`'s `gravity: "center"` composite option handles the centering math directly
(no manual `left`/`top` offset arithmetic needed) — `[CITED: sharp API docs, composite()]`.

### Pattern 4: Monochrome silhouette (D-06)

Recolor the mark-only SVG's fill before rasterizing — do not post-process the raster.
This is simpler and pixel-exact (no edge-alpha artifacts from thresholding a raster):

```typescript
// Source: same recolor-before-rasterize technique the OLD script already used
// (scripts/generate-brand-assets.ts:75-77, `.replaceAll('fill="#E8663D"', 'fill="#FFFFFF"')`)
// — confirmed as the established pattern in this codebase, just applied to the new fill value.
function toMonochromeSilhouette(markOnlySvg: string): string {
  return markOnlySvg.replaceAll(MARK_FILL, 'fill="#FFFFFF"');
}
```
Then feed the recolored string through the same `renderCenteredOnSafeZone` path as
the foreground image (Pattern 3) — same bbox, same scale, same centering, only the
fill color differs.

### Pattern 5: favicon.png (48×48)

Reuse the flattened full-icon SVG document (Pattern 2, background + mark, no
rounding), rasterize once at high resolution, then downscale with `sharp` for
better anti-aliasing quality than rasterizing natively at 48px:

```typescript
// Source: composed — standard "render high-res, downscale" technique, applying
// the same removeAlpha() pattern the current script already uses for icon.png
async function generateFavicon(iconPngBuffer: Buffer): Promise<Buffer> {
  return sharp(iconPngBuffer)
    .resize(48, 48, { kernel: sharp.kernel.lanczos3 })
    .removeAlpha()
    .png()
    .toBuffer();
}
```
Reusing the already-rendered 1024px `icon.png` buffer as the resize source (rather
than re-rasterizing from SVG at 48px) guarantees `favicon.png` is pixel-consistent
with `icon.png` — same background flattening, same lack of native rounding.

### Anti-Patterns to Avoid
- **Preserving the source SVG's `rx="230"` in `icon.png`:** Explicitly ruled out by D-03 — would double-round once the OS applies its own icon mask.
- **Post-processing a rasterized PNG to derive the monochrome silhouette (alpha-threshold + flood-fill white):** Unnecessary complexity and risk of soft/aliased edges — recoloring the SVG fill string before rasterizing is pixel-exact and trivial given the flat-fill, no-gradient source (Pattern 4).
- **Hand-computing safe-zone offsets from path `d` coordinates:** resvg-js's `getBBox()` already does this accurately (verified live, Pattern 3) — do not parse path commands manually.
- **Rendering `favicon.png` natively at 48px from SVG when a already-rendered 1024px buffer exists:** downscaling via `sharp` from the full-res render is simpler and guarantees visual parity with `icon.png` (Pattern 5).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Bounding-box calculation for arbitrary SVG path geometry | Custom path-command parser/bbox math | `Resvg.getBBox()` (verified working against the real source SVG this session) | Already accurate, already a dependency, handles bezier curves correctly which manual math would not |
| Compositing a smaller image centered on a larger canvas | Manual `left`/`top` pixel offset arithmetic | `sharp.composite([{ input, gravity: "center" }])` | Built-in, one line, avoids off-by-one/rounding bugs |
| PNG alpha-channel stripping | Manual pixel buffer manipulation | `sharp().removeAlpha()` | Already the established pattern in this exact script (current `generateIcon`) |

**Key insight:** Every piece of "new" mechanics this phase needs (bbox detection,
centering, alpha stripping, recoloring) is already covered by APIs the two existing
dependencies expose — nothing needs a third library or hand-rolled geometry code.

## Common Pitfalls

### Pitfall 1: resvg's `background` option doesn't produce a true alpha-free PNG
**What goes wrong:** Even when resvg-js's `background` render option flattens pixels
to fully opaque, the emitted PNG buffer is still RGBA-encoded — tools like macOS
`sips` (and Xcode/App Store icon validation) will report `hasAlpha: yes` even though
every pixel is opaque.
**Why it happens:** `@resvg/resvg-js`'s PNG encoder always writes an alpha channel;
"flattened" just means the alpha values are all 255, not that the channel is removed.
**How to avoid:** Always pipe the rendered PNG through `sharp().removeAlpha()` before
writing `icon.png` (and `favicon.png`, since it must also be opaque per BRAND-03's
"no alpha channel" wording carried over from `icon.png`'s spec, though BRAND-03 only
explicitly states this for `icon.png` — apply it to `favicon.png` too for consistency
since it shares the same flattened-background design).
**Warning signs:** `sips -g hasAlpha assets/images/icon.png` (or equivalent) reports
`yes` after generation — this was the exact bug the current script's comment
(`scripts/generate-brand-assets.ts:95-98`) already documents and fixes; do not
regress it in the rewrite.

### Pitfall 2: bbox computed against the wrong SVG document
**What goes wrong:** Calling `getBBox()` on the SVG that still includes the
full-canvas background `rect` returns the whole 1024×1024 canvas as the bounding box
(confirmed live in this session — before stripping the background, `getBBox()`
returned `{x: ~0, y: 0, width: 1024, height: 1024}`), which silently breaks the
safe-zone scaling math (scale factor becomes ~0.66 applied to the *whole canvas*,
not just the mark, producing a tiny mis-scaled mark).
**Why it happens:** The background rect is a large opaque shape and dominates the
bbox calculation.
**How to avoid:** Always call `getBBox()` on a mark-only SVG string (background rect
already stripped) — never on the full source document.
**Warning signs:** Computed bbox width/height ≈ 1024 (the full canvas), not ~690-710
(the actual mark's extent, confirmed by live testing this session).

### Pitfall 3: assuming Node needs `ts-node`/`tsx` to run this script
**What goes wrong:** Adding a `ts-node`/`tsx` dependency or wrapper that isn't needed.
**Why it happens:** `.ts` files aren't runnable by `node` in older Node versions.
**How to avoid:** This project's `package.json` script (`"generate-assets": "node
scripts/generate-brand-assets.ts"`) already runs directly via `node` with no
transpilation step — confirmed the installed Node version (v25.0.0) has native TypeScript
type-stripping support, and the current script already runs this way in production
today. Keep the invocation exactly as-is; do not introduce a build/transpile step.

### Pitfall 4: forgetting BRAND-02's grep-verifiable removal scope
**What goes wrong:** Leaving stray references to `lafa-logo.svg`/`lafa-logo-v2.svg`/
concept PNGs in *code* paths even after deleting the files, or conversely trying to
scrub every historical mention (including `.planning/` docs, which are historical
records, not live code).
**Why it happens:** A broad repo-wide grep for the old filenames returns many hits in
`.planning/` (ROADMAP.md, REQUIREMENTS.md, milestone archives, research docs from
Phase 22) that are legitimate historical records, not live references.
**How to avoid:** Confirmed via grep this session — the *only* live code reference to
the old filenames is `scripts/generate-brand-assets.ts:6`
(`SOURCE_SVG_PATH = "assets/brand/lafa-logo-v2.svg"`). BRAND-02's "no longer
referenced anywhere in the repo" should be scoped to code/config that executes or is
consumed by the app/build (`src/`, `app/`, `app.json`, `scripts/`, `__tests__/`), not
`.planning/` history. Verify with `grep -rln "lafa-logo" --include="*.ts" --include="*.tsx" --include="*.json"` excluding `.planning/` and `node_modules/`.

## Code Examples

### Full pipeline skeleton

```typescript
// Source: composed from verified patterns above, structured to mirror this
// codebase's existing script style (named px constants, defensive string matching,
// throw-on-shape-mismatch)
import { readFileSync, writeFileSync, rmSync } from "node:fs";
import { Resvg } from "@resvg/resvg-js";
import sharp from "sharp";

const SOURCE_SVG_PATH = "assets/brand/lafa-icon.svg";
const CANVAS_PX = 1024;
const FAVICON_PX = 48;
const SAFE_ZONE_PX = Math.round(CANVAS_PX * 0.66); // 676
const ICON_BACKGROUND_HEX = "#FFF9F6";
const MARK_FILL = 'fill="#F2643E"';
const BACKGROUND_RECT = `<rect width="${CANVAS_PX}" height="${CANVAS_PX}" rx="230" fill="${ICON_BACKGROUND_HEX}"/>`;

function extractMarkOnly(svg: string): string {
  if (!svg.includes(BACKGROUND_RECT)) {
    throw new Error(`${SOURCE_SVG_PATH} background rect not found — source may have changed shape`);
  }
  if ((svg.match(new RegExp(MARK_FILL, "g")) ?? []).length !== 2) {
    throw new Error(`${SOURCE_SVG_PATH} does not have exactly 2 mark paths — source may have changed shape`);
  }
  return svg.replace(BACKGROUND_RECT, "");
}

// ... buildFullIconDoc / getMarkBBox / renderCenteredOnSafeZone / toMonochromeSilhouette
// as defined in Patterns 2-4 above ...

async function main(): Promise<void> {
  const sourceSvg = readFileSync(SOURCE_SVG_PATH, "utf-8");
  const markOnlySvg = extractMarkOnly(sourceSvg);
  const bbox = getMarkBBox(markOnlySvg);
  const croppedMarkSvg = `<svg viewBox="${bbox.x} ${bbox.y} ${bbox.width} ${bbox.height}" xmlns="http://www.w3.org/2000/svg">${markOnlySvg}</svg>`;

  // icon.png + favicon.png
  const fullIconDoc = buildFullIconDoc(markOnlySvg);
  const iconPng = await sharp(new Resvg(fullIconDoc, { fitTo: { mode: "width", value: CANVAS_PX } }).render().asPng())
    .removeAlpha().png().toBuffer();
  writeFileSync("assets/images/icon.png", iconPng);
  const faviconPng = await sharp(iconPng).resize(FAVICON_PX, FAVICON_PX, { kernel: sharp.kernel.lanczos3 }).removeAlpha().png().toBuffer();
  writeFileSync("assets/images/favicon.png", faviconPng);

  // splash-icon.png (mark only, transparent, full aspect — see Open Questions for size)
  const splashDoc = `<svg viewBox="0 0 ${CANVAS_PX} ${CANVAS_PX}" xmlns="http://www.w3.org/2000/svg">${markOnlySvg}</svg>`;
  const splashPng = new Resvg(splashDoc, { fitTo: { mode: "width", value: CANVAS_PX }, background: "rgba(0,0,0,0)" }).render().asPng();
  writeFileSync("assets/images/splash-icon.png", splashPng);

  // android-icon-foreground.png
  const foregroundPng = await renderCenteredOnSafeZone(croppedMarkSvg, bbox);
  writeFileSync("assets/images/android-icon-foreground.png", foregroundPng);

  // android-icon-monochrome.png
  const monoMarkSvg = toMonochromeSilhouette(croppedMarkSvg);
  const monoPng = await renderCenteredOnSafeZone(monoMarkSvg, bbox);
  writeFileSync("assets/images/android-icon-monochrome.png", monoPng);
}

main();
```

### Removing old assets (BRAND-02, D-04)

```bash
# Source: git CLI, standard removal preserving history
git mv assets/brand/Lafa_final_logo.svg assets/brand/lafa-icon.svg
git rm assets/brand/lafa-logo.svg assets/brand/lafa-logo-v2.svg \
       assets/brand/lafa-logo-concept.png assets/brand/lafa-logo-v2-concept.png
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|---------------|--------|
| Extract `<g id="icon">` by tag search, patch a specific stroke-tail string, string-replace a hardcoded `BACKGROUND_RECT`/`GREEN_ACCENT_DOT` | Extract by matching a plain background `rect` + count exactly 2 mark `path`s with a known fill; no stroke patching needed (new SVG is fill-only) | This phase (source SVG replaced entirely) | Simpler, more robust extraction logic; less brittle string matching since there are fewer distinct elements to track |
| Icon background baked from SVG's own `rx` value implicitly (old source's icon crop used a `CROP_VIEWBOX`, not a flattening step) | Explicit flattening: build a new unrounded background rect at render time (D-03) | This phase | Prevents OS-mask-on-top-of-SVG-mask double rounding artifact |
| No Android adaptive-icon foreground/monochrome/favicon generation existed | All three generated from the same source via bbox-based safe-zone centering | This phase | Closes BRAND-03's full output list; previously these files existed in `assets/images/` but were never regenerated from source (stale, hand-placed or from an earlier unknown process) |

**Deprecated/outdated:** The old `CROP_VIEWBOX`/`ICON_GROUP_OPEN_TAG` extraction
approach is fully retired — it was built for a structurally different source SVG
(`lafa-logo-v2.svg`, with a `<g id="icon">` wrapper and stroke-based swoop path) that
no longer exists in the repo after D-04.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | 66% (676px of 1024) is an appropriate safe-zone target for `android-icon-foreground.png`/`android-icon-monochrome.png`, rather than the tighter 66dp-of-108dp "guaranteed circle" (~611px) | Pattern 3, Common Pitfall reasoning | If wrong, the mark could be clipped by some aggressive third-party launcher masks at the exact edge; low real-world risk since 66% is the widely-cited convention (`[CITED]` two independent sources), but the "66dp circle within 72dp visible" nuance means a stricter implementation exists. Low risk — mainstream Android icon generators commonly use ~66-70% and ship fine. |
| A2 | `splash-icon.png` should be rendered at a resolution higher than the current script's old `SPLASH_WIDTH_PX = 228` (no explicit BRAND-03 pixel size given) — recommend rendering at native 1024px width (full canvas) or at minimum 3× the Phase 27 `imageWidth: 160` (i.e. ≥480px) for retina display quality | Pattern in pipeline skeleton, Open Questions | If under-sized, the splash mark could look soft/blurry on high-density (3x) devices at runtime; this is a display-quality concern, not a functional BRAND-03 failure, and easy to adjust later since it's just a `fitTo` value |
| A3 | `favicon.png` should be opaque/no-alpha, matching `icon.png`'s treatment, even though BRAND-03's wording only explicitly requires "no alpha channel" for `icon.png` | Pitfall 1, Pattern 5 | Low risk — if wrong, an unnecessary `.removeAlpha()` call on a 48×48 web favicon has no visible downside (favicon is opaque-background design anyway per D-03's flattened square) |

## Open Questions (RESOLVED)

1. **Exact target pixel width for `splash-icon.png`**
   - What we know: BRAND-03 only specifies "transparent, mark only, no background rectangle" — no explicit pixel dimension. The old script used `SPLASH_WIDTH_PX = 228`. Phase 27 (out of scope here) will set `app.json`'s `expo-splash-screen` plugin `imageWidth` to `160` (a *display* point size, not the source PNG's native resolution).
   - What's unclear: Whether the planner should pick a specific native resolution now (this phase) or treat it as a follow-up tuning knob after Phase 27 sets `imageWidth`.
   - **RESOLVED:** Plan 25-01 sets `SPLASH_WIDTH_PX = 1024` (full canvas, natural 1024×1024-relative proportions) — comfortably covers 3× `160pt`, matches `icon.png`'s resolution, avoids under-provisioning for retina.

2. **Should the rewritten script keep a single `main()` that regenerates all 5 outputs unconditionally, or should it accept CLI flags for partial regeneration?**
   - What we know: The current script (and `npm run generate-assets`) always regenerates everything with no flags; `scripts/preflight.ts` (referenced in CONTEXT.md as a sibling script) was not read in this research pass but CONTEXT.md notes it as a convention reference only for invocation style, not flags.
   - What's unclear: Whether the planner wants incremental/partial regeneration support.
   - **RESOLVED:** Plan 25-01 keeps a single unconditional `main()` that regenerates all 5 outputs on every run, matching the current script's behavior and BRAND-03's framing ("running `npm run generate-assets` produces" all five).

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js (native TS execution) | Running `scripts/generate-brand-assets.ts` via `node` directly | ✓ | v25.0.0 | — |
| `@resvg/resvg-js` | SVG rasterization | ✓ (installed) | 2.6.2 | — |
| `sharp` | PNG post-processing | ✓ (installed) | 0.35.3 | — |
| `npm run generate-assets` script | Invocation entry point | ✓ (already defined in `package.json`) | — | — |

**Missing dependencies with no fallback:** None.
**Missing dependencies with fallback:** None — all required tooling is already present and verified working in this session (bbox extraction tested live against the real source file).

## Validation Architecture

No `pytest`/`jest.config`/test-runner changes are implied by this phase — the
generator script is a build-time tool, not app runtime code, and the repo's existing
Jest setup (`jest-expo` preset) has never had a test file for
`scripts/generate-brand-assets.ts` (confirmed via `grep -rln "generate-brand-assets"
__tests__/` returning no results).

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest (`jest-expo` preset) — but not applicable to this script historically |
| Config file | `package.json` `"jest": { "preset": "jest-expo" }` |
| Quick run command | N/A — no existing test file for this script |
| Full suite command | `npm test` (unaffected by this phase — no `src/`/`app/` runtime code changes) |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| BRAND-01 | Script reads only `lafa-icon.svg` | manual/visual (grep-verifiable) | `grep -n "SOURCE_SVG_PATH" scripts/generate-brand-assets.ts` | ✅ (script itself, no separate test) |
| BRAND-02 | Old assets deleted, unreferenced | manual/visual (grep-verifiable) | `git status` (deletion) + `grep -rln "lafa-logo" --include="*.ts" --include="*.json" . \| grep -v .planning \| grep -v node_modules` (expect empty) | ✅ — grep-based, no test file needed |
| BRAND-03 | All 5 outputs produced with correct specs | manual/visual (image inspection) | `npm run generate-assets && sips -g pixelWidth -g pixelHeight -g hasAlpha assets/images/icon.png assets/images/favicon.png assets/images/splash-icon.png assets/images/android-icon-foreground.png assets/images/android-icon-monochrome.png` | ✅ — `sips` (macOS built-in) verifies dimensions/alpha; no automated Jest assertion exists for binary PNG output |

### Sampling Rate
- **Per task commit:** Run `npm run generate-assets` and visually inspect + `sips`-check output dimensions/alpha
- **Per wave merge:** Re-run generator, diff `git status` for unexpected changes, confirm `npm run typecheck` and `npm run lint` still pass (script is plain TS, subject to the same typecheck/lint gates as the rest of the repo)
- **Phase gate:** All 5 PNGs regenerated with correct dimensions/alpha per BRAND-03's exact spec; old 4 files deleted; grep confirms zero live-code references to old filenames

### Wave 0 Gaps
None — this phase produces binary image outputs, not testable application logic; no
Jest test file gap exists to fill. If a future phase (29, Brand Validation) wants an
automated check, VALID-01 in REQUIREMENTS.md already covers PNG dimension/alpha
assertions as part of Phase 29's scope, not this phase's.

## Security Domain

Not applicable — this phase touches only local SVG/PNG asset generation via a
build-time Node script with no network calls, no user input, no auth, no external
data. No ASVS categories apply.

## Sources

### Primary (HIGH confidence)
- `scripts/generate-brand-assets.ts` (this repo, read directly) — existing rasterization/alpha-stripping pattern
- `assets/brand/Lafa_final_logo.svg` (this repo, read directly) — confirmed exact structure matches CONTEXT.md D-02
- Live `node` execution against installed `@resvg/resvg-js` 2.6.2 in this session — confirmed `getBBox()` API exists and returns accurate bounding boxes for both the full document and mark-only document
- `npm view @resvg/resvg-js version` / `npm view sharp version` — confirmed installed versions match `package.json` semver ranges

### Secondary (MEDIUM confidence)
- [Adaptive icons | Jetpack Compose | Android Developers](https://developer.android.com/develop/ui/compose/system/icon_design_adaptive) — 108dp canvas / 72dp visible / 66dp safe-zone circle convention
- [Designing Adaptive Icons — Google Design (Medium)](https://medium.com/google-design/designing-adaptive-icons-515af294c783) — original adaptive-icon design rationale, corroborates the 66% convention
- sharp API docs (`composite()`, `resize()`, `removeAlpha()`) — standard, stable API surface, well-established in this codebase already (Phase 22)

### Tertiary (LOW confidence)
- General web search results on Android icon-size guides (icon generator marketing sites) — used only to triangulate the 66% convention is a widely-repeated industry norm, not as a primary source for exact numbers

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — both libraries already installed and verified via `npm view`; no new dependency decisions needed
- Architecture: HIGH — bbox/centering mechanics tested live against the actual source SVG in this session, not just described from training knowledge
- Pitfalls: HIGH — Pitfall 1 (alpha channel) and Pitfall 2 (bbox-includes-background) are both directly observed/reproduced in this research session, not speculative

**Research date:** 2026-08-13
**Valid until:** 2026-09-12 (30 days — stable toolchain, no fast-moving dependencies; re-verify if `@resvg/resvg-js` or `sharp` majors bump before planning executes)
