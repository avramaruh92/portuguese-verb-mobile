# Architecture Research

**Domain:** Expo React Native quiz app — integrating async remote-content fetch, quiz abandonment, and safe-area wiring into an existing pure-function quiz engine + Zustand state machine (v0.1 milestone)
**Researched:** 2026-07-13
**Confidence:** HIGH (all findings grounded directly in the actual shipped codebase files, not generic patterns)

> Supersedes the v0.0-era architecture sketch previously in this file (dated 2026-07-12), which
> described a `src/quiz-engine/`/`src/api/` structure that was never actually adopted — the shipped
> code uses `src/quiz/` and `src/feedback/`. This revision is grounded in the real, shipped v0.0
> codebase and scoped specifically to the three v0.1 feature areas.

## Standard Architecture (current, v0.0 shipped)

### System Overview

```
┌───────────────────────────────────────────────────────────────────┐
│  app/ (Expo Router screens — 3 routes, Stack navigator)             │
│  ┌───────────┐   ┌───────────┐   ┌───────────┐                     │
│  │ index.tsx │──▶│ quiz.tsx  │──▶│results.tsx│                     │
│  │ (Setup)   │   │ (Quiz)    │   │ (Results) │                     │
│  └─────┬─────┘   └─────┬─────┘   └─────┬─────┘                     │
├────────┴────────────────┴───────────────┴───────────────────────────┤
│  src/store/useQuizStore.ts (Zustand — idle/error/in-progress/        │
│  completed state machine; startQuiz() is currently SYNCHRONOUS)      │
├───────────────────────────────────────────────────────────────────┤
│  src/quiz/engine.ts (generate/sampleTriples/buildQuestion/            │
│  pickDistractors — pure, sync, deterministic-under-injected-RNG,     │
│  hard-imports `verbs` from src/dataset/verbs.ts at module scope)     │
├───────────────────────────────────────────────────────────────────┤
│  src/dataset/verbs.ts (static 50-verb array, sole data source today)  │
│  src/dataset/types.ts (Verb/Tense/Subject types + TENSES/SUBJECTS)    │
│  src/dataset/validate.ts (Zod VerbSchema + validateDataset())         │
├───────────────────────────────────────────────────────────────────┤
│  src/feedback/ (schema.ts, payload.ts, submit.ts, ReportFeedback-     │
│  Modal.tsx — modal-local state, zero useQuizStore coupling, only      │
│  network call in the app today: fetch + manual AbortController)       │
└───────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities (current)

| Component | Responsibility | Notes |
|-----------|----------------|-------|
| `app/index.tsx` | Setup screen — local `useState` for tense/irregular selection, calls `startQuiz()`, then synchronously reads `useQuizStore.getState().status` right after to decide navigation | This synchronous read-immediately-after-call is the exact spot that breaks once `startQuiz` becomes async |
| `app/quiz.tsx` | Renders current question, imports static `verbs` directly for translation lookup (`verbs.find(v => v.verb === question.verb)`), owns `ReportFeedbackModal` visibility | Also the natural home for the new exit/abandon control |
| `app/results.tsx` | Reads `score()`, share sheet; "Try Again" button calls `startQuiz(filters)` and does the same synchronous status re-read as `index.tsx` | Needs the same await-fix as `index.tsx` once `startQuiz` is async |
| `src/store/useQuizStore.ts` | Owns the entire quiz session lifecycle; `startQuiz` calls `generate()` synchronously and wraps `InsufficientVerbsError` into an `"error"` status | No async today; no loading/fetching status exists |
| `src/quiz/engine.ts` | `generate(options, random)` — imports `verbs` from `../dataset/verbs` at module scope; pure/sync given that fixed import | The module-scope import of `verbs` is the exact coupling point that must be removed for a swappable data source |
| `src/dataset/verbs.ts` | Static, hand-authored 50-verb dataset | Must stay as-is — it's both today's only source **and** tomorrow's fallback |
| `src/dataset/validate.ts` | `VerbSchema` (Zod) + `validateDataset()` | Already exists and can be reused as-is to validate any remote payload before trusting it |
| `react-native-safe-area-context@~5.7.0` | Installed dependency, currently unused | Confirmed in `package.json` — no new install needed for the safe-area fix, only wiring |

## Recommended Project Structure (v0.1 additions)

```
src/
├── dataset/
│   ├── types.ts             # UNCHANGED
│   ├── verbs.ts              # UNCHANGED — becomes the local fallback, not the only source
│   ├── validate.ts           # UNCHANGED — VerbSchema/validateDataset() reused to validate remote payloads
│   ├── remote.ts             # NEW — fetchRemoteVerbs(): Promise<Verb[]>, mirrors src/feedback/submit.ts's
│   │                         #        fetch + AbortController timeout pattern; throws on network/timeout/
│   │                         #        shape-invalid response (validated via existing VerbSchema)
│   └── source.ts             # NEW — resolveVerbs(): Promise<{ verbs: Verb[]; source: "remote" | "local" }>
│                              #        orchestrates fetchRemoteVerbs() → catch-all fallback to local `verbs`;
│                              #        this is the ONLY new module that knows about "remote vs local" —
│                              #        everything above it just receives a Verb[]
├── quiz/
│   ├── engine.ts              # MODIFIED — generate(verbs, options, random) — verbs becomes an explicit
│   │                          #        parameter instead of a module-scope import; function body otherwise
│   │                          #        untouched, still 100% pure/sync/deterministic-under-injected-RNG
│   ├── scoring.ts             # UNCHANGED — score() never touched verbs directly, no change needed
│   ├── types.ts               # UNCHANGED
│   ├── labels.ts              # UNCHANGED
│   └── random.ts              # UNCHANGED
├── store/
│   └── useQuizStore.ts        # MODIFIED — new "loading" status; startQuiz() becomes async, calls
│                              #        source.resolveVerbs() then engine.generate(verbs, options, random);
│                              #        store now also holds the resolved verb list (see below) so quiz.tsx
│                              #        doesn't need its own static import; new abandonQuiz() action
└── feedback/                  # UNCHANGED — zero coupling to this milestone's work, confirmed by design

app/
├── _layout.tsx                # MODIFIED — wrap <Stack> in <SafeAreaProvider>
├── index.tsx                  # MODIFIED — await startQuiz(), render a loading state while status === "loading"
├── quiz.tsx                   # MODIFIED — read verb list from store instead of static import; add exit
│                              #        button + confirmation Alert; apply safe-area insets
└── results.tsx                # MODIFIED (small) — "Try Again" must also await startQuiz(); safe-area insets pass
```

### Structure Rationale

- **`src/dataset/remote.ts` + `src/dataset/source.ts` as two separate new files**, not one: `remote.ts` owns *how* to fetch (network mechanics — timeout, JSON parse, shape validation via the existing `VerbSchema`), `source.ts` owns *the fallback decision* (try remote, catch anything, return local). This mirrors the existing separation of concerns pattern in `src/feedback/` between `submit.ts` (network mechanics) and the payload/schema modules — keeps the network wrapper unit-testable in isolation from the fallback policy.
- **`src/dataset/verbs.ts` must NOT be renamed, restructured, or converted into a function.** It is explicitly the fallback source now, and the existing 122 tests / `validateDataset` dataset-shape test still need a static array to assert against. Converting it to fetch-then-cache would conflate "the bundled fallback content" with "the resolved active content for this session" — those are two different concerns that the new `source.ts` module exists to keep separate.
- **`engine.generate()` gains `verbs` as a parameter rather than the store injecting a global/singleton.** This is the minimal-diff way to preserve the pure-function invariant established in v0.0: `generate` remains pure and synchronous, it just receives its data as an argument instead of importing it at module scope. All existing engine unit tests keep working with a one-line signature update (pass the local `verbs` array explicitly) — no test needs to become async.
- **Store, not screens, owns the async fetch-then-generate sequencing.** Screens should not orchestrate fetch/fallback/generate themselves — that would duplicate logic across `index.tsx` and `results.tsx`'s "Try Again" (both already call `startQuiz`), and would violate the same "screens are thin, store owns the state machine" convention already established for `startQuiz` in v0.0.

## Architectural Patterns

### Pattern 1: Data-source injection into a pure engine (async fetch stays outside the pure boundary)

**What:** The quiz engine (`generate`/`sampleTriples`/`buildQuestion`/`pickDistractors`) never becomes async and never calls `fetch`. All async/fallback resolution happens one layer up, in the store, which resolves a concrete `Verb[]` *before* calling `generate(verbs, options, random)`.

**When to use:** Any time an existing pure/sync core needs to consume data that might come from an async source. Don't push async into the pure layer — push data resolution above it.

**Trade-offs:** Requires the store to sequence two steps (`await resolveVerbs()` then `generate(...)`) instead of one, and requires storing the resolved verb list somewhere consumers (like `quiz.tsx`'s translation lookup) can reach it without re-importing the static file. In exchange, 100% of the existing engine test suite needs zero conceptual changes — only the call sites gain an explicit argument.

**Example:**
```typescript
// src/quiz/engine.ts — before/after diff is a single parameter addition
export function generate(
  verbs: Verb[],                       // NEW — was previously the module-scope import
  options: GenerateOptions,
  random: () => number = Math.random,
): QuizSession {
  const eligibleVerbs = verbs.filter((v) => options.includeIrregular || !v.isIrregular);
  // ...unchanged body below
}
```

```typescript
// src/store/useQuizStore.ts — startQuiz becomes async, sequences fetch then pure generate
startQuiz: async (options: GenerateOptions) => {
  set({ status: "loading" });
  const { verbs, source } = await resolveVerbs(); // NEW — src/dataset/source.ts
  try {
    const session = generate(verbs, options, Math.random); // now takes verbs explicitly
    set({ status: "in-progress", filters: options, session, datasetVerbs: verbs, ...});
  } catch (error) {
    if (error instanceof InsufficientVerbsError) {
      set({ status: "error", errorMessage: INSUFFICIENT_VERBS_MESSAGE, session: null });
      return;
    }
    throw error;
  }
},
```

### Pattern 2: Fetch-with-fallback via a single orchestrating function, mirroring the existing feedback network wrapper

**What:** `src/dataset/source.ts` exposes one function, `resolveVerbs()`, that internally tries `fetchRemoteVerbs()` (`AbortController`-based timeout, same shape as `src/feedback/submit.ts`) and on *any* failure — network error, timeout, non-2xx, or `validateDataset()` shape-validation failure — falls back to the local static `verbs` import. Callers never see a rejected promise; `resolveVerbs()` always resolves.

**When to use:** Exactly this milestone's stated requirement ("fetch verbs from a backend content endpoint... falling back to the bundled local dataset if unreachable").

**Trade-offs:** Swallowing all failure modes into a silent fallback means the UI has no way to tell the user "you're on cached/local content" unless `source.ts` also returns which source won (recommended: return `{ verbs, source: "remote" | "local" }` so a future UI affordance — e.g. a small "offline mode" indicator — is possible without a re-plumb). Since the backend endpoint doesn't exist yet, ship `fetchRemoteVerbs()` against a local mock/stub URL (per PROJECT.md's explicit scoping) so the fallback path is exercised in tests today and the real URL is a one-line swap later.

**Example:**
```typescript
// src/dataset/source.ts
import { verbs as localVerbs } from "./verbs";
import { fetchRemoteVerbs } from "./remote";
import type { Verb } from "./types";

export async function resolveVerbs(): Promise<{ verbs: Verb[]; source: "remote" | "local" }> {
  try {
    const remote = await fetchRemoteVerbs(); // throws on network/timeout/invalid-shape
    return { verbs: remote, source: "remote" };
  } catch {
    return { verbs: localVerbs, source: "local" };
  }
}
```

### Pattern 3: Abandon-quiz as a reuse of the existing `reset()` primitive, not a new state

**What:** "End quiz early" does not need a 5th status. Exiting mid-quiz is state-equivalent to the existing `reset()` action — it returns the store to `idle`, clearing `session`/`answers`/`currentIndex`/`lockedChoice`. The only genuinely new behavior is a **confirmation dialog**, which is a screen-level UI concern (native `Alert.alert`), not store logic.

**When to use:** Whenever "cancel/abandon an in-progress flow" maps cleanly onto an already-existing "clear everything" action.

**Trade-offs:** Slight ambiguity if `reset()` is ever repurposed for something status-specific later (e.g., "reset" meaning "clear an error" vs. "abandon a live quiz") — mitigate by adding a thin `abandonQuiz` action that's semantically named for call sites even if its body is currently identical to `reset()`, so future divergence (e.g. telemetry, a "did you mean to quit?" analytics event) has a natural home without renaming call sites later.

**Example:**
```typescript
// src/store/useQuizStore.ts — thin, semantically-named alias; body may diverge from reset() later
abandonQuiz: () => {
  set({ ...initialState });
},
```

```typescript
// app/quiz.tsx — new exit button, confirmation lives at the screen, not the store
import { Alert } from "react-native";

function handleExit() {
  Alert.alert(
    "Exit Quiz?",
    "Your progress will be lost.",
    [
      { text: "Cancel", style: "cancel" },
      {
        text: "Exit",
        style: "destructive",
        onPress: () => {
          abandonQuiz();
          router.replace("/");
        },
      },
    ],
  );
}
```
No new `QuizStatus` value is needed — `idle` already means "no active session," which is exactly what an abandoned quiz should look like, and it's the same state `app/index.tsx` already renders correctly.

### Pattern 4: SafeAreaProvider — minimal-diff root wrap, insets applied per-screen (not a rewrite to `SafeAreaView`)

**What:** `react-native-safe-area-context@~5.7.0` is already an installed (but unused) dependency — confirmed in `package.json`. The fix is two-part: (1) wrap the root `<Stack>` in `app/_layout.tsx` with `<SafeAreaProvider>` so `useSafeAreaInsets()` works anywhere below it, and (2) apply insets in each of the 3 screens' existing `StyleSheet` containers.

**When to use:** Exactly the "content renders under the notch/status bar" tech-debt item called out in PROJECT.md's Current State section.

**Trade-offs:** Two implementation choices exist — (a) swap each screen's root `<View style={styles.container}>` for `<SafeAreaView>` from `react-native-safe-area-context` (not the deprecated RN-core one), or (b) keep `View` and manually spread `useSafeAreaInsets()` into the existing `paddingTop`/`paddingHorizontal` style objects. Recommend (a) for `app/quiz.tsx` and `app/results.tsx` (simple full-bleed screens, minimal diff, no reconciliation needed against existing top-padding) but note `results.tsx` already has a hardcoded `paddingTop: 64` that becomes redundant/double-padded once real insets are applied and must be removed, not just supplemented. `app/index.tsx` uses `justifyContent: "center"` for vertical centering — verify this still centers correctly once wrapped in `SafeAreaView`, since it becomes a flex container itself; option (b) (`useSafeAreaInsets()` + spread into existing container style) is the safer choice there if centering behavior shifts unexpectedly.

**Example:**
```typescript
// app/_layout.tsx — minimal diff
import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </SafeAreaProvider>
  );
}
```

## Data Flow

### Request Flow (v0.1, quiz start)

```
[User taps "Start Quiz" on Setup screen]
    ↓
app/index.tsx: await startQuiz({ tenses, includeIrregular })
    ↓
useQuizStore.startQuiz (async):
    set({ status: "loading" })
    ↓
src/dataset/source.ts: resolveVerbs()
    ↓ (try)                              ↓ (catch: network/timeout/invalid shape)
src/dataset/remote.ts:                src/dataset/verbs.ts:
fetchRemoteVerbs()                    local `verbs` fallback
    ↓                                     ↓
    └──────────────┬──────────────────────┘
                   ↓
        { verbs, source: "remote"|"local" }
                   ↓
src/quiz/engine.ts: generate(verbs, options, Math.random)  ← still pure/sync
                   ↓
        set({ status: "in-progress", session, datasetVerbs: verbs })
                   ↓
app/index.tsx: status === "in-progress" → router.replace("/quiz")
                   ↓
app/quiz.tsx: reads `datasetVerbs` from store (not a static import) for translation lookup
```

### State Management (status machine, v0.1)

```
idle ──(startQuiz, async)──▶ loading ──(resolveVerbs + generate succeed)──▶ in-progress
  ▲                             │                                              │
  │                    (InsufficientVerbsError)                        (advance() × 10 / abandonQuiz())
  │                             ▼                                              │
  └────────────────────────── error                                    completed / idle
                                                                                │
                                                                    (idle if abandonQuiz(); completed if finished)
```

Only one new status is needed: `"loading"`. Abandonment reuses the existing `idle` terminus via `reset()`/`abandonQuiz()` — it does not need its own status.

### Key Data Flows

1. **Dataset resolution:** Happens once per `startQuiz()` call, not once per app launch — each new quiz attempt re-resolves (remote-first, local-fallback), matching PROJECT.md's framing of "fetch verbs... on load/quiz-start." No caching layer is required for v0.1 scope (no persistence library is installed or wanted, per existing STACK.md guidance against `AsyncStorage`); an in-memory module-level cache inside `source.ts` is optional and cheap if repeated fetches during one app session become a concern, but is not a hard requirement.
2. **Verb lookup for display (`quiz.tsx`'s translation text):** Currently reads the static `verbs` import directly (line: `const currentVerb = verbs.find((v) => v.verb === question.verb)`). Must switch to reading whatever verb list actually produced the active session (`datasetVerbs` in the store) — otherwise if the remote dataset ever diverges from local (e.g. backend adds a 51st verb, or a translation differs), the UI would silently look up the wrong record or fail to find one at all.
3. **Abandon flow:** Confirmation dialog (screen-local, ephemeral `Alert.alert` state) → store action (`abandonQuiz`/`reset`) → navigation (`router.replace("/")`). No result/partial-score screen is shown, matching the requirement of "no partial results shown."

## Scaling Considerations

Not meaningfully applicable at this app's scale (single-user, offline-first, no backend load driven by this repo). The one real scaling axis is dataset size: if the backend-served dataset eventually grows well beyond 50 verbs, `resolveVerbs()`'s in-memory `Verb[]` return shape and `generate()`'s `pool.flatMap` over all eligible triples remain fine into the low thousands of verbs — no architectural change needed for v0.1's stated scope.

## Anti-Patterns

### Anti-Pattern 1: Making `generate()` itself async or fetch-aware

**What people do:** Reach for `async function generate(options)` that calls `fetch` internally "since it needs remote data now."
**Why it's wrong:** Destroys the invariant established in v0.0 that quiz generation is pure/synchronous/deterministic-under-injected-RNG — every existing unit test that calls `generate(options, fixedRandom)` and asserts on the exact returned `QuizSession` would need to become async and would now depend on network mocking to stay deterministic, entirely undermining what made the engine trivially testable.
**Do this instead:** Resolve the `Verb[]` data source *before* calling `generate`, in the store, and keep passing it into `generate` as a plain synchronous argument.

### Anti-Pattern 2: Adding a new `"loading"`/`"abandoned"` status pair when one suffices

**What people do:** Add both a new `loading` status *and* a new `abandoned` status, treating "user quit" as architecturally distinct from "never started."
**Why it's wrong:** `idle` already means "no active session, ready for Setup" — that is exactly the correct post-abandon state, and `app/index.tsx` already renders correctly for it. Adding a distinct `abandoned` status doubles the number of states every screen's status-switch needs to account for, for zero behavioral gain in this milestone (no "you abandoned last time" messaging is in scope).
**Do this instead:** Only add the one new state genuinely needed (`loading`, for the async fetch window). Route abandonment back through the existing `idle` terminus.

### Anti-Pattern 3: Letting `app/quiz.tsx` keep its own static `verbs` import after the dataset becomes swappable

**What people do:** Add the remote-fetch layer for `startQuiz()` but leave `app/quiz.tsx`'s `import { verbs } from "../src/dataset/verbs"` untouched, since "it still compiles."
**Why it's wrong:** Once the active quiz session might have been generated from a *remote* verb list, a screen that independently re-imports the *local static* list for lookups can silently diverge from the data that actually produced the session (wrong/missing translation, or a lookup miss if the remote dataset adds/removes a verb).
**Do this instead:** Store the resolved verb list used for the current session in the Zustand store (e.g. `datasetVerbs`) alongside `session`, and have `quiz.tsx` read from there.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| Backend content endpoint (does not exist yet — owned by `portuguese-verb-api`) | `fetch` + `AbortController` timeout, same shape as `src/feedback/submit.ts` | Build `fetchRemoteVerbs()` against a local mock/stub URL per PROJECT.md's explicit v0.1 scoping; the real URL swap is a one-line change once the sibling repo ships it. Validate the response shape with the *existing* `VerbSchema`/`validateDataset()` from `src/dataset/validate.ts` before accepting it as "remote success" — a 200 response with malformed data should fall back to local exactly like a network failure would. |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| `src/dataset/source.ts` ↔ `src/quiz/engine.ts` | Plain function argument (`Verb[]` passed into `generate()`) | No shared global/singleton state — keeps `engine.ts` a pure function of its arguments, unchanged from v0.0's design intent. |
| `useQuizStore` ↔ `app/index.tsx` | `await startQuiz(options)` then read `status` from the store (not a synchronous `useQuizStore.getState().status` read immediately after a fire-and-forget call, as today) | The current code (`app/index.tsx`'s `handleStartQuiz`) reads store state synchronously right after calling `startQuiz` — this **must** become `await startQuiz(options)` before checking `nextStatus`, otherwise the navigation check will race the still-pending fetch and always see the stale pre-call status. The exact same pattern exists in `app/quiz.tsx`'s `handleAdvance` (checks status after `advance()` — `advance()` itself stays synchronous so no change needed there) and `app/results.tsx`'s `handleTryAgain` (calls `startQuiz` and reads status synchronously — needs the identical `await` fix). |
| `useQuizStore` ↔ `app/quiz.tsx` | New: store exposes `datasetVerbs`; screen reads it instead of statically importing `src/dataset/verbs` | See Anti-Pattern 3 above. |
| `SafeAreaProvider` ↔ screens | React Context, not props — `useSafeAreaInsets()` hook called independently in each of the 3 screens | No prop-drilling needed; each screen already has its own `StyleSheet`, so insets are applied locally per screen, not centralized. |

## Suggested Build Order

Given the dependency chain across the three feature areas:

1. **Dataset fetch/fallback layer first** — `src/dataset/remote.ts` and `src/dataset/source.ts`. Zero dependents yet exist, fully unit-testable in isolation (mock `fetch`, assert fallback-on-failure), and nothing else can proceed meaningfully without it.
2. **Refactor `engine.generate()` to accept `verbs` as a parameter.** Small, mechanical, independent of step 1 — can happen in parallel. Update existing engine unit tests to pass the local `verbs` array explicitly (one-line change per test file, no test becomes async).
3. **Update `useQuizStore`** — add `"loading"` status, make `startQuiz` async (sequencing `resolveVerbs()` from step 1 → `generate()` from step 2), add `datasetVerbs` to store state, add `abandonQuiz` action. This step depends on both 1 and 2 being in place.
4. **Update screens** — `app/index.tsx` (await `startQuiz`, render a loading state, fix the synchronous-status-read race), `app/quiz.tsx` (read `datasetVerbs` from store instead of static import, add exit button + confirmation `Alert`), `app/results.tsx` (fix its own `startQuiz`/"Try Again" call site the same way). Bundle the safe-area insets work into this same pass since these are the same files being touched — avoids a second edit pass over the same screens.
5. **`SafeAreaProvider` root wrap** (`app/_layout.tsx`) can technically happen at any point — it has zero dependency on 1-4 — but is cheapest to land together with step 4's screen edits rather than as a fully separate pass, purely to avoid re-touching the same files twice.

## Sources

- Direct reads of the actual shipped codebase (all HIGH confidence, primary source): `src/store/useQuizStore.ts`, `src/quiz/engine.ts`, `src/quiz/types.ts`, `src/dataset/verbs.ts`, `src/dataset/types.ts`, `src/dataset/validate.ts`, `src/feedback/submit.ts`, `app/_layout.tsx`, `app/index.tsx`, `app/quiz.tsx`, `app/results.tsx`, `package.json`, `.planning/PROJECT.md`
- `react-native-safe-area-context@~5.7.0` confirmed already present in `package.json` dependencies (not a new install) — HIGH confidence, direct file read

---
*Architecture research for: Expo React Native quiz app, v0.1 milestone (online content fetch + fallback, quiz abandonment, safe-area wiring)*
*Researched: 2026-07-13*
