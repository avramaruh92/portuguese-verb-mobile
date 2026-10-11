---
phase: 35-app-store-connect-readiness
plan: 05
subsystem: infra
tags: [app-store-screenshots, ios-simulator, store-assets]

requires:
  - phase: 30-34 (brand assets, homepage lockup, quiz press-state fix, brand validation)
    provides: final branded app state to photograph
provides:
  - "store/screenshots/{01-setup,02-quiz-locked,03-results}.png — 1320x2868, alpha-free, final-branded-build screenshots"
  - "store/screenshots/README.md capture checklist + verified capture record"
affects: [35-07 (App Store Connect submission — manually uploads the three PNGs to the 6.9-inch bucket)]

tech-stack:
  added: []
  patterns:
    - "Constants-as-spec checklist style mirrored from scripts/validate-brand.ts (explicit expected values, not prose approximations)"
    - "sharp's removeAlpha() reused from scripts/validate-brand.ts for one-off image remediation outside the build pipeline"

key-files:
  created:
    - store/screenshots/README.md
    - store/screenshots/01-setup.png
    - store/screenshots/02-quiz-locked.png
    - store/screenshots/03-results.png
  modified: []

key-decisions:
  - "iPhone 16 Pro Max was not an available simulator runtime on the capture machine; iPhone 17 Pro Max was substituted after directly verifying it captures at the exact required 1320x2868 (the plan explicitly frames the dimension, not the device name, as the contract)."
  - "A stale ios/Pods lockfile blocked the native build (CocoaPods version-mismatch errors cascading across several Expo pods). Resolved via Rule 3 (blocking-issue auto-fix): deleted ios/Pods + ios/Podfile.lock and ran a clean pod install — no package versions were changed, no new dependencies added."
  - "Screenshots were ultimately captured via the Simulator app's own screenshot feature (Cmd+S / hardware menu) rather than the originally planned xcrun simctl io booted screenshot, because the developer used that path directly. Both produce identical-resolution PNGs, but the Simulator app's own tool adds an alpha channel that simctl's screenshot command does not — this was caught and fixed via the plan's own sharp removeAlpha() remediation step, so the final artifacts meet the same alpha-free bar either way."
  - "From 5 candidate captures, only one satisfied the plan's explicit '01-setup.png must show at least two tenses selected' criterion — two earlier Setup captures (0 tenses selected, 1 tense selected) were rejected rather than used as a lesser match."

requirements-completed: [STORE-06]

duration: ~55min
completed: 2026-08-17
---

# Phase 35 Plan 05: App Store Screenshots Summary

**Captured three alpha-free, 1320x2868 App Store screenshots (Setup with 2+ tenses selected, Quiz with a locked-in incorrect/correct feedback state plus explanation panel, Results with a 9/10 score) from a real native `npx expo run:ios` build on an iPhone 17 Pro Max simulator, with a written capture checklist and verified capture record.**

## Performance

- **Duration:** ~55 min (Task 1 ~10 min; Task 2 build/capture/troubleshooting ~40 min; Task 3 ~5 min)
- **Tasks:** 3 of 3 completed
- **Files modified:** 4 created (1 README, 3 PNGs)

## Accomplishments
- `store/screenshots/README.md`: precise capture checklist (exact 1320x2868 dimensions, absent-alpha requirement, PNG format, device, build/capture/verify commands, three required filenames/states, `sharp` alpha-remediation path, D-10 exclusions, capture hygiene notes) plus a `## Verified capture record` section documenting the actual device used, why it differed from the plan's reference device, why alpha remediation was needed, and per-file verification values
- `npm run validate-brand` confirmed 21/21 passing immediately before capture, proving the branded state photographed is not a regression
- Resolved a stale CocoaPods lockfile blocking the native build (Rule 3 auto-fix — `rm -rf ios/Pods ios/Podfile.lock && pod install`)
- Booted and verified an `iPhone 17 Pro Max` simulator captures at exactly the required 6.9-inch bucket resolution (1320x2868) before using it as a substitute for the unavailable `iPhone 16 Pro Max`
- Reviewed 6 total candidate Simulator captures across the session; selected the 3 that best matched each required state and rejected 2 Setup-screen candidates that didn't meet the "at least two tenses selected" bar
- Remediated alpha channel on all three final PNGs via `sharp`'s `removeAlpha()` (the same library `scripts/validate-brand.ts` uses), reverified dimensions unchanged afterward
- Full plan-level verification passed: three PNGs at 1320x2868/no-alpha, README has both checklist and verified-capture-record sections, `npm run validate-brand` exits 0, `npm run typecheck && npm test && npm run lint` all exit 0 (no source code touched — 261/261 tests pass)

## Task Commits

1. **Task 1: Write the screenshot capture checklist** - `d05d877` (docs)
2. **(interim) Record partial summary at Task 2 checkpoint** - `6fc0a07` (docs)
3. **Task 2: Capture the three screenshots on a 6.9-inch simulator** - `6813027` (feat)
4. **Task 3: Verify and record alpha-free status for all three screenshots** - `008a6a3` (docs)

## Files Created/Modified
- `store/screenshots/README.md` - Capture checklist + verified capture record
- `store/screenshots/01-setup.png` - Setup screen, "Completed past" + "Imperfect past" selected, Mixed verb mode, Start Quiz enabled
- `store/screenshots/02-quiz-locked.png` - Quiz 1/10, locked-in incorrect answer (red) with correct answer highlighted (green) and explanation panel visible
- `store/screenshots/03-results.png` - Results screen, 9/10 score

## Decisions Made
- Substituted `iPhone 17 Pro Max` for the plan's reference `iPhone 16 Pro Max` device (unavailable on the capture machine's installed runtimes), after directly confirming it captures at the exact 1320x2868 contract dimension — per the plan's own framing that the dimension, not the device name, is what matters.
- Fixed a stale `ios/Pods`/`Podfile.lock` blocking `npx expo run:ios` via a clean reinstall (Rule 3 blocking-issue auto-fix) — no dependency versions changed, no new packages added.
- Accepted that captures came from the Simulator app's own Cmd+S screenshot tool (developer-driven) rather than the originally scripted `xcrun simctl io booted screenshot`, since both produce equivalent-resolution output and the plan's own alpha-remediation step exists precisely to handle exactly this kind of discrepancy (Cmd+S-sourced PNGs carry alpha; `simctl`-sourced ones don't).
- Rejected two Setup-screen candidates that didn't meet the plan's explicit "at least two tenses selected" acceptance criterion, rather than using a lesser match, and requested (and received) a corrected recapture before proceeding.

## Deviations from Plan

**1. [Rule 3 - Blocking issue] Stale CocoaPods lockfile blocked the native build**
- **Found during:** Task 2, first `npx expo run:ios` attempt
- **Issue:** `pod install --repo-update` failed with a version-mismatch error for `ExpoFileSystem`; the suggested single-pod `pod update` fix cascaded into further mismatches (`ExpoModulesCore`, etc.)
- **Fix:** Deleted `ios/Pods/` and `ios/Podfile.lock`, then ran a clean `pod install` from the `ios/` directory. No package.json/package versions changed.
- **Files modified:** `ios/Pods/` (regenerated, gitignored), `ios/Podfile.lock` (regenerated, gitignored) — neither is tracked in this repo's git history
- **Verification:** `npx expo run:ios --device "iPhone 17 Pro Max"` subsequently built and installed successfully
- **Commit:** not applicable (gitignored build artifacts, no source change)

**2. [Rule 1 - Bug/expected-behavior mismatch] Simulator app's Cmd+S screenshots carry an alpha channel unlike `xcrun simctl io ... screenshot`**
- **Found during:** Task 2/3, verifying the developer-provided captures
- **Issue:** All 5-6 candidate captures reported `hasAlpha: yes` via `sips`, even though the plan's primary capture path (`xcrun simctl io booted screenshot`) does not add alpha
- **Fix:** Applied the plan's own pre-defined remediation (`sharp`'s `removeAlpha()`) to the 3 selected files; reverified dimensions unchanged and alpha absent afterward
- **Files modified:** `store/screenshots/01-setup.png`, `02-quiz-locked.png`, `03-results.png`
- **Verification:** `sips -g hasAlpha` reports `no` for all three post-remediation; `sips -g pixelWidth -g pixelHeight` unchanged at 1320x2868
- **Commit:** `6813027`

**Total deviations:** 2 auto-fixed (1 blocking-issue/Rule 3, 1 bug/Rule 1). **Impact:** Neither affected the final deliverable's correctness — both were resolved using paths the plan itself anticipated (clean pod reinstall is a standard Expo troubleshooting step; alpha remediation via `sharp` was explicitly specified in the plan for exactly this scenario).

## Issues Encountered

None outstanding. Both issues above were resolved within the plan's own guardrails.

## User Setup Required

None. No dashboard/account configuration needed — this was a one-time local capture session.

## Next Phase Readiness

All three PNGs are captured, verified, and committed. Plan 35-07 can upload `store/screenshots/{01-setup,02-quiz-locked,03-results}.png` directly to App Store Connect's 6.9-inch iPhone screenshot bucket. `store/screenshots/README.md` documents the exact procedure (including the device substitution and alpha-remediation caveats discovered this session) so the set can be regenerated identically if any screen's visuals change before submission.

---
*Phase: 35-app-store-connect-readiness*
*Completed: 2026-08-17*
