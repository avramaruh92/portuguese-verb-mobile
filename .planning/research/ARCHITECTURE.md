# Architecture Research

**Domain:** Offline-first mobile quiz app (Expo React Native, iOS-first, TypeScript, Expo Router, Zustand)
**Researched:** 2026-07-12
**Confidence:** HIGH (Expo Router conventions, Zustand patterns, RN testing — all well-established, verified against current Expo docs) / MEDIUM (quiz-domain-specific module boundaries — synthesized from general state-management and domain-modeling best practice, not a published "quiz app architecture" spec)

## Standard Architecture

### System Overview

```
┌───────────────────────────────────────────────────────────────────┐
│                        UI Layer (app/)                             │
│  Expo Router screens — thin, presentational, read/write store only │
│  ┌───────────┐   ┌───────────┐   ┌───────────┐   ┌───────────┐    │
│  │  setup    │   │   quiz    │   │  results  │   │  feedback │    │
│  │  screen   │   │  screen   │   │  screen   │   │   modal   │    │
│  └─────┬─────┘   └─────┬─────┘   └─────┬─────┘   └─────┬─────┘    │
├────────┴───────────────┴───────────────┴───────────────┴──────────┤
│                 State Layer (src/store/) — Zustand                 │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │  useQuizStore: session config, current question index,      │   │
│  │  answers given, score — calls pure engine functions,         │   │
│  │  never contains quiz logic itself                            │   │
│  └────────────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────────────┤
│           Domain Layer (src/quiz-engine/, src/dataset/)             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │  dataset.ts  │  │  generate.ts │  │  score.ts    │              │
│  │  (verbs[])   │  │  (filter +   │  │  (grading    │              │
│  │  typed, pure │  │  randomize)  │  │  logic)      │              │
│  │  data, no    │  │  pure fn,    │  │  pure fn      │              │
│  │  React/store │  │  no React/   │  │  no React/    │              │
│  │  imports     │  │  store       │  │  store        │              │
│  └──────────────┘  └──────────────┘  └──────────────┘              │
├─────────────────────────────────────────────────────────────────────┤
│              Integration Layer (src/api/)                           │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │  feedbackClient.ts — maps UI/domain values → locked backend  │   │
│  │  enum literals, calls fetch(POST /feedback), typed response  │   │
│  │  handling (201/400/500/network)                              │   │
│  └────────────────────────────────────────────────────────────┘   │
└───────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|-------------------------|
| `dataset/` | Owns the static, typed verb data (50 verbs × 4 tenses × 6 subjects) and dataset-shape validation | Plain TS module exporting a typed array/object; a `validateDataset()` pure function used both at build/test time and optionally at runtime in `__DEV__` |
| `quiz-engine/generate.ts` | Given dataset + filters (tenses selected, irregular toggle) → produces a randomized 10-question session | Pure function, no side effects, deterministic given a seeded RNG (for testability) |
| `quiz-engine/score.ts` | Given a completed session's answers → computes score, per-question correctness | Pure function |
| `store/useQuizStore.ts` (Zustand) | Owns *session state*: config chosen on setup screen, current question, list of answers, current score, session status (idle/in-progress/complete) | Zustand store with actions (`startQuiz`, `answerQuestion`, `resetQuiz`) that call `quiz-engine` pure functions and store the *results* |
| `app/` (Expo Router screens) | Presentation + navigation only — read from store via hooks, dispatch store actions, never contain quiz logic or dataset filtering inline | Functional components; screens are "dumb" relative to the engine |
| `api/feedbackClient.ts` | Sole boundary to the outside world — maps internal domain vocabulary (e.g., friendly tense/subject labels) to locked backend enum literals, performs the fetch, normalizes 201/400/500/network-error outcomes into a typed result | Small typed client module; no Zustand/React dependency, callable from a feedback-form component or its own tiny feedback store/hook |

## Recommended Project Structure

```
app/                          # Expo Router screens — routing + presentation only
├── _layout.tsx                # Root layout (fonts, providers if any)
├── index.tsx                  # Setup screen (tense selection, irregular toggle, Start)
├── quiz.tsx                   # Active quiz screen (question, choices, feedback)
├── results.tsx                # Results screen (score, share sheet, feedback entry point)
└── +not-found.tsx

src/
├── dataset/
│   ├── verbs.ts                # Typed verb data (source of truth, hand-authored/reviewed)
│   ├── types.ts                # Verb, Conjugation, Tense, Subject types
│   └── validate.ts             # Dataset shape/completeness checks (used in tests)
├── quiz-engine/
│   ├── generate.ts             # filterVerbs(), buildQuestion(), generateSession()
│   ├── score.ts                # scoreSession()
│   └── types.ts                # Question, Session, Answer types
├── store/
│   └── useQuizStore.ts         # Zustand store: session state + actions calling quiz-engine
├── api/
│   ├── feedbackClient.ts       # submitFeedback(): maps domain → API enums, fetch, typed result
│   └── feedbackTypes.ts        # Request/response types mirroring backend contract
├── components/
│   ├── QuestionCard.tsx
│   ├── AnswerChoice.tsx
│   ├── ScoreSummary.tsx
│   └── FeedbackForm.tsx
└── test/
    └── (or co-located __tests__ next to each module)

.planning/                     # existing GSD planning docs
```

### Structure Rationale

- **`src/dataset/` and `src/quiz-engine/` contain zero React/Zustand imports.** They are pure TypeScript modules, independently unit-testable without React Native Testing Library or a rendered component tree — this is the single most important boundary in this app, because it lets "quiz generation is correct" be verified with fast, plain Jest tests (no native module mocking needed).
- **`src/store/` is a thin orchestration layer**, not where logic lives. The store calls `generateSession()`/`scoreSession()` and stores their outputs. This keeps the store swappable (Zustand → something else, if ever needed) without touching quiz logic, and keeps quiz logic testable without mocking Zustand.
- **`app/` screens stay thin.** Expo Router's convention is that `app/` files are route entry points; per Expo's own guidance, screens can be "thin re-export layers" pointing at feature components. Here, screens read the store via `useQuizStore()` selectors and render `components/`; they should contain no filtering/scoring/randomization code inline.
- **`src/api/` is isolated** because it is the only module allowed to know about the backend's enum literals and the only module allowed to perform network I/O. Isolating it makes the "cross-repo contract risk" (enum mismatch) a single, easily-testable seam: one mapping function, one set of unit tests asserting internal labels → correct backend literals.
- **`src/components/` are presentational**, receiving data and callbacks as props; they don't reach into the store directly except where convenience clearly outweighs testability (e.g., a `FeedbackForm` may call `submitFeedback` directly since it's the terminal action, not core quiz logic).

## Architectural Patterns

### Pattern 1: Pure-function domain core wrapped by a thin state store

**What:** All quiz logic (filtering, question generation, randomization, scoring) is expressed as pure functions taking explicit inputs (dataset, filters, RNG) and returning explicit outputs (a `Session`, a `ScoreResult`). Zustand's store holds only *data*, and its actions are one-line calls into these functions.

**When to use:** Any app where "business logic correctness" needs to be tested independently of UI/state-management wiring — true here given the explicit requirement to unit test generation/scoring/dataset logic.

**Trade-offs:** Slightly more indirection (store action calls out to another module) than putting logic inline in the store. Worth it: pure functions are trivial to test with fixed inputs/seeded randomness, whereas testing logic embedded in a Zustand store means instantiating/resetting store state per test.

**Example:**
```typescript
// quiz-engine/generate.ts — pure, no React/Zustand
export function generateSession(
  dataset: Verb[],
  filters: { tenses: Tense[]; includeIrregular: boolean },
  rng: () => number = Math.random
): Session { /* filter, sample, build 4-choice questions */ }

// store/useQuizStore.ts — thin orchestration
export const useQuizStore = create<QuizState>((set, get) => ({
  session: null,
  startQuiz: (filters) =>
    set({ session: generateSession(verbs, filters), status: 'in-progress' }),
  answerQuestion: (choice) => {
    /* record answer, advance index */
  },
}));
```

### Pattern 2: Enum-mapping boundary at the API edge

**What:** A single, small module (`feedbackClient.ts` + a co-located `mapToFeedbackPayload()`) is the only place internal domain vocabulary (e.g., a `Tense` union used throughout the quiz engine, or friendly subject labels like "nós") gets translated into the backend's locked literal unions (`present_indicative`, `nos`, etc.).

**When to use:** Any time an app's internal model and an external contract are allowed to diverge in *labeling* even though they must agree in *meaning* — exactly the flagged cross-repo risk here (CLAUDE.md D-07/D-08).

**Trade-offs:** One extra mapping layer to maintain, but it converts a "silent 400 in production" risk into a single unit-tested pure function (`mapToFeedbackPayload(session, question, answer) → FeedbackRequest`) that can assert literal-for-literal correctness against the backend's Zod schema description.

### Pattern 3: Route-as-thin-view over Expo Router

**What:** Expo Router files in `app/` are kept as close to pure "screen wiring" as possible — they read from the Zustand store, render feature components from `src/components/`, and handle navigation (`router.push`, `router.replace`) only. No business logic in route files.

**When to use:** Standard for any Expo Router app beyond trivial size; documented as best practice by Expo (routes as thin re-export/wiring layers importing from a `src/` feature layer, distinct from `app/`'s routing responsibility).

**Trade-offs:** Requires discipline to not "just quickly filter the dataset here" in a screen component during a rushed implementation. Mitigated by having `quiz-engine` functions already exist and be tested before UI phase starts (see build order below).

## Data Flow

### Request Flow (quiz session)

```
[User picks tenses + irregular toggle on Setup screen]
    ↓
[Setup screen] → useQuizStore.startQuiz(filters)
    ↓
[Store action] → quiz-engine.generateSession(dataset, filters, rng)
    ↓
[Store] holds Session { questions[], currentIndex, answers[] }
    ↓
[Quiz screen] reads session.questions[currentIndex] via selector, renders QuestionCard
    ↓ (user selects an answer)
[Quiz screen] → useQuizStore.answerQuestion(choice)
    ↓
[Store] records answer, advances currentIndex (or marks session complete)
    ↓ (after 10th question)
[Store] status → 'complete'; quiz-engine.scoreSession(session) computed (in store or on read)
    ↓
[Results screen] reads score + session from store, renders ScoreSummary + Share button
```

### Feedback Flow (the single external I/O path)

```
[User taps "give feedback" on a specific question/result, fills message]
    ↓
[FeedbackForm] gathers: message + { verb, tense, subject, correctAnswer, selectedAnswer }
  from the *session/question the user is looking at* (already in Zustand/local state)
    ↓
[api/feedbackClient.submitFeedback(payload)]
    → mapToFeedbackPayload(): internal Tense/Subject → locked backend literals
    → adds appVersion (from app config/Constants), platform: 'ios'
    → fetch(POST https://portuguese-verb-api.onrender.com/feedback)
    ↓
[Response handling, typed]
  201 → show success confirmation, do not block/alter quiz state
  400 → show inline validation error (should not happen if mapping is correct/tested)
  500 / network / timeout (cold start) → show retry-able error, non-blocking
    ↓
[Quiz session state in Zustand is completely unaffected by feedback outcome]
```

### State Management

```
[useQuizStore (Zustand)]
    ↓ (selector subscriptions — e.g. useQuizStore(s => s.session?.questions[s.currentIndex]))
[Screens/components] ←→ [Store actions: startQuiz, answerQuestion, resetQuiz]
    ↓
[Store persists nothing across app restarts — v0 has no persistence requirement;
 a fresh store on app launch is correct and simplest]
```

### Key Data Flows

1. **Setup → Quiz:** Filters chosen on the setup screen are the *only* input to `generateSession`; the store is created/reset per quiz attempt (no stale state bleed between quizzes — `resetQuiz()` or a fresh `startQuiz()` call fully replaces `session`).
2. **Quiz → Results:** The store is the single source of truth for both the in-progress session and its terminal score; the results screen does not recompute anything, it reads already-computed values (or calls `scoreSession` once on session completion, memoized in store state).
3. **Any screen → Feedback API:** This is the only flow that crosses the device boundary. It reads from whatever session/question context is currently in state, but writes nowhere back into `useQuizStore` — feedback submission and quiz progression are fully decoupled, which directly satisfies the requirement "must never block or lose quiz completion."

## Scaling Considerations

This is a single-user, offline, no-accounts app — "scaling" here means dataset/feature growth, not concurrent users.

| Scale | Architecture Adjustments |
|-------|--------------------------|
| Current (50 verbs, 4 tenses, v0) | Current structure (in-memory array, pure functions, single Zustand store) is entirely sufficient — no persistence, no pagination, no lazy loading needed |
| Growth (200+ verbs, more tenses/moods, e.g. subjunctive) | Still fine as a static typed array; consider splitting `dataset/verbs.ts` into per-tense or per-verb-group files re-exported from an index, purely for file-size/readability, not performance |
| Growth (session history, spaced repetition — explicitly out of scope for v0 but flagged as a later milestone) | Would introduce a persistence layer (e.g. `expo-sqlite` or `AsyncStorage`) — this is the first real architectural addition beyond v0's scope, and should be designed as a new module (`src/persistence/`) that the store reads/writes through, not scattered `AsyncStorage.getItem` calls in screens |

### Scaling Priorities

1. **First likely change:** Adding more verbs/tenses/moods in a later milestone — handled by the dataset module's existing typed-array shape; no architectural change needed, just data + `validate.ts` coverage.
2. **Second likely change:** Adding quiz history/spaced repetition (deferred) — will require introducing a persistence boundary; the current architecture's clean separation (engine has no I/O, store has no persistence today) makes this an additive change rather than a refactor, *provided* the store is not given ad-hoc `AsyncStorage` calls prematurely in v0.

## Anti-Patterns

### Anti-Pattern 1: Quiz logic inlined in Expo Router screens

**What people do:** Filter the dataset, randomize questions, or compute scores directly inside `app/quiz.tsx` using `useEffect`/inline array methods, because "it's faster to just do it here."
**Why it's wrong:** Makes the explicitly-required unit tests for generation/scoring impossible to write cleanly (would require rendering the screen with RNTL and mocking navigation just to test a filter function). Also tends to duplicate logic across setup/quiz/results screens.
**Do this instead:** Keep all such logic in `src/quiz-engine/`, tested with plain Jest, called only via store actions.

### Anti-Pattern 2: Zustand store directly building backend payloads

**What people do:** Have the Zustand store (or a screen) construct the `POST /feedback` body inline, using whatever labels happen to be in local state (e.g., passing a friendly "nós" string straight through).
**Why it's wrong:** This is exactly the flagged cross-repo contract risk — any drift between internal labels and backend literals causes silent 400s in production, and there's no single tested seam to catch it.
**Do this instead:** Route every feedback submission through one `mapToFeedbackPayload()` function in `src/api/`, unit-tested against the exact enum literals in CLAUDE.md/backend contract.

### Anti-Pattern 3: Reaching into dataset internals from multiple layers

**What people do:** Import `dataset/verbs.ts` directly from screens *and* from the engine *and* from the API client, each doing its own ad-hoc lookups/filters.
**Why it's wrong:** Spreads dataset-shape knowledge across the codebase; a future dataset schema change (e.g., adding a 5th tense) requires hunting down every direct consumer.
**Do this instead:** Only `quiz-engine/` imports `dataset/verbs.ts` directly. Screens and the API client work with `Question`/`Session`/`Answer` types produced by the engine, never with raw `Verb` records.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| `portuguese-verb-api` `POST /feedback` (Render-hosted) | Single typed `fetch` call in `src/api/feedbackClient.ts`; no SDK needed for one endpoint | Must handle Render free-tier cold-start latency (multi-second delay) with a loading/pending UI state and a reasonable timeout; must never throw uncaught — always resolve to a typed `{ ok: true, data } | { ok: false, error }` result so the caller (feedback form) can render inline outcome without crashing the app |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| `app/` (screens) ↔ `store/` | Zustand hooks (`useQuizStore(selector)`) and action calls | Screens never import `quiz-engine` or `dataset` directly — always go through the store for session data |
| `store/` ↔ `quiz-engine/` | Direct function calls (`generateSession`, `scoreSession`) | One-directional: store depends on engine, engine has zero knowledge of Zustand |
| `quiz-engine/` ↔ `dataset/` | Direct import of typed data + validation helpers | Engine is the sole consumer of raw dataset records |
| any screen/form ↔ `api/feedbackClient` | Direct function call (`submitFeedback(payload)`), typically from a `FeedbackForm` component or a small local `useState`-based hook — does not need to live in the global Zustand store | Keeps the one network-calling module decoupled from quiz session state entirely |

## Suggested Build Order (validates/adjusts the roadmap's 6-phase sketch)

The user's implied phase order — scaffold → domain model/dataset → quiz engine → UI (setup/quiz/results) → feedback API integration → polish/QA — matches this architecture's dependency graph exactly and is confirmed as correct:

1. **Scaffold** — Expo + Expo Router + TypeScript + Zustand + Jest/Expo preset installed and wired (empty routes, empty store, CI/test runner green on a trivial test). Nothing here depends on domain knowledge.
2. **Domain model + dataset** — `src/dataset/types.ts` and `verbs.ts` (even partially seeded), plus `validate.ts` and its tests. This must come before the engine because `generateSession`'s signature depends on the `Verb`/`Tense`/`Subject` types being settled — and those types double as the vocabulary the feedback-mapping layer will later need to reconcile against backend enums, so nail this vocabulary early and deliberately (decide internal `Tense`/`Subject` unions now, in a form that maps cleanly to backend literals later).
3. **Quiz engine** — `generate.ts` + `score.ts`, fully unit tested against the dataset from step 2, with no UI at all. This is the highest-value phase to isolate for testing per the explicit requirement, and de-risks the trickiest logic (randomization without repeats, irregular-toggle filtering, 4-choice distractor generation) before any UI exists to obscure bugs.
4. **UI (setup → quiz → results)** — Zustand store wired to the now-tested engine; screens are comparatively low-risk once steps 2–3 are solid, since they're "thin" by design.
5. **Feedback API integration** — Can start in parallel with step 4 on the `feedbackClient.ts`/mapping-function/unit-test side (it needs no UI), but the FeedbackForm UI naturally slots in after results/quiz screens exist to attach it to. Flag: this phase is the one most likely to need extra research/care, given the explicit cross-repo enum-literal risk and cold-start handling — worth a dedicated pitfalls review before implementation (see PITFALLS.md).
6. **Polish/QA** — Share sheet wording, error-state polish, accessibility, edge cases (e.g., fewer than 10 eligible verbs for a filter combination — the engine's step 3 tests should already surface this edge case, but end-to-end UI behavior needs explicit QA).

**Adjustment worth flagging for the roadmap:** consider explicitly calling out that the internal `Tense`/`Subject` type design (part of phase 2) should be reviewed once against the exact backend literals listed in CLAUDE.md *before* dataset authoring is finalized — cheaper to align the vocabulary at the type-definition stage than to retrofit a mapping layer after 50 verbs' worth of data and UI copy already exist using different labels.

## Sources

- [Core concepts of file-based routing — Expo Router docs](https://docs.expo.dev/router/basics/core-concepts/) — HIGH confidence, official docs
- [How to organize Expo app folder structure for clarity and scalability — Expo blog](https://expo.dev/blog/expo-app-folder-structure-best-practices) — HIGH confidence, official source
- [Introduction to Expo Router — Expo docs](https://docs.expo.dev/router/introduction/) — HIGH confidence, official docs
- Zustand "thin store, logic elsewhere" pattern, pure-function domain core, and enum-mapping-boundary pattern are synthesized from general React/RN state-management best practice and this project's explicit constraints (CLAUDE.md cross-repo contract, PROJECT.md requirements) — MEDIUM confidence, not sourced from a single canonical "quiz app" reference architecture

---
*Architecture research for: Offline quiz app (Expo/React Native/TypeScript/Zustand)*
*Researched: 2026-07-12*
