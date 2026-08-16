# Phase 25: Brand Asset Pipeline - Context

**Gathered:** 2026-08-13
**Status:** Ready for planning

<domain>
## Phase Boundary

The user-supplied SVG icon becomes the sole source `scripts/generate-brand-assets.ts` consumes to produce every generated app asset (`icon.png`, `favicon.png`, `splash-icon.png`, `android-icon-foreground.png`, `android-icon-monochrome.png`); the old AI-generated brand assets are removed and no longer referenced anywhere in the repo. This phase does NOT touch `src/theme/tokens.ts` (Phase 26), `app.json` splash/adaptive-icon config (Phase 27), or per-screen palette application (Phase 28) — those are separate phases even though the new SVG's colors happen to match the new palette.

</domain>

<decisions>
## Implementation Decisions

### Source file
- **D-01:** The user-supplied SVG has been added at `assets/brand/Lafa_final_logo.svg` and must be renamed to `assets/brand/lafa-icon.svg` — this matches BRAND-01, ROADMAP.md, PROJECT.md, and REQUIREMENTS.md exactly, so no doc updates are needed and the script's `SOURCE_SVG_PATH` should point at this canonical name.
- **D-02:** Source SVG structure (confirmed by reading the file): a single `<g clip-path>` containing one `rect` background (`rx="230"`, `fill="#FFF9F6"`, full 1024x1024 canvas) and two `path` elements forming the mark (both `fill="#F2643E"`, one is the main swoop, one is a small accent curve). No nested `<g id="icon">` wrapper, no separate accent-dot element, no stroke-based paths — this is a structurally different shape than the old `lafa-logo-v2.svg` that the current generator script was written against. The generator's extraction/patching logic (which targets `<g id="icon">`, a specific `BACKGROUND_RECT` string, `GREEN_ACCENT_DOT`, and stroke-tail patching) does not apply to this SVG and needs to be rewritten around this simpler two-shape structure (background rect + mark paths).

### Icon background handling
- **D-03:** `icon.png` must be a full-bleed square with the background flattened — do NOT preserve the SVG's baked-in `rx="230"` rounded-rect shape. Render the mark on a plain square canvas filled with `#FFF9F6` (the SVG's own background color), letting iOS/Android apply their own OS-level icon mask. Preserving the baked-in rounding risks a visible double-rounded-square artifact once the OS mask is applied on top.

### Splash icon
- Not explicitly re-discussed as a separate area, but per BRAND-03 + this SVG's structure: `splash-icon.png` = the mark paths only (both `#F2643E` paths), transparent background, background `rect` excluded. Straightforward given the two-shape structure — flagged as low-ambiguity, not a full discussion area.

### Old asset removal
- **D-04:** Delete the old AI-generated brand assets outright (`git rm`): `assets/brand/lafa-logo.svg`, `assets/brand/lafa-logo-v2.svg`, `assets/brand/lafa-logo-concept.png`, `assets/brand/lafa-logo-v2-concept.png`. This matches BRAND-02's primary phrasing ("removed"), keeps the repo clean, and git history preserves them if ever needed again. Do not just decouple references and leave the files.

### Android adaptive icon specifics
- **D-05:** `android-icon-foreground.png` — follow standard Android adaptive-icon convention: mark centered, sized to stay within the ~66% safe-zone circle so it isn't clipped by circular/squircle/rounded-square launcher masks across devices. No custom sizing/visual-weight matching to the iOS icon.
- **D-06:** `android-icon-monochrome.png` — render as a solid white silhouette of the mark on a transparent background (not the original `#F2643E` orange). This matches Android 13+ themed-icon convention, where the OS tints the source to match the user's wallpaper/theme color; the source must be a single flat color.

### Brand guide
- **D-07:** No separate brand guide document is needed or will be supplied. The palette values Phase 26 needs are already locked in ROADMAP.md/PROJECT.md, and the new SVG's own colors (`#FFF9F6` background, `#F2643E` mark) already match that locked palette — confirming consistency between the icon source and the guideline palette without a separate document.

### Claude's Discretion
- Exact resvg/sharp rendering approach for producing the new asset types (`favicon.png`, `android-icon-foreground.png`, `android-icon-monochrome.png`) that the current script doesn't yet generate — this is implementation mechanics for the researcher/planner, not a user preference.
- Exact safe-zone pixel math for the Android adaptive icon (the ~66% convention is confirmed; precise centering/padding calculation is Claude's to implement).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase scope / requirements
- `.planning/ROADMAP.md` §"Phase 25: Brand Asset Pipeline" — goal, success criteria, requirements mapping (BRAND-01/02/03)
- `.planning/REQUIREMENTS.md` §"Brand" (lines ~14-22) — full requirement text for BRAND-01/02/03
- `.planning/PROJECT.md` §"Current Milestone: v0.6 Lafa Branding + Expo Splash Cleanup" — target features list, confirms palette hex values already locked, notes the (external, not-in-repo) `Lafa Branding + Expo Splash Cleanup Plan.md` was the original source of this milestone's scoping

### Existing pipeline to modify
- `scripts/generate-brand-assets.ts` — current generator; only produces `icon.png` and `splash-icon.png` today, structured entirely around the OLD `lafa-logo-v2.svg` shape (needs rewrite, not incremental patching, given D-02's structural mismatch)
- `assets/brand/lafa-icon.svg` (after rename per D-01) — the new canonical source

No external specs beyond the above — the referenced `Lafa Branding + Expo Splash Cleanup Plan.md` was reviewed by the user externally before this milestone was scoped but does not exist as a file in this repo; treat ROADMAP.md/PROJECT.md as the authoritative captured version of its decisions.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `scripts/generate-brand-assets.ts` — existing use of `@resvg/resvg-js` (SVG→PNG rasterization) and `sharp` (alpha-channel stripping via `.removeAlpha()`) is the right toolchain for the new outputs too; reuse the same dependencies, not new ones.
- `scripts/preflight.ts` — sibling script in `scripts/`, useful as a reference for this repo's script conventions (plain TS, run via `npm run` script) if unsure how invocation should work.

### Established Patterns
- Current script hardcodes SVG structural assumptions as string constants (tag names, exact rect/color strings) and throws descriptive errors if the source SVG doesn't match ("source may have changed shape") rather than failing silently — this defensive pattern should carry over to the rewritten script given the new SVG's simpler two-shape structure.
- `ICON_SIZE_PX = 1024`, `SPLASH_WIDTH_PX` pattern (named px constants) for output dimensions — follow for the new output sizes too (`favicon.png` 48x48, Android icons 1024x1024 per BRAND-03).

### Integration Points
- `app.json` currently points `expo.icon`, `android.adaptiveIcon.{foregroundImage,backgroundImage,monochromeImage}`, and `web.favicon` at `./assets/images/*.png` — Phase 25 only needs to ensure the generator writes correct files to those existing `assets/images/` paths; `app.json` config changes (background color swap, `backgroundImage` removal) are Phase 27's job, not this phase's.

</code_context>

<specifics>
## Specific Ideas

- The new SVG (`assets/brand/Lafa_final_logo.svg`, to be renamed `lafa-icon.svg`) is a simple two-shape design: one rounded-rect background (`#FFF9F6`) + two mark paths (both `#F2643E`) — no accent dot, no separate crop viewBox needed like the old source had.
- User confirmed no additional brand guide is needed — the SVG's own colors already match the locked v0.6 palette.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 25-Brand Asset Pipeline*
*Context gathered: 2026-08-13*
