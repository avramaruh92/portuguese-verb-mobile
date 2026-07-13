# Stack Research

**Domain:** iOS-first Expo React Native quiz app — v0.1 adds online content fetching w/ offline fallback + caching, exit-quiz confirmation, safe-area UI polish
**Researched:** 2026-07-13 (v0.1 additions below); original v0.0 research (2026-07-12) preserved further down for history
**Confidence:** MEDIUM-HIGH for v0.1 additions (verified against current npm/official docs; some claims WebSearch-only, flagged below)

This file's top section covers ONLY what's new for v0.1. Everything already
validated in v0.0 (Expo SDK 57, Expo Router 6, Zustand 5, Zod 4, jest-expo,
native `fetch` + `AbortController`, RN core `Share`) is unchanged — see the
"v0.0 Research (preserved)" section below for that original rationale.

---

## v0.1 Additions (2026-07-13)

### Core Technologies (new for v0.1)

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| `@react-native-async-storage/async-storage` | latest resolved by `npx expo install` (currently `3.1.1` upstream; let Expo's installer pin the SDK-57-compatible build rather than hand-picking) | Persist the last-known-good fetched dataset JSON (+ fetch timestamp) across app restarts, so the app has something to fall back to before it even attempts a network call on next launch | This is a genuinely new requirement (v0.0 explicitly excluded persistence — "no persistence beyond a single quiz session," which was about *quiz session* state, not content caching). One JSON blob, read/written a handful of times per session, no hot-path performance need — AsyncStorage's simple async key-value API is the right level of complexity. **Caveat (MEDIUM confidence):** a GitHub issue (`expo/expo#43757`) reports AsyncStorage 3.x Gradle/Android build breakage on SDK 54+, with `2.2.0` cited as the last confirmed-working version for Android. This project is iOS-first with "no Android build/release effort" explicitly out of scope this milestone, so the Android-Gradle failure mode is not currently a blocker — but always install via `npx expo install @react-native-async-storage/async-storage` (never a raw `npm install` with a hand-picked version) so Expo's compatibility resolver picks the version validated against your exact SDK, and re-check this if/when Android work starts. |
| `react-native-safe-area-context` | `~5.7.0` — **already installed**, no new dependency | Correct safe-area insets so content stops rendering under the iOS notch/status bar and home indicator | Already present in `package.json` as an Expo Router peer dependency (confirmed by reading the file directly). The v0.0 bug isn't a missing package, it's a missing `SafeAreaProvider` at the root (`app/_layout.tsx` currently only renders a bare `<Stack>`) plus screens not consuming insets. Fix is wiring, not installation. |

### Supporting Libraries / Patterns (new for v0.1)

| Library / Pattern | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Native `fetch` + manual `AbortController` (same pattern as existing `submitFeedback`) | N/A, already in the codebase | Fetch quiz content from the new backend endpoint | Reuse the exact pattern already proven in `src/feedback/submit.ts` (manual `AbortController`, not `AbortSignal.timeout`, since that's unimplemented on Hermes — already a settled v0.0 finding). Difference: the feedback call is fire-and-forget with a generous 90s cold-start-tolerant timeout; the content fetch is **on the critical path to quiz start** (user is staring at a loading state), so use a much shorter timeout (2-5s is reasonable) and fall through to cache-then-bundled-dataset the moment it fires, rather than making the user wait through a Render cold start. |
| Existing Zod dataset schema (`src/dataset/types.ts` / dataset schema module) | already in codebase, `zod@4.x` | Validate the shape of whatever the fetch returns before trusting it | Do not write a second, parallel schema for "the API response." Reuse the exact schema that already validates the bundled local dataset as the single source of truth for "what a valid verb dataset looks like" — a fetched payload that fails this same `.safeParse()` is exactly the "invalid data" fallback trigger the milestone calls for (per PROJECT.md: fall back if "unreachable, slow, or returns invalid data"). |
| Plain `jest.fn()` / `jest.spyOn(global, 'fetch')` stubs (no new dependency) | N/A | Unit-test the fetch → validate → fallback → cache logic in Jest | For a single endpoint with a handful of deterministic scenarios (200 + valid shape, 200 + invalid shape, network error, timeout, cache-hit-no-network), directly stubbing `global.fetch` per test case is simpler, has zero new dependencies, and avoids MSW's React-Native-specific setup friction (see "What NOT to Use"). This matches the project's own established stack philosophy (no axios, no react-query) — don't reach for network-interception middleware to mock one endpoint. |
| In-app dev-only mock toggle (e.g. an `__DEV__`-gated base-URL swap or a `EXPO_PUBLIC_CONTENT_API_URL` env var pointing at a local static JSON file/simple handler) | N/A, no new dependency | Manually exercise the fetch/fallback flow against a stand-in backend during development, before the real `portuguese-verb-api` endpoint exists | Single endpoint, single JSON shape, short-lived need (swapped for the real URL once the sibling backend ships it). A config-driven base URL (mirroring how `POST /feedback`'s URL is presumably already a constant) that can point at `http://localhost:PORT/verbs.json` (served by `npx serve` or a two-line Node script) during dev, or at the real Render URL later, is proportionate. Do not stand up a maintained `json-server`/Express mock service or MSW's request-interception layer for this — that's infrastructure sized for a multi-endpoint API surface, not one GET. |

### Development Tools (new for v0.1)

| Tool | Purpose | Notes |
|------|---------|-------|
| RN core `Alert.alert()` (no new dependency) | Exit-quiz-early confirmation dialog | See "Alert vs custom modal" decision below. |

### Installation (v0.1)

```bash
# Core — only one genuinely new package this milestone
npx expo install @react-native-async-storage/async-storage

# Everything else needed (react-native-safe-area-context, native fetch,
# existing Zod schema, RN core Alert/Modal) is already in the project —
# no further installs required.
```

### Alternatives Considered (v0.1)

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| `@react-native-async-storage/async-storage` for the cached dataset blob | `react-native-mmkv` | If the app later adds many more small, frequently-read/written keys (feature flags, per-screen prefs, a larger local cache with sync reads on every render) where MMKV's ~30x throughput and synchronous API start to matter. Not justified for "read/write one JSON blob once per app foreground" — and it requires a native module rebuild (a custom dev client / EAS build), which, notably, this project *already* effectively requires because `@expo/ui` and `expo-glass-effect` are native modules unavailable in plain Expo Go — so MMKV wouldn't add net new build friction here. Still overkill for the actual read/write frequency, so AsyncStorage remains the proportionate choice. |
| `@react-native-async-storage/async-storage` | `expo-file-system` (write the JSON to a cache-directory file) | If the cached payload grows large (multi-MB) or you want atomic file-replace semantics. A ~200-verb JSON dataset is well under AsyncStorage's practical size limits; file-system caching adds path/URI management for no benefit at this scale. |
| Plain `jest.fn()`/`jest.spyOn` fetch stubs for unit tests | MSW (`msw/native`) | If the app grows to call several backend endpoints with varied request-matching needs (headers, query params, multiple routes sharing setup), MSW's network-level interception scales better than ad hoc per-test stubs. For one GET endpoint with ~5 test scenarios, MSW's React-Native-specific setup (must import `msw/native` not `msw/node`, requires `URL`/`node-fetch`/`web-streams-polyfill` polyfills in the Jest environment, and needs extra wiring under Expo Router since there's no `index.ts` entry point to bootstrap it in) is materially more ceremony than the payoff justifies right now. |
| In-app dev-only base-URL toggle for manual testing | A local `json-server`/Express mock server | If the mocked contract grows to multiple endpoints, needs stateful behavior (e.g. simulating pagination, POST-then-GET), or multiple people on the team need to hit the same stable mock URL. For "one static JSON payload, swapped for a real URL later," a static file plus a one-line static server (or even a local `file://` read behind a dev flag) is simpler to set up and tear down. |
| RN core `Alert.alert()` for exit-quiz confirmation | Custom `Modal` (matching `ReportFeedbackModal`'s `presentationStyle="pageSheet"` pattern) | The existing custom modal exists because it's a multi-field form (reason picker + free-text message) that needs real layout control — a system alert can't do that. A "leave quiz? progress will be lost" confirmation is a plain two-button (Cancel/Discard) decision with no form fields — exactly what `Alert.alert(title, message, buttons)` is built for, matches iOS's native destructive-confirmation look for free, and needs zero new styling work (relevant given this milestone is also doing a broader "UI is currently unstyled" polish pass — don't spend that budget re-styling a confirm dialog a system component already handles). Reach for a custom modal here only if the confirmation later needs to show something beyond text + two buttons (e.g. a live score preview). |

### What NOT to Use (v0.1)

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| MSW (`msw`/`msw/native`) for this milestone | Real capability, but sized for multi-endpoint API mocking; in a React-Native/Expo-Router context it needs non-default polyfills (`URL`, `node-fetch`, `web-streams-polyfill`) and a workaround for the missing `index.ts` entry point Expo Router uses instead — meaningful setup cost for a single GET endpoint with a handful of test scenarios. | `jest.spyOn(global, 'fetch')`/`jest.fn()` per-test stubs for unit tests; a static file + dev-flag base-URL swap for manual testing. |
| A standalone `json-server`/Express mock backend process | Extra process to run/maintain, extra README/setup step, for content that's really just "serve this one static JSON file" during development. | A static JSON file served locally (or even read directly via a dev-only code path) behind the same base-URL config that will later point at the real backend. |
| `react-native-mmkv` for the dataset cache | Adds a native-module dependency and a slightly different API (synchronous, `Storage` instance) for a read/write pattern (once per app foreground) that doesn't need MMKV's throughput advantage. | `@react-native-async-storage/async-storage` |
| Custom full-screen `Modal` for the exit-quiz confirmation | Over-engineers a plain yes/no destructive confirmation; also more UI polish work in a milestone that's already doing a dedicated visual-polish pass elsewhere. | RN core `Alert.alert()` |
| `react-native`'s legacy `SafeAreaView` (the one exported from `react-native` core, not `react-native-safe-area-context`) | Deprecated/inconsistent behavior on Android and doesn't participate in the same insets context as the rest of the safe-area ecosystem; the RN team itself points users to `react-native-safe-area-context`. | `react-native-safe-area-context`'s `SafeAreaView`, or (for finer per-edge control mixing custom headers) its `useSafeAreaInsets()` hook applied as padding |
| Hand-picking an AsyncStorage version by pinning a raw `npm install @react-native-async-storage/async-storage@X` | Bypasses Expo's SDK-compatibility resolution; this is exactly the kind of version-skew mistake the SDK-57 stack already warns about for other Expo-adjacent packages. | `npx expo install @react-native-async-storage/async-storage` — let Expo pick the version validated against SDK 57 |

### Stack Patterns by Variant (v0.1)

**If the backend content endpoint later grows beyond one GET (e.g. versioned content, pagination, multiple content types):**
- Revisit MSW for test mocking and consider whether a thin fetch-wrapper module needs to become a small typed client
- Because the "one endpoint, ad hoc stub" approach stops scaling once there's real request variety to model

**If Android release work is picked up in a future milestone:**
- Re-verify `@react-native-async-storage/async-storage`'s Android/Gradle compatibility against whatever SDK is current then (the SDK-54+ Gradle issue referenced above was Android-specific and may or may not be resolved by the time Android work starts)
- Because the iOS-first assumption underlying "AsyncStorage's rough edges don't matter yet" no longer holds once Android is in scope

**If the exit-quiz confirmation later needs richer content (e.g. showing current score/progress before confirming):**
- Move from `Alert.alert()` to a small custom modal, following the `ReportFeedbackModal` pattern (RN core `Modal`, `presentationStyle="pageSheet"`)
- Because `Alert.alert()` is title+message+buttons only — it can't render a live score readout or other dynamic content

### Version Compatibility (v0.1)

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| `@react-native-async-storage/async-storage` (via `npx expo install`) | `expo@57.0.4` | Install via the Expo CLI, not a raw npm pin, so version selection accounts for SDK 57. MEDIUM confidence flag: `2.2.0` was the last version confirmed working against Android Gradle builds on SDK 54+ per a still-open GitHub issue (`expo/expo#43757`); irrelevant to this milestone's iOS-only scope but worth re-checking before any Android build. |
| `react-native-safe-area-context@~5.7.0` | `expo-router@57.0.4`, `expo@57.0.4` | Already installed and version-locked in this project; no action needed beyond wiring `SafeAreaProvider` at the root and consuming insets in screens. |
| Native `fetch` (Hermes/RN 0.86) | N/A | `AbortSignal.timeout()` remains unimplemented on Hermes (same v0.0 finding that shaped the feedback client) — use manual `AbortController` + `setTimeout` for the content-fetch timeout too, exactly as `submitFeedback` already does. |

### Sources (v0.1)

- https://docs.expo.dev/versions/latest/sdk/safe-area-context/ — official Expo docs, HIGH confidence (peer-dependency status, general setup)
- https://docs.expo.dev/develop/user-interface/safe-areas/ — official Expo docs, HIGH confidence (SafeAreaView vs useSafeAreaInsets guidance)
- `package.json` (this repo) — direct read, HIGH confidence (confirms `react-native-safe-area-context@~5.7.0` already installed, no AsyncStorage present yet; confirms `@expo/ui`/`expo-glass-effect` native modules already require a dev client)
- `app/_layout.tsx`, `app/quiz.tsx`, `src/feedback/ReportFeedbackModal.tsx` (this repo) — direct read, HIGH confidence (confirms no `SafeAreaProvider` currently wired; confirms existing `Modal`/`presentationStyle="pageSheet"` pattern)
- https://github.com/expo/expo/issues/43757 — GitHub issue, MEDIUM confidence (Android/Gradle-specific AsyncStorage 3.x incompatibility on SDK 54+, `2.2.0` cited as last known-good; not independently reproduced, and irrelevant to this milestone's iOS-only scope)
- https://mswjs.io/docs/integrations/react-native/ — official MSW docs, MEDIUM-HIGH confidence (confirms `msw/native` vs `msw/node`, required polyfills)
- https://richiea1y.com/blog/integrating-msw-v2-with-expo-router-(typescript-+-esmodules) — blog, LOW-MEDIUM confidence (Expo Router entry-point friction with MSW setup; single source, but consistent with MSW's own documented RN caveats)
- WebSearch synthesis on MMKV vs AsyncStorage vs SecureStore, 2026 — MEDIUM confidence, multiple sources agreed on general positioning (MMKV for hot-path/frequent small keys, AsyncStorage for simple baseline needs)
- Existing project code (`src/feedback/submit.ts` pattern, referenced not re-read since already validated in v0.0) — HIGH confidence, establishes the reusable fetch/AbortController/Zod pattern this research extends

---

## v0.0 Research (preserved, 2026-07-12)

**Domain:** iOS-first Expo React Native offline quiz app (Expo Router + TypeScript + Zustand, single outbound REST call)
**Confidence:** HIGH (core versions verified against npm registry `latest` dist-tags and official Expo/TS release posts; library-choice rationale MEDIUM where based on WebSearch synthesis)

### Recommended Stack

#### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Expo SDK | 57 (`expo@57.0.4`) | Managed RN toolchain, build/runtime, dev client | Current stable SDK as of July 2026 per npm `latest` and official changelog; ships React Native 0.86. Already locked by project constraints — confirm you scaffold with SDK 57, not an older cached template. |
| React Native | 0.86.0 (bundled by SDK 57, don't pin separately) | Native runtime | Comes bundled with SDK 57; always let Expo manage this version rather than hand-picking — mismatches are the #1 source of native build breakage in Expo projects. |
| Expo Router | 6.x (`expo-router@57.0.4`, versioned in lockstep with `expo`) | File-based navigation | Already locked per CLAUDE.md/PROJECT.md. SDK 54+ introduced the iOS 26 native bottom-tabs primitive; SDK 57 continues on Router v6. No action needed beyond scaffolding with the current template. |
| TypeScript | 5.x, NOT 7.x yet | Type safety | TypeScript 7.0 shipped in 2026 as a full Go-native compiler rewrite (10x+ faster builds) and is billed as behavior-compatible with TS 6.x, but Expo/Metro/React Native's toolchain (babel-based transpilation, `expo/tsconfig.base`, community type defs) has not yet been broadly validated against tsgo-based tooling as of this SDK. **Stay on the TypeScript 5.x line Expo's template installs** (installed automatically via `create-expo-app`) rather than manually bumping to `typescript@7`. Revisit once Expo's official templates adopt TS7 — this is a fast-moving space, treat as LOW confidence prediction, HIGH confidence on "don't manually upgrade yet." |
| Zustand | 5.0.x (`zustand@5.0.14`) | Quiz session state (current question index, answers, score, filters) | Already locked. Zustand 5 requires React 18+ (satisfied by RN 0.86's React version) and has no Provider-wrapping boilerplate — ideal for a single small store holding in-progress quiz state that doesn't need to survive app restarts. |

#### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `zod` | 4.x (`zod@4.4.3`) | Validate the local verb dataset's shape at build/test time, and validate/narrow the `POST /feedback` payload before sending | Use one Zod schema mirroring the backend's Zod contract (`message, verb, tense, subject, correctAnswer, selectedAnswer, appVersion, platform` with the exact enum literals) as a single source of truth in a `feedbackPayload.ts` module. Also write a second schema for the verb dataset (`verb, translation, isIrregular, conjugations: Record<tense, Record<subject, string>>`) and assert it against the JSON dataset in a Jest test — this is exactly the "dataset completeness/shape validation" test the PROJECT.md calls for, and Zod gives you both compile-time types (`z.infer`) and runtime validation for free. |
| Native `fetch` (global, no package) | N/A (built into Hermes/RN 0.86) | The single outbound `POST /feedback` call | Expo's own guidance is to prefer native `fetch` over axios for exactly this kind of app: one external call, no interceptor/global-auth complexity, and it keeps bundle size down. Wrap it in a small `submitFeedback()` function that does the `AbortController`-based timeout, JSON parsing, and status-code branching (201/400/500/network) called out in the requirements — see Architecture note below. Do NOT add axios for a single endpoint; it adds a dependency and bundle size for zero benefit here. |
| `expo-sharing` | current SDK-57-aligned version (`expo-sharing@57.0.3`) | **Not the right tool** — see "What NOT to Use" | `expo-sharing`'s `shareAsync` is designed for sharing **files** (images, PDFs) via `expo-file-system`, not short text strings. For "share a short score + app name message," it's the wrong primitive and adds an unneeded dependency. |
| React Native core `Share` API (`import { Share } from 'react-native'`) | ships with RN 0.86, no install needed | Native iOS share sheet for the score/app-name text message | This is the correct choice for this requirement: `Share.share({ message: 'I scored 8/10 on Portuguese Verb Quiz! 🇵🇹' })` opens the standard iOS `UIActivityViewController` with zero extra dependencies. Confirmed as the standard recommendation for plain-text sharing over `expo-sharing` or the third-party `react-native-share` package (which is only needed for advanced cases: sharing to specific target apps, multiple file types, or Android/iOS parity edge cases the project doesn't need). |
| `jest-expo` | latest SDK-57-aligned version (`jest-expo@57.0.1`) | Jest preset (`preset: 'jest-expo'`) for the whole test suite | Already locked per PROJECT.md/CLAUDE.md. Handles RN/Expo module transforms (`transformIgnorePatterns` for `node_modules/(expo|@expo|react-native|...)`) out of the box — do not hand-roll a custom Babel/Jest config, that's the most common source of "works on my machine" Jest breakage in Expo projects. |
| `jest` | 30.x (`jest@30.4.2`, pulled in transitively by `jest-expo`) | Test runner | Let `jest-expo` pin the compatible Jest major version rather than adding your own top-level `jest` dependency at a mismatched version — version skew between `jest` and `jest-expo` is a known cause of preset failures. |
| `@testing-library/react-native` | latest (matches RN 0.86 / React 18/19) | Component-level tests if any UI logic needs testing beyond pure functions | PROJECT.md's testing requirements are scoped to pure logic (quiz generation, scoring, dataset validation, payload mapping) — these need **no** RN rendering at all and should be plain Jest unit tests on plain TS modules with zero React/RN imports. Only add this library if a later phase decides to test a component's interaction logic (e.g., "tapping an answer shows feedback"); don't install it speculatively for v0 if all four required test areas are pure-function testable. |
| `expo-application` (only if you want a real `appVersion` at runtime) | current SDK-57-aligned version | Read the installed app's version string for the `appVersion` field in the feedback payload | Alternative: read `Constants.expoConfig?.version` from `expo-constants` (already a transitive dependency of most Expo apps) — simpler, no extra install. Prefer `expo-constants`'s `Constants.expoConfig.version` over adding `expo-application` unless you specifically need native build numbers later. |

#### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| `eas.json` / EAS Build (optional, later) | Cloud builds for TestFlight/App Store | Not needed to hit v0 scope (offline quiz + one API call), but note it now since "iOS-first" implies a device build is coming; no action needed this milestone. |
| ESLint (`eslint-config-expo`) | Lint | Ships with `npx create-expo-app` templates by default; keep the default config, don't fight it with a custom flat config unless a specific rule conflicts with Zustand/Zod patterns. |
| TypeScript strict mode (`extends: "expo/tsconfig.base"` + `"strict": true`) | Type safety baseline | Turn on `strict` explicitly even though Expo's base config is only lightly strict — this project's core value (accurate scoring, correct enum-literal mapping to the backend) benefits directly from strict null checks catching a missing conjugation form or mistyped enum literal at compile time, not runtime. |

### Installation

```bash
# Scaffold (already done presumably, but for reference)
npx create-expo-app@latest --template blank-typescript

# Core additions on top of the Expo Router + TS template
npx expo install zustand zod

# Dev dependencies (jest-expo pulls in jest itself; don't double-add jest)
npx expo install -D jest-expo @types/jest
npm install -D @testing-library/react-native   # only if/when component tests are added later

# Explicitly NOT needed:
# - axios (use native fetch)
# - expo-sharing / react-native-share (use RN core `Share` API)
# - @react-native-async-storage/async-storage (no persistence beyond a single in-memory quiz session — see below)
```

Use `npx expo install <pkg>` rather than plain `npm install` for any Expo-adjacent native package — it resolves the version compatible with your installed SDK automatically and is the standard-practice command for this ecosystem.

### Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| RN core `Share` API for the share sheet | `expo-sharing` | If a later milestone adds "share a results screenshot/image," `expo-sharing` (paired with `expo-file-system` and something like `react-native-view-shot`) becomes the right tool — but not for v0's plain-text score message. |
| RN core `Share` API | `react-native-share` (third-party) | If you need to target a specific app (e.g., "Share directly to Instagram Stories") or need richer Android intent control. Overkill for iOS-first plain text. |
| Native `fetch` | `axios` | If the app grows to make many API calls needing shared interceptors (e.g., auth headers, automatic retry-on-401, request/response logging middleware) — not the case here with a single unauthenticated `POST /feedback` call. |
| Zod for dataset + payload validation | `io-ts`, `yup`, hand-written type guards | `io-ts` has a steeper functional-programming learning curve for little benefit here; `yup` has weaker TypeScript inference than Zod; hand-written guards duplicate logic Zod already gives you with `.parse`/`.safeParse`. Zod is the de facto standard in the RN/Expo ecosystem in 2025/2026 and pairs naturally with a schema-first dataset. |
| Zustand (already locked) | React Context + `useReducer` | Fine for genuinely trivial state, but quiz session state (current index, per-question answer history, score, active filters) benefits from Zustand's selector-based re-render isolation without needing a Context Provider wrapper — already the project's stated rationale. |
| No persistence library for quiz session | `@react-native-async-storage/async-storage` | PROJECT.md explicitly scopes v0 to "no persistence beyond a single quiz session" — a quiz resets on app close by design. Don't add AsyncStorage speculatively; add it in a later milestone if "resume an in-progress quiz after backgrounding" or "remember toggle preferences across launches" becomes a requirement. **Superseded in v0.1** — see additions above; content caching is now a genuine requirement. |
| TypeScript 5.x (Expo template default) | TypeScript 7.0 (Go-native compiler) | Once Expo's official templates, `expo/tsconfig.base`, and community `@types/*` packages are confirmed compatible with tsgo-based tooling (check Expo's changelog/blog before adopting) — track this but don't manually force it in for v0. |

### What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| `expo-sharing` for the score share sheet | Built for file-based sharing (`shareAsync` operates on a file URI via `expo-file-system`), not plain text — using it here means adding an unnecessary file-system dependency and a URI-based API for something that's just a string. | RN core `Share.share({ message })` |
| `axios` for the single `POST /feedback` call | Adds ~5KB+ bundle size and a dependency for a single unauthenticated fetch with no need for interceptors, automatic retries, or global config — native `fetch` with a small hand-written wrapper (timeout via `AbortController`, status-code branching) covers 100% of the stated requirements. | Native `fetch` |
| Hand-rolled Jest/Babel config instead of `jest-expo` preset | Expo's RN module transforms and mocks (e.g., for `expo-constants`, native modules) are non-trivial to replicate by hand and are exactly what `jest-expo` exists to solve; hand-rolling reliably reproduces subtle "works locally, fails in CI" bugs. | `preset: 'jest-expo'` in `jest.config.js` |
| Manually bumping to `typescript@7` on this SDK | Full Go-native rewrite is very new (2026) and the Expo/Metro toolchain's compatibility with tsgo-based tooling isn't yet broadly documented/battle-tested as of this SDK release — this is a "wait one more cycle" call, not a hard incompatibility claim (no official incompatibility found, flagged LOW confidence either way). | Stay on the TS 5.x version Expo's template installs |
| `@react-native-async-storage/async-storage` for quiz session state | PROJECT.md explicitly excludes persistence beyond a single session (no login, no history) — adding storage here works against the stated scope and adds a dependency with no current use. | In-memory Zustand store only, reset on quiz restart/app relaunch. **Note: v0.1 introduces AsyncStorage for content caching (a different requirement) — see additions above; this constraint applied specifically to quiz session state and to v0.0's scope.** |
| Testing pure logic (quiz generation, scoring, dataset validation, payload mapping) through rendered components with `@testing-library/react-native` | All four required test areas from PROJECT.md are pure TypeScript functions operating on plain data (verb objects, arrays, enums) — routing them through component rendering adds RN-specific test overhead (native module mocks, act() warnings) for zero additional coverage value. | Plain Jest unit tests importing the logic modules directly, no RN/React imports in the test files |

### Stack Patterns by Variant

**If a future milestone adds "resume quiz after backgrounding" or "remember toggle preferences":**
- Add `@react-native-async-storage/async-storage` (or Zustand's `persist` middleware backed by it)
- Because that's the point at which "no persistence" is explicitly revisited as a requirement — don't pre-build for it now
- **Status: partially triggered in v0.1** — AsyncStorage is now being added, but for content caching, not quiz session resume/preferences; those remain open v2 candidates.

**If a future milestone needs authenticated calls or multiple backend endpoints:**
- Reconsider `axios` (or a thin fetch wrapper with interceptor-like middleware) at that point
- Because the current single-unauthenticated-POST shape doesn't justify the dependency; revisit if the API surface grows

**If TypeScript 7 (tsgo) becomes the Expo template default in a later SDK:**
- Adopt it then, following Expo's own upgrade guide
- Because build-speed gains are real but the ecosystem compatibility story (Metro, Babel, community type packages) is still settling as of SDK 57

### Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| `expo@57.0.4` | `expo-router@57.0.4`, `jest-expo@57.0.1`, `expo-sharing@57.0.3`, RN `0.86.0` | Always install Expo-adjacent packages via `npx expo install` so versions stay in lockstep with the SDK; manually pinning mismatched majors (e.g., an `expo-router@6` template against an older `expo@54` project) is the most common cause of Metro bundling errors. |
| `zustand@5.x` | React 18+ | RN 0.86 ships a React version satisfying this; no action needed, but don't downgrade Zustand below 5 if the project ever pins an older React for some reason. |
| `zod@4.x` | TypeScript 5.x | Zod 4's improved type inference assumes a reasonably current TS 5.x; works fine with whatever 5.x version Expo's template currently installs. |
| `jest-expo@57.0.1` | `jest@30.x` | Let `jest-expo` bring in its own compatible `jest` version rather than declaring `jest` as a separate top-level dependency at a different major. |

### Sources

- https://expo.dev/changelog/sdk-57 — official SDK 57 changelog (RN 0.86 pairing), MEDIUM-HIGH confidence (WebSearch snippet, not directly fetched)
- https://expo.dev/changelog/sdk-54 — SDK 54 Router v6 / iOS 26 bottom-tabs context, MEDIUM confidence
- npm registry `latest` dist-tags queried directly (`expo`, `expo-router`, `zustand`, `jest-expo`, `jest`, `zod`, `typescript`, `react-native`, `expo-sharing`, `@react-native-async-storage/async-storage`) — HIGH confidence, authoritative for current published versions as of 2026-07-12
- https://docs.expo.dev/versions/latest/sdk/sharing/ — official Expo Sharing docs (file-based use case), HIGH confidence
- https://reactnative.dev/docs/share — official RN core Share API docs (plain-text use case), HIGH confidence
- https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/ — official TypeScript 7.0 announcement (Go-native compiler, TS6-compatible type-checking), HIGH confidence on TS7 claims, LOW/MEDIUM confidence on Expo-specific compatibility timing (not directly documented, inferred recommendation to wait)
- WebSearch synthesis on fetch vs axios in RN/Expo context (Expo's own stated preference for native fetch) — MEDIUM confidence, multiple sources agreed

---
*Stack research for: Portuguese Verb Conjugation App — Mobile*
*v0.1 additions researched: 2026-07-13*
*v0.0 original research: 2026-07-12*
