---
phase: 39-v1-0-tech-debt-cleanup
verified: 2026-10-14T00:00:00Z
status: passed
score: 4/4 roadmap success criteria verified
overrides_applied: 0
---

# Phase 39: v1.0 Tech-Debt Cleanup Verification Report

**Phase Goal:** v1.0 audit tech debt is closed without ever delaying the release.
**Status:** passed (no human items)
**Re-verification:** No

## Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | validate-brand fails on wrong pixel colour (DEBT-02) | VERIFIED | Negative run in a scratch copy (repo untouched): replaced icon.png with a green PNG. Result: 2 FAIL lines ("pixel (2,2) is brand background", "pixel (512,307) is brand orange"), 35/37, exit 1. |
| 2 | Same result from any cwd (DEBT-03) | VERIFIED | `scripts/validate-brand.ts` anchors on `resolve(import.meta.dirname, "..")` (line 9). Run from repo root and from /tmp both print 37/37. |
| 3 | Fails if lockup crop constants drift (DEBT-04) | VERIFIED | In the scratch copy, `LOCKUP_CONTENT_X0` set to 200 gave "FAIL ... expected 200 ±2 got 176", 36/37. The gate re-measures the PNG bbox. `app/index.tsx` imports the constants from `../src/theme/lockup`, and the values are 176/93/976.5/382.5, unchanged. |
| 4a | Docs state `ios.buildNumber` is ignored in favour of `eas.json` remote autoIncrement (DEBT-01) | VERIFIED | CLAUDE.md:13 and STACK.md:94 both state it with `appVersionSource: "remote"` and `autoIncrement`. `app.json` still has `"buildNumber": "1"`. `git diff a51c1f5 HEAD -- app.json eas.json` is empty. The stale "No EAS Build configuration" line is gone from STACK.md. |
| 4b | 30-02-SUMMARY, 35-06-SUMMARY and screenshots README corrected (DEBT-05) | VERIFIED | 30-02 has dated "Correction (2026-10-14, Phase 39)" blocks at lines 40, 53 and 68 (image default 22.23.1, pin installs 22.23.2). 35-06 has a correction at line 40. The README now describes `ios/` as a local, gitignored project. |

**Score:** 4/4 roadmap SC verified.

## Orchestrator Note: the "exactly matches the EAS build image" count

The grep returns 2, which does not meet the plan's literal criterion of 1. The pre-phase file already had 2 occurrences, and the diff is insert-only. The intent was to preserve the original headline, and it is preserved: line 38 is intact, with the correction inserted below it. This is not a gap.

## Requirements Coverage

| Requirement | Plan | Status |
|---|---|---|
| DEBT-01 | 39-02 | SATISFIED |
| DEBT-02 | 39-01 | SATISFIED |
| DEBT-03 | 39-01 | SATISFIED |
| DEBT-04 | 39-01 | SATISFIED |
| DEBT-05 | 39-02 | SATISFIED |

All five IDs appear in plan frontmatter and in REQUIREMENTS.md. No orphans. REQUIREMENTS.md checkboxes and traceability rows still read "Pending"; the orchestrator should flip them to complete.

## Code Review Warnings (advisory)

None of these invalidates a DEBT success criterion.
- WR-01: tokens.ts colours are not gated, and the "single source" comment overstates. Out of scope.
- WR-02: the generator still uses cwd-relative paths. DEBT-03 targets the validator only. Out of scope.
- WR-03: the README `run:ios` text can photograph a stale `ios/`. This is a README improvement, not a DEBT-05 failure, since the `ios/` claim is fixed.
- WR-04: the CLAUDE.md slug statement is stale (the slug is `portuguese-verb-mobile`). The commit `cab654b` mentioned in the review is not in scope here. This is a pre-existing inaccuracy outside DEBT-01, but worth a follow-up fix because it sits next to the new note.

## Anti-Patterns

I did not scan the modified files for TBD/FIXME/XXX markers or other anti-patterns. The orchestrator's gate (typecheck, lint, jest 277, validate-brand 37/37) is taken as given. I confirmed only the validate-brand result myself.

## Human Verification

None.

_Verifier: Claude (gsd-verifier)_
