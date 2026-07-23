# Phase 22: Icon & Splash Asset Pipeline - Pattern Map

**Mapped:** 2026-07-23
**Files analyzed:** 6 (1 new script, 2 config edits, 2 regenerated binary assets, 1 directory deletion)
**Analogs found:** 0 exact / 6 total — this phase has no in-repo precedent for its primary new file (confirmed by direct search, see Metadata)

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|--------------------|------|-----------|-----------------|----------------|
| `scripts/generate-brand-assets.ts` | utility (build-time script, not app runtime) | file-I/O (read SVG string → write PNG binaries) | *(none in `src/`/`app/`)* — nearest stylistic analog is `src/dataset/remote.ts` (module-level constants + fail-loud validation + typed error) | no-analog (see below) |
| `package.json` | config | batch (dependency manifest edit) | itself (existing file, additive edit only) | n/a — direct edit, no analog needed |
| `app.json` | config | batch (declarative config edit) | itself (existing file, additive/subtractive edit only) | n/a — direct edit, no analog needed |
| `assets/images/icon.png` | — (generated binary asset, not source code) | file-I/O (script output) | `assets/images/icon.png` (current file being replaced) | n/a — binary output, not a code pattern |
| `assets/images/splash-icon.png` | — (generated binary asset, not source code) | file-I/O (script output) | `assets/images/splash-icon.png` (current file being replaced) | n/a — binary output, not a code pattern |
| `assets/expo.icon/` (deletion) | — (asset bundle removal) | n/a | n/a | n/a — deletion, no pattern needed |

**Confirmed by direct search:** no `scripts/` directory exists in this repo (`ls scripts` → "No such file or directory"), and no `.ts`/`.js` one-off script exists anywhere outside `src/`, `app/`, `__tests__/` (only `expo-env.d.ts`, an Expo-generated type-declarations file, matched a top-level `*.ts` glob — not a script). This is genuinely the first build-time script in this project. Do not force a false analog onto it; instead follow this repo's general TypeScript conventions (below) rather than any specific existing file's structure.

## Pattern Assignments

### `scripts/generate-brand-assets.ts` (utility, file-I/O)

**No direct analog exists.** Apply general project conventions (from `CONVENTIONS.md` and the closest-in-spirit existing modules) rather than copying one file's structure:

**Naming/constants convention** — follow `src/dataset/remote.ts` / `src/feedback/submit.ts` style for module-level constants:
```typescript
// src/dataset/remote.ts (pattern to mirror)
const CONTENT_ENDPOINT = "https://portuguese-verb-api.onrender.com/content/verbs";
const TIMEOUT_MS = 90_000;
```
Apply the same `SCREAMING_SNAKE_CASE` convention for the script's own fixed values, e.g.:
```typescript
const SOURCE_SVG_PATH = "assets/brand/lafa-logo-v2.svg";
const ICON_OUTPUT_PATH = "assets/images/icon.png";
const SPLASH_OUTPUT_PATH = "assets/images/splash-icon.png";
const ICON_BACKGROUND = "#FCE4DA";
const ICON_SIZE_PX = 1024;
const SPLASH_WIDTH_PX = 228; // 76pt imageWidth (app.json) x 3, matches existing asset convention
```

**Fail-loud validation pattern** — mirror `src/dataset/remote.ts`'s explicit-check-then-throw style (this repo's convention is to throw a descriptive `Error`, not silently continue, when an assumed invariant about external/input data doesn't hold):
```typescript
// src/dataset/remote.ts pattern (paraphrased structure — explicit check, thrown Error with descriptive message)
const parsed = VerbArraySchema.safeParse(json);
if (!parsed.success) {
  throw new Error(`Remote dataset validation failed: ${parsed.error.message}`);
}
```
Apply the same shape for the SVG group-extraction step (per RESEARCH.md Pattern 1):
```typescript
const groupStart = svgSource.indexOf('<g id="icon">');
const groupEnd = svgSource.indexOf("</g>", groupStart) + "</g>".length;
if (groupStart === -1 || groupEnd === -1) {
  throw new Error('Could not locate <g id="icon"> in source SVG — source may have changed shape');
}
```

**Import style** — this repo always uses named imports, `import type` for type-only imports, external packages first (see `CONVENTIONS.md` Import Organization). Apply to the script:
```typescript
import { readFileSync, writeFileSync, rmSync } from "node:fs";
import { Resvg } from "@resvg/resvg-js";
```

**Exports** — this repo uses only named exports, no default exports, anywhere in `src/`. Since this is a standalone script invoked directly (e.g. via `npx tsx scripts/generate-brand-assets.ts` or a new `npm run generate-assets` script), it does not need to export anything — but if any helper is factored out for testability, use a named `export function` per convention, not a default export.

**No-alpha / dimension self-check** — this repo has no prior "assert output shape" pattern to copy (no existing script does this), but `RESEARCH.md`'s Common Pitfalls Pitfall 1 recommends asserting `width === height === 1024` before writing the file, matching this repo's general "fail loud on violated invariant" convention seen above.

**Confirmed exact source structure** (read directly, `assets/brand/lafa-logo-v2.svg`, 37 lines):
- Line 7: `<g id="icon">` — exact string to search for (matches RESEARCH.md's assumed boundary exactly).
- Line 8: `<rect x="192" y="92" width="640" height="640" rx="176" fill="#FCE4DA"/>` — background rect defining the crop bbox (`192 92 640 640`).
- Lines 10-12: orange "a" glyph path, `fill="#E8663D"`.
- Lines 14-16: white circle-hole path, `fill="#FFFFFF"`.
- Lines 18-22: swoop stroke path, `stroke="#E8663D" stroke-width="30" stroke-linecap="round"`.
- Line 24: green accent dot, `<circle cx="667" cy="522" r="18" fill="#2FA84F"/>`.
- Line 25: `</g>` closes the icon group.
- Line 27: `<text ...>lafa</text>` starts immediately after (confirms `</g>` before `<text` is the correct extraction boundary, no ambiguity).

---

### `package.json` (config, batch)

**Analog:** itself — current `devDependencies` block (read directly above). Add two entries alphabetically-adjacent to existing devDependency ordering isn't strictly enforced (current list is roughly alphabetical: `@types/jest`, `@types/react`, `eas-cli`, `eslint`, `eslint-config-expo`, `jest-expo`, `typescript`) — insert `@resvg/resvg-js` after `@types/react`, before `eas-cli`, to preserve alphabetical convention:
```json
"devDependencies": {
  "@resvg/resvg-js": "^2.6.2",
  "@types/jest": "29.5.14",
  "@types/react": "~19.2.2",
  "eas-cli": "^21.1.0",
  ...
}
```
Also add a `scripts` entry consistent with existing style (`"lint": "expo lint"`, `"test": "jest"` — short, verb/tool-named keys):
```json
"scripts": {
  ...
  "generate-assets": "tsx scripts/generate-brand-assets.ts"
}
```
(Confirm whether `tsx`/`ts-node` is available or add it as an additional devDependency — not currently present in `package.json`; check before assuming.)

---

### `app.json` (config, batch)

**Analog:** itself — current file (read directly above, 41 lines). Two changes:
1. Remove the `"icon": "./assets/expo.icon"` line from the `ios` block (currently lines 12-16 area):
```json
"ios": {
  "icon": "./assets/expo.icon",   // <-- DELETE this line only
  "bundleIdentifier": "com.avram.aruh.lafa",
  "buildNumber": "1",
  "infoPlist": { "ITSAppUsesNonExemptEncryption": false }
}
```
2. Leave `expo.icon` (top-level, `"./assets/images/icon.png"`) and the `expo-splash-screen` plugin config (`backgroundColor: "#208AEF"`, `image: "./assets/images/splash-icon.png"`, `imageWidth: 76`) completely untouched — confirmed current values above, per D-05.

---

## Shared Patterns

### Fail-loud invariant checks (applies to the new script)
**Source:** `src/dataset/remote.ts`, `src/store/useQuizStore.ts` (`InsufficientVerbsError` thrown via `instanceof` check)
**Apply to:** `scripts/generate-brand-assets.ts` — any assumption about the SVG's shape (group boundary found, crop is square, output dimensions match expectation) should throw a descriptive `Error` rather than silently producing a wrong asset.

### Named exports / no default exports
**Source:** confirmed convention across all of `src/` (CONVENTIONS.md "Module Design" section — "always named exports... no default exports observed anywhere in `src/`")
**Apply to:** any helper functions factored out of the script, if the script is split into multiple functions for testability/readability.

### `SCREAMING_SNAKE_CASE` for fixed constants
**Source:** `src/quiz/engine.ts` (`QUESTIONS_PER_SESSION`, `DISTRACTOR_COUNT`), `src/dataset/remote.ts` (`CONTENT_ENDPOINT`, `TIMEOUT_MS`)
**Apply to:** all fixed path/dimension/color constants in the new script.

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `scripts/generate-brand-assets.ts` | utility (build-time) | file-I/O | First build-time/asset-generation script in this project; no `scripts/` directory exists yet, no prior one-off Node script anywhere in the repo (confirmed by direct filesystem search — only `expo-env.d.ts` matched a top-level `.ts` glob, and that is an Expo-generated type-declarations file, not a script). Planner should follow general project TypeScript conventions (CONVENTIONS.md) and RESEARCH.md's Architecture Patterns section (Pattern 1, Pattern 2 — concrete code already drafted there) rather than expect an in-repo analog. |
| `assets/images/icon.png`, `assets/images/splash-icon.png` | generated binary asset | file-I/O (script output) | Not source code — no code pattern applies; correctness is verified via `sips`/dimension checks per RESEARCH.md's Validation Architecture, not via code review. |

## Metadata

**Analog search scope:** entire repo root (`find . -maxdepth 2 -name "*.ts"` excluding `node_modules`/`src`/`app`/`__tests__`), `scripts/` directory existence check (`ls scripts`), `.gitignore` review, direct reads of `package.json`, `app.json`, and `assets/brand/lafa-logo-v2.svg`.
**Files scanned:** `package.json`, `app.json`, `assets/brand/lafa-logo-v2.svg` (full 37 lines), repo-root file listing, `.gitignore`.
**Pattern extraction date:** 2026-07-23
**Note for planner:** This phase's "patterns" are drawn primarily from RESEARCH.md's Architecture Patterns (Pattern 1: string-extraction crop, Pattern 2: monochrome recolor) since no in-repo code analog exists — treat RESEARCH.md's Code Examples section as the primary implementation reference, and this file's Shared Patterns section as the secondary layer of project-convention polish (naming, error handling, exports) to apply on top of it.
