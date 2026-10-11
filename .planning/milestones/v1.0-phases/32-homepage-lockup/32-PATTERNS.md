# Phase 32: Homepage Lockup - Pattern Map

**Mapped:** 2026-08-16
**Files analyzed:** 3 (1 new asset promotion, 1 modified generator script, 1 modified screen)
**Analogs found:** 3 / 3

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|-----------------|---------------|
| `assets/brand/lafa-homepage-lockup.svg` | config/asset (SVG source, promoted from candidate) | file-I/O (static source promotion, no code) | `assets/brand/lafa-icon.svg` (Phase 31 promoted canonical mark source) | role-match |
| `scripts/generate-brand-assets.ts` (extend `main()`) | utility (build-time asset generator script) | batch / file-I/O (read SVG → transform → write PNG) | itself (`scripts/generate-brand-assets.ts`, Phase 31) — the splash-icon full-canvas render step is the closest existing sub-pattern within the same file | exact (same file, new step reusing existing helpers) |
| `app/index.tsx` (replace `<Text style={styles.heading}>Lafa</Text>` with `<Image>`) | component (Expo Router screen, presentational) | request-response (static local render, no data flow) | `app/index.tsx` itself — no other screen/component in this codebase renders an `Image`; closest structural analog is `src/components/OfflinePill.tsx` for the "small bundled-asset visual element styled from `tokens.ts`" pattern | role-match (no `Image` precedent exists; reuse this file's own `StyleSheet`/token conventions) |

## Pattern Assignments

### `assets/brand/lafa-homepage-lockup.svg` (asset promotion, file-I/O)

**Analog:** `assets/brand/lafa-icon.svg` (canonical mark source, Phase 31) + `assets/brand/candidates/lafa-homepage-lockup.svg` (content source)

**What "promotion" means here (established by Phase 31's precedent for `lafa-icon.svg`):** copy the candidate file to the canonical path, but do **not** carry over its old embedded mark. Per CONTEXT.md D-01/D-02, the promoted file's mark slot must be swappable/regenerable by the script, not a hand-baked static copy of the candidate's 2-layer mark.

**Candidate's current mark slot** (`assets/brand/candidates/lafa-homepage-lockup.svg` lines 5-8):
```xml
<g transform="translate(118 26) scale(0.34)">
  <path fill-rule="evenodd" clip-rule="evenodd" d="M159 482.875..." fill="#F2643E"/>
  <path d="M402.905 576.897..." fill="#F2643E"/>
</g>
```
This is the **old 2-layer mark** (no `id`s, no depth-shadow layer, both paths flat `#F2643E`). Per D-01, this whole `<g>`'s children must be replaced with the 3-layer canonical mark's structure (`mark-depth`/`mark-fill`/`mark-highlight`, matching `assets/brand/lafa-icon.svg` lines 4-8) — either by physically re-authoring the promoted static SVG file with the new layer markup (with `id`s preserved so the generator can still target them via `extractMarkOnly()`-compatible structure), or by leaving the `<g transform="translate(118 26) scale(0.34)">` slot present but empty/placeholder in the committed SVG and letting the generator inject the composed mark markup at render time only. **D-02 says the generator is the single source of truth for the mark at render time** — read `scripts/generate-brand-assets.ts`'s `main()` (below) for the exact injection mechanics; the promoted `.svg` file itself only needs to keep the same `<g transform="translate(118 26) scale(0.34)">` id-free slot with matching viewBox/background/wordmark/dot/tagline markup, since it is treated as a design reference / possible future direct-SVG-render source, not the file the PNG generator necessarily reads verbatim for the mark.

**Static markup to keep as-is from the candidate** (background, wordmark, dot, tagline — lines 1, 4, 9-11):
```xml
<svg width="1600" height="520" viewBox="0 0 1600 520" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="title desc">
  <rect width="1600" height="520" rx="64" fill="#FFF9F6"/>
  ...
  <text x="462" y="276" fill="#F2643E" font-family="SF Pro Rounded, Avenir Next, Nunito, Arial Rounded MT Bold, Arial, sans-serif" font-size="220" font-weight="800" letter-spacing="0">lafa</text>
  <circle cx="952" cy="248" r="25" fill="#1F7F66"/>
  <text x="468" y="370" fill="#24201E" font-family="SF Pro Rounded, Avenir Next, Nunito, Arial, sans-serif" font-size="54" font-weight="600" letter-spacing="0">Learn it. Say it.</text>
</svg>
```

---

### `scripts/generate-brand-assets.ts` (utility, batch/file-I/O — new lockup render step)

**Analog:** this same file's existing icon/splash render steps (Phase 31), specifically its `extractMarkOnly()`/`composeMark()` machinery and the splash-icon full-canvas render (not the safe-zone-cropped icon/Android renders — the lockup, like splash, is a fixed full composition, not a centered mark needing bbox math).

**Imports pattern** (lines 1-5, no change needed — reuse as-is):
```typescript
import { readFileSync, writeFileSync } from "node:fs";

import { Resvg } from "@resvg/resvg-js";
import { DOMParser } from "linkedom";
import sharp from "sharp";
```

**Constants pattern to extend** (lines 7-31) — add sibling constants for the new output, following the existing `SOURCE_SVG_PATH`/`*_OUTPUT_PATH`/dimension-constant style:
```typescript
const SOURCE_SVG_PATH = "assets/brand/lafa-icon.svg";
const ICON_OUTPUT_PATH = "assets/images/icon.png";
...
const CANVAS_PX = 1024;
const SPLASH_WIDTH_PX = 1024;
...
const MARK_DEPTH_ID = "mark-depth";
const MARK_FILL_ID = "mark-fill";
const MARK_HIGHLIGHT_ID = "mark-highlight";
const EXPECTED_MARK_IDS = [MARK_DEPTH_ID, MARK_FILL_ID, MARK_HIGHLIGHT_ID] as const;
const COLOR_OUTPUT_LAYER_IDS = EXPECTED_MARK_IDS; // D-06: depth renders in icon, splash, Android foreground
```
Add: `LOCKUP_SOURCE_SVG_PATH = "assets/brand/lafa-homepage-lockup.svg"`, `LOCKUP_OUTPUT_PATH = "assets/images/lafa-homepage-lockup.png"`, and a `LOCKUP_WIDTH_PX` (or similar) constant sized per D-03 (2x-3x expected display width, e.g. `2400`-`4800`, keeping the 1600:520 aspect ratio — the generator does not need to recompute this since resvg's `fitTo: { mode: "width", value: ... }` handles scaling from the existing `0 0 1600 520` viewBox).

**Reused mark-extraction/composition functions** (lines 47-132, unchanged — call these, don't reimplement):
```typescript
function extractMarkOnly(svg: string): ExtractedMark { ... }
function composeMark(mark: ExtractedMark, ids: readonly MarkLayerId[]): string { ... }
```
Note: `extractMarkOnly()` currently hardcodes error messages referencing `SOURCE_SVG_PATH` (the icon source) — since the mark is extracted from `assets/brand/lafa-icon.svg` (already the `main()`-scope `mark` variable, computed once and reused for icon/splash/Android per the existing "Integration Points" pattern in CONTEXT.md), the lockup step does **not** need to re-parse a new source file for the mark — it reuses the already-extracted `mark` object from the top of `main()` (line 212: `const mark = extractMarkOnly(sourceSvg);`) and the already-composed `colorMarkup` (line 214: `const colorMarkup = composeMark(mark, COLOR_OUTPUT_LAYER_IDS);`).

**Injection into the lockup's static markup — new pattern to write** (no direct precedent in this file since prior steps only ever compose a mark onto a blank/full-canvas doc, never inject into a larger pre-authored SVG with sibling elements). Follow the same "fail loud on shape mismatch" style as `extractMarkOnly()` (lines 47-123) when parsing the lockup source and locating its mark slot:
```typescript
function buildLockupDoc(lockupSvg: string, colorMarkup: string): string {
  // parse lockupSvg with DOMParser (same linkedom import already in use),
  // locate the <g transform="translate(118 26) scale(0.34)"> slot,
  // throw a descriptive "source may have changed shape" error (matching the
  // extractMarkOnly() error style at lines 52-54, 59-61, 68-71) if the slot
  // is missing or has an unexpected child count, then replace its innerHTML
  // with colorMarkup and re-serialize the full document (doc.toString()/outerHTML).
}
```

**Render pattern** (mirrors the splash-icon full-canvas render at lines 259-264 — full composition, not cropped/safe-zone):
```typescript
// splash-icon.png — full-canvas mark composition, transparent, no background rect.
const splashRender = new Resvg(fullCanvasMarkDoc, {
  fitTo: { mode: "width", value: SPLASH_WIDTH_PX },
  background: TRANSPARENT_BACKGROUND,
}).render();
writeFileSync(SPLASH_OUTPUT_PATH, splashRender.asPng());
```
The lockup render step differs only in that it keeps its own baked-in `#FFF9F6` background (rect already present in the lockup SVG, `rx="64"`), so pass no `background:` override (or `TRANSPARENT_BACKGROUND` if the rect is trusted to paint it) — follow the `icon.png` full-bleed pattern (lines 231-241) instead, which sets `background: ICON_BACKGROUND_HEX` as a safety net:
```typescript
const iconRender = new Resvg(buildFullIconDoc(colorMarkup), {
  fitTo: { mode: "width", value: CANVAS_PX },
  background: ICON_BACKGROUND_HEX,
}).render();
...
const iconPng = await sharp(iconRender.asPng()).removeAlpha().png().toBuffer();
writeFileSync(ICON_OUTPUT_PATH, iconPng);
```

**Where to add the new step in `main()`** (lines 210-275) — append alongside the existing icon/favicon/splash/Android steps, after `mark`/`colorMarkup` are already computed (lines 211-214), reusing them rather than re-extracting:
```typescript
async function main(): Promise<void> {
  const sourceSvg = readFileSync(SOURCE_SVG_PATH, "utf-8");
  const mark = extractMarkOnly(sourceSvg);
  const colorMarkup = composeMark(mark, COLOR_OUTPUT_LAYER_IDS);
  ...
  // — new lockup step goes here, after the existing icon/splash/Android writes —
  const lockupSvg = readFileSync(LOCKUP_SOURCE_SVG_PATH, "utf-8");
  const lockupDoc = buildLockupDoc(lockupSvg, colorMarkup);
  const lockupRender = new Resvg(lockupDoc, {
    fitTo: { mode: "width", value: LOCKUP_WIDTH_PX },
    background: ICON_BACKGROUND_HEX, // or TRANSPARENT_BACKGROUND — the rect already paints #FFF9F6
  }).render();
  writeFileSync(LOCKUP_OUTPUT_PATH, lockupRender.asPng());
}
```

**Error handling pattern** (fail-loud, descriptive — lines 52-54, 68-71, 82-87, 100-103, 114-118, 147-157, 193-206): every "source may have changed shape" condition throws a `new Error(...)` with the file path and a description of what was expected vs. found. Apply this same style to the new `buildLockupDoc()` slot-location logic and to any dimension-mismatch check on the rendered lockup PNG (mirroring the `iconRender.width !== CANVAS_PX` check at lines 237-241).

---

### `app/index.tsx` (component, request-response — replace `Text` heading with `Image` lockup)

**Analog:** this file itself (no `Image` precedent exists anywhere in `app/` or `src/`); follow its own `StyleSheet.create`/token-import conventions, and structurally mirror `src/components/OfflinePill.tsx`'s "small self-contained bundled visual styled from `tokens.ts`" shape for the surrounding style block.

**Imports pattern** (lines 1-13, current) — add `Image` to the existing `react-native` import list:
```typescript
import { useState } from "react";
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import Constants from "expo-constants";
import { Stack, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuizStore } from "../src/store/useQuizStore";
import { tenseLabels } from "../src/quiz/labels";
import { TENSES } from "../src/dataset/types";
import type { Tense } from "../src/dataset/types";
import type { VerbMode } from "../src/quiz/types";
import { colors, radius, spacing, typography } from "../src/theme/tokens";
import { OfflinePill } from "../src/components/OfflinePill";
import { ProductFeedbackModal } from "../src/productFeedback/ProductFeedbackModal";
```
becomes: `import { ActivityIndicator, Image, Platform, Pressable, StyleSheet, Text, View } from "react-native";` — `typography` import may become unused for `heading` specifically but stays imported (used by `sectionLabel`, `errorText`, `chipText`, `startButtonText`, `productFeedbackLinkText`).

**Element being replaced** (line 74):
```typescript
<Text style={styles.heading}>Lafa</Text>
```
replace with (per UI-SPEC.md "Visual & Layout Contract" — `resizeMode="contain"`, explicit `width`/`height` or `aspectRatio`, `accessibilityRole="image"`, `accessibilityLabel`):
```typescript
<Image
  source={require("../assets/images/lafa-homepage-lockup.png")}
  style={styles.lockup}
  resizeMode="contain"
  accessibilityRole="image"
  accessibilityLabel="Lafa — Learn it. Say it."
/>
```

**Style block being replaced** (lines 176-181):
```typescript
heading: {
  ...typography.heading,
  color: colors.text,
  marginBottom: spacing.lg,
  textAlign: "center",
},
```
replace with a sizing block using `spacing.lg` for `marginBottom` (D-02 in UI-SPEC.md: "reuses `spacing.lg` as its `marginBottom`, matching the `Text` it replaces") and the source aspect ratio `1600/520` (UI-SPEC.md line 97):
```typescript
lockup: {
  width: "100%",
  maxWidth: 400,
  aspectRatio: 1600 / 520,
  alignSelf: "center",
  marginBottom: spacing.lg,
},
```

**No `require()` precedent exists anywhere in this codebase** (confirmed via repo-wide grep — no other file uses `require("../assets/...")` for a bundled image). This is a first-instance pattern; follow standard Expo/RN convention (`require()` with a relative path, resolved statically by Metro at bundle time) rather than any in-repo precedent. `app.json`'s `icon`/`splash`/`favicon` fields reference `assets/images/*.png` by string path for native config purposes only — that is a different resolution mechanism (Expo config, not Metro `require()`) and not directly reusable as code, but confirms the target filenames already follow the flat `assets/images/*.png` convention this new file joins.

---

## Shared Patterns

### Fail-loud "source may have changed shape" errors
**Source:** `scripts/generate-brand-assets.ts` lines 47-123, 142-160, 191-208 (Phase 31 convention)
**Apply to:** the new lockup-mark-injection logic in `scripts/generate-brand-assets.ts` — any place the script parses/locates a slot in an SVG it doesn't fully control (the lockup's `<g transform="translate(118 26) scale(0.34)">` slot) must throw a descriptive `Error` rather than silently producing a malformed render.

### Design tokens, not hardcoded values
**Source:** `src/theme/tokens.ts` (`colors`, `spacing`, `radius`, `typography`)
**Apply to:** `app/index.tsx`'s new `lockup` style — use `spacing.lg` for `marginBottom` as specified; do not introduce new hardcoded pixel/color literals (UI-SPEC.md confirms no new colors/spacing tokens are needed — the PNG itself carries all the lockup's colors, baked in at generation time).

### Single generated-PNG, no density variants
**Source:** existing `icon.png`/`splash-icon.png` generation pattern in `scripts/generate-brand-assets.ts` (lines 231-264)
**Apply to:** `lafa-homepage-lockup.png` — one PNG rendered at 2x-3x display size, referenced directly via `require()`; do not add `@1x`/`@2x`/`@3x` filename variants (explicitly rejected, D-03).

## No Analog Found

None — all three files have a usable analog, either within the same file (`generate-brand-assets.ts` extending its own established render-step pattern) or from the closest sibling asset (`lafa-icon.svg`'s Phase 31 promotion precedent). The one true gap is `app/index.tsx`'s `Image`/`require()` usage, which has zero in-repo precedent — flagged above as a first-instance pattern to follow standard Expo/RN convention rather than a codebase analog.

## Metadata

**Analog search scope:** `scripts/generate-brand-assets.ts`, `assets/brand/`, `assets/brand/candidates/`, `assets/images/`, `app/index.tsx`, `src/components/OfflinePill.tsx`, `src/theme/tokens.ts`; repo-wide grep for `require(` and `Image` usage in `app/`/`src/`
**Files scanned:** 8
**Pattern extraction date:** 2026-08-16
