# Phase 16: Explanation Panel UI - Research

**Researched:** 2026-07-20
**Domain:** Expo/React Native UI wiring (no new libraries) — Zustand store extension + Quiz screen data-source fix + new presentational component
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01 (Panel visual treatment):** Explanation panel uses a neutral surface
  card — `colors.surface` background, `colors.textSecondary` text — the same
  "quiet" treatment already used by `OfflinePill`. It should read as
  supplementary info, not another alert, and stay visually distinct from
  the existing green (`colors.success`) / red (`colors.error`)
  correct/wrong choice highlighting already on the choice buttons.
  Rejected: `primarySoft`-tinted "tip" card (too visually loud) and plain
  text with no card (blends into the meta row above).

- **D-02 (Layout stability):** Conditional mount — the panel only renders in
  the tree when `selectExplanation` actually returns a string. No
  reserved/hidden space when there's no explanation. This matches EXPL-03's
  "no explanation panel is shown" literally. Accepted tradeoff:
  choices/Next button position shifts slightly between a question with an
  explanation and one without — user explicitly preferred this over the
  `nextButton`/`reportButton` opacity-0 reserved-space pattern already used
  elsewhere in `quiz.tsx`.

- **D-03 (Copy/label):** Sentence only, no heading/label above it (no "Why?"
  or "Explanation:" caption). The backend's templates are already
  self-contained sentences (e.g. "For X, the correct answer is...") — a
  label would be redundant framing.

- **D-04 (Timing/animation):** No animation or delay — the panel appears
  instantly alongside the existing instant right/wrong choice coloring,
  consistent with the rest of the Quiz screen (which has zero animation on
  answer reveal today).

### Claude's Discretion

- Where the Quiz screen sources the `learning` block and the
  formIndex-bearing `Verb` object. Two known gaps to resolve as
  implementation details (not user preferences):
  1. `useQuizStore`'s `startQuiz` currently destructures only `{ verbs }`
     from `resolveVerbs()` and discards `learning` entirely — nothing in
     the store today exposes `learning` to screens.
  2. `app/quiz.tsx`'s `currentVerb` lookup
     (`verbs.find((v) => v.verb === question.verb)`) reads from the
     **locally bundled** `src/dataset/verbs.ts` import, NOT from the
     session's resolved/fetched verb list — so it never has `formIndex`
     even on a successful remote fetch. This must be corrected so
     `selectExplanation` receives a real `Verb` with `formIndex` when one
     exists. Both are wiring bugs/gaps for the planner to fix, not open
     product questions.
- Exact component/function boundary (e.g., a small `ExplanationPanel`
  component in `src/components/` vs. inline JSX in `quiz.tsx`) — follows
  existing conventions (`OfflinePill.tsx` precedent), no user preference
  expressed.
- Whether `selectExplanation` is called via a `useMemo`/inline computation
  each render vs. computed once per locked answer — performance/implementation
  detail, negligible either way at this scale.

### Deferred Ideas (OUT OF SCOPE)

None new — this phase's only known limitation (the cross-verb formIndex
gap, D-03 from Phase 15's CONTEXT.md) was already captured and deferred in
Phase 15; it applies unchanged here (a cross-verb DIST-03 distractor will
still resolve to "no explanation," which is correct fail-closed behavior
per EXPL-03, not a new bug to fix in this phase).

</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| EXPL-02 | After an incorrect answer, the Quiz screen shows a short (1-2 sentence) explanation panel, placed between the answer choices and the Next button, built by resolving the selected answer's actual `{tense, subject}` slot via `formIndex` and filling the matching backend template | Confirmed exact `selectExplanation` signature and call-site pattern (Code Examples); confirmed both wiring gaps (Gap 1: store discards `learning`, Gap 2: `currentVerb` reads bundled dataset) with precise line-level fixes (Architecture Patterns / Confirmed Wiring Gaps); UI-SPEC.md's placement/component contract verified consistent with `quiz.tsx`'s current JSX structure |
| EXPL-03 | No explanation panel is shown when learning content is unavailable for that verb/answer (missing `learning` block, missing verb entry, or no `formIndex` match) | Verified `selectExplanation` never throws (Phase 15, re-confirmed by direct source read) and already handles all fail-closed cases; verified UI-SPEC.md's exact conditional-mount JSX (no reserved space) satisfies this literally; confirmed existing `__tests__/learning-explain.test.ts` already covers the pure-function side of this requirement |
| EXPL-04 | Explanation rendering never changes `correctAnswer`, scoring, or the `POST /feedback` payload's `selectedAnswer`; the panel never blocks advancing | Confirmed `ExplanationPanel` is purely presentational (props: `{ text: string }`, no side effects); confirmed this phase's fix touches only `useQuizStore.ts` (new state fields, additive) and `app/quiz.tsx` (data source + new render branch) — no changes required or recommended to `src/quiz/scoring.ts` or `src/feedback/*`, which remain untouched (verified no scoring/feedback file is referenced by the required fix) |

</phase_requirements>

## Summary

This phase has no new-library research surface at all — it is a pure wiring
fix inside an already-fully-specified codebase. The UI-SPEC.md (already
approved) fully specifies the new `ExplanationPanel` component's props,
styles, placement, and mount condition, so the planner's job is almost
entirely mechanical: (1) extend `useQuizStore`'s state and `startQuiz` to
carry `learning` from `resolveVerbs()`, (2) fix `app/quiz.tsx`'s
`currentVerb` lookup to read from the session's resolved verb list instead
of the bundled `src/dataset/verbs.ts` import, (3) call `selectExplanation`
with the corrected inputs and render the new component conditionally.

Both wiring gaps flagged in CONTEXT.md/UI-SPEC.md are confirmed present in
the current source, verified by direct reads (not assumed): `useQuizStore.ts`
line 47 destructures only `{ verbs }` from `resolveVerbs()`, discarding
`learning`; `app/quiz.tsx` line 8 imports the bundled local `verbs` array and
line 61 does `verbs.find(...)` against it — never the store's resolved list.
Neither gap requires new state-management patterns; both extend existing,
already-established idioms (the store's existing `session`/`filters` fields;
`OfflinePill.tsx`'s existing `resolveVerbs()`-consuming component shape).

One precise API detail the planner must get right: `selectExplanation`'s
third parameter is typed `{ tense: Tense; subject: Subject }`, not a
`correctAnswer: string`. Since `Question extends Triple` already has
`tense`/`subject` fields, the correct call is
`selectExplanation(currentVerb, lockedChoice, question, learning)` — passing
`question` itself (structurally satisfies `{tense, subject}`), not
`question.correctAnswer` (which is a `string`, wrong type entirely).

**Primary recommendation:** Add a `learning: LearningContent | undefined`
field to `useQuizStore`'s state (set alongside `session` in `startQuiz`),
change `app/quiz.tsx`'s `currentVerb` lookup to `session.questions`-adjacent
resolved-verb data (see Architecture Patterns below for the exact mechanism),
build `src/components/ExplanationPanel.tsx` exactly per UI-SPEC.md's
Component Contract, and wire it into `quiz.tsx` per the exact JSX/mount
condition UI-SPEC.md already specifies.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Explanation string selection | Domain logic (`src/learning/`) | — | Already built/tested in Phase 15; pure function, no UI |
| `learning` block availability to screens | State (`src/store/useQuizStore.ts`) | Domain logic (`src/dataset/source.ts`) | `resolveVerbs()` already returns `learning`; store must forward it, same tier that already forwards `session`/`filters` |
| `currentVerb` (formIndex-bearing) resolution | State/Screen boundary (`app/quiz.tsx`) | Store (`useQuizStore.ts`) | Must resolve from the session's snapshot verb list, not a fresh bundled import — this is the second wiring gap |
| Explanation panel rendering | Screen (`app/quiz.tsx`) + new component (`src/components/ExplanationPanel.tsx`) | — | Presentational; screen owns calling `selectExplanation`, component just renders the resulting string (per UI-SPEC.md Component Contract) |
| Panel visual styling | Screen/Component (`src/theme/tokens.ts` consumers) | — | Design tokens only, no new design system work |

## Standard Stack

No new packages. This phase adds zero dependencies — it is Zustand store
state + a new RN function component using existing `src/theme/tokens.ts`
exports, matching every other component in this codebase.

### Package Legitimacy Audit

Not applicable — no packages installed in this phase.

## Confirmed Wiring Gaps (verified against current source, not assumed)

### Gap 1 — `useQuizStore` discards `learning`

`src/store/useQuizStore.ts` (current, read directly):
```ts
startQuiz: async (options: GenerateOptions) => {
  const token = ++startToken;
  try {
    const { verbs } = await resolveVerbs();   // <-- `learning` discarded here
    if (token !== startToken) return;
    const session = generate(options, undefined, verbs);
    set({
      status: "in-progress",
      filters: options,
      session,
      currentIndex: 0,
      answers: [],
      lockedChoice: null,
      errorMessage: null,
      // no `learning` in this set() call — nothing to read from screens
    });
  } catch (error) { ... }
}
```
`resolveVerbs()`'s actual return shape (from `src/dataset/source.ts`, already
extended in Phase 15) is `{ verbs: Verb[]; source: VerbSource; learning:
LearningContent | undefined }`. The store must destructure `learning` too
and persist it in state.

**Precise fix:**
1. Add `learning: LearningContent | undefined;` to `QuizStoreState` interface
   and to `initialState` (as `undefined`).
2. Destructure `const { verbs, learning } = await resolveVerbs();` in
   `startQuiz`.
3. Add `learning` to both `set({...})` calls in `startQuiz`'s success path
   (the error path doesn't need it — no session exists there, so the panel
   never renders in that branch anyway; but for consistency/correctness,
   also explicitly reset `learning: undefined` in the error-path `set()` and
   in `reset()`'s `initialState` spread — `reset()` already spreads
   `initialState`, so adding the field there is automatic once
   `initialState` includes it).
4. Import `LearningContent` type from `../learning/types` in
   `useQuizStore.ts` (mirrors how `src/dataset/source.ts` already imports it).

**Test impact:** `__tests__/useQuizStore.test.ts` already mocks
`resolveVerbs` to resolve `{ verbs, source, learning: undefined }` in every
existing test case (confirmed by direct grep — every `mockResolvedValue`
call already includes a `learning` key, because `resolveVerbs`'s type
signature already requires it post-Phase-15). **No existing test assertion
will break** from adding `learning` to the store's state, because none of
the existing tests use a full-object `toEqual`/`toMatchObject` against the
entire state that would need updating for a new field — they check
individual fields (`state.status`, `state.session`, etc.). The two
"full reset" tests (`"reset returns all state..."` and the FETCH/END-quiz-
early full-state-equality guard test) assert specific named fields
individually, not `toEqual(initialState)` as a whole object, so adding
`learning` requires no test file changes to keep passing — though the
planner should still add one new assertion (`expect(state.learning).toBe(...)`)
to keep coverage meaningful for the new field, consistent with TEST-05's
spirit (even though TEST-05 itself is Phase 15's requirement, not this
phase's).

### Gap 2 — `currentVerb` reads from the wrong dataset

`app/quiz.tsx` (current, read directly):
```ts
import { verbs } from "../src/dataset/verbs";   // <-- bundled LOCAL dataset, always
...
const currentVerb = verbs.find((v) => v.verb === question.verb);
```
This is the **bundled fallback array**, imported directly — it is used
regardless of whether the quiz session actually resolved from remote or
local. Since only the *remote* dataset carries `formIndex` (per Phase 15,
D-05: "the bundled local fallback dataset never carries
`learning`/`formIndex`"), this lookup can never produce a `Verb` with
`formIndex`, even when the session's actual snapshot came from a successful
remote fetch. Confirmed: `src/dataset/verbs.ts`'s data has no `formIndex`
field authored anywhere (it's `Verb.formIndex?`, optional, and the bundled
literal objects never set it).

**Precise fix:** The session's resolved verb list is NOT currently stored
anywhere accessible to `quiz.tsx` — `useQuizStore`'s `session` field only
holds `QuizSession { questions: Question[] }` (verb/tense/subject/choices/
correctAnswer strings), not the resolved `Verb[]` array itself. The planner
has two viable options; pick the first (matches the existing state-shape
convention more closely and avoids a second network-independent lookup):

**Option A (recommended):** Add `verbs: Verb[]` to `QuizStoreState`
alongside the new `learning` field, set from the same `resolveVerbs()` call
in `startQuiz` (`const { verbs, learning } = await resolveVerbs();` — reuse
the already-destructured `verbs`, just also persist it to state instead of
only passing it to `generate()`). Then in `quiz.tsx`, replace the bundled
`import { verbs } from "../src/dataset/verbs"` usage with
`const verbs = useQuizStore((s) => s.verbs);` and keep
`verbs.find((v) => v.verb === question.verb)` unchanged (same lookup logic,
now against the correct snapshot).

**Option B (alternative, more invasive):** Change `session` to embed the
resolved `Verb` per question at generation time (e.g.
`Question` gains an optional `verbData?: Verb` field set inside
`generate()`). Rejected as the recommended path because it changes
`src/quiz/types.ts`/`src/quiz/engine.ts`'s existing tested shape
(`quiz-engine.test.ts`) for no benefit — Option A achieves the same result
by exposing one already-resolved array from the store, a strictly additive
change.

Either option must ensure `verbs` in store state is reset to its initial
value (e.g. `[]`) on `reset()` — `initialState` should include
`verbs: [] as Verb[]`.

**Test impact:** No existing `useQuizStore.test.ts` test asserts
`state.verbs` today (confirmed by grep — no `state.verbs` reference
anywhere in the current test file), so adding this field is purely
additive; existing assertions remain valid. `app/quiz.tsx` has zero
component-level tests today (confirmed: no `quiz.test.ts`/`.tsx` file in
`__tests__/`, consistent with this project's stated convention of no
`@testing-library/react-native` and no rendered-component tests) — so this
fix requires no test file updates, only new coverage if the planner chooses
to add any (optional, since UI-SPEC.md's `testID="explanation-panel"` is
the only test hook specified, intended for a future/manual verification
path, not a required new automated test in this phase).

## Architecture Patterns

### Recommended Data Flow (after this phase's fix)

```
resolveVerbs() [src/dataset/source.ts]
  returns { verbs: Verb[], source, learning: LearningContent | undefined }
        │
        ▼
useQuizStore.startQuiz(options)
  destructures { verbs, learning } from resolveVerbs()
  persists BOTH to store state: { session, verbs, learning, ... }
        │
        ▼
app/quiz.tsx (Quiz screen)
  reads verbs + learning via useQuizStore((s) => s.verbs / s.learning)
  currentVerb = verbs.find((v) => v.verb === question.verb)   // now formIndex-bearing
        │
        ▼ (only when lockedChoice !== null && lockedChoice !== question.correctAnswer)
  explanation = selectExplanation(currentVerb, lockedChoice, question, learning)
        │  (question satisfies {tense, subject} structurally — Question extends Triple)
        ▼
  {explanation && <ExplanationPanel text={explanation} />}
        placed between styles.choices View and the Next Pressable
```

### Pattern: Store-forwarded snapshot, not a fresh lookup

**What:** Extend the existing "snapshot at quiz-start" pattern
(`src/dataset/source.ts`'s cached `resolveVerbs()` promise, already
established since Phase 8 / extended in Phase 15 for `learning`) one level
further into the store, so screens never re-import the bundled dataset
directly for anything session-specific.
**When to use:** Any time a screen needs data that varies by which dataset
source (`remote`/`local`) actually resolved for the current session —
never import `src/dataset/verbs.ts` directly in a screen for this purpose;
always go through the store's snapshotted state.
**Example:**
```ts
// src/store/useQuizStore.ts — inside startQuiz's try block
const { verbs, learning } = await resolveVerbs();
if (token !== startToken) return;
const session = generate(options, undefined, verbs);
set({
  status: "in-progress",
  filters: options,
  session,
  verbs,       // NEW — full resolved Verb[] for this session
  learning,    // NEW — LearningContent snapshot for this session
  currentIndex: 0,
  answers: [],
  lockedChoice: null,
  errorMessage: null,
});
```

### Anti-Patterns to Avoid
- **Re-importing `src/dataset/verbs.ts` in `quiz.tsx` for any live-session
  purpose:** it is the bundled offline fallback, not the resolved session
  dataset — only ever correct to reference directly when explicitly
  building the local-only fallback path (e.g. inside `src/dataset/source.ts`
  itself), never from a screen.
- **Calling `selectExplanation` with `question.correctAnswer` as the third
  argument:** wrong type (`string` vs. the required `{tense, subject}`
  object) — pass `question` itself, since `Question extends Triple` already
  has the required `tense`/`subject` shape.
- **Reserved/hidden-space rendering for the panel** (the `opacity: 0` +
  `pointerEvents: "none"` pattern already used for `nextButton`/
  `reportButton` in this same file): explicitly rejected by D-02/UI-SPEC.md
  — the panel must not exist in the tree at all when `selectExplanation`
  returns `undefined`.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Explanation string selection/templating | A new explanation-resolution function in `quiz.tsx` | `selectExplanation` from `src/learning/explain.ts` (already built, tested, imports `tenseLabels`/`subjectLabels` internally) | Phase 15 already solved this exact problem — never throws, already handles all fail-closed cases (D-01 tied-form ambiguity, D-04 missing content) |
| Panel card styling | New ad-hoc colors/spacing | `src/theme/tokens.ts` (`colors.surface`, `colors.textSecondary`, `spacing.md`/`lg`, `radius.control`, `typography.body`) — exact values specified in UI-SPEC.md's Style Block | Matches every other component in the codebase; UI-SPEC.md is an already-approved binding contract, not just a suggestion |

**Key insight:** This phase is 100% consumption of already-built lower
layers (Phase 15's pure function, the design tokens module, the existing
store pattern) — there is no new "hard problem" to solve, only correct
wiring of existing pieces.

## Common Pitfalls

### Pitfall 1: Wrong argument type passed to `selectExplanation`
**What goes wrong:** Passing `question.correctAnswer` (a `string`, e.g.
`"bebo"`) as the third argument instead of an object with `tense`/`subject`.
**Why it happens:** The function's own name/positional convention
("selectedAnswer, correctAnswer") reads naturally as "two answer strings,"
but the actual second param is `selectedAnswer: string` and the third is
`correctAnswer: { tense: Tense; subject: Subject }` — an asymmetric,
easy-to-misread signature.
**How to avoid:** Pass `question` directly as the third argument (it
structurally satisfies `{tense, subject}` via `Triple`) — do not construct
a new object or reference `question.correctAnswer`.
**Warning signs:** TypeScript will actually catch this at compile time
(`question.correctAnswer` is `string`, not assignable to `{tense, subject}`)
— but a widened `any`/implicit-any slip during a fast edit could hide it;
`tsc --noEmit` must pass before this phase is considered done.

### Pitfall 2: Forgetting to reset new store fields in `reset()`/error path
**What goes wrong:** Adding `learning`/`verbs` to `startQuiz`'s success
`set()` call but not to `initialState` (used by both `reset()` and the
module's initial spread) or to the `error` branch's `set()` call — leaving
stale `learning`/`verbs` from a previous session visible after `reset()` or
an insufficient-verbs error.
**Why it happens:** `initialState` is a plain object spread at module load
and reused by `reset()` — easy to add a field to the interface and the
success-path `set()` call while forgetting the shared `initialState`
object that both `reset()` and the error path implicitly rely on.
**How to avoid:** Add `learning: undefined` and `verbs: [] as Verb[]` to
`initialState` (not just the interface) so every code path that spreads
`initialState` (module init, `reset()`) picks them up automatically; only
`startQuiz`'s success-path `set()` needs an explicit override.
**Warning signs:** A stale `formIndex`-bearing verb list persisting across
a "Try Again"/"Back to Setup" reset in manual testing.

### Pitfall 3: Computing `explanation` even when no answer is locked, or when the answer was correct
**What goes wrong:** Calling `selectExplanation` unconditionally on every
render (regardless of `lockedChoice` state) is harmless performance-wise
(function is cheap, D-04 already degrades to `undefined` safely) but
violates EXPL-02's literal requirement ("after an incorrect answer") if the
mount condition isn't also gated correctly — e.g. showing the panel when
the learner picked the *correct* answer.
**Why it happens:** The natural first draft might gate only on
`lockedChoice !== null`, forgetting the `!== question.correctAnswer` check
that UI-SPEC.md's exact JSX snippet already includes.
**How to avoid:** Use UI-SPEC.md's exact mount condition verbatim:
`lockedChoice !== null && lockedChoice !== question.correctAnswer && explanation`.
**Warning signs:** Panel appearing after a correct answer in manual QA.

## Code Examples

### `selectExplanation` call site (exact signature, verified from source)
```typescript
// Source: src/learning/explain.ts (already built, Phase 15)
export function selectExplanation(
  verb: Verb,
  selectedAnswer: string,
  correctAnswer: { tense: Tense; subject: Subject },
  learning: LearningContent | undefined,
): string | undefined
```
```tsx
// app/quiz.tsx — inside the component, after currentVerb is resolved
// from the store-forwarded `verbs` (Gap 2 fix), not the bundled import
const learning = useQuizStore((s) => s.learning);
const explanation =
  lockedChoice !== null && lockedChoice !== question.correctAnswer
    ? currentVerb
      ? selectExplanation(currentVerb, lockedChoice, question, learning)
      : undefined
    : undefined;
```

### `ExplanationPanel` component (verbatim from UI-SPEC.md's approved Component Contract)
```tsx
// Source: .planning/phases/16-explanation-panel-ui/16-UI-SPEC.md
import { StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing, typography } from "../theme/tokens";

interface ExplanationPanelProps {
  text: string;
}

export function ExplanationPanel({ text }: ExplanationPanelProps) {
  return (
    <View style={styles.container} testID="explanation-panel">
      <Text style={styles.text}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: radius.control,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  text: {
    ...typography.body,
    color: colors.textSecondary,
  },
});
```

## State of the Art

Not applicable — no external ecosystem/library evolution is relevant to
this phase; it is entirely internal wiring against already-decided,
already-built code from the same milestone (Phase 15).

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Option A (store exposes full resolved `Verb[]`) is the lowest-risk fix for Gap 2, preferred over embedding verb data into `Question`/`generate()` | Architecture Patterns / Gap 2 fix | Low — this is an architectural judgment call, not a verified fact; if the planner/executor finds Option A awkward in practice (e.g. state bloat concerns), Option B remains a valid fallback with slightly more test-file churn (`quiz-engine.test.ts` would need updating) |

**All other claims in this research were verified directly against current
source files** (`src/store/useQuizStore.ts`, `app/quiz.tsx`,
`src/dataset/source.ts`, `src/dataset/types.ts`, `src/learning/explain.ts`,
`src/learning/types.ts`, `__tests__/useQuizStore.test.ts`) or copied
verbatim from the already-approved `16-UI-SPEC.md` — no user confirmation
needed beyond the one architectural judgment call (A1) above.

## Open Questions (RESOLVED)

None blocking. The one discretionary item (A1, Option A vs. B for Gap 2) is
explicitly flagged as the planner/executor's implementation choice per
CONTEXT.md's "Claude's Discretion" — both options satisfy EXPL-02/03/04
equally; Option A is recommended for lower blast radius on existing tests.

## Environment Availability

Skipped — this phase has no external tool/service/runtime dependencies
beyond the already-installed Expo/RN/Zustand/Zod stack already present and
verified working in prior phases (14, 15) of this same milestone.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest via `jest-expo` ~57.0.1 preset |
| Config file | `package.json`'s `"jest": { "preset": "jest-expo" }` |
| Quick run command | `npx jest __tests__/useQuizStore.test.ts` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| EXPL-02 | `useQuizStore` exposes `learning` and a formIndex-bearing `verbs` snapshot to screens | unit | `npx jest __tests__/useQuizStore.test.ts` | ✅ exists, needs new assertions added |
| EXPL-03 | No explanation panel when `selectExplanation` returns `undefined` (missing learning/verb/formIndex match) | unit (already covered) | `npx jest __tests__/learning-explain.test.ts` | ✅ (Phase 15 coverage — this phase does not need new pure-function tests, only the UI mount-condition logic, which per this project's convention has no component-render test coverage) |
| EXPL-04 | Panel never mutates `correctAnswer`/scoring/feedback payload | unit (already covered, indirectly) | `npx jest __tests__/quiz-scoring.test.ts __tests__/feedback-*.test.ts` | ✅ existing tests already lock this invariant; this phase must not touch `scoring.ts`/`feedback/*` at all — the safest verification is "diff shows no changes to these files" |

### Sampling Rate
- **Per task commit:** `npx jest __tests__/useQuizStore.test.ts` (fast, covers the store extension directly)
- **Per wave merge:** `npm test` (full suite — confirms no regression in `quiz-engine`/`quiz-scoring`/`feedback`/`learning-*` tests)
- **Phase gate:** Full suite green, plus `npm run typecheck` (catches the Pitfall 1 argument-type mismatch at compile time) before `/gsd:verify-work`

### Wave 0 Gaps
None — existing test infrastructure (`__tests__/useQuizStore.test.ts`,
`__tests__/learning-explain.test.ts`, `__tests__/learning-schema.test.ts`)
already covers everything below the UI layer. This project has no
component-render test convention (`@testing-library/react-native` is
explicitly absent per `CONVENTIONS.md`/`STACK.md`), so no new test file is
required for `ExplanationPanel.tsx`'s render output itself — `testID`
presence is a manual/future e2e hook only, per UI-SPEC.md's own framing.

## Security Domain

Not applicable — this phase touches no auth, session, input-validation, or
cryptography surface. It renders a backend-authored, already Zod-validated
string (`learning` content is validated in Phase 15's `learning-schema.ts`
before ever reaching this phase); no new user input is accepted or
persisted.

## Sources

### Primary (HIGH confidence — direct source reads in this session)
- `src/store/useQuizStore.ts` — confirmed current `startQuiz` discards `learning`
- `app/quiz.tsx` — confirmed `currentVerb` reads from bundled `src/dataset/verbs.ts`
- `src/dataset/source.ts` — confirmed `resolveVerbs()` already returns `{ verbs, source, learning }`
- `src/dataset/types.ts` — confirmed `Verb.formIndex?: Record<string, FormMatch[]>`
- `src/learning/explain.ts` — confirmed exact `selectExplanation` signature and behavior (never throws)
- `src/learning/types.ts` — confirmed `LearningContent`/`FormMatch`/`MismatchCategory` shapes
- `src/quiz/types.ts` — confirmed `Question extends Triple` (has `tense`/`subject`) plus `choices`/`correctAnswer: string`
- `src/theme/tokens.ts` — confirmed exact token values used in UI-SPEC.md
- `src/components/OfflinePill.tsx` — confirmed the precedent component shape to follow
- `__tests__/useQuizStore.test.ts` — confirmed no existing assertion breaks from adding `learning`/`verbs` fields
- `.planning/phases/16-explanation-panel-ui/16-UI-SPEC.md` — approved binding visual/interaction contract, treated as authoritative
- `.planning/phases/15-learning-content-explanation-engine/15-CONTEXT.md` — binding upstream decisions (D-01..D-05)
- `.planning/REQUIREMENTS.md` — EXPL-02/03/04 exact wording
- `.planning/STATE.md` — milestone/phase status

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new packages, nothing to verify externally
- Architecture: HIGH — both wiring gaps confirmed by direct source reads, fix pattern extends an already-established convention (store-forwarded snapshot)
- Pitfalls: HIGH — all three derived from precise type/behavior mismatches found in the actual source, not speculative

**Research date:** 2026-07-20
**Valid until:** Effectively no expiry — this research is tied to the current state of this specific codebase, not an external ecosystem; re-verify only if `src/store/useQuizStore.ts`, `app/quiz.tsx`, or `src/learning/explain.ts` change again before this phase is planned/executed.
