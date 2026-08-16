---
phase: 32-homepage-lockup
plan: 01
subsystem: brand-assets
tags: [svg, brand-pipeline, resvg, homepage-lockup]

dependency-graph:
  requires:
    - assets/brand/lafa-icon.svg (Phase 31 canonical 3-layer mark source)
    - scripts/generate-brand-assets.ts extractMarkOnly()/composeMark() (Phase 31)
  provides:
    - assets/brand/lafa-homepage-lockup.svg (canonical lockup source)
    - assets/images/lafa-homepage-lockup.png (rendered lockup, 3200x1040)
    - buildLockupDoc() render-time mark injection in generate-brand-assets.ts
  affects:
    - app/index.tsx (plan 32-02 will consume the PNG via require())

tech-stack:
  added: []
  patterns:
    - Render-time mark injection into a larger pre-authored SVG (new pattern
      in this generator — prior steps only ever composed a mark onto a blank
      canvas, never injected into a document with sibling elements)

key-files:
  created:
    - assets/brand/lafa-homepage-lockup.svg
    - assets/images/lafa-homepage-lockup.png
  modified:
    - scripts/generate-brand-assets.ts

decisions: []

metrics:
  duration: ~25min
  completed: 2026-08-16
---

# Phase 32 Plan 01: Homepage Lockup Source & Generator Step Summary

Promoted the untracked candidate homepage lockup SVG to a canonical brand
source carrying the 3-layer mark, and extended `generate-brand-assets.ts`
with a render step that injects the canonical icon mark into the lockup at
build time, producing a single 3200x1040 PNG.

## What Was Built

**Task 1 — `assets/brand/lafa-homepage-lockup.svg`:** Promoted from the
untracked candidate at `assets/brand/candidates/lafa-homepage-lockup.svg`
(a design file that predates this worktree and was not itself modified).
Carried over the 1600x520 viewBox, `#FFF9F6` background rect, "lafa"
wordmark text, green `#1F7F66` accent dot, and "Learn it. Say it." tagline
verbatim. Replaced the candidate's flat, id-free 2-layer mark with the
canonical 3-layer `mark-depth`/`mark-fill`/`mark-highlight` markup copied
byte-for-byte from `assets/brand/lafa-icon.svg`, wrapped in a newly-added
`id="lockup-mark-slot"` group — the stable handle the generator targets.

**Task 2 — `scripts/generate-brand-assets.ts`:** Added a `buildLockupDoc()`
function that parses the lockup source with the existing `linkedom`
`DOMParser`, locates `[id="lockup-mark-slot"]`, replaces its children with
the already-composed `colorMarkup` (reusing the `mark`/`colorMarkup` values
computed once at the top of `main()` — no second `extractMarkOnly()` call),
and throws a descriptive "source may have changed shape" error naming
`LOCKUP_SOURCE_SVG_PATH` for each of: malformed document, missing slot,
empty slot, or a post-injection serialization missing any of the three mark
layer ids. Added a new render step at the end of `main()` rendering at
3200x1040 (2x the 1600x520 source) with a transparent Resvg background
(the lockup's own `rx="64"` rect already paints `#FFF9F6`), with an explicit
dimension guard mirroring the existing icon-render check.

## Verification

- `npm run generate-assets` exits 0; `assets/images/lafa-homepage-lockup.png`
  confirmed 3200x1040 via `sharp` metadata (hasAlpha: true, as expected —
  transparent canvas with the rect painting the opaque interior).
- `npm run validate-brand` — 20/20 checks pass, all pre-existing checks
  unaffected.
- `npm run typecheck` — clean.
- `npm test` — 251/251 tests pass across 21 suites (no test touches the
  generator; confirms no incidental breakage).
- `git status --porcelain assets/images` after regeneration listed only the
  new `lafa-homepage-lockup.png` — the five pre-existing generated PNGs
  (`icon.png`, `favicon.png`, `splash-icon.png`,
  `android-icon-foreground.png`, `android-icon-monochrome.png`) are
  byte-identical.
- Fail-loud proof: stripped `id="lockup-mark-slot"` from the source with
  `sed`, ran `npm run generate-assets` — exited 1 with
  `Error: assets/brand/lafa-homepage-lockup.svg is missing the mark slot
  with id="lockup-mark-slot" — source may have changed shape`. Restored the
  source from a backup and regenerated — exit 0, `diff` confirmed the
  restored source byte-identical to the pre-test file, and
  `git status --porcelain assets/brand assets/images` showed no unintended
  modifications after the restore-and-regenerate cycle.
- `grep -c 'extractMarkOnly('` on the generator still returns `2`
  (definition + the single existing call in `main()`), proving the lockup
  step reuses the existing extraction rather than adding a second one.

## Deviations from Plan

None — plan executed exactly as written. One environmental note (not a
deviation, not fixed): `assets/brand/candidates/lafa-homepage-lockup.svg`
is untracked in the parent repo and therefore did not exist in this
worktree's checkout; it was read directly from the main repo's working
tree (outside this worktree) as a read-only reference, per the plan's
`read_first` instruction, and was not modified or copied into the worktree
since Task 1 only required using its content as the promotion source.

## Self-Check: PASSED

- FOUND: assets/brand/lafa-homepage-lockup.svg
- FOUND: assets/images/lafa-homepage-lockup.png
- FOUND: scripts/generate-brand-assets.ts (modified)
- FOUND commit 10b0ef3 (Task 1)
- FOUND commit 8705a3a (Task 2)
