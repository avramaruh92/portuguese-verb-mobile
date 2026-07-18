# Technology Stack

**Analysis Date:** 2026-07-18

## Languages

**Primary:**
- TypeScript ~6.0.3 (`devDependencies.typescript` in `package.json`) - all app and source code (`app/`, `src/`, `__tests__/`)

**Secondary:**
- None detected. No native (Swift/Kotlin/Objective-C) source in the repo — this is a managed Expo project with no `ios/`/`android/` native project directories checked in.

## Runtime

**Environment:**
- Node.js - version not pinned in-repo (no `.nvmrc`/`.node-version` file found); local dev machine reports v25.0.0, but this is not an enforced constraint from the repo itself
- Expo managed runtime (Expo SDK ~57), targeting iOS first per `app.json`'s `ios.icon` config and project conventions

**Package Manager:**
- Not explicitly declared (no `packageManager` field in `package.json`)
- Lockfile: check `package-lock.json` / `yarn.lock` / `pnpm-lock.yaml` presence at repo root to confirm which manager is in use before adding dependencies

## Frameworks

**Core:**
- Expo SDK ~57.0.4 (`expo` in `package.json`) - managed React Native toolchain, dev client, build/runtime
- React Native 0.86.0 (`react-native` in `package.json`) - native runtime, bundled/paired with Expo SDK 57
- React 19.2.3 / react-dom 19.2.3 (`react`, `react-dom` in `package.json`)
- Expo Router ~57.0.4 (`expo-router` in `package.json`) - file-based navigation; routes live under `app/` (`app/_layout.tsx`, `app/index.tsx`, `app/quiz.tsx`, `app/results.tsx`)
  - `experiments.typedRoutes: true` and `experiments.reactCompiler: true` enabled in `app.json`
  - Registered as an Expo config plugin in `app.json` `plugins: ["expo-router", ...]`

**State Management:**
- Zustand ^5.0.14 (`zustand` in `package.json`) - single in-memory quiz session store at `src/store/useQuizStore.ts` (current question index, answers, score); no persistence middleware used

**Validation:**
- Zod ^4.4.3 (`zod` in `package.json`) - used in two places:
  - `src/feedback/schema.ts` - validates the `POST /feedback` payload shape client-side before sending
  - `src/dataset/validate.ts` - validates the verb dataset shape (both local and remote-fetched)

**Testing:**
- Jest (via `jest-expo` ~57.0.1 preset, declared in `devDependencies` and configured as `"jest": { "preset": "jest-expo" }` in `package.json`) - test runner
- `@types/jest` 29.5.14 (`devDependencies`) - type definitions for Jest globals
- No `@testing-library/react-native` present - all current tests in `__tests__/` are plain-function unit tests (dataset validation, quiz engine/scoring/random, feedback payload/schema/submit, offline pill logic, quiz labels/share, Zustand store) with no component rendering

**Build/Dev:**
- Expo CLI (`expo start`, `expo lint`) - via `expo` package's bundled CLI, invoked through npm scripts in `package.json`
- Metro (implicit, bundled by Expo SDK 57) - JS bundler, no custom `metro.config.js` found in repo root
- TypeScript compiler (`tsc --noEmit`) - type-checking only, via `npm run typecheck`

## Key Dependencies

**Critical:**
- `expo-router` ~57.0.4 - all navigation/routing (`app/` directory structure maps directly to routes)
- `zustand` ^5.0.14 - quiz session state (`src/store/useQuizStore.ts`)
- `zod` ^4.4.3 - dataset and feedback-payload runtime validation
- `react-native-safe-area-context` ~5.7.0 - safe-area insets used throughout `app/*.tsx` screens (`useSafeAreaInsets`)
- `react-native-gesture-handler` ~2.32.0, `react-native-reanimated` 4.5.0, `react-native-worklets` 0.10.0, `react-native-screens` 4.25.2 - standard Expo Router navigation/gesture/animation stack dependencies (installed but no direct custom usage found in `src/`/`app/` beyond what Expo Router itself requires)
- `expo-constants` ~57.0.3 - read at runtime in `app/quiz.tsx` (`import Constants from "expo-constants"`), used to source the app version for feedback payloads

**Infrastructure/Expo modules present but not directly referenced in app code (installed, unused in `src/`/`app/`):**
- `@expo/ui` ~57.0.4
- `expo-device` ~57.0.0
- `expo-font` ~57.0.0
- `expo-glass-effect` ~57.0.0
- `expo-image` ~57.0.0
- `expo-linking` ~57.0.2
- `expo-splash-screen` ~57.0.2 (configured as a plugin in `app.json`, no direct import found in `src`/`app`)
- `expo-status-bar` ~57.0.0
- `expo-symbols` ~57.0.0
- `expo-system-ui` ~57.0.0
- `expo-web-browser` ~57.0.0
- `react-native-web` ~0.21.0 (web output configured via `app.json` `web.output: "static"`)

These are part of the default Expo Router template scaffold; confirm before removing, but they are not load-bearing for the current feature set (quiz flow + feedback + share).

**Native sharing:**
- No `expo-sharing` dependency present. Score sharing uses React Native's core `Share` API (`import { Share } from "react-native"` in `app/results.tsx`), calling `Share.share({ message: buildShareMessage(correct, total) })` where `buildShareMessage` is defined in `src/quiz/share.ts`.

**Explicitly not present:**
- No `axios` (feedback submission uses native `fetch`, see `src/feedback/submit.ts`)
- No `@react-native-async-storage/async-storage` (no persistence beyond in-memory Zustand store)
- No Supabase client library
- No `@testing-library/react-native`

## Configuration

**Environment:**
- No `.env`/`.env.*` files found in repo listing — no environment-variable-based configuration detected
- Backend endpoints are hardcoded as string constants directly in source (`src/feedback/submit.ts`, `src/dataset/remote.ts`), not sourced from env vars

**Build:**
- `app.json` - Expo app config: name `"Portuguese Verb Quiz"`, slug `portuguese-verb-mobile`, scheme `portugueseverbmobile`, orientation `portrait`, `userInterfaceStyle: "automatic"`; iOS section only sets a custom `icon`; Android section configures adaptive icon assets and disables predictive back gesture; web output is `"static"`
- `tsconfig.json` - extends `expo/tsconfig.base`, with `"strict": true` and `"noUncheckedIndexedAccess": true` explicitly enabled (stricter than Expo's default base config), `"types": ["jest"]` for test globals
- `package.json` scripts: `start`, `android`, `ios`, `web` (all via `expo start`), `lint` (`expo lint`), `test` (`jest`), `typecheck` (`tsc --noEmit`)
- No dedicated ESLint config file found at repo root (`eslint.config.js`/`.eslintrc*`) despite the `lint` script calling `expo lint` — `expo lint` may scaffold/use a default config on first run; verify actual lint config before relying on it

## Platform Requirements

**Development:**
- Expo CLI tooling (bundled via `expo` package, run through `npx`/npm scripts, no global install required)
- TypeScript ~6.0.3 toolchain for type-checking

**Production:**
- iOS-first (per `app.json` `ios` block and project conventions); Android config present (adaptive icon, predictive back gesture disabled) but iOS is the primary target
- Web output configured as `static` via `app.json` (`web.output: "static"`), using `react-native-web`
- No EAS Build configuration (`eas.json`) found in repo root — cloud builds for TestFlight/App Store not yet set up

---

*Stack analysis: 2026-07-18*
