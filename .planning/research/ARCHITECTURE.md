# Architecture Research

**Domain:** iOS TestFlight release readiness for a managed Expo Router / React Native app
**Researched:** 2026-07-22
**Confidence:** HIGH (Context7/official docs) with MEDIUM/LOW flags noted inline

> Supersedes the previous v0.1-scoped revision of this file (dated 2026-07-13, covering
> async remote-content fetch / quiz abandonment / safe-area wiring). This revision is scoped
> entirely to v0.5's release-config work (`eas.json`, `app.json` identity fields, icon/splash
> asset pipeline, EAS build/submit) and does not restate the app's product architecture, which
> is unchanged this milestone. See git history for the prior revision if that context is needed.

## Standard Architecture

### System Overview

```
┌───────────────────────────────────────────────────────────────────────┐
│                     Repo root (existing, v0.4 shipped)                 │
├───────────────────────────────────────────────────────────────────────┤
│  app.json          — Expo config, SOURCE OF TRUTH for release identity │
│  eas.json          — NEW: EAS Build + Submit profiles (sibling of      │
│                       app.json/package.json, repo root, tracked in git)│
│  package.json       — scripts, deps (eas-cli NOT currently a devDep)   │
├───────────────────────────────────────────────────────────────────────┤
│                    Source assets (tracked, hand-authored)              │
│  assets/brand/lafa-logo-v2.svg        — brand source (untracked→ track)│
│  assets/brand/lafa-logo-v2-concept.png — concept reference (untracked) │
├───────────────────────────────────────────────────────────────────────┤
│                 Generated release assets (tracked, derived)            │
│  assets/images/icon.png               — 1024x1024, no-alpha, PNG       │
│                                          (top-level `expo.icon`)        │
│  assets/expo.icon/  (icon.json +      — SDK54+ Icon Composer format,   │
│    Assets/*.svg,*.png)                  CURRENTLY the Expo template    │
│                                          default — overrides `icon.png`│
│                                          for iOS via `ios.icon` key     │
│  assets/images/splash-icon.png        — splash foreground image        │
│  assets/images/android-icon-*.png     — Android adaptive icon layers   │
├───────────────────────────────────────────────────────────────────────┤
│              Native build output (NEVER commit, git-ignored)           │
│  ios/  (already in .gitignore)        — prebuild output, EAS Build     │
│                                          regenerates from app.json      │
│  .expo/, dist/                        — already git-ignored            │
└───────────────────────────────────────────────────────────────────────┘
                          │
                          ▼  `eas build` reads app.json + eas.json,
                             runs a cloud prebuild, produces .ipa
                          ▼  `eas submit` reads eas.json `submit` profile,
                             uploads .ipa to App Store Connect → TestFlight
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| `app.json` (`expo` block) | Single source of truth for app identity: name, slug, version, `ios.bundleIdentifier`, `ios.buildNumber`, icon/splash references | Already exists, needs new fields (`ios.bundleIdentifier`, `ios.buildNumber`, `scheme`) added, not restructured |
| `eas.json` | Declares EAS Build profiles (`development`/`preview`/`production`) and EAS Submit profiles (`production`) | New file at repo root, JSON, versioned in git alongside `app.json` |
| `assets/images/icon.png` | Fallback/base app icon referenced by top-level `expo.icon` | 1024x1024 PNG, fully opaque (no alpha channel), no rounded corners — OS applies masking |
| `assets/expo.icon/` | SDK 54+ "Icon Composer" Liquid Glass icon bundle, referenced by `ios.icon` — **takes precedence over `icon.png` on iOS** | Directory containing `icon.json` (layer/fill/translucency descriptor) + `Assets/` (SVG/PNG layers); authored via the macOS-only Icon Composer app, or removed to fall back to `icon.png` |
| `assets/images/splash-icon.png` | Splash screen foreground image, sized via `expo-splash-screen` plugin's `imageWidth` | PNG, transparent background allowed (unlike the app icon) |
| EAS Build cloud service | Runs a cloud prebuild (generates the native `ios/` project transiently) and compiles the app | Triggered via `eas build --platform ios --profile production` |
| EAS Submit cloud service | Uploads the built `.ipa` to App Store Connect, which triggers TestFlight processing | Triggered via `eas submit --platform ios --profile production` |

## Recommended Project Structure

```
portuguese-verb-mobile/
├── app.json                    # MODIFIED — add ios.bundleIdentifier, ios.buildNumber,
│                                #   update slug/scheme if renaming to "lafa"
├── eas.json                    # NEW — build + submit profiles
├── package.json                # MODIFIED — add eas-cli as a devDependency (optional but
│                                #   recommended for reproducible local `eas` invocations)
├── assets/
│   ├── brand/
│   │   ├── lafa-logo-v2.svg           # source of truth, ADD to git (currently untracked)
│   │   └── lafa-logo-v2-concept.png   # reference only, ADD to git (currently untracked)
│   ├── images/
│   │   ├── icon.png                   # REPLACED — regenerated 1024x1024 no-alpha PNG
│   │   ├── splash-icon.png            # possibly REPLACED (Lafa mark on existing blue bg)
│   │   ├── favicon.png                # unaffected (web-only, out of scope for TestFlight)
│   │   └── android-icon-*.png         # unaffected this milestone (iOS-only scope)
│   └── expo.icon/                     # DECISION NEEDED — see Anti-Pattern below:
│       ├── icon.json                  #   either regenerate via Icon Composer with the
│       └── Assets/                    #   Lafa mark, or delete + remove `ios.icon` key
├── ios/                         # NEVER commit — already git-ignored, EAS Build
│                                #   regenerates it from app.json on every cloud build
└── .expo/, dist/                # NEVER commit — already git-ignored
```

### Structure Rationale

- **`eas.json` lives at repo root, sibling to `app.json`/`package.json`:** this is the fixed, non-configurable location EAS CLI looks for — no alternate path is supported.
- **`assets/brand/` stays separate from `assets/images/`:** brand source files (SVG, concept PNG) are *inputs* to the icon pipeline, not release-consumable assets themselves — app.json never references files in `assets/brand/` directly. Keeping them separate and tracked preserves provenance (so a future rebrand or splash update can re-derive from the same source) without polluting the files Expo actually reads at build time.
- **`assets/expo.icon/` is a directory, not a single file:** this is new in SDK 54+ (Icon Composer / Liquid Glass format) and is easy to mistake for a stray folder. It must be evaluated explicitly rather than left as-is, because it currently silently overrides `icon.png` on iOS with the unmodified Expo template default (see Anti-Pattern below).
- **`ios/` must never be committed:** EAS Build's cloud infrastructure runs `expo prebuild` internally as part of every build, regenerating a fresh native project from `app.json` each time. A locally-generated `ios/` directory checked into git would create two competing sources of truth and is explicitly the failure mode Expo's managed-workflow model is designed to avoid. It is already correctly listed in `.gitignore` — no action needed there, just confirm no one runs `git add -f ios/` during this milestone.

## Architectural Patterns

### Pattern 1: Config-as-code release identity (no Xcode project editing)

**What:** All release-identity fields (`ios.bundleIdentifier`, `ios.buildNumber`, `version`, `name`, `slug`, `scheme`, `icon`, splash) live exclusively in `app.json`. There is no native `ios/*.xcodeproj` to hand-edit because none is checked in.
**When to use:** Always, for a managed-workflow Expo project. This project is already fully managed (no `ios/` in git) — do not introduce native project files as part of this milestone.
**Trade-offs:** Simpler, single source of truth, fully reproducible builds. Downside: any iOS-native customization not expressible in `app.json`/config plugins would require an `expo prebuild` + native edit + re-check-in `ios/`, which this project is explicitly avoiding — not needed for this milestone's scope.

**Example (`app.json` additions needed):**
```json
{
  "expo": {
    "name": "Lafa",
    "slug": "portuguese-verb-mobile",
    "scheme": "lafa",
    "version": "1.0.0",
    "ios": {
      "bundleIdentifier": "com.avram.aruh.lafa",
      "buildNumber": "1",
      "icon": "./assets/images/icon.png"
    }
  }
}
```
Note: the milestone's target bundle id is `com.avram.aruh.lafa`; slug/scheme target `lafa` per PROJECT.md — both are currently `portuguese-verb-mobile`/unset in the live `app.json`, confirming this field is not yet added.

### Pattern 2: `eas.json` build/submit profile split

**What:** EAS separates *build* configuration (what gets compiled, credentials source, resource class) from *submit* configuration (where the built artifact is uploaded) into two top-level keys, each keyed by named profile.
**When to use:** Any EAS-based release pipeline. A minimal viable `eas.json` for this milestone needs exactly one build profile (`production`) and one submit profile (`production`).
**Trade-offs:** Named profiles let `development`/`preview` be added later without disrupting the `production` path already in use for TestFlight — worth stubbing even if only `production` is exercised this milestone, since it costs nothing and matches Expo's own scaffolded default.

**Example:**
```json
{
  "cli": {
    "version": ">= 16.0.0",
    "appVersionSource": "remote"
  },
  "build": {
    "production": {
      "autoIncrement": true,
      "ios": {
        "resourceClass": "m-medium"
      }
    }
  },
  "submit": {
    "production": {
      "ios": {}
    }
  }
}
```
Leaving `submit.production.ios` empty and using EAS-managed Apple credentials (via `eas credentials` / interactive `eas submit` prompts) matches the milestone's stated "EAS-managed Apple credentials" decision — do not hardcode `ascApiKeyPath`/`appleId` unless the user explicitly wants a non-interactive CI submit path, which is out of scope here.

### Pattern 3: Source-to-production icon pipeline (SVG → 1024×1024 no-alpha PNG)

**What:** Expo's app icon requirement is a single flat, fully-opaque, exactly-square 1024×1024 PNG (no transparency, no pre-rounded corners — the OS applies platform-specific masking). The brand source is a vector SVG (`lafa-logo-v2.svg`), which must be rasterized, padded/composed onto a solid background if the mark itself isn't full-bleed, and alpha-flattened before it becomes `assets/images/icon.png`.
**When to use:** Any time a vector brand asset is the source of truth and Expo needs a raster app icon.
**Trade-offs:** Manual rasterization (e.g. `rsvg-convert`/`sharp`/Figma export) gives full control over padding and background color but must be re-run by hand on every brand update; there is no EAS-side re-rasterization step for the top-level `icon.png` — EAS Build only generates the *various OS-required intermediate sizes* from your one 1024×1024 source, it does not fix alpha-channel or squareness problems in that source.

**Pipeline steps:**
1. Rasterize `assets/brand/lafa-logo-v2.svg` at 1024×1024 (or higher, then downscale) — mark-only per PROJECT.md, not the full wordmark.
2. Compose onto a solid (non-transparent) background if the SVG has transparency — matches the existing splash `backgroundColor` (`#208AEF`) unless visual QA picks a different fill.
3. Flatten/remove the alpha channel entirely (validate with a tool like `identify -format '%A' file.png` → must report `False`/`Off`, or via `sharp`'s `.flatten()`).
4. Verify exact squareness (1024×1024, not 1023×1024 or similar) — Expo's own docs call out this exact off-by-one as an invalid-icon failure mode.
5. Write to `assets/images/icon.png`, replacing the current placeholder in place (same filename, `app.json` reference unchanged).
6. Decide on `assets/expo.icon/` (see Anti-Pattern below) — do not leave it as the still-active iOS icon override while `icon.png` gets updated, or the new Lafa icon will silently not appear on iOS builds.

## Data Flow

### Release Config Flow

```
assets/brand/lafa-logo-v2.svg   (hand-authored, tracked, source of truth)
    ↓  rasterize + flatten alpha + verify 1024x1024 square
assets/images/icon.png          (generated, tracked, checked in)
    ↓  referenced by app.json `expo.icon`
    ↓  (only used on iOS if `ios.icon` is removed/absent — see Anti-Pattern)
app.json                        (release identity: bundleIdentifier, buildNumber,
                                  version, icon, splash — single source of truth)
    ↓  read by EAS CLI at build time
eas.json                        (build profile selects credentials source + resource
                                  class; submit profile selects ASC destination)
    ↓  `eas build --profile production --platform ios`
EAS cloud build                 (transient `expo prebuild` generates a native `ios/`
                                  project in the cloud only — never touches the repo's
                                  git-ignored local `ios/`)
    ↓  produces signed .ipa
    ↓  `eas submit --profile production --platform ios`
App Store Connect → TestFlight  (processing ~10-15 min, then available to testers)
```

### Key Data Flows

1. **Identity flow:** `app.json`'s `ios.bundleIdentifier` must be set and stable *before* the first `eas build` — EAS registers/associates the bundle id with the Apple Developer account and an App Store Connect app record on first build+submit. Changing it after registration means creating a new ASC app record, not editing the existing one.
2. **Icon override flow:** iOS icon resolution has two competing paths in this specific project's `app.json` today — `expo.icon` (`assets/images/icon.png`) and `expo.ios.icon` (`assets/expo.icon/`, currently the unmodified Expo template default). `ios.icon` wins on iOS. Regenerating only `icon.png` without addressing `assets/expo.icon/` will ship the generic Expo template icon to TestFlight, not the Lafa mark.
3. **Native output flow:** No locally-generated `ios/` should ever reach git. `eas build` runs its own cloud-side `expo prebuild`; a local `npx expo prebuild` run for icon-preview purposes (if used for visual QA) must not be committed — it's already covered by the existing `.gitignore` entry, but this is worth an explicit `git status` check before the first commit of this milestone's work.

## Scaling Considerations

Not applicable in the traditional sense (this is a release-pipeline, not a runtime-scaling, concern) — reframed as build/release cadence:

| Stage | Approach |
|-------|----------|
| First TestFlight build (this milestone) | Single `production` build+submit profile, EAS-managed Apple credentials, manual `eas build`/`eas submit` invocation |
| Repeated internal TestFlight builds | `autoIncrement: true` in the build profile (auto-bumps `ios.buildNumber` per build) so manual bumping of `app.json` isn't required every time |
| Eventual public App Store release | Same pipeline, no architecture change — only ASC app-record metadata (screenshots, description, review info) differs, which is outside `eas.json`/`app.json` scope entirely |

### Scaling Priorities

1. **First blocker:** bundle identifier + first `eas build` establishes the Apple-side app record — this must happen once, correctly, before repeated builds are useful. Get identity fields right before the first build, not iteratively.
2. **Second blocker (not this milestone):** if Android release work is later added, `eas.json` build profiles gain an `android` sibling key alongside `ios` in the same `production` profile — no restructuring needed, purely additive.

## Anti-Patterns

### Anti-Pattern 1: Regenerating `assets/images/icon.png` while leaving `assets/expo.icon/` untouched

**What people do:** Focus icon-pipeline work only on the top-level `icon`/`assets/images/icon.png` field because it's the more familiar/older Expo convention, not realizing `ios.icon` (SDK 54+ Icon Composer format) is already present in this project's `app.json` and takes precedence on iOS.
**Why it's wrong:** The current `assets/expo.icon/` directory still contains the unmodified Expo template's default "expo-symbol" grid icon (confirmed via `assets/expo.icon/icon.json` — `image-name: "expo-symbol 2.svg"`, `grid.png`). If left as-is, the first TestFlight build ships the generic Expo template icon on iOS home screens regardless of how well `icon.png` is redone, because `ios.icon` silently wins.
**Do this instead:** Either (a) regenerate `assets/expo.icon/` with the Lafa mark using Apple's Icon Composer app (macOS-only, produces the `.icon` bundle/layers format), or (b) the simpler path for this milestone — delete `assets/expo.icon/` and remove the `ios.icon` key from `app.json` entirely, letting the top-level `expo.icon` (`assets/images/icon.png`) apply uniformly to iOS as a plain flat icon with automatic OS-side Liquid Glass fallback treatment. Given the milestone scope ("mark-only, not full wordmark," no mention of Icon Composer tooling or macOS design tooling access), option (b) is very likely the pragmatic choice — flag this as an explicit decision point for the build-order plan, not an assumption to silently resolve.

### Anti-Pattern 2: Committing a locally-run `expo prebuild` output

**What people do:** Run `npx expo prebuild` locally to preview native icon/splash rendering before a cloud build, then forget to discard the generated `ios/` directory, and it gets swept into a broad `git add -A`/`git add .` commit.
**Why it's wrong:** Creates a second, divergent source of truth for native config alongside `app.json`; EAS Build's cloud-side prebuild would silently ignore or conflict with a committed native project, and it violates this project's explicit "keep ignored native `ios/` prebuild output out of source control" constraint (PROJECT.md, v0.5 Key context).
**Do this instead:** `ios/` is already correctly listed in `.gitignore` — trust it, but verify with `git status` after any local prebuild/build-preview step during this milestone, and never use `git add -f` on it.

### Anti-Pattern 3: Treating `eas.json`'s `cli.version` as optional boilerplate

**What people do:** Skip the `cli` block in `eas.json`, assuming whatever `eas-cli` version is globally/npx-installed is fine.
**Why it's wrong:** Without a pinned/floor `cli.version`, a future contributor (or CI) running an older/newer `eas-cli` could produce a build with different default behavior (e.g. credential handling, `autoIncrement` semantics) than what was verified during this milestone's first successful TestFlight build.
**Do this instead:** Include a `cli.version` constraint (e.g. `">= 16.0.0"`, matching or exceeding the locally verified `eas-cli/20.0.0` found in this environment) in the new `eas.json`.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| EAS Build (Expo Application Services) | `eas build --platform ios --profile production`, reads `app.json` + `eas.json` | Requires `eas login` (Expo account) and, on first run for this project, `eas init`/build will prompt to link the project to an EAS project id (written to `app.json`'s `extra.eas.projectId` — a new field, not yet present) |
| App Store Connect (Apple) | `eas submit --platform ios --profile production`, reads `eas.json`'s `submit.production.ios` | Requires the operator's Apple Developer Program membership (confirmed available per PROJECT.md) and an App Store Connect app record — PROJECT.md states the operator will create/approve this manually, not automated by this milestone's config work |
| `portuguese-verb-api` backend (existing) | Unchanged — `GET /health`, `GET /content/verbs`, `POST /feedback`, `POST /product-feedback` smoke-checked live before tester invites | Not a build-time integration; a manual/scripted preflight step, orthogonal to the `eas.json`/`app.json` work covered here |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| `app.json` ↔ `eas.json` | `eas.json` build profiles implicitly read release identity (bundle id, version) from `app.json` — no field duplication needed except `appVersionSource: "remote"` opting into EAS-side version/build-number tracking instead of `app.json`-only | Set identity fields in `app.json` *before* the first `eas build`, since that build registers them with Apple |
| `assets/brand/` ↔ `assets/images/`, `assets/expo.icon/` | One-way, manual/scripted rasterization — no automated watch/rebuild pipeline exists or is being added this milestone | Re-run the rasterize step by hand on any future brand-asset update; document the exact command used for reproducibility (not currently captured anywhere in the repo) |
| `eslint.config.js` lint failures ↔ release readiness | Two pre-existing `react-hooks/set-state-in-effect` errors in `ReportFeedbackModal.tsx`/`ProductFeedbackModal.tsx` (confirmed live via `npm run lint`) block a clean `npm run lint` pass | Independent of `eas.json`/icon work but explicitly in this milestone's scope — fix before or in parallel with release-config work, not blocking it structurally (no code dependency between the two) |

## Sources

- [Splash screen and app icon - Expo Documentation](https://docs.expo.dev/develop/user-interface/splash-screen-and-app-icon/) — icon size/alpha requirements, config hierarchy, EAS Build's role generating intermediate sizes
- [eas.json - Expo Documentation](https://docs.expo.dev/build/eas-json/) — build profile structure, platform-specific fields, resourceClass
- [Submit to the Apple App Store - Expo Documentation](https://docs.expo.dev/submit/ios/) — submit profile fields, Apple credentials handling, TestFlight processing flow
- [Expo SDK 54 Changelog](https://expo.dev/changelog/sdk-54) — introduction of Icon Composer `.icon` format for Liquid Glass icons (confirms `assets/expo.icon/` is this SDK 54+ format, in-repo verified via `assets/expo.icon/icon.json`)
- In-repo verification: `app.json` (current `expo.icon`/`ios.icon` split), `assets/expo.icon/icon.json` (confirms still-default Expo template content), `.gitignore` (confirms `ios/` already excluded), `npm run lint` output (confirms the exact 2 pre-existing lint failures named in PROJECT.md's v0.5 scope), `npx eas --version` (confirms `eas-cli` is available via `npx`, not yet a `package.json` devDependency)

---
*Architecture research for: iOS TestFlight release readiness (Expo managed workflow)*
*Researched: 2026-07-22*
