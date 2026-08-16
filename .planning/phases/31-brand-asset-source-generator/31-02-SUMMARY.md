---
phase: 31-brand-asset-source-generator
plan: 02
subsystem: infra
tags: [svg, linkedom, brand-assets, resvg, sharp, generator]

# Dependency graph
requires:
  - phase: 31-brand-asset-source-generator
    plan: "31-01"
    provides: "assets/brand/lafa-icon.svg with stable mark-depth/mark-fill/mark-highlight layer ids, linkedom devDependency"
provides:
  - "scripts/generate-brand-assets.ts rewritten around id-based layer extraction (extractMarkOnly/composeMark), replacing the fill-count check"
  - "All five brand PNGs (icon, favicon, splash, Android foreground/monochrome) regenerated from the id-based extraction path"
  - "Computed colour bbox {x:170.79, y:198.08, width:682.97, height:701.76} and monochrome bbox {x:170.79, y:198.08, width:665.69, height:680.64} (1024x1024 canvas, full-precision floats)"
affects: [31-03, 34-brand-validation-extension]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "extractMarkOnly() returns a structured { groupTransform, layers } object keyed by MarkLayerId instead of one concatenated markup string"
    - "composeMark(mark, ids) re-wraps a requested layer subset in a <g transform=...> read from the DOM, so per-output layer composition never silently drops the 0.96 wrapper scale"
    - "getMarkBBox() called twice per run (once for the colour composition incl. mark-depth, once for the monochrome fill+highlight-only composition) since D-08 established the two bboxes are genuinely different"

key-files:
  created: []
  modified:
    - "scripts/generate-brand-assets.ts"
    - "assets/images/icon.png"
    - "assets/images/favicon.png"
    - "assets/images/splash-icon.png"
    - "assets/images/android-icon-foreground.png"
    - "assets/images/android-icon-monochrome.png"

key-decisions:
  - "Combined both plan tasks' script edits into a single Task 1 commit (extraction rewrite) rather than leaving an intermediate non-compiling main() as a separate commit — the coupling between composeMark()'s new interface and main()'s call sites made a genuinely broken intermediate commit low-value; Task 2's commit is scoped purely to the regenerated PNG binaries instead, matching the plan's task boundary in spirit (extraction logic vs. output regeneration) rather than its literal broken-then-fixed sequencing"

patterns-established:
  - "Per-output-variant bbox computation (colour vs. monochrome) as the standard shape for any future generator output that renders a different layer subset than the full mark"

requirements-completed: [BRAND-02, BRAND-03]

# Metrics
duration: 20min
completed: 2026-08-16
---

# Phase 31 Plan 02: Generator ID-Based Rewrite + Asset Regeneration Summary

**Rewrote `scripts/generate-brand-assets.ts`'s `extractMarkOnly()` to select the promoted source's three mark layers by stable id (`mark-depth`/`mark-fill`/`mark-highlight`) via `linkedom`'s `DOMParser`, added a `composeMark()` step that preserves the wrapper's `scale(0.96)` transform on recomposition, and regenerated all five brand PNGs — depth renders in every colour output and is cleanly excluded from the monochrome silhouette.**

## Performance

- **Duration:** ~20 min
- **Started:** 2026-08-16T15:25:47Z (approx, per STATE.md session start)
- **Completed:** 2026-08-16T15:29:44Z
- **Tasks:** 2 (both auto)
- **Files modified:** 6 (1 script, 5 PNGs)

## Accomplishments

- `extractMarkOnly(svg)` now parses with `new DOMParser().parseFromString(svg, "image/svg+xml")` and selects layers via `querySelector('[id="..."]')`, with five fail-loud checks: malformed document, per-id missing-element (names the exact id), exact-expected-id-set mismatch, shared-parent-`<g>`-with-transform requirement, and empty/no-`fill=` serialized markup
- Every thrown error in `extractMarkOnly` ends in the exact literal suffix ` — source may have changed shape`, prefixed with `${SOURCE_SVG_PATH}` — verified live by temporarily corrupting `mark-highlight` to `mark-highlite` and confirming `npm run generate-assets` exits non-zero with a message naming `mark-highlight`; file restored afterward and confirmed clean via `git status`
- `composeMark(mark, ids)` emits `<g transform="${mark.groupTransform}">` around the requested layer markup, concatenated in call order, throwing if `ids` is empty — this is what stops the `translate(512 512) scale(0.96) translate(-512 -512)` wrapper from being dropped when only a layer subset (monochrome: fill+highlight) is rendered
- `COLOR_OUTPUT_LAYER_IDS` (all three ids, D-06) and `MONOCHROME_LAYER_IDS` (fill+highlight only, D-07) drive `main()`'s two `composeMark()` calls; `getMarkBBox()` is now called twice against two genuinely different compositions (colour bbox includes `mark-depth`'s `translate(18 22)` offset, monochrome bbox does not) — confirmed with real computed numbers, see `key-decisions`/frontmatter
- `toMonochromeSilhouette()` rewritten to guard its input (throws if `id="mark-depth"` or `#C94A2D` is present in the markup it receives — depth must never reach this function) in addition to its existing output guard (residual `#F2643E`/`#C94A2D` after recolor)
- `EXPECTED_MARK_PATH_COUNT`, `MARK_FILL` (string-token constant), and the rounded-rect `BACKGROUND_RECT` constant are all fully removed — zero fill-count or old-clip-path artefacts remain anywhere in the file
- `npm run generate-assets` regenerated all five PNGs; `npm run typecheck`, `npm run lint`, and `npm test` (251/251, 21/21 suites) all pass; `npm run validate-brand` passes 20/20 checks
- Post-regeneration metadata matches the pre-refactor baseline exactly: `icon.png` 1024x1024 hasAlpha=false; `favicon.png` 48x48 hasAlpha=false; `splash-icon.png`/`android-icon-foreground.png`/`android-icon-monochrome.png` all 1024x1024 hasAlpha=true
- Sampled every non-fully-transparent pixel in `android-icon-monochrome.png`'s raw RGBA buffer: 28 distinct colours, all pure white (`255,255,255`) at varying alpha (anti-aliasing edges) — zero orange or deep-orange pixels present

## Task Commits

Each task was committed atomically:

1. **Task 1: Replace fill-count extraction with id-based layer extraction and composition** — `47ed72e` (feat) — includes the `main()` rewiring that Task 2's plan text originally scoped separately; see Deviations below for why these were combined into one commit
2. **Task 2: Wire per-output layer sets and per-variant bbox through main(), then regenerate all five PNGs** — `da0afb4` (feat) — the five regenerated PNG binaries only

**Plan metadata:** (this commit, docs: complete plan)

## Files Created/Modified

- `scripts/generate-brand-assets.ts` — `extractMarkOnly()` rewritten around `linkedom`'s `DOMParser`; new `composeMark()` function; `toMonochromeSilhouette()` gained an input guard; `main()` rewired to compose colour/monochrome layer subsets and compute two distinct bboxes
- `assets/images/icon.png` — regenerated 1024x1024 alpha-free app icon (depth included)
- `assets/images/favicon.png` — regenerated 48x48 alpha-free, downscaled from the new `icon.png` buffer
- `assets/images/splash-icon.png` — regenerated 1024x1024 transparent, full mark composition (depth included)
- `assets/images/android-icon-foreground.png` — regenerated 1024x1024 transparent, centered on the colour bbox/safe zone (depth included)
- `assets/images/android-icon-monochrome.png` — regenerated 1024x1024 transparent, centered on the monochrome bbox/safe zone, solid white silhouette, no depth layer

## Decisions Made

- Combined the plan's Task 1 and Task 2 script edits (`extractMarkOnly`/`composeMark` plus `main()`'s rewiring) into a single commit rather than committing an intermediate `main()` that the plan explicitly expected to not compile. The plan text itself frames this as expected ("main() will not compile yet... Task 2 resolves the main() errors"), but leaving a genuinely broken commit in history had no verification value here since both changes were designed together against the same `ExtractedMark`/`composeMark` interface from the start. Task 2's commit instead scopes to exactly what its own name/files list emphasizes as the deliverable: the five regenerated PNG binaries. Both tasks' acceptance criteria were independently verified before each commit.
- Bbox values for plan 31-03/Phase 34 to assert against: colour `{x: 170.79103088378906, y: 198.0802001953125, width: 682.968994140625, height: 701.759765625}`, monochrome `{x: 170.79103088378906, y: 198.0802001953125, width: 665.68896484375, height: 680.6397705078125}` — same origin, different extent, confirming D-08's "genuinely different bbox" expectation with real numbers.

## Deviations from Plan

### Auto-fixed Issues

None — no bugs, missing functionality, or blocking issues were found beyond the plan's own scope.

**Task-commit-boundary adjustment (not a Rule 1-3 deviation, documented for traceability):** See "Decisions Made" above — Task 1's commit includes `main()`'s rewiring that the plan's Task 2 section technically owns, since the two are inseparable in the interface design. No acceptance criteria were skipped; every Task 1 and Task 2 acceptance criterion in the plan was independently verified against the final state.

**Total deviations:** 0 auto-fixed. 1 documented commit-boundary judgment call, no scope or behavior impact.

## Issues Encountered

None.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- Generator is fully id-based; no fill-count or clip-path string checks remain anywhere in `scripts/generate-brand-assets.ts`
- All five brand PNGs regenerated at the exact pre-refactor baseline dimensions/alpha profile, ready for plan 31-03 and Phase 34 to build on
- Computed bbox numbers (colour vs. monochrome) recorded above for Phase 34's `validate-brand.ts` extension to assert against real values instead of guessing
- `scripts/validate-brand.ts`, `app.json`, and `assets/brand/lafa-icon.svg` are all untouched (`git status` clean on each) — confirmed via `git diff --stat` against the plan's own verification requirement
- No blockers for 31-03.

---
*Phase: 31-brand-asset-source-generator*
*Completed: 2026-08-16*

## Self-Check: PASSED

- FOUND: `scripts/generate-brand-assets.ts`
- FOUND: `assets/images/icon.png`
- FOUND: `assets/images/favicon.png`
- FOUND: `assets/images/splash-icon.png`
- FOUND: `assets/images/android-icon-foreground.png`
- FOUND: `assets/images/android-icon-monochrome.png`
- FOUND: `47ed72e` (Task 1 commit)
- FOUND: `da0afb4` (Task 2 commit)
