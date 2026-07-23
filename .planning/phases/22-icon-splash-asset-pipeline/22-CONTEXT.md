# Phase 22: Icon & Splash Asset Pipeline - Context

**Gathered:** 2026-07-23
**Status:** Ready for planning

<domain>
## Phase Boundary

Bake the Lafa mark into the app's icon pipeline: generate a 1024x1024,
alpha-free `assets/images/icon.png` from `assets/brand/lafa-logo-v2.svg`
(the orange "a" mark only, not the "lafa" wordmark text), remove the
Icon Composer bundle (`assets/expo.icon/`) and its `app.json` `ios.icon`
key so the flat PNG is the sole iOS icon source, and reconcile
`splash-icon.png` with a matching brand treatment — all without touching
the original brand source files.

</domain>

<decisions>
## Implementation Decisions

### Icon composition (ICON-01)
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

### Splash icon (ICON-03)
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

### Icon Composer removal (ICON-02)
- **D-07:** Delete `assets/expo.icon/` entirely and remove `ios.icon`
  from `app.json` `ios` block. No regeneration of the Icon Composer
  bundle attempted — the flat PNG (`expo.icon` config key at the app
  root, pointing to `assets/images/icon.png`) becomes the sole iOS icon
  source. This confirms the prior decision already logged in
  `.planning/PROJECT.md`'s Key Decisions table — not reopened.

### Asset-generation tooling
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

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Brand source (do not modify)
- `assets/brand/lafa-logo-v2.svg` — canonical Lafa mark source. Contains
  an `id="icon"` group (rounded-square background `#FCE4DA` at
  `rx="176"`, orange `#E8663D` "a" glyph, white `#FFFFFF` circle hole,
  orange swoop stroke, `#2FA84F` green accent dot) plus a separate
  `<text>` element rendering the "lafa" wordmark — the icon pipeline
  must isolate the `icon` group only, per D-01.
- `assets/brand/lafa-logo-v2-concept.png` — untracked reference image,
  not a pipeline input.

### Current app icon/splash config
- `app.json` — `expo.icon` (flat PNG path, keep), `expo.ios.icon` (Icon
  Composer path, remove per D-07), `expo.plugins` entry for
  `expo-splash-screen` (background color `#208AEF` + `splash-icon.png`
  path — background stays unchanged per D-05).
- `assets/images/icon.png` — current file is the unbranded default Expo
  "A" glyph on blue, 1024x1024, has alpha — must be replaced per D-01/02/03.
- `assets/images/splash-icon.png` — current file (228x213, has alpha) is
  the default Expo template glyph — must be replaced per D-04/06.
- `assets/expo.icon/` (`icon.json` + `Assets/`) — Icon Composer bundle to
  be deleted per D-07.

### Prior decision record
- `.planning/PROJECT.md` Key Decisions table — already documents "delete
  the `ios.icon` key and rely solely on the flat `expo.icon` PNG
  (ICON-02)" as the operator's chosen path; D-07 confirms, does not
  reopen, this decision.
- `.planning/REQUIREMENTS.md` — ICON-01 through ICON-04 full requirement
  text.
- `.planning/ROADMAP.md` Phase 22 section — goal and success criteria.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- None in `src/`/`app/` — this phase only touches `assets/` and
  `app.json`, no application code changes.

### Established Patterns
- N/A — first phase in this project to add a build-time/asset-generation
  script; no prior precedent to follow.

### Integration Points
- `app.json`'s `expo.icon`, `expo.ios.icon`, and the `expo-splash-screen`
  plugin config are the only integration points — Metro/Expo Router and
  app code are unaffected by this phase.

</code_context>

<specifics>
## Specific Ideas

- The generated app icon should look like a normal, full-bleed app icon
  (comparable to how most App Store icons fill their square) rather than
  the SVG's literal current composition (rounded square inset on white).
- Splash mark: a simple white silhouette of the "a" glyph, matching the
  visual weight of the current placeholder glyph it replaces, just
  Lafa-shaped instead of generic.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope. No scope-creep items came up.

</deferred>

---

*Phase: 22-Icon & Splash Asset Pipeline*
*Context gathered: 2026-07-23*
