# App Store Screenshots — Capture Checklist

This directory holds the App Store Connect screenshot set for the 6.9-inch
iPhone bucket. Style is **plain iOS Simulator captures only** (D-10): no
captions, no text overlays, no device frame overlays, no Fastlane `frameit`,
no marketing background, no editing beyond the alpha-remediation step below.

## Required bucket

| Property | Expected value |
|----------|-----------------|
| Bucket | 6.9-inch iPhone, portrait |
| Dimensions | **1320 x 2868 pixels** (exact) |
| Alpha channel | **Must be absent** |
| Format | PNG |

The dimension is the contract, not the device name — any 6.9-inch simulator
that captures at exactly 1320x2868 satisfies this checklist. As of this
writing, iPhone 16 Pro Max is the reference device.

## Simulator device

`iPhone 16 Pro Max` (or another 6.9-inch device that captures at exactly
1320x2868).

## Build command

Build and install a real native build from the checked-in `ios/` project
(not Expo Go), so the shipped branding is what gets photographed:

```bash
npx expo run:ios --device "iPhone 16 Pro Max"
```

## Pre-capture gate

Run this and require exit 0 **before** capturing anything. If it fails, stop
— the screenshots would photograph a regression:

```bash
npm run validate-brand
```

## Required files and states

| Filename | State to capture |
|----------|-------------------|
| `01-setup.png` | Setup screen with the branded homepage lockup visible and at least two tenses selected, so the picker reads as interactive rather than empty. |
| `02-quiz-locked.png` | A quiz question with a choice tapped and locked in, showing the correct/incorrect feedback state (and the explanation panel if it is on screen at that point). |
| `03-results.png` | The Results screen showing a completed score. |

No other states, filenames, or shots (e.g. no separate Explanation-panel
shot) — exactly these three per D-11.

## Capture command (per shot)

```bash
xcrun simctl io booted screenshot store/screenshots/<name>.png
```

## Verification command (per shot)

```bash
sips -g pixelWidth -g pixelHeight -g hasAlpha store/screenshots/<name>.png
```

Expected output values:

```
pixelWidth: 1320
pixelHeight: 2868
hasAlpha: no
```

## Alpha remediation

If `hasAlpha: no` is **not** reported, re-save the PNG through `sharp`'s
`removeAlpha()` (the same library `scripts/validate-brand.ts` already uses)
and re-run the verification command rather than uploading as-is. Do not crop,
resize, or recolor — removing the alpha channel is the only permitted
transformation, and the pixel dimensions must remain 1320x2868 afterward.

## Explicit exclusions (D-10)

- No captions or text overlays
- No device frame overlays
- No Fastlane / `frameit`
- No marketing background
- No editing beyond the alpha remediation step above

## Capture hygiene

- The status bar should look clean (no low-battery, no debug overlays).
- The React Native dev overlay/inspector must not be visible in any shot.
- If a captured file is not 1320x2868, the wrong simulator was used —
  recapture on a 6.9-inch device rather than resizing (resizing violates the
  no-editing rule and degrades quality).

## Usage

These files are uploaded by hand into App Store Connect's 6.9-inch bucket in
plan 35-07. The set must be recaptured if any screen's visuals change.
