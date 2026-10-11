# Phase 33: Quiz Press-State Color Fix - Pattern Map

**Mapped:** 2026-08-16
**Files analyzed:** 4 (2 modified, 2 created)
**Analogs found:** 4 / 4

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/theme/tokens.ts` | config | transform (data-only constants) | itself (existing file, additive edit) | exact |
| `src/quiz/choiceStyle.ts` (new, name at Claude's discretion) | utility | transform | `src/quiz/scoring.ts` | exact |
| `app/quiz.tsx` | component (screen) | request-response (event handler → derived style) | itself (existing file, wiring edit) | exact |
| `__tests__/quiz-choice-style.test.ts` (new) | test | transform | `__tests__/quiz-scoring.test.ts` | exact |

## Pattern Assignments

### `src/theme/tokens.ts` (config)

**Analog:** itself — flat object literal, no logic, additive key only.

**Full current shape** (`src/theme/tokens.ts:1-13`):
```typescript
export const colors = {
  primary: "#F2643E",
  primarySoft: "#FDE7DF",
  pressed: "#C94A2D",
  info: "#36799A",
  infoSoft: "#DCEBF0",
  success: "#1F7F66",
  error: "#D64545",
  background: "#FFF9F6",
  text: "#24201E",
  textSecondary: "#746D69",
  surface: "#F1EFED",
};
```

**Change (per CONTEXT.md D-01):** add one key, matching the existing flat
hex-string convention — no nesting, no computed values, no comments in this
object anywhere else in the file:
```typescript
export const colors = {
  primary: "#F2643E",
  primarySoft: "#FDE7DF",
  pressed: "#C94A2D",
  choicePressed: "#E3DFDA",
  info: "#36799A",
  infoSoft: "#DCEBF0",
  success: "#1F7F66",
  error: "#D64545",
  background: "#FFF9F6",
  text: "#24201E",
  textSecondary: "#746D69",
  surface: "#F1EFED",
};
```
Place `choicePressed` immediately after `pressed` for discoverability (both
are "pressed"-family tokens) — this is a style choice, not an enforced
project convention, but keeps related tokens adjacent as `primary`/
`primarySoft` and `info`/`infoSoft` already do.

---

### `src/quiz/choiceStyle.ts` (new — utility, transform)

**Analog:** `src/quiz/scoring.ts` (also `src/quiz/share.ts` as a secondary
reference for "one tiny pure function, one named export, no side effects").

**Imports pattern** (`src/quiz/scoring.ts:1`):
```typescript
import type { QuizSession } from "./types";
```
For the new module, the equivalent type-only import needed is the `colors`
token object (a value import, not type-only, since it's used at runtime to
return concrete color strings) — follow `app/quiz.tsx:10`'s import style:
```typescript
import { colors } from "../theme/tokens";
```
Note the relative path is `../theme/tokens` from inside `src/quiz/` (mirrors
how `src/quiz/engine.ts` reaches into `../dataset/types`).

**Core pattern — small pure function, explicit return type, named export**
(`src/quiz/scoring.ts:3-13`):
```typescript
export function score(
  session: QuizSession,
  answers: readonly (string | null)[],
): { correct: number; total: number } {
  const total = session.questions.length;
  const correct = session.questions.reduce(
    (acc, q, i) => acc + (answers[i] === q.correctAnswer ? 1 : 0),
    0,
  );
  return { correct, total };
}
```
Simpler single-expression sibling example (`src/quiz/share.ts:1-3`):
```typescript
export function buildShareMessage(correct: number, total: number): string {
  return `I scored ${correct}/${total} on Lafa!`;
}
```

**Behavior to port from `app/quiz.tsx`** — this is the exact logic being
extracted (current inline version, `app/quiz.tsx:82-98` for locked-state,
`app/quiz.tsx:145-149` for the separate pressed condition that must be
merged in):
```typescript
// locked-state resolution (app/quiz.tsx:82-98)
function choiceStyle(choice: string, correctAnswer: string) {
  if (lockedChoice === null) {
    return { container: styles.choiceDefault, text: styles.choiceTextDefault };
  }
  const isSelected = choice === lockedChoice;
  const isCorrect = choice === correctAnswer;
  if (isSelected && isCorrect) {
    return { container: styles.choiceCorrect, text: styles.choiceTextOnColor };
  }
  if (isSelected && !isCorrect) {
    return { container: styles.choiceWrong, text: styles.choiceTextOnColor };
  }
  if (!isSelected && isCorrect && lockedChoice !== correctAnswer) {
    return { container: styles.choiceCorrect, text: styles.choiceTextOnColor };
  }
  return { container: styles.choiceDefault, text: styles.choiceTextDefault };
}

// separate pressed condition applied inline on the Pressable (app/quiz.tsx:142-150)
<Pressable
  key={choice}
  onPress={() => selectAnswer(choice)}
  style={({ pressed }) => [
    styles.choice,
    style.container,
    lockedChoice === null && pressed && { backgroundColor: colors.pressed },
  ]}
>
```

**Design constraint (per CONTEXT.md D-03):** since `src/quiz/*.ts` modules
are framework-free (no React/RN imports — confirmed in `scoring.ts`,
`share.ts`, `labels.ts`), the extracted function cannot return RN
`StyleSheet` style objects that reference `app/quiz.tsx`'s local
`StyleSheet.create` block (`styles.choiceDefault`, `styles.choiceCorrect`,
etc. are screen-local, not importable). Instead the function should return
a small plain-data descriptor (e.g. a variant tag like
`"default" | "correct" | "wrong"` plus a resolved `backgroundColor: string`
built from `colors.*`), and `app/quiz.tsx` maps that descriptor onto its
existing local `styles.choice*` objects for the non-color parts (borderless
container shape etc.) while trusting the function's returned color for
`backgroundColor`. Exact shape is Claude's discretion per CONTEXT.md — the
one hard requirement is that locked correct/incorrect state always wins
over `pressed`, expressed as one precedence chain in this single function
(not duplicated across two code paths as today).

**Suggested signature shape (illustrative, not mandated):**
```typescript
export function resolveChoiceStyle(
  choice: string,
  correctAnswer: string,
  lockedChoice: string | null,
  pressed: boolean,
): { backgroundColor: string; textColor: string } {
  // locked-state precedence first (mirrors current choiceStyle 4-branch logic),
  // falls through to pressed vs. default only when lockedChoice === null
}
```

---

### `app/quiz.tsx` (screen — modified)

**Analog:** itself (existing file being rewired, not a new file).

**Imports already present, no changes needed to import block structure**
(`app/quiz.tsx:1-13`):
```typescript
import { useEffect, useState } from "react";
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Constants from "expo-constants";
import { Stack, useNavigation, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuizStore } from "../src/store/useQuizStore";
import { subjectLabels, tenseLabels, tenseGrammarNames } from "../src/quiz/labels";
import { ReportFeedbackModal } from "../src/feedback/ReportFeedbackModal";
import { ProductFeedbackModal } from "../src/productFeedback/ProductFeedbackModal";
import { colors, spacing, radius, typography } from "../src/theme/tokens";
import { OfflinePill } from "../src/components/OfflinePill";
import { ExplanationPanel } from "../src/components/ExplanationPanel";
import { selectExplanation } from "../src/learning/explain";
```
Add one new import for the extracted function, following the same
`../src/quiz/*` pattern as `labels`:
```typescript
import { resolveChoiceStyle } from "../src/quiz/choiceStyle"; // name illustrative
```

**Call site to remove** — the local `choiceStyle()` function definition
(`app/quiz.tsx:82-98`) is deleted entirely; its logic moves into the new
module.

**Call site to update** — the `.map()` render block and `Pressable` style
callback (`app/quiz.tsx:139-153`):
```typescript
{question.choices.map((choice) => {
  const style = choiceStyle(choice, question.correctAnswer);
  return (
    <Pressable
      key={choice}
      onPress={() => selectAnswer(choice)}
      style={({ pressed }) => [
        styles.choice,
        style.container,
        lockedChoice === null && pressed && { backgroundColor: colors.pressed },
      ]}
    >
      <Text style={[styles.choiceText, style.text]}>{choice}</Text>
    </Pressable>
  );
})}
```
becomes a single call into the extracted function inside the `Pressable`'s
style callback (exact call shape depends on chosen return type — see
above), replacing both the `choiceStyle(...)` locked-state lookup and the
inline `lockedChoice === null && pressed && { backgroundColor: colors.pressed }`
condition with one function call that already encodes the full precedence
(locked correct/incorrect > pressed > default), using `colors.choicePressed`
instead of `colors.pressed` for the unlocked-and-pressed case only.

**Untouched sibling pattern to leave alone** — the Next button's own
pressed-color usage stays on `colors.pressed` per CONTEXT.md D-02, do not
touch (`app/quiz.tsx:159-166`):
```typescript
<Pressable
  onPress={handleAdvance}
  style={({ pressed }) => [
    styles.nextButton,
    lockedChoice === null && styles.nextButtonHidden,
    pressed && { backgroundColor: colors.pressed },
  ]}
  pointerEvents={lockedChoice === null ? "none" : "auto"}
>
```

---

### `__tests__/quiz-choice-style.test.ts` (new — test)

**Analog:** `__tests__/quiz-scoring.test.ts` (also structurally close to
`__tests__/quiz-engine.test.ts` for multi-branch coverage style, but
`quiz-scoring.test.ts` is the tighter match — small pure function, no
`mockRandom` needed since this new function is fully deterministic given
its inputs).

**File naming convention:** `<domain>-<module>.test.ts` in a flat
`__tests__/` directory, not co-located — `quiz-choice-style.test.ts` matches
`quiz-scoring.test.ts` / `quiz-engine.test.ts` naming exactly.

**Full structure to mirror** (`__tests__/quiz-scoring.test.ts:1-51`):
```typescript
import { score } from "../src/quiz/scoring";
import type { QuizSession } from "../src/quiz/types";

function buildSession(correctAnswers: string[]): QuizSession {
  return {
    questions: correctAnswers.map((correctAnswer, i) => ({
      verb: `verb${i}`,
      tense: "present_indicative",
      subject: "eu",
      choices: [correctAnswer, "wrong1", "wrong2", "wrong3"],
      correctAnswer,
    })),
  };
}

describe("score", () => {
  it("returns full marks when every answer matches the correctAnswer (all correct)", () => {
    const session = buildSession(["falo", "como", "bebo"]);
    expect(score(session, ["falo", "como", "bebo"])).toEqual({
      correct: 3,
      total: 3,
    });
  });
  // ... more it() blocks, one behavior each, descriptive test names
});
```

**Import pattern for the new test:**
```typescript
import { resolveChoiceStyle } from "../src/quiz/choiceStyle"; // match actual export name
import { colors } from "../src/theme/tokens";
```

**Required coverage per CONTEXT.md D-04** (each as its own `it()`, following
`quiz-scoring.test.ts`'s one-behavior-per-test style with descriptive
names in parentheses):
- locked + correct (selected choice === correctAnswer)
- locked + wrong, selected branch (selected choice !== correctAnswer →
  selected choice renders as wrong)
- locked + wrong, unselected-but-correct branch (the correct choice, not
  selected, still highlights correct when a wrong one was picked)
- unlocked + pressed (lockedChoice === null, pressed === true → uses
  `colors.choicePressed`, not `colors.pressed`)
- **precedence assertion (the core UX-03 check):** locked state (correct or
  wrong) combined with `pressed: true` must still resolve to the locked
  color, never `colors.choicePressed` — this is the one test that most
  directly satisfies D-03/D-04's "precedence guarantee is expressed and
  tested in one place" requirement. Assert against the literal
  `colors.success` / `colors.error` values, not just style-object identity,
  since color-string correctness is the actual bug being fixed.

---

## Shared Patterns

### Named exports only, no default exports, no barrel files
**Source:** `src/quiz/scoring.ts`, `src/quiz/share.ts`, `src/quiz/labels.ts`
(all use `export function` / `export const`)
**Apply to:** the new `src/quiz/choiceStyle.ts` module — no `export default`.

### Framework-free `src/quiz/` modules
**Source:** `src/quiz/scoring.ts`, `src/quiz/share.ts` — zero React/RN
imports, only plain TS + sibling type imports.
**Apply to:** the new module — it may import `colors` from
`src/theme/tokens.ts` (a plain data module, not a React import) but must
not import anything from `react` or `react-native`.

### Test file naming and structure
**Source:** `__tests__/quiz-scoring.test.ts`
**Apply to:** `__tests__/quiz-choice-style.test.ts` — flat `__tests__/`
directory, `<domain>-<module>.test.ts` naming, `describe`/`it` with
descriptive parenthetical test names, `toEqual`/`toBe` assertions on plain
return values (no rendering, no `@testing-library/react-native`).

### Theme tokens as flat, non-nested hex-string object
**Source:** `src/theme/tokens.ts:1-13`
**Apply to:** the `colors.choicePressed` addition — no new nesting, no
helper functions, just one more flat string key.

## No Analog Found

None — all four files in scope have exact or near-exact analogs already in
the codebase (this phase is a small, well-precedented refactor within an
established module structure).

## Metadata

**Analog search scope:** `src/quiz/`, `src/theme/`, `app/`, `__tests__/`
**Files scanned:** `src/theme/tokens.ts`, `src/quiz/scoring.ts`,
`src/quiz/share.ts`, `src/quiz/labels.ts`, `app/quiz.tsx`,
`__tests__/quiz-scoring.test.ts`
**Pattern extraction date:** 2026-08-16
