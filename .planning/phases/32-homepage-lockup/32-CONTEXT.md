# Phase 32: Homepage Lockup - Context

**Gathered:** 2026-08-16
**Status:** Ready for planning

<domain>
## Phase Boundary

Promote the candidate lockup SVG (`assets/brand/candidates/lafa-homepage-lockup.svg`) to the canonical `assets/brand/lafa-homepage-lockup.svg`, add a render step to `scripts/generate-brand-assets.ts` producing `assets/images/lafa-homepage-lockup.png`, and replace the Setup screen's plain `Text` "Lafa" title in `app/index.tsx` with a responsive `Image` rendering that lockup. Depends on Phase 31's id-based mark promotion (`mark-depth`/`mark-fill`/`mark-highlight` layers in `assets/brand/lafa-icon.svg`) since the lockup's embedded mark must be updated to match. Does not include `validate-brand.ts`'s regression-gate extension (Phase 34) or the quiz press-state color fix (Phase 33) — unrelated concerns.

</domain>

<decisions>
## Implementation Decisions

### Mark Consistency
- **D-01:** Update the lockup's embedded mark to the new 3-layer canonical mark (`mark-depth`/`mark-fill`/`mark-highlight`, promoted in Phase 31) rather than leaving the candidate's old 2-layer mark (no ids, no depth-shadow layer) in place. The lockup must visually match the app icon exactly, including the depth-shadow effect.

### Generator Rendering Approach
- **D-02:** `generate-brand-assets.ts`'s lockup render step reuses the existing id-based extraction machinery (`extractMarkOnly()`/`composeMark()`) to pull the canonical mark markup and inject it into the lockup SVG's `<g transform="translate(118 26) scale(0.34)">` slot at render time. The lockup's static markup (background rect, wordmark `<text>`, green dot `<circle>`, tagline `<text>`) comes from the candidate SVG as-is. This keeps one source of truth for the mark — a future icon change automatically propagates to the lockup without hand-editing two SVGs.
- Do NOT hand-edit the candidate SVG's mark paths once and render it as a static file — that was explicitly rejected in favor of the composed approach, to avoid future drift between icon and lockup.

### Image Resolution Strategy
- **D-03:** Render a single high-res PNG (`assets/images/lafa-homepage-lockup.png`, rendered at roughly 2x-3x the expected display size, following the existing 1024x1024-for-much-smaller-display-size pattern used by `icon.png`/`splash-icon.png`) and reference it in `app/index.tsx` via a fixed-aspect-ratio `Image` with explicit `width`/`height` style. Do NOT introduce `@1x`/`@2x`/`@3x` density-variant files — that's a new asset-density convention this codebase doesn't otherwise use, and the single-scaled-PNG pattern is already established for every other generated brand asset.

### Lockup Content Scope
- **D-04:** The full candidate lockup — mark, wordmark ("lafa"), green accent dot, and tagline ("Learn it. Say it.") — becomes the Setup screen header image, replacing the plain `Text` "Lafa" title entirely. No cropping/trimming of the candidate's viewBox. There is no existing tagline text elsewhere on the Setup screen (`app/index.tsx`), so this introduces the tagline copy for the first time — not a duplicate.

### Claude's Discretion
- Exact injected mark size/position tuning within the lockup's `<g transform>` slot (the candidate's `scale(0.34)` was calibrated against the old 2-layer mark's bbox; the new 3-layer mark's bbox differs slightly due to the depth-shadow offset — minor recentering may be needed).
- Exact PNG render resolution/scale factor for `lafa-homepage-lockup.png`, as long as it stays crisp at the Setup screen's display width on high-density (3x) devices.
- Exact `Image` `resizeMode` and container styling in `app/index.tsx`, following the existing `styles.heading`/`tokens.ts` conventions.
- Accessibility label for the `Image` (e.g. `accessibilityLabel="Lafa — Learn it. Say it."`) replacing the semantic value the plain `Text` element previously carried for free.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements & Roadmap
- `.planning/REQUIREMENTS.md` (LOCKUP-01 through LOCKUP-03) — locked requirement text for this phase
- `.planning/ROADMAP.md` §"Phase 32: Homepage Lockup" — goal, success criteria, dependency on Phase 31

### Phase 31 (prerequisite — mark promotion)
- `.planning/phases/31-brand-asset-source-generator/31-CONTEXT.md` — decisions D-01 through D-10 on the id-based mark promotion this phase builds on (layer ids, depth-shadow inclusion rules, `linkedom` parsing)
- `assets/brand/lafa-icon.svg` — canonical promoted mark source (3-layer: `mark-depth`/`mark-fill`/`mark-highlight`)
- `scripts/generate-brand-assets.ts` — generator script being extended; reuse `extractMarkOnly()`/`composeMark()` (added in Phase 31) rather than reimplementing mark extraction

### Current Implementation (baseline to work from)
- `assets/brand/candidates/lafa-homepage-lockup.svg` — lockup candidate (1600x520 viewBox, `#FFF9F6` background, old 2-layer embedded mark at `translate(118 26) scale(0.34)`, "lafa" wordmark text, green `#1F7F66` dot, "Learn it. Say it." tagline) — promotion source, mark needs updating per D-01
- `app/index.tsx` (line 74, `<Text style={styles.heading}>Lafa</Text>`, and `styles.heading` at line 176) — the plain-text title being replaced
- `src/theme/tokens.ts` — confirms the candidate's colors already match production tokens exactly (`background: #FFF9F6`, `primary: #F2643E`, `success: #1F7F66`, `text: #24201E`) — no palette changes needed, only the mark layers

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `extractMarkOnly()`, `composeMark()` (`scripts/generate-brand-assets.ts`, added in Phase 31) — id-based mark extraction/composition, directly reusable for injecting the canonical mark into the lockup's static SVG markup
- `Resvg` (`@resvg/resvg-js`) — already used for every other PNG render in the script; same pattern applies to the lockup's full-canvas SVG-to-PNG render (closest existing analog: the splash-icon full-canvas render, not the safe-zone-cropped icon render, since the lockup is a fixed-composition image, not a centered mark)
- `colors`, `spacing`, `typography` (`src/theme/tokens.ts`) — for the `Image` container's styling in `app/index.tsx`, replacing `styles.heading`

### Established Patterns
- Fail-loud descriptive errors on "source may have changed shape" conditions — if the lockup's `<g transform>` mark-slot structure changes in a way the injection logic doesn't expect, follow the same throw-with-description style as `extractMarkOnly()`
- Single generated-PNG-at-larger-than-display-size pattern (`icon.png` at 1024x1024 for an app icon displayed far smaller) — apply the same ratio logic to the lockup's PNG dimensions relative to its expected Setup-screen display width

### Integration Points
- `main()` in `generate-brand-assets.ts` orchestrates all output renders in one script; the lockup render step is a new step alongside the existing icon/splash/favicon/Android outputs, reusing the same `mark` extraction result already computed for those
- `app/index.tsx` line 74 is the sole integration point in the app — the `Image` replaces the `Text` element and `styles.heading` style block in-place; no other screens reference the plain-text "Lafa" title

</code_context>

<specifics>
## Specific Ideas

- The lockup's mark, once updated to the 3-layer canonical version, must read as the same brand mark used on the app icon/splash — the depth-shadow layer is the visual signature that ties them together.
- The tagline "Learn it. Say it." was already drafted in the candidate and is adopted as-is; no alternative copy was requested.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

### Reviewed Todos (not folded)
None — `todo.match-phase` for Phase 32 returned zero matches.

</deferred>

---

*Phase: 32-Homepage Lockup*
*Context gathered: 2026-08-16*
