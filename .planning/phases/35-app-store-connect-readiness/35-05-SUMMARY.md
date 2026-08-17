---
phase: 35-app-store-connect-readiness
plan: 05
subsystem: infra
tags: [app-store-screenshots, ios-simulator, store-assets]

requires:
  - phase: 30-34 (brand assets, homepage lockup, quiz press-state fix, brand validation)
    provides: final branded app state to photograph
provides:
  - "store/screenshots/README.md capture checklist (dimensions, filenames, states, commands, alpha remediation)"
affects: [35-07 (App Store Connect submission — manually uploads the three PNGs to the 6.9-inch bucket)]

tech-stack:
  added: []
  patterns:
    - "Constants-as-spec checklist style mirrored from scripts/validate-brand.ts (explicit expected values, not prose approximations)"

key-files:
  created:
    - store/screenshots/README.md
  modified: []

key-decisions:
  - "Task 1 (write capture checklist) completed and committed. Task 2 (actually capture the three screenshots) is a blocking checkpoint:human-verify — it requires the developer to physically drive the Simulator UI (select tenses, tap an answer, finish a quiz session), which cannot be automated. Execution paused there rather than guessing at UI navigation or fabricating screenshots."

requirements-completed: []

duration: ~10min (Task 1 only)
completed: 2026-08-17
---

# Phase 35 Plan 05: App Store Screenshots Summary

**Authored `store/screenshots/README.md` as a precise, constants-as-spec capture checklist (1320x2868, no alpha, three named states/filenames, exact `xcrun`/`sips` commands, `sharp` alpha-remediation path) — actual screenshot capture is paused at a blocking checkpoint pending the developer physically driving the Simulator UI.**

## Performance

- **Duration:** ~10 min
- **Tasks:** 1 of 3 completed (Task 2 is a blocking human-verify checkpoint requiring live UI interaction; Task 3 depends on Task 2's output)
- **Files modified:** 1 created

## Accomplishments
- `store/screenshots/README.md`: states exact required dimensions (1320x2868), absent-alpha requirement, PNG format, iPhone 16 Pro Max (or equivalent 6.9" simulator), the `npx expo run:ios --device "iPhone 16 Pro Max"` build command, `npm run validate-brand` pre-capture gate, the three required filenames (`01-setup.png`, `02-quiz-locked.png`, `03-results.png`) with exact UI state each must show, the literal `xcrun simctl io booted screenshot` capture command and `sips -g pixelWidth -g pixelHeight -g hasAlpha` verification command with expected output values spelled out, the `sharp` `removeAlpha()` remediation path, explicit D-10 exclusions (no captions, no device frames, no Fastlane/frameit, no marketing background), capture hygiene notes (clean status bar, no dev overlay/inspector visible), and a usage note pointing to plan 35-07
- All Task 1 automated verification checks pass (grep for `1320`, `2868`, `hasAlpha`, all three filenames, `simctl io booted screenshot`)

## Task Commits

1. **Task 1: Write the screenshot capture checklist** - `d05d877` (docs)

**Plan metadata:** not yet created — plan is paused at Task 2's checkpoint, so the final `docs(35-05): complete plan` metadata commit has not been made. It will be created after the checkpoint resolves, Task 3 (alpha/dimension verification + record) runs, and STATE.md/ROADMAP.md are updated.

## Files Created/Modified
- `store/screenshots/README.md` - Capture checklist: required bucket/dimensions, device, build/capture/verify commands, three required states, alpha remediation, D-10 exclusions

## Decisions Made
- Followed the plan's explicit framing that Task 2 requires the developer to physically drive the Simulator UI (navigate to Setup with tenses selected, tap an answer to lock a choice, finish a 10-question session to reach Results) — this cannot be scripted/automated by the executor, so it is a genuine `checkpoint:human-verify` with `gate="blocking"`, not an auto-approvable "verify already-done work" gate. No screenshots were fabricated or guessed at.

## Deviations from Plan

None - Task 1 executed exactly as written.

## Issues Encountered

None for Task 1. Task 2 is a `checkpoint:human-verify` with `gate="blocking"` requiring live human interaction with the iOS Simulator. Execution stopped here, awaiting the developer to:

1. Confirm `npm run validate-brand` exits 0 (Claude will run this)
2. Have Claude boot a 6.9-inch simulator (iPhone 16 Pro Max) and build/install via `npx expo run:ios --device "iPhone 16 Pro Max"`
3. Navigate to the Setup screen with at least two tenses selected (developer action), then Claude captures `01-setup.png`
4. Start the quiz and tap one answer so the choice locks in (developer action), then Claude captures `02-quiz-locked.png`
5. Finish the 10-question session to reach Results with a score (developer action), then Claude captures `03-results.png`
6. Claude verifies each capture is 1320x2868 immediately after taking it
7. Developer visually confirms each image (correct state, no dev overlay/inspector/warning box, branding correct) before approving

Task 3 (alpha-channel verification + recording the "Verified capture record" in the README) depends on Task 2's output and has not been attempted.

## User Setup Required

**Awaiting developer availability to drive the Simulator UI through Setup → Quiz (lock one answer) → Results** while Claude runs the build, boot, and capture commands around those UI interactions. No dashboard/account configuration needed — this is a one-time local capture session.

## Next Phase Readiness

Task 1's checklist is complete, committed, and reusable for any future recapture. Task 2 and Task 3 cannot proceed without the developer physically interacting with the Simulator. Once the three PNGs are captured and verified alpha-free at 1320x2868, this plan's SUMMARY will be updated with the "Verified capture record" details, and plan 35-07 can upload the set to App Store Connect's 6.9-inch bucket.

---
*Phase: 35-app-store-connect-readiness*
*Completed: PARTIAL — Task 1 only; Task 2 (capture) and Task 3 (alpha/dimension verification) pending human checkpoint approval and live UI interaction*
