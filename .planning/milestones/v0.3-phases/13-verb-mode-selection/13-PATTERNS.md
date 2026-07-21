# Phase 13: Verb Mode Selection - Pattern Map

**Mapped:** 2026-07-20
**Files analyzed:** 6 (all modified, none new)
**Analogs found:** 6 / 6 (all self-contained modifications with an intra-file or sibling-file analog)

This phase touches zero new files — every file listed is an in-place modification
of an existing module. Because of that, "analog" here means "the existing pattern
already present in that file or its immediate sibling" that the new code must match,
not a distant unrelated file.

## File Classification

| Modified File | Role | Data Flow | Closest Analog | Match Quality |
|----------------|------|-----------|-----------------|---------------|
| `src/quiz/types.ts` | model (type definitions) | transform (pure types, no I/O) | itself — existing `GenerateOptions`/union-literal conventions in same file | exact |
| `src/quiz/engine.ts` | service (pure quiz-generation logic) | transform (filter/CRUD-like pool building) | itself — existing `.filter()` eligibility line in `generate()` | exact |
| `app/index.tsx` | screen/component (Expo Router route) | request-response (local UI state → store call) | itself — existing tense chip row (`chipRow`/`chip`/`chipSelected`/`chipText`/`chipTextSelected`, `sectionLabel`) in the same file | exact |
| `src/store/useQuizStore.ts` | store (Zustand) | event-driven (state transitions) | itself — existing `INSUFFICIENT_VERBS_MESSAGE` constant | exact |
| `__tests__/quiz-engine.test.ts` | test | transform | itself — existing `includeIrregular` fixtures/test cases | exact |
| `__tests__/useQuizStore.test.ts` | test | transform | itself — existing `VALID_OPTIONS`/`ALL_TENSES_OPTIONS` fixtures + insufficient-verbs test | exact |

## Pattern Assignments

### `src/quiz/types.ts` (model)

**Analog:** same file, existing `GenerateOptions` interface and `Tense`/`Subject` snake_case union-literal convention (`src/dataset/types.ts`)

**Current shape to replace** (lines 18-21):
```typescript
export interface GenerateOptions {
  tenses: Tense[];
  includeIrregular: boolean;
}
```

**Pattern to follow — new `VerbMode` union type, defined alongside `GenerateOptions`, D-07/D-08:**
```typescript
export type VerbMode = "regular_only" | "mixed" | "irregular_only";

export interface GenerateOptions {
  tenses: Tense[];
  verbMode: VerbMode;
}
```
Match the existing snake_case string-literal-union convention used for `Tense`/`Subject`
in `src/dataset/types.ts` (e.g. `present_indicative`, `ele_ela`) — do not use camelCase
or PascalCase literals for `VerbMode`'s values.

`InsufficientVerbsError` (lines 23-33) is unchanged — no modification needed there, it's
only referenced from `useQuizStore.ts` and `engine.ts` as-is.

---

### `src/quiz/engine.ts` (service, transform)

**Analog:** same file, existing eligibility-filter line inside `generate()`

**Current line to replace** (line 16):
```typescript
const eligibleVerbs = verbs.filter((v) => options.includeIrregular || !v.isIrregular);
```

**Pattern to follow — 3-way filter on `options.verbMode`:**
```typescript
const eligibleVerbs = verbs.filter((v) => {
  if (options.verbMode === "regular_only") return !v.isIrregular;
  if (options.verbMode === "irregular_only") return v.isIrregular;
  return true; // "mixed"
});
```
Everything downstream of this line (`pool`, `sampleTriples`, `buildQuestion`) is untouched —
`InsufficientVerbsError` is already thrown by `sampleTriples` (line 33) when the pool from
this filter is too small, so `irregular_only`'s smaller pool naturally reuses the existing
error path with no new wiring (per CONTEXT.md's established-patterns note).

---

### `app/index.tsx` (screen, request-response)

**Analog:** same file, existing tense chip row (lines 63-89) and its supporting styles

**Imports pattern** (lines 1-10) — no new imports needed beyond what's already present
(`useState`, `Pressable`, `StyleSheet`, `Text`, `View` — note `Switch` import on line 2
should be removed once the toggle is gone, if nothing else in the file still uses it):
```typescript
import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Switch, Text, View } from "react-native";
```

**Multi-select tense-chip pattern to copy structurally, but adapted to single-select** (lines 63-89):
```tsx
<View style={styles.section}>
  <Text style={styles.sectionLabel}>Select tenses</Text>
  <View style={styles.chipRow}>
    {TENSES.map((tense) => {
      const selected = selectedTenses.includes(tense);
      return (
        <Pressable
          key={tense}
          onPress={() => toggleTense(tense)}
          style={[styles.chip, selected && styles.chipSelected]}
        >
          <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
            {tenseLabels[tense]}
          </Text>
        </Pressable>
      );
    })}
    ...
  </View>
</View>
```

**Pattern to follow for the new verb-mode chip row** (D-01 through D-06) — replace the
`Switch` block at lines 91-94 (`toggleRow`/`toggleLabel` styles become unused and can be
removed) with a single-select chip row, reusing `chip`/`chipSelected`/`chipText`/
`chipTextSelected`/`sectionLabel`/`chipRow` styles verbatim:
```tsx
const VERB_MODE_OPTIONS: { value: VerbMode; label: string }[] = [
  { value: "regular_only", label: "Regular only" },
  { value: "mixed", label: "Mixed" },
  { value: "irregular_only", label: "Irregular only" },
];

// local state
const [verbMode, setVerbMode] = useState<VerbMode>("regular_only");

// render, in place of the old toggleRow block:
<View style={styles.section}>
  <Text style={styles.sectionLabel}>Verb mode</Text>
  <View style={styles.chipRow}>
    {VERB_MODE_OPTIONS.map((opt) => {
      const selected = verbMode === opt.value;
      return (
        <Pressable
          key={opt.value}
          onPress={() => setVerbMode(opt.value)}
          style={[styles.chip, selected && styles.chipSelected]}
        >
          <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
            {opt.label}
          </Text>
        </Pressable>
      );
    })}
  </View>
</View>
```
Note the difference from the tense row: no `toggleTense`-style add/remove-from-array
handler and no "All tenses"-equivalent extra chip — `onPress={() => setVerbMode(opt.value)}`
directly sets the single value (D-02).

**`startQuiz` call-site update** (line 42):
```typescript
await startQuiz({ tenses: selectedTenses, includeIrregular });
```
becomes:
```typescript
await startQuiz({ tenses: selectedTenses, verbMode });
```

**Import addition needed:**
```typescript
import type { Tense, VerbMode } from "../src/quiz/types";
```
(or split across the existing `../src/dataset/types` and a new `../src/quiz/types` import,
matching the existing per-domain `types.ts` import convention — `VerbMode` lives in
`src/quiz/types.ts` per D-08, not `src/dataset/types.ts`).

---

### `src/store/useQuizStore.ts` (store, event-driven)

**Analog:** same file, existing `INSUFFICIENT_VERBS_MESSAGE` constant (lines 9-10)

**Current text to replace:**
```typescript
const INSUFFICIENT_VERBS_MESSAGE =
  "Not enough verbs for that combination — try selecting more tenses or including irregulars.";
```

**Pattern to follow — D-10 exact replacement text, no other logic changes:**
```typescript
const INSUFFICIENT_VERBS_MESSAGE =
  "Not enough verbs for that combination — try selecting more tenses or a different verb mode.";
```
Everything else in this file (the `startQuiz` try/catch, `InsufficientVerbsError` handling,
`startToken` race guard) is untouched — `GenerateOptions` is forwarded opaquely, so the
`includeIrregular` → `verbMode` rename requires no other edits here.

---

### `__tests__/quiz-engine.test.ts` (test, transform)

**Analog:** same file — every `{ tenses: [...], includeIrregular: <bool> }` fixture literal

**Existing fixture pattern to rename** (e.g. lines 15, 27, 38, 193, 223):
```typescript
generate({ tenses: ["future"], includeIrregular: false }, Math.random)
generate({ tenses: ["present_indicative"], includeIrregular: true }, Math.random)
```
becomes:
```typescript
generate({ tenses: ["future"], verbMode: "regular_only" }, Math.random)
generate({ tenses: ["present_indicative"], verbMode: "mixed" }, Math.random)
```
Mapping: `includeIrregular: false` → `verbMode: "regular_only"`; `includeIrregular: true`
in the existing tests → `verbMode: "mixed"` (the existing "irregular on" tests don't
constrain the pool to irregular-only, they just allow both, so `"mixed"` is the correct
1:1 semantic replacement, not `"irregular_only"`).

**New test cases needed (TEST-03), following the existing `describe("generate")` block's
style — filter assertion + `isIrregular` check, mirroring lines 14-23:**
```typescript
it("filter (irregular_only): restricts the eligible pool to only irregular verbs", () => {
  const session = generate({ tenses: ["future"], verbMode: "irregular_only" }, Math.random);
  expect(session.questions).toHaveLength(10);
  session.questions.forEach((q) => {
    const verb = verbs.find((v) => v.verb === q.verb);
    expect(verb).toBeDefined();
    expect(verb!.isIrregular).toBe(true);
  });
});

it("filter (mixed): allows both regular and irregular verbs to appear in the pool", () => {
  const session = generate(
    { tenses: ["present_indicative"], verbMode: "mixed" },
    Math.random,
  );
  expect(session.questions).toHaveLength(10);
  session.questions.forEach((q) => expect(q.tense).toBe("present_indicative"));
});
```
Also add an `InsufficientVerbsError` case for `irregular_only`'s smaller pool, mirroring
the existing boundary test at lines 205-220 (`sampleTriples` throwing) — construct a
tiny irregular-only-eligible pool or call `generate` with a tense/mode combo known to be
below 10 eligible triples, and assert `toThrow(InsufficientVerbsError)`.

---

### `__tests__/useQuizStore.test.ts` (test, transform)

**Analog:** same file — `VALID_OPTIONS`/`ALL_TENSES_OPTIONS` constants (lines 12-20) and
the insufficient-verbs test (lines 96-104)

**Existing fixtures to rename:**
```typescript
const VALID_OPTIONS: GenerateOptions = {
  tenses: ["present_indicative"],
  includeIrregular: false,
};

const ALL_TENSES_OPTIONS: GenerateOptions = {
  tenses: ["present_indicative", "preterite", "imperfect", "future"],
  includeIrregular: false,
};
```
become:
```typescript
const VALID_OPTIONS: GenerateOptions = {
  tenses: ["present_indicative"],
  verbMode: "regular_only",
};

const ALL_TENSES_OPTIONS: GenerateOptions = {
  tenses: ["present_indicative", "preterite", "imperfect", "future"],
  verbMode: "regular_only",
};
```

**Insufficient-verbs test message assertion to update** (lines 96-104, matches D-10):
```typescript
it("startQuiz with insufficient verbs sets error status with the D-04 message and no session", async () => {
  await useQuizStore.getState().startQuiz({ tenses: [], includeIrregular: false });
  const state = useQuizStore.getState();
  expect(state.status).toBe("error");
  expect(state.errorMessage).toBe(
    "Not enough verbs for that combination — try selecting more tenses or including irregulars.",
  );
  expect(state.session).toBeNull();
});
```
becomes:
```typescript
it("startQuiz with insufficient verbs sets error status with the D-10 message and no session", async () => {
  await useQuizStore.getState().startQuiz({ tenses: [], verbMode: "regular_only" });
  const state = useQuizStore.getState();
  expect(state.status).toBe("error");
  expect(state.errorMessage).toBe(
    "Not enough verbs for that combination — try selecting more tenses or a different verb mode.",
  );
  expect(state.session).toBeNull();
});
```
(Note: the test's own docstring name references "D-04" from a prior phase's decision
numbering — update it to "D-10" to match this phase's CONTEXT.md decision ID, or leave
as a purely cosmetic judgment call for the implementer.)

The `spy).toHaveBeenCalledWith(ALL_TENSES_OPTIONS, undefined, [sampleRemoteVerb])` assertion
(line 118) needs no change beyond the `ALL_TENSES_OPTIONS` fixture rename above — it already
passes the whole options object through opaquely.

## Shared Patterns

### Snake_case string-literal unions for closed domain enums
**Source:** `src/dataset/types.ts` (`Tense`, `Subject` — e.g. `present_indicative`, `ele_ela`)
**Apply to:** `VerbMode` in `src/quiz/types.ts` — use `"regular_only" | "mixed" | "irregular_only"`,
never camelCase or PascalCase variants.

### Chip-row selection UI (`app/index.tsx`)
**Source:** `app/index.tsx` lines 63-89 (tense chip row) and its styles block (lines 143-165)
**Apply to:** the new verb-mode chip row — reuse `chipRow`, `chip`, `chipSelected`, `chipText`,
`chipTextSelected`, `sectionLabel` styles verbatim (no new StyleSheet entries needed); only the
selection-handling logic differs (single-select `setVerbMode(value)` vs. multi-select
`toggleTense`/`toggleAll`).

### `GenerateOptions` as the single cross-layer options object
**Source:** `src/quiz/types.ts` → `app/index.tsx`'s `startQuiz()` call → `src/store/useQuizStore.ts`'s
`startQuiz` action → `src/quiz/engine.ts`'s `generate()`
**Apply to:** the `includeIrregular` → `verbMode` field rename must be applied consistently across
all four of these call sites/type sites — there is no other file in the dependency chain that
references `includeIrregular` (confirmed via the Data Flow section of ARCHITECTURE.md: setup
screen → store → engine, no branching).

## No Analog Found

None — every file in scope is an existing file being modified in place, and each has a
directly relevant intra-file or sibling-file precedent as documented above.

## Metadata

**Analog search scope:** `src/quiz/`, `src/store/`, `app/index.tsx`, `src/dataset/types.ts`,
`__tests__/quiz-engine.test.ts`, `__tests__/useQuizStore.test.ts` (all files explicitly named
in 13-CONTEXT.md's `<code_context>` and `<decisions>` sections)
**Files scanned:** 6 (all read in full — none exceeded 2,000 lines)
**Pattern extraction date:** 2026-07-20
