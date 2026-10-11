# Phase 31: Brand Asset Source & Generator - Pattern Map

**Mapped:** 2026-08-16
**Files analyzed:** 3 (2 modified, 1 new-derived; `validate-brand.ts` referenced read-only, not modified)
**Analogs found:** 3 / 3 (all are self-analogs — this phase modifies the closest-possible pattern source in place; no external role-match search needed)

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|--------------------|------|-----------|-----------------|---------------|
| `assets/brand/lafa-icon.svg` (rewritten in place) | config/asset (SVG source-of-truth) | transform (source promotion) | `assets/brand/candidates/lafa-icon-warm-bold.svg` (promotion source) + current `assets/brand/lafa-icon.svg` (id-naming target) | exact (this IS the promotion — candidate becomes canonical, with ids added) |
| `scripts/generate-brand-assets.ts` (modified in place) | utility / build script (batch SVG→PNG transform) | file-I/O, batch | itself (current version) — no second batch-transform script exists in the repo | exact (self-analog; only `extractMarkOnly()`, `getMarkBBox()`, `toMonochromeSilhouette()`, `main()` internals change) |
| `scripts/validate-brand.ts` (read-only reference, NOT modified this phase) | utility / test-like validator (batch assertion) | file-I/O, batch | n/a — this file itself is the analog for "independent regression-gate script" conventions the planner should NOT violate by coupling it to the generator | exact (reference only) |

**Note on scope:** Phase 31 has no genuinely *new* file with an unrelated role — it is a targeted rewrite of one existing script plus promotion of one existing asset file. There is no `src/`, `app/`, or React code touched. Pattern mapping below is therefore "before vs. after" excerpts from the same files, not cross-file analog borrowing.

## Pattern Assignments

### `scripts/generate-brand-assets.ts` (utility, file-I/O/batch) — self-analog

**Analog:** itself, `scripts/generate-brand-assets.ts` (current, pre-rewrite version, full file read — 189 lines)

**Imports pattern** (lines 1-4):
```typescript
import { readFileSync, writeFileSync } from "node:fs";

import { Resvg } from "@resvg/resvg-js";
import sharp from "sharp";
```
D-01 requires adding `linkedom` here as a new devDependency import, e.g. `import { parseHTML } from "linkedom";` (or whichever export `Claude's Discretion` selects — `getElementById` vs. `querySelector` both work off the same parsed document). Follow the existing two-block convention: external packages, blank line, then no relative imports needed (this file has none today).

**Module-level constants pattern** (lines 6-28):
```typescript
const SOURCE_SVG_PATH = "assets/brand/lafa-icon.svg";
const ICON_OUTPUT_PATH = "assets/images/icon.png";
...
const CANVAS_PX = 1024;
...
const MARK_FILL = 'fill="#F2643E"';
const MONOCHROME_FILL = 'fill="#FFFFFF"';
const EXPECTED_MARK_PATH_COUNT = 2;

const BACKGROUND_RECT = `<rect width="${CANVAS_PX}" height="${CANVAS_PX}" rx="230" fill="${ICON_BACKGROUND_HEX}"/>`;
const FLAT_BACKGROUND_RECT = `<rect width="${CANVAS_PX}" height="${CANVAS_PX}" fill="${ICON_BACKGROUND_HEX}"/>`;
```
This is the pattern to extend, not replace wholesale: keep all path/dimension constants (`CANVAS_PX`, `SAFE_ZONE_RATIO`, `ICON_BACKGROUND_HEX`, output paths) exactly as-is. Per CONTEXT.md D-05/code_context, add a new constants block mapping the three expected ids to roles, e.g.:
```typescript
const MARK_DEPTH_ID = "mark-depth";
const MARK_FILL_ID = "mark-fill";
const MARK_HIGHLIGHT_ID = "mark-highlight";
const EXPECTED_MARK_IDS = [MARK_DEPTH_ID, MARK_FILL_ID, MARK_HIGHLIGHT_ID] as const;
```
`MARK_FILL` (the `fill="#F2643E"` string constant) and `EXPECTED_MARK_PATH_COUNT` are retired entirely per D-02 (no dual-check). `MONOCHROME_FILL` (`'fill="#FFFFFF"'`) stays — it's still needed for the recolor step in `toMonochromeSilhouette()`, just applied per-id-selected-element instead of via `.replaceAll()` on a whole-markup string. `BACKGROUND_RECT` (the rounded-rect variant, `rx="230"`) is retired since the new source has no `clip-path`/`<defs>` wrapper to strip against it — confirm against the promoted SVG's actual `<rect>` markup once ids are added; `FLAT_BACKGROUND_RECT` is unaffected (already used only for `buildFullIconDoc()`, unrelated to mark extraction).

**Core "fail-loud extraction" pattern to replace** (lines 30-62, `extractMarkOnly`):
```typescript
function extractMarkOnly(svg: string): string {
  if (!svg.includes(BACKGROUND_RECT)) {
    throw new Error(
      `${SOURCE_SVG_PATH} is missing the expected background rect — source may have changed shape`,
    );
  }

  const markFillCount = svg.split(MARK_FILL).length - 1;
  if (markFillCount !== EXPECTED_MARK_PATH_COUNT) {
    throw new Error(
      `${SOURCE_SVG_PATH} has ${markFillCount} mark paths, expected ${EXPECTED_MARK_PATH_COUNT} — source may have changed shape`,
    );
  }
  ...
  const innerMarkup = svg.slice(rootTagEnd + 1, svgCloseIndex).replace(BACKGROUND_RECT, "");

  if (innerMarkup.trim().length === 0 || !innerMarkup.includes('clip-path="url(')) {
    throw new Error(
      `${SOURCE_SVG_PATH} mark markup is missing the expected clip-path reference (or <defs> was lost) — source may have changed shape`,
    );
  }

  return innerMarkup;
}
```
**Error-message style to preserve verbatim** (D-05): every failure throws `` `${SOURCE_SVG_PATH} <what's wrong> — source may have changed shape` ``. The id-based rewrite must keep this exact suffix phrase and name the specific missing id, e.g.:
```typescript
throw new Error(
  `${SOURCE_SVG_PATH} is missing <g id="${id}"> — source may have changed shape`,
);
```
Per the code_context integration note, `extractMarkOnly()`'s return shape likely needs to change from one `innerMarkup` string to a structured per-layer object (e.g. `{ depth: string; fill: string; highlight: string }`) since D-06/D-07/D-08 require different layer subsets per output. `main()`, `getMarkBBox()`, and `toMonochromeSilhouette()` all consume whatever this function returns, so the return-shape decision cascades — plan the new interface first, then adjust `wrapMarkDoc`/`buildFullIconDoc`/`main()` call sites to match.

**`getMarkBBox` pattern to adapt (bbox source varies per output, D-08)** (lines 72-90):
```typescript
function getMarkBBox(markOnlyDoc: string): { x: number; y: number; width: number; height: number } {
  const bbox = new Resvg(markOnlyDoc, {
    fitTo: { mode: "width", value: CANVAS_PX },
  }).getBBox();

  if (!bbox || bbox.width === 0 || bbox.height === 0) {
    throw new Error(`${SOURCE_SVG_PATH} mark bbox came back empty — source may have changed shape`);
  }
  if (bbox.width >= CANVAS_PX) {
    throw new Error(
      `${SOURCE_SVG_PATH} mark bbox spans the full canvas (${bbox.width}px) — the background rect was likely not stripped, source may have changed shape`,
    );
  }
  return bbox;
}
```
Keep this function's signature/error-checks as-is (it operates on a rendered SVG doc string, agnostic to how that doc was assembled) — just call it twice with two different assembled docs: once with the full mark (`mark-depth` + `mark-fill` + `mark-highlight`, for color outputs) and once with only `mark-fill` + `mark-highlight` (for the monochrome output), per D-08.

**`toMonochromeSilhouette` pattern to replace** (lines 121-131):
```typescript
function toMonochromeSilhouette(markDoc: string): string {
  const recolored = markDoc.replaceAll(MARK_FILL, MONOCHROME_FILL);

  if (recolored.includes(MARK_FILL) || recolored.includes("#F2643E")) {
    throw new Error(
      `${SOURCE_SVG_PATH} monochrome recolor left an orange fill behind — partial recolour must never ship as a themed icon`,
    );
  }
  return recolored;
}
```
Preserve the "recolor then verify no orange fill survived" fail-loud pattern verbatim — this is exactly the kind of invariant check the phase's D-07 depends on (depth layer must be absent, fill/highlight must be fully white). Since the new extraction returns per-layer markup, this function should recolor only the `fill`+`highlight` layers passed to it (never receive `depth` at all per D-07, rather than receiving it and filtering it out) and keep the same `includes("#F2643E")` residual-orange guard.

**`main()` orchestration pattern to extend, not restructure** (lines 133-186):
```typescript
async function main(): Promise<void> {
  const sourceSvg = readFileSync(SOURCE_SVG_PATH, "utf-8");
  const mark = extractMarkOnly(sourceSvg);

  const fullCanvasMarkDoc = wrapMarkDoc(mark, `0 0 ${CANVAS_PX} ${CANVAS_PX}`);
  const bbox = getMarkBBox(fullCanvasMarkDoc);
  const croppedMarkDoc = wrapMarkDoc(mark, `${bbox.x} ${bbox.y} ${bbox.width} ${bbox.height}`);

  // icon.png — full-bleed flat #FFF9F6 background, no baked-in rounding (D-03).
  const iconRender = new Resvg(buildFullIconDoc(mark), {
    fitTo: { mode: "width", value: CANVAS_PX },
    background: ICON_BACKGROUND_HEX,
  }).render();

  if (iconRender.width !== CANVAS_PX || iconRender.height !== CANVAS_PX) {
    throw new Error(
      `rendered icon is ${iconRender.width}x${iconRender.height}, expected ${CANVAS_PX}x${CANVAS_PX} — check fitTo/viewBox config`,
    );
  }

  // resvg's `background` option flattens pixel data to opaque, but @resvg/resvg-js
  // always encodes PNGs with an RGBA color type — sips still reports hasAlpha: yes even
  // though every pixel is fully opaque. Route through sharp's removeAlpha() to re-encode
  // as a true alpha-free (RGB) PNG.
  const iconPng = await sharp(iconRender.asPng()).removeAlpha().png().toBuffer();
  writeFileSync(ICON_OUTPUT_PATH, iconPng);
  ...
}
main();
```
Keep the exact `main()` shape: read source → extract mark → build docs → render each of the 5 outputs → write. The alpha-strip comment block (lines 153-156) is load-bearing documentation per PITFALLS.md pitfall 2 (alpha-channel regression risk specific to this refactor) — copy it verbatim, unmodified, since the underlying `resvg`/`sharp` behavior it explains is unchanged by the id-based rewrite. The two lines that need real logic changes are `const mark = extractMarkOnly(sourceSvg);` (now returns per-layer data, not one string) and the monochrome branch (`toMonochromeSilhouette(croppedMarkDoc)` → must build its input doc from only `mark-fill`+`mark-highlight` markup per D-07, and use the monochrome-specific bbox per D-08). Do not reorder or split `main()` into multiple exported functions — no other module imports from this script (confirmed: no `import.*generate-brand-assets` elsewhere in the repo), so it can stay a single top-to-bottom script entry point calling `main()` unconditionally at file end, matching `validate-brand.ts`'s identical `main(); ` pattern.

**Unchanged helpers (do not modify logic, may need signature tweaks for new markup shape):**
- `wrapMarkDoc(markMarkup, viewBox)` (lines 64-66) — generic doc-wrapper, stays as-is; callers now pass concatenated per-output layer markup instead of the old single `mark` string.
- `buildFullIconDoc(markMarkup)` (lines 68-70) — stays as-is structurally; same caveat.
- `renderCenteredOnSafeZone(croppedMarkDoc, bbox)` (lines 92-119) — stays fully unchanged; consumes whatever doc string it's given, agnostic to extraction method.

---

### `assets/brand/lafa-icon.svg` (asset, transform/promotion)

**Analog:** `assets/brand/candidates/lafa-icon-warm-bold.svg` (promotion source, full file read — 12 lines) vs. current `assets/brand/lafa-icon.svg` (12 lines, being replaced)

**Current shipped source structure** (`assets/brand/lafa-icon.svg`, lines 1-12) — being fully replaced:
```xml
<svg width="1024" height="1024" viewBox="0 0 1024 1024" fill="none" xmlns="http://www.w3.org/2000/svg">
<g clip-path="url(#clip0_2_4)">
<rect width="1024" height="1024" rx="230" fill="#FFF9F6"/>
<path fill-rule="evenodd" ... fill="#F2643E"/>   <!-- main outline, MARK_FILL #1 -->
<path d="M402.905 576.897..." fill="#F2643E"/>   <!-- small accent path, MARK_FILL #2 -->
</g>
<defs>
<clipPath id="clip0_2_4"><rect width="1024" height="1024" fill="white"/></clipPath>
</defs>
</svg>
```
2 paths, both `fill="#F2643E"`, wrapped in a `clip-path`/`<defs>` pair — this is exactly what `EXPECTED_MARK_PATH_COUNT = 2` and the `clip-path="url("` check in the old `extractMarkOnly()` were keyed to. Both go away with the promotion.

**Promotion source structure** (`assets/brand/candidates/lafa-icon-warm-bold.svg`, lines 1-12) — becomes the new `assets/brand/lafa-icon.svg` content, with ids added per D-03/D-04:
```xml
<svg width="1024" height="1024" viewBox="0 0 1024 1024" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="title desc">
  <title id="title">Lafa icon candidate B - warm bold mark</title>
  <desc id="desc">A warmer Lafa app icon with a larger saturated orange mark and subtle deep-orange depth.</desc>
  <rect width="1024" height="1024" rx="230" fill="#FFF9F6"/>
  <g transform="translate(512 512) scale(0.96) translate(-512 -512)">
    <g transform="translate(18 22)" opacity="0.18">
      <path fill-rule="evenodd" ... fill="#C94A2D"/>   <!-- ADD id="mark-depth" to this <g> -->
    </g>
    <path fill-rule="evenodd" ... fill="#F2643E"/>       <!-- ADD id="mark-fill" to this <path> -->
    <path d="M402.905 576.897..." fill="#F2643E"/>       <!-- ADD id="mark-highlight" to this <path> -->
  </g>
</svg>
```
Per D-04, add ids directly to the existing elements — minimal diff. Concretely (mapping decisions to exact edit points):
- Line 6 `<g transform="translate(18 22)" opacity="0.18">` → `<g id="mark-depth" transform="translate(18 22)" opacity="0.18">`
- Line 9 (the `#F2643E` evenodd path, main outline) → add `id="mark-fill"` attribute
- Line 10 (the `#F2643E` small accent path) → add `id="mark-highlight"` attribute

Per D-06/D-07, promotion should also decide whether to drop the `<title>`/`<desc>`/`role`/`aria-labelledby` candidate-review attributes (lines 1-3) when promoting to production — the old shipped source had none of these; the planner should verify whether `validate-brand.ts`'s `ALLOWED_SVG_SOURCE` check or the generator's parsing cares (it doesn't structurally — it's a path-string check — but keep the promoted file's structure clean/production-appropriate per team convention, likely drop or keep per Claude's Discretion, not locked by CONTEXT.md).

No `clip-path`/`<defs>` in the candidate — confirms D-01/D-02's framing that the id-based rewrite must not depend on that markup structurally disappearing being itself a signal (unlike the old `clip-path="url("` presence-check).

---

### `scripts/validate-brand.ts` (reference only — NOT modified this phase)

**Analog:** itself — read to confirm today's baseline constants the D-09 manual verification must match, and to confirm the "independent regression gate, no shared imports" convention the generator rewrite must not violate.

**Convention to preserve (do not import from this file in the generator, or vice versa)** (lines 1-27):
```typescript
import { existsSync, readFileSync } from "node:fs";
import sharp from "sharp";

const APP_JSON_PATH = "app.json";
const GENERATOR_PATH = "scripts/generate-brand-assets.ts";
...
const CANVAS_PX = 1024;
const FAVICON_PX = 48;
const ALLOWED_SVG_SOURCE = "assets/brand/lafa-icon.svg";
```
`validate-brand.ts` re-declares its own `CANVAS_PX`/`FAVICON_PX`/`ALLOWED_SVG_SOURCE` literals rather than importing them from `generate-brand-assets.ts` — this is a deliberate existing convention (independent-literal, no cross-script coupling) reaffirmed by RESEARCH.md's Architecture Approach ("`validate-brand.ts` stays intentionally independent... per an existing v0.6 convention"). The Phase 31 generator rewrite must not introduce an export/import edge between the two scripts even though both now care about the same `assets/brand/lafa-icon.svg` path and dimensions — `checkGeneratorSource()` (lines 166-176) already asserts the generator's source-file text contains `ALLOWED_SVG_SOURCE` via a plain string `.includes()` check on the generator's raw file text, which will continue to pass unmodified as long as `SOURCE_SVG_PATH = "assets/brand/lafa-icon.svg"` stays a literal in the rewritten generator.

**Baseline dimensions to manually verify against (D-09)** (lines 202-219, `main()`):
```typescript
await checkPngDimensions("icon.png dimensions", ICON_PATH, CANVAS_PX, CANVAS_PX),        // 1024x1024
await checkNoAlpha("icon.png no alpha", ICON_PATH),
await checkPngDimensions("favicon.png dimensions", FAVICON_PATH, FAVICON_PX, FAVICON_PX), // 48x48
await checkPngDimensions("splash-icon.png dimensions", SPLASH_PATH, CANVAS_PX, CANVAS_PX),
await checkPngDimensions("android-icon-foreground.png dimensions", ANDROID_FOREGROUND_PATH, CANVAS_PX, CANVAS_PX),
await checkPngDimensions("android-icon-monochrome.png dimensions", ANDROID_MONOCHROME_PATH, CANVAS_PX, CANVAS_PX),
```
Since this phase does not add automated assertions to the generator itself (D-09), running `npx tsx scripts/validate-brand.ts` (or however it's invoked) after regeneration is the fastest concrete way to confirm dimension-match and the alpha-free invariant without writing new phase-scoped test code — this file already asserts exactly the two things D-09/D-10 call out (dimensions, `hasAlpha === false` on `icon.png`). Treat it as a smoke-check the planner should call out as a manual verification step, not something to edit.

---

## Shared Patterns

### Fail-loud "source may have changed shape" error style
**Source:** `scripts/generate-brand-assets.ts` lines 31-34, 38-42, 48-51, 56-59, 78-81, 84-87, 125-128
**Apply to:** Every new/rewritten check inside `extractMarkOnly()`, `getMarkBBox()`, `toMonochromeSilhouette()`
```typescript
throw new Error(
  `${SOURCE_SVG_PATH} <specific condition that failed> — source may have changed shape`,
);
```
Every single validation branch in the current file uses this exact suffix. D-05 explicitly requires the id-based rewrite to match this style, just naming the missing id instead of a fill-count/rect-string mismatch.

### Injectable-nothing, direct-constant module design
**Source:** `scripts/generate-brand-assets.ts` lines 6-28 (all constants at module top, no config file/env var indirection); mirrored in `scripts/validate-brand.ts` lines 5-27
**Apply to:** Any new id/role constants added for this phase (`MARK_DEPTH_ID`, `MARK_FILL_ID`, `MARK_HIGHLIGHT_ID`, `EXPECTED_MARK_IDS`)
No config files, no CLI args — this script (and its sibling validator) hardcode every path/dimension/hex/expected-shape value as a top-of-file `const`. New id constants should follow the same flat, uppercase-snake-case pattern already used for `MARK_FILL`/`MONOCHROME_FILL`/`EXPECTED_MARK_PATH_COUNT`.

### `sharp`'s `.removeAlpha()` alpha-strip step, with explanatory comment
**Source:** `scripts/generate-brand-assets.ts` lines 153-158
**Apply to:** `icon.png` and `favicon.png` render steps in `main()` — must be preserved byte-for-byte, this logic is explicitly unaffected by the id-based rewrite (PITFALLS.md pitfall 2 flags this exact refactor as alpha-regression-risk, but the risk is in the *upstream* extraction step changing what markup gets rendered, not in this specific `removeAlpha()` call, which stays correct regardless of how the mark markup was extracted).
```typescript
// resvg's `background` option flattens pixel data to opaque, but @resvg/resvg-js
// always encodes PNGs with an RGBA color type — sips still reports hasAlpha: yes even
// though every pixel is fully opaque. Route through sharp's removeAlpha() to re-encode
// as a true alpha-free (RGB) PNG.
const iconPng = await sharp(iconRender.asPng()).removeAlpha().png().toBuffer();
```

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `linkedom`-based id lookup logic (new code inside `extractMarkOnly()`) | utility (parsing) | transform | No existing file in this repo uses any DOM/XML parsing library — every prior SVG handling was plain string search (`.includes`, `.split`, `.indexOf`, `.replaceAll`). RESEARCH.md's ARCHITECTURE.md Pattern 1 (regex depth-tracker, quoted above) is the closest available reference implementation shape if `linkedom`'s exact API needs a fallback mental model; otherwise this is genuinely new-to-repo code with no local precedent — follow `linkedom`'s own docs for `parseHTML`/`getElementById`/`querySelector`, and match the surrounding file's error-style/constant conventions rather than any existing repo pattern for the parsing mechanics themselves. |

## Metadata

**Analog search scope:** `scripts/`, `assets/brand/`, `assets/brand/candidates/` (only 3 relevant files exist in these directories; no broader `src/`/`app/` search was needed since this phase touches only build tooling and static SVG assets)
**Files scanned:** `scripts/generate-brand-assets.ts` (189 lines, full read), `scripts/validate-brand.ts` (246 lines, full read), `assets/brand/lafa-icon.svg` (12 lines, full read), `assets/brand/candidates/lafa-icon-warm-bold.svg` (12 lines, full read), `package.json` (devDependencies section), repo-wide grep for `linkedom` (zero hits — confirms genuinely new dependency)
**Pattern extraction date:** 2026-08-16
