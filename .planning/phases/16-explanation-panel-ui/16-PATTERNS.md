# Phase 16: Explanation Panel UI - Pattern Map

**Mapped:** 2026-07-20
**Files analyzed:** 3
**Analogs found:** 3 / 3

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|--------------------|------|-----------|-----------------|----------------|
| `src/components/ExplanationPanel.tsx` | component | request-response (pure presentational, props-in) | `src/components/OfflinePill.tsx` | role-match (exact shape/conventions, different data source) |
| `src/store/useQuizStore.ts` (modify) | store | CRUD (state read/write) | itself (extend existing `startQuiz`/`initialState`/`reset` pattern) | exact (in-place extension, no better external analog needed) |
| `app/quiz.tsx` (modify) | route/screen | request-response (render + local event handlers) | itself (extend existing conditional-render + store-selector pattern) | exact (in-place extension) |

All three files are modifications/extensions of pre-existing, fully specified code (UI-SPEC.md is binding and verbatim for the new component). This is a wiring phase, not a new-pattern phase — the "analog" for the two modified files is their own current structure, extended additively.

## Pattern Assignments

### `src/components/ExplanationPanel.tsx` (new component)

**Analog:** `src/components/OfflinePill.tsx`

**Imports pattern** (`src/components/OfflinePill.tsx` lines 1-6):
```typescript
import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import type { VerbSource } from "../dataset/source";
import { resolveVerbs } from "../dataset/source";
import { colors, radius, spacing, typography } from "../theme/tokens";
```
`ExplanationPanel` needs none of the data-fetching imports (`useEffect`/`useState`/`resolveVerbs`) since it is a dumb, props-only component — only `StyleSheet, Text, View` from `react-native` and the four token names from `../theme/tokens`.

**Component shape pattern** (`OfflinePill.tsx` lines 14-38, adapted): named export function component, no default export, computes nothing async, returns `null` when not applicable vs. returns a `<View><Text/></View>` card otherwise:
```typescript
export function OfflinePill() {
  ...
  if (!isLocalSource(source)) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.text}>{OFFLINE_PILL_TEXT}</Text>
    </View>
  );
}
```
`ExplanationPanel` is even simpler — no internal state/effect at all, since UI-SPEC.md's contract makes it a pure `{ text: string }` props-in component (mount/unmount is owned entirely by the caller in `quiz.tsx`, not by internal state as `OfflinePill` does with `source`).

**Exact required implementation (verbatim from UI-SPEC.md's approved Component Contract — do not deviate):**
```tsx
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

**Style block pattern** (`OfflinePill.tsx` lines 40-53) confirms token usage conventions to follow (`colors.X`, `radius.X`, `spacing.X`, `typography.X` spread), but note the values differ intentionally: `OfflinePill` uses `colors.primarySoft` + `radius.pill` + `typography.caption` (its own "tip pill" look, rejected for this phase per D-01), while `ExplanationPanel` uses `colors.surface` + `radius.control` + `typography.body` (locked by UI-SPEC.md). Do not copy `OfflinePill`'s exact token *values* — only its *conventions* (no ThemeProvider, direct flat imports, `StyleSheet.create` at module bottom).

**Error handling:** none needed — component never throws, receives an already-resolved string; no try/catch, no validation (upstream `selectExplanation` and Zod-validated `learning` already guarantee this).

---

### `src/store/useQuizStore.ts` (modify)

**Analog:** itself — extend the existing `QuizStoreState` interface, `initialState`, and `startQuiz`'s success/error branches additively.

**Current full pattern to extend** (`src/store/useQuizStore.ts` lines 1-100, already read in full — small file, single pass):

Imports (lines 1-5) — add one new type import matching the existing style:
```typescript
import { create } from "zustand";
import { generate } from "../quiz/engine";
import type { GenerateOptions, QuizSession } from "../quiz/types";
import { InsufficientVerbsError } from "../quiz/types";
import { resolveVerbs } from "../dataset/source";
// ADD:
import type { Verb } from "../dataset/types";
import type { LearningContent } from "../learning/types";
```

State interface (lines 12-24) — add two fields, matching existing `X: Type | null` / array style:
```typescript
interface QuizStoreState {
  status: QuizStatus;
  filters: GenerateOptions | null;
  session: QuizSession | null;
  currentIndex: number;
  answers: (string | null)[];
  lockedChoice: string | null;
  errorMessage: string | null;
  // ADD:
  verbs: Verb[];
  learning: LearningContent | undefined;
  startQuiz: (options: GenerateOptions) => Promise<void>;
  selectAnswer: (choice: string) => void;
  advance: () => void;
  reset: () => void;
}
```

`initialState` (lines 26-34) — add both new fields here so `reset()` (line 97-99, `set({ ...initialState })`) picks them up automatically for free:
```typescript
const initialState = {
  status: "idle" as QuizStatus,
  filters: null,
  session: null,
  currentIndex: 0,
  answers: [] as (string | null)[],
  lockedChoice: null,
  errorMessage: null,
  // ADD:
  verbs: [] as Verb[],
  learning: undefined as LearningContent | undefined,
};
```

**Core CRUD pattern — `startQuiz` success path** (lines 44-58), destructure and persist both new fields:
```typescript
startQuiz: async (options: GenerateOptions) => {
  const token = ++startToken;
  try {
    const { verbs, learning } = await resolveVerbs(); // was: const { verbs } = ...
    if (token !== startToken) return;
    const session = generate(options, undefined, verbs);
    set({
      status: "in-progress",
      filters: options,
      session,
      verbs,       // NEW
      learning,    // NEW
      currentIndex: 0,
      answers: [],
      lockedChoice: null,
      errorMessage: null,
    });
  } catch (error) {
    if (token !== startToken) return;
    if (error instanceof InsufficientVerbsError) {
      set({
        status: "error",
        errorMessage: INSUFFICIENT_VERBS_MESSAGE,
        session: null,
        filters: options,
        currentIndex: 0,
        answers: [],
        lockedChoice: null,
        // verbs/learning NOT set here — initialState's [] / undefined already
        // cover the "no session" error case since reset()/module-init spread
        // initialState; no explicit override needed unless a stale value from
        // a PRIOR successful session could otherwise leak through — it can't,
        // because this catch block only runs when generate()/resolveVerbs()
        // never reached the success set() call above.
      });
      return;
    }
    throw error;
  }
},
```

**Error handling pattern:** unchanged — existing `instanceof InsufficientVerbsError` branch (lines 61-72) and re-throw for unknown errors (line 73) apply as-is; no new error type introduced by this phase.

**No new dependency-injection pattern needed** — `resolveVerbs()` is already the sole seam, already mocked in `__tests__/useQuizStore.test.ts` with `learning` in every `mockResolvedValue` call (per RESEARCH.md, confirmed by direct grep).

---

### `app/quiz.tsx` (modify)

**Analog:** itself — extend existing store-selector + conditional-render conventions already used throughout this file.

**Imports pattern** (current lines 1-11) — replace the bundled-dataset import, add the new component and function:
```typescript
// REMOVE:
import { verbs } from "../src/dataset/verbs";
// ADD:
import { selectExplanation } from "../src/learning/explain";
import { ExplanationPanel } from "../src/components/ExplanationPanel";
```
Keep all other existing imports (`useQuizStore`, `subjectLabels`/`tenseLabels`/`tenseGrammarNames`, `ReportFeedbackModal`, tokens, `OfflinePill`) unchanged.

**Store-selector pattern** (existing lines 17-23, matches project convention of one `useQuizStore((s) => s.field)` call per field, never a bulk destructure):
```typescript
const session = useQuizStore((s) => s.session);
const currentIndex = useQuizStore((s) => s.currentIndex);
const lockedChoice = useQuizStore((s) => s.lockedChoice);
const status = useQuizStore((s) => s.status);
const selectAnswer = useQuizStore((s) => s.selectAnswer);
const advance = useQuizStore((s) => s.advance);
const reset = useQuizStore((s) => s.reset);
// ADD, same style:
const verbs = useQuizStore((s) => s.verbs);
const learning = useQuizStore((s) => s.learning);
```

**Core lookup fix — `currentVerb`** (current line 61, `const currentVerb = verbs.find((v) => v.verb === question.verb);`) — logic is unchanged; only the *source* of `verbs` changes (from the static bundled-dataset import to the store-selected, session-snapshotted array). No new pattern; this line requires zero edits once the import/selector above are swapped in, since the variable name `verbs` and the `.find(...)` call are identical.

**Core pattern — explanation computation and conditional render** (verbatim from UI-SPEC.md, matches this file's existing `if (!session) return null;` / `if (!question) return null;` early-return style at lines 56-59, and the existing `lockedChoice === null && styles.xHidden` conditional style pattern used at lines 146/154 for `nextButton`/`reportButton` — but explicitly NOT using that reserved-space pattern here per D-02):
```tsx
const explanation =
  lockedChoice !== null && lockedChoice !== question.correctAnswer && currentVerb
    ? selectExplanation(currentVerb, lockedChoice, question, learning)
    : undefined;
```
Note: pass `question` itself as the third argument (not `question.correctAnswer`) — `Question extends Triple` already has `{ tense, subject }` fields, structurally satisfying `selectExplanation`'s third parameter type `{ tense: Tense; subject: Subject }`. This is the exact pitfall flagged in RESEARCH.md (Pitfall 1).

**Placement in JSX** (between the existing `styles.choices` `<View>` block ending at line 142 and the `nextButton` `<Pressable>` starting at line 144):
```tsx
        </View>

        {explanation && <ExplanationPanel text={explanation} />}

        <Pressable
          onPress={handleAdvance}
          style={[styles.nextButton, lockedChoice === null && styles.nextButtonHidden]}
          ...
```

**Error handling:** none new — `selectExplanation` never throws (verified, zero `throw` statements in `src/learning/explain.ts`); the `currentVerb` guard (`currentVerb ? ... : undefined`) mirrors this file's existing defensive `?.` pattern already used at line 121 (`currentVerb?.translation ?? ""`).

---

## Shared Patterns

### Design tokens (flat imports, no ThemeProvider)
**Source:** `src/theme/tokens.ts`, consumed identically by `OfflinePill.tsx` (lines 6, 40-53) and `app/quiz.tsx` (line 10, throughout `StyleSheet.create` at lines 176-276)
**Apply to:** `ExplanationPanel.tsx` (new) — import `{ colors, radius, spacing, typography }` directly, never introduce a context/provider.
```typescript
import { colors, radius, spacing, typography } from "../theme/tokens";
```

### Zustand store-forwarded session snapshot (not fresh imports)
**Source:** `src/dataset/source.ts`'s `resolveVerbs()` cached-promise pattern (lines 8-42), now extended one layer further into `useQuizStore.ts`
**Apply to:** `useQuizStore.ts` and `app/quiz.tsx` — any screen needing data that varies by which dataset source resolved for the current session must read it from the store, never re-import `src/dataset/verbs.ts` directly. This is the exact anti-pattern this phase fixes (Gap 2).

### `noUncheckedIndexedAccess`-safe indexing
**Source:** `src/learning/explain.ts` line 20 (`const first = categories[0]!;` with justifying comment), and `src/quiz/random.ts` per CONVENTIONS.md
**Apply to:** any new indexed access added to `useQuizStore.ts` or `quiz.tsx` in this phase — none is currently anticipated (both fixes are field additions, not new array indexing), but if the executor introduces any, follow the comment-justified `!` or `?? default` convention, never a blanket cast.

### Conditional-mount over reserved-space (`opacity: 0`)
**Source:** `app/quiz.tsx` currently uses reserved-space (`nextButtonHidden`/`reportButtonHidden`, `opacity: 0` + `pointerEvents: "none"`) for the Next/Report buttons — this is the *rejected* pattern for the new panel (D-02 explicitly overrides it for `ExplanationPanel` only). Do not copy this specific sub-pattern for the new panel; the panel must not exist in the tree at all when `explanation` is falsy — a plain `{explanation && <ExplanationPanel .../>}` JSX conditional, not a hidden-but-mounted element.

## No Analog Found

None — all three files are either extensions of existing, fully-read files or have a directly applicable component analog (`OfflinePill.tsx`). No file in this phase requires inventing a pattern from scratch; UI-SPEC.md's Component Contract is binding and verbatim for the one new file.

## Metadata

**Analog search scope:** `src/components/`, `src/store/`, `app/`, `src/dataset/`, `src/learning/`
**Files scanned:** `src/components/OfflinePill.tsx`, `src/store/useQuizStore.ts`, `app/quiz.tsx`, `src/dataset/source.ts`, `src/learning/explain.ts` (all read in full, single-pass, no re-reads)
**Pattern extraction date:** 2026-07-20
