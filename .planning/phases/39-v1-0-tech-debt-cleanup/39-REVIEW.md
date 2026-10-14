---
phase: 39-v1-0-tech-debt-cleanup
reviewed: 2026-10-14T00:00:00Z
depth: standard
files_reviewed: 8
files_reviewed_list:
  - CLAUDE.md
  - app/index.tsx
  - scripts/brand-colors.ts
  - scripts/generate-brand-assets.ts
  - scripts/validate-brand.ts
  - src/theme/lockup.ts
  - store/screenshots/README.md
  - tsconfig.json
findings:
  critical: 0
  warning: 4
  info: 4
  total: 8
status: issues_found
---

# Phase 39: Code Review Report

**Reviewed:** 2026-10-14
**Depth:** standard
**Files Reviewed:** 8
**Status:** issues_found

## Narrative Findings (AI reviewer)

## Summary

I reviewed the diff from `a51c1f5` to HEAD. It does four things: moves the lockup crop constants into `src/theme/lockup.ts`, adds `scripts/brand-colors.ts`, hardens `validate-brand.ts` (root-anchored paths, pixel checks, a lockup bounding-box re-measure) and updates the docs.

What I checked:
- `npx tsc --noEmit` passes.
- `expo lint` on the changed files reports nothing.
- `node scripts/validate-brand.ts` passes 37/37, both from the repo root and from `/tmp`.
- The constants that moved out of `app/index.tsx` are byte-identical.

I found no blockers. The main problems:
- The "single source" claim for brand colours is not true. `src/theme/tokens.ts` still has its own copies, and nothing checks them.
- The validator now resolves paths from the repo root, but the generator still uses the current directory. The two can end up looking at different files.
- The screenshot README tells people to rely on `expo run:ios`. That command does not regenerate a native `ios/` folder that already exists, and one exists on this machine.
- `CLAUDE.md` gained a new paragraph about build numbers but still contains a false statement about `expo.slug` right next to it.

## Warnings

### WR-01: `brand-colors.ts` is called the "single source" for colours, but `tokens.ts` has its own unchecked copies

**File:** `scripts/brand-colors.ts:1-7`, `src/theme/tokens.ts:2,4,10`
**Issue:** The header says this module is the "Single source for brand colours". But `src/theme/tokens.ts` still hardcodes `primary: "#F2643E"`, `pressed: "#C94A2D"` and `background: "#FFF9F6"` on its own. The validator checks `app.json` and the generated PNGs against `brand-colors.ts`, but never checks `tokens.ts`.

The lockup PNG paints its own background in `#FFF9F6`, and the crop logic in `app/index.tsx` depends on that matching the app background (`colors.background`). If someone changes `tokens.ts` (the file the app actually uses) without changing `brand-colors.ts`, a visible box appears around the lockup and every gate still passes. The duplication still exists; it is now just hidden behind a comment that says it doesn't.
**Fix:** Pick one of these:
- Add a gate to `validate-brand.ts`. `tokens.ts` imports nothing, so it can be imported with a `.ts` extension just like `lockup.ts`:
```ts
import { colors } from "../src/theme/tokens.ts";
// ...
{ label: "tokens.background matches brand bg", ok: colors.background === ICON_BACKGROUND_HEX, actual: colors.background, expected: ICON_BACKGROUND_HEX },
{ label: "tokens.primary matches brand orange", ok: colors.primary === ORANGE_FILL_HEX, actual: colors.primary, expected: ORANGE_FILL_HEX },
{ label: "tokens.pressed matches brand depth", ok: colors.pressed === DEPTH_FILL_HEX, actual: colors.pressed, expected: DEPTH_FILL_HEX },
```
- Or move `brand-colors.ts` into `src/theme/` and have `tokens.ts` reference it.

At minimum, reword the header so it doesn't claim to be the single source.

### WR-02: The generator still uses paths relative to the current directory, while the validator now uses the repo root

**File:** `scripts/generate-brand-assets.ts:9-16, 260, 297-339` vs `scripts/validate-brand.ts:9-10`
**Issue:** This phase anchored every path in `validate-brand.ts` to the repo root (`resolve(import.meta.dirname, "..")`). `generate-brand-assets.ts` still reads and writes bare relative paths (`readFileSync(SOURCE_SVG_PATH)`, `writeFileSync(ICON_OUTPUT_PATH, ...)`).

If you run the generator from any other directory, it either crashes with ENOENT, or writes into a matching `assets/` tree under that directory. In the second case the validator, which always reads the root `assets/images`, keeps passing against the old checked-in files. The validator passing would then say nothing about what the generator just produced.
**Fix:** Use the same anchoring in the generator:
```ts
import { resolve } from "node:path";
const ROOT = resolve(import.meta.dirname, "..");
const abs = (rel: string): string => resolve(ROOT, rel);
// readFileSync(abs(SOURCE_SVG_PATH), "utf-8"); writeFileSync(abs(ICON_OUTPUT_PATH), iconPng); ...
```
Better still, move `ROOT`/`abs` into a small shared module that imports nothing, next to `brand-colors.ts`.

### WR-03: Screenshot instructions can photograph an old native build; `validate-brand` does not check the native project

**File:** `store/screenshots/README.md:27-33, 35-42`
**Issue:** The new text says `npx expo prebuild` is run "automatically on a fresh checkout" by `npx expo run:ios`. That is only true when `ios/` is missing. When `ios/` already exists, `run:ios` builds it as-is and does not re-sync icons, splash or `app.json` changes. On this machine `ios/` already exists, last modified Aug 17, before this phase's brand work.

The "Pre-capture gate" (`npm run validate-brand`) only checks `assets/images/*` and `app.json`, never the native project. So the gate can pass while the app being photographed shows an old icon or splash. That defeats the README's stated goal "so the shipped branding is what gets photographed".
**Fix:** Make the build step regenerate the native project every time:
```bash
npx expo prebuild --clean --platform ios
npx expo run:ios --device "iPhone 16 Pro Max"
```
Also add a sentence saying `validate-brand` checks the source assets, not the native project.

### WR-04: `CLAUDE.md` gained a new paragraph, but the false `expo.slug` statement next to it was left in place

**File:** `CLAUDE.md:5-11` (the new paragraph is at lines 13-17)
**Issue:** This phase adds a "deliberate, not drift — do not fix" note directly after a paragraph that says "`app.json`'s `expo.slug` and `expo.scheme` were changed to `lafa`". In fact `app.json` has `"slug": "portuguese-verb-mobile"`; commit `cab654b` (24-03) reverted it because `lafa` broke `eas build`.

An agent that trusts this paragraph could "fix" the slug back to `lafa` and break EAS builds again. That is the same kind of mistake the new buildNumber note exists to prevent. The "Project" section also still says the in-app name is "Portuguese Verb Quiz until Phase 11", but `app.json` already uses `"name": "Lafa"`.
**Fix:** Change the paragraph to say: `expo.scheme` is `lafa`, `expo.slug` stays `portuguese-verb-mobile` (reverted in Phase 24-03 because `lafa` broke `eas build`), and do not change it. Delete the stale "Portuguese Verb Quiz until Phase 11" sentence.

## Info

### IN-01: The lockup source size (1600x520) is still hardcoded in `app/index.tsx`

**File:** `app/index.tsx:27-28`
**Issue:** `LOCKUP_FULL_WIDTH = 1600 * LOCKUP_SCALE` and `LOCKUP_FULL_HEIGHT = 520 * LOCKUP_SCALE` hardcode the source canvas size. The crop constants now live in `lockup.ts`, and the size is also repeated in `validate-brand.ts:24-25` (3200/1040, with only a "mirrors" comment) and in the generator.
**Fix:** Export `LOCKUP_SOURCE_WIDTH = 1600` and `LOCKUP_SOURCE_HEIGHT = 520` from `src/theme/lockup.ts`. Use them in `app/index.tsx`, and derive the validator's 2x numbers from them.

### IN-02: `lockup.ts` mentions two different colour tolerances

**File:** `src/theme/lockup.ts:12, 18`; `scripts/validate-brand.ts:27, 293-295`
**Issue:** The constants were measured with a tolerance of 6 per channel, but the gate re-measures with `PIXEL_TOLERANCE = 8`. The pixel checks and the bounding-box scan share that one tolerance. It passes today, but a reader can't easily tell which tolerance is authoritative.
**Fix:** Add a separate `LOCKUP_BBOX_TOLERANCE = 6` that matches the original measurement, or update the comment to say 8.

### IN-03: `main()` is called without handling a rejection

**File:** `scripts/validate-brand.ts:407`
**Issue:** Each check catches its own errors. But anything thrown outside those try blocks becomes an unhandled rejection with a raw stack trace instead of the PASS/FAIL report. Node 22 still exits non-zero, so the gate still fails, but the output is inconsistent.
**Fix:** `main().catch((e) => { console.error("FAIL validator crashed:", e); process.exit(1); });`

### IN-04: `hexToRgb` silently accepts malformed input

**File:** `scripts/validate-brand.ts:217-220`
**Issue:** A 3-digit hex (`#FFF`) or any other malformed constant parses to the wrong colour (or NaN channels) instead of failing loudly. That would make every pixel comparison fail with a confusing message.
**Fix:** `if (!/^#[0-9a-fA-F]{6}$/.test(hex)) throw new Error(\`bad hex ${hex}\`);`

---

_Reviewed: 2026-10-14_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
