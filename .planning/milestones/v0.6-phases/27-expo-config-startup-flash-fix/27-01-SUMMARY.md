---
phase: 27-expo-config-startup-flash-fix
plan: 01
subsystem: ui
tags: [expo, react-native, app-config, expo-splash-screen, expo-system-ui, expo-status-bar, brand]

# Dependency graph
requires:
  - phase: 25-brand-asset-pipeline
    provides: regenerated splash-icon.png, android-icon-foreground.png, android-icon-monochrome.png
  - phase: 26-theme-palette-update
    provides: brand tokens (colors.background #FFF9F6, colors.text #24201E, colors.surface #F1EFED)

provides:
  - Expo-blue splash background (#208AEF) and adaptive-icon background replaced with the warm Lafa canvas (#FFF9F6)
  - Android adaptive icon now a solid warm background with no separate background-image layer
  - Appearance locked to "light" so the app renders identically under system Dark Mode
  - Root-layout Stack theming (headerStyle/headerTintColor/headerShadowVisible/contentStyle), dark status bar, and runtime root background via expo-system-ui
affects: [28-ui-token-application, 29-brand-validation-release-verification]

# Tech tracking
tech-stack:
  added: [expo-system-ui (first runtime use), expo-status-bar (first use in this repo)]
  patterns:
    - "Root-level Stack screenOptions carries brand headerStyle/headerTintColor/headerShadowVisible/contentStyle so per-screen Stack.Screen options need no edits"
    - "OS-level presentation (root background, status bar) wired in the root layout from theme tokens — never inline hex literals"

key-files:
  created: []
  modified: [app.json, app/_layout.tsx]
  deleted: [assets/images/android-icon-background.png]

key-decisions:
  - "D-01: deleted the orphaned android-icon-background.png (no longer referenced after CONFIG-02 removed backgroundImage) — matches the Phase 25 asset-cleanup precedent"
  - "D-04: dark status bar handled declaratively via <StatusBar style=\"dark\" /> in the root layout, not via expo-status-bar plugin options"
  - "D-05: SystemUI.setBackgroundColorAsync runs in its own mount effect, fire-and-forget with .catch(() => {}) so a native failure can never surface as an unhandled rejection"

patterns-established:
  - "Cold-start brand chrome is owned entirely by app.json (splash/adaptive/appearance) + app/_layout.tsx (headers, status bar, root background) — no per-screen Stack.Screen overrides needed"
  - "Fire-and-forget OS-level cosmetic calls (root background) swallow failures silently, mirroring the existing prefetch() posture in src/dataset/source.ts"

requirements-completed: [CONFIG-01, CONFIG-02, CONFIG-03, CONFIG-04]

# Metrics
duration: 15min
completed: 2026-08-14
---

# Phase 27 Plan 1: Expo Config & Startup Flash Fix Summary

**Expo-blue splash and adaptive-icon backgrounds replaced with the warm Lafa canvas (#FFF9F6), appearance locked to light, and the root layout now themes every native header (warm, dark ink, no hairline), renders a dark status bar, and paints the runtime root background via expo-system-ui — eliminating the unbranded white flash after splash.**

## Performance

- **Duration:** ~15 min (tasks 1-2 + Task 3 human-verify checkpoint + finalization)
- **Started:** 2026-08-13T23:05:11Z (Task 1 commit)
- **Completed:** 2026-08-14T00:20:00+01:00
- **Tasks:** 3 (2 auto + 1 human-verify checkpoint, approved)
- **Files modified:** 3 (2 modified, 1 deleted)

## Accomplishments

- `app.json` now declares a `#FFF9F6` splash background with a 160pt splash mark (CONFIG-01), a warm solid Android adaptive-icon background with the `backgroundImage` key removed (CONFIG-02 + D-01 asset deletion), and a forced `"light"` appearance (CONFIG-03). No Expo blue (`#208AEF`) or old Expo-blue-tinted (`#E6F4FE`) hex remains anywhere in `app.json`.
- `app/_layout.tsx` now themes the root `Stack` (`headerStyle` warm, `headerTintColor` ink, `headerShadowVisible: false` to remove the hairline, `contentStyle` warm to kill the white body flash), renders `<StatusBar style="dark" />`, and sets the runtime root background via `SystemUI.setBackgroundColorAsync(colors.background)` in a dedicated mount effect (CONFIG-04, D-02..D-05). Zero hex literals introduced — all values come from `src/theme/tokens.ts`.
- Developer confirmed all four on-device criteria (Task 3 human-verify): dark status bar on all three screens, warm hairline-free headers, no white flash after launch, and light appearance preserved under system Dark Mode.

## Task Commits

Each task was committed atomically:

1. **Task 1: Apply brand values to app.json and delete the orphaned Android background asset** - `82eda9c` (chore)
2. **Task 2: Wire root layout brand theming, dark status bar, and runtime root background** - `021d590` (feat)
3. **Task 3: Confirm branded launch and header chrome on device** - human-verify checkpoint, no file changes (approved by developer)

**Plan metadata:** `docs(27-01): add plan summary` and tracking commits follow this summary (hashes recorded in the Self-Check section below).

_Note: Task 3 was verification-only, so it has no dedicated commit._

## Files Created/Modified

- `app.json` - Splash plugin `backgroundColor` `#208AEF` → `#FFF9F6`, `imageWidth` `76` → `160`; `android.adaptiveIcon.backgroundColor` `#E6F4FE` → `#FFF9F6` with `backgroundImage` removed; `userInterfaceStyle` `"automatic"` → `"light"`
- `app/_layout.tsx` - Added `StatusBar` (expo-status-bar), `SystemUI` (expo-system-ui), and `colors` (src/theme/tokens) imports; extended root `Stack` `screenOptions` with `headerStyle`/`headerTintColor`/`headerShadowVisible`/`contentStyle`; added `<StatusBar style="dark" />` and a dedicated `SystemUI.setBackgroundColorAsync(colors.background)` mount effect (`.catch(() => {})`)
- `assets/images/android-icon-background.png` - Deleted (orphaned after CONFIG-02 removed the `backgroundImage` key; confirmed zero non-.planning references before deletion)

## Decisions Made

- Followed the plan's decisions D-01, D-02, D-03, D-04, D-05 exactly as specified in 27-CONTEXT.md — no executor-level deviation was needed.
- `headerShadowVisible: false` and `contentStyle` were both applied even though D-02/D-03 in CONTEXT.md only discussed the two color keys — CONFIG-04 names all four Stack options, and both are required to remove the hairline and the white body flash respectively.

## Deviations from Plan

None - plan executed exactly as written. Tasks 1 and 2 auto tasks ran clean with no auto-fix needed; Task 3's checkpoint was approved on first review with no re-work.

## Issues Encountered

None. The Task 3 on-device verification passed all four criteria on first review (dark status bar, warm hairline-free headers, no white flash, light appearance under system Dark Mode). Per the plan's Task 3 note, the actual splash-screen color is only verifiable in a prebuild/EAS build and is deferred to Phase 29's manual release-build check — the `app.json` values were confirmed correct by Task 1's automated assertion instead.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 27 (CONFIG-01..04) complete and verified — the Expo-blue/unbranded cold-start surface is eliminated.
- Ready for Phase 28 (UI Token Application), which applies the new palette across every screen/component (`#208AEF`, `#E6F4FE`, `#E8663D`, `#FCE4DA`, `#2FA84F` are now only absent from `app/`/`src/` source; a repo-wide search of those old-palette hexes should return zero hits in source after Phase 28).
- Phase 29 (Brand Validation & Release Verification) will perform the end-to-end splash/icon check on a real EAS build — the one item this phase could not verify in Expo Go.

## Self-Check: PASSED

- [x] `27-01-SUMMARY.md` exists on disk
- [x] Task commits present: `82eda9c` (Task 1), `021d590` (Task 2)
- [x] Summary commit present: `bb89933` (docs(27-01): add plan summary)
- [x] Tracking commit present: `6209c8a` (docs(27-01): mark CONFIG-01..04 complete, close out plan tracking)
- [x] `app.json`, `app/_layout.tsx`, `src/**`, `assets/**` unmodified in the working tree
- [x] `app.json` assertions pass (`#FFF9F6` splash/adaptive, no `backgroundImage`, `userInterfaceStyle: "light"`, no `#208AEF`/`#E6F4FE`)
- [x] ROADMAP.md Phase 27 row `1/1 Complete`, plan checkbox checked
- [x] REQUIREMENTS.md CONFIG-01..04 marked Complete

---
*Phase: 27-expo-config-startup-flash-fix*
*Completed: 2026-08-14*
