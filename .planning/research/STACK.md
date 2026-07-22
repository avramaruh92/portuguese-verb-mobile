# Technology Stack

**Domain:** iOS TestFlight release readiness for a managed Expo SDK ~57 app (v0.5 milestone)
**Researched:** 2026-07-22
**Confidence:** HIGH (build/submit schema, CLI version, and icon/splash requirements verified against current Expo docs; a couple of narrow field-level nuances flagged MEDIUM below)

> This file replaces the prior (2026-07-13, v0.1-scoped) `STACK.md` content, which
> covered backend content-fetching/caching — a different, already-shipped milestone.
> That research is preserved in git history if needed. This file is scoped
> exclusively to v0.5's iOS release-readiness question: what's needed to take this
> repo from "no `eas.json`, no bundle id" to "buildable and submittable to
> TestFlight via `eas build`/`eas submit`."

## Recommended Stack

### Core Additions

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| `eas-cli` | `^21.0.3` (current latest as of 2026-07-22 — re-check `npm view eas-cli version` before running, it ships very frequently) | CLI to run `eas build`, `eas submit`, `eas build:configure` | Official, actively maintained tool required for cloud iOS builds — this project has no native `ios/` directory and isn't switching to bare workflow, so a local Xcode build isn't an option |
| `eas.json` (new file, repo root, alongside `app.json`) | EAS Build/Submit config schema v1 (no self-versioning field — validated by whichever `eas-cli` runs, pinned via `cli.version` inside the file) | Declares build profiles (e.g. `production`) and submit profiles | Confirmed this file does not exist yet in the repo. This is the single source of truth EAS Build/Submit reads for distribution type, credentials source, channel, and submit ASC identifiers |
| `app.json` → `expo.ios.bundleIdentifier` | n/a (string) | Apple's unique reverse-DNS app identifier | **Required** — EAS Build refuses App Store-distribution iOS builds without it. Confirmed absent from current `app.json`. Milestone target: `com.avram.aruh.lafa` |
| `app.json` → `expo.extra.eas.projectId` + `expo.owner` | n/a (UUID string + Expo account/org slug) | Links the local project to an EAS project record on Expo's servers | Written automatically by `eas build:configure` (or `eas init`) on first run — do not hand-author these values |

### Supporting Config Fields (app.json)

| Field | Purpose | When to Use |
|-------|---------|-------------|
| `expo.ios.buildNumber` | Apple's internal build version, distinct from the user-facing `expo.version` | Only relevant if `eas.json`'s `cli.appVersionSource` is `"local"` (EAS reads/writes it directly in `app.json`). If `"remote"` (recommended below, and Expo's current default for new projects), EAS tracks build numbers server-side per bundle identifier and `app.json`'s `ios.buildNumber` is ignored after the first remote-version init — pick one mode, don't maintain both |
| `expo.version` | User-facing marketing version | Already `1.0.0` and correct per milestone scope — no change needed |
| `expo.slug` / `expo.scheme` | Project slug (used in EAS API calls, dashboard URL) and deep-link scheme | Milestone changes both to `lafa` — do this change **before** the first `eas build:configure` run, to avoid creating an EAS project record under the old slug |
| `expo.ios.icon` | iOS-specific icon override; supports Icon Composer `.icon` bundles (SDK 54+) for automatic light/dark/tinted variants | Already set in this repo's `app.json` to `./assets/expo.icon` (an Icon Composer bundle, confirmed present: `assets/expo.icon/icon.json` + `Assets/`) — must be regenerated from the new Lafa mark or replaced by the flat top-level `expo.icon` PNG path; don't leave it pointing at the stale pre-rebrand bundle |
| `expo.icon` | Fallback/cross-platform 1024x1024 PNG icon | Currently points to `./assets/images/icon.png` (old branding) — regenerate from `assets/brand/lafa-logo-v2.svg`: square, 1024x1024, **no alpha/transparency**, no pre-rounded corners (iOS applies its own corner mask) |
| `expo-splash-screen` plugin config (`plugins: [["expo-splash-screen", {...}]]`) | Splash screen image/background | Already configured (`backgroundColor: "#208AEF"`, `image: "./assets/images/splash-icon.png"`) — milestone keeps the existing blue background unless visual QA rejects it; splash PNG should be 1024x1024 with a **transparent** background (opposite of the icon's no-alpha rule) |

## eas.json — Recommended Shape

```json
{
  "cli": {
    "version": ">= 21.0.3",
    "appVersionSource": "remote"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {
      "autoIncrement": true,
      "ios": {
        "credentialsSource": "remote"
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

**Rationale per field:**
- `cli.version` — pins the minimum `eas-cli` version anyone running builds must use, so the schema stays compatible over time. Use a `>=` range, not an exact pin (matches Expo's own generated default).
- `cli.appVersionSource: "remote"` — the simpler mode for a project with zero prior `eas.json`/build history: EAS owns build-number incrementing server-side per bundle identifier, so nobody has to remember to bump/commit `app.json` on every build. Docs confirm: "the remote version is initialized with the value from the local project," and thereafter local `ios.buildNumber` edits are ignored. (The only two documented values are `"remote"` and `"local"`; treated as HIGH confidence since no third value appears anywhere in current docs.)
- `build.production.autoIncrement: true` — with remote versioning, this makes every `production`-profile build automatically bump the remote build number, so repeated TestFlight uploads of the same `1.0.0` don't collide.
- `build.production.ios.credentialsSource: "remote"` — matches the milestone's explicit choice ("EAS-managed Apple credentials"). EAS generates/stores the distribution certificate + provisioning profile on Expo's servers, prompting interactively the first time `eas build --profile production --platform ios` runs (or via `eas credentials`). No local `.p12`/`.mobileprovision` files needed in a repo that has never had native iOS project files.
- `submit.production.ios: {}` — the "submit profile placeholder" the milestone asks for, deliberately empty. `eas submit` prompts interactively for Apple ID / App Store Connect App ID (`ascAppId`) / Apple Team ID on first run. Don't hardcode `appleId` (an email) into a committed file unless the team is fine with that being in git history; for later CI automation, prefer an App Store Connect API key (`ascApiKeyPath` + `ascApiKeyId` + `ascApiKeyIssuerId`) supplied via secrets, not committed.

## Installation

```bash
# EAS CLI — as a devDependency so the whole team/any future CI uses a pinned range
npm install -D eas-cli@^21.0.3

# One-time login (interactive, human operator — not scriptable without a token)
npx eas login

# One-time project link — writes app.json's expo.extra.eas.projectId + expo.owner,
# and can scaffold a starter eas.json if one doesn't exist yet
npx eas build:configure
```

No new *runtime* npm packages are needed — `eas-cli` is a dev/build-time tool only, never imported by app code, and doesn't touch the existing `expo`/`react-native`/`expo-router` dependency graph.

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|--------------------------|
| `eas-cli` as a devDependency, invoked via `npx`/npm script | Global `npm install --global eas-cli` | Fine for a solo operator's machine, but a devDependency is safer here since it guarantees a reproducible, pinned version for anyone else (or CI, if added later) without a manual global-install step |
| `credentialsSource: "remote"` (EAS-managed Apple credentials) | `credentialsSource: "local"` with a checked-in/encrypted `.p12` + provisioning profile | Only worth it if the team wants full control over signing artifacts outside Expo's servers — not the case here (no existing native project, milestone explicitly asks for EAS-managed credentials) |
| `appVersionSource: "remote"` | `appVersionSource: "local"` | Use `local` only if the team wants `ios.buildNumber` human-visible and git-tracked on every bump; for a first TestFlight release with no existing versioning discipline, `remote` is simpler and avoids merge conflicts on `app.json` |
| Managed Expo workflow (no checked-in `ios/`; EAS Build prebuilds natively in the cloud each run) | `npx expo prebuild` to generate and commit a native `ios/` project, building via local Xcode or `eas build --local` | Only needed for custom native modules/config beyond what Expo config plugins support, or if the team wants to inspect/patch native Xcode settings directly — milestone explicitly says keep `ios/` prebuild output out of source control and treat `app.json` as the release source of truth, so managed workflow is correct |
| Regenerate the Icon Composer `.icon` bundle (`expo.ios.icon`, SDK 54+) for the new mark | Drop `ios.icon`, rely solely on the flat top-level `expo.icon` PNG | Icon Composer bundles give automatic light/dark/tinted iOS icon variants (nicer for a real App Store listing) but require Apple's Icon Composer tool (macOS-only, not a simple PNG export). If that tooling isn't readily usable this milestone, the flat PNG path is lower-friction and fully sufficient for TestFlight |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|--------------|
| Hand-generating a native `ios/` directory via `expo prebuild` and committing it | Contradicts the milestone's explicit constraint ("Keep ignored native `ios/` prebuild output out of source control") and reintroduces manual Xcode project maintenance that EAS Build's cloud prebuild already handles from `app.json` | Let `eas build` run its own ephemeral cloud prebuild from `app.json` on every build; keep `ios/` gitignored |
| Manually bumping `ios.buildNumber` in `app.json` while `eas.json`'s `appVersionSource` is `"remote"` | The two mechanisms conflict — per docs, once remote versioning is active, local `app.json` build-version edits become silent no-ops, misleading anyone reading `app.json` as the source of truth | Pick one mode explicitly in `eas.json` and stick to it; check the current remote value with `eas build:version:get` if ever needed |
| Checking an Apple ID password or App Store Connect API key `.p8` file into `eas.json`/the repo | Credential leak risk — ASC API keys grant broad account-level access | Leave `submit.production.ios` empty and answer prompts interactively for a first manual submit; for later CI automation, store the `.p8` key + `ascApiKeyId`/`ascApiKeyIssuerId` as CI secrets, never in a committed file |
| An old/cached `eas-cli` version | Expo iterates the `eas.json` schema and Apple App Store Connect integration frequently (e.g. a mid-2026 release added non-interactive iOS App Store/Enterprise build support via ASC API key) — an old CLI can silently ignore newer schema fields or fail against current Apple tooling requirements | Pin `eas-cli@^21.0.3` (or current) and re-verify the latest version before first use |

## Stack Patterns by Variant

**If the team wants a fully non-interactive `eas submit` later (CI-driven releases):**
- Generate an App Store Connect API key in App Store Connect (Users and Access → Integrations → App Store Connect API), download the `.p8` once
- Populate `submit.production.ios.ascApiKeyPath` / `ascApiKeyId` / `ascApiKeyIssuerId` via CI secrets (not committed values) instead of relying on interactive `appleId`/`ascAppId`/`appleTeamId` prompts

**If a second platform (Android) build is added in a future milestone:**
- Add a `build.production.android` block and `submit.production.android` block to the same `eas.json` — this milestone is iOS-only per explicit scope, so no Android profile is included here

## Version Compatibility

| Package/Field | Compatible With | Notes |
|----------------|------------------|-------|
| `eas-cli@^21.0.3` | Expo SDK ~57 | EAS Build auto-selects a cloud build image matching the project's Expo SDK version ("EAS picks a default iOS image that fits the SDK if `ios.image` is not explicitly set") — no manual `ios.image` pin needed |
| `appVersionSource: "remote"` | First-ever build for the new bundle identifier (`com.avram.aruh.lafa`) | Brand-new bundle ID, no prior build history to reconcile — remote versioning starts clean at whatever `expo.version`/build number the local project reports at first build |
| Icon Composer `.icon` bundle format | Expo SDK 54+ only | Confirmed compatible with SDK 57 (already referenced in this repo's `app.json`), but the existing bundle's artwork is pre-Lafa and must be regenerated or replaced, not left as-is |

## Sources

- [Configure EAS Build with eas.json — Expo Documentation](https://docs.expo.dev/build/eas-json/) — build profile schema (channel, distribution, credentialsSource, autoIncrement, ios.image); HIGH confidence
- [Configure EAS Submit with eas.json — Expo Documentation](https://docs.expo.dev/submit/eas-json/) — submit.ios schema (appleId, ascAppId, appleTeamId, ascApiKeyPath/Id/IssuerId); HIGH confidence
- [App version management — Expo Documentation](https://docs.expo.dev/build-reference/app-versions/) — remote vs local `appVersionSource` semantics; HIGH confidence
- [EAS JSON reference — Expo Documentation](https://docs.expo.dev/eas/json/) — combined build+submit schema confirmation; HIGH confidence
- [Set up EAS Build — Expo Documentation](https://docs.expo.dev/build/setup/) — eas-cli install/login/`build:configure` flow; HIGH confidence
- [Splash screen and app icon — Expo Documentation](https://docs.expo.dev/develop/user-interface/splash-screen-and-app-icon/) — icon requirements (1024x1024, square, no transparency, no pre-rounded corners), splash requirements (1024x1024 PNG, transparent background), `ios.icon`/Icon Composer note (SDK 54+); HIGH confidence, page dated June 2026 per source metadata — current
- [eas-cli — npm](https://www.npmjs.com/package/eas-cli) — current version 21.0.3 as of 2026-07-22; HIGH confidence (live npm registry check)
- Direct repo inspection: `app.json` (confirmed no `ios.bundleIdentifier`/`ios.buildNumber`/`extra.eas.projectId`), `assets/expo.icon/` (confirmed pre-existing Icon Composer bundle), `package.json` (confirmed no `eas-cli` dependency), repo root (confirmed no `eas.json`)

---
*Stack research for: iOS TestFlight release readiness (v0.5 milestone)*
*Researched: 2026-07-22*
