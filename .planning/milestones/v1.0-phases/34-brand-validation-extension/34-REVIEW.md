---
phase: 34-brand-validation-extension
reviewed: 2026-08-16T23:10:00Z
depth: standard
files_reviewed: 1
files_reviewed_list:
  - scripts/validate-brand.ts
findings:
  critical: 0
  warning: 2
  info: 4
  total: 6
status: issues_found
---

# Phase 34: Code Review Report

**Reviewed:** 2026-08-16T23:10:00Z
**Depth:** standard
**Files Reviewed:** 1
**Status:** issues_found

## Summary

`scripts/validate-brand.ts` is a brand-regression gate that asserts the generated
icon/splash/favicon/Android PNGs and the Phase 32 homepage lockup exist at their
expected dimensions, `icon.png` has no alpha channel, `app.json` carries the brand
background and none of the retired blue hexes, referenced assets exist, and the
generator uses only the canonical SVG source. The Phase 34 diff (adding the
`lafa-homepage-lockup.png` 3200x1040 check) is correct and minimal: it reuses the
existing `checkPngDimensions` helper, is grouped with the other dimension checks,
counts in the same 21-check summary, and `npm run validate-brand` exits 0 against
current on-disk output (verified — all 21 PASS). `npm run typecheck` also passes.

No BLOCKERs. The two WARNINGs are integrity/robustness gaps in the gate itself:
it cannot detect a pixel-regressed brand asset (fail-open), and all file paths are
cwd-relative (fail-closed footgun when run outside the repo root). The four INFOs
are output noise and edge-case matching weaknesses.

## Warnings

### WR-01: Gate is fail-open on pixel content — a wrong brand PNG passes every check

**File:** `scripts/validate-brand.ts:39-68, 169-179`
**Issue:** Every asset check asserts *shape* only: `checkPngDimensions` (lines
39-56) verifies width/height, `checkNoAlpha` (lines 58-68) verifies `icon.png` has
no alpha. `checkGeneratorSource` (lines 169-179) does not prove the committed PNGs
derive from the canonical mark — it only string-matches that
`scripts/generate-brand-assets.ts` *mentions* `assets/brand/lafa-icon.svg`. A stale
or wrongly-colored `icon.png` at 1024x1024 with no alpha channel (e.g. the retired
Expo-blue icon, or a mark regenerated in the wrong brand color) would pass all 21
checks. For a gate whose sole purpose is brand regression detection, this is a
fail-open integrity hole. (Verified: the current on-disk `icon.png` is genuinely the
brand — corner/center pixels are `#FFF9F6` and the center row contains the mark — so
the proposed check below would pass today.)
**Fix:** Add a pixel-content assertion, e.g. corner pixel must equal the brand
background and a center-row scan must find non-background mark pixels:

```ts
async function checkIconCornerPixel(path: string): Promise<CheckResult> {
  const label = "icon.png corner pixel is brand background";
  try {
    const { data, info } = await sharp(path).raw().toBuffer({ resolveWithObject: true });
    const ch = info.channels ?? 4;
    const idx = 2 * info.width * ch + 2 * ch; // sample pixel (2,2)
    const hex = `#${[data[idx], data[idx + 1], data[idx + 2]]
      .map((v) => v.toString(16).padStart(2, "0"))
      .join("")}`.toUpperCase();
    return { label, ok: hex === EXPECTED_BRAND_BG_HEX, actual: hex, expected: EXPECTED_BRAND_BG_HEX };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { label, ok: false, actual: `error: ${message}`, expected: EXPECTED_BRAND_BG_HEX };
  }
}
```

### WR-02: Every file path resolves against `process.cwd()` — running the gate from any other directory makes all 21 checks fail

**File:** `scripts/validate-brand.ts:5-30, 47, 61, 73, 88, 118, 143, 160, 172, 198`
**Issue:** All path constants (`ICON_PATH`, `FAVICON_PATH`, `APP_JSON_PATH`,
`GENERATOR_PATH`, …) are bare relative paths consumed by `readFileSync` (lines 73,
88, 118, 143, 172), `sharp(path)` (lines 47, 61), and `existsSync` (lines 160, 198)
with no `path.resolve`/`__dirname` anchoring. Running `node scripts/validate-brand.ts`
from any cwd other than the repo root (e.g. from inside `scripts/`, or a pre-commit
hook / CI wrapper that `chdir`s) yields 21/21 `error: ENOENT` FAILs. It is
fail-closed (exit 1), so it can't silently pass, but it is a footgun that turns a
useful gate into noise, and the per-check error strings don't hint at the cause.
**Fix:** Resolve paths against the script's own directory:

```ts
import path from "node:path";
const ROOT = path.resolve(__dirname, "..");
const APP_JSON_PATH = path.join(ROOT, "app.json");
const GENERATOR_PATH = path.join(ROOT, "scripts/generate-brand-assets.ts");
// …and same for every asset path constant.
```

## Info

### IN-01: `main()` is a floating promise with no `.catch()`

**File:** `scripts/validate-brand.ts:254`
**Issue:** `main();` is invoked without `.catch()`. Any error escaping a check's
internal try/catch becomes an unhandled promise rejection — Node 25 crashes with a
raw stack trace (exit 1) instead of printing the clean PASS/FAIL loop and summary.
Fail-closed, but the output becomes unparseable on unexpected failures.
**Fix:** `main().catch((err) => { console.error("FATAL", err); process.exit(1); });`

### IN-02: `MODULE_TYPELESS_PACKAGE_JSON` warning pollutes gate output on every run

**File:** `package.json` (no `"type": "module"`), `scripts/validate-brand.ts:1-3`
**Issue:** Because `package.json` has no `"type": "module"` field, Node re-parses
this ESM-syntax script and emits a "Reparsing as ES module" performance warning to
stderr on every run (observed above the PASS lines). Noise for any consumer that
parses the gate log. `scripts/preflight.ts` has the same issue.
**Fix:** Add `"type": "module"` to `package.json` (verify Expo/Metro config still
resolves before committing), or leave as-is and filter the warning in CI.

### IN-03: `checkGeneratorHasNoRetiredRefs` matches the generator half on basename substrings only

**File:** `scripts/validate-brand.ts:195-203`
**Issue:** The generator half uses `generatorText.includes(basename)` while the disk
half uses the full path `existsSync(assetPath)` — inconsistent matching. A future
legitimate asset whose filename embeds a retired basename (e.g.
`lafa-logo-v2-concept-notes.png` contains `lafa-logo-v2-concept.png`) would
false-FAIL; a retired asset re-referenced under a renamed basename would be missed.
Not triggered today (verified — all four PASS), but fragile.
**Fix:** Match the full path (without the leading `assets/`, or exact
`"assets/brand/" + basename`) in the generator text instead of the bare basename.

### IN-04: `checkForbiddenHexAbsent` is a case-insensitive substring search over raw text, scoped to `app.json` only

**File:** `scripts/validate-brand.ts:70-83`
**Issue:** (a) `text.toLowerCase()` + `text.includes(hex.toLowerCase())` can
false-positive if any value legitimately embeds a forbidden hex as a substring (e.g.
an 8-digit ARGB like `#208AEF80`); (b) scope covers only `app.json` — a retired blue
leaking into `src/theme/tokens.ts` or the generator would go unflagged (verified:
`tokens.ts` is currently clean, so no present-day impact). Fail-closed direction for
(a) only in realistic files.
**Fix:** Parse the JSON and check string values against an exact
`/^#([0-9a-f]{6})$/i` match, and/or extend the scan to `src/theme/tokens.ts` and
`scripts/generate-brand-assets.ts`.

---

_Reviewed: 2026-08-16T23:10:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
