# Phase 39: v1.0 Tech-Debt Cleanup - Context

**Gathered:** 2026-10-14
**Status:** Ready for planning

<domain>
## Phase Boundary

Close the v1.0 audit tech debt (DEBT-01..05): harden `scripts/validate-brand.ts`
(pixel colour, repo-root paths, Setup lockup crop gate), document that
`app.json` `ios.buildNumber` is ignored, and correct three stale documents.
Tooling and docs only — no user-visible behaviour change, no App Store
release in this phase. Lafa 1.0.1 is already live (Phase 38), so the
"droppable / never blocks the release" constraint is moot; the phase runs
to close v1.1 cleanly.

</domain>

<decisions>
## Implementation Decisions

### Colour check (DEBT-02)
- **D-01:** Sample key pixels, not a hash and not a dominant-colour average.
  Per PNG, check a few fixed points (e.g. background corner = `#FFF9F6`,
  a point inside the mark = brand orange `#F2643E`) with a tolerance of
  ±8 per RGB channel. A wrong-colour icon must FAIL; an identical re-export
  must PASS.
- **D-02:** Cover all 6 brand PNGs: `icon.png`, `favicon.png`,
  `splash-icon.png`, `android-icon-foreground.png`,
  `android-icon-monochrome.png`, `lafa-homepage-lockup.png`. Sample points
  must suit each file (transparent backgrounds for foreground/splash,
  white fill for monochrome, etc.) — planner/researcher derives them from
  `scripts/generate-brand-assets.ts` and the actual PNGs.
- **D-03:** Expected colours come from one source shared with the generator
  (`scripts/generate-brand-assets.ts` currently owns `ICON_BACKGROUND_HEX`
  `#FFF9F6`, `ORANGE_FILL_HEX` `#F2643E`, `MONOCHROME_FILL` `#FFFFFF`).
  Extract them into a small shared constants module both scripts import;
  remove the duplicate `EXPECTED_BRAND_BG_HEX` in validate-brand.

### Repo-root paths (DEBT-03)
- **D-04:** validate-brand resolves every path from the repo root (derived
  from the script's own location), so `npm run validate-brand` and
  `node scripts/validate-brand.ts` give the same result from any cwd.

### Lockup crop gate (DEBT-04)
- **D-05:** Move `LOCKUP_CONTENT_X0/Y0/X1/Y1` out of `app/index.tsx` into a
  small shared module (e.g. `src/theme/lockup.ts`, named export, no default
  export) that `app/index.tsx` imports and validate-brand reads. Values stay
  exactly 176 / 93 / 976.5 / 382.5 — zero visual change. The app-code edit
  ships with the next release; no release in this phase.
- **D-06:** The gate measures the bounding box of non-background pixels in
  `assets/images/lafa-homepage-lockup.png` and fails if any of the four
  constants differs from the measurement by more than **±2 px**.
- **D-07 (risk to resolve in research):** validate-brand runs under Node
  type-stripping (`node scripts/validate-brand.ts`); Phase 36 found a script
  could not import `src/config/api.ts` directly. The shared lockup and
  colour modules must be importable by both Node (explicit `.ts` extension,
  erasable syntax only) and the Expo/Metro app (and `tsc --noEmit`). If that
  is impossible, fall back to the closest equivalent that keeps one source
  of truth, and document why.

### Build-number note (DEBT-01)
- **D-08:** Keep `app.json` `ios.buildNumber: "1"` unchanged; document only.
  Note states: the field is ignored because `eas.json` uses
  `appVersionSource: "remote"` with `autoIncrement`, so EAS owns build
  numbers (1.0.1 shipped as build 8).
- **D-09:** Put the note in `CLAUDE.md` (next to the existing app.json
  slug/scheme divergence note) and `.planning/codebase/STACK.md`.

### Doc fixes (DEBT-05)
- **D-10:** The two archived v1.0 summaries
  (`.planning/milestones/v1.0-phases/30-build-pipeline-hardening/30-02-SUMMARY.md`
  Node claim; `.planning/milestones/v1.0-phases/35-app-store-connect-readiness/35-06-SUMMARY.md`
  "not yet closed" ending) get a dated correction block
  (`> Correction (YYYY-MM-DD, Phase 39): …`) at the point of the error.
  Original text is kept.
- **D-11:** `store/screenshots/README.md` (live doc, line ~28 references a
  checked-in `ios/` project that does not exist — managed Expo) is edited in
  place.

### Delivery & proof
- **D-12:** Two plans, both wave 1 (no shared files): Plan 1 validate-brand
  hardening (DEBT-02/03/04 + shared modules + `app/index.tsx` import);
  Plan 2 docs (DEBT-01/05).
- **D-13:** Proof by negative runs, as in Phase 34: run the gate against a
  temporary wrong-colour PNG and against tweaked crop constants → FAIL;
  restore → PASS; run from a subdirectory → same result (DEBT-03). Restore
  all temporary changes; never commit them. No new Jest tests required.
- **D-14:** Plan 1 must keep `npm run typecheck`, `npm run lint`, `npm test`
  green, since it touches `app/index.tsx`.

### Claude's Discretion
- Exact sample coordinates per PNG and the non-background threshold used for
  the bounding-box measurement.
- Name/location of the shared colour constants module.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements & origin
- `.planning/REQUIREMENTS.md` — DEBT-01..05 wording
- `.planning/ROADMAP.md` §Phase 39 — goal and 4 success criteria
- `.planning/milestones/v1.0-MILESTONE-AUDIT.md` — origin of WR-01, WR-02 and the lockup-crop debt

### Brand tooling
- `scripts/validate-brand.ts` — current gate (dimensions, alpha, hex, assets)
- `scripts/generate-brand-assets.ts` — colour constants and PNG generation
- `assets/brand/lafa-icon.svg`, `assets/brand/lafa-homepage-lockup.svg` — sources
- `.planning/milestones/v1.0-phases/34-*/` — Phase 34 brand-validation extension (negative-run proof pattern)

### Lockup
- `app/index.tsx` lines ~27-43 — LOCKUP_CONTENT_* constants and scale maths

### Docs to fix
- `.planning/milestones/v1.0-phases/30-build-pipeline-hardening/30-02-SUMMARY.md`
- `.planning/milestones/v1.0-phases/35-app-store-connect-readiness/35-06-SUMMARY.md`
- `store/screenshots/README.md`
- `CLAUDE.md`, `.planning/codebase/STACK.md` — targets for the buildNumber note
- `app.json`, `eas.json` — buildNumber / appVersionSource facts

### Node type-stripping precedent
- `src/config/api.ts` and `scripts/preflight.ts` — Phase 36 comment on why preflight keeps its own literal

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `sharp` (^0.35.3) is already a dependency and used by validate-brand — use `.raw()` pixel access for sampling and bounding-box measurement.
- `CheckResult { label, ok, actual, expected }` and the PASS/FAIL printer in validate-brand `main()` — new checks plug into the same results array.

### Established Patterns
- Named exports only, no barrel files, relative imports (CONVENTIONS.md).
- `SCREAMING_SNAKE_CASE` for fixed constants.
- Scripts run via `node scripts/*.ts` (type stripping), not ts-node.

### Integration Points
- `package.json` `validate-brand` script.
- `app/index.tsx` imports the new shared lockup module.

</code_context>

<specifics>
## Specific Ideas

- Proof style mirrors Phase 34 (21/21 checks, negative run proven).

</specifics>

<deferred>
## Deferred Ideas

- Re-fetching content on app foreground (from the 2026-10-14 backend v0.6.1 check, option (b)) — possible future mobile phase; not in Phase 39.
- Removing `ios.buildNumber` from app.json entirely — rejected for now (D-08).

</deferred>

---

*Phase: 39-v1-0-tech-debt-cleanup*
*Context gathered: 2026-10-14*
