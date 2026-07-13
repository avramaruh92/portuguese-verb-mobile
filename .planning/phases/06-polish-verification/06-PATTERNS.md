# Phase 6: Polish & Verification - Pattern Map

**Mapped:** 2026-07-13
**Files analyzed:** 5 (all existing, conditionally modified — no new files expected)
**Analogs found:** 5 / 5 (self-analogs — every candidate file is its own best pattern reference, since this phase makes surgical edits, not new modules)

## Context

Phase 6 is a verification-only phase (see `06-CONTEXT.md` D-03/D-04): no new
files, no new modules. The only code changes possible are **inline
corrections** to existing files if the dataset cross-check or on-device
testing reveals a genuine bug. There is nothing to "scaffold" — the
pattern to follow for any edit is simply **the surrounding code already in
the file being touched**. This document exists so the planner/implementer
has the exact shape of each candidate file in hand before making any fix,
rather than treating this as new-pattern discovery.

## File Classification

| Candidate File | Role | Data Flow | Trigger for Edit | Match Quality |
|-----------------|------|-----------|-------------------|----------------|
| `src/dataset/verbs.ts` | model (static data) | CRUD (read-only lookup table) | D-01 dataset cross-check finds a wrong conjugation cell | self (edit existing entries in place) |
| `src/quiz/engine.ts` | service | transform (pure functions: sample/build/pick) | D-03 edge case #1 reveals `sampleTriples`/`InsufficientVerbsError` doesn't behave as expected | self |
| `src/store/useQuizStore.ts` | store | event-driven (Zustand actions) | D-03 edge case #1 or #3 reveals filter-snapshot or error-state bug | self |
| `app/results.tsx` | component/route | request-response (share sheet) | D-03 edge case #2 reveals share-cancel isn't silently swallowed | self |
| `app/index.tsx` | component/route | request-response (form → store action) | D-03 edge case #3 reveals toggle bleeds into in-progress session | self |

No genuinely new files are anticipated. If D-04 uncovers something requiring
a new file (unlikely per CONTEXT.md discretion notes), fall back to the
nearest sibling in the same directory (e.g. a new `src/dataset/*.ts` helper
would follow `src/dataset/validate.ts`'s shape).

## Pattern Assignments

### `src/dataset/verbs.ts` (model, CRUD/read-only)

**Analog:** itself — every verb entry is a self-consistent template; a
correction is a single-cell edit inside one verb's `conjugations` object.

**Shape to preserve** (`src/dataset/verbs.ts` lines 3-42, `falar` entry):
```typescript
export const verbs: Verb[] = [
  {
    verb: "falar",
    translation: "to speak",
    isIrregular: false,
    conjugations: {
      present_indicative: {
        eu: "falo",
        tu: "falas",
        ele_ela: "fala",
        nos: "falamos",
        voces: "falam",
        eles_elas: "falam",
      },
      preterite: { /* eu/tu/ele_ela/nos/voces/eles_elas, in that key order */ },
      imperfect: { /* same */ },
      future: { /* same */ },
    },
  },
  // ...49 more entries, same shape
];
```

**Rule for any conjugation fix:** edit only the specific `tense.subject`
string value found wrong; do not reorder keys, do not touch
`verb`/`translation`/`isIrregular` unless the discrepancy is specifically
about irregularity classification (which Phase 2 D-01/D-02/D-05 already
locked — this phase does not second-guess irregularity classification,
only conjugation string accuracy, per `06-CONTEXT.md` canonical refs).

**Verification path:** `src/dataset/types.ts` defines the exact key sets
(`TENSES`, `SUBJECTS`) any conjugation table must match; `src/dataset/validate.ts`
+ `__tests__/dataset.test.ts` (lines 5-18) already assert shape/completeness —
any fix must keep `validateDataset(verbs).errors` empty and
`verbs.length === 50` (test lines 20-22).

---

### `src/quiz/engine.ts` (service, transform)

**Analog:** itself — pure-function module, no I/O.

**Core error-throw pattern** (lines 26-35):
```typescript
export function sampleTriples(
  pool: readonly Triple[],
  count: number,
  random: () => number,
): Triple[] {
  if (pool.length < count) {
    throw new InsufficientVerbsError(pool.length, count);
  }
  return shuffle(pool, random).slice(0, count);
}
```
This is the exact code path D-03 edge case #1 exercises. If a fix is
needed here, keep the guard-clause-throws-typed-error style consistent
with `buildQuestion`'s guard at lines 42-45 (`throw new Error(...)` for the
truly-unexpected "verb not found" case vs the domain-specific
`InsufficientVerbsError` for the expected "not enough verbs" case).

---

### `src/store/useQuizStore.ts` (store, event-driven)

**Analog:** itself — single Zustand store, action functions calling `set`/`get`.

**Error-to-UI-state translation pattern** (lines 38-61):
```typescript
startQuiz: (options: GenerateOptions) => {
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
  } catch (error) {
    if (error instanceof InsufficientVerbsError) {
      set({
        status: "error",
        errorMessage: INSUFFICIENT_VERBS_MESSAGE,
        session: null,
      });
      return;
    }
    throw error;
  }
},
```
**Key invariant D-03 edge case #3 verifies (do not change without cause):**
`filters` is only written inside `startQuiz`, so it's a snapshot at
session-start time — the Setup screen's local `includeIrregular` state
(`app/index.tsx` line 16) is disconnected from any in-progress session's
`filters` until the next `startQuiz()` call. Any fix touching this file
must preserve that snapshot boundary, not add a live subscription from
Setup's toggle into the running session.

---

### `app/results.tsx` (component/route, request-response via native Share)

**Analog:** itself.

**Silent-swallow share-cancel pattern** (lines 18-24):
```typescript
async function handleShare() {
  try {
    await Share.share({ message: buildShareMessage(correct, total) });
  } catch {
    // Silently swallow share errors — screen stays interactive.
  }
}
```
This is exactly the code path D-03 edge case #2 confirms on-device. If a
fix is needed (e.g., screen becomes non-interactive after cancel), the fix
should stay inside this try/catch — do not add error-state UI here, since
CONTEXT.md explicitly scopes cancel/dismiss as "no error surfaces."

---

### `app/index.tsx` (component/route, request-response form → store action)

**Analog:** itself.

**Toggle → local state → startQuiz snapshot pattern** (lines 15-16, 31-38):
```typescript
const [selectedTenses, setSelectedTenses] = useState<Tense[]>([]);
const [includeIrregular, setIncludeIrregular] = useState(false);
// ...
function handleStartQuiz() {
  if (!canStart) return;
  startQuiz({ tenses: selectedTenses, includeIrregular });
  const nextStatus = useQuizStore.getState().status;
  if (nextStatus === "in-progress") {
    router.replace("/quiz");
  }
}
```
`includeIrregular` is plain component `useState`, read only at
`handleStartQuiz` call time — it has no reach into an already-running
session's store `filters`. This is the behavior D-03 edge case #3
confirms; any fix must not introduce a shared/global toggle that could
retroactively mutate `useQuizStore.filters` mid-session.

**Error display pattern** (lines 77-79):
```typescript
{status === "error" && errorMessage ? (
  <Text style={styles.errorText}>{errorMessage}</Text>
) : null}
```
This renders the `INSUFFICIENT_VERBS_MESSAGE` set by
`useQuizStore.startQuiz`'s catch block — the friendly message D-03 edge
case #1 confirms shows without a crash.

---

## Shared Patterns

### Error handling: typed domain errors caught at the store boundary
**Source:** `src/quiz/types.ts` (`InsufficientVerbsError`) + `src/store/useQuizStore.ts` lines 50-60
**Apply to:** any fix touching quiz generation or store actions — throw a
typed error from the pure `src/quiz/*` logic layer, catch and translate to
`status`/`errorMessage` only in the Zustand store, never inside a route
component.

### Route components stay presentation-only
**Source:** `app/index.tsx`, `app/quiz.tsx`, `app/results.tsx`
**Apply to:** any UI-layer fix — routes read store state via
`useQuizStore((s) => s.x)` selectors and call store actions; they contain
no business logic of their own (scoring lives in `src/quiz/scoring.ts`,
sampling in `src/quiz/engine.ts`, sharing text in `src/quiz/share.ts`).

### iOS design tokens (colors/spacing) already established
**Source:** `app/index.tsx`, `app/quiz.tsx`, `app/results.tsx` `StyleSheet.create` blocks
**Apply to:** any style tweak — `#007AFF` (primary blue), `#F2F2F7`
(neutral surface), `#FF3B30` (error/wrong red), `#34C759` (correct green),
`#8E8E93` (secondary text), `44` minHeight for tappable targets, `12`
borderRadius. Reuse these literals rather than introducing new ones.

## No Analog Found

None — every candidate file for this phase already exists and is its own
pattern source. This phase does not introduce new roles or data flows.

## Metadata

**Analog search scope:** `src/dataset/`, `src/quiz/`, `src/store/`, `app/`, `__tests__/`
**Files scanned:** `src/dataset/verbs.ts`, `src/dataset/types.ts`, `src/quiz/engine.ts`, `src/store/useQuizStore.ts`, `app/results.tsx`, `app/index.tsx`, `app/quiz.tsx`, `__tests__/dataset.test.ts`
**Pattern extraction date:** 2026-07-13
