# Phase 25: Brand Asset Pipeline - Pattern Map

**Mapped:** 2026-08-13
**Files analyzed:** 3 (1 rewritten script, 1 renamed source SVG, 4 deleted assets)
**Analogs found:** 1 / 1 (self-analog — the file being rewritten is its own best pattern source)

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `scripts/generate-brand-assets.ts` (full rewrite) | utility (build-time CLI script) | file-I/O (SVG read → transform → PNG write) | `scripts/generate-brand-assets.ts` (current version, pre-rewrite) | exact (self — same file, same role/data-flow, structurally superseded per D-02) |
| `assets/brand/lafa-icon.svg` (renamed from `Lafa_final_logo.svg`) | config/data (static source asset) | file-I/O | `assets/brand/lafa-logo-v2.svg` (previous source, now deleted) | exact role-match, but git mv not code — no pattern extraction needed |
| `assets/brand/lafa-logo.svg`, `lafa-logo-v2.svg`, `lafa-logo-concept.png`, `lafa-logo-v2-concept.png` (deletions) | config/data | file-I/O | n/a (deletion only) | n/a |

This phase has no controller/component/service/model files — it is entirely one build-time Node script plus asset file moves. `scripts/preflight.ts` was checked as a secondary analog for general "scripts/ conventions" (invocation via `node scripts/x.ts`, no ts-node) but the primary/only structural analog is the script's own current version, since the task is a full rewrite of the same file, not a new file in an unfamiliar role.

## Pattern Assignments

### `scripts/generate-brand-assets.ts` (utility, file-I/O)

**Analog:** `scripts/generate-brand-assets.ts` (current, pre-rewrite version — full file read above)

**Imports pattern** (current lines 1-4, carries forward unchanged):
```typescript
import { readFileSync, writeFileSync } from "node:fs";

import { Resvg } from "@resvg/resvg-js";
import sharp from "sharp";
```
No new imports needed — RESEARCH.md confirms both `@resvg/resvg-js` and `sharp` are already sufficient for all 5 outputs (no new dependency). `rmSync` from `node:fs` may be added only if the rewrite also handles old-file deletion in-script (RESEARCH's pipeline skeleton imports it), though D-04's removal is more naturally a one-time `git rm`/`git mv` shell step (see RESEARCH.md "Removing old assets" snippet) rather than logic baked into the regenerable script — planner's call.

**Named px-constant pattern** (current lines 6-17):
```typescript
const SOURCE_SVG_PATH = "assets/brand/lafa-logo-v2.svg";
const ICON_OUTPUT_PATH = "assets/images/icon.png";
const SPLASH_OUTPUT_PATH = "assets/images/splash-icon.png";
const ICON_BACKGROUND = "#FCE4DA";
const SPLASH_BACKGROUND = "rgba(0,0,0,0)";
const ICON_SIZE_PX = 1024;
const SPLASH_WIDTH_PX = 228;
```
Carry this convention forward verbatim for the rewrite: one named constant per output path, per pixel dimension, per color — update `SOURCE_SVG_PATH` to `assets/brand/lafa-icon.svg` (D-01), add new constants for `FAVICON_PX`, `SAFE_ZONE_PX`, `ICON_BACKGROUND_HEX = "#FFF9F6"`, `MARK_FILL = 'fill="#F2643E"'`, plus new output paths for `android-icon-foreground.png`/`android-icon-monochrome.png`/`favicon.png`. RESEARCH.md's "Full pipeline skeleton" code example already follows this exact constant-naming convention — use it directly.

**Defensive string-extraction + throw-on-shape-mismatch pattern** (current lines 25-51, 62-71 — this is the core pattern to preserve):
```typescript
function extractIconGroup(svg: string): string {
  const groupStart = svg.indexOf(ICON_GROUP_OPEN_TAG);
  if (groupStart === -1) {
    throw new Error(
      `${SOURCE_SVG_PATH} has no ${ICON_GROUP_OPEN_TAG} — source may have changed shape`,
    );
  }
  const groupEnd = svg.indexOf(ICON_GROUP_CLOSE_TAG, groupStart);
  if (groupEnd === -1) {
    throw new Error(
      `${SOURCE_SVG_PATH} has an unterminated ${ICON_GROUP_OPEN_TAG} group — source may have changed shape`,
    );
  }
  return svg.slice(groupStart, groupEnd + ICON_GROUP_CLOSE_TAG.length);
}
```
and:
```typescript
if (!iconGroup.includes(BACKGROUND_RECT)) {
  throw new Error(
    `${SOURCE_SVG_PATH} icon group is missing the expected background rect — source may have changed shape`,
  );
}
```
**Apply this exact idiom** to the rewrite's `extractMarkOnly()` — match substrings (`BACKGROUND_RECT`, `MARK_FILL` count) and throw a descriptive `"...source may have changed shape"` error rather than silently mis-rendering. RESEARCH.md's `extractMarkOnly()` (Code Examples, "Full pipeline skeleton") is the concrete replacement implementation and already follows this idiom — use verbatim:
```typescript
function extractMarkOnly(svg: string): string {
  if (!svg.includes(BACKGROUND_RECT)) {
    throw new Error(`${SOURCE_SVG_PATH} background rect not found — source may have changed shape`);
  }
  if ((svg.match(new RegExp(MARK_FILL, "g")) ?? []).length !== 2) {
    throw new Error(`${SOURCE_SVG_PATH} does not have exactly 2 mark paths — source may have changed shape`);
  }
  return svg.replace(BACKGROUND_RECT, "");
}
```

**Recolor-before-rasterize pattern** (current lines 74-77 — reuse for D-06 monochrome):
```typescript
const monochrome = withoutGreenDot
  .replaceAll('fill="#E8663D"', 'fill="#FFFFFF"')
  .replaceAll('stroke="#E8663D"', 'stroke="#FFFFFF"');
```
The rewrite's `toMonochromeSilhouette()` follows the identical technique, just against the new `MARK_FILL` constant (`'fill="#F2643E"'` → `'fill="#FFFFFF"'`), and with no `stroke` variant needed since D-02 confirms the new SVG has no stroke-based paths:
```typescript
function toMonochromeSilhouette(markOnlySvg: string): string {
  return markOnlySvg.replaceAll(MARK_FILL, 'fill="#FFFFFF"');
}
```

**Alpha-stripping pattern** (current lines 89-101 — reuse unchanged for `icon.png`, extend to `favicon.png`):
```typescript
const render = new Resvg(iconDoc, {
  fitTo: { mode: "width", value: ICON_SIZE_PX },
  background: ICON_BACKGROUND,
}).render();

if (render.width !== ICON_SIZE_PX || render.height !== ICON_SIZE_PX) {
  throw new Error(
    `rendered icon is ${render.width}x${render.height}, expected ${ICON_SIZE_PX}x${ICON_SIZE_PX} — check fitTo/viewBox config`,
  );
}

// resvg's `background` option flattens the pixel data to opaque, but @resvg/resvg-js
// always encodes PNGs with an RGBA color type — sips still reports hasAlpha: yes even
// though every pixel is fully opaque. Route through sharp's removeAlpha() to re-encode
// as a true alpha-free (RGB) PNG, matching ICON-01's "no alpha channel" requirement.
const alphaFreePng = await sharp(render.asPng()).removeAlpha().png().toBuffer();
```
Keep both the dimension-assertion throw and the explanatory alpha-channel comment verbatim in the rewrite — this is Pitfall 1 in RESEARCH.md, and the comment is exactly the kind of defensive documentation this codebase already uses. Apply `.removeAlpha()` identically for `favicon.png` (per Assumption A3 in RESEARCH.md, for consistency even though not explicitly required).

**Transparent-background render pattern** (current lines 104-112 — reuse for `splash-icon.png`, mark-only render):
```typescript
function generateSplash(iconGroup: string): void {
  const splashDoc = buildSplashDoc(iconGroup);
  const render = new Resvg(splashDoc, {
    fitTo: { mode: "width", value: SPLASH_WIDTH_PX },
    background: SPLASH_BACKGROUND, // transparent
  }).render();
  writeFileSync(SPLASH_OUTPUT_PATH, render.asPng());
}
```
Same shape for the rewrite's splash generation — mark-only doc, transparent background, direct `writeFileSync` with no alpha-stripping (splash intentionally keeps its alpha channel, unlike `icon.png`/`favicon.png`).

**Top-level orchestration pattern** (current lines 114-122 — reuse structure, extend to 5 outputs):
```typescript
async function main(): Promise<void> {
  const sourceSvg = readFileSync(SOURCE_SVG_PATH, "utf-8");
  const iconGroup = normalizeSwoopFill(extractIconGroup(sourceSvg));

  await generateIcon(iconGroup);
  generateSplash(iconGroup);
}

main();
```
Keep this single unconditional `main()` shape (RESEARCH.md Open Question 2 recommends this — no CLI flags, matches current behavior and BRAND-03 framing), extended to write all 5 outputs. RESEARCH.md's "Full pipeline skeleton" `main()` (Code Examples section) is the concrete full replacement — use it as the structural template, keeping this file's naming/comment conventions.

**New mechanics (no existing analog in this file — RESEARCH.md is authoritative for these)**
- Safe-zone bbox centering (`getMarkBBox` + `renderCenteredOnSafeZone`, RESEARCH.md Pattern 3) — genuinely new to this script; no analog exists anywhere else in the codebase (confirmed no other `scripts/*.ts` file does image compositing). Implement exactly as specified in RESEARCH.md, including the `sharp.composite([{ input, gravity: "center" }])` call and the bbox-empty throw guard.
- Full-bleed square background flattening without `rx` (RESEARCH.md Pattern 2, `buildFullIconDoc`) — new technique since D-03 explicitly forbids reusing the old `CROP_VIEWBOX`/baked-rounding approach the current script used implicitly.

---

## Shared Patterns

### Defensive shape-mismatch guards
**Source:** `scripts/generate-brand-assets.ts` (current, all `extractIconGroup`/`buildSplashDoc` error throws)
**Apply to:** Every extraction/transform function in the rewritten script — `extractMarkOnly`, `getMarkBBox` (bbox-empty check), any future substring match. Always throw a descriptive `Error` with the exact pattern `` `${SOURCE_SVG_PATH} ... — source may have changed shape` `` rather than proceeding with a wrong/empty render.

### Named px/color/path constants at module top
**Source:** `scripts/generate-brand-assets.ts` (current, lines 6-23)
**Apply to:** All new output paths, dimensions, and color literals in the rewrite — no inline magic numbers/strings inside functions.

### `node scripts/*.ts` direct invocation, no transpile step
**Source:** `package.json` `"generate-assets": "node scripts/generate-brand-assets.ts"`, confirmed also for `"preflight": "node scripts/preflight.ts"` (`scripts/preflight.ts`)
**Apply to:** The rewritten script's invocation — do not add `ts-node`/`tsx`/build step; Node's native TS type-stripping (v25.0.0) already runs both scripts this way today. Keep the same `npm run generate-assets` script name and entry point path unchanged.

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| Android safe-zone centering logic (`getMarkBBox`/`renderCenteredOnSafeZone`) | utility (function within the script) | transform | No prior compositing/bbox logic exists anywhere in the codebase; RESEARCH.md Pattern 3 is the sole source, verified live against the real SVG in the research session — treat it as authoritative, not the codebase itself |

## Metadata

**Analog search scope:** `scripts/` (2 files: `generate-brand-assets.ts`, `preflight.ts`), `app.json` (consumption points, not modified this phase), `assets/brand/`, `assets/images/`
**Files scanned:** 4 (both scripts read in full, `app.json` grepped for asset paths, source SVG structure confirmed via CONTEXT.md/RESEARCH.md prior reads)
**Pattern extraction date:** 2026-08-13
