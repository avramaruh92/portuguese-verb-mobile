# Stack Research

**Domain:** iOS-first Expo React Native offline quiz app (Expo Router + TypeScript + Zustand, single outbound REST call)
**Researched:** 2026-07-12
**Confidence:** HIGH (core versions verified against npm registry `latest` dist-tags and official Expo/TS release posts; library-choice rationale MEDIUM where based on WebSearch synthesis)

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Expo SDK | 57 (`expo@57.0.4`) | Managed RN toolchain, build/runtime, dev client | Current stable SDK as of July 2026 per npm `latest` and official changelog; ships React Native 0.86. Already locked by project constraints — confirm you scaffold with SDK 57, not an older cached template. |
| React Native | 0.86.0 (bundled by SDK 57, don't pin separately) | Native runtime | Comes bundled with SDK 57; always let Expo manage this version rather than hand-picking — mismatches are the #1 source of native build breakage in Expo projects. |
| Expo Router | 6.x (`expo-router@57.0.4`, versioned in lockstep with `expo`) | File-based navigation | Already locked per CLAUDE.md/PROJECT.md. SDK 54+ introduced the iOS 26 native bottom-tabs primitive; SDK 57 continues on Router v6. No action needed beyond scaffolding with the current template. |
| TypeScript | 5.x, NOT 7.x yet | Type safety | TypeScript 7.0 shipped in 2026 as a full Go-native compiler rewrite (10x+ faster builds) and is billed as behavior-compatible with TS 6.x, but Expo/Metro/React Native's toolchain (babel-based transpilation, `expo/tsconfig.base`, community type defs) has not yet been broadly validated against tsgo-based tooling as of this SDK. **Stay on the TypeScript 5.x line Expo's template installs** (installed automatically via `create-expo-app`) rather than manually bumping to `typescript@7`. Revisit once Expo's official templates adopt TS7 — this is a fast-moving space, treat as LOW confidence prediction, HIGH confidence on "don't manually upgrade yet." |
| Zustand | 5.0.x (`zustand@5.0.14`) | Quiz session state (current question index, answers, score, filters) | Already locked. Zustand 5 requires React 18+ (satisfied by RN 0.86's React version) and has no Provider-wrapping boilerplate — ideal for a single small store holding in-progress quiz state that doesn't need to survive app restarts. |

### Supporting Libraries

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

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| `eas.json` / EAS Build (optional, later) | Cloud builds for TestFlight/App Store | Not needed to hit v0 scope (offline quiz + one API call), but note it now since "iOS-first" implies a device build is coming; no action needed this milestone. |
| ESLint (`eslint-config-expo`) | Lint | Ships with `npx create-expo-app` templates by default; keep the default config, don't fight it with a custom flat config unless a specific rule conflicts with Zustand/Zod patterns. |
| TypeScript strict mode (`extends: "expo/tsconfig.base"` + `"strict": true`) | Type safety baseline | Turn on `strict` explicitly even though Expo's base config is only lightly strict — this project's core value (accurate scoring, correct enum-literal mapping to the backend) benefits directly from strict null checks catching a missing conjugation form or mistyped enum literal at compile time, not runtime. |

## Installation

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

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| RN core `Share` API for the share sheet | `expo-sharing` | If a later milestone adds "share a results screenshot/image," `expo-sharing` (paired with `expo-file-system` and something like `react-native-view-shot`) becomes the right tool — but not for v0's plain-text score message. |
| RN core `Share` API | `react-native-share` (third-party) | If you need to target a specific app (e.g., "Share directly to Instagram Stories") or need richer Android intent control. Overkill for iOS-first plain text. |
| Native `fetch` | `axios` | If the app grows to make many API calls needing shared interceptors (e.g., auth headers, automatic retry-on-401, request/response logging middleware) — not the case here with a single unauthenticated `POST /feedback` call. |
| Zod for dataset + payload validation | `io-ts`, `yup`, hand-written type guards | `io-ts` has a steeper functional-programming learning curve for little benefit here; `yup` has weaker TypeScript inference than Zod; hand-written guards duplicate logic Zod already gives you with `.parse`/`.safeParse`. Zod is the de facto standard in the RN/Expo ecosystem in 2025/2026 and pairs naturally with a schema-first dataset. |
| Zustand (already locked) | React Context + `useReducer` | Fine for genuinely trivial state, but quiz session state (current index, per-question answer history, score, active filters) benefits from Zustand's selector-based re-render isolation without needing a Context Provider wrapper — already the project's stated rationale. |
| No persistence library for quiz session | `@react-native-async-storage/async-storage` | PROJECT.md explicitly scopes v0 to "no persistence beyond a single quiz session" — a quiz resets on app close by design. Don't add AsyncStorage speculatively; add it in a later milestone if "resume an in-progress quiz after backgrounding" or "remember toggle preferences across launches" becomes a requirement. |
| TypeScript 5.x (Expo template default) | TypeScript 7.0 (Go-native compiler) | Once Expo's official templates, `expo/tsconfig.base`, and community `@types/*` packages are confirmed compatible with tsgo-based tooling (check Expo's changelog/blog before adopting) — track this but don't manually force it in for v0. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| `expo-sharing` for the score share sheet | Built for file-based sharing (`shareAsync` operates on a file URI via `expo-file-system`), not plain text — using it here means adding an unnecessary file-system dependency and a URI-based API for something that's just a string. | RN core `Share.share({ message })` |
| `axios` for the single `POST /feedback` call | Adds ~5KB+ bundle size and a dependency for a single unauthenticated fetch with no need for interceptors, automatic retries, or global config — native `fetch` with a small hand-written wrapper (timeout via `AbortController`, status-code branching) covers 100% of the stated requirements. | Native `fetch` |
| Hand-rolled Jest/Babel config instead of `jest-expo` preset | Expo's RN module transforms and mocks (e.g., for `expo-constants`, native modules) are non-trivial to replicate by hand and are exactly what `jest-expo` exists to solve; hand-rolling reliably reproduces subtle "works locally, fails in CI" bugs. | `preset: 'jest-expo'` in `jest.config.js` |
| Manually bumping to `typescript@7` on this SDK | Full Go-native rewrite is very new (2026) and the Expo/Metro toolchain's compatibility with tsgo-based tooling isn't yet broadly documented/battle-tested as of this SDK release — this is a "wait one more cycle" call, not a hard incompatibility claim (no official incompatibility found, flagged LOW confidence either way). | Stay on the TS 5.x version Expo's template installs |
| `@react-native-async-storage/async-storage` for quiz session state | PROJECT.md explicitly excludes persistence beyond a single session (no login, no history) — adding storage here works against the stated scope and adds a dependency with no current use. | In-memory Zustand store only, reset on quiz restart/app relaunch |
| Testing pure logic (quiz generation, scoring, dataset validation, payload mapping) through rendered components with `@testing-library/react-native` | All four required test areas from PROJECT.md are pure TypeScript functions operating on plain data (verb objects, arrays, enums) — routing them through component rendering adds RN-specific test overhead (native module mocks, act() warnings) for zero additional coverage value. | Plain Jest unit tests importing the logic modules directly, no RN/React imports in the test files |

## Stack Patterns by Variant

**If a future milestone adds "resume quiz after backgrounding" or "remember toggle preferences":**
- Add `@react-native-async-storage/async-storage` (or Zustand's `persist` middleware backed by it)
- Because that's the point at which "no persistence" is explicitly revisited as a requirement — don't pre-build for it now

**If a future milestone needs authenticated calls or multiple backend endpoints:**
- Reconsider `axios` (or a thin fetch wrapper with interceptor-like middleware) at that point
- Because the current single-unauthenticated-POST shape doesn't justify the dependency; revisit if the API surface grows

**If TypeScript 7 (tsgo) becomes the Expo template default in a later SDK:**
- Adopt it then, following Expo's own upgrade guide
- Because build-speed gains are real but the ecosystem compatibility story (Metro, Babel, community type packages) is still settling as of SDK 57

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| `expo@57.0.4` | `expo-router@57.0.4`, `jest-expo@57.0.1`, `expo-sharing@57.0.3`, RN `0.86.0` | Always install Expo-adjacent packages via `npx expo install` so versions stay in lockstep with the SDK; manually pinning mismatched majors (e.g., an `expo-router@6` template against an older `expo@54` project) is the most common cause of Metro bundling errors. |
| `zustand@5.x` | React 18+ | RN 0.86 ships a React version satisfying this; no action needed, but don't downgrade Zustand below 5 if the project ever pins an older React for some reason. |
| `zod@4.x` | TypeScript 5.x | Zod 4's improved type inference assumes a reasonably current TS 5.x; works fine with whatever 5.x version Expo's template currently installs. |
| `jest-expo@57.0.1` | `jest@30.x` | Let `jest-expo` bring in its own compatible `jest` version rather than declaring `jest` as a separate top-level dependency at a different major. |

## Sources

- https://expo.dev/changelog/sdk-57 — official SDK 57 changelog (RN 0.86 pairing), MEDIUM-HIGH confidence (WebSearch snippet, not directly fetched)
- https://expo.dev/changelog/sdk-54 — SDK 54 Router v6 / iOS 26 bottom-tabs context, MEDIUM confidence
- npm registry `latest` dist-tags queried directly (`expo`, `expo-router`, `zustand`, `jest-expo`, `jest`, `zod`, `typescript`, `react-native`, `expo-sharing`, `@react-native-async-storage/async-storage`) — HIGH confidence, authoritative for current published versions as of 2026-07-12
- https://docs.expo.dev/versions/latest/sdk/sharing/ — official Expo Sharing docs (file-based use case), HIGH confidence
- https://reactnative.dev/docs/share — official RN core Share API docs (plain-text use case), HIGH confidence
- https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/ — official TypeScript 7.0 announcement (Go-native compiler, TS6-compatible type-checking), HIGH confidence on TS7 claims, LOW/MEDIUM confidence on Expo-specific compatibility timing (not directly documented, inferred recommendation to wait)
- WebSearch synthesis on fetch vs axios in RN/Expo context (Expo's own stated preference for native fetch) — MEDIUM confidence, multiple sources agreed

---
*Stack research for: iOS-first Expo React Native offline quiz app*
*Researched: 2026-07-12*
