# Phase 4: Quiz Experience (Setup → Quiz → Results) - Research

**Researched:** 2026-07-12
**Domain:** Expo Router v6 multi-screen navigation, Zustand session-state store design, React Native core `Share` API, plain-RN multi-select/wizard UI patterns
**Confidence:** HIGH

## Summary

This phase wires already-tested pure functions (`generate()`, `score()`) and dataset
types into three linear screens (Setup → Quiz → Results) using Expo Router v6 for
navigation and Zustand for cross-screen state. All required libraries are already
installed (`expo-router@57.0.4`, `zustand@5.0.14`, RN core `Share` needs no install) —
this phase adds **zero new package dependencies**.

The central architectural decision this research surfaces: **do not pass quiz state
through Expo Router URL params.** Router params are string-only and would force
serializing/deserializing the `QuizSession` (with nested `Question[]`) on every
screen transition — exactly the anti-pattern CONTEXT.md's D-11 and the phase brief
already rule out. Instead, `useQuizStore` (Zustand) becomes the single source of
truth for in-progress session state, and screens read/write it via hooks and actions
while `router.push`/`router.replace` handle only the visual transition. Route params
should be avoided entirely for this phase — there is no case in the setup→quiz→results
flow that needs a URL-addressable parameter.

The second key decision: **push interaction logic (answer-lock, index-advance,
correct/incorrect derivation) into store actions, not component state.** This mirrors
the existing pure-logic-first testing pattern from Phases 2-3 (`__tests__/*.test.ts`
with zero RN rendering) and lets QUIZ-03's feedback/advance behavior be fully unit
tested via `useQuizStore.getState()` assertions, without needing
`@testing-library/react-native` (not currently installed, and per the locked stack
guidance in CLAUDE.md, should not be added speculatively).

**Primary recommendation:** Build `useQuizStore` as the stateful controller for the
whole quiz session (filters → generated session → per-question answer/lock state →
completed answers array), keep all three screens as thin renderers driven by store
selectors and store actions, and use `router.replace()` (not `push()`) for the
setup→quiz and quiz→results transitions so the back button cannot return the user to
a stale in-progress step.

## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Tense selection is a multi-select control showing all 4 tenses (present
  indicative, preterite, imperfect, future) plus a top-level "All tenses" shortcut
  that selects/deselects all 4 at once.
- **D-02:** The "Start Quiz" button is disabled until at least 1 tense is selected —
  the zero-tense invalid state is prevented structurally, not handled via an error
  message after the fact.
- **D-03:** The "Include irregular verbs" toggle has label text only, no explanatory
  helper copy underneath — matches the minimal style of the rest of the setup screen.
- **D-04:** When Phase 3's `InsufficientVerbsError` is thrown (the tense/irregular
  filter combination yields <10 eligible questions), catch it BEFORE navigating to
  the quiz screen. Show a short inline error message on the setup screen and keep
  the user there. Never navigate to the quiz screen in an error state.
- **D-05:** After the user taps an answer choice, that choice is colored green
  (correct) or red (wrong). If wrong, the actual correct choice is ALSO highlighted
  green so the learner sees the right answer immediately.
- **D-06:** The first tap locks the answer — all 4 choices become non-interactive
  immediately after selection. No changing the answer before advancing.
- **D-07:** Advancing to the next question requires a manual "Next" button tap after
  feedback is shown — no auto-advance timer.
- **D-08:** Progress during the quiz shows BOTH a text counter (e.g. "3 / 10") and a
  visual progress bar.
- **D-09:** Score is presented as a large, prominent "X/10" — the visual centerpiece
  of the results screen, not a plain sentence.
- **D-10:** The native iOS share-sheet message (RSLT-02) is:
  `"I scored X/10 on Portuguese Verb Quiz!"` — score-first, casual/celebratory tone,
  substitute the actual score for X.
- **D-11:** Results screen offers three actions: open the share sheet, "Try Again"
  (immediately starts a new quiz reusing the SAME tense/irregular filters — no
  return to setup needed), and a separate action to go back to Setup (to change
  filters). "Try Again" must re-derive a fresh session via `generate()` with the
  same `GenerateOptions`, not replay the same questions.

### Claude's Discretion

- Exact visual layout/styling details not covered above (spacing, typography,
  colors beyond the green/red feedback semantics, iconography) — implementer's
  choice, consistent with the plain `StyleSheet.create` approach already used in
  `app/index.tsx`.
- Whether tense multi-select renders as chips, checkboxes, or another control —
  functionally it must support D-01's multi-select + "All tenses" shortcut
  semantics; visual treatment is open.
- Exact Zustand store shape for `useQuizStore` beyond what Phase 3's
  `QuizSession`/`Question`/`GenerateOptions` types require it to hold (current
  session, current question index, answers array, current filters) — planner's
  discretion, following the existing placeholder in `src/store/useQuizStore.ts`.
- Navigation/routing file structure under `app/` (e.g. `app/setup.tsx`,
  `app/quiz.tsx`, `app/results.tsx` vs nested routes) — follow Expo Router
  conventions; Phase 1 D-04 explicitly deferred these route files to this phase.

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope. Feedback submission (Phase 5) was not
raised as scope creep here.

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SETUP-01 | User can select one or more tenses to practice | Multi-select toggle pattern (Pattern 3 below); `Tense`/`TENSES` from `src/dataset/types.ts` drive the option list |
| SETUP-02 | User can toggle "Include irregular verbs" (default off), independent of tense selection | Simple boolean toggle in store `filters.includeIrregular`, RN `Switch` or `Pressable` chip |
| SETUP-03 | Starting a quiz creates a 10-question session from local dataset respecting filters | Store action calls `generate(options)` from `src/quiz/engine.ts`; catches `InsufficientVerbsError` per D-04 before navigating |
| QUIZ-01 | Each question shows infinitive, translation, tense, learner-friendly subject label | Requires a NEW `subjectLabels: Record<Subject, string>` lookup (Pattern 2) — not present in codebase yet, this phase's responsibility per 02-CONTEXT.md D-03 |
| QUIZ-02 | Each question presents 4 answer choices with exactly 1 correct | Already guaranteed by `Question.choices`/`correctAnswer` from `generate()` — render as-is, do not re-shuffle client-side |
| QUIZ-03 | Immediate right/wrong feedback, then continue to next question | Store-driven lock/feedback/advance actions (Pattern 1) satisfy D-05/D-06/D-07 |
| RSLT-01 | Results screen shows score out of 10 | `score()` from `src/quiz/scoring.ts` called once on quiz completion, stored in results-ready state |
| RSLT-02 | Native iOS share sheet with score + app name message | RN core `Share.share({ message })` (Pattern 4) |

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Tense/irregular filter selection (SETUP-01/02) | Client (Screen component, local UI state or store) | — | Pure UI selection state, no business logic |
| Session generation (SETUP-03) | Client (Zustand store action) | — | Wraps existing pure `generate()`; must live in one place so Setup and "Try Again" both call the same path |
| Question rendering + label mapping (QUIZ-01/02) | Client (Screen component) | Client (`src/quiz` presentation helpers) | Subject-label lookup is presentation-only, kept out of `src/dataset` domain types per 02-CONTEXT.md D-03 |
| Answer lock/feedback/advance (QUIZ-03) | Client (Zustand store action) | Client (Screen renders derived state) | Testable without RN rendering; screen only reflects store state visually |
| Scoring (RSLT-01) | Client (Zustand store action, calls `score()`) | — | Pure function already exists; store just invokes it once at completion |
| Native share sheet (RSLT-02) | Client (Screen component, direct RN API call) | — | `Share.share()` is a one-shot native call, no reason to route through the store |
| Navigation transitions | Client (Expo Router) | — | Router only controls which screen is visible; it does not own quiz data |

No API/backend or database tier involvement in this phase — confirmed out of scope
per CLAUDE.md ("mobile app never fetches quiz content from any backend").

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `expo-router` | 57.0.4 (already installed) [VERIFIED: npm registry, matches installed package.json] | File-based screen routing for Setup/Quiz/Results | Already locked project-wide; `router.push`/`router.replace` are the standard imperative navigation API for wizard-style flows [CITED: docs.expo.dev/router/basics/navigation] |
| `zustand` | 5.0.14 (already installed) [VERIFIED: npm registry, matches installed package.json] | Session state store (`useQuizStore`) shared across all 3 screens | Already locked; avoids Router's string-only param serialization limitation entirely |
| `react-native` core `Share` | ships with RN 0.86.0, no install | Native iOS share sheet for RSLT-02 | Zero-dependency native module; correct primitive for plain-text sharing (confirmed again this session, see Package Legitimacy Audit — N/A, no install) [CITED: reactnative.dev/docs/share] |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `react-native` core `Switch` or `Pressable` | ships with RN 0.86.0 | Toggle control for "Include irregular verbs" (SETUP-02) | `Switch` gives free iOS-native toggle visuals; `Pressable`-based custom chip is fine too per D-03's minimal-style note — implementer's discretion, no library needed either way |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Router params for session handoff | Zustand store (chosen) | Router search params in Expo Router v6 only serialize string/number/boolean — a `QuizSession` with nested arrays would require JSON-stringify/parse round-tripping through the URL, adding needless complexity and losing type safety. Zustand avoids this entirely. [CITED: docs.expo.dev/router/basics/navigation] |
| `router.push()` for every transition | `router.replace()` for setup→quiz and quiz→results | `push` keeps prior screens on the stack, so a hardware/gesture back from Results could land on a stale mid-quiz screen with a completed session. `replace` removes the previous step from history, matching D-11's explicit "Try Again re-derives a fresh session" intent. [CITED: docs.expo.dev/router/basics/navigation] |
| Component-local `useState` for answer-lock/feedback | Zustand store actions (chosen) | Local state can't be unit tested without `@testing-library/react-native` (not installed); store actions can be tested with plain Jest exactly like the existing `__tests__/useQuizStore.test.ts`, keeping the project's zero-RNTL testing posture intact. |

**Installation:** None required — all libraries needed for this phase are already
present in `package.json`.

**Version verification:** Confirmed via `npm view <pkg> version` against the
project's own `package.json` (2026-07-12): `expo-router@57.0.4` matches installed
`~57.0.4`; `zustand@5.0.14` matches installed `^5.0.14`; `react-native@0.86.0`
matches installed exactly. No upgrades needed for this phase.

## Package Legitimacy Audit

**No new external packages are being installed in this phase.** All three
libraries used (`expo-router`, `zustand`, RN core `Share`) are either already
present in `package.json` (installed and audited in prior phases) or ship inside
`react-native` itself with no separate install step. The Package Legitimacy Gate
is not applicable — skip slopcheck/registry verification for this phase.

**Packages removed due to slopcheck [SLOP] verdict:** none (N/A — no installs)
**Packages flagged as suspicious [SUS]:** none (N/A — no installs)

## Architecture Patterns

### System Architecture Diagram

```
┌─────────────┐   generate(options)   ┌──────────────────┐
│ Setup Screen│──────────────────────▶│ useQuizStore      │
│ (app/setup) │  catches              │ (Zustand)          │
│             │  InsufficientVerbsErr │  - filters          │
└─────┬───────┘                       │  - session           │
      │ router.replace('/quiz')       │  - currentIndex        │
      │ (only on success)             │  - answers[]             │
      ▼                               │  - lockedChoice           │
┌─────────────┐  reads current Q      │  actions:                  │
│ Quiz Screen │◀──────────────────────│   startQuiz(options)        │
│ (app/quiz)  │  selectAnswer(choice) │   selectAnswer(choice)      │
│             │──────────────────────▶│   advance()                 │
│             │  advance()            │   reset()                   │
└─────┬───────┘──────────────────────▶│   (derives score on demand) │
      │ router.replace('/results')    └──────────────────────────┘
      │ (after last question advance)              ▲
      ▼                                             │ score(session, answers)
┌─────────────┐   Share.share({message})            │ + same filters
│Results      │──────────▶ native iOS share sheet    │ for "Try Again"
│Screen       │                                      │
│(app/results)│──────────────────────────────────────┘
│ "Try Again" → store.startQuiz(sameFilters) → router.replace('/quiz')
│ "Back to Setup" → router.replace('/setup')
└─────────────┘
```

Data flow for the primary use case: Setup screen collects `filters` → calls
`store.startQuiz(filters)` → store calls `generate()` (Phase 3, pure) → on success,
`router.replace('/quiz')`; on `InsufficientVerbsError`, store surfaces an error
string, screen renders it inline, no navigation occurs. Quiz screen reads
`session.questions[currentIndex]` from the store, calls `store.selectAnswer(choice)`
on tap (locks + derives correct/incorrect), calls `store.advance()` on "Next" tap
(appends to `answers[]`, increments index, or triggers completion). On the 10th
question's advance, the store transitions to a "completed" state and the screen
calls `router.replace('/results')`. Results screen reads the derived `score()`
result from the store, renders "X/10", and offers Share / Try Again / Back to Setup.

### Recommended Project Structure
```
app/
├── setup.tsx        # SETUP-01/02/03 — tense multi-select, irregular toggle, Start Quiz
├── quiz.tsx          # QUIZ-01/02/03 — question render, answer tap, feedback, Next
├── results.tsx        # RSLT-01/02 — score display, Share, Try Again, Back to Setup
└── index.tsx           # existing — becomes a landing screen linking into /setup (or redirects)
src/
├── quiz/
│   ├── engine.ts        # existing, unchanged
│   ├── scoring.ts         # existing, unchanged
│   ├── types.ts            # existing, unchanged
│   └── labels.ts             # NEW — subjectLabels: Record<Subject, string>, tenseLabels if needed for display
└── store/
    └── useQuizStore.ts        # REPLACES placeholder — session, index, answers, filters, actions
```

### Pattern 1: Store-Owned Interaction State Machine (QUIZ-03, D-05/D-06/D-07)
**What:** All per-question interaction state (which choice was tapped, whether it's
locked, whether it was correct) lives in the Zustand store, not component `useState`.
The screen is a pure function of store state.
**When to use:** Any interaction whose correctness needs unit testing without
mounting a component (matches this project's existing zero-RNTL test posture).
**Example:**
```typescript
// src/store/useQuizStore.ts — illustrative shape, not prescriptive of every field name
import { create } from "zustand";
import { generate } from "../quiz/engine";
import { score as computeScore } from "../quiz/scoring";
import type { GenerateOptions, QuizSession } from "../quiz/types";
import { InsufficientVerbsError } from "../quiz/types";

interface QuizStoreState {
  status: "idle" | "error" | "in-progress" | "completed";
  filters: GenerateOptions | null;
  session: QuizSession | null;
  currentIndex: number;
  answers: (string | null)[];
  lockedChoice: string | null;
  errorMessage: string | null;
  startQuiz: (options: GenerateOptions) => void;
  selectAnswer: (choice: string) => void;
  advance: () => void;
  reset: () => void;
}

export const useQuizStore = create<QuizStoreState>((set, get) => ({
  status: "idle",
  filters: null,
  session: null,
  currentIndex: 0,
  answers: [],
  lockedChoice: null,
  errorMessage: null,

  startQuiz: (options) => {
    try {
      const session = generate(options);
      set({
        status: "in-progress",
        filters: options,
        session,
        currentIndex: 0,
        answers: [],
        lockedChoice: null,
        errorMessage: null,
      });
    } catch (err) {
      if (err instanceof InsufficientVerbsError) {
        set({ status: "error", errorMessage: "Not enough verbs for that combination — try selecting more tenses or including irregulars" });
      } else {
        throw err;
      }
    }
  },

  selectAnswer: (choice) => {
    const { lockedChoice } = get();
    if (lockedChoice !== null) return; // D-06: first tap locks
    set({ lockedChoice: choice });
  },

  advance: () => {
    const { session, currentIndex, answers, lockedChoice } = get();
    if (!session) return;
    const nextAnswers = [...answers, lockedChoice];
    const nextIndex = currentIndex + 1;
    if (nextIndex >= session.questions.length) {
      set({ answers: nextAnswers, status: "completed" });
    } else {
      set({ answers: nextAnswers, currentIndex: nextIndex, lockedChoice: null });
    }
  },

  reset: () => set({ status: "idle", session: null, currentIndex: 0, answers: [], lockedChoice: null, errorMessage: null }),
}));
```
**Testability:** `useQuizStore.getState().startQuiz(...)`, `.selectAnswer(...)`,
`.advance()` can all be asserted via `useQuizStore.getState()` in plain Jest, exactly
matching the existing `__tests__/useQuizStore.test.ts` pattern — no RN rendering.

### Pattern 2: Presentation-Only Label Lookup (QUIZ-01)
**What:** A `subjectLabels: Record<Subject, string>` (and optionally
`tenseLabels: Record<Tense, string>`) map kept in `src/quiz/labels.ts` — separate
from `src/dataset/types.ts` which holds the backend-locked enum literals.
**When to use:** Whenever internal enum literals (`ele_ela`, `present_indicative`)
need a human-readable Portuguese/English label in the UI.
**Example:**
```typescript
// src/quiz/labels.ts
import type { Subject, Tense } from "../dataset/types";

export const subjectLabels: Record<Subject, string> = {
  eu: "eu",
  tu: "tu",
  ele_ela: "ele/ela",
  nos: "nós",
  voces: "vocês",
  eles_elas: "eles/elas",
};

export const tenseLabels: Record<Tense, string> = {
  present_indicative: "Present",
  preterite: "Preterite",
  imperfect: "Imperfect",
  future: "Future",
};
```
This is explicitly scoped to this phase per `02-CONTEXT.md` D-03 — do not add these
labels to `src/dataset/types.ts`, which must stay aligned 1:1 with the backend's
locked enum literals.

### Pattern 3: Multi-Select with "All" Shortcut (SETUP-01, D-01)
**What:** A toggle-array pattern where an "All tenses" control is derived state
(checked when `selected.length === TENSES.length`), not separate state to keep in
sync manually.
**When to use:** Any "select all / select individual" UI without a component
library.
**Example:**
```typescript
// Illustrative — screen-local or store-held, planner's discretion per CONTEXT.md
const allSelected = filters.tenses.length === TENSES.length;

function toggleTense(tense: Tense) {
  const next = filters.tenses.includes(tense)
    ? filters.tenses.filter((t) => t !== tense)
    : [...filters.tenses, tense];
  setFilters({ ...filters, tenses: next });
}

function toggleAll() {
  setFilters({ ...filters, tenses: allSelected ? [] : [...TENSES] });
}
```
Deriving `allSelected` from the selection array (rather than tracking it as its own
boolean) avoids a whole class of "All" checkbox getting out of sync with individual
selections — a common bug in hand-rolled multi-select UIs.

### Pattern 4: Native Share on Results (RSLT-02, D-10)
**What:** Direct call to RN core `Share.share()` from the Results screen component,
no store involvement needed (it's a one-shot side effect, not app state).
**Example:**
```typescript
// Source: https://reactnative.dev/docs/share
import { Share } from "react-native";

async function handleShare(correct: number, total: number) {
  try {
    await Share.share({
      message: `I scored ${correct}/${total} on Portuguese Verb Quiz!`,
    });
    // iOS: result.action is Share.sharedAction or Share.dismissedAction — both
    // are non-error outcomes; no branching needed for this phase's scope (no
    // analytics/tracking of share outcome required by RSLT-02).
  } catch (error) {
    // Share.share() rejecting is rare (native failure) — swallow or log; must
    // never block the results screen from being usable.
  }
}
```
Note D-10 locks the message to exactly `X/10` (not the generic `correct/total`
template above) — substitute `session.questions.length` (always 10 per
`QUESTIONS_PER_SESSION`) for the denominator display, but prefer using the actual
`total` from `score()`'s return value for correctness robustness.

### Anti-Patterns to Avoid
- **Passing `QuizSession` through router params:** Expo Router v6 params are
  string-only; forcing a `Question[]` array through `useLocalSearchParams` requires
  manual JSON serialization, loses type safety, and re-introduces exactly the
  complexity Zustand already solves. [CITED: docs.expo.dev/router/basics/navigation]
- **Re-deriving/re-shuffling `choices` client-side:** Phase 3's `generate()` already
  produces final shuffled `choices` and `correctAnswer` per question — rendering
  logic must display them as-is (locked behavior per `03-CONTEXT.md` D-02/D-03).
- **Tracking "All tenses" as independent boolean state:** causes sync bugs when
  individual tense toggles change; derive it from the selection array instead
  (Pattern 3).
- **Using `router.push()` for every step transition:** leaves stale screens on the
  navigation stack, allowing back-navigation into a completed quiz mid-state;
  use `router.replace()` for forward wizard progression (see Alternatives table).
- **Adding `@testing-library/react-native` speculatively:** not currently installed;
  this phase's interaction logic is fully testable via store actions (Pattern 1)
  without it. Only add if a later phase needs true render-level interaction tests.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Cross-screen quiz state | Custom global singleton / event emitter | Zustand `useQuizStore` (already the project's locked choice) | Zustand already solves subscription, re-render isolation, and testability; a hand-rolled singleton would duplicate this with none of the ergonomics |
| iOS share sheet | Custom modal with share icons per target app | RN core `Share.share()` | Native `UIActivityViewController` already gives the full iOS share surface (Messages, Mail, copy, etc.) for free |
| Score calculation | Re-deriving correct/incorrect counts in the Results screen | `score()` from `src/quiz/scoring.ts` (Phase 3, already unit-tested) | Duplicating this logic in a screen risks drifting from the tested pure function and violates the "no quiz-engine logic changes" phase boundary |
| Answer randomization / distractor selection | Any client-side shuffling in the Quiz screen | `Question.choices` as returned by `generate()` | Already shuffled and validated by Phase 3's tests; re-shuffling client-side could produce a different displayed correct answer than what scoring expects |

**Key insight:** This phase is almost entirely a "wiring" phase — the temptation to
hand-roll is highest in state management (screen-local `useState` creeping in) and
in re-deriving values (`choices`, `correctAnswer`, score) that already exist as
tested pure functions. Every piece of business logic already has a Phase 2/3 home;
this phase's job is to call it, not reimplement it.

## Common Pitfalls

### Pitfall 1: Router Params Silently Truncating Session Data
**What goes wrong:** A first implementation attempt tries `router.push({ pathname:
"/quiz", params: { session: JSON.stringify(session) } })`, which works in dev but
produces URL-length issues or type-unsafe re-parsing on the receiving screen, and
breaks entirely once `Question.choices` grows large enough or contains special
characters needing escaping.
**Why it happens:** Router params look like a "quick" way to pass data between
screens, mirroring patterns from other RN navigation libraries, but Expo Router v6
only supports string/number/boolean serialization by design.
**How to avoid:** Never pass `QuizSession`, `Question[]`, or `answers[]` through
router params. Store must be the only channel for this data (Pattern 1).
**Warning signs:** Any `JSON.stringify`/`JSON.parse` appearing near a
`router.push`/`useLocalSearchParams` call.

### Pitfall 2: "Try Again" Replaying Stale Questions Instead of Regenerating
**What goes wrong:** Implementer stores the just-completed `QuizSession` and reuses
it directly for "Try Again," producing the exact same 10 questions in the exact same
order — contradicts D-11's explicit requirement to call `generate()` again with the
same filters.
**Why it happens:** Reusing the existing session object is the "path of least
resistance" once it's already in the store.
**How to avoid:** "Try Again" must call `store.startQuiz(store.filters)` (or
equivalent), invoking `generate()` fresh — not `store.reset()` + reuse of the old
`session` field.
**Warning signs:** A "Try Again" implementation that doesn't call `generate()` again
or doesn't touch `session` at all.

### Pitfall 3: Locking Logic Implemented in the Screen Instead of the Store
**What goes wrong:** `selectedChoice`/`isLocked` implemented as `useState` inside
`app/quiz.tsx` works visually but can't be unit tested without
`@testing-library/react-native`, and duplicates state that arguably belongs with the
rest of the session (answers array) in the store.
**Why it happens:** `useState` is the reflexive first tool for "a tap changes what's
on screen."
**How to avoid:** Route the lock/feedback logic through store actions (Pattern 1) so
QUIZ-03's core behavior has a testable, RN-free unit test surface, matching every
other phase's testing posture in this codebase.
**Warning signs:** Quiz screen file growing complex `useState`/`useEffect` chains
that mirror what the store should own.

### Pitfall 4: InsufficientVerbsError Reaching the Quiz Screen
**What goes wrong:** If `generate()` is called inside `useEffect` on the Quiz screen
itself (rather than gated on the Setup screen before navigation), a thrown
`InsufficientVerbsError` crashes the Quiz screen or requires an error boundary,
directly violating D-04 ("never navigate to the quiz screen in an error state").
**Why it happens:** It can feel natural to "generate when the quiz screen mounts"
since that's when the session is first needed.
**How to avoid:** `generate()` must only ever be called from the Setup screen's
"Start Quiz" handler (or the Results screen's "Try Again" handler) — both of which
are already gated behind an explicit user action and can catch the error
synchronously before any navigation call fires.
**Warning signs:** Any `try/catch` around `generate()` living inside `app/quiz.tsx`.

### Pitfall 5: `Switch`/Toggle Default State Drifting from SETUP-02
**What goes wrong:** "Include irregular verbs" toggle initialized to `true` or left
undefined, silently violating the explicit "(default off)" requirement.
**Why it happens:** Easy to forget an explicit initial value when wiring a `Switch`
to store state.
**How to avoid:** `useQuizStore`'s initial `filters` (or screen-local initial state)
must explicitly set `includeIrregular: false`; write a unit test asserting the
store's default filter shape.
**Warning signs:** No test coverage on the store's initial state's `includeIrregular`
field.

## Code Examples

### Store-driven Quiz screen render (illustrative, screen stays thin)
```typescript
// Source: pattern derived from Zustand docs + this project's existing store test conventions
import { useQuizStore } from "../src/store/useQuizStore";
import { subjectLabels, tenseLabels } from "../src/quiz/labels";

export default function QuizScreen() {
  const session = useQuizStore((s) => s.session);
  const currentIndex = useQuizStore((s) => s.currentIndex);
  const lockedChoice = useQuizStore((s) => s.lockedChoice);
  const selectAnswer = useQuizStore((s) => s.selectAnswer);
  const advance = useQuizStore((s) => s.advance);

  if (!session) return null; // guarded by router.replace only firing on success

  const question = session.questions[currentIndex];
  // ... render question.verb, question.choices with green/red styling
  // derived from `lockedChoice === choice` and `choice === question.correctAnswer`
}
```

### Navigation on quiz completion
```typescript
// app/quiz.tsx — "Next" button handler
import { useRouter } from "expo-router";

const router = useRouter();
const status = useQuizStore((s) => s.status);

function handleNext() {
  advance();
  // status flips to "completed" inside the store when the last question advances;
  // read post-advance status to decide whether to navigate
  if (useQuizStore.getState().status === "completed") {
    router.replace("/results");
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|---------------|--------|
| React Navigation with manually configured stack navigators | Expo Router v6 file-based routing | SDK 54+ baseline, continued in SDK 57 | Already the project's locked choice since Phase 1 scaffold; no migration needed, just correct usage of `router.replace` for wizard flows |
| Passing complex objects through navigation `params` (common in older RN codebases) | Global state stores (Zustand/Redux) for cross-screen non-URL-addressable state | Long-standing RN community consensus, reaffirmed by Expo Router's own string-only params design | Confirms this phase's Zustand-first approach rather than a params-based one |

**Deprecated/outdated:** None specific to this phase's scope — no APIs used here
are deprecated in the installed SDK 57 / RN 0.86 versions.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Exact `useQuizStore` field names (`lockedChoice`, `currentIndex`, `status` union values) shown in code examples are illustrative, not mandated | Architecture Patterns, Code Examples | Low — CONTEXT.md explicitly leaves store shape to planner's discretion; if the planner adopts different field names, no functional risk, only a documentation/example mismatch |
| A2 | `Switch` vs custom `Pressable` chip for the irregular-verbs toggle has no meaningful UX tradeoff for this app's scope | Standard Stack (Supporting) | Low — purely cosmetic; D-03 leaves visual treatment unconstrained beyond "label text only" |

**If this table is empty:** N/A — two low-risk illustrative-code assumptions noted
above; both are explicitly within CONTEXT.md's "Claude's Discretion" scope and carry
no risk to correctness.

## Open Questions

1. **Should `app/index.tsx` redirect straight to `/setup`, or remain a distinct
   landing screen with a "Start" button?**
   - What we know: Phase 1 D-04 deferred setup/quiz/results routes to this phase;
     `app/index.tsx` currently just renders a static heading.
   - What's unclear: Whether the phase's success criteria ("user can open the app,
     pick what to practice...") implies `index.tsx` IS the setup screen, or a
     separate landing screen precedes it.
   - Recommendation: Given CONTEXT.md's domain boundary describes exactly three
     screens (Setup, Quiz, Results) with no separate landing screen mentioned, the
     simplest reading is that `app/index.tsx` becomes (or redirects to) the Setup
     screen directly — avoids an unrequested extra tap before the core loop starts.
     Flag for planner/user confirmation if a distinct landing/welcome screen is
     actually wanted.

## Environment Availability

Skipped — this phase has no new external tool/service dependencies beyond what's
already installed and verified working from prior phases (Expo/Metro toolchain,
Jest). No network calls, no new native modules requiring additional native build
configuration.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | `jest-expo@57.0.1` (Jest 30.x transitively) |
| Config file | `package.json` `"jest": { "preset": "jest-expo" }` |
| Quick run command | `npx jest __tests__/useQuizStore.test.ts` (or new store test file) |
| Full suite command | `npm test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SETUP-01 | Store filters.tenses reflects multi-select + "All tenses" derivation | unit (store) | `npx jest __tests__/useQuizStore.test.ts -t "tenses"` | ❌ Wave 0 (extend existing store test file) |
| SETUP-02 | Store filters.includeIrregular defaults false, toggles correctly | unit (store) | `npx jest __tests__/useQuizStore.test.ts -t "irregular"` | ❌ Wave 0 |
| SETUP-03 | `startQuiz()` calls `generate()`, populates session on success | unit (store) | `npx jest __tests__/useQuizStore.test.ts -t "startQuiz"` | ❌ Wave 0 |
| SETUP-03 (error path, D-04) | `startQuiz()` catches `InsufficientVerbsError`, sets status "error", never sets session | unit (store) | `npx jest __tests__/useQuizStore.test.ts -t "insufficient"` | ❌ Wave 0 |
| QUIZ-01 | `subjectLabels`/`tenseLabels` map covers all `Subject`/`Tense` values | unit (pure) | `npx jest __tests__/quiz-labels.test.ts` | ❌ Wave 0 (new file, new `src/quiz/labels.ts`) |
| QUIZ-03 (lock, D-06) | `selectAnswer()` is a no-op after first tap (lockedChoice already set) | unit (store) | `npx jest __tests__/useQuizStore.test.ts -t "locks"` | ❌ Wave 0 |
| QUIZ-03 (advance, D-07) | `advance()` appends to answers[], increments index, flips to "completed" on last question | unit (store) | `npx jest __tests__/useQuizStore.test.ts -t "advance"` | ❌ Wave 0 |
| RSLT-01 | `score()` invoked with completed session + answers produces correct `{correct, total}` | unit (pure, already tested in Phase 3) | `npx jest __tests__/quiz-scoring.test.ts` | ✅ (Phase 3, no new test needed — reused, not re-derived) |
| RSLT-02 | Share message format matches D-10 exactly (`"I scored X/10 on Portuguese Verb Quiz!"`) | unit (pure helper) | `npx jest __tests__/quiz-share.test.ts` | ❌ Wave 0 (extract message-building into a small pure function, e.g. `buildShareMessage(correct, total)`, to make it testable without invoking native `Share.share()`) |
| D-11 ("Try Again" re-derives) | `startQuiz()` called again with same filters produces a NEW session object (not the same reference/array) | unit (store) | `npx jest __tests__/useQuizStore.test.ts -t "try again"` | ❌ Wave 0 |

Screen-level rendering (actual `View`/`Text`/`Pressable` output, tap-driven
green/red coloring) is intentionally left to manual verification per this
project's zero-`@testing-library/react-native` posture — all underlying *logic*
(SETUP-01/02/03, QUIZ-03, D-06/D-07/D-11) is covered by store-level unit tests per
Pattern 1, which is the same pure-logic-first strategy Phases 2-3 already
established.

### Sampling Rate
- **Per task commit:** `npx jest __tests__/useQuizStore.test.ts` (fast, covers the
  bulk of new logic)
- **Per wave merge:** `npm test` (full suite, includes Phase 2/3 regression)
- **Phase gate:** Full suite green before `/gsd:verify-work`, plus a manual iOS
  simulator walkthrough of all 3 screens (screen rendering/styling is not covered
  by automated tests per the note above)

### Wave 0 Gaps
- [ ] Extend `__tests__/useQuizStore.test.ts` with the real store shape (filters,
      session, currentIndex, answers, lockedChoice, status, actions) — current file
      only asserts the placeholder `{ status: "idle" }`
- [ ] `src/quiz/labels.ts` + `__tests__/quiz-labels.test.ts` — new pure lookup
      module and its completeness test (QUIZ-01)
- [ ] `__tests__/quiz-share.test.ts` — new pure `buildShareMessage()` helper and
      test (RSLT-02), extracted so the D-10 message format is testable without
      mocking `react-native`'s `Share` module
- [ ] No new test framework/config needed — `jest-expo` preset already covers this

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | No auth anywhere in this product (locked, CLAUDE.md) |
| V3 Session Management | No | "Session" here means an in-memory quiz session only, not an auth session; no tokens/cookies involved |
| V4 Access Control | No | Single-user local app, no access boundaries |
| V5 Input Validation | Partial — N/A for this phase specifically | Setup screen's inputs are constrained UI controls (multi-select from a fixed `TENSES` array, boolean toggle) — not free-text, so there is no injectable user input surface in this phase. Phase 5's feedback form (free-text `message` field) is where V5/Zod validation genuinely applies, per `.planning/research/STACK.md`. |
| V6 Cryptography | No | No crypto operations in this phase |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| N/A for this phase | — | This phase has no network calls, no user-supplied free text, no persistence beyond in-memory Zustand state that resets on app close. The attack surface introduced by Setup/Quiz/Results is effectively nil — flagging explicitly rather than fabricating threats to fill the table. |

This phase is offline-only, UI-and-local-logic-only — no meaningful security domain
beyond "don't accidentally introduce a network call or persistence" (which the
CLAUDE.md constraints already forbid).

## Sources

### Primary (HIGH confidence)
- https://reactnative.dev/docs/share — official RN core Share API reference (message,
  title, options, sharedAction/dismissedAction, iOS-only fields), fetched directly
  this session
- https://docs.expo.dev/router/basics/navigation/ — official Expo Router navigation
  guide (`router.push`/`replace`/`back`, string-only params limitation), fetched
  directly this session
- `npm view expo-router version` / `npm view zustand version` / `npm view
  react-native version` — direct registry queries, confirmed against installed
  `package.json` versions (2026-07-12)
- Direct repo reads: `src/quiz/types.ts`, `src/quiz/engine.ts`,
  `src/quiz/scoring.ts`, `src/store/useQuizStore.ts`, `src/dataset/types.ts`,
  `app/_layout.tsx`, `app/index.tsx`, `__tests__/useQuizStore.test.ts`,
  `__tests__/smoke.test.ts`, `package.json`, `tsconfig.json`, `.planning/config.json`

### Secondary (MEDIUM confidence)
- WebSearch synthesis on Expo Router v6 + Zustand cross-screen state pattern
  (cross-verified against the official docs.expo.dev fetch above — same conclusion)

### Tertiary (LOW confidence)
- None — all findings for this phase were verifiable against either the installed
  codebase or official documentation; no unverified WebSearch-only claims remain.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries already installed and version-verified
  against the live `package.json`; no new dependencies introduced
- Architecture: HIGH — router-params-vs-store tradeoff and wizard navigation
  pattern (`replace` vs `push`) confirmed directly against official Expo Router
  docs, cross-checked with WebSearch
- Pitfalls: HIGH — derived directly from CONTEXT.md's explicit decisions (D-04,
  D-06, D-07, D-11) plus this codebase's established pure-logic-first testing
  pattern; not speculative

**Research date:** 2026-07-12
**Valid until:** 2026-08-11 (30 days — stable, no fast-moving dependencies; Expo
SDK/Router version already locked project-wide)
