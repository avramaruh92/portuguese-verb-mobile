# Phase 31: Brand Asset Source & Generator - Context

**Gathered:** 2026-08-16
**Status:** Ready for planning

<domain>
## Phase Boundary

Promote the Warm Bold Mark candidate (`assets/brand/candidates/lafa-icon-warm-bold.svg`) to the canonical production brand-asset source (`assets/brand/lafa-icon.svg`), with stable `<g id="...">` layers added to it, and rewrite `scripts/generate-brand-assets.ts`'s `extractMarkOnly()` to select those layers by id instead of counting `fill="#F2643E"` string occurrences. Regenerate icon, splash, favicon, and Android foreground/monochrome outputs from the new source at the same dimensions as today's baseline, with `icon.png` re-confirmed alpha-free. Does not include the homepage lockup (Phase 32) or `validate-brand.ts`'s regression-gate extension (Phase 34) — those build on this phase's output but are out of scope here.

</domain>

<decisions>
## Implementation Decisions

### SVG Parsing Approach
- **D-01:** Use `linkedom` (new devDependency, build-time only — same category as the already-installed `@resvg/resvg-js`/`sharp`, never shipped in the app bundle) for id-based element lookup, not a dependency-free regex depth-tracker. Matches the recommendation in `.planning/research/SUMMARY.md`.
- **D-02:** Fully replace the old `fill="#F2643E"` count-based check — do not keep it as a secondary sanity check alongside id lookup. The fill-count check was exactly the brittleness this phase removes.

### Layer ID Naming & Placement
- **D-03:** Add semantic ids to the promoted source's three shape layers: `id="mark-depth"` (the outer `<g transform=... opacity="0.18">` wrapper around the `#C94A2D` shadow path), `id="mark-fill"` (the main `#F2643E` outline path), `id="mark-highlight"` (the small inner `#F2643E` accent path).
- **D-04:** Keep the existing `<g>` wrapper structure as-is — add the id directly to the existing `<g>`/`<path>` elements rather than flattening `mark-depth`'s transform/opacity into a restructured tree. Minimal diff from the candidate SVG.
- **D-05:** `extractMarkOnly()` must require an exact expected id-set (`mark-depth`, `mark-fill`, `mark-highlight`) and throw a descriptive "source may have changed shape" error (matching the old script's error style) if any expected id is missing. Do not silently skip missing ids — this preserves the fail-loud philosophy the old fill-count check had, just anchored to ids instead.

### Depth-Shadow Layer Across Outputs
- **D-06:** `mark-depth` (the offset, 18%-opacity `#C94A2D` shadow layer — new in the warm-bold candidate, absent from today's shipped `lafa-icon.svg`) renders in ALL full-color outputs: `icon.png`, `splash-icon.png`, and `android-icon-foreground.png`. It's part of the promoted mark's visual identity, not icon-exclusive.
- **D-07:** `android-icon-monochrome.png` (the themed-icon white silhouette) drops `mark-depth` entirely — only `mark-fill` + `mark-highlight` are recolored to solid white. Layering a second offset, differently-toned shape into a monochrome silhouette would read as a smudge/ghosting artifact, since the depth effect depends on color contrast that themed icons remove.
- **D-08:** The safe-zone-centering bbox calculation (`getMarkBBox`) must use the FULL mark's bbox including `mark-depth`'s offset (`translate(18 22)`), not just `mark-fill` alone — treat whatever's actually rendered in a given output as one composition to bbox/center, consistent with how the script already treats the mark as a single unit today. Note: this means the monochrome/foreground crop's bbox source differs by output (full mark incl. depth for color outputs; `mark-fill` + `mark-highlight` only for monochrome, since depth is dropped there) — the planner should treat bbox as computed per-output-variant's actual rendered layer set, not a single shared constant.

### Baseline Dimension & Alpha Verification
- **D-09:** This phase proves dimension-match (icon/splash/Android foreground/monochrome at 1024x1024, favicon at 48x48) via manual verification against today's known baseline during execution — it does NOT add a formal assertion step to `generate-brand-assets.ts` itself or to `validate-brand.ts`. The regression-gate assertions are explicitly Phase 34's job per the roadmap's dependency ordering (Phase 34 depends on Phase 31 producing real output to assert against).
- **D-10:** `icon.png`'s no-alpha-channel invariant (success criterion #4) is re-verified locally (sharp/`sips` metadata check) during this phase's execution — NOT via a real `eas build` triggered specifically for this phase. The real EAS build re-confirmation naturally lands at Phase 35 (App Store Connect submission), where a real production build already happens.
  - **⚠ Flag for planner:** ROADMAP.md's Phase 31 success criterion #4 literally states "re-confirmed against a real EAS build (not just local validation)." This decision (D-10) explicitly defers that real-build re-confirmation to Phase 35. If the planner intends to satisfy criterion #4 as literally written within Phase 31 itself, this needs to be reconciled — either amend the roadmap criterion's wording to reflect the Phase 35 deferral, or add a real-build checkpoint task to this phase's plan. Surfacing this rather than silently resolving it either way.

### Claude's Discretion
- Exact `linkedom` API usage (`getElementById` vs. `querySelector`) — implementation detail.
- Exact wording of thrown error messages, as long as they follow the existing "source may have changed shape" style and name which id is missing.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements & Roadmap
- `.planning/REQUIREMENTS.md` (BRAND-01 through BRAND-04) — locked requirement text for this phase
- `.planning/ROADMAP.md` §"Phase 31: Brand Asset Source & Generator" — goal, success criteria, dependency on Phase 30

### Research
- `.planning/research/SUMMARY.md` — recommends `linkedom` for id-based extraction (§"Recommended Stack", §"Phase 2: Brand-asset source promotion + generator id-based rewrite"); flags this phase as needing a focused decision on parser choice and exact `<g id>` naming (§"Research Needs")
- `.planning/research/PITFALLS.md` — alpha-channel regression risk specific to this exact generator refactor; explicit warning that local validation is "necessary but not sufficient," real `eas build`/`eas submit` needed eventually (informs D-10)
- `.planning/research/ARCHITECTURE.md` — Pattern 1 (id-based SVG layer extraction approach)

### Current Implementation (baseline to diff against)
- `assets/brand/lafa-icon.svg` — current shipped source (2-layer mark, no ids, wrapped in `clip-path`/`<defs>`) — being replaced
- `assets/brand/candidates/lafa-icon-warm-bold.svg` — promotion source (3-layer mark: depth/fill/highlight, no ids yet, no `clip-path`)
- `scripts/generate-brand-assets.ts` — generator script being modified (`extractMarkOnly()`, `getMarkBBox()`, `toMonochromeSilhouette()`, `main()`)
- `scripts/validate-brand.ts` — independent regression gate; NOT modified this phase (Phase 34), but its current `ALLOWED_SVG_SOURCE`/dimension constants show today's baseline

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `@resvg/resvg-js` (`Resvg` class) and `sharp` — already installed, keep their existing roles (rasterize SVG→PNG, composite/resize/strip-alpha). Only the upstream string-extraction step (`extractMarkOnly`) changes.
- `renderCenteredOnSafeZone()`, `wrapMarkDoc()`, `buildFullIconDoc()` — existing helper functions in `generate-brand-assets.ts` that stay structurally the same; they consume whatever markup string `extractMarkOnly()` returns, so the id-based rewrite is largely isolated to that one function plus the monochrome-recolor and bbox logic (which now need to account for the depth-layer inclusion/exclusion decisions above).

### Established Patterns
- Fail-loud descriptive errors on any "source may have changed shape" condition (`throw new Error(...)`) — every existing check in `extractMarkOnly()`/`getMarkBBox()`/`toMonochromeSilhouette()` follows this style; the id-based rewrite should match it (D-05).
- `MARK_FILL`/`MONOCHROME_FILL` string constants at module top, used for both selection and recolor — the id-based version will likely need a similar constants block mapping ids to roles, plus a distinct "which ids apply to which output" mapping per D-06/D-07.
- `icon.png` alpha-stripping via `sharp(...).removeAlpha()` after `Resvg` render, with an inline comment explaining WHY (`resvg-js` always encodes RGBA even with an opaque `background` option) — this step is unaffected by the id-based rewrite and must be preserved.

### Integration Points
- `main()` orchestrates all 5 output renders in one script; `extractMarkOnly()`'s return value (currently one shared `innerMarkup` string) will likely need to become either a structured object (`{ depth, fill, highlight }` per-layer markup) or the function signature will need per-output variants, since D-06/D-07/D-08 require different layer subsets and bbox sources for color vs. monochrome outputs.

</code_context>

<specifics>
## Specific Ideas

- The three visual layers in the warm-bold candidate map directly to real design intent: `mark-depth` is a deliberate offset shadow giving the mark warmth/depth (the reason this candidate was chosen over `bold-orange`/`premium-dark`), `mark-fill` is the primary orange mouth/speech-bubble-style shape, `mark-highlight` is a small accent detail inside it.
- No specific pixel values or exact id string alternatives were requested beyond the semantic names captured in D-03.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope. The homepage lockup (`assets/brand/candidates/lafa-homepage-lockup.svg`, already present in the candidates directory) is explicitly Phase 32's concern and was not discussed here beyond confirming it's out of scope.

### Reviewed Todos (not folded)
None — `todo.match-phase` for Phase 31 returned zero matches.

</deferred>

---

*Phase: 31-Brand Asset Source & Generator*
*Context gathered: 2026-08-16*
