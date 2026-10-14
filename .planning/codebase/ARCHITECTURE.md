---
last_mapped_commit: 94ea956
analysis_date: 2026-10-14
focus: arch
---

<!-- refreshed: 2026-10-14 -->
# Architecture

**Analysis Date:** 2026-10-14

## System Overview

```text
┌──────────────────────────────────────────────────────────────────────────┐
│                  Expo Router screens (`app/`)                            │
├───────────────────┬────────────────────┬──────────────────┬──────────────┤
│  `index.tsx`      │   `quiz.tsx`       │  `results.tsx`   │ `_layout.tsx`│
│  (setup form)     │  (question loop)   │ (score / share)  │ (root Stack, │
│                   │                    │                  │  prefetch)   │
└────────┬──────────┴─────────┬──────────┴────────┬─────────┴──────┬───────┘
         │                    │                   │                │
         ▼                    ▼                   ▼                │
┌──────────────────────────────────────────────────────────────┐    │
│  Zustand store `src/store/useQuizStore.ts`                   │    │
│  status · filters · session · currentIndex · answers ·       │    │
│  lockedChoice · errorMessage · verbs · learning · source     │    │
│  actions: startQuiz · selectAnswer · advance · reset         │    │
└───────┬───────────────────────────────────────┬──────────────┘    │
        │ generate(options, Math.random, verbs) │ resolveVerbs()    │ prefetch()
        ▼                                       ▼                   ▼
┌──────────────────────────────┐   ┌─────────────────────────────────────────┐
│ Quiz engine `src/quiz/`      │   │ Dataset source `src/dataset/source.ts`  │
│ engine · random · scoring ·  │   │   remote-first → local fallback,        │
│ labels · choiceStyle · share │   │   module-level cache + background retry │
└──────────────────────────────┘   └───────┬───────────────────────┬─────────┘
                                           │ fetchRemoteVerbs()    │ fallback
                                           ▼                       ▼
                        ┌────────────────────────────┐  ┌──────────────────────┐
                        │ `src/dataset/remote.ts`    │  │ `src/dataset/verbs.ts`│
                        │ GET {API_BASE_URL}         │  │ bundled 50 verbs      │
                        │   /content/verbs  (15s)    │  └──────────────────────┘
                        │ → validate.ts + learning   │
                        └─────────────┬──────────────┘
                                      │ base URL from `src/config/api.ts`
                                      ▼
                   https://portuguese-verb-api-fra.onrender.com (Frankfurt)

┌──────────────────────────────────────────────────────────────────────────┐
│ Feedback submission (two independent modules, same POST shape pattern)   │
│  `src/feedback/`         ReportFeedbackModal → payload → submit          │
│                          → POST {API_BASE_URL}/feedback        (45s)     │
│  `src/productFeedback/`  ProductFeedbackModal → payload → submit         │
│                          → POST {API_BASE_URL}/product-feedback (45s)    │
└──────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────┐
│ Learning layer `src/learning/` (pure): explain.ts selects a template-    │
│ based explanation for a wrong answer, using remote-only `learning` data  │
│ and optional `formIndex` on verbs. Rendered via `ExplanationPanel`.      │
└──────────────────────────────────────────────────────────────────────────┘
```

## Component Responsibilities

| Component | Responsibility | File |
|-----------|----------------|------|
| Root layout | Wraps app in `SafeAreaProvider`, sets `StatusBar`, configures the native `Stack` (`headerShown: true` default), sets system background, calls `prefetch()` once on mount | `app/_layout.tsx` |
| Setup screen | Tense multi-select (+ "all" toggle), verb mode (`regular_only` default / `mixed` / `irregular_only`), calls `startQuiz`, `router.replace("/quiz")` on `in-progress`; hosts setup-level `ProductFeedbackModal` | `app/index.tsx` |
| Quiz screen | Renders one question at a time from the store, locks the choice, shows `ExplanationPanel` on a wrong answer, hosts `ReportFeedbackModal` and `ProductFeedbackModal`, intercepts header Exit and native back (`beforeRemove`) through one confirm dialog | `app/quiz.tsx` |
| Results screen | Computes `{ correct, total }` via `score()`, Share (RN `Share`), Try Again (re-runs `startQuiz(filters)`), Back to Setup; hosts `ProductFeedbackModal`; renders its own fallback if no session | `app/results.tsx` |
| Quiz store | Single Zustand store for all quiz session state and the transitions `idle → in-progress → completed` / `error`; orchestrates `resolveVerbs()` and `generate()` | `src/store/useQuizStore.ts` |
| Quiz engine | Pure: `(options, random, verbs)` → `QuizSession` of 10 questions with 3 distractors each, filtered by verb mode | `src/quiz/engine.ts` |
| Quiz helpers | Injectable Fisher-Yates `shuffle`; `score`; `buildShareMessage`; tense/subject label tables; per-choice visual state | `src/quiz/random.ts`, `src/quiz/scoring.ts`, `src/quiz/share.ts`, `src/quiz/labels.ts`, `src/quiz/choiceStyle.ts` |
| Quiz types | `Triple`, `Question`, `QuizSession`, `VerbMode`, `GenerateOptions`, `InsufficientVerbsError` | `src/quiz/types.ts` |
| Dataset source | `prefetch()` / `resolveVerbs()`: remote-first with local fallback, module-level cache, stale-while-revalidate background retry when the cache is `local` | `src/dataset/source.ts` |
| Remote fetch | `GET ${API_BASE_URL}/content/verbs` with 15s `AbortController` timeout; throws on non-OK, bad JSON, invalid verbs; parses optional `learning` leniently | `src/dataset/remote.ts` |
| Local dataset | Hand-authored `verbs: Verb[]` (50 verbs, 4 tenses × 6 subjects); fallback and default for `generate()`. No `formIndex` or `learning` data | `src/dataset/verbs.ts` |
| Dataset types / validation | `Tense`, `Subject`, `TENSES`, `SUBJECTS`, `Verb` (`src/dataset/types.ts`); Zod `validateDataset` returning `{ valid, errors }` (`src/dataset/validate.ts`) | `src/dataset/types.ts`, `src/dataset/validate.ts` |
| Learning content | Zod schema for remote `learning` payload (`schema.ts`), its types (`types.ts`), and `selectExplanation` (`explain.ts`) | `src/learning/schema.ts`, `src/learning/types.ts`, `src/learning/explain.ts` |
| Explanation panel | Presentational view for a wrong-answer explanation string | `src/components/ExplanationPanel.tsx` |
| Offline pill | Shows "Using saved content" when the source is `local`; takes a snapshotted `source` prop on quiz/results, otherwise resolves live on setup | `src/components/OfflinePill.tsx` |
| Report feedback (quiz-question) | Modal with reason picker + optional free text; builds `FeedbackPayload`; `submitFeedback` → `POST /feedback` | `src/feedback/ReportFeedbackModal.tsx`, `src/feedback/payload.ts`, `src/feedback/schema.ts`, `src/feedback/submit.ts`, `src/feedback/reasons.ts`, `src/feedback/types.ts` |
| Product feedback | Modal with category (`bug`/`idea`/`other`) + message, tagged with screen (`setup`/`quiz`/`results`); `POST /product-feedback` | `src/productFeedback/ProductFeedbackModal.tsx`, `src/productFeedback/payload.ts`, `src/productFeedback/schema.ts`, `src/productFeedback/submit.ts`, `src/productFeedback/categories.ts`, `src/productFeedback/types.ts` |
| Config | Single source of the backend host, `API_BASE_URL = "https://portuguese-verb-api-fra.onrender.com"` | `src/config/api.ts` |
| Theme | Flat token exports `colors`, `spacing`, `radius`, `typography`; `lockup.ts` holds crop constants for the homepage lockup image | `src/theme/tokens.ts`, `src/theme/lockup.ts` |

## Pattern Overview

**Overall:** Thin Expo Router screens over one global Zustand store, backed by framework-free domain modules (`quiz/`, `dataset/`, `learning/`, `feedback/`, `productFeedback/`). Components do not fetch data directly; the store and `dataset/source.ts` own content resolution. Each network surface is a small `submit`/`fetch` module that returns a tagged result or throws in one documented case.

**Key Characteristics:**
- One global store (`useQuizStore`) is the only cross-screen state. Screens subscribe with selectors (`useQuizStore((s) => s.session)`). No route params carry quiz data.
- Domain logic lives in plain `.ts` files with no React or React Native imports (`src/quiz/*.ts`, `src/dataset/*.ts`, `src/learning/explain.ts`, `src/feedback/payload.ts`, `src/feedback/submit.ts`, `src/productFeedback/*.ts`). These are the units under Jest in `__tests__/`.
- Dependency injection for determinism: `generate(options, random = Math.random, verbs = localVerbs)` and `sampleTriples` / `buildQuestion` / `pickDistractors` accept a `random` function. Tests supply deterministic sequences.
- Remote-first, local-fallback content: `src/dataset/source.ts` tries `GET /content/verbs` and silently falls back to the bundled `src/dataset/verbs.ts` on any failure. The fallback path is the worst case, not the only path.
- Session snapshotting: `startQuiz` copies `verbs`, `learning`, and `source` into the store, so a later background refresh of the dataset cache cannot change questions or the pill mid-session.
- Two feedback surfaces, both POST-only, both with a 45s abort timeout. Neither reads from the backend.
- Every network call is wrapped in `AbortController` plus `try { ... } finally { clearTimeout }`.

## Layers

**Routes / Screens (`app/`):**
- Purpose: Render UI, read and write the store, perform navigation, host modals.
- Location: `app/_layout.tsx`, `app/index.tsx`, `app/quiz.tsx`, `app/results.tsx`
- Contains: React components, `StyleSheet.create` blocks, `Stack.Screen` option overrides, `useRouter` / `useNavigation` calls.
- Depends on: `src/store/useQuizStore.ts`, `src/quiz/*`, `src/dataset/types.ts`, `src/dataset/source.ts` (layout only), `src/learning/explain.ts`, `src/feedback/ReportFeedbackModal.tsx`, `src/productFeedback/ProductFeedbackModal.tsx`, `src/components/*`, `src/theme/*`.
- Used by: nothing. These are the Expo Router entry points.

**State (`src/store/`):**
- Purpose: Own all in-memory quiz state and the status transitions.
- Location: `src/store/useQuizStore.ts` (the only file in the folder).
- Depends on: `src/quiz/engine.ts`, `src/quiz/types.ts` (`InsufficientVerbsError`), `src/dataset/source.ts` (`resolveVerbs`).
- Used by: `app/index.tsx`, `app/quiz.tsx`, `app/results.tsx`.

**Quiz domain (`src/quiz/`):**
- Purpose: Question generation, scoring, labels, per-choice styling, share text.
- Depends on: `src/dataset/types.ts` and `src/dataset/verbs.ts` (engine default). Otherwise self-contained.
- Used by: the store (`engine.ts`), screens (`labels`, `scoring`, `share`, `choiceStyle`), and `learning/explain.ts` (`labels.ts`).

**Dataset domain (`src/dataset/`):**
- Purpose: Canonical verb types, local dataset, remote fetch, validation, source resolution and caching.
- Depends on: `src/config/api.ts`, `src/learning/schema.ts` (remote `learning` parse), `src/learning/types.ts` (type only), `zod`.
- Used by: the store, `OfflinePill`, `app/_layout.tsx` (prefetch), quiz engine.

**Learning domain (`src/learning/`):**
- Purpose: Turn a wrong answer into a template-based explanation using remote-served `learning` content.
- Depends on: `src/dataset/types.ts`, `src/quiz/labels.ts`, `zod`.
- Used by: `app/quiz.tsx` (via `selectExplanation`), and `src/dataset/remote.ts` (schema).
- Note: `learning` is `undefined` whenever the local fallback is in use, so explanations only appear when the remote payload supplied them. Likewise `formIndex` is optional and is not present in `src/dataset/verbs.ts`.

**Feedback domains (`src/feedback/`, `src/productFeedback/`):**
- Purpose: Payload construction, Zod contract, POST submission, modal UI.
- Depends on: `src/config/api.ts`, `src/dataset/types.ts` (feedback only), `zod`, `src/theme/tokens.ts`.
- Used by: `app/quiz.tsx` (`ReportFeedbackModal`, `ProductFeedbackModal`), `app/index.tsx` and `app/results.tsx` (`ProductFeedbackModal`).

**Shared UI and tokens (`src/components/`, `src/theme/`):**
- Purpose: Reusable presentational pieces and design tokens. No ThemeProvider or context.
- Contains: `OfflinePill.tsx` (reads `resolveVerbs()` when no session source is passed), `ExplanationPanel.tsx`, `tokens.ts`, `lockup.ts`.

**Config (`src/config/`):**
- Purpose: One constant, `API_BASE_URL`. All app network calls derive their URL from it. `scripts/preflight.ts` keeps its own literal, and `__tests__/api-host-guard.test.ts` guards the retired host.

## Data Flow

### Primary Request Path (start quiz → answer → results)

1. `RootLayout` mounts and calls `prefetch()`, which starts `fetchRemoteVerbs()` in the background (`app/_layout.tsx`, `src/dataset/source.ts`).
2. The learner selects tenses and verb mode on the setup screen and taps Start. `handleStartQuiz` calls `startQuiz({ tenses, verbMode })` (`app/index.tsx`).
3. `startQuiz` increments `startToken`, awaits `resolveVerbs()` (reuses the prefetch promise), and bails out if superseded (`src/store/useQuizStore.ts`).
4. `generate(options, undefined, verbs)` filters verbs by `verbMode`, builds the `(verb, tense, subject)` pool, samples 10 with `sampleTriples`, and builds each `Question` with `buildQuestion` / `pickDistractors` (`src/quiz/engine.ts`).
5. The store sets `status: "in-progress"` and snapshots `verbs`, `learning`, `source`. The setup screen calls `router.replace("/quiz")` (`app/index.tsx`).
6. The quiz screen renders `session.questions[currentIndex]`. Tapping a choice calls `selectAnswer`, which sets `lockedChoice`. On a wrong answer, `selectExplanation` may produce text for `ExplanationPanel` (`app/quiz.tsx`, `src/learning/explain.ts`).
7. Next calls `advance()`. It appends `lockedChoice` to `answers` and either advances `currentIndex` or sets `status: "completed"` after question 10 (`src/store/useQuizStore.ts`).
8. The quiz screen sees `completed` and calls `router.replace("/results")` (`app/quiz.tsx`).
9. Results computes `score(session, answers)` and renders Share, Try Again (`startQuiz(filters)` then `replace("/quiz")`), and Back to Setup (`app/results.tsx`, `src/quiz/scoring.ts`).

### Dataset Resolution Path

1. `prefetch()` sets `cachedResult` if empty. `resolveVerbs()` returns the cached promise, or starts one if needed (`src/dataset/source.ts`).
2. `resolve()` calls `fetchRemoteVerbs()` (15s timeout). Success yields `source: "remote"` with remote verbs and optional `learning`. Any throw yields `source: "local"` with `localVerbs` (`src/dataset/source.ts`, `src/dataset/remote.ts`).
3. `fetchRemoteVerbs` throws on non-OK status, non-array `payload.verbs`, or failed `validateDataset`. A failed `LearningContentSchema.safeParse` is not fatal. `learning` is just `undefined` (`src/dataset/remote.ts`).
4. If the cached result is `local` when `resolveVerbs()` is called again, `refreshInBackground()` runs one remote retry. On success, the next `resolveVerbs()` returns `remote`. A remote result is never re-fetched (`src/dataset/source.ts`, Phase 36 WR-01).

### Feedback Submission Path (quiz question report)

1. The learner taps "Report a problem" on the quiz screen. `ReportFeedbackModal` opens with verb, tense, subject, correct and selected answer, `appVersion` (from `expo-constants`), and `platform` (`app/quiz.tsx`).
2. On submit, `buildFeedbackPayload` maps the reason label and free text into `message` and returns a `FeedbackPayload` (`src/feedback/payload.ts`).
3. `submitFeedback` POSTs JSON to `${API_BASE_URL}/feedback` and maps the status to a `SubmitResult`: 201 → success, 400 → validation-error, anything else → server-error, thrown or aborted → network-error (`src/feedback/submit.ts`).
4. The modal shows success (auto-closes) or error. Retry is offered for server and network errors only (`src/feedback/ReportFeedbackModal.tsx`).

### Product Feedback Path

1. Any of the three screens opens `ProductFeedbackModal` with `screen` set to `setup`, `quiz`, or `results` (`app/index.tsx`, `app/quiz.tsx`, `app/results.tsx`).
2. `buildProductFeedbackPayload` trims the message and attaches category, screen, `appVersion`, and `platform` (`src/productFeedback/payload.ts`).
3. `submitProductFeedback` POSTs to `${API_BASE_URL}/product-feedback` with the same status mapping as feedback submission, and a 45s timeout (`src/productFeedback/submit.ts`).

**State Management:**
- All quiz state lives in one Zustand store. `reset()` restores `initialState`. Quiz exit calls `reset()` and then `router.replace("/")`.
- `startToken` (module scope in the store) makes only the most recent `startQuiz` call commit. This prevents a double-tap race.
- `cachedResult`, `settledSource`, and `refreshInFlight` (module scope in `src/dataset/source.ts`) persist for the JS process lifetime. Nothing resets them between sessions.
- Nothing persists across app restarts. There is no AsyncStorage.

## Key Abstractions

**`Verb` / `Tense` / `Subject`:**
- Purpose: The dataset shape shared by local and remote content.
- Examples: `src/dataset/types.ts`, `src/dataset/verbs.ts`, `src/dataset/validate.ts`
- Pattern: `Verb = { verb, translation, isIrregular, conjugations: Record<Tense, Record<Subject, string>>, formIndex? }`. `TENSES` and `SUBJECTS` are `readonly` runtime arrays. Zod enums are built from them, so TypeScript and Zod stay in sync.

**`Triple` / `Question` / `QuizSession`:**
- Purpose: A `(verb, tense, subject)` cell, extended with `choices` and `correctAnswer`, then grouped into a 10-question session.
- Examples: `src/quiz/types.ts`
- Pattern: Plain interfaces. `InsufficientVerbsError` is the only class, and the store catches it by `instanceof`.

**`LearningContent`:**
- Purpose: Remote-served templates and per-verb notes that drive wrong-answer explanations.
- Examples: `src/learning/types.ts`, `src/learning/schema.ts`, `src/learning/explain.ts`
- Pattern: Zod schema (`LearningContentSchema`, `version: 1`) parsed leniently in `remote.ts`. `selectExplanation` returns `undefined` on any missing piece, so the UI never blocks.

**`ResolvedVerbs` / `VerbSource`:**
- Purpose: The dataset plus where it came from (`"remote"` or `"local"`).
- Examples: `src/dataset/source.ts`
- Pattern: Consumed by the store, which snapshots it into session state. The pill reads it.

**`FeedbackPayload` / `ProductFeedbackPayload`:**
- Purpose: Exact request bodies for the two POST endpoints.
- Examples: `src/feedback/schema.ts` + `src/feedback/types.ts`; `src/productFeedback/schema.ts` + `src/productFeedback/types.ts`
- Pattern: Type is `z.infer<typeof schema>`. The schema is the single source of truth. `FeedbackPayload` reuses `TENSES`/`SUBJECTS`.

**`SubmitResult`:**
- Purpose: Tagged union from network submit functions, so callers never catch raw errors.
- Examples: `src/feedback/types.ts`, `src/productFeedback/types.ts` (defined separately in each module)
- Pattern: `{ status: "success" | "validation-error" | "server-error" | "network-error" }`, plus `data` on success.

## Entry Points

**`app/_layout.tsx`:**
- Location: `app/_layout.tsx`
- Triggers: Expo Router mounts it at app launch.
- Responsibilities: Calls `prefetch()` in a `useEffect`, sets system background color via `expo-system-ui`, wraps the tree in `SafeAreaProvider`, and renders the `Stack`.

**`app/index.tsx` (route `/`):**
- Location: `app/index.tsx`
- Triggers: Cold start. Also the target of `router.replace("/")` from quiz exit and results Back to Setup.
- Responsibilities: Tense and verb-mode selection, `startQuiz`, `InsufficientVerbsError` message, `ProductFeedbackModal` (`screen: "setup"`), `OfflinePill` (live resolution).

**`app/quiz.tsx` (route `/quiz`):**
- Location: `app/quiz.tsx`
- Triggers: `router.replace("/quiz")` once status is `in-progress`.
- Responsibilities: Question rendering, choice locking, explanation, progress, header Exit and `beforeRemove` guard through one `Alert` confirm, `ReportFeedbackModal`, `ProductFeedbackModal`, `OfflinePill` with session `source`.

**`app/results.tsx` (route `/results`):**
- Location: `app/results.tsx`
- Triggers: `router.replace("/results")` once status is `completed`.
- Responsibilities: Score, share, Try Again (re-`startQuiz(filters)`), Back to Setup, `ProductFeedbackModal` (`screen: "results"`), `OfflinePill` with session `source`.

**Module-level singletons (no entry, but side-effectful at import):**
- `src/dataset/source.ts`: lazy promise cache, primed by `prefetch()`.
- `src/store/useQuizStore.ts`: `startToken` counter and the Zustand store.

## Architectural Constraints

- **Threading:** Single-threaded JS runtime (Hermes). No workers. All async work is `fetch` promises.
- **Global state:** Module-level `cachedResult`, `settledSource`, `refreshInFlight` in `src/dataset/source.ts`, and `startToken` in `src/store/useQuizStore.ts`. None are reset by `reset()`.
- **Network surfaces:** Exactly three endpoints, all on `API_BASE_URL` (`src/config/api.ts`): `GET /content/verbs`, `POST /feedback`, `POST /product-feedback`. `scripts/preflight.ts` also probes `GET /health`. No Supabase or credentials in the client. The app never writes to a database directly.
- **Timeouts:** Content fetch 15s (`src/dataset/remote.ts`). Both POST submits 45s (`src/feedback/submit.ts`, `src/productFeedback/submit.ts`).
- **Import direction:** `app/` → `src/store/` → (`src/quiz/`, `src/dataset/`) → (`src/learning/`, `src/config/`). `src/feedback/` and `src/productFeedback/` are used by screens only. `src/learning/explain.ts` imports `src/quiz/labels.ts`. No cycles observed.
- **Native configuration:** `app.json` `expo.name` is `Lafa` and `expo.scheme` is `lafa`, but `expo.slug` stays `portuguese-verb-mobile` (Phase 24-03 reverted it because `lafa` broke `eas build`; see `CLAUDE.md`). Build and submit config is in `eas.json`. `ios/` exists locally but is git-ignored (managed by Expo prebuild).

## Anti-Patterns

### Bypassing the store with `useQuizStore.getState()` for navigation decisions

**What happens:** `app/index.tsx`, `app/results.tsx`, and `app/quiz.tsx` call `useQuizStore.getState().status` right after an awaited store action, then route based on it.
**Why it's wrong:** It is correct here because it reads the value after the `await`, avoiding a stale closure. It is easy to copy into a context where a subscribed selector would be simpler and reactive.
**Do this instead:** Use `getState()` only immediately after an awaited action. For rendering, use `useQuizStore((s) => s.field)`.

### Duplicated submit modules with divergent result types

**What happens:** `src/feedback/submit.ts` and `src/productFeedback/submit.ts` each define their own `SubmitResult` and near-identical fetch logic.
**Why it's wrong:** Any change to status mapping or timeout has to be made twice. `src/productFeedback/types.ts` duplicates the union from `src/feedback/types.ts`.
**Do this instead:** When adding a third submit surface, reuse the same status mapping shape, or extract a shared helper, rather than copying a third time.

### Local fallback has no learning or formIndex data

**What happens:** `src/dataset/verbs.ts` contains only `Verb` entries. `learning` is `undefined` on the local path, so `selectExplanation` returns nothing and no explanation shows offline.
**Why it's wrong:** Offline quiz play gets no wrong-answer teaching, which differs from online play.
**Do this instead:** When adding learning content for offline use, bundle it through `src/learning/` and feed it into `resolve()` in `src/dataset/source.ts` as the local-side `learning` value.

## Error Handling

**Strategy:** Network and content failures never reach the user as raw errors. Dataset failures fall back silently to bundled content. Feedback failures show an in-modal state. Domain errors that callers branch on use a dedicated class (`InsufficientVerbsError`).

**Patterns:**
- `resolve()` in `src/dataset/source.ts` catches every failure of `fetchRemoteVerbs` and returns the local fallback.
- `startQuiz` converts `InsufficientVerbsError` into `status: "error"` plus `errorMessage`. Other errors are rethrown and caught by the screen (`app/index.tsx` `setUnexpectedError`).
- Submit functions return `{ status }`. They never throw.
- Screens guard with `if (!session) return null` (`app/quiz.tsx`) or render a fallback with a route back to setup (`app/results.tsx`).

## Cross-Cutting Concerns

**Logging:** None detected. No logging library and no `console` calls in `src/` or `app/`.
**Validation:** Zod at each external boundary: `src/dataset/validate.ts` (verbs, remote), `src/learning/schema.ts` (remote learning, lenient), `src/feedback/schema.ts` and `src/productFeedback/schema.ts` (payload types. Runtime `.parse` before submit is not called in the submit path).
**Authentication:** None. No login, accounts, or sessions, which matches the backend contract.
**Theming:** `src/theme/tokens.ts` is imported by all screens and by both feedback modals. `ReportFeedbackModal.tsx` uses tokens (no hardcoded hex literals found). Treat `tokens.ts` as the only source of colors and spacing.

---

*Architecture analysis: 2026-10-14*
