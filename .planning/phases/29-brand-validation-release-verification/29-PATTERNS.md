# Phase 29: Brand Validation & Release Verification - Pattern Map

**Mapped:** 2026-08-15
**Files analyzed:** 3 (2 new files, 1 modified)
**Analogs found:** 3 / 3

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|--------------------|------|-----------|-----------------|----------------|
| `scripts/validate-brand.ts` | utility (script) | batch (file-I/O + pass/fail summary) | `scripts/preflight.ts` (pass/fail/exit-code shape) + `scripts/generate-brand-assets.ts` (module-level constants, sharp usage, no-CLI-framework style) | exact (composite of two strong analogs) |
| `package.json` (`scripts` block) | config | n/a | same file, `generate-assets`/`preflight` entries | exact |
| `.planning/phases/29-brand-validation-release-verification/HUMAN-UAT.md` | test (manual checklist doc) | request-response (human-in-the-loop verification) | `.planning/phases/28-ui-token-application/HUMAN-UAT.md` | exact |

## Pattern Assignments

### `scripts/validate-brand.ts` (utility script, batch/file-I/O)

**Primary analog for control flow / exit-code / summary output:** `scripts/preflight.ts` (full file, 103 lines, read above)

**Secondary analog for script scaffolding / sharp usage / constants style:** `scripts/generate-brand-assets.ts` (full file, 188 lines, read above)

**Imports pattern** (mirror `generate-brand-assets.ts` lines 1-4 — plain node/tsx script, no CLI framework):
```typescript
import { readFileSync } from "node:fs";

import sharp from "sharp";
```
No `Resvg` import needed (validator only reads PNG metadata + text config files, does not render SVG). Use `node:fs` `readFileSync` to load `app.json` as text/JSON for the config checks, exactly as `generate-brand-assets.ts` does for the source SVG (line 134: `readFileSync(SOURCE_SVG_PATH, "utf-8")`).

**Module-level constants pattern** (mirror `generate-brand-assets.ts` lines 6-23 — `const NAME = value;` grouped by concern, output paths first, dimensions/ratios second, forbidden/expected literals last):
```typescript
const APP_JSON_PATH = "app.json";

const ICON_PATH = "assets/images/icon.png";
const FAVICON_PATH = "assets/images/favicon.png";
const SPLASH_PATH = "assets/images/splash-icon.png";
const ANDROID_FOREGROUND_PATH = "assets/images/android-icon-foreground.png";
const ANDROID_MONOCHROME_PATH = "assets/images/android-icon-monochrome.png";

// Independent literals per D-03 — do NOT import from generate-brand-assets.ts.
const CANVAS_PX = 1024;
const SPLASH_WIDTH_PX = 1024;
const FAVICON_PX = 48;
const SAFE_ZONE_RATIO = 0.66;
const SAFE_ZONE_PX = Math.round(CANVAS_PX * SAFE_ZONE_RATIO); // 676

// Forbidden old Expo-blue values (D-03) — validator asserts these are absent,
// independent of whatever generate-brand-assets.ts currently uses.
const FORBIDDEN_SPLASH_BG_HEX = "#E6F4FE";
const FORBIDDEN_ADAPTIVE_BG_HEX = "#E6F4FE";
const FORBIDDEN_ICON_TINT_HEX = "#208AEF";
```
Note: confirm exact forbidden-value-to-field mapping against `app.json`'s actual splash/adaptiveIcon/androidStatusBar keys before finalizing (D-03 names `#208AEF`/`#E6F4FE` as "the forbidden old hex values" without specifying which config key each applied to — the planner/implementer should re-derive this from Phase 27's `27-CONTEXT.md`/`27-VERIFICATION.md`, listed as a canonical ref).

**Confirmed current `app.json` values to assert-against-for-correctness** (from `app.json`, read directly):
```
adaptiveIcon.backgroundColor  = "#FFF9F6"
splash.backgroundColor        = "#FFF9F6" (via expo-splash-screen plugin config)
adaptiveIcon.foregroundImage  = "./assets/images/android-icon-foreground.png"
adaptiveIcon.monochromeImage  = "./assets/images/android-icon-monochrome.png"
splash.image                  = "./assets/images/splash-icon.png"
icon                          = "./assets/images/icon.png"
favicon (web)                 = "./assets/images/favicon.png"
```

**Core check-runner / pass-fail / exit-code pattern** (copy structure directly from `scripts/preflight.ts` lines 27-101):
```typescript
interface CheckResult {
  label: string;
  ok: boolean;
  actual: number | string;
  expected: number | string;
}

async function checkPngDimensions(
  label: string,
  path: string,
  expectedWidth: number,
  expectedHeight: number,
): Promise<CheckResult> {
  const metadata = await sharp(path).metadata();
  const actual = `${metadata.width}x${metadata.height}`;
  const expected = `${expectedWidth}x${expectedHeight}`;
  return { label, ok: actual === expected, actual, expected };
}

// ... one checkX() function per assertion (PNG dims, hasAlpha, app.json forbidden-hex
// absence, app.json expected-hex presence, asset path existence) — same shape as
// preflight.ts's checkHealth/checkContentVerbs/checkFeedback/checkProductFeedback.

async function main(): Promise<void> {
  const results = [
    await checkPngDimensions("icon.png", ICON_PATH, CANVAS_PX, CANVAS_PX),
    // ...remaining checks
  ];

  for (const result of results) {
    if (result.ok) {
      console.log(`PASS ${result.label} -> ${result.actual}`);
    } else {
      console.log(`FAIL ${result.label} -> expected ${result.expected} got ${result.actual}`);
    }
  }

  const failed = results.filter((r) => !r.ok);
  const passedCount = results.length - failed.length;
  console.log(`${passedCount}/${results.length} checks passed`);

  if (failed.length > 0) {
    process.exit(1);
  }
}

main();
```

**hasAlpha inspection pattern** (D-02 — use `sharp(path).metadata()`, not `sips`):
```typescript
const metadata = await sharp(ICON_PATH).metadata();
// metadata.width, metadata.height, metadata.hasAlpha
```
Reference: `generate-brand-assets.ts` lines 108, 157, 162-166 show `sharp()` already imported and used in this codebase (for generation, not yet inspection) — same import, same library, new usage per D-02.

**Error handling:** No try/catch-and-swallow needed — this is a CLI script, not app runtime code. Follow `preflight.ts`'s pattern: each `checkX()` function returns a `CheckResult` (never throws to the caller's loop), `main()` aggregates and does a single `process.exit(1)` at the end. Unlike `generate-brand-assets.ts` (which throws `Error` on unexpected source shape because it's a one-shot generation that must halt), `validate-brand.ts` should behave like `preflight.ts` — collect all results, print all, then exit non-zero if any failed, so a single run surfaces every failure at once rather than stopping at the first one.

**Script invocation style:** No shebang, no CLI arg parsing, run via `node scripts/validate-brand.ts` (see `package.json` script entry below) — same as both analogs.

---

### `package.json` `scripts` block (config)

**Analog:** same file, existing entries (`package.json` lines 43-54, read above)

**Current state:**
```json
"scripts": {
  "start": "expo start",
  "android": "expo start --android",
  "ios": "expo start --ios",
  "web": "expo start --web",
  "lint": "expo lint",
  "test": "jest",
  "typecheck": "tsc --noEmit",
  "eas": "eas",
  "generate-assets": "node scripts/generate-brand-assets.ts",
  "preflight": "node scripts/preflight.ts"
},
```

**Add, matching the `generate-assets`/`preflight` invocation style exactly (plain `node scripts/<file>.ts`, no ts-node/tsx wrapper, no flags):**
```json
"validate-brand": "node scripts/validate-brand.ts",
```
Insert as a new line after `"preflight"` (last script entry), before the closing `},`.

---

### `.planning/phases/29-brand-validation-release-verification/HUMAN-UAT.md` (manual checklist doc)

**Analog:** `.planning/phases/28-ui-token-application/HUMAN-UAT.md` (full file, 55 lines, read above)

**Structural pattern to replicate exactly:**
1. Title: `# Phase 29 — Human UAT`
2. Status line (initially unsigned, filled in on approval): `**Status: APPROVED by developer, [date].**` — leave as a placeholder/pending line until the developer actually signs off; do not pre-fill "APPROVED" during doc creation.
3. One `##` section per distinct verification concern pulled from VALID-03's criteria (per D-07/Claude's Discretion: cold-launch splash color, iOS icon design match, Android mask-preview check via D-06, cross-screen palette consistency across Setup/Quiz/Results/modals).
4. Each section: **What was built:** (1-2 sentence recap, reference the relevant phase e.g. "from Phase 25/27/28"), **How to verify:** (numbered steps, concrete — e.g. "Run `eas build --profile preview --platform ios`", "Install the build on-device via the QR code/link EAS CLI prints", "Cold-launch the app and observe the splash screen background color before the app UI mounts").
5. Final **Acceptance criteria:** bullet list (checklist-style, testable pass/fail statements).
6. Final **Resume signal:** line: `Type "approved" or describe which element behaved incorrectly.`

**Concrete excerpt to copy verbatim (structure only, content changes):**
```markdown
# Phase 29 — Human UAT

**Status: APPROVED by developer, [pending].**

Consolidated from `checkpoint:human-verify` tasks deferred during execution
(`workflow.human_verify_mode = end-of-phase`, the project default).

## [Verification concern] (from [source phase])

**What was built:** ...

**How to verify:**
1. ...
2. ...

**Acceptance criteria:**
- ...

**Resume signal:** Type "approved" or describe which element behaved
incorrectly.
```

**Content-specific notes for this phase (per D-04/D-05/D-06):**
- The EAS build step must specify `eas build --profile preview --platform ios` (D-04, D-05) — the checklist's first numbered step should be building/installing this exact profile/platform, not `production` and not Android.
- The Android adaptive-icon criterion is verified WITHOUT a device build (D-06) — its "How to verify" steps should reference an external mask-preview tool (Android Studio's Image Asset tool or an online adaptive-icon mask previewer) against `assets/images/android-icon-foreground.png`, not an EAS Android build.
- Cross-screen palette consistency should list the same screens Phase 28's checklist already exercised (Setup/Quiz/Results/both feedback modals) since Phase 28 already confirmed all screens resolve colors through `colors.*` tokens — this phase's check is the visual confirmation on a real release build, not a re-audit of the token wiring.

---

## Shared Patterns

### Script scaffolding (module-level constants + `async function main() { ... } main();`)
**Source:** `scripts/generate-brand-assets.ts` (whole file) and `scripts/preflight.ts` (whole file)
**Apply to:** `scripts/validate-brand.ts`
No CLI framework (no `commander`/`yargs`), no shebang line, constants declared as top-level `const` before any function, single `main()` async function called unconditionally at file end (`main();`, no `.catch()` wrapper in either existing script — matches project convention of letting an uncaught rejection surface naturally / non-zero exit).

### Pass/fail summary + exit code
**Source:** `scripts/preflight.ts` lines 78-101
**Apply to:** `scripts/validate-brand.ts`
`CheckResult { label, ok, actual, expected }` interface, one async check function per assertion returning that shape (never throwing), `console.log` a `PASS`/`FAIL` line per result, then a summary count line, then `process.exit(1)` iff any failed. This is the exact shape D-01 requires ("exit non-zero on any failed check so it's usable as a pre-flight gate").

### `package.json` script entry style
**Source:** `package.json` lines 52-53 (`generate-assets`, `preflight`)
**Apply to:** new `validate-brand` entry
Plain `"node scripts/<file>.ts"` invocation, kebab-case script name, no flags/env vars baked into the command.

## No Analog Found

None — all 3 files in scope have a strong existing analog in the codebase.

## Metadata

**Analog search scope:** `scripts/` (2 files), `package.json`, `.planning/phases/25-brand-asset-pipeline/`, `.planning/phases/28-ui-token-application/`, `app.json`, `eas.json`
**Files scanned:** 6 (`scripts/generate-brand-assets.ts`, `scripts/preflight.ts`, `package.json`, `app.json`, `eas.json`, `.planning/phases/28-ui-token-application/HUMAN-UAT.md`)
**Pattern extraction date:** 2026-08-15
</content>
