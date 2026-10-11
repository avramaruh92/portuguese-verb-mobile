# Stack Research

**Domain:** Brand-asset pipeline hardening (SVG-by-id parsing) + Apple App Store submission readiness (screenshots, metadata, App Review)
**Researched:** 2026-08-16
**Confidence:** MEDIUM-HIGH (Context7 not used — no library-doc lookup needed beyond what's already installed; findings verified via official Apple/Expo docs + multiple current-dated sources)

## Recommended Stack

### Core Technologies (new additions only)

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|------------------|
| `linkedom` | `^0.18.x` | Parse `assets/brand/candidates/lafa-icon-warm-bold.svg` as a real DOM so layers can be selected by stable `id`/`data-*` attribute instead of counting `fill="#F2643E"` occurrences | Lightweight (no native deps, pure JS), gives a standard `DOMParser` + `document.getElementById()`/`querySelectorAll()` API that mirrors browser SVG DOM semantics — directly replaces the brittle `svg.split(MARK_FILL).length - 1` counting in `extractMarkOnly()` (`scripts/generate-brand-assets.ts:37`) with `doc.getElementById("mark-shadow")`/`doc.getElementById("mark-primary")` lookups. Actively maintained, used widely for headless SVG/HTML processing in Node build scripts. |
| Manual `id` attributes on `assets/brand/candidates/lafa-icon-warm-bold.svg`'s `<path>`/`<g>` elements | n/a (source-file convention, not a package) | Give the generator stable anchors to select against | **Verified by reading the actual candidate file**: none of the current SVGs (`lafa-icon-warm-bold.svg`, `lafa-homepage-lockup.svg`) have `id` attributes on their shape layers today — only the root `<svg>` has `id="title"`/`id="desc"` on `<title>`/`<desc>`. "Stable layer ids" is new work this milestone must do to the SVG source itself (e.g. `id="mark-shadow-layer"` on the `opacity="0.18"` drop-shadow `<g>`, `id="mark-primary"` on the `#F2643E` outer path, `id="mark-accent"` on the inner cutout path), not just a parsing-library swap. Do this before wiring the new parser. |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@resvg/resvg-js` | `^2.6.2` (already installed — no change) | Rasterize the id-selected SVG fragment to PNG | Unchanged role — still the rasterizer; only the *upstream string-extraction step* changes, not the render step (`getBBox()`, `render().asPng()` calls stay as-is) |
| `sharp` | `^0.35.3` (already installed — no change) | Compositing, alpha stripping, resizing (icon/favicon/Android adaptive) | Unchanged role — still handles `removeAlpha()`, `resize()`, `composite()` exactly as today |

### Development Tools (App Store submission)

| Tool | Purpose | Notes |
|------|---------|-------|
| `xcrun simctl io booted screenshot <path>.png` | Capture raw screenshots from the iOS Simulator for App Store Connect | No built-in Expo/EAS screenshot tooling exists (confirmed — neither `docs.expo.dev/submit/ios` nor `eas-cli` mentions screenshot generation). This is a platform-level Xcode CLI command, run against a **booted Simulator matching the target device class** (e.g. iPhone 16 Pro Max sim for the 6.9" bucket), not a JS/npm package. Simulator screenshots need no extra scaling step — the simulator renders at native device resolution already (e.g. iPhone 16 Pro Max sim captures at 1320×2868 directly). |
| App Store Connect API Key (`.p8` + Issuer ID + Key ID) | Auth for `eas submit --platform ios` | **Already proven working in v0.5** — the pinned `eas-cli` has no interactive Apple ID/password path anymore; ASC API Key is the only supported auth method (see Key Decisions in PROJECT.md). No new tooling needed here; this milestone reuses the same credential. Only the App Store Connect **UI steps after upload** (metadata, screenshots, submit-for-review) are new, not the upload mechanism itself. |
| App Store Connect web UI (manual) | App metadata, privacy nutrition label, screenshot upload, "Submit for Review" | **Not automatable via EAS** — confirmed: `eas submit` only uploads the `.ipa` to App Store Connect / TestFlight processing. Attaching a build to a *version*, filling in description/keywords/support & privacy URLs/age rating/review notes, uploading screenshots, and clicking "Submit for Review" are manual App Store Connect UI steps performed after `eas submit` succeeds. Budget for this as a manual checklist phase, not a script. |

## Installation

```bash
# Brand-asset pipeline hardening
npm install linkedom

# App Store submission readiness — no new npm packages required.
# eas-cli is already pinned as a devDependency from v0.5 (D-04); reuse it.
# Screenshot capture is an Xcode CLI command (xcrun simctl), not an npm package.
```

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|--------------------------|
| `linkedom` (DOM-style, `getElementById`) | `svgson` (SVG → JSON AST) | If the generator ever needs to *rewrite/restructure* the SVG tree programmatically (not just select-and-extract substrings) — `svgson`'s round-trippable JSON tree is nicer for transforms. For this milestone's scope (select 2-3 named layers, extract their markup as a string, hand off to the existing `Resvg`/`sharp` pipeline unchanged) `linkedom`'s `outerHTML`/`getElementById` API is a more direct drop-in replacement for the current string-slicing approach and requires less rewriting of `extractMarkOnly()`/`toMonochromeSilhouette()`. |
| `linkedom` | `jsdom` | `jsdom` is the more "complete" browser-DOM emulation (used by Jest's default `jsdom` test environment) but is a much heavier dependency (many transitive deps, native-ish `canvas` integration issues) for a one-off build script that only needs `DOMParser` + `getElementById`/`querySelectorAll` on a small SVG file. `linkedom` is purpose-built for exactly this "headless DOM for build scripts" use case and is already a common `jsdom` swap-in for teams optimizing script cold-start time. |
| Manual `xcrun simctl` screenshots | Fastlane `snapshot`/`frameit`, Maestro `takeScreenshot`, Detox `device.takeScreenshot()` | Fastlane `snapshot` requires an Xcode UI-test target wired into a real `.xcodeproj`/`.xcworkspace` — this project is a **managed Expo project with no `ios/` directory checked in** (confirmed in `.planning/codebase/STACK.md`), so `snapshot` would require `expo prebuild` first, a meaningfully bigger lift than this milestone's scope (1-10 screenshots, done once). Maestro/Detox are legitimate future automation candidates (tracked already as `RELEASE-01`/`.eas/workflows/` deferred tech debt in PROJECT.md) but are new testing-infra dependencies not currently in this app — out of proportion for a one-time screenshot set. Revisit if a second release cycle makes "regenerate screenshots on every release" worth automating. |
| App Store Connect API Key (existing) | Interactive Apple ID + password (`eas submit`) | Not available — the currently pinned `eas-cli` version has removed interactive Apple ID auth for iOS submit (confirmed as a v0.5 Key Decision already learned the hard way). No alternative exists; API Key is the only path. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|--------------|
| Continuing brittle `svg.split(MARK_FILL).length - 1` fill-counting to identify layers | Confirmed root cause of this milestone's hardening need — any incidental duplicate `fill="#F2643E"` string (even in an unrelated attribute or a future gradient stop) silently breaks the count-based guard; it also cannot distinguish the shadow layer from the primary layer when both may eventually share a fill color | `id`-based `getElementById()`/`querySelectorAll('[data-layer="..."]')` selection via `linkedom` |
| `xmldom` / `@xmldom/xmldom` for SVG parsing | Known history of prototype-pollution and XXE-style CVEs in this package family; no `querySelector`/`getElementById` ergonomics beyond raw DOM Level 1 | `linkedom` |
| Fastlane `snapshot` without first running `expo prebuild` | Requires a native Xcode project this repo does not currently check in; adds an entire new native-tooling surface (Ruby/Fastlane/Xcode UI test target) for a one-time screenshot task | Manual `xcrun simctl io booted screenshot` from the Simulator, once per required device class |
| Assuming `eas submit` finishes App Store submission | It only uploads the `.ipa` to App Store Connect/TestFlight processing — confirmed via Expo's own docs that App Review submission is a separate, manual App Store Connect step (attach build to version, fill metadata, click Submit for Review) | Treat "App Store Connect metadata + screenshots + Submit for Review" as its own manual checklist phase after `eas submit` succeeds |
| Uploading screenshots with an alpha channel or non-sRGB color profile | Apple explicitly rejects screenshots with transparency; must be sRGB PNG/JPEG, no alpha | Route Simulator screenshots (or any composited output) through the same `sharp().removeAlpha()` pattern already used for `icon.png` in `generate-brand-assets.ts` before upload, if compositing/framing is added |

## Stack Patterns by Variant

**If the SVG source is regenerated again by a design tool (e.g. re-exported from Figma) before ids are hand-added:**
- Re-verify ids survive the export, or add them as a manual post-export step
- Because Figma/Illustrator SVG exports do not reliably preserve custom ids across re-exports unless the *layer name* in the design tool is used as the id source — confirm with whoever owns the design file that layer names map to the ids `generate-brand-assets.ts` expects, or add an explicit "add stable ids" step to the export checklist

**If more than the 6.9" iPhone screenshot bucket is targeted (e.g. iPad):**
- Capture from an iPad Simulator matching iPad Pro 13" (or whichever bucket is targeted) at its native resolution
- Because Apple only *requires* one screenshot set per supported device idiom (iPhone vs iPad) that is actually distributed — since this app has no iPad-specific layout work in scope (per PROJECT.md's Out of Scope), iPad screenshots are not needed unless `app.json`'s `ios.supportsTablet`/App Store Connect device-support settings claim iPad support

**If a second release cycle happens and screenshot regeneration becomes a recurring cost:**
- Revisit Maestro `takeScreenshot` or Detox, wired into `.eas/workflows/` (already tracked as deferred `RELEASE-01` tech debt in PROJECT.md)
- Because a one-time manual capture is proportionate for the *first* real App Store submission, but repeated manual capture on every release is exactly the kind of recurring toil `.eas/workflows/` automation was deferred to address

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|------------------|-------|
| `linkedom@^0.18` | Node.js (any LTS; no native bindings) | Pure JS, no version coupling to `@resvg/resvg-js`/`sharp`/Expo SDK — it only touches the string the generator script reads via `readFileSync`, before that string is ever handed to `Resvg`. Zero interaction with the app's React Native/Expo runtime dependency graph (this is a build-time-only `scripts/` dependency, same category as `@resvg/resvg-js`/`sharp` already are). |
| `eas-cli >= 21.1.0` (already pinned per `eas.json` `cli.version`) | App Store Connect API Key auth flow | Already verified working end-to-end in v0.5's real submission — no version change needed for App Store (vs. TestFlight) submission; the *upload* mechanism (`eas submit --platform ios`) is identical for both destinations. The difference is entirely on the App Store Connect side (manual metadata + Submit for Review), not in `eas-cli` itself. |
| iPhone 6.9" screenshot dimensions: `1320x2868`, `1290x2796`, or `1260x2736` | App Store Connect's current minimum-required bucket (2026) | Any one of these three exact pixel sizes is accepted for the 6.9" class; Apple auto-scales down for smaller iPhone display classes from this single upload, so only one device-class screenshot set is strictly required for iPhone-only distribution (this app is iOS-first with no iPad scope). Must be sRGB PNG/JPEG, no alpha channel, 1-10 images. |

## Sources

- Direct file reads (this repo): `scripts/generate-brand-assets.ts`, `scripts/validate-brand.ts`, `eas.json`, `package.json`, `assets/brand/candidates/lafa-icon-warm-bold.svg`, `assets/brand/candidates/lafa-homepage-lockup.svg` — HIGH confidence, ground truth for "no ids exist yet" and current dependency versions (`@resvg/resvg-js ^2.6.2`, `sharp ^0.35.3`)
- [linkedom - npm](https://www.npmjs.com/package/linkedom) / [svgson - npm](https://www.npmjs.com/package/svgson) — MEDIUM confidence (WebSearch-sourced comparison, not Context7-verified; cross-checked against multiple listings agreeing on the DOM-API-vs-JSON-AST distinction)
- [Submit to the Apple App Store with EAS Submit — Expo Docs](https://docs.expo.dev/submit/ios/) — HIGH confidence, official Expo documentation, fetched directly; confirms no built-in screenshot tooling and that App Review submission is manual
- [Distribute an iOS app with TestFlight — Expo Docs](https://docs.expo.dev/submit/testflight/) — HIGH confidence, official Expo documentation
- App Store screenshot size guides (MobileAction, ScreenKit, AppLaunchFlow, others, cross-referenced) — MEDIUM confidence (multiple independent 2026-dated sources agree on `1320x2868`/`1290x2796`/`1260x2736` for the 6.9" bucket and "no alpha channel, sRGB" requirement; not Apple's own page directly fetched, so flagged MEDIUM not HIGH — recommend a final spot-check against `developer.apple.com/help/app-store-connect/reference/screenshot-specifications` at execution time in case Apple has since updated exact dimensions)
- WebSearch: `xcrun simctl io booted screenshot` as the standard Expo/RN Simulator-screenshot mechanism, no built-in Expo equivalent — MEDIUM confidence, multiple independent sources agree, cross-referenced against the confirmed absence of screenshot tooling in Expo's own submit docs
- This project's own `PROJECT.md` Key Decisions (v0.5) — HIGH confidence, first-party record confirming ASC API Key is the only supported `eas submit` iOS auth path in the currently pinned `eas-cli` version, and that TestFlight-only distribution was v0.5's deliberate scope boundary now being extended in v1.0

---
*Stack research for: warm brand-asset pipeline hardening (stable-layer-id SVG parsing) + Apple App Store submission readiness*
*Researched: 2026-08-16*
