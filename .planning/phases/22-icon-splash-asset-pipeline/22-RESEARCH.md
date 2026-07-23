# Phase 22: Icon & Splash Asset Pipeline - Research

**Researched:** 2026-07-23
**Domain:** Node.js SVG rasterization / Expo icon & splash asset configuration
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Crop only the SVG's `id="icon"` group (rounded-square mark +
  orange "a" glyph + white circle + swoop + green dot) — drop the
  `<text>` "lafa" wordmark entirely.
- **D-02:** Bleed the mark edge-to-edge across the full 1024x1024 canvas
  rather than keeping the SVG's current inset-on-white composition.
  Rationale: iOS/App Store already applies its own corner mask + shadow
  to app icons, so baking in a second rounded-square + white margin reads
  as an icon-within-an-icon on the home screen. Scale up so the
  rounded-square background fills the canvas; corner rounding gets
  clipped/replaced by the OS mask, not baked into the PNG.
- **D-03:** Background fill for the bled icon is the SVG's existing light
  peach (`#FCE4DA`), not solid brand orange (`#E8663D`) — matches the
  mark's current background color exactly, no recoloring of the "a"
  glyph needed.
- Output must remain 1024x1024, no alpha channel (flatten to the peach
  background), generated from `assets/brand/lafa-logo-v2.svg` — never
  hand-edited pixel-by-pixel.
- **D-04:** Replace `splash-icon.png` with a Lafa-branded mark — do not
  leave the current default Expo template glyph (a white "A"/triangle
  shape) in place. This is a deliberate answer to ICON-03's conditional:
  visual QA already shows it's a placeholder, not an intentional design.
- **D-05:** Splash background stays unchanged (`#208AEF` blue, set via
  the `expo-splash-screen` plugin config in `app.json` — do not touch
  that config).
- **D-06:** Recolor the mark for splash to solid white monochrome — take
  just the "a" glyph paths from the SVG's `icon` group (drop the peach
  square background, since splash has its own blue background) and
  render them in white. Do not use the original orange/peach/green
  brand colors here — they read poorly against the blue background.
- **D-07:** Delete `assets/expo.icon/` entirely and remove `ios.icon`
  from `app.json` `ios` block. No regeneration of the Icon Composer
  bundle attempted — the flat PNG (`expo.icon` config key at the app
  root, pointing to `assets/images/icon.png`) becomes the sole iOS icon
  source. This confirms the prior decision already logged in
  `.planning/PROJECT.md`'s Key Decisions table — not reopened.
- **D-08:** No SVG rendering tool exists on this dev machine (checked:
  no `rsvg-convert`, `inkscape`, `imagemagick`/`magick`/`convert`,
  `cairosvg`). Add a one-off devDependency (e.g. `sharp` + `resvg-js`,
  or an equivalent Node SVG rasterizer) and a small script that renders
  the icon/splash PNG variants from the SVG at exact required
  dimensions/colors, rather than asking the user to manually export
  files.
- **D-09:** Keep the rasterizer devDependency and script in the repo
  after this phase completes (do not uninstall/delete after use) — it's
  reusable if the brand mark changes again in a future rebrand.

### Claude's Discretion
- Exact library choice between `sharp`/`@resvg/resvg-js`/equivalent — see
  Standard Stack below for the researched recommendation (`@resvg/resvg-js`).
- Exact technique for isolating/recoloring the SVG subgroup (string
  extraction vs. DOM parsing) — see Architecture Patterns below.
- Exact splash asset pixel resolution (source PNG size relative to the
  configured `imageWidth`) — see Common Pitfalls, Pitfall 2.
- Whether the green accent dot renders (as white) or is dropped in the
  splash variant — flagged as Assumption A2 / Open Question 2, needs
  visual QA confirmation during execution, not a research-time call.

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope. No scope-creep items came up.
Also explicitly out of scope per REQUIREMENTS.md: regenerating
`assets/expo.icon/` via macOS-only Icon Composer tooling (operator chose
the simpler flat-PNG-only path, D-07).
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|--------------|---------------------|
| ICON-01 | 1024x1024, alpha-free app icon generated from `assets/brand/lafa-logo-v2.svg` (orange mark only, not the full wordmark), replacing `assets/images/icon.png` | Standard Stack (`@resvg/resvg-js` + `fitTo`/`background`), Architecture Patterns (Pattern 1: group extraction + crop), Code Examples, Validation Architecture (`sips` dimension/alpha check) |
| ICON-02 | `ios.icon` Icon Composer bundle (`assets/expo.icon/`) and its `app.json` key removed, so the flat `expo.icon` PNG governs the iOS app icon | Architecture Patterns (System Architecture Diagram), State of the Art (Expo `icon`/`ios.icon` priority), Common Pitfalls (Pitfall 3: stale local `ios/` dir), Environment Availability (confirmed no other references exist) |
| ICON-03 | `splash-icon.png` updated to a Lafa-branded mark if visual QA requires it, existing blue splash background preserved otherwise | Architecture Patterns (Pattern 2: monochrome splash variant), Common Pitfalls (Pitfall 2: `imageWidth` points-vs-pixels), Assumptions Log (A1, A2), Validation Architecture |
| ICON-04 | Original brand source files in `assets/brand` preserved unmodified (not overwritten by the icon-generation pipeline) | Anti-Patterns to Avoid (never write back to `assets/brand/`), Code Examples (`git diff`/`shasum` verification), Open Questions (1: SVG not yet committed to git) |
</phase_requirements>

## Summary

This phase is a self-contained asset-generation problem, not an app-code problem: write a
small, kept-in-repo Node script that rasterizes two PNGs from
`assets/brand/lafa-logo-v2.svg`, delete the unused Icon Composer bundle, and leave the
`expo-splash-screen` plugin config untouched. The two credible Node SVG-to-PNG libraries are
`sharp` (general raster/image toolkit, uses `librsvg` under the hood for SVG input) and
`@resvg/resvg-js` (Rust `resvg`-powered, purpose-built for SVG, ships prebuilt native binaries
for macOS arm64/x64 — no `node-gyp`/postinstall build step). Both install cleanly on this
machine with no native toolchain pain; `@resvg/resvg-js` is the better fit here because it
natively supports `fitTo` (target pixel dimensions), a `background` fill (solves the
alpha-free requirement in one step), and takes a raw SVG string as input — which is exactly
what's needed since the isolation of the `id="icon"` group and the splash monochrome variant
are both easiest to do as *string-level SVG document construction* (build a small, minimal SVG
document containing only the desired subset, adjusting `viewBox`) rather than any DOM/bbox
manipulation API. `sharp` can still be used afterward for final PNG flattening/verification if
desired, but is not required — resvg's own `background` option already flattens alpha.

The existing `assets/brand/lafa-logo-v2.svg` is small, hand-authored, and stable (6 top-level
shapes inside `id="icon"`, plus a sibling `<text>` wordmark) — this makes template-string
extraction of the `icon` group safe and simple; a general-purpose SVG parser/DOM library is not
needed for a one-off, kept script operating on a single known-shape source file.

**Primary recommendation:** Use `@resvg/resvg-js` (`^2.6.2`) to render two independently-built
minimal SVG documents (see Code Examples) — one for the icon (full `icon` group, cropped
viewBox, peach background, alpha-flattened via resvg's `background` option, 1024×1024) and one
for splash (only the glyph paths, background rect stripped, all fills/strokes overridden to
`#FFFFFF`, rendered on a **transparent** background at ~3x the configured `imageWidth`).

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| SVG-to-PNG rasterization | Build tooling (Node script, dev-only) | — | One-off, not part of the running app; runs at author-time, output is checked-in binary assets |
| iOS app icon delivery | Expo config (`app.json` `expo.icon`) | — | Expo/EAS reads the flat PNG at build/prebuild time; no app-runtime code involved |
| Splash screen rendering | Expo config plugin (`expo-splash-screen`) + native splash resources it generates | — | Plugin composites the PNG over its configured background color during prebuild; app code never touches splash assets directly |
| Brand source-of-truth | `assets/brand/` (design asset, not build input to Metro) | — | Only the generation script reads it; app bundle never imports the SVG directly |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@resvg/resvg-js` | `^2.6.2` (npm-verified current, `2.7.0-alpha.*` also exists — stay on stable `2.6.2`) | SVG string → PNG buffer rasterization with exact pixel `fitTo`, `background` fill, crop-to-bbox support | Rust `resvg`-powered, purpose-built for headless SVG rasterization; ships prebuilt native `.node` binaries for macOS arm64/x64 (and other platforms) — no `node-gyp`, no postinstall compile step [VERIFIED: npm registry, confirmed via `npm view`] |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `sharp` | `^0.35.3` (npm-verified current; requires Node `>=20.9.0`, this project runs Node 25 — compatible) | General raster image toolkit — optional secondary pass for format/metadata verification (e.g. reading final PNG's alpha-channel/dimensions programmatically in the script itself, as a self-check) | Only if the generation script wants to assert its own output (dimensions, no-alpha) in Node rather than shelling out to `sips`/`file` afterward. Not required for the core render step — `@resvg/resvg-js` alone can do the render + flatten. |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `@resvg/resvg-js` | `sharp` alone (sharp can rasterize SVG via bundled `librsvg`) | `sharp`'s SVG rendering goes through `librsvg`, which has historically had inconsistent support for some SVG features (filters, certain gradient/text edge cases) compared to `resvg`; also sharp's SVG input doesn't expose a first-class `background`-fill-on-render option as directly as resvg's `background` opt — you'd composite/flatten as a second sharp operation. Either works for this SVG (no exotic features used), but resvg is the more purpose-fit, single-step tool. |
| `@resvg/resvg-js` | `svg2img` | Wraps `canvg` + `node-canvas`; `node-canvas` requires native Cairo bindings and is a known source of macOS build friction (Homebrew `cairo`/`pango`/`pixman` deps) — exactly the native-build pain this phase is trying to avoid. Rejected per D-08's implicit goal of a clean install. |
| `@resvg/resvg-js` | `puppeteer`/headless Chrome screenshot of an HTML page embedding the SVG | Massive dependency (full Chromium download) for a one-shot 2-image render; against the spirit of "keep it lightweight and reusable" (D-09). Rejected — disproportionate weight. |
| String-level SVG group extraction | Full DOM SVG parser (e.g. `svgson`, `xmldom` + manual traversal) | The source SVG is small, static, and hand-authored (6 shapes, one group) — a general parser adds a dependency for a problem solvable with a handful of known string boundaries (`<g id="icon">...</g>`, ends at the matching `</g>` before `<text`). A parser becomes worth it only if the SVG structure changes shape/nesting significantly later; not needed now. |

**Installation:**
```bash
npm install --save-dev @resvg/resvg-js
```
(`sharp` optional — install only if the script also wants to self-verify output. If used only for verification, add as `--save-dev` too, matching D-09's "small tooling, kept in repo" framing.)

**Version verification:** Confirmed via `npm view <pkg> version` on 2026-07-23 (registry-checked, this session): `@resvg/resvg-js@2.6.2` (also `2.7.0-alpha.*` prereleases exist — do not use), `sharp@0.35.3`. Both are the current stable published versions as of this research date.

## Package Legitimacy Audit

| Package | Registry | Age | Downloads | Source Repo | slopcheck | Disposition |
|---------|----------|-----|-----------|--------------|-----------|-------------|
| `@resvg/resvg-js` | npm | actively maintained, latest publish 2026-01-28 (`time.modified`) | high (widely used SVG-to-PNG tool in the Node ecosystem) | `github.com/thx/resvg-js` (yisibl/resvg-js fork, actively maintained) | [OK] | Approved |
| `sharp` | npm | 6+ years, latest publish 2026-07-01 | very high (one of the most-downloaded Node image libraries) | `github.com/lovell/sharp` | [OK] | Approved |

Both packages ran through `slopcheck install <pkg>` in this session and returned `[OK]` for
both. No postinstall script risk found — `npm view <pkg> scripts.postinstall` returned empty
for both packages (no postinstall script at all; `@resvg/resvg-js` ships prebuilt binaries
selected via npm's `optionalDependencies` platform-package mechanism, not a compile step).

**Packages removed due to slopcheck [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

**Process note (transparency):** Running `slopcheck install <pkg1> <pkg2>` in this environment
actually executes `npm install` as a side effect (it is not a dry-run/audit-only command in
this installed version) — it modified this repo's `package.json`/`package-lock.json` and
installed both packages into `node_modules` during verification. This was detected and fully
reverted (`git checkout -- package.json package-lock.json` + `npm uninstall`) before finishing
research, so the working tree is unmodified by this research session. **Flag for the planner:**
when a task actually runs `slopcheck install` (if ever reused as a gate) or otherwise verifies a
package pre-install, confirm with a `git status` check afterward — the command installs for
real, it does not just report.

## Architecture Patterns

### System Architecture Diagram

```
assets/brand/lafa-logo-v2.svg  (read-only input, byte-for-byte untouched)
        │
        ▼
scripts/generate-brand-assets.(ts|js)   <-- new, kept-in-repo script (D-09)
        │
        ├─ extract "icon" group substring  ──▶ build minimal icon SVG doc
        │    (crop viewBox to group bbox: x=192 y=92 w=640 h=640, keep all fills)
        │         │
        │         ▼
        │    Resvg({ fitTo: {mode:"width", value:1024}, background:"#FCE4DA" })
        │         │
        │         ▼
        │    assets/images/icon.png   (1024x1024, alpha-free, peach bg)
        │
        └─ extract glyph-only paths (drop background rect, drop peach)
             (override fill/stroke → "#FFFFFF" on glyph paths)
                  │
                  ▼
             Resvg({ fitTo: {mode:"width", value:228}, background: "rgba(0,0,0,0)" })
                  │
                  ▼
             assets/images/splash-icon.png  (transparent bg, white glyph, ~228px wide)

app.json
  expo.icon → assets/images/icon.png            (unchanged path, new content)
  expo.ios.icon → DELETED (was "./assets/expo.icon")
  expo.plugins["expo-splash-screen"] → unchanged (backgroundColor #208AEF, imageWidth 76)

assets/expo.icon/  → DELETED entirely (Icon Composer bundle, unused after ios.icon removal)
```

### Recommended Project Structure
```
scripts/
└── generate-brand-assets.ts   # new: reads assets/brand/lafa-logo-v2.svg, writes both PNGs
assets/
├── brand/
│   └── lafa-logo-v2.svg        # untouched (ICON-04) — read-only input
└── images/
    ├── icon.png                 # regenerated (ICON-01)
    └── splash-icon.png          # regenerated (ICON-03)
```
No new `src/` or `app/` files — this phase touches only `assets/`, a new `scripts/` file, and
`app.json`. `scripts/` does not currently exist in this repo; creating it is a new top-level
folder, matches common Expo-project convention for one-off dev tooling (distinguish from
`src/` which is app runtime code only, per CONVENTIONS.md's existing domain-folder pattern).

### Pattern 1: Isolate + crop an SVG subgroup by string extraction, not DOM parsing
**What:** Since the source SVG (`assets/brand/lafa-logo-v2.svg`) is a small, static, hand-authored
document, extract the `<g id="icon">...</g>` block by string slicing (`indexOf('<g id="icon"')`
… matching close tag before `<text`), then wrap it in a fresh, minimal `<svg>` root with a
`viewBox` set to the group's known bounding box (`"192 92 640 640"` per the `<rect x="192"
y="92" width="640" height="640" .../>` background rect that defines the group's visual extent).
**When to use:** Any time the input SVG is small/stable/known-shape and a full parser is
overkill. Re-validate the extraction boundary (rect coordinates) if the source SVG is ever
regenerated by a design tool with different coordinates.
**Example:**
```typescript
// scripts/generate-brand-assets.ts
import { readFileSync, writeFileSync, rmSync, existsSync } from "node:fs";
import { Resvg } from "@resvg/resvg-js";

const SOURCE_SVG_PATH = "assets/brand/lafa-logo-v2.svg";
const svgSource = readFileSync(SOURCE_SVG_PATH, "utf8");

// --- 1. Extract the `id="icon"` group verbatim (do not mutate the read buffer/file) ---
const groupStart = svgSource.indexOf('<g id="icon">');
const groupEnd = svgSource.indexOf("</g>", groupStart) + "</g>".length;
if (groupStart === -1 || groupEnd === -1) {
  throw new Error("Could not locate <g id=\"icon\"> in source SVG — source may have changed shape");
}
const iconGroupMarkup = svgSource.slice(groupStart, groupEnd);

// --- 2. Build a minimal, self-contained SVG doc, viewBox = the group's own bbox ---
// (192,92)-(832,732) per the group's own background rect: x=192 y=92 w=640 h=640
const iconDoc = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="192 92 640 640">${iconGroupMarkup}</svg>`;

const iconRender = new Resvg(iconDoc, {
  fitTo: { mode: "width", value: 1024 },
  background: "#FCE4DA", // flattens alpha -> opaque, matches D-03
});
const iconPng = iconRender.render().asPng();
writeFileSync("assets/images/icon.png", iconPng);
```

### Pattern 2: Monochrome splash variant via fill/stroke attribute override on extracted markup
**What:** Take the same extracted group markup, strip the background `<rect>` (first child),
and force every remaining shape's `fill`/`stroke` attribute to white via a targeted string
replace on the known literal color values (`#E8663D`, `#FFFFFF` stays, `#2FA84F`) — since the
shape count is small and fixed, replacing known literals is safe and auditable (print a diff of
what changed before writing, as a sanity check during script development).
**When to use:** Any one-off monochrome/recolor derivative of a small, known SVG.
**Example:**
```typescript
// Strip the background rect (first shape), keep glyph shapes only
const withoutBackground = iconGroupMarkup.replace(
  /<rect x="192" y="92"[^/]*\/>/,
  ""
);
// Force every colored fill/stroke to white (drop peach + orange + green -> monochrome white)
const whiteGlyph = withoutBackground
  .replace(/fill="#E8663D"/g, 'fill="#FFFFFF"')
  .replace(/stroke="#E8663D"/g, 'stroke="#FFFFFF"')
  .replace(/fill="#2FA84F"/g, 'fill="#FFFFFF"');
  // fill="#FFFFFF" (the existing white circle hole) already correct, no change needed

const splashDoc = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="192 92 640 640">${whiteGlyph}</svg>`;

const splashRender = new Resvg(splashDoc, {
  fitTo: { mode: "width", value: 228 }, // 76pt imageWidth x 3 for a sharp @3x source asset
  background: "rgba(0,0,0,0)", // TRANSPARENT — do not flatten; blue plugin bg shows through
});
writeFileSync("assets/images/splash-icon.png", splashRender.render().asPng());
```
**Note:** the white "hole" circle (`fill="#FFFFFF"` at r=445.5, radius creating the "a" counter)
and the green accent dot both sit *inside* the `id="icon"` group. D-06 says "take just the 'a'
glyph paths" — this is ambiguous on whether the green accent dot should render as white or be
dropped entirely. Flag as a planning decision point (not re-litigating CONTEXT.md's decision,
just noting the group has 4 non-background shapes and D-06's wording covers "paths" specifically
— the accent dot is a `<circle>`, not a `<path>`). Recommend: include it (converted to white)
for shape fidelity with the icon mark, since dropping it changes the silhouette's proportions
more than converting its color does — but this should be confirmed with the user/visual QA
during execution, not assumed silently.

### Anti-Patterns to Avoid
- **Editing the SVG file to pre-crop/pre-recolor it, then reading the edited version:** Directly
  violates ICON-04 (must remain byte-for-byte unmodified). All extraction/recoloring must happen
  in-memory on a string read from the file, writing only to the two output PNGs — never
  `writeFileSync` back to `assets/brand/lafa-logo-v2.svg` or any file under `assets/brand/`.
- **Regenerating `assets/expo.icon/` via Icon Composer:** Explicitly out of scope per
  REQUIREMENTS.md's Out-of-Scope table and D-07 — do not attempt to recreate or repair the
  bundle; delete it.
- **Flattening the splash PNG to an opaque background:** Unlike the icon, the splash asset
  should stay transparent (alpha) so the existing blue `#208AEF` plugin background shows through
  correctly — flattening it to a solid color would double-composite backgrounds or clash if the
  glyph's transparent surround doesn't exactly match the plugin's blue.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|--------------|-----|
| SVG-to-PNG rasterization at exact pixel dimensions | A custom Canvas-based renderer or manual path-to-pixel rasterizer | `@resvg/resvg-js`'s `Resvg` + `fitTo` | Correct anti-aliased vector rasterization is a solved problem (`resvg` is a mature, spec-compliant Rust SVG renderer); hand-rolling risks subtly wrong curve rendering, especially for the swoop stroke (`stroke-linecap="round"`) |
| Alpha-channel flattening / verifying "no alpha" | Custom pixel-buffer alpha-stripping code | `resvg`'s `background` render option (renders directly onto an opaque fill, producing a PNG with no alpha channel at all) or a `sharp().flatten({ background })` pass as a second-check | `background` at render time is simpler and less error-prone than post-processing a PNG's alpha channel afterward |
| Verifying PNG properties (dimensions, alpha) | A bespoke PNG-header parser | macOS built-in `sips -g pixelWidth -g pixelHeight -g hasAlpha <file>` (already used during discuss-phase, confirmed available on this machine) | `sips` is a stable, pre-installed macOS tool purpose-built for exactly this; no need to add a dependency just for a verification step |

**Key insight:** This whole phase is "generate two images from one SVG, correctly, once" — every
piece of it (rasterization, alpha-flattening, dimension/alpha verification) has a
purpose-built, already-available tool. The only genuinely custom code needed is the ~30-line
glue script that extracts/recolors the SVG substring, because the *specific* cropping/recolor
transform is unique to this brand asset's structure, not a generic problem a library solves.

## Common Pitfalls

### Pitfall 1: Confusing `fitTo` mode — stretching instead of scaling proportionally
**What goes wrong:** If the wrong `fitTo.mode` is used (e.g., forcing both `width` and `height`
independently to 1024 on a non-square-viewBox crop), the result can be distorted rather than
uniformly scaled.
**Why it happens:** `resvg`'s `fitTo` supports `width`, `height`, `zoom`, and `original` modes —
only one dimension is normally driven, with the other computed from the SVG's aspect ratio.
**How to avoid:** Since the icon group's own crop viewBox (`192 92 640 640`) is already a
perfect square, `fitTo: { mode: "width", value: 1024 }` naturally produces exactly 1024×1024 with
no distortion. Verify this assumption explicitly (check `pngData.width === pngData.height ===
1024` in the script, fail loudly if not) rather than trusting it silently.

### Pitfall 2: `imageWidth` in `expo-splash-screen` config is a **logical/points** value, not a raw pixel count
**What goes wrong:** Generating the splash PNG at exactly 76×76 px (matching `imageWidth: 76`
literally) produces a soft/blurry image on high-density (@2x/@3x) devices.
**Why it happens:** `imageWidth` in the plugin config is analogous to React Native's
density-independent "points" — the plugin (and native splash-screen rendering) scales the
source image to that many *logical* points wide, then the OS/device pixel density (@2x, @3x)
determines the actual on-screen pixel count. A source asset needs enough native pixel
resolution to look sharp at the highest density the device supports.
**How to avoid:** The pre-existing project asset (`splash-icon.png`, 228×213px, i.e., exactly
`76 × 3`) already encodes this convention — this project's own prior asset is itself evidence of
the "render the source PNG at 3x the configured `imageWidth`" convention (228 = 76 × 3). Follow
it: generate the new splash asset at 3x width (228px) preserving the glyph's own aspect ratio
(not forcing a square canvas) [CITED: this repo's existing `splash-icon.png` dimensions,
cross-checked against `app.json`'s `imageWidth: 76` — MEDIUM confidence, since Expo's own docs
were not fully explicit on the exact points-vs-pixel multiplier; the existing shipped asset is
the strongest available evidence].
**Warning signs:** Splash glyph looks pixelated/blurry on a real device or simulator at higher
resolution — re-render at a larger multiple (e.g. 4x) if 3x still looks soft.

### Pitfall 3: Leaving `ios/PortugueseVerbQuiz/expo.icon` stale after deleting `assets/expo.icon/`
**What goes wrong:** This dev machine already has a locally-generated native `ios/` directory
(confirmed present at `ios/PortugueseVerbQuiz/expo.icon` during this research) from a prior
prebuild/EAS build run. It is `.gitignore`'d (`ios/` is listed in `.gitignore`, confirmed
untracked by git) and is fully regenerated from `app.json` on every `expo prebuild`/EAS cloud
build — but a developer could be confused seeing a stale `expo.icon` folder still physically
present in the local `ios/` tree after `assets/expo.icon/` and the `ios.icon` config key are
removed.
**Why it happens:** Managed Expo projects regenerate `ios/`/`android/` from config on each
prebuild; local, uncommitted native directories don't auto-clean when config changes unless
prebuild is re-run (with `--clean` or after deleting the stale local `ios/` folder).
**How to avoid:** No action required for correctness (git never tracks it, EAS cloud builds
generate fresh natives from `app.json` every time — confirmed no other `.icon`/`ios.icon`/"Icon
Composer" references exist anywhere in the repo outside `app.json` itself). If a local
`expo prebuild` or `expo run:ios` is done on this machine after this phase, consider running
`npx expo prebuild --clean` once to avoid a stale local `ios/expo.icon` folder confusing local
debugging — this is a nice-to-have, not a correctness requirement, since EAS cloud builds are
unaffected.

### Pitfall 4: Treating `slopcheck install` (or similar CLI package-legitimacy checks) as read-only
**What goes wrong:** Running a "check this package" CLI command may actually perform a real
`npm install`, silently modifying `package.json`/`package-lock.json`/`node_modules` as a side
effect of what looks like an audit-only step.
**Why it happens:** Confirmed directly in this research session — `slopcheck install <pkg>`
executed `npm install <pkg>` for real and modified this repo's `package.json`.
**How to avoid:** Any task in this phase's plan that runs a package-legitimacy check must
`git status` immediately after and revert unintended `package.json`/`package-lock.json`/
`node_modules` changes if the check was meant to be advisory-only, before proceeding to the
task's actual intentional install step.

## Code Examples

See Architecture Patterns section above (Pattern 1, Pattern 2) — both are drawn from this
session's direct verification of `@resvg/resvg-js`'s documented API (`Resvg` constructor,
`fitTo`, `background` options) [CITED: github.com/thx/resvg-js README] combined with the actual
structure of `assets/brand/lafa-logo-v2.svg` as read directly in this session
[VERIFIED: read file directly].

### Verifying output with `sips` (no new dependency)
```bash
# Dimensions
sips -g pixelWidth -g pixelHeight assets/images/icon.png
# Alpha presence (already used during discuss-phase per CONTEXT.md)
sips -g hasAlpha assets/images/icon.png
```

### Verifying the brand source SVG was not modified
```bash
# If the SVG is already committed to git:
git diff --exit-code assets/brand/lafa-logo-v2.svg

# If it is NOT yet committed (confirmed: currently untracked, see Open Questions),
# a checksum comparison is required instead since git diff has nothing to compare against:
shasum -a 256 assets/brand/lafa-logo-v2.svg > /tmp/before.sha256
# ... run generation script ...
shasum -a 256 -c /tmp/before.sha256
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|-------------------|---------------|--------|
| Single `ios.icon` pointing at a flat image, manually exported per-appearance icon set | Apple's Icon Composer `.icon` bundle format, supported via `ios.icon` pointing at a `.icon` directory | SDK 54+ (per Expo docs, confirmed via WebSearch) | This project already adopted `ios.icon` → `assets/expo.icon` bundle; this phase reverses that adoption per the operator's explicit choice (D-07/ICON-02) back to the simpler flat `expo.icon` PNG, since regenerating a proper multi-appearance Icon Composer bundle requires macOS-only Icon Composer tooling not used in this pipeline |

**Deprecated/outdated:** N/A for this phase — no library or approach used here is itself
deprecated; the *project's own* Icon Composer adoption is being deliberately un-adopted per
explicit operator decision, not because Icon Composer itself is deprecated.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|----------------|
| A1 | Splash asset should be generated at 3x the `imageWidth` (228px) based on the existing (soon-to-be-replaced) asset's dimensions matching that ratio, since Expo's own docs don't explicitly state a "render at Nx" rule | Common Pitfalls / Pitfall 2 | If wrong, new splash asset could look soft/blurry on high-density devices, or unnecessarily large — low-severity, easily re-rendered at a different multiple if visual QA flags it |
| A2 | The green accent dot (`<circle>`) should be recolored to white and kept in the splash variant, rather than dropped, since D-06's wording ("glyph paths") is ambiguous about a `<circle>` element | Architecture Patterns / Pattern 2 | If wrong (user wanted it dropped), splash silhouette has an extra small solid dot not present in the intended design — cosmetic-only, easy one-line script change to fix |
| A3 | Creating a new top-level `scripts/` folder (not currently present in this repo) is an acceptable place for the kept-in-repo generation script, based on general Expo-project convention rather than any explicit project precedent | Architecture Patterns / Recommended Project Structure | Low risk — purely organizational; could equally live under a differently-named folder without any functional difference |

## Open Questions

1. **Is `assets/brand/lafa-logo-v2.svg` committed to git yet?**
   - What we know: at the start of this research session, `git status` showed both
     `assets/brand/lafa-logo-v2-concept.png` and `assets/brand/lafa-logo-v2.svg` as untracked
     (`??`) — i.e., not yet committed to the repository.
   - What's unclear: whether a prior/parallel step (e.g. earlier in this same phase's execution,
     or a manual `git add`) will commit it before or during this phase's execution.
   - Recommendation: the planner should have a task step commit `assets/brand/lafa-logo-v2.svg`
     to git *before* running the generation script (or at minimum compute a `shasum -a 256`
     checksum before running the script) — otherwise `git diff` alone cannot prove ICON-04's
     "unmodified" requirement, since there is no committed baseline to diff against yet.

2. **Exact intended treatment of the green accent dot in the splash variant** (see Assumption
   A2) — resolve via visual QA on a real render, not by re-litigating the CONTEXT.md decision
   text alone.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|--------------|-----------|---------|-----------|
| Node.js | Running the generation script | ✓ | v25.0.0 | — |
| npm | Installing `@resvg/resvg-js`/`sharp` | ✓ | 11.17.0 | — |
| `sips` (macOS built-in) | Verifying PNG dimensions/alpha | ✓ | pre-installed | — |
| `rsvg-convert`/`inkscape`/`imagemagick`/`cairosvg` | Not required — superseded by Node-based approach | ✗ (confirmed absent, per D-08) | — | `@resvg/resvg-js` (no native CLI tool dependency needed at all) |
| `@resvg/resvg-js` (npm) | Core rasterization | ✓ (installable, verified `2.6.2` on registry) | 2.6.2 | `sharp` (also installable, `0.35.3`) |

**Missing dependencies with no fallback:** none — everything required is either already present
(Node, npm, `sips`) or trivially installable with no native build step (`@resvg/resvg-js`).

**Missing dependencies with fallback:** none beyond the sharp/resvg redundancy already noted
above (either library alone is sufficient).

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest (`jest-expo` preset) — but not directly applicable; this phase produces binary image assets and a config-file change, not testable app logic |
| Config file | `package.json`'s `jest` block (existing, unchanged) |
| Quick run command | N/A for this phase's actual deliverables — see below for the real verification commands |
| Full suite command | `npm test` (existing suite; should still pass 0 regressions, since this phase touches no `src/`/`app/` code) |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|---------------------|--------------|
| ICON-01 | `assets/images/icon.png` is 1024x1024, alpha-free, shows the isolated mark | scripted/manual visual check | `sips -g pixelWidth -g pixelHeight -g hasAlpha assets/images/icon.png` | N/A — no Jest test file, this is a filesystem/asset check, not app logic |
| ICON-02 | `assets/expo.icon/` and `ios.icon` key gone | scripted check | `test ! -d assets/expo.icon && ! grep -q '"icon"' <(node -e "console.log(JSON.stringify(require('./app.json').expo.ios||{}))")` (or simpler: `jq '.expo.ios.icon' app.json` returns `null`) | N/A |
| ICON-03 | `splash-icon.png` shows Lafa mark or confirmed-unchanged with rationale documented | manual visual QA (simulator/device) + scripted dimension check | `sips -g pixelWidth -g pixelHeight assets/images/splash-icon.png` | N/A |
| ICON-04 | `assets/brand/lafa-logo-v2.svg` byte-for-byte unmodified | scripted check | `git diff --exit-code assets/brand/lafa-logo-v2.svg` (once committed — see Open Question 1) or `shasum -a 256 -c` against a pre-run checksum | N/A |

This phase has no unit-testable application logic (no `src/`/`app/` code changes) — the
"tests" here are filesystem/config assertions, not Jest tests. Do not create Jest test files for
this phase; it would be testing a build script's output, not app behavior, and the project's
existing Jest suite convention (`__tests__/`, one file per `src/` module) doesn't apply to a
one-off asset-generation script.

### Sampling Rate
- **Per task commit:** run the `sips`/`git diff`/`jq` checks above for whichever criterion the
  task just changed.
- **Per wave merge:** run all four checks (ICON-01 through 04) together, plus `npm test` to
  confirm zero regressions in the existing app test suite.
- **Phase gate:** all four checks green, plus a real-device/simulator visual confirmation of
  both the home-screen icon and the launch splash screen, before `/gsd:verify-work`.

### Wave 0 Gaps
None — no test framework gaps. This phase needs a new `scripts/generate-brand-assets.ts` (or
`.js`) file and, optionally, a small self-check block at the end of that script (asserting
dimensions/alpha via `sharp` or by re-reading the resvg render's own `width`/`height`
properties) rather than a separate test file.

## Security Domain

This phase installs two new npm devDependencies (`@resvg/resvg-js`, `sharp`) and touches no
authentication, session, network, or user-input-handling code — the applicable ASVS surface is
minimal (supply-chain only, covered by the Package Legitimacy Audit above, not runtime
input-validation/crypto categories).

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|-----------------|---------|--------------------|
| V2 Authentication | no | N/A — no auth surface touched |
| V3 Session Management | no | N/A |
| V4 Access Control | no | N/A |
| V5 Input Validation | no | Script operates on one fixed, known local SVG file, not external/user input |
| V6 Cryptography | no | N/A — `shasum`/checksum use here is for change-detection, not a security control |

### Known Threat Patterns for this stack
| Pattern | STRIDE | Standard Mitigation |
|---------|--------|-----------------------|
| Supply-chain risk from new npm devDependency | Tampering | Package Legitimacy Audit (slopcheck `[OK]` on both packages, verified official repos, no postinstall scripts) — already completed above |

## Sources

### Primary (HIGH confidence)
- `assets/brand/lafa-logo-v2.svg` — read directly in this session, exact shape/coordinate/color
  values confirmed firsthand
- `app.json` — read directly in this session, exact current config confirmed firsthand
- Direct tool verification in this session: `npm view sharp version` (0.35.3), `npm view
  @resvg/resvg-js version` (2.6.2), `npm view <pkg> engines`, `npm view <pkg> scripts.postinstall`
  (both empty), `slopcheck install sharp @resvg/resvg-js` (both `[OK]`)
- Direct filesystem checks in this session: absence of `rsvg-convert`/`inkscape`/`magick`/
  `cairosvg`, presence of `sips`, presence/gitignore status of local `ios/` directory, absence
  of any `expo.icon`/`ios.icon` references outside `app.json`

### Secondary (MEDIUM confidence)
- [github.com/thx/resvg-js README](https://github.com/thx/resvg-js/blob/main/README.md) —
  `Resvg` API shape (`fitTo`, `background`, `asPng()`), fetched and read directly
- [Apple App Store icon requirements — aggregated from multiple design-guideline summaries via
  WebSearch](https://median.co/blog/what-are-apples-ui-guidelines-for-app-icons) — 1024×1024,
  PNG-24, no alpha/transparency, no self-applied rounded corners (Apple masks), sRGB/P3 color
  space
- [Expo config docs — `expo.icon`/`expo.ios.icon` priority
  ordering](https://docs.expo.dev/versions/latest/config/app/) — flat `icon` used unless
  platform-specific `ios.icon`/`android.icon` present, in which case those take priority;
  confirms removing `ios.icon` makes the flat `icon` the sole source, as D-07 assumes

### Tertiary (LOW confidence)
- `imageWidth` points-vs-pixel semantics for `expo-splash-screen` — WebSearch results were not
  fully explicit on the exact points/pixel relationship or a "render at Nx" rule; the 3x
  recommendation in this document is inferred primarily from this project's own pre-existing
  asset dimensions (228 = 76×3), cross-checked as circumstantial evidence, not an explicit Expo
  doc statement — flagged as Assumption A1

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — both candidate libraries directly verified on the npm registry in this
  session (version, engines, postinstall scripts), plus slopcheck legitimacy pass
- Architecture: HIGH — based on directly reading the actual source SVG and `app.json` in this
  session, not assumed structure
- Pitfalls: MEDIUM — the `imageWidth`/pixel-multiplier pitfall is inferred from this project's
  existing asset rather than an explicit Expo doc statement (see Assumption A1); all other
  pitfalls are HIGH confidence (directly verified in this session)

**Research date:** 2026-07-23
**Valid until:** 2026-08-22 (30 days — stable domain, no fast-moving dependencies; re-verify
`@resvg/resvg-js`/`sharp` versions if this research is reused after that date)
