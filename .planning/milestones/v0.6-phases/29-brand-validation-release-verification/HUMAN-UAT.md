# Phase 29 — Human UAT

**Status: APPROVED by developer, 2026-08-15.**

Consolidated from `checkpoint:human-verify` tasks deferred during execution
(`workflow.human_verify_mode = end-of-phase`, the project default).

## Build and install the EAS preview build (from Phase 21/24 release config)

**Build:** `preview` profile, iOS, build ID `f86867ab-5f84-4ec4-83ca-ad0fe26b563b`,
finished 2026-08-15T22:21:44Z.
Artifact: https://expo.dev/artifacts/eas/eDUoPQ-c_KGcS0MczAZprhYXQJ2SDLfMU0eDksOzmmw.ipa
Build page: https://expo.dev/accounts/avram.aruh/projects/portuguese-verb-mobile/builds/f86867ab-5f84-4ec4-83ca-ad0fe26b563b

**What was built:** An installable iOS build produced via EAS's `preview`
build profile (internal distribution, not App Store submission), covering
all brand work shipped in Phases 25-28.

**How to verify:**
1. Run `eas build --profile preview --platform ios` from the repo root.
   This must use the `preview` profile, not `production` (D-04), and must
   build for iOS only — no Android build is produced this phase (D-05).
2. Wait for the build to finish on EAS's cloud infrastructure.
3. Install the build on a real iOS device via the QR code or install URL
   the EAS CLI prints when the build completes.
4. Confirm the installed app's home-screen name reads `Lafa`.
5. Confirm this is the actual EAS preview build — not Expo Go and not a
   dev client build.

## Cold-launch splash color (from Phase 25 assets + Phase 27 config)

**What was built:** `app.json`'s splash screen config now points at the
regenerated `splash-icon.png` on a warm cream (`#FFF9F6`) background,
replacing the old Expo-blue splash.

**How to verify:**
1. Fully kill the app from the app switcher.
2. Cold-launch the app and watch the splash screen closely before the
   Setup screen mounts.
3. Repeat the cold launch at least twice, since a startup-flash
   regression can be intermittent.

**Expected:** A warm cream `#FFF9F6` background with the orange Lafa mark
centered, and at no frame — including the very first frame — an
Expo-blue (`#E6F4FE` / `#208AEF`) flash.

## iOS app icon design (from Phase 25 `icon.png`)

**What was built:** A regenerated `icon.png` (1024x1024, opaque, no alpha
channel) derived from the supplied Lafa SVG mark, replacing the default
Expo icon.

**How to verify:**
1. View the icon on the home screen.
2. View the icon in the app switcher.
3. View the icon in Settings > Lafa.

**Expected:** The supplied Lafa SVG mark (orange on warm cream), correctly
filled to the iOS rounded-square mask with no transparent corners, no
white/black letterbox border, and no double-rounding artifact.

## Android adaptive-icon mask fit (from Phase 25 `android-icon-foreground.png`) — no Android build required

**What was built:** A regenerated `android-icon-foreground.png` (1024x1024,
transparent, mark centered in the Android safe zone), verified against
static adaptive-icon mask previews rather than an installed Android build
(D-06).

**How to verify:**
1. Open `assets/images/android-icon-foreground.png` in Android Studio's
   Image Asset tool (or an equivalent online adaptive-icon mask
   previewer).
2. Pair it with a `#FFF9F6` background layer.
3. Preview the circle, rounded-square, and squircle masks.

**Expected:** The mark stays centered and fully inside every mask with
visible margin — no clipping of the mark's edges. No Android
device/emulator build is produced for this phase.

## Cross-screen palette consistency (from Phase 26 tokens + Phase 28 token application)

**What was built:** Setup, Quiz, Results, both feedback modals,
`OfflinePill`, and `ExplanationPanel` all now consume the updated
`src/theme/tokens.ts` palette instead of the old Expo-blue-adjacent
hardcoded hex values.

**How to verify:**
1. On the installed preview build, walk Setup -> start a quiz -> answer
   questions (including a wrong answer so the error color and
   `ExplanationPanel` show) -> Results.
2. Open the "Report a problem" modal.
3. Open the product-feedback modal.

**Expected:** Brand orange `#F2643E` primaries, warm cream `#FFF9F6`
backgrounds, teal `OfflinePill` if the local fallback is triggered, and
zero Expo-blue (`#208AEF` / `#E6F4FE`) surfaces anywhere.

**Acceptance criteria:**
- A `preview`-profile EAS build (not Expo Go, not a dev client) was
  installed on a real iOS device
- Two consecutive cold launches show the warm Lafa splash (`#FFF9F6`
  background, orange mark) and never an Expo-blue flash
- The iOS app icon uses the supplied Lafa SVG design with no transparent
  corners, letterboxing, or double-rounding
- The Android adaptive icon (`android-icon-foreground.png`) stays
  centered and unclipped under circle, rounded-square, and squircle mask
  previews
- Setup, Quiz, Results, and both feedback modals all show the new palette
  consistently, with no Expo-blue surface anywhere

**Resume signal:** Type "approved" or describe which element behaved
incorrectly.
