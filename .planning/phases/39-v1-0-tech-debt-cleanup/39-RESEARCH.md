# Phase 39: v1.0 Tech-Debt Cleanup - Research

**Researched:** 2026-10-14
**Domain:** Node-type-stripped tooling script hardening (sharp pixel reads), shared TS modules across Node/Metro/tsc/jest, doc corrections
**Confidence:** HIGH (all key claims verified by running experiments in this repo)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- D-01 Sample key pixels (not hash, not average). Per PNG a few fixed points (bg corner `#FFF9F6`, point inside mark brand orange `#F2643E`), tolerance +/-8 per RGB channel. Wrong-colour icon must FAIL; identical re-export must PASS.
- D-02 Cover all 6 brand PNGs: icon, favicon, splash-icon, android-icon-foreground, android-icon-monochrome, lafa-homepage-lockup. Sample points must suit each file.
- D-03 Expected colours from one source shared with the generator (`ICON_BACKGROUND_HEX` #FFF9F6, `ORANGE_FILL_HEX` #F2643E, `MONOCHROME_FILL` #FFFFFF). Extract into a small shared constants module both scripts import; remove duplicate `EXPECTED_BRAND_BG_HEX` in validate-brand.
- D-04 validate-brand resolves every path from repo root (derived from script location); same result from any cwd.
- D-05 Move `LOCKUP_CONTENT_X0/Y0/X1/Y1` out of `app/index.tsx` into a small shared module (e.g. `src/theme/lockup.ts`, named export, no default). Values stay 176 / 93 / 976.5 / 382.5. No release in this phase.
- D-06 Gate measures bounding box of non-background pixels in `assets/images/lafa-homepage-lockup.png`; fails if any of four constants differs by more than +/-2 px.
- D-07 Shared modules must be importable by Node (explicit `.ts` ext, erasable syntax), Expo/Metro, and `tsc --noEmit`. If impossible, closest equivalent keeping one source of truth, and document why.
- D-08 Keep `app.json` `ios.buildNumber: "1"`; document only (ignored because `eas.json` has `appVersionSource: "remote"` + `autoIncrement`; 1.0.1 shipped as build 8).
- D-09 Note goes in `CLAUDE.md` (next to the app.json slug/scheme divergence note) and `.planning/codebase/STACK.md`.
- D-10 Archived 30-02-SUMMARY and 35-06-SUMMARY get a dated correction block `> Correction (YYYY-MM-DD, Phase 39): ...` at the point of error. Original text kept.
- D-11 `store/screenshots/README.md` edited in place (line ~28 checked-in `ios/`).
- D-12 Two plans, both wave 1: Plan 1 validate-brand hardening (DEBT-02/03/04 + shared modules + `app/index.tsx` import); Plan 2 docs (DEBT-01/05).
- D-13 Proof by negative runs (wrong-colour PNG, tweaked crop constants -> FAIL; restore -> PASS; run from subdir -> same). Restore all temp changes; never commit them. No new Jest tests required.
- D-14 Plan 1 keeps `npm run typecheck`, `npm run lint`, `npm test` green.

### Claude's Discretion
- Exact sample coordinates per PNG and non-background threshold for bbox measurement.
- Name/location of the shared colour constants module.

### Deferred Ideas (OUT OF SCOPE)
- Re-fetching content on app foreground.
- Removing `ios.buildNumber` from app.json entirely.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| DEBT-01 | Document `ios.buildNumber` ignored (eas remote autoIncrement) | Facts verified in `eas.json`/`app.json`; target locations identified below |
| DEBT-02 | validate-brand fails on wrong pixel colour | Verified sample points + actual RGBA for all 6 PNGs |
| DEBT-03 | validate-brand cwd-independent | Reproduced the bug (0/17 from /tmp); `import.meta.dirname` verified |
| DEBT-04 | validate-brand gates lockup crop constants | Bbox measurement reproduces constants exactly; threshold proposed |
| DEBT-05 | Correct 30-02-SUMMARY, 35-06-SUMMARY, screenshots README | Exact locations below |
</phase_requirements>

## Summary

Everything is tooling/docs. All technical risk (D-07) is resolved: a shared leaf `.ts` module is importable by `node scripts/*.ts` (Node 25.0.0 locally, engines pin 22.23.2, both strip types by default) using an explicit `.ts` extension, **provided `tsconfig.json` gets `"allowImportingTsExtensions": true`** (without it `tsc` fails with TS5097; with it typecheck, `expo lint` and all 277 jest tests stayed green). The app (Metro) imports the same module extension-less as every other app import, so no Metro change is needed.

The Phase 36 precedent (`src/config/api.ts` comment: "Node type-stripping cannot import it") is about extension-less relative imports: Node ESM does not resolve `../src/config/api` without `.ts`, and the project did not enable `allowImportingTsExtensions`, so preflight kept a literal guarded by a test. That limit does not apply when the script writes the `.ts` extension and tsconfig allows it. [VERIFIED: experiment in repo, temp files removed, tsconfig restored]

Measured lockup bbox reproduces the existing constants exactly (176 / 93 / 976.5 / 382.5), so a +/-2 gate passes today with large headroom.

**Primary recommendation:** Add `src/theme/lockup.ts` (4 constants, no imports) and `scripts/brand-colors.ts` (hex constants, no imports); validate-brand and generator import them with `.ts` extensions; set `allowImportingTsExtensions: true`; derive ROOT from `import.meta.dirname`.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary | Rationale |
|------------|-------------|-----------|-----------|
| Brand pixel/crop gate | Dev tooling (Node script) | — | Pre-capture/pre-build gate, never runs in app |
| Lockup crop constants | App source (`src/theme`) | Tooling reads them | App renders with them; script gates drift |
| Brand colour constants | Tooling (`scripts/`) | — | Only generator + validator use them; keep out of app bundle |
| Docs corrections | Planning/docs | — | No code |

## Standard Stack

No new dependencies. Uses existing `sharp` ^0.35.3 (`.ensureAlpha().raw().toBuffer({resolveWithObject:true})`), `node:fs`, `node:path`. [VERIFIED: package.json, experiment]

## Package Legitimacy Audit

No external packages installed in this phase. Not applicable.

## Architecture Patterns

### Data flow
```
scripts/brand-colors.ts ──┬─> scripts/generate-brand-assets.ts (renders PNGs)
                          └─> scripts/validate-brand.ts ──reads──> assets/images/*.png (sharp raw)
src/theme/lockup.ts ──┬─> app/index.tsx (crop maths, extension-less import)
                      └─> scripts/validate-brand.ts (compare to measured bbox)
ROOT = import.meta.dirname/.. ──> every path in validate-brand
```

### D-07 concrete import pattern (verified)

```ts
// scripts/validate-brand.ts
import { resolve } from "node:path";
import { LOCKUP_CONTENT_X0, LOCKUP_CONTENT_Y0, LOCKUP_CONTENT_X1, LOCKUP_CONTENT_Y1 } from "../src/theme/lockup.ts";
import { ICON_BACKGROUND_HEX, ORANGE_FILL_HEX, MONOCHROME_FILL_HEX } from "./brand-colors.ts";

const ROOT = resolve(import.meta.dirname, "..");
const abs = (rel: string) => resolve(ROOT, rel);
```
```ts
// app/index.tsx (extension-less, like all other app imports)
import { LOCKUP_CONTENT_X0, LOCKUP_CONTENT_Y0, LOCKUP_CONTENT_X1, LOCKUP_CONTENT_Y1 } from "../src/theme/lockup";
```
```jsonc
// tsconfig.json compilerOptions  (required; noEmit is already true via expo base)
"allowImportingTsExtensions": true
```
Experiment results [VERIFIED]:
- `node scripts/zzexp.ts` importing `../src/theme/zzexp.ts` works; `import.meta.dirname` resolves to `.../scripts`; also works when invoked from `src/` cwd.
- Node prints the existing `MODULE_TYPELESS_PACKAGE_JSON` reparse warning (already emitted by current scripts; harmless; do NOT add `"type":"module"` — out of scope, could affect Metro/jest tooling).
- `tsc --noEmit` without the flag: `TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled`. With flag: clean.
- With flag + temp files present: `npm run lint` clean, `npx jest` 23 suites / 277 tests pass.
- Metro bundle not executed; the app only uses extension-less import of a dependency-free leaf module (same as `../src/theme/tokens`), so risk is negligible. Plan may optionally add a cheap `npx expo export --platform ios` smoke check (MEDIUM-confidence-optional).
- Constraints on shared modules: erasable TS only (no enums, namespaces, parameter properties), no imports of their own (keeps the Node-resolution problem away), named exports only, relative imports.
- Rejected alternative: extension-less import from script fails in Node ESM (this is the Phase 36 limitation). Fallback not needed.

Update the `src/config/api.ts`/preflight comment? Not required; leave it (preflight still has its own literal and test guard).

### Shared colours module
`scripts/brand-colors.ts`: `ICON_BACKGROUND_HEX = "#FFF9F6"`, `ORANGE_FILL_HEX = "#F2643E"`, `DEPTH_FILL_HEX = "#C94A2D"`, `MONOCHROME_FILL_HEX = "#FFFFFF"`. Generator currently holds `MONOCHROME_FILL = 'fill="#FFFFFF"'` (a markup fragment) — redefine in generator as `` `fill="${MONOCHROME_FILL_HEX}"` ``. Caution: validate-brand's `checkGeneratorSource`/`checkGeneratorHasNoRetiredRefs` only text-scan the generator for SVG filenames; a colours import does not affect them. Colour constants only exist in generator today at lines ~21-28 (`ICON_BACKGROUND_HEX`, `ORANGE_FILL_HEX`, `DEPTH_FILL_HEX`, `MONOCHROME_FILL`). `EXPECTED_BRAND_BG_HEX` in validate-brand (used in adaptive-background and splash checks) becomes `ICON_BACKGROUND_HEX`. Note comparison there is a string compare against app.json (case: app.json uses uppercase `#FFF9F6`; keep exact string).

### DEBT-03 current behaviour (reproduced)
All paths (`app.json`, `scripts/generate-brand-assets.ts`, `assets/images/*.png`, retired asset paths, `existsSync(strippedPath)`) are cwd-relative literals. From `/tmp`: `0/17 checks passed` (ENOENT); from repo root: `21/21`. Fix: wrap every fs/sharp path with `abs()`; paths read from app.json (`./assets/images/...`) must be stripped of `./` then `abs()`'d. Keep display labels relative. Results must be identical from any cwd (use as D-13 proof, e.g. `(cd /tmp && node <abs>/scripts/validate-brand.ts)` and `(cd scripts && npm run validate-brand)`).
Optional: generator has same cwd-relative paths (not in DEBT-03 scope; mention only).

### Per-PNG sample points (actual RGBA measured with sharp raw) [VERIFIED]
Tolerance +/-8 per RGB channel; for transparent pixels check alpha only (RGB of alpha=0 pixels is 0,0,0, ignore it). Orange points verified as a solid 13x13 (radius 6) block of exact `242,100,62,255` (favicon: 3x3 block at 15,15; point (24,14) also exact).

| PNG | Size | Bg/alpha sample | Mark sample |
|-----|------|-----------------|-------------|
| icon.png | 1024x1024 (no alpha) | (2,2) = 255,249,246 (and (1021,1021)) | (512,307) = 242,100,62; (512,717) too. NOT centre (512,512): that is background (mark has a hole) |
| favicon.png | 48x48 (no alpha) | (3,3) = 255,249,246 | (24,14) = 242,100,62 (also (15,15)) |
| splash-icon.png | 1024x1024 RGBA | (2,2) = 0,0,0,0 -> alpha 0 | (512,307) = 242,100,62,255 |
| android-icon-foreground.png | 1024x1024 RGBA | (2,2) alpha 0 | (512,307) = 242,100,62,255 |
| android-icon-monochrome.png | 1024x1024 RGBA | (2,2) alpha 0 | (512,307) = 255,255,255,255 (also (512,614)) |
| lafa-homepage-lockup.png | 3200x1040 RGBA | (100,520) = 255,249,246,255 (also (3000,520), (1600,60)). Do NOT sample corners: (30,30) is transparent (rounded-rect corner) | (1600,520) = 242,100,62,255 (solid; also (1280,520)) |

Whole-image sanity: icon has 737,780 bg px and 279,539 exact-orange px; splash same orange; foreground orange 259,403 px; monochrome 275,895 pure white opaque px. A wrong-colour re-export (e.g. old blue `#208AEF`) would fail every orange/bg sample.

Suggested helper: `checkPixel(label, path, x, y, expected:{r,g,b,a?}, tol=8)` using one `sharp(abs(path)).ensureAlpha().raw().toBuffer({resolveWithObject:true})` per file, index `(y*width+x)*4`; guard `noUncheckedIndexedAccess` with `?? 0`/`!` and comment per CONVENTIONS. Return the existing `CheckResult` shape (`actual` like `rgba(242,100,62,255)`); wrap in try/catch returning `error:` actual as other checks do. Bounds-check x,y against width/height.

### DEBT-04 lockup bbox [VERIFIED]
Coordinate space: constants are in the 1600x520 SVG source space; PNG is 2x (3200x1040). Mapping: constant = pixelIndex / 2.
Measured on actual PNG, "non-background" = alpha >= 200 AND any channel differs from `#FFF9F6` by more than tol:
- px bbox: minX 352, minY 186, maxX 1953, maxY 765 (inclusive indices).
- /2 => **176, 93, 976.5, 382.5** — identical to current constants (use inclusive max index /2, no +1).
- Result is stable for tol 3, 6, 8, 16, 32 (all give the same bbox); tol 64 shifts y0 to 93.5 (still within +/-2); tol 0 fails (antialias/noise).
- The alpha >= 200 condition is essential: without it the transparent/antialiased rounded corners produce bbox ~(1.5,1.5,1598.5,518.5).
Recommended: tol = 8 (match D-01), alpha >= 200 (matches the comment in `app/index.tsx`), compare in source space with `Math.abs(measured - constant) <= 2` for each of four values; report four values in `actual`/`expected` (one CheckResult per edge or one combined; per-edge gives better failure message). Scan 3.3M px in JS loop: ~tens of ms (whole validate-brand ran in 0.14s today).
After extraction, the long measurement comment in `app/index.tsx` should move to `src/theme/lockup.ts` along with the constants (leave derived consts `LOCKUP_HEIGHT`, `LOCKUP_SCALE`, etc. in `app/index.tsx`; they use `1600`/`520` literals—may optionally export `LOCKUP_SOURCE_WIDTH/HEIGHT`, but D-05 says zero change so keep minimal).
Negative proof: set `LOCKUP_CONTENT_X0` to 180 temporarily (diff 4 > 2) -> FAIL; 177.5 (diff 1.5) -> PASS (boundary demonstration optional).

### DEBT-05/01 doc locations [VERIFIED by grep]
- **30-02-SUMMARY** (`.planning/milestones/v1.0-phases/30-build-pipeline-hardening/30-02-SUMMARY.md`): false claim "build image's Node was 22.23.2 / Case A exact match" at lines 12, 25, 38 (headline), 49 ("Spin up build environment" reported 22.23.2), 62 (Case A confirmed). Truth (per 30-VERIFICATION lines 9-10, 49-52 and 30-UAT test 3): EAS SDK-57 base image default Node was **22.23.1**; the `eas.json` pin installs and runs **22.23.2** (build #6 log). Outcome unchanged. Put the correction blockquote right after the headline at line 38 (and optionally a one-line pointer under line 49). Original text stays.
- **35-06-SUMMARY** (`.../35-app-store-connect-readiness/35-06-SUMMARY.md`): the audit's quoted string "Task 3 is not yet closed" does NOT exist in the file now (grep for "not yet" returns nothing; the file already has Task 3 "Status: complete" at ~line 146 and a "### Closed out" section, final line 183 says "Task 3 and this plan are complete"). The remaining stale text is the headline at line 38: "production EAS build and submission are in progress / pending human checkpoints." Also frontmatter says nothing stale. Plan should place the correction block under line 38 stating the build (#6, v1.0.0) was submitted, processed, attached and submitted for review in 35-07, and note the audit's quoted ending is already superseded by the Closed out section. Planner: re-grep before editing; do not invent text matching the audit literally.
- **store/screenshots/README.md** lines 28-29: "Build and install a real native build from the checked-in `ios/` project (not Expo Go)". `ios/` exists locally but is gitignored (`git check-ignore ios` confirms; `git ls-files ios` empty). Edit in place: e.g. "from a local native `ios/` project (gitignored; generated by `npx expo prebuild`, which `expo run:ios` runs automatically on a fresh checkout)". Keep command at line 32. (Line 106 mentions "validate-brand passed 21/21" — historical, leave; count will grow after this phase.)
- **CLAUDE.md** (top paragraph lines ~3-11, after "Check `app.json` directly before assuming which values are current."): add note: `app.json` `ios.buildNumber: "1"` is ignored; `eas.json` has `cli.appVersionSource: "remote"` and `build.production.autoIncrement: true`, so EAS owns iOS build numbers (1.0.0 = build 6, 1.0.1 = build 8). Keep it a deliberate non-drift note.
- **.planning/codebase/STACK.md** `## Configuration > Build:` bullet (line ~93, describes app.json) and the stale line 107 ("No EAS Build configuration (`eas.json`) found") — add the buildNumber note to the `app.json` bullet; consider also fixing line 107 since eas.json now exists (low-cost, in scope of DEBT-01 accuracy; flag to planner as optional). The CLAUDE.md headline in the "Project" section is regenerated from STACK via @-link, so editing STACK.md plus the top paragraph suffices.
Facts: `eas.json` `cli.appVersionSource = "remote"`, `build.production.autoIncrement = true`, `node 22.23.2`; `app.json` line 12 `"buildNumber": "1"`. Build numbers: 1.0.0 = #6 (35-06), 1.0.1 = build 8 (38-CONTEXT/38-02-SUMMARY). [VERIFIED: files]

## Don't Hand-Roll

| Problem | Don't Build | Use Instead |
|---------|-------------|-------------|
| Pixel reads | PNG decoding | `sharp(...).ensureAlpha().raw()` |
| Repo-root | `process.cwd()` walks / `git rev-parse` | `import.meta.dirname` (Node >= 20.11; engines 22.23.2) |
| Colour hashing/averaging | perceptual hash | fixed-point sampling (D-01) |

## Common Pitfalls

1. **Sampling the icon centre** — (512,512) is background, not orange. Use (512,307).
2. **Sampling lockup corners** — rounded-rect corners are transparent; use interior bg points.
3. **Comparing RGB on transparent pixels** — RGB is 0,0,0; assert alpha 0 only.
4. **Forgetting `ensureAlpha()`** — icon/favicon are 3-channel; raw index maths breaks without it.
5. **Bbox without alpha >= 200** — antialiased/transparent edges blow the bbox to the full image.
6. **Extension-less script imports** — fail in Node; and `.ts` imports fail `tsc` without `allowImportingTsExtensions`. Both must be in place together.
7. **Shared modules with their own imports or non-erasable syntax** — break Node type stripping.
8. **Leaving temp negative-run artifacts** — restore PNGs/constants (`git status` must be clean afterwards; assets are tracked so `git checkout -- assets/images app/ src/theme` restores).
9. **Path strings from app.json** carry `./`; strip then `abs()`.
10. **Importing generator constants from the generator** — generator executes `main()` on import (writes PNGs!). That is why colours must go in a separate module.

## Code Example: pixel + bbox helpers

```ts
async function readRaw(rel: string) {
  const { data, info } = await sharp(abs(rel)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return { data, width: info.width, height: info.height };
}
function pixelAt(img: { data: Buffer; width: number }, x: number, y: number) {
  const i = (y * img.width + x) * 4;
  return { r: img.data[i] ?? 0, g: img.data[i + 1] ?? 0, b: img.data[i + 2] ?? 0, a: img.data[i + 3] ?? 0 };
}
// bbox: skip a < 200; non-bg if any channel |c - bg| > 8; return {x0:minX/2, y0:minY/2, x1:maxX/2, y1:maxY/2}
```

## Runtime State Inventory
Not a rename/refactor phase. None — tooling and docs only. (`ios/` dir is a local gitignored prebuild artifact; untouched.)

## Environment Availability

| Dependency | Required By | Available | Version |
|------------|------------|-----------|---------|
| Node | scripts | yes | 25.0.0 local (engines/.nvmrc 22.23.2; both strip types by default) |
| sharp | validate-brand | yes | ^0.35.3 |
| tsc | typecheck | yes | 6.0.3 |

Tip: node 25 vs pinned 22.23.2 — `import.meta.dirname` and type stripping work on both (>= 22.18 default stripping). [ASSUMED for 22.23.2; not run locally under 22 — low risk, existing scripts already rely on it]

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest (jest-expo) 277 tests pass today; gate itself is the node script |
| Quick run | `npm run validate-brand` |
| Full suite | `npm run typecheck && npm run lint && npm test && npm run validate-brand` |

### Phase Requirements -> Proof Map
| Req | Behavior | Proof (D-13 negative run) | Automated |
|-----|----------|---------------------------|-----------|
| DEBT-02 | wrong pixel colour fails | Temporarily overwrite a PNG copy (e.g. recolour icon.png orange to `#208AEF` via sharp, or swap generator hex and `npm run generate-assets`) -> expect FAIL on pixel check, exit 1; `git checkout -- assets/images` -> PASS. Repeat for one transparent PNG (splash) | `npm run validate-brand` exit code |
| DEBT-03 | cwd independent | `cd /tmp && node <abs>/scripts/validate-brand.ts` and `cd scripts && npm run validate-brand` -> same N/N output as repo root (was 0/17 from /tmp) | diff outputs |
| DEBT-04 | crop drift fails | Edit `src/theme/lockup.ts` X0 176 -> 180 (>2) -> FAIL; restore -> PASS; (optionally 177.5 -> PASS) | validate-brand |
| DEBT-01 | note present | `grep -n "appVersionSource" CLAUDE.md .planning/codebase/STACK.md` | grep |
| DEBT-05 | corrections present | `grep -n "Correction (2026-10" <30-02> <35-06>`; `! grep -n "checked-in" store/screenshots/README.md` | grep |
| D-14 | no regressions | typecheck, lint, test green; `git status` clean of temp artifacts; app/index.tsx visual constants unchanged (same 4 values) | commands |

Sampling: per task `npm run validate-brand`; per wave full suite. Expected baseline after change: 21 old checks + new pixel checks + lockup checks (count will rise; record it).

### Wave 0 Gaps
None — no new test infrastructure (D-13: no new Jest tests required). Only config change: `allowImportingTsExtensions` in `tsconfig.json`.

## Security Domain

Tooling/docs only; no new network, auth, or input surface. ASVS V5 input validation: script reads only repo-local files; paths come from constants/app.json joined onto ROOT (avoid user-supplied path args). No secrets touched. No applicable controls beyond not committing temporary negative-run artifacts.

## Assumptions Log

| # | Claim | Risk if Wrong |
|---|-------|---------------|
| A1 | Metro bundles extension-less import of `src/theme/lockup.ts` without issue (not executed; follows existing tokens import pattern) | Low; catch with lint/typecheck or `expo export` smoke |
| A2 | Node 22.23.2 behaves like local Node 25.0.0 for type stripping + `import.meta.dirname` | Low; engines pin, existing scripts already rely on stripping |
| A3 | 35-06 headline (line 38) is the stale item the audit meant, since quoted string no longer exists | Low; planner re-greps |

## Open Questions (RESOLVED)
1. Whether to also fix STACK.md line ~107 ("No `eas.json` found") while adding the buildNumber note — recommend yes (cheap, same file).
   RESOLVED: yes, done in 39-02 Task 1.
2. Whether `generate-brand-assets.ts` cwd-relative paths should get the same ROOT fix — out of DEBT scope; optional.
   RESOLVED: no, out of DEBT scope; the generator's path resolution stays unchanged (39-01 Task 1 only switches it to the shared colour constants).

## Sources
- Repo experiments (this session): node scripts/zzexp.ts, tsc, expo lint, jest, sharp raw scans — HIGH
- `scripts/validate-brand.ts`, `scripts/generate-brand-assets.ts`, `app/index.tsx`, `src/config/api.ts`, `tsconfig.json`, `eas.json`, `app.json` — HIGH
- `30-VERIFICATION.md`, `30-UAT.md`, `v1.0-MILESTONE-AUDIT.md` — HIGH

**Research date:** 2026-10-14 | **Valid until:** until lockup SVG/brand assets change
