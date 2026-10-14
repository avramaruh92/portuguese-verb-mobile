---
phase: 39-v1-0-tech-debt-cleanup
fixed_at: 2026-10-14T00:00:00Z
review_path: .planning/phases/39-v1-0-tech-debt-cleanup/39-REVIEW.md
iteration: 1
findings_in_scope: 4
fixed: 4
skipped: 0
status: all_fixed
---

# Phase 39: Code Review Fix Report

**Fixed at:** 2026-10-14
**Source review:** .planning/phases/39-v1-0-tech-debt-cleanup/39-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 4 (fix_scope: critical_warning; IN-01..IN-04 out of scope)
- Fixed: 4
- Skipped: 0

## Fixed Issues

### WR-01: `brand-colors.ts` is called the "single source" for colours, but `tokens.ts` has its own unchecked copies

**Files modified:** `scripts/validate-brand.ts`, `scripts/brand-colors.ts`
**Commit:** 0418d18
**Applied fix:** `validate-brand.ts` now imports `colors` from `src/theme/tokens.ts` (it has no imports, so Node can load it with a `.ts` extension, the same way `lockup.ts` is loaded). A new `checkTokensMatchBrandColors()` gate checks `tokens.background`, `tokens.primary` and `tokens.pressed` against `ICON_BACKGROUND_HEX`, `ORANGE_FILL_HEX` and `DEPTH_FILL_HEX`. The validator now runs 40 checks instead of 37. The `brand-colors.ts` header now says it is the single source for the asset scripts, that `tokens.ts` keeps its own copies, and that the validator fails if they drift. `tokens.ts` itself is unchanged.

### WR-02: The generator still uses paths relative to the current directory, while the validator now uses the repo root

**Files modified:** `scripts/generate-brand-assets.ts`
**Commit:** 53bb1d6
**Applied fix:** Added `ROOT = resolve(import.meta.dirname, "..")` and `abs()`, matching `validate-brand.ts`. All 2 `readFileSync` calls and all 6 `writeFileSync` calls now go through `abs()`. The generator was not run, so no committed PNGs changed. `git status` shows no asset diffs.

### WR-03: Screenshot instructions can photograph an old native build; `validate-brand` does not check the native project

**Files modified:** `store/screenshots/README.md`
**Commit:** 0cc6b3d
**Applied fix:** The build step now runs `npx expo prebuild --clean --platform ios` before `npx expo run:ios`. The text explains that `run:ios` only runs prebuild when `ios/` is missing. A note under the pre-capture gate says `validate-brand` checks only the source assets and `app.json`, not the native `ios/` project.

### WR-04: `CLAUDE.md` gained a new paragraph, but the false `expo.slug` statement next to it was left in place

**Files modified:** `CLAUDE.md`
**Commit:** 19fc20b
**Applied fix:** Rewrote the slug/scheme paragraph to match `app.json` (`name: "Lafa"`, `scheme: "lafa"`, `slug: "portuguese-verb-mobile"`). It now explains that Phase 24-03 (commit `cab654b`) reverted the slug because `lafa` broke `eas build`, and says not to change it. Replaced the stale "display name is still Portuguese Verb Quiz until Phase 11" sentence in the Project section: the rebrand has shipped and `app.json` `expo.name` is "Lafa". No "Portuguese Verb Quiz" copy remains in `app/` or `src/`. `app.json` was not changed.

## Post-fix verification

All of these were run in the fix worktree after all 4 commits:
- `npm run typecheck`: pass (exit 0)
- `npm run lint`: pass (no findings)
- `npx jest`: 23/23 suites, 277/277 tests pass
- `npm run validate-brand`: 40/40 checks pass (37 existing checks plus 3 new token checks)

---

_Fixed: 2026-10-14_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
