# Phase 34: Brand Validation Extension - Context

**Gathered:** 2026-08-16
**Status:** Ready for planning

<domain>
## Phase Boundary

`scripts/validate-brand.ts` (the existing brand regression gate, currently
covering the pre-v1.0 icon/splash/favicon/Android checks) is extended to
also assert against the real outputs of Phase 31 (id-based mark generator)
and Phase 32 (homepage lockup) — closing the gap where those phases' outputs
exist but aren't yet gated by `npm run validate-brand`. This is a pure
build-script extension: no new UI, no new generator behavior, no changes to
`generate-brand-assets.ts` itself.

</domain>

<decisions>
## Implementation Decisions

### Canonical-source check depth
- **D-01:** Keep `checkGeneratorSource()` as a string-match check only —
  confirm the generator's text references `assets/brand/lafa-icon.svg`'s
  path, same as today. Do NOT add a check that parses `lafa-icon.svg` for
  the `mark-depth`/`mark-fill`/`mark-highlight` `<g id="...">` layers.
  Phase 31 already owns correctness of the id-based extraction logic; this
  gate only needs to confirm the pipeline still points at the right source
  file, not re-verify extraction internals.

### Homepage lockup check scope (VALID-04)
- **D-02:** Add exactly one new check: `checkPngDimensions("lafa-homepage-lockup.png dimensions", "assets/images/lafa-homepage-lockup.png", 3200, 1040)`,
  pushed into the same `results` array — mirrors the existing
  `checkPngDimensions` calls for icon/splash/favicon/Android outputs
  exactly. `3200x1040` are the generator's own constants
  (`LOCKUP_WIDTH_PX`/`LOCKUP_HEIGHT_PX` in `scripts/generate-brand-assets.ts`).
  Do NOT add a separate `checkGeneratorSource`-style check for the lockup
  SVG reference — presence+dimensions of the PNG output is what "output is
  present" means for every other asset already covered by this script.

### Scope of "new pipeline outputs"
- **D-03:** Stick strictly to the 4 listed success criteria (source
  canonical, dimensions, no-alpha, lockup presence). No 5th check asserting
  the stable ids exist directly in `lafa-icon.svg` — consistent with D-01,
  that's Phase 31's concern, not this gate's.

### Failure/output format
- **D-04:** The new lockup check uses the exact same pattern as every
  existing check: pushed into the same `results: CheckResult[]` array,
  printed by the same `PASS`/`FAIL` console loop, counted in the same
  `{passed}/{total} checks passed` summary line, and contributes to the
  same `process.exit(1)` on any failure. No separate grouping/section
  header for lockup checks.

### Claude's Discretion
- Whether `VALID-01`/`VALID-02`/`VALID-03` require any code changes at all,
  or are already fully satisfied by the existing `checkGeneratorSource()`,
  `checkPngDimensions()`, and `checkNoAlpha()` calls in the current script
  (see Code Context below — they appear to already exist). If already
  satisfied, the plan's real work is narrowly D-02 (the one new lockup
  dimension check) plus confirming/documenting that VALID-01–03 pass as-is.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Roadmap / Requirements
- `.planning/ROADMAP.md` §"Phase 34: Brand Validation Extension" (lines 225-237) — goal, success criteria, depends-on (Phase 31, 32)
- `.planning/ROADMAP.md` §"Phase 31: Brand Asset Source & Generator" (lines 141-173) — defines what "canonical source" and id-based extraction mean
- `.planning/ROADMAP.md` §"Phase 32: Homepage Lockup" (lines 175-201) — defines the lockup source/output paths and dimensions
- `.planning/REQUIREMENTS.md` lines 38-41 — VALID-01 through VALID-04 requirement text
- `.planning/REQUIREMENTS.md` lines 99-102 — requirement-to-phase traceability table

### Prior phase context (Phase 31, 32)
- `.planning/phases/31-brand-asset-source-generator/31-CONTEXT.md` — Phase 31 decisions on id-based extraction
- `.planning/phases/32-homepage-lockup/32-CONTEXT.md` — Phase 32 decisions on lockup rendering/injection

### Source files to modify
- `scripts/validate-brand.ts` — the file being extended (full contents already reviewed; existing checks for icon/splash/favicon/Android dimensions, no-alpha, forbidden-hex, adaptive-background, splash-background, referenced-assets-exist, generator-source-reference, retired-refs-absent)
- `scripts/generate-brand-assets.ts` — source of truth for lockup constants (`LOCKUP_SOURCE_SVG_PATH`, `LOCKUP_OUTPUT_PATH`, `LOCKUP_WIDTH_PX = 3200`, `LOCKUP_HEIGHT_PX = 1040`, lines 13-23)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `checkPngDimensions(label, path, expectedWidth, expectedHeight)` in
  `scripts/validate-brand.ts` (lines 36-53) — the exact function to reuse
  for the new lockup dimension check (D-02); no new helper needed.
- `CheckResult` interface (lines 29-34) and the `results: CheckResult[]`
  accumulation + PASS/FAIL print loop + exit-1-on-failure pattern in
  `main()` (lines 202-245) — the established shape every new check must
  slot into.

### Established Patterns
- Every check is a standalone function returning `CheckResult` (or
  `CheckResult[]` for multi-check groups like `checkSplashBackground()`),
  called and spread into the single `results` array inside `main()`. New
  checks follow this exact shape — no class, no separate runner.
- Constants for paths/dimensions live as top-level `const` declarations
  near the top of the file (`ICON_PATH`, `CANVAS_PX`, etc.) — the new
  `LOCKUP_PATH` (`assets/images/lafa-homepage-lockup.png`) and its
  `3200`/`1040` dimensions should follow the same declaration style.

### Integration Points
- `npm run validate-brand` (referenced in Phase 31 criterion 4 and used as
  the CI/manual gate) is the sole entry point — `main()` in
  `scripts/validate-brand.ts` is what Phase 35 will re-run before the real
  EAS submission, so this extension must not break the existing exit-code
  contract.

</code_context>

<specifics>
## Specific Ideas

No specific new-behavior requests — the user confirmed the recommended
(minimal, pattern-consistent) option at every decision point: keep the
existing string-match canonical check as-is, add exactly one new
dimension-check call for the lockup PNG, don't expand scope beyond the 4
listed success criteria, and don't introduce a new output format.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope. No scope-creep suggestions
came up.

</deferred>

---

*Phase: 34-Brand Validation Extension*
*Context gathered: 2026-08-16*
