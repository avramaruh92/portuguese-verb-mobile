---
phase: 32-homepage-lockup
verified: 2026-10-11T12:00:00Z
status: passed
score: 12/12 must-haves verified
overrides_applied: 0
---

# Phase 32: Homepage Lockup Verification Report

**Phase Goal:** The Setup screen shows a branded image lockup instead of a plain-text title
**Verified:** 2026-10-11
**Status:** passed
**Re-verification:** No (initial verification; no earlier VERIFICATION.md existed)

## Goal Achievement

### Observable Truths

Roadmap success criteria (SC) come first, then the PLAN frontmatter truths from 32-01 and 32-02.

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| SC1 | `assets/brand/lafa-homepage-lockup.svg` is promoted as the canonical homepage lockup source | VERIFIED | The file exists (6792 B) with a 1600x520 viewBox, the `#FFF9F6` rect, the `lafa` wordmark, the `#1F7F66` dot and the "Learn it. Say it." tagline. It contains `id="lockup-mark-slot"`. The generator reads it through `LOCKUP_SOURCE_SVG_PATH` (generate-brand-assets.ts:13, :327). |
| SC2 | `scripts/generate-brand-assets.ts` produces `assets/images/lafa-homepage-lockup.png` from that source | VERIFIED | `buildLockupDoc()` (l.148) injects the mark. The render step (l.324-340) uses `fitTo` width 3200 and a dimension guard, then calls `writeFileSync(LOCKUP_OUTPUT_PATH, ...)`. Measured with sharp, the PNG on disk is 3200x1040. `npm run validate-brand` passes `lafa-homepage-lockup.png dimensions -> 3200x1040`. |
| SC3 | `app/index.tsx` renders the lockup as a responsive `Image` in place of the old plain `Text` title | VERIFIED | `Image` is imported (l.2) and rendered with `require("../assets/images/lafa-homepage-lockup.png")` (l.110). `grep 'heading\|>Lafa<'` finds nothing, so the old Text title is gone. Size comes from aspect-locked constants derived from the source geometry (D-03: fixed aspect ratio with explicit width/height). See the note on truth 7. |
| 4 | The lockup source carries the 3-layer canonical mark (mark-depth/mark-fill/mark-highlight) (D-01) | VERIFIED | All three ids are present inside `lockup-mark-slot`, so the flat 2-layer candidate mark has been replaced. |
| 5 | A single 3200x1040 PNG is produced, with no @1x/@2x/@3x variants (D-03) | VERIFIED | `assets/images/` contains only `lafa-homepage-lockup.png`, with no density variants. |
| 6 | The lockup mark comes from `lafa-icon.svg` at render time (D-02) | VERIFIED | `buildLockupDoc(lockupSvg, colorMarkup)` reuses the already-composed mark. `grep -c 'extractMarkOnly('` returns 2 (the definition plus one call), so no second extraction was added. |
| 7 | The generator throws a descriptive error when the mark slot is missing, instead of writing a malformed PNG | VERIFIED | The code throws "source may have changed shape" for a malformed document (l.154/161), a missing slot (l.168), an empty slot (l.174) and missing layer ids after injection (l.184). I did not re-run the fail-loud test because it would modify the source. Read-only code inspection is enough here. |
| 8 | The five existing generated PNGs were not changed by the lockup step | VERIFIED | The SUMMARY's git-status proof is consistent with the current tree: `git status --porcelain` is clean, and validate-brand passes on all five assets (dimensions, and no alpha on icon.png). |
| 9 | The Setup screen shows the lockup where the "Lafa" text used to be (D-04) | VERIFIED | The lockup wrapper is the first element after `<OfflinePill />` in the container (l.102-123), which is where the old heading sat. The developer approved it on-device, and it shipped in Lafa 1.0.0 and the Phase 35 screenshots. |
| 10 | The lockup scales without cropping content and never collapses to zero height | VERIFIED (with deviation note) | The height is fixed at `LOCKUP_HEIGHT = 110`, so it cannot collapse. The `overflow:hidden` crop removes only the blank `#FFF9F6` margin. I measured the non-background bounding box independently (tolerance 6/channel, alpha >= 200) and got 176,93 to 977,383 in 1600-space. The code constants are 176,93 to 976.5,382.5, a 0.5 source-unit difference (about 0.19pt on screen, antialiased edge only). No glyph or mark content is clipped. The deviation: the plan's literal sizing (`width:"100%"`, `aspectRatio:1600/520`) was replaced by a fixed 304x110pt crop box after 5 developer-approved on-device rounds. |
| 11 | VoiceOver/TalkBack announces the lockup as an image labelled "Lafa — Learn it. Say it." | VERIFIED | The outer View has `accessible`, `accessibilityRole="image"` and `accessibilityLabel="Lafa — Learn it. Say it."`. The inner Image has `accessibilityElementsHidden` and `importantForAccessibility="no-hide-descendants"`, so the lockup is announced once. The developer confirmed this with VoiceOver on-device (SUMMARY 32-02). |
| 12 | The vertical rhythm below the lockup stays `spacing.lg` | VERIFIED | `styles.lockupCrop.marginBottom: spacing.lg` (l.230), and `spacing.lg = 24` in tokens. |

**Score:** 12/12 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `assets/brand/lafa-homepage-lockup.svg` | Canonical lockup source with `lockup-mark-slot` | VERIFIED | Exists, is substantive and contains the slot. It is read by the generator. |
| `scripts/generate-brand-assets.ts` | `buildLockupDoc()` and the lockup render step | VERIFIED | Contains `LOCKUP_OUTPUT_PATH`, is wired into `main()` and has the dimension guard. |
| `assets/images/lafa-homepage-lockup.png` | Rendered lockup | VERIFIED | 3200x1040 with alpha. It is consumed by `app/index.tsx` and gated by `scripts/validate-brand.ts` (Phase 34). |
| `app/index.tsx` | Image lockup replacing the Text heading | VERIFIED | Contains `lafa-homepage-lockup.png` and renders inside the Setup container. |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| generate-brand-assets.ts | assets/brand/lafa-homepage-lockup.svg | `readFileSync(LOCKUP_SOURCE_SVG_PATH)` | WIRED | l.13, l.327 |
| generate-brand-assets.ts main() | composeMark colorMarkup | `buildLockupDoc(lockupSvg, colorMarkup)` | WIRED | l.328 |
| app/index.tsx | assets/images/lafa-homepage-lockup.png | `require("../assets/images/lafa-homepage-lockup.png")` | WIRED | l.110 |
| app/index.tsx lockup style | src/theme/tokens.ts | `marginBottom: spacing.lg` | WIRED | The style name is `lockupCrop`, not the planned `lockup`. The link is the same. |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| app/index.tsx lockup Image | static `require()` asset | generated PNG (3200x1040, content bbox measured) | Yes | FLOWING |

### Behavioral Spot-Checks

All checks ran under Node v22.23.2 via `nvm use`.

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Typecheck clean | `npm run typecheck` | `tsc --noEmit` exit 0 | PASS |
| Test suite | `npm test` | 22/22 suites, 261/261 tests | PASS |
| Brand gate, including lockup dimensions | `npm run validate-brand` | 21/21 checks passed, including `lafa-homepage-lockup.png dimensions -> 3200x1040` | PASS |
| PNG metadata | `sharp(...).metadata()` | `3200 1040 hasAlpha=true` | PASS |
| Crop box covers all content | sharp raw pixel bbox scan | 176,93 to 977,383, matching the code constants within 0.5 units | PASS |
| Phase commits exist | `git cat-file -t` 10b0ef3, 8705a3a, a790bcb, e7a090b | all `commit` | PASS |

### Probe Execution

None. The phase does not declare any probes.

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| LOCKUP-01 | 32-01 | `assets/brand/lafa-homepage-lockup.svg` is promoted as the canonical homepage lockup source | SATISFIED | Truths SC1 and 4 |
| LOCKUP-02 | 32-01 | `generate-brand-assets.ts` adds a lockup render step producing `assets/images/lafa-homepage-lockup.png` | SATISFIED | Truths SC2 and 5-8. validate-brand gates 3200x1040. |
| LOCKUP-03 | 32-02 | The plain `Text` title in `app/index.tsx` is replaced with a responsive `Image` lockup | SATISFIED | Truths SC3 and 9-12. Approved on-device and shipped in 1.0.0. |

No requirements are orphaned. REQUIREMENTS.md maps only LOCKUP-01..03 to Phase 32, and plans claim all three.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| app/index.tsx | 36-48 | The crop-box constants were measured by hand from the current PNG | Info | If the lockup SVG geometry changes, someone must re-measure these values. A code comment at l.31-35 says so, and validate-brand does not gate them. This is acceptable now that D-04 locks the source. |
| app/index.tsx | 225-227 | Fixed 304x110pt box instead of width-relative sizing | Info | It fits every supported iPhone width: at 375pt and up, 343pt is available after `spacing.md` padding. "Responsive" here means aspect-locked with explicit dimensions, as D-03 specifies. |

`app/index.tsx`, `scripts/generate-brand-assets.ts` and the lockup SVG contain no TBD, FIXME, XXX, TODO or HACK markers.

### Human Verification Required

None outstanding. Visual layout, centering, sizing and the single VoiceOver announcement were approved by the developer on-device during the 32-02 checkpoint after 5 iteration rounds (STATE.md decision log). The lockup has since shipped through App Store review in Lafa 1.0.0 and appears in the Phase 35 screenshots.

### Gaps Summary

There are no gaps. All three roadmap success criteria and all three LOCKUP requirements hold in the current codebase. The only change from plan wording is in 32-02: `width:"100%"` with `aspectRatio` became a render-time crop to the measured content bounding box. The SUMMARY documents this, the developer approved it, and I confirmed independently that the crop removes only blank background margin. The locked source SVG was not modified, which respects D-04.

---

_Verified: 2026-10-11_
_Verifier: Claude (gsd-verifier)_
