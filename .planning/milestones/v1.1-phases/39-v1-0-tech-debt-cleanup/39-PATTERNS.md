# Phase 39: v1.0 Tech-Debt Cleanup - Pattern Map

**Mapped:** 2026-10-14
**Files analyzed:** 11 (2 new, 9 modified)
**Analogs found:** 9 / 11 (docs files edited in place; no code analog needed)

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `scripts/brand-colors.ts` (new) | config (constants) | transform | constants block in `scripts/generate-brand-assets.ts` L21-28 | exact (extracted from it) |
| `src/theme/lockup.ts` (new) | config (constants) | transform | `src/theme/tokens.ts` (named-export leaf, no imports) + constants in `app/index.tsx` L22-37 | exact |
| `scripts/validate-brand.ts` (mod) | utility (CLI gate) | file-I/O / batch | itself (existing `checkPngDimensions`, `CheckResult`, `main()`) | exact |
| `scripts/generate-brand-assets.ts` (mod) | utility (CLI) | file-I/O | itself (L21-28 colour block) | exact |
| `app/index.tsx` (mod) | component (screen) | request-response | its own import block L1-12 (`../src/theme/tokens`) | exact |
| `tsconfig.json` (mod) | config | n/a | itself | exact |
| `CLAUDE.md` (mod) | docs | n/a | top paragraph on app.json slug/scheme divergence | exact |
| `.planning/codebase/STACK.md` (mod) | docs | n/a | `## Configuration > Build:` bullet (~L93), stale L107 | exact |
| `.planning/milestones/v1.0-phases/30-build-pipeline-hardening/30-02-SUMMARY.md` (mod) | docs | n/a | correction block pattern (D-10) | n/a |
| `.planning/milestones/v1.0-phases/35-app-store-connect-readiness/35-06-SUMMARY.md` (mod) | docs | n/a | same | n/a |
| `store/screenshots/README.md` (mod) | docs | n/a | in-place edit, L27-29 | n/a |

## Pattern Assignments

### `scripts/brand-colors.ts` (new, constants)

**Analog:** `scripts/generate-brand-assets.ts` L21-28 (source of the values)

Current text to extract:
```typescript
const ICON_BACKGROUND_HEX = "#FFF9F6";
const TRANSPARENT_BACKGROUND = "rgba(0,0,0,0)";
const MONOCHROME_FILL = 'fill="#FFFFFF"';
const ORANGE_FILL_HEX = "#F2643E";
const DEPTH_FILL_HEX = "#C94A2D";
```
New module: named `export const` only, SCREAMING_SNAKE_CASE, NO imports, erasable syntax only (no enums/namespaces/param properties), because Node type-stripping loads it:
```typescript
export const ICON_BACKGROUND_HEX = "#FFF9F6";
export const ORANGE_FILL_HEX = "#F2643E";
export const DEPTH_FILL_HEX = "#C94A2D";
export const MONOCHROME_FILL_HEX = "#FFFFFF";
```
Keep `TRANSPARENT_BACKGROUND` in the generator (renderer-only).

### `scripts/generate-brand-assets.ts` (mod)

Replace L21-28 colour consts with an import placed after external packages (CONVENTIONS order: externals first, then relative). Must use explicit `.ts`:
```typescript
import sharp from "sharp";

import { DEPTH_FILL_HEX, ICON_BACKGROUND_HEX, MONOCHROME_FILL_HEX, ORANGE_FILL_HEX } from "./brand-colors.ts";
...
const MONOCHROME_FILL = `fill="${MONOCHROME_FILL_HEX}"`;   // keeps L249 usage unchanged
```
Existing use at L249: `markMarkup.replaceAll(\`fill="${ORANGE_FILL_HEX}"\`, MONOCHROME_FILL)`. Do not import FROM the generator in validate-brand (it runs `main()` and writes PNGs on import).

### `src/theme/lockup.ts` (new, constants)

**Analog:** `src/theme/tokens.ts` (flat named exports, no default, no imports) and `app/index.tsx` L22-37.

Move the whole comment block and the four constants verbatim (zero value change):
```typescript
// (move the measurement comment from app/index.tsx L22-36 here)
export const LOCKUP_CONTENT_X0 = 176;
export const LOCKUP_CONTENT_Y0 = 93;
export const LOCKUP_CONTENT_X1 = 976.5;
export const LOCKUP_CONTENT_Y1 = 382.5;
```
Optional comment tweak: gate now enforces these (tol +/-2 in validate-brand). Derived consts (`LOCKUP_HEIGHT`, `LOCKUP_SCALE`, `LOCKUP_CROP_WIDTH`, offsets, with literal `1600`/`520`) stay in `app/index.tsx`.

### `app/index.tsx` (mod)

**Imports pattern** (L1-12, extension-less like every app import):
```typescript
import { colors, radius, spacing, typography } from "../src/theme/tokens";
import { OfflinePill } from "../src/components/OfflinePill";
```
Add alongside:
```typescript
import {
  LOCKUP_CONTENT_X0,
  LOCKUP_CONTENT_Y0,
  LOCKUP_CONTENT_X1,
  LOCKUP_CONTENT_Y1,
} from "../src/theme/lockup";
```
Remove L22-37 declarations (comment + 4 consts); keep L38-46 derived consts (`LOCKUP_HEIGHT` ... `LOCKUP_OFFSET_Y`) unchanged. Must keep typecheck/lint/jest green (D-14).

### `tsconfig.json` (mod)

Current:
```json
"compilerOptions": {
  "strict": true,
  "noUncheckedIndexedAccess": true,
  "types": ["jest", "node"]
},
```
Add `"allowImportingTsExtensions": true` (without it tsc TS5097 on `.ts` imports from scripts; research verified lint + 277 tests stay green).

### `scripts/validate-brand.ts` (mod)

**Analog:** itself. Plug new checks into the same `CheckResult` shape and `results` array in `main()`.

**Imports / root pattern** (replace L1-3 and path consts L5-13, L20). Note `existsSync`, `readFileSync`, `sharp` already imported at L1-3:
```typescript
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import sharp from "sharp";

import { LOCKUP_CONTENT_X0, LOCKUP_CONTENT_Y0, LOCKUP_CONTENT_X1, LOCKUP_CONTENT_Y1 } from "../src/theme/lockup.ts";
import { ICON_BACKGROUND_HEX, ORANGE_FILL_HEX, MONOCHROME_FILL_HEX } from "./brand-colors.ts";

const ROOT = resolve(import.meta.dirname, "..");
const abs = (rel: string) => resolve(ROOT, rel);
```
Delete `EXPECTED_BRAND_BG_HEX` (L20); its uses at L90, 93, 122, 129, 135 become `ICON_BACKGROUND_HEX` (string compare vs app.json uppercase, unchanged).

**Repo-root path pattern (DEBT-03)** — every cwd-relative read must be wrapped in `abs()`; keep display labels relative. Current sites:
- L47, L61: `sharp(path)` -> `sharp(abs(path))`
- L73, L88, L118, L143: `readFileSync(APP_JSON_PATH, ...)` -> `readFileSync(abs(APP_JSON_PATH), ...)`
- L172, L184: `readFileSync(GENERATOR_PATH, ...)` -> `abs(GENERATOR_PATH)`
- L160: `existsSync(strippedPath)` -> `existsSync(abs(strippedPath))` (strip `./` first, already done at L159; keep label text `strippedPath`)
- L198: `existsSync(assetPath)` -> `existsSync(abs(assetPath))`

**Core check pattern to copy** (L39-56, error handling shape):
```typescript
async function checkPngDimensions(label, path, expectedWidth, expectedHeight): Promise<CheckResult> {
  const expected = `${expectedWidth}x${expectedHeight}`;
  try {
    const metadata = await sharp(path).metadata();
    ...
    return { label, ok: actual === expected, actual, expected };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { label, ok: false, actual: `error: ${message}`, expected };
  }
}
```
New `checkPixel(label, path, x, y, expected: {r,g,b,a?}, tol = 8)` follows the same try/catch -> `error:` actual shape. Use `sharp(abs(path)).ensureAlpha().raw().toBuffer({ resolveWithObject: true })`, index `(y*width+x)*4`, guard `noUncheckedIndexedAccess` with `?? 0` (CONVENTIONS), bounds-check x/y. For transparent samples assert alpha === 0 only (RGB ignored). `actual` e.g. `rgba(242,100,62,255)`.

Sample points (verified in RESEARCH; hex from shared constants, convert to RGB):

| PNG | bg/alpha sample | mark sample |
|-----|-----------------|-------------|
| icon.png | (2,2) bg #FFF9F6 | (512,307) orange (NOT 512,512: hole) |
| favicon.png | (3,3) bg | (24,14) orange |
| splash-icon.png | (2,2) alpha 0 | (512,307) orange a=255 |
| android-icon-foreground.png | (2,2) alpha 0 | (512,307) orange |
| android-icon-monochrome.png | (2,2) alpha 0 | (512,307) white 255,255,255,255 |
| lafa-homepage-lockup.png | (100,520) bg a=255 (NOT corners: transparent) | (1600,520) orange |

**Lockup bbox gate (DEBT-04)**: scan raw RGBA; skip `a < 200`; non-bg if any channel `|c - bg| > 8`; track min/max x,y inclusive; divide by 2 (PNG is 2x of 1600x520 source); compare each of x0,y0,x1,y1 vs the four constants with `Math.abs(measured - constant) <= 2`. Emit one `CheckResult` per edge (better failure message). Expected measured: 176 / 93 / 976.5 / 382.5 (px 352,186,1953,765).

**main() integration** (L205-235): append new results to the array before the printer; the PASS/FAIL printer and `process.exit(1)` at L237-251 stay as is. Baseline was 21/21; count will rise (record new N).

### Docs (Plan 2)

**`CLAUDE.md`** — add after the sentence "Check `app.json` directly before assuming which values are current." (top paragraph, ~L11): note that `app.json` `ios.buildNumber: "1"` is ignored; `eas.json` has `cli.appVersionSource: "remote"` and `build.production.autoIncrement: true`, so EAS owns iOS build numbers (1.0.0 = build 6, 1.0.1 = build 8). Present as deliberate non-drift, same tone as the slug/scheme note.

**`.planning/codebase/STACK.md`** — append the same note to the `app.json` bullet under `## Configuration > Build:` (~L93). Optionally fix stale L107 ("No EAS Build configuration (`eas.json`) found") since eas.json now exists.

**30-02-SUMMARY.md** — headline at L38 ("...Node 22.23.2 pin ... exactly matches the EAS build image"). Insert directly under it (original text kept):
```markdown
> Correction (2026-10-14, Phase 39): The EAS SDK-57 base image default Node was 22.23.1; the `eas.json` pin installs and runs 22.23.2 (build #6 log). Outcome unchanged. See 30-VERIFICATION.md.
```
Optional one-line pointer near L49 (the "Spin up build environment" line) and L62 (Case A).

**35-06-SUMMARY.md** — headline L38 ("production EAS build and submission are in progress / pending human checkpoints"). Insert a correction block under it: build #6 (v1.0.0) was submitted, processed, attached and submitted for review in 35-07; the file's "Closed out" section already supersedes it. Re-grep before editing ("Task 3 is not yet closed" no longer exists in the file); do not invent audit-literal text.

**`store/screenshots/README.md`** L27-29: replace "from the checked-in `ios/` project" with wording that `ios/` is a gitignored local prebuild artifact generated by `npx expo prebuild` (run automatically by `expo run:ios` on a fresh checkout). Keep command at L32; leave L106 "21/21" (historical).

## Shared Patterns

### Node type-stripping-safe shared modules
**Apply to:** `scripts/brand-colors.ts`, `src/theme/lockup.ts`
- No imports of their own, named exports only, erasable TS only.
- Script importers use explicit `.ts` extension; app importers use extension-less (Metro). Requires `allowImportingTsExtensions: true`.
- Precedent/limit: `src/config/api.ts` L1 comment (Phase 36: extension-less imports cannot be resolved by Node; preflight keeps its own literal). Leave untouched.

### CheckResult + try/catch error shape
**Source:** `scripts/validate-brand.ts` L32-37, L52-55
**Apply to:** every new check (pixel, bbox)
```typescript
interface CheckResult { label: string; ok: boolean; actual: number | string; expected: number | string; }
...
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  return { label, ok: false, actual: `error: ${message}`, expected };
}
```

### Conventions
Named exports, no barrels, relative imports, SCREAMING_SNAKE_CASE constants, `import type` for types, `noUncheckedIndexedAccess` handled with `?? 0` or commented `!`.

### Negative-run proof (D-13, Phase 34 style)
Recolour a PNG (e.g. icon.png orange to `#208AEF`) -> FAIL; set `LOCKUP_CONTENT_X0` 176 -> 180 -> FAIL (177.5 -> PASS); `git checkout -- assets/images src/theme app` to restore; `(cd /tmp && node <abs>/scripts/validate-brand.ts)` and `(cd scripts && npm run validate-brand)` must match repo-root output (was 0/17 from /tmp). `git status` clean afterwards.

## No Analog Found

None requiring RESEARCH fallback. The pixel-sampling and bbox helpers have no in-repo analog (no existing raw pixel reads); use the RESEARCH.md "Code Example: pixel + bbox helpers" snippet, wrapped in the `CheckResult` shape above.

## Metadata

**Analog search scope:** `scripts/`, `app/index.tsx`, `src/theme/`, `src/config/api.ts`, `tsconfig.json`, `package.json`, doc targets
**Files scanned:** ~10
**Pattern extraction date:** 2026-10-14
