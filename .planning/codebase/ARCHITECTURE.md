<!-- refreshed: 2026-07-18 -->
# Architecture

**Analysis Date:** 2026-07-18

## System Overview

```text
┌─────────────────────────────────────────────────────────────────────┐
│                    Expo Router screens (`app/`)                      │
├───────────────┬────────────────────┬──────────────────┬─────────────┤
│  `index.tsx`  │    `quiz.tsx`      │   `results.tsx`  │ `_layout.tsx`│
│  (setup form) │  (question loop)   │   (score/share)  │ (root shell) │
└───────┬───────┴─────────┬──────────┴─────────┬─────────┴─────┬──────┘
        │                 │                    │               │
        ▼                 ▼                    ▼               │
┌─────────────────────────────────────────────────────────────┐│
│           Zustand store `src/store/useQuizStore.ts`          ││
│   status / filters / session / currentIndex / answers /      ││
│   lockedChoice / errorMessage  +  startQuiz/selectAnswer/     ││
│   advance/reset actions                                       ││
└───────┬───────────────────────────────┬───────────────────────┘│
        │ calls generate()               │ calls resolveVerbs()   │
        ▼                                ▼                        │
┌──────────────────────────┐   ┌──────────────────────────────┐   │
│  Quiz engine `src/quiz/`  │   │  Dataset layer `src/dataset/` │   │
│  engine.ts / random.ts /  │◀──│  types.ts / verbs.ts (local,  │   │
│  scoring.ts / share.ts /  │   │  1954 lines) / remote.ts /    │◀──┘ prefetch() on app mount
│  labels.ts / types.ts     │   │  source.ts / validate.ts      │
└────────────────────────────┘   └───────────────┬──────────────┘
                                                    │ GET (fetch, 90s timeout)
                                                    ▼
                                   https://portuguese-verb-api.onrender.com
                                              /content/verbs

┌─────────────────────────────────────────────────────────────┐
│        Feedback flow `src/feedback/`                         │
│  ReportFeedbackModal.tsx → payload.ts → schema.ts (Zod) →     │
│  submit.ts  --POST-->  https://portuguese-verb-api            │
│                          .onrender.com/feedback                │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  Shared UI: `src/components/OfflinePill.tsx`,                 │
│  `src/theme/tokens.ts` (colors/spacing/radius/typography)     │
│  — imported directly by screens and ReportFeedbackModal       │
└─────────────────────────────────────────────────────────────┘
```

## Component Responsibilities

| Component | Responsibility | File |
|-----------|----------------|------|
| Root layout | Wraps the app in `SafeAreaProvider`, configures the `Stack` navigator, kicks off dataset prefetch on mount | `app/_layout.tsx` |
| Setup screen | Lets the learner pick tenses + irregular-verb toggle, calls `startQuiz`, navigates to `/quiz` on success | `app/index.tsx` |
| Quiz screen | Renders one question at a time from the store, locks the choice on tap, shows correct/incorrect state, hosts the "Report a problem" modal, intercepts back-navigation with a confirm dialog | `app/quiz.tsx` |
| Results screen | Reads the completed session + answers from the store, computes score via `score()`, offers Share Score (native `Share` API), Try Again (re-runs `startQuiz` with the same filters), and Back to Setup | `app/results.tsx` |
| Quiz store | Single Zustand store holding all in-memory quiz session state and orchestrating dataset resolution + question generation | `src/store/useQuizStore.ts` |
| Quiz engine | Pure functions that turn `(tenses, includeIrregular)` + a verb list into a 10-question `QuizSession` with shuffled multiple-choice distractors | `src/quiz/engine.ts` |
| Random/scoring/share helpers | Injectable Fisher-Yates shuffle (`random.ts`), score tally (`scoring.ts`), share-message text (`share.ts`), UI label lookup tables (`labels.ts`) | `src/quiz/random.ts`, `src/quiz/scoring.ts`, `src/quiz/share.ts`, `src/quiz/labels.ts` |
| Dataset source resolver | Tries a remote content fetch first, falls back to the bundled local dataset, memoizes the result for the process lifetime | `src/dataset/source.ts` |
| Remote dataset fetch | `fetch()`-based GET to the backend's `/content/verbs` endpoint with a 90s abort timeout and Zod-validated response shape | `src/dataset/remote.ts` |
| Local dataset | Hand-authored, hard-coded array of `Verb` objects (50 verbs × 4 tenses × 6 subjects) used as the offline fallback and as `quiz/engine.ts`'s default parameter | `src/dataset/verbs.ts` |
| Dataset types/validation | `Tense`/`Subject`/`Verb` types and `TENSES`/`SUBJECTS` constants (`types.ts`); Zod schema validating any dataset (local or remote) shape (`validate.ts`) | `src/dataset/types.ts`, `src/dataset/validate.ts` |
| Feedback modal | Presents a report-a-problem sheet (reason picker + free text), builds the payload, calls `submitFeedback`, shows success/error/retry UI | `src/feedback/ReportFeedbackModal.tsx` |
| Feedback payload/schema | Maps modal inputs into the exact backend contract shape (`payload.ts`); Zod schema mirroring the backend's `POST /feedback` Zod contract, used both for typing (`z.infer`) and future validation (`schema.ts`) | `src/feedback/payload.ts`, `src/feedback/schema.ts` |
| Feedback submit | `fetch()` POST to `/feedback` with a 90s abort timeout, branches on `201`/`400`/other/network-error into a `SubmitResult` union | `src/feedback/submit.ts` |
| Offline indicator | Small pill shown on every screen when the dataset source resolved to `"local"` (i.e. the remote fetch failed) | `src/components/OfflinePill.tsx` |
| Theme tokens | Flat exports for `colors`, `spacing`, `radius`, `typography` — imported directly (no ThemeProvider/context) by every screen and component | `src/theme/tokens.ts` |

## Pattern Overview

**Overall:** Thin, mostly-presentational Expo Router screens that read/write a single global Zustand store, backed by pure-function modules (`quiz/`, `dataset/`, `feedback/`) with no React or RN imports. There is no client-side routing logic beyond `expo-router`'s file-based `Stack`, no context providers besides `SafeAreaProvider`, and no component library — every screen defines its own `StyleSheet.create` block using shared tokens.

**Key Characteristics:**
- Single global Zustand store (`useQuizStore`) is the only piece of cross-screen state; screens select individual slices via selector functions (e.g. `useQuizStore((s) => s.session)`)
- Business logic (question generation, scoring, distractor selection, dataset resolution, feedback payload shaping) lives entirely outside React components in plain `.ts` modules under `src/quiz/`, `src/dataset/`, `src/feedback/` — these are the units covered by Jest tests in `__tests__/`
- Dependency injection for testability: `generate(options, random, verbs)` and `sampleTriples`/`buildQuestion`/`pickDistractors` all accept an injectable `random: () => number` parameter (defaults to `Math.random`) so tests can supply deterministic sequences
- "Remote-first, local-fallback" content strategy: `src/dataset/source.ts` always tries the backend's `/content/verbs` endpoint first and silently falls back to the bundled `src/dataset/verbs.ts` array on any failure — the "entirely offline" framing in project docs describes the *worst case*/fallback path, not the only path (see Architectural Constraints)
- Result-memoization via a module-level `cachedResult` promise in `source.ts`, primed early by `prefetch()` in `app/_layout.tsx` so the setup screen doesn't pay the fetch latency cost
- No navigation params carry quiz data — screens communicate exclusively through the shared store, not through `expo-router` route params

## Layers

**Screens (`app/`):**
- Purpose: Render UI, read/write the Zustand store, handle navigation and user input
- Location: `app/*.tsx`
- Contains: React components, `StyleSheet.create` blocks, `Stack.Screen` option overrides
- Depends on: `src/store/useQuizStore.ts`, `src/quiz/labels.ts`, `src/quiz/scoring.ts`, `src/quiz/share.ts`, `src/dataset/types.ts`, `src/dataset/verbs.ts`, `src/feedback/ReportFeedbackModal.tsx`, `src/theme/tokens.ts`, `src/components/OfflinePill.tsx`
- Used by: nothing (top of the dependency graph; these are the route entry points Expo Router mounts)

**State (`src/store/`):**
- Purpose: Own all in-memory quiz session state and the transitions between `idle → in-progress → completed`/`error`
- Location: `src/store/useQuizStore.ts`
- Contains: One Zustand `create()` store with state fields and action methods
- Depends on: `src/quiz/engine.ts` (`generate`), `src/quiz/types.ts` (`InsufficientVerbsError`), `src/dataset/source.ts` (`resolveVerbs`)
- Used by: all three screens in `app/`

**Domain logic (`src/quiz/`, `src/dataset/`, `src/feedback/`):**
- Purpose: Pure, framework-free business logic — question generation/scoring, dataset resolution/validation, feedback payload construction/submission
- Location: `src/quiz/*.ts`, `src/dataset/*.ts`, `src/feedback/*.ts` (`ReportFeedbackModal.tsx` is the one RN component in this layer)
- Contains: Plain TypeScript functions/types, one Zod schema per external contract (dataset shape, feedback payload shape)
- Depends on: each other (`quiz/engine.ts` imports `dataset/types.ts` and `dataset/verbs.ts`; `feedback/schema.ts` imports `dataset/types.ts`), plus `zod`
- Used by: `src/store/useQuizStore.ts` (quiz engine, dataset source), `app/quiz.tsx` and `app/results.tsx` directly (labels, scoring, share, verbs, feedback modal)

**Shared UI primitives (`src/components/`, `src/theme/`):**
- Purpose: Reusable presentational building blocks and design tokens
- Location: `src/components/OfflinePill.tsx`, `src/theme/tokens.ts`
- Contains: One small component, one flat token module (no ThemeProvider)
- Depends on: `src/dataset/source.ts` (OfflinePill reads `resolveVerbs()` to detect the local-fallback case)
- Used by: all three screens; `theme/tokens.ts` is also imported by `ReportFeedbackModal.tsx` in some places (note: the modal currently hardcodes its own hex colors/spacing rather than importing tokens — see Anti-Patterns)

## Data Flow

### Primary Request Path (start quiz → answer → results)

1. App mounts, `RootLayout` calls `prefetch()` which fires the remote dataset fetch in the background (`app/_layout.tsx:8`, `src/dataset/source.ts:18-22`)
2. Learner picks tenses + irregular toggle on the setup screen and taps Start Quiz, calling `startQuiz(options)` on the store (`app/index.tsx:42`)
3. `startQuiz` awaits `resolveVerbs()` (reuses the prefetch promise if already resolved), then calls `generate(options, undefined, verbs)` from the quiz engine and sets `status: "in-progress"` with the new `session` (`src/store/useQuizStore.ts:44-58`)
4. `generate()` filters eligible verbs, builds a `(verb, tense, subject)` triple pool, samples 10 via `sampleTriples`, and builds each `Question` (correct answer + 3 shuffled distractors) via `buildQuestion`/`pickDistractors` (`src/quiz/engine.ts:11-25`)
5. Setup screen sees `status === "in-progress"` and calls `router.replace("/quiz")` (`app/index.tsx:44-46`)
6. Quiz screen reads `session.questions[currentIndex]` from the store, renders choices; tapping a choice calls `selectAnswer(choice)` which locks it in (`src/store/useQuizStore.ts:77-80`)
7. Tapping Next calls `advance()`, which appends the locked choice to `answers` and either moves to the next question or sets `status: "completed"` once all 10 are answered (`src/store/useQuizStore.ts:82-95`)
8. Quiz screen detects `status === "completed"` and calls `router.replace("/results")` (`app/quiz.tsx:67-70`)
9. Results screen computes `{ correct, total }` via `score(session, answers)` (pure function, no store mutation) and renders Share/Try Again/Back to Setup (`app/results.tsx:46`, `src/quiz/scoring.ts:3-13`)

### Feedback Submission Flow

1. On the quiz screen, after locking a choice, the learner taps "Report a problem", opening `ReportFeedbackModal` with the current question's verb/tense/subject/correctAnswer/selectedAnswer plus `appVersion` (from `expo-constants`) and `platform` (from `Platform.OS`) passed as props (`app/quiz.tsx:149-167`)
2. Modal collects a reason (one of `wrong_answer | typo | confusing | other`) and optional free text, then on submit calls `buildFeedbackPayload(...)` to shape the exact backend contract object (`src/feedback/ReportFeedbackModal.tsx:70-83`, `src/feedback/payload.ts:5-30`)
3. `submitFeedback(payload)` POSTs JSON to `https://portuguese-verb-api.onrender.com/feedback` with a 90s `AbortController` timeout, mapping HTTP status to a `SubmitResult` union (`201` → success w/ body, `400` → validation-error, anything else → server-error, thrown/aborted → network-error) (`src/feedback/submit.ts:6-35`)
4. Modal shows success (auto-closes after 1.5s) or error state with a Retry button for `server-error`/`network-error` (not for `validation-error`, which is treated as non-retryable) (`src/feedback/ReportFeedbackModal.tsx:85-97`)

**State Management:**
- All quiz session state lives in one Zustand store (`src/store/useQuizStore.ts`); it is reset to `initialState` on `reset()`, called both from the quiz screen's exit-confirmation flow and implicitly overwritten on every new `startQuiz` call
- A module-level `startToken` counter in the store guards against race conditions from double-tapped Start/Try Again buttons: only the most recent `startQuiz` call's resolution is allowed to commit state (`src/store/useQuizStore.ts:39,45,48,60`)
- The dataset resolution result (`{ verbs, source }`) is cached at module scope in `src/dataset/source.ts` for the life of the JS process — it is never re-fetched after the first successful/failed resolution, so a mid-session network recovery does not retroactively switch from local back to remote content
- No state persists across app restarts; there is no AsyncStorage or any other durable store in the codebase

## Key Abstractions

**QuizSession / Question / Triple:**
- Purpose: Represent a generated quiz — `Triple` is a `(verb, tense, subject)` combination, `Question` extends it with `choices`/`correctAnswer`, `QuizSession` is `{ questions: Question[] }`
- Examples: `src/quiz/types.ts`
- Pattern: Plain data interfaces, no classes except `InsufficientVerbsError` (thrown when the eligible-triple pool is smaller than the 10-question requirement)

**Verb dataset shape:**
- Purpose: One `Verb` = `{ verb, translation, isIrregular, conjugations: Record<Tense, Record<Subject, string>> }` — the single source of truth for both the local bundled data and any remote payload
- Examples: `src/dataset/types.ts`, `src/dataset/verbs.ts` (data), `src/dataset/validate.ts` (Zod schema shared by both local test coverage and remote-fetch runtime validation)
- Pattern: Runtime-validated with Zod (`validateDataset`) before a remote payload is trusted; the local dataset is validated in Jest (`__tests__/dataset.test.ts`) but not re-validated at runtime since it ships in the bundle

**FeedbackPayload:**
- Purpose: Exact mirror of the backend's `POST /feedback` Zod contract (`message, verb, tense, subject, correctAnswer, selectedAnswer, appVersion, platform`)
- Examples: `src/feedback/schema.ts` (Zod schema + `z.infer` type), `src/feedback/payload.ts` (builder function)
- Pattern: Single schema is the type source (`FeedbackPayload = z.infer<typeof feedbackPayloadSchema>`), enums (`tense`, `subject`, `platform`) reuse the dataset's `TENSES`/`SUBJECTS` constants to avoid literal drift between the two contract halves

## Entry Points

**`app/_layout.tsx` (root layout):**
- Location: `app/_layout.tsx`
- Triggers: Mounted once by Expo Router at app launch
- Responsibilities: Wraps the whole app in `SafeAreaProvider`, renders the `Stack` navigator (all screens use native headers, `headerShown: true` by default, overridden per-screen), fires `prefetch()` once on mount to warm the dataset cache before the setup screen needs it

**`app/index.tsx` (`/` route, quiz setup):**
- Location: `app/index.tsx`
- Triggers: Default route on cold start; also the target of "Back to Setup"/quit-quiz navigation from other screens
- Responsibilities: Tense/irregular-verb filter selection, `startQuiz` invocation, surfaces `InsufficientVerbsError`'s user-facing message

## Architectural Constraints

- **Threading:** Single-threaded JS runtime (standard RN/Hermes); no worker threads or background tasks. All async work is `fetch`-based promises (dataset fetch, feedback POST)
- **Global state:** Two module-level singletons exist outside React: `cachedResult` (dataset resolution promise, `src/dataset/source.ts:7`) and `startToken` (race-guard counter, `src/store/useQuizStore.ts:39`). Both persist for the life of the JS process and are not reset between quiz sessions or on `reset()`
- **Not fully offline:** Despite the project's "entirely offline" framing in `CLAUDE.md`, `src/dataset/source.ts` actively attempts a network fetch (`https://portuguese-verb-api.onrender.com/content/verbs`) on every cold start before falling back to the bundled dataset. This means the backend now serves quiz content via a `/content/verbs` endpoint that is not documented in `CLAUDE.md`'s "no content-serving API" claim — treat `CLAUDE.md`'s offline description as describing the fallback behavior only, and verify with the backend repo before assuming `/content/verbs` doesn't exist
- **No circular imports observed:** dependency direction is strictly `app/` → `src/store/` → `src/quiz/` + `src/dataset/`, with `src/feedback/` only depended on by `app/quiz.tsx` and self-contained otherwise

## Anti-Patterns

### Hardcoded style values in `ReportFeedbackModal.tsx`

**What happens:** `src/feedback/ReportFeedbackModal.tsx`'s `StyleSheet.create` block hardcodes hex colors (`#FFFFFF`, `#007AFF`, `#FF3B30`, `#34C759`, `#8E8E93`, `#F2F2F7`) and pixel values (`16`, `24`, `12`) instead of importing `colors`/`spacing`/`radius`/`typography` from `src/theme/tokens.ts`.
**Why it's wrong:** Every other screen and component (`app/index.tsx`, `app/quiz.tsx`, `app/results.tsx`, `src/components/OfflinePill.tsx`) imports the shared tokens module. The modal's values happen to match the token values today, but any future token change (e.g. a color/spacing rebrand) would silently miss this file.
**Do this instead:** Import `colors, spacing, radius, typography` from `src/theme/tokens.ts` in `ReportFeedbackModal.tsx` and replace literal values, matching the pattern in `app/results.tsx` or `src/components/OfflinePill.tsx`.

### Reading store state via `useQuizStore.getState()` inside event handlers

**What happens:** `app/index.tsx:43`, `app/quiz.tsx:67`, and `app/results.tsx:66` call `useQuizStore.getState().status` immediately after an awaited store action, rather than relying on the subscribed `status` value from the top-level selector.
**Why it's wrong:** This is a deliberate, working pattern here (it avoids a stale-closure read of `status` after an `await`), but it's easy to misapply elsewhere — a new contributor might copy this pattern into a context where the subscribed selector value would have been correct and simpler.
**Do this instead:** Keep using `getState()` only immediately after an awaited store action to read the freshest value; do not use it as a general substitute for the selector-based `useQuizStore((s) => s.field)` pattern used everywhere else in the same files.

## Error Handling

**Strategy:** Every network call (`src/dataset/remote.ts`, `src/feedback/submit.ts`) uses an `AbortController` with a 90s timeout and returns/throws typed results rather than letting fetch errors propagate as generic rejections. Store-level actions (`startQuiz`) catch a specific known error type (`InsufficientVerbsError`) and translate it into a user-facing `errorMessage`; any other thrown error is re-thrown and caught one level up in the screen's `try/catch`, surfaced as `unexpectedError` state rather than becoming an unhandled promise rejection.

**Patterns:**
- Dataset resolution never throws to the caller: `resolveVerbs()`'s internal `resolve()` catches any remote-fetch failure and falls back to `localVerbs` (`src/dataset/source.ts:9-16`)
- Feedback submission never throws to the caller: `submitFeedback` catches all fetch/network errors internally and returns `{ status: "network-error" }` (`src/feedback/submit.ts:30-31`)
- Screens defensively check `if (!session) return null;` (`app/quiz.tsx:56,59`) or render an explicit fallback UI with a way back to setup (`app/results.tsx:23-44`) rather than rendering blank/broken screens

## Cross-Cutting Concerns

**Logging:** None — no logging library, no `console.log` calls found in `src/` or `app/`.
**Validation:** Zod schemas at both external boundaries — `src/dataset/validate.ts` validates any remote dataset payload before it's trusted; `src/feedback/schema.ts` validates the feedback payload shape (used for typing via `z.infer`, not yet wired to actually call `.parse`/`.safeParse` before submission — `submitFeedback` sends the payload as constructed by `buildFeedbackPayload` without an explicit runtime `.parse()` call).
**Authentication:** None — no auth anywhere in the app, matching the "no login, no accounts" product constraint.

---

*Architecture analysis: 2026-07-18*
