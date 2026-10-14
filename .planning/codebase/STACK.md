---
last_mapped_commit: 94ea956
---

# Technology Stack

**Analysis Date:** 2026-10-14

## Languages

**Primary:**
- TypeScript ~6.0.3 (`devDependencies.typescript` in `package.json`, resolved 6.0.3) - all app code in `app/`, `src/`, `__tests__/`, and `scripts/`

**Secondary:**
- JSON - dataset fixture `__tests__/fixtures/content-verbs-v0.4.sample.json`, app config `app.json`, EAS config `eas.json`
- SVG - brand source artwork in `assets/brand/` (`assets/brand/lafa-icon.svg`, `assets/brand/lafa-homepage-lockup.svg`), rasterized by the asset scripts
- Native (Swift/Obj-C/Gradle) - not hand-authored. A gitignored, generated native project exists at `ios/` (Podfile, `PortugueseVerbQuiz.xcworkspace`) from a prebuild. Android has no native directory checked in or present locally.

## Runtime

**Environment:**
- Node.js pinned to **22.23.2**: `.nvmrc` (`22.23.2`), `package.json` `engines.node` (`22.23.2`), and `eas.json` `build.production.node` (`22.23.2`). The shell used for this analysis reports Node v25.0.0, which is outside the pin. Use 22.23.2 for builds and scripts.
- Expo managed runtime, Expo SDK ~57 (`expo` 57.0.14 installed). Hermes JS engine via React Native 0.86.2.
- Targets: iOS first (`app.json` `ios` block, `supportsTablet: false`, portrait orientation). Android config present (adaptive icon, `predictiveBackGestureEnabled: false`). Web output configured as static (`app.json` `web.output: "static"`) but not the shipped target.

**Package Manager:**
- npm. Lockfile `package-lock.json` present at repo root (lockfileVersion 3). No `yarn.lock` or `pnpm-lock.yaml`. No `packageManager` field in `package.json`.
- Private package: `"private": true`. Package name `portuguese-verb-mobile`, version `1.0.0` in `package.json`.

## App Identity (source of truth: `app.json`)

- `expo.name`: `Lafa` (user-facing display name, per `app.json`)
- `expo.slug`: `portuguese-verb-mobile`
- `expo.scheme`: `lafa` (deep-link URL scheme)
- `expo.version`: `1.0.1` (note: differs from `package.json` `version` `1.0.0`)
- `ios.bundleIdentifier`: `com.avram.aruh.lafa`
- `ios.buildNumber`: `"1"` in `app.json`. The EAS production profile uses `autoIncrement` and `appVersionSource: "remote"`, so this local value is not the shipped build number.
- `expo.owner`: `avram.aruh`
- `expo.extra.eas.projectId`: `88aa092c-033c-4bcc-bf53-450c721977e8`

**Stale local artifacts (not authoritative):** `ios/PortugueseVerbQuiz/Info.plist` (`CFBundleDisplayName` = "Portuguese Verb Quiz") and `ios/PortugueseVerbQuiz.xcodeproj/project.pbxproj` (`PRODUCT_BUNDLE_IDENTIFIER` = `com.avram.aruh.portuguese-verb-mobile`) disagree with `app.json`. `ios/` is gitignored, so these are leftovers from an earlier prebuild. Regenerate with `expo prebuild --clean` before any native build.

## Frameworks

**Core:**
- Expo SDK ~57 (`expo` ~57.0.14) - managed React Native toolchain, build and runtime
- React Native 0.86.2 (`react-native`) - native runtime
- React 19.2.3 / react-dom 19.2.3 (`react`, `react-dom`). `react-dom` is listed for the web target.
- Expo Router ~57.0.14 (`expo-router`) - file-based navigation. Entry: `"main": "expo-router/entry"` in `package.json`. Routes under `app/`: `app/_layout.tsx`, `app/index.tsx`, `app/quiz.tsx`, `app/results.tsx`.
  - `app.json` `experiments.typedRoutes: true` and `experiments.reactCompiler: true`
  - Plugin registered in `app.json` `plugins` as `"expo-router"`

**State Management:**
- Zustand ^5.0.14 (installed 5.0.15) - single in-memory quiz store at `src/store/useQuizStore.ts`. No persistence middleware.

**Validation:**
- Zod ^4.4.3 (installed 4.4.3) - runtime validation at network boundaries and type derivation:
  - `src/dataset/validate.ts` - verb dataset shape (remote and local)
  - `src/learning/schema.ts` - `LearningContentSchema` for the optional `learning` block from `/content/verbs`
  - `src/feedback/schema.ts` - `feedbackPayloadSchema` (type source via `z.infer` in `src/feedback/types.ts`)
  - `src/productFeedback/schema.ts` - `productFeedbackPayloadSchema` (type source via `z.infer` in `src/productFeedback/types.ts`)
  - Note: the two payload schemas are used only for type derivation. `submitFeedback` and `submitProductFeedback` do not call `.parse`/`.safeParse` before sending.

**Testing:**
- Jest with the `jest-expo` preset (`jest-expo` ~57.0.2, installed 57.0.4). Configured in `package.json` as `"jest": { "preset": "jest-expo" }`.
- `@types/jest` 29.5.14 (devDependency)
- No `@testing-library/react-native`. Tests are plain-function unit tests under `__tests__/` plus `src/theme/tokens.test.ts`.

**Build/Dev:**
- Expo CLI via the `expo` package (`expo start`, `expo lint`, `expo prebuild`)
- EAS CLI (cloud build and submit) - `eas.json` `cli.version` `>= 21.1.0`
- Metro (implicit, bundled by Expo SDK 57). No custom `metro.config.js`.
- Babel (implicit via `babel-preset-expo` through Expo). No `babel.config.js` at repo root.
- TypeScript compiler, type-check only: `tsc --noEmit`
- ESLint ^9.0.0 with `eslint-config-expo` ~57.0.0 (installed 57.0.1). Flat config at `eslint.config.js`: `require("eslint-config-expo/flat")` plus `ignores: ["dist/*"]`. No `.eslintrc*`.

**TypeScript config (`tsconfig.json`):**
- Extends `expo/tsconfig.base`
- `strict: true`, `noUncheckedIndexedAccess: true`, `allowImportingTsExtensions: true`
- `types: ["jest", "node"]`
- `include`: `**/*.ts`, `**/*.tsx`, `.expo/types/**/*.ts`, `expo-env.d.ts`

## Key Dependencies

**Critical (used by app code):**
- `expo-router` ~57.0.14 - all navigation
- `zustand` ^5.0.14 - quiz session store
- `zod` ^4.4.3 - dataset, learning, and feedback validation
- `react-native-safe-area-context` ~5.7.0 - `SafeAreaProvider` in `app/_layout.tsx`, `useSafeAreaInsets` in `app/index.tsx`, `app/quiz.tsx`, `app/results.tsx`
- `expo-constants` ~57.0.12 - `Constants.expoConfig?.version` for `appVersion` in feedback payloads (`app/index.tsx`, `app/quiz.tsx`, `app/results.tsx`)
- `expo-status-bar` ~57.0.1 - `StatusBar` in `app/_layout.tsx`
- `expo-system-ui` ~57.0.2 - `SystemUI` in `app/_layout.tsx`

**Used only via app config plugins (no JS import found in `app/`, `src/`, `scripts/`):**
- `expo-splash-screen` ~57.0.7 - splash plugin config in `app.json` (`backgroundColor` `#FFF9F6`, `imageWidth` 160)
- `expo-image` ~57.0.2 - plugin listed in `app.json`. The app's `Image` usage is React Native's `Image` from `react-native`.
- `expo-web-browser` ~57.0.2 - plugin listed in `app.json`

**Installed but not imported anywhere in `app/`, `src/`, `scripts/`, `__tests__/`:**
- `@expo/ui` ~57.0.10, `expo-device` ~57.0.1, `expo-font` ~57.0.0, `expo-glass-effect` ~57.0.1, `expo-linking` ~57.0.5, `expo-symbols` ~57.0.2
- `react-native-gesture-handler` ~2.32.0, `react-native-reanimated` 4.5.1, `react-native-worklets` 0.10.1, `react-native-screens` ~4.26.0 (pulled in by Expo Router's navigation stack)
- `react-native-web` ~0.21.0 (web target only)

These come from the Expo Router template scaffold. Confirm each is unused before removing it.

**Native APIs used directly:**
- `Share` from `react-native` in `app/results.tsx` for score sharing, with the message built by `src/quiz/share.ts` (`buildShareMessage`)
- `Platform.OS` from `react-native` in `app/index.tsx`, `app/quiz.tsx`, `app/results.tsx` to derive the `platform` field (`"android"` or `"ios"`, defaulting to `"ios"`)
- `Alert` from `react-native` in `app/quiz.tsx` for the exit confirmation
- `fetch`, `AbortController`, `setTimeout` (platform globals) for all network I/O. No HTTP client library.

**Explicitly not present:**
- No HTTP client (`axios`, `ky`, etc.)
- No `@react-native-async-storage/async-storage` or other persistence. No MMKV, SQLite, or Realm.
- No analytics, crash reporting, or attribution SDK (no Sentry, Crashlytics, Amplitude, Firebase)
- No Supabase or other database client. The app never holds backend credentials.
- No `expo-sharing`, `expo-location`, `expo-notifications`, or auth library
- No `@testing-library/react-native`

## Dev-only Asset and Tooling Dependencies

Used only by the `scripts/` directory:
- `sharp` ^0.35.3 (installed 0.35.3) - raster output for brand assets and `validate-brand`
- `@resvg/resvg-js` ^2.6.2 - SVG to PNG rendering in `scripts/generate-brand-assets.ts`
- `linkedom` ^0.18.13 - DOM parsing for SVG manipulation in `scripts/generate-brand-assets.ts`

## Scripts (`package.json` `scripts`)

| Script | Command | Purpose |
|---|---|---|
| `start` | `expo start` | Dev server |
| `android` | `expo start --android` | Android run |
| `ios` | `expo start --ios` | iOS run |
| `web` | `expo start --web` | Web run |
| `lint` | `expo lint` | ESLint via `eslint.config.js` |
| `test` | `jest` | Jest unit tests |
| `typecheck` | `tsc --noEmit` | Type check |
| `generate-assets` | `node scripts/generate-brand-assets.ts` | Rebuild `assets/images/*` from `assets/brand/` |
| `preflight` | `node scripts/preflight.ts` | Smoke-test the live backend (see INTEGRATIONS.md) |
| `validate-brand` | `node scripts/validate-brand.ts` | Verify brand assets and `src/theme/tokens.ts` colors against `scripts/brand-colors.ts` |

The three `.ts` scripts run through Node's native type stripping, which is unflagged from Node 22.18 onward. The pinned 22.23.2 satisfies that. Each script imports `.ts` modules with explicit extensions, so `scripts/brand-colors.ts` must stay import-free and erasable-syntax only.

Other script modules: `scripts/brand-colors.ts` (single source for brand hex values: `#FFF9F6` background, `#F2643E` orange fill, `#C94A2D` depth, `#FFFFFF` monochrome).

## Configuration

**Environment:**
- No `.env`, `.env.*`, or `.env.local` files present. No `EXPO_PUBLIC_*` or `process.env` reads in app code.
- Backend host is a constant in `src/config/api.ts`: `API_BASE_URL = "https://portuguese-verb-api-fra.onrender.com"`. `scripts/preflight.ts` keeps its own copy of the literal because Node type stripping cannot import from `src/config/api.ts`. `__tests__/api-host-guard.test.ts` fails if the former Oregon host string appears in `src/`, `scripts/`, `app/`, or in `app.json`, `package.json`, `eas.json`.
- Timeouts are per-module constants, not config:
  - `src/dataset/remote.ts` `TIMEOUT_MS = 15_000` (content fetch)
  - `src/feedback/submit.ts` `TIMEOUT_MS = 45_000`
  - `src/productFeedback/submit.ts` `TIMEOUT_MS = 45_000`
  - `scripts/preflight.ts` `TIMEOUT_MS = 90_000` (overall abort for the dev tool only; not used by the app)

**Build:**
- `app.json` - Expo config (identity, icons, plugins, experiments, EAS project id)
- `eas.json` - EAS profiles:
  - `build.development`: `developmentClient: true`, `distribution: "internal"`
  - `build.preview`: `distribution: "internal"`
  - `build.production`: `autoIncrement: true`, `node: "22.23.2"`
  - `submit.production.ios.ascAppId`: `6794382182`
  - `cli.version`: `>= 21.1.0`, `appVersionSource: "remote"`
- `tsconfig.json` - see TypeScript config above
- `eslint.config.js` - Expo flat config
- `.nvmrc` - `22.23.2`
- `.gitignore` - ignores `node_modules/`, `.expo/`, `dist/`, `web-build/`, `ios/`, `android/`, `.env`, `.env.local`, `expo-env.d.ts`, logs, `.DS_Store`
- `expo-env.d.ts` - generated Expo type reference (gitignored, must not be edited)
- `jest` config lives in `package.json`

**Assets:**
- `assets/images/icon.png` (`app.json` `icon`), `assets/images/favicon.png` (`web.favicon`), `assets/images/splash-icon.png` (splash plugin), `assets/images/android-icon-foreground.png` and `android-icon-monochrome.png` (adaptive icon), `assets/images/lafa-homepage-lockup.png`
- Generated from `assets/brand/` by `npm run generate-assets`. Check with `npm run validate-brand`.

**Store / release docs:**
- `store/` - App Store Connect metadata, privacy nutrition-label answers, screenshots, and submission log. Not used by the build.
- `docs/` - `index.html`, `privacy.html`, `support.html`, which the submission log references as GitHub Pages URLs under `avramaruh92.github.io/portuguese-verb-mobile/`.

## Platform Requirements

**Development:**
- Node 22.23.2 (see Runtime)
- npm, with `package-lock.json`
- Xcode and CocoaPods for iOS native builds from `ios/` (generated, gitignored)
- Expo CLI (via `npx expo` / npm scripts), EAS CLI for cloud builds
- No `.env` required. The backend URL is hardcoded.

**Production:**
- Distributed as an iOS app via EAS build and App Store Connect (`ascAppId` `6794382182`). Submission log in `store/submission-log.md` records v1.0.0 (build #6) entered in App Store Connect.
- Native iOS Info.plist (generated) sets `NSAppTransportSecurity.NSAllowsArbitraryLoads` to `false` with `NSAllowsLocalNetworking` `true`. All backend traffic is HTTPS.
- `app.json` `ios.infoPlist.ITSAppUsesNonExemptEncryption` is `false`.
- Android: adaptive icon configured, but no Play Store release pipeline is in the repo.

---

*Stack analysis: 2026-10-14*
