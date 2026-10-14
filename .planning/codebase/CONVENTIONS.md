---
last_mapped_commit: 94ea956
---

# Coding Conventions

**Analysis Date:** 2026-10-14

## Naming Patterns

**Files:**
- Domain logic files are lowercase, single-word, purpose-named: `src/dataset/{types,validate,source,remote,verbs}.ts`, `src/quiz/{engine,random,scoring,share,labels,choiceStyle,types}.ts`, `src/feedback/{types,schema,payload,submit,reasons}.ts`, `src/learning/{types,schema,explain}.ts`.
- React components are `PascalCase.tsx`: `src/components/OfflinePill.tsx`, `src/components/ExplanationPanel.tsx`, `src/feedback/ReportFeedbackModal.tsx`, `src/productFeedback/ProductFeedbackModal.tsx`.
- The `src/productFeedback/` folder is camelCase (the only multi-word directory under `src/`). New folders should stay lowercase single-word (for example `src/feedback/`, `src/quiz/`), and do not rename the existing one without a reason.
- Store files are `useXStore.ts`: `src/store/useQuizStore.ts`.
- Expo Router screens are lowercase route names: `app/_layout.tsx`, `app/index.tsx`, `app/quiz.tsx`, `app/results.tsx`. Each screen uses a default export; this is the only place default exports appear (see Module Design).
- Test files live in the top-level `__tests__/` directory, named `<domain>-<module>.test.ts` (for example `__tests__/dataset-remote.test.ts`, `__tests__/quiz-engine.test.ts`, `__tests__/productFeedback-submit.test.ts`). The dash prefix mirrors the source folder and file, not the exact path.
- One exception: `src/theme/tokens.test.ts` is co-located with `src/theme/tokens.ts`. Do not add more co-located tests; use `__tests__/`.
- Build and maintenance scripts live in `scripts/` as `.ts` files run directly by Node (`scripts/preflight.ts`, `scripts/generate-brand-assets.ts`, `scripts/validate-brand.ts`, `scripts/brand-colors.ts`). See Import Organization for the extension rule.

**Functions:**
- `camelCase`, verb-first for actions: `generate`, `sampleTriples`, `buildQuestion`, `pickDistractors`, `shuffle`, `score`, `validateDataset`, `buildFeedbackPayload`, `submitFeedback`, `submitProductFeedback`, `fetchRemoteVerbs`, `resolveVerbs`, `prefetch`, `selectExplanation`, `buildShareMessage`, `isLocalSource`.
- React components are named function declarations matching the file name: `export function ReportFeedbackModal(...)` in `src/feedback/ReportFeedbackModal.tsx`. Screens are `export default function Quiz()` style.
- Zustand store actions are bare verbs as object properties: `startQuiz`, `selectAnswer`, `advance`, `reset` (`src/store/useQuizStore.ts`).
- Event handlers local to a component use `handle*` or `on*`: `handleAdvance`, `handleExitPress`, `onConfirm` (`app/quiz.tsx`).

**Variables:**
- `camelCase` throughout.
- Truly fixed module constants use `SCREAMING_SNAKE_CASE`: `QUESTIONS_PER_SESSION`, `DISTRACTOR_COUNT` (`src/quiz/engine.ts`), `CONTENT_ENDPOINT`, `TIMEOUT_MS` (`src/dataset/remote.ts`), `FEEDBACK_ENDPOINT`, `TIMEOUT_MS` (`src/feedback/submit.ts`), `INSUFFICIENT_VERBS_MESSAGE` (`src/store/useQuizStore.ts`), `OFFLINE_PILL_TEXT` (`src/components/OfflinePill.tsx`), `API_BASE_URL` (`src/config/api.ts`).
- Module-level mutable singletons are plain `let` with a comment explaining their purpose: `startToken` (`src/store/useQuizStore.ts`), `cachedResult`, `settledSource`, `refreshInFlight` (`src/dataset/source.ts`).
- Domain enum-like arrays are `SCREAMING_SNAKE_CASE` and typed `readonly T[]`: `TENSES`, `SUBJECTS` (`src/dataset/types.ts`).
- Lookup tables are `camelCase` `Record`s: `subjectLabels`, `tenseLabels`, `tenseGrammarNames` (`src/quiz/labels.ts`), `categoryLabels`, `CATEGORY_OPTIONS` (`src/productFeedback/categories.ts`, where the array export is `SCREAMING_SNAKE_CASE`).

**Types:**
- `PascalCase` for interfaces, type aliases, and classes: `Verb`, `Tense`, `Subject`, `Triple`, `Question`, `QuizSession`, `GenerateOptions`, `VerbMode`, `FeedbackPayload`, `FeedbackReason`, `SubmitResult`, `ResolvedVerbs`, `VerbSource`, `LearningContent`, `FormMatch`.
- Props types are named `<Component>Props`: `ReportFeedbackModalProps` (`src/feedback/ReportFeedbackModal.tsx`), `OfflinePillProps` (`src/components/OfflinePill.tsx`). Both `type` and `interface` appear for props; follow the nearest neighbour file.
- Union string literal types are preferred over `enum` everywhere (`Tense`, `Subject`, `VerbMode`, `QuizStatus`, `ModalState`, `VerbSource`, `SubmitResult["status"]`). No `enum` keyword appears in `src/`, `app/`, or `__tests__/`.
- Custom error classes extend `Error`, set `this.name` explicitly, and take typed public readonly constructor parameters: `InsufficientVerbsError` (`src/quiz/types.ts`, constructor params `eligibleCount`, `required`).

## Code Style

**Formatting:**
- No Prettier config is present in the repo. Formatting is consistent but not enforced by a tool: 2-space indent, double quotes, trailing commas in multi-line literals, semicolons.
- Line length is loose. Some lines run past 100 characters (for example `app/quiz.tsx` import lines and `src/quiz/engine.ts` filter chains). Wrap long call chains the way `src/quiz/engine.ts` does (one `.flatMap` or `.filter` per line, with the callback on the same line when short).
- Millisecond timeouts use numeric separators (`15_000`, `45_000`). See Async and Concurrency Patterns.

**Linting:**
- `npm run lint` runs `expo lint`, which invokes ESLint using the repo-root flat config `eslint.config.js`. That config composes `eslint-config-expo/flat` and ignores `dist/*`. It adds no project-specific rules.
- The lint run is currently clean (exit 0, no warnings). Keep it that way; run `npm run lint` before committing.
- The one inline suppression in app/src/__tests__ code is `// eslint-disable-next-line react-hooks/exhaustive-deps` in `app/quiz.tsx` (the `beforeRemove` listener effect). Do not add new suppressions without a comment explaining why.
- React Compiler is enabled (`app.json` `experiments.reactCompiler: true`). The compiler's lint rules apply: do not read or write a ref's `.current` during render. `src/feedback/ReportFeedbackModal.tsx` documents this and tracks "previous visible" with `useState` plus the "adjusting state when a prop changes" pattern instead of `useRef` or an effect.

**Type checking:**
- `npm run typecheck` runs `tsc --noEmit`. It is currently clean.
- `tsconfig.json` extends `expo/tsconfig.base` and enables:
  ```json
  {
    "compilerOptions": {
      "strict": true,
      "noUncheckedIndexedAccess": true,
      "allowImportingTsExtensions": true,
      "types": ["jest", "node"]
    },
    "include": ["**/*.ts", "**/*.tsx", ".expo/types/**/*.ts", "expo-env.d.ts"]
  }
  ```
- `noUncheckedIndexedAccess` means every array or record index is `T | undefined`. The codebase handles this two ways, and new code should do the same:
  - Non-null assertion with a justifying comment when the invariant is provably safe. Example, `src/learning/explain.ts`: `const first = categories[0]!;` with the comment "callers only invoke classify() after confirming matches.length >= 1". Example, `src/quiz/random.ts`: swap via `result[j]!`/`result[i]!` with an "i and j are always valid indices" comment.
  - Explicit `?? default` where absence is legitimate, for example `(verbCounts.get(t.verb) ?? 0) + 1`.
  - Test helpers use `sequence[i++ % sequence.length]!` (`__tests__/quiz-random.test.ts`, `__tests__/quiz-engine.test.ts`).
- Do not disable `noUncheckedIndexedAccess` and do not use unchecked casts to silence it.
- `any` is avoided. The one occurrence in app/src/__tests__ is a `fixture` typed `any[]` in `__tests__/contract-fixture.test.ts`. Prefer `unknown` plus narrowing for new code.

## Import Organization

**Order (observed convention, not enforced by tooling):**
1. Node built-ins (scripts only), e.g. `import { readFileSync } from "node:fs";`
2. External packages: `react`, `react-native`, `expo-router`, `expo-constants`, `zustand`, `zod`, `react-native-safe-area-context`.
3. Relative imports: parent-directory modules first (`../dataset/types`, `../quiz/engine`), then sibling modules (`./schema`, `./types`).
4. Type-only imports use `import type { ... }`, either as a separate line or inline with value imports (for example `import { TENSES, SUBJECTS, type Tense, type Subject } from "../dataset/types";` in `src/feedback/schema.ts`). Both forms are present; use `import type` for pure type imports.

**Path aliases:**
- None. No `paths` mapping in `tsconfig.json`. All cross-module imports are relative (`../dataset/types`), never `@/` or `~/`.
- Barrel files (`index.ts`) are not used. Import from the specific file.

**Extension rule (scripts vs app/src):**
- `app/`, `src/`, and `__tests__/` import without a file extension: `import { colors } from "../theme/tokens";`.
- `scripts/` files are executed directly by Node's type stripping (`"generate-assets": "node scripts/generate-brand-assets.ts"`, `"preflight": "node scripts/preflight.ts"`, `"validate-brand": "node scripts/validate-brand.ts"`). Node requires an explicit extension in relative imports under type stripping, so scripts write `.ts` suffixes: `import { colors } from "../src/theme/tokens.ts";` and `import { DEPTH_FILL_HEX, ... } from "./brand-colors.ts";`.
- `tsconfig.json` sets `allowImportingTsExtensions: true` to permit this. Do not add `.ts` suffixes to imports in `app/`, `src/`, or `__tests__/`, and do not import `src/` modules from `scripts/` unless the module is dependency-free for Node (`src/theme/tokens.ts`, `src/theme/lockup.ts` are imported that way today).
- Scripts must not import modules that rely on Expo or React Native runtime. Do not import `src/config/api.ts` from `scripts/`: `scripts/preflight.ts` keeps its own literal `BASE_URL` for that reason, and `__tests__/api-host-guard.test.ts` asserts the two values match.

## TypeScript and Zod

**Zod as single source of truth:**
- Runtime schemas are paired with `z.infer` types, never a hand-written parallel interface for the same shape:
  - `src/feedback/schema.ts` defines `feedbackPayloadSchema`; `src/feedback/types.ts` derives `export type FeedbackPayload = z.infer<typeof feedbackPayloadSchema>;`.
  - `src/productFeedback/` follows the same split (`schema.ts`, `types.ts`, `payload.ts` exporting `buildProductFeedbackPayload`).
- Nested dataset schemas compose from smaller schemas that mirror the TypeScript shape: `SubjectConjugationsSchema` -> `TenseConjugationsSchema` -> `VerbSchema` in `src/dataset/validate.ts`, matching `Record<Tense, Record<Subject, string>>` in `src/dataset/types.ts`.
- Enum-like values reuse the runtime arrays: `z.enum(TENSES as unknown as [Tense, ...Tense[]])` in `src/feedback/schema.ts`. This keeps the Zod enum and TypeScript union locked to one literal. Use the same cast pattern when the source is a `readonly` array.
- Validation entry points for collections return `{ valid: boolean; errors: string[] }` and do not throw (`validateDataset` in `src/dataset/validate.ts`), accumulating messages from `safeParse` results.
- Where a failure must short-circuit a caller, check `.safeParse` explicitly and throw a descriptive `Error` (`src/dataset/remote.ts`). Avoid bare `.parse()` on external input.
- Optional remote sub-payloads degrade silently: `LearningContentSchema.safeParse(payload.learning)` in `src/dataset/remote.ts` yields `undefined` on failure instead of failing the whole dataset.

**Other type conventions:**
- `interface` is used for object shapes that are extended or implemented (`Triple`, `Question extends Triple` in `src/quiz/types.ts`); `type` is used for unions and mapped shapes.
- `as const` is used for literal tuples: `(["bug", "idea", "other"] as const).map(...)` in `src/productFeedback/categories.ts`, and for literal discriminants in `src/dataset/source.ts` (`source: "remote" as const`). Store defaults use `as` casts instead (`"idle" as QuizStatus` in `src/store/useQuizStore.ts`).
- Typed mock casts in tests use `as unknown as typeof fetch`. Do not use bare `as typeof fetch` for fake implementations.

## Error Handling

**Network and IO (result unions, never throw to callers):**
- `submitFeedback` (`src/feedback/submit.ts`) and `submitProductFeedback` (`src/productFeedback/submit.ts`) return a tagged `SubmitResult`: `{ status: "success" | "validation-error" | "server-error" | "network-error" }`. Status is decided by explicit `response.status` branching (`201`, `400`, else), with a `try/catch/finally` wrapper. Any thrown error becomes `{ status: "network-error" }`.
- Feedback `SubmitResult` for success carries `data`: `{ status: "success", data }`.

**Network and IO (throw, caught at a boundary):**
- `fetchRemoteVerbs` (`src/dataset/remote.ts`) is the exception: it throws for non-OK status, invalid shape, or network failure. `resolve()` in `src/dataset/source.ts` catches it with `catch { ... }` and returns the bundled dataset. Throw-to-fallback is the documented pattern for the content path.

**Domain errors:**
- Use a domain error class only when a caller branches on the failure mode. `InsufficientVerbsError` is caught by `instanceof` in `startQuiz` (`src/store/useQuizStore.ts`) and converted to `errorMessage`. Every other error is re-thrown, not swallowed (`throw error;` at the end of the `catch` in `startQuiz`).
- Plain `new Error("...")` with a descriptive message for programmer or contract errors (`buildQuestion` throws `Unknown verb "..."`; `fetchRemoteVerbs` throws `content fetch failed: <status>`).

**UI boundaries:**
- Screens guard missing store data with early returns, not error UI: `if (!session) return null;` and `if (!question) return null;` in `app/quiz.tsx`.
- `app/results.tsx` renders an explicit fallback with a "Back to Setup" button when the session is missing (not a blank screen).
- Store actions are async and tolerate a superseded call silently (see Async Patterns).

## Async and Concurrency Patterns

**Superseded-call guard:**
- `startQuiz` in `src/store/useQuizStore.ts` increments a module-level `startToken` before awaiting, then checks `if (token !== startToken) return;` after the await. Documented inline: it prevents a double-tap race where the first call resolves last. Reuse this token pattern for any new async store action that can be re-triggered.

**Timeouts:**
- Every outbound `fetch` uses `AbortController` plus `setTimeout`, and clears the timer in `finally`:
  ```ts
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(URL, { signal: controller.signal });
    // ...
  } finally {
    clearTimeout(timeoutId);
  }
  ```
- Timeout values are module constants: `TIMEOUT_MS = 15_000` in `src/dataset/remote.ts` (content budget); `TIMEOUT_MS = 45_000` in `src/feedback/submit.ts` and `src/productFeedback/submit.ts`. `scripts/preflight.ts` mirrors these budgets, so change them together.

**Memoized dataset resolution:**
- `src/dataset/source.ts` memoizes the resolution in a module-level `cachedResult` promise. `prefetch()` warms it without awaiting (called from `app/_layout.tsx`). `resolveVerbs()` returns the same promise to every caller.
- A `"local"` result triggers a single stale-while-revalidate background retry (`refreshInBackground`). A `"remote"` result is never re-fetched.
- Sessions snapshot `verbs`, `learning`, and `source` at `startQuiz`, so a background refresh cannot swap content mid-quiz.

**Background effects in screens:**
- `OfflinePill` (`src/components/OfflinePill.tsx`) uses the `let active = true; ... return () => { active = false; }` cleanup pattern when subscribing to a promise in `useEffect`. Follow it for any promise resolved inside an effect.
- Navigation interception uses `navigation.addListener("beforeRemove", ...)` in `app/quiz.tsx` with `e.preventDefault()` and a shared `Alert.alert` confirm. Do not add a second back-navigation path that bypasses `confirmExit`.

## State Management

- One Zustand store, `useQuizStore` (`src/store/useQuizStore.ts`), created with `create<QuizStoreState>((set, get) => ({ ...initialState, ... }))`.
- Each `initialState` field has a typed default with explicit casts for unions and arrays: `"idle" as QuizStatus`, `[] as (string | null)[]`, `null as VerbSource | null`. Reset with `set({ ...initialState })`.
- Screens subscribe to individual slices with selectors: `useQuizStore((s) => s.session)`. Do not subscribe to the whole store.
- Read state imperatively with `useQuizStore.getState()` only immediately after an awaited or synchronous store action, to see the fresh value (see `handleAdvance` in `app/quiz.tsx`). Otherwise use a selector.
- Actions guard illegal transitions early: `selectAnswer` returns if `lockedChoice !== null`; `advance` returns if there is no `session`.

## Styling and Theme

- Design tokens live in `src/theme/tokens.ts` and are exported as named constants: `colors`, `spacing`, `radius`, `typography`. There is no ThemeProvider or context.
- Components import tokens and build styles with `StyleSheet.create` at module scope (`const styles = StyleSheet.create({ ... })`, see `src/feedback/ReportFeedbackModal.tsx`, which places it at the bottom of the file).
- Hex values, pixel sizes, and font settings are not written inline in components. Use `colors.*`, `spacing.*`, `radius.*`, `typography.*`. The current `ReportFeedbackModal.tsx` follows this, so treat the tokens as the required source.
- Exact token values are asserted in `src/theme/tokens.test.ts`. Changing a token means updating that test deliberately.
- Spread typography presets into styles: `...typography.heading`.
- Layout uses safe-area insets from `useSafeAreaInsets()` (`react-native-safe-area-context`) in screens; do not hard-code top or bottom padding.
- Hex literals appear outside the tokens file only in comments (`src/theme/lockup.ts`). Keep it that way.

## Logging

- No logging library. No `console.*` calls exist in `app/` or `src/`. Do not add `console.log` to shipped code; surface failures through the result unions or the `source`/`errorMessage` state described above.

## Comments

**When to comment:**
- Explain why, not what. Examples in the codebase: the Phase/decision reference on the tier-ordering in `src/quiz/engine.ts` (`// Preterite/imperfect are the classic beginner confusion pair (D-01)`), the race rationale on `startToken`, and the React Compiler rationale in `ReportFeedbackModal.tsx`.
- Use `// noUncheckedIndexedAccess-safe: <invariant>` on non-null assertions (see Code Style).
- Cross-reference constants to their mirrors: `// src/dataset/remote.ts TIMEOUT_MS (NET-01)` in `scripts/preflight.ts`, and `// Single source of the backend host ...` in `src/config/api.ts`.
- Phase and requirement IDs (`D-01`, `FETCH-04`, `WR-01`, `NET-02`) appear in comments to tie code to planning docs under `.planning/`. Keep that convention for new decisions.

**JSDoc/TSDoc:**
- Not used. No `/** */` blocks in `src/` or `app/`. Use `//` line comments.

## Function Design

**Size and shape:**
- Small, single-purpose functions. Domain logic is split into narrow named exports so each can be unit-tested: `generate`, `sampleTriples`, `buildQuestion`, `pickDistractors` in `src/quiz/engine.ts`.
- `pickDistractors` is a tiered algorithm (same verb other subjects, same verb other tenses, cross-verb same conjugation class first). Keep tiers as commented blocks, following the existing layout.

**Parameters:**
- Inject randomness and data as trailing parameters with production defaults: `generate(options, random: () => number = Math.random, verbs: Verb[] = localVerbs)` (`src/quiz/engine.ts`). This is the test seam; do not reach for module mocks when a parameter works.
- Options objects for more than about three parameters: `GenerateOptions`, `ReportFeedbackModalProps`.
- Use `readonly` on input arrays (`readonly Triple[]`, `readonly Verb[]`) and return new arrays (`shuffle` returns a copy and leaves input unmutated, `src/quiz/random.ts`).

**Return values:**
- Pure functions return values directly. Async boundaries return result unions (see Error Handling). Validation returns `{ valid, errors }`.
- Return `undefined` explicitly for "no value" in selectors and optional lookups (`selectExplanation` returns `string | undefined`).

## Module Design

**Exports:**
- Named exports only in `src/`, `__tests__/` helpers, and `scripts/`. No default exports in `src/` (verified by search).
- Route screens in `app/` are the one place that uses `export default` (required by Expo Router).

**Barrel files:**
- None. Import the defining file directly.

**Per-domain layout:**
- `src/dataset/`, `src/quiz/`, `src/feedback/`, `src/productFeedback/`, `src/learning/` each keep shape definitions in `types.ts` and implement logic in sibling files against those types. Follow this split: define shapes in `types.ts`, and keep one concern per file.
- `src/components/` holds cross-domain UI. `src/feedback/` and `src/productFeedback/` hold their own modal next to their logic.
- `src/config/` holds build-time constants (`API_BASE_URL`). Every network module imports from there. Do not hard-code a backend host anywhere else in `app/`, `src/`, or `__tests__/`; `__tests__/api-host-guard.test.ts` enforces the single host.

## Data and Contracts

- Backend contract literals are defined once and reused:
  - `tense` and `subject` values come from `TENSES` and `SUBJECTS` (`src/dataset/types.ts`).
  - `platform` is `"ios" | "android"`, typed in `src/feedback/` and `ReportFeedbackModalProps`.
- Do not hand-write enum literals for `POST /feedback` or `/product-feedback` payloads in components; build the payload through `buildFeedbackPayload` (`src/feedback/payload.ts`) or the product feedback builder so it stays aligned with the Zod schema.
- Dataset fixtures match the backend format (`__tests__/fixtures/content-verbs-v0.4.sample.json`). Accented and tied forms are kept byte-for-byte; do not normalise Unicode in the dataset.

## Accessibility

- Accessibility props are sparse (2 occurrences of `testID`/`accessibilityLabel` across `app/` and `src/`). When adding interactive controls, provide `accessibilityRole` and `accessibilityLabel` on `Pressable` elements.

---

*Convention analysis: 2026-10-14*
