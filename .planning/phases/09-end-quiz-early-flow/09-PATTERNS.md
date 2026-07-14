# Phase 9: End-Quiz-Early Flow - Pattern Map

**Mapped:** 2026-07-14
**Files analyzed:** 3 (2 modified, 1 optionally new)
**Analogs found:** 3 / 3 (all analogs are within the same files being modified — this phase extends existing conventions rather than introducing new roles)

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|--------------------|------|-----------|-----------------|----------------|
| `app/quiz.tsx` (modify) | route/component | event-driven (navigation interception + user action) | `app/quiz.tsx`'s own existing `handleAdvance()` + `lockedChoice === null` conditional-visibility pattern | exact (self-analog — extend existing conventions in the same file) |
| `app/_layout.tsx` (modify) | route/config (Stack layout) | request-response (route config, not runtime data flow) | `app/_layout.tsx`'s own existing `<Stack screenOptions={{ headerShown: false }} />` | exact (self-analog — add a per-route override alongside the existing global default) |
| `src/hooks/useExitConfirmation.ts` (optional new file, only if Claude chooses hook extraction per CONTEXT.md discretion) | hook | event-driven | `src/store/useQuizStore.ts`'s `reset()` action + `app/quiz.tsx`'s `handleAdvance()` shape (call store action → read/react to result → navigate) | role-match (no existing hooks directory yet in this codebase; closest analog is the store-action-then-navigate shape, not a hook file per se) |

**Note on scope:** CONTEXT.md's `<canonical_refs>` confirms only `app/quiz.tsx` and `app/_layout.tsx` are touched; `src/store/useQuizStore.ts` is read-only reuse (`reset()` already exists, do not modify it). `app/index.tsx` is a read-only navigation-target reference (`router.replace("/")` pattern), not modified by this phase.

---

## Pattern Assignments

### `app/quiz.tsx` (route/component, event-driven)

**Analog:** itself — extend the file's own established conventions (this file already has all three patterns needed: conditional visibility, store-action-then-navigate, and is the correct location for the new `useNavigation` + `beforeRemove` listener per ARCHITECTURE.md/PITFALLS.md Pitfall 8).

**Current imports** (`app/quiz.tsx` lines 1-8):
```typescript
import { useState } from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Constants from "expo-constants";
import { useRouter } from "expo-router";
import { useQuizStore } from "../src/store/useQuizStore";
import { subjectLabels, tenseLabels } from "../src/quiz/labels";
import { verbs } from "../src/dataset/verbs";
import { ReportFeedbackModal } from "../src/feedback/ReportFeedbackModal";
```
New imports needed: `Alert` from `react-native` (alongside existing `Platform, Pressable, ...` import), `useNavigation, Stack` from `expo-router` (alongside existing `useRouter`), and `useEffect` from `react` (alongside existing `useState`). Note: this screen currently reads `verbs` from `../src/dataset/verbs` directly (line 7) — per ARCHITECTURE.md Anti-Pattern 3, this may already have been changed to read `datasetVerbs` from the store in Phase 7/8; verify current state before assuming line 7 is unchanged, but this phase does not need to touch that concern either way.

**Status-read-then-navigate pattern to mirror** (`app/quiz.tsx` lines 31-37, `handleAdvance`):
```typescript
function handleAdvance() {
  advance();
  const nextStatus = useQuizStore.getState().status;
  if (nextStatus === "completed") {
    router.replace("/results");
  }
}
```
The new exit-confirm handler should follow the identical shape: call the store action (`reset()`), then navigate (`router.replace("/")`) — no intermediate state read needed since `reset()` is synchronous and unconditional (unlike `advance()`, which branches on `session.questions.length`).

**Conditional-visibility pattern to mirror** (`app/quiz.tsx` lines 39-55, `choiceStyle`, and its usage at lines 91-105):
```typescript
<Pressable
  onPress={handleAdvance}
  style={[styles.nextButton, lockedChoice === null && styles.nextButtonHidden]}
  pointerEvents={lockedChoice === null ? "none" : "auto"}
>
```
Per CONTEXT.md D-01 and PITFALLS.md's "double-dialog" warning, gate the exit control's *availability to fire the dialog* — not visual hiding via `opacity`/`pointerEvents` since it now lives in the native header, not this screen's own JSX — on `status === "in-progress"` (read via `useQuizStore((s) => s.status)`), mirroring this same `=== null` / `=== "in-progress"` gating idiom used for `lockedChoice`.

**Store subscription pattern already in file** (lines 12-16):
```typescript
const session = useQuizStore((s) => s.session);
const currentIndex = useQuizStore((s) => s.currentIndex);
const lockedChoice = useQuizStore((s) => s.lockedChoice);
const selectAnswer = useQuizStore((s) => s.selectAnswer);
const advance = useQuizStore((s) => s.advance);
```
Add `const status = useQuizStore((s) => s.status);` and `const reset = useQuizStore((s) => s.reset);` alongside these, following the same one-selector-per-line convention (avoids destructuring the whole store, keeps re-render scope minimal — an established convention in this file).

**New pattern (not yet in this file) — `beforeRemove` listener, per PITFALLS.md Pitfall 8 / CONTEXT.md D-02:**
```typescript
// Add inside Quiz component body, after existing useQuizStore selectors:
const navigation = useNavigation();

useEffect(() => {
  const unsubscribe = navigation.addListener("beforeRemove", (e) => {
    if (status !== "in-progress") return;
    e.preventDefault();
    confirmExit(() => {
      reset();
      router.replace("/");
    });
  });
  return unsubscribe;
}, [navigation, status, reset, router]);
```
The shared confirm function (per CONTEXT.md D-02, "one shared handler function, not two separate dialog implementations"):
```typescript
function confirmExit(onConfirm: () => void) {
  Alert.alert(
    "Quit Quiz?",
    "Your progress will be lost.",
    [
      { text: "Keep Practicing", style: "cancel" },
      { text: "Quit Quiz", style: "destructive", onPress: onConfirm },
    ],
  );
}
```
Both the header-left "Exit" button's `onPress` and the `beforeRemove` listener call `confirmExit(...)` — this is the single shared handler CONTEXT.md D-02 requires.

**Header override — per CONTEXT.md D-01, D-03 (scoped to this route only, not the root layout):**
```typescript
// Inside app/quiz.tsx, alongside the default export, or via a route-level
// export const unstable_settings — Claude's discretion per CONTEXT.md.
// Simplest form (inline Stack.Screen inside the returned JSX tree):
<Stack.Screen
  options={{
    headerShown: true,
    headerLeft: () => (
      <Pressable onPress={() => {
        if (status === "in-progress") {
          confirmExit(() => { reset(); router.replace("/"); });
        }
      }}>
        <Text style={{ color: "#007AFF", fontSize: 16 }}>Exit</Text>
      </Pressable>
    ),
  }}
/>
```
This must be rendered as a sibling of the screen's root `<ScrollView>` (both inside the component's return), per Expo Router v6's per-route `Stack.Screen` options-override convention — it does not require a separate layout file since only this one route deviates from the app-wide `headerShown: false`.

**Error handling:** No new error paths introduced by this phase — `reset()` is synchronous and cannot throw (mirrors existing usage of `advance()`/`selectAnswer()`, neither of which is wrapped in try/catch in this file). No validation needed — `Alert.alert`'s button callbacks are the only new control flow, and both branches (`cancel`/`destructive`) are exhaustively defined per CONTEXT.md D-02/D-04.

---

### `app/_layout.tsx` (route/config, request-response)

**Analog:** itself — the existing global `screenOptions` default.

**Current full content** (`app/_layout.tsx`, all 11 lines):
```typescript
import { useEffect } from "react";
import { Stack } from "expo-router";
import { prefetch } from "../src/dataset/source";

export default function RootLayout() {
  useEffect(() => {
    prefetch();
  }, []);

  return <Stack screenOptions={{ headerShown: false }} />;
}
```
Per CONTEXT.md D-01 ("Setup and Results stay headerless... this is a deliberate, temporary inconsistency"), **do not change this file's global `headerShown: false` default.** The per-route override for Quiz happens entirely inside `app/quiz.tsx` via `<Stack.Screen options={{ headerShown: true, ... }} />`, which Expo Router v6 merges over the parent `<Stack>`'s `screenOptions` for that specific route only. If `app/_layout.tsx` needs any change at all in this phase, it should be none — confirm during planning that no root-layout edit is required; CONTEXT.md's own decision explicitly scopes the override to "inside `app/quiz.tsx`."

---

## Shared Patterns

### Store action reuse (`reset()`)
**Source:** `src/store/useQuizStore.ts` lines 97-99
```typescript
reset: () => {
  set({ ...initialState });
},
```
**Apply to:** The exit-confirm handler in `app/quiz.tsx`. Do NOT hand-roll a partial reset (per PITFALLS.md Pitfall 7) — call this existing action directly. `initialState` (lines 26-34) already covers every field (`status`, `filters`, `session`, `currentIndex`, `answers`, `lockedChoice`, `errorMessage`), so `reset()` alone is sufficient; no new store action is required for this phase (contrast with ARCHITECTURE.md's earlier `abandonQuiz()` sketch, which the actual shipped store did not adopt — `reset()` is the one true primitive already in place, confirmed by direct read).

### Status-gated conditional logic
**Source:** `app/quiz.tsx` lines 39-55 (`choiceStyle`) and lines 93/101 (`lockedChoice === null` usage)
**Apply to:** Both the header exit button's tap-guard and the `beforeRemove` listener's early-return, gating on `status === "in-progress"` (not `lockedChoice`, which is a different, narrower concept) — this satisfies PITFALLS.md's double-dialog warning for the auto-completion edge case on the last question.

### Navigation-after-store-action shape
**Source:** `app/quiz.tsx` lines 31-37 (`handleAdvance`) and `app/index.tsx` lines 33-50 (`handleStartQuiz`)
```typescript
// app/index.tsx's handleStartQuiz (lines 38-42) — the router.replace("/") target pattern:
await startQuiz({ tenses: selectedTenses, includeIrregular });
const nextStatus = useQuizStore.getState().status;
if (nextStatus === "in-progress") {
  router.replace("/quiz");
}
```
**Apply to:** The confirmed-exit path: call `reset()` (synchronous, no await needed, unlike `startQuiz`), then unconditionally `router.replace("/")` — simpler than `handleAdvance`'s conditional since `reset()` always succeeds and always means "go to Setup," no status branch required.

### Test harness precedent for full-state-equality assertions
**Source:** `__tests__/useQuizStore.test.ts` lines 1-20 (mocking `../src/dataset/source`, importing `resolveVerbs`, `verbs as localVerbs`, `GenerateOptions`)
**Apply to:** If a test is added for the exit flow (per PITFALLS.md's "Looks Done But Isn't" checklist item — "verify every store field matches a fresh `reset()`, not just `status`"), follow this file's existing `jest.mock("../src/dataset/source")` + `mockedResolveVerbs` setup convention rather than inventing a new mocking approach — this is the only existing test file exercising `useQuizStore` directly.

---

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `src/hooks/useExitConfirmation.ts` (if Claude opts for hook extraction) | hook | event-driven | No `src/hooks/` directory exists yet in this codebase — there is no established hook-file convention to copy (imports style, naming, file location). If extracted, follow the same plain-function-export style already used in `src/quiz/labels.ts` / `src/dataset/source.ts` (named exports, no default export, colocated types) rather than inventing a new convention. CONTEXT.md explicitly leaves this as Claude's discretion with "no user-visible difference either way" — the inline-in-`quiz.tsx` option (no new file) has a direct, strong analog (see above) and is likely the lower-risk choice given no existing hooks precedent.

## Metadata

**Analog search scope:** `app/` (4 route files), `src/store/useQuizStore.ts`, `src/dataset/source.ts`, `src/feedback/ReportFeedbackModal.tsx` (checked for `Alert` usage precedent — none found, this is the first use of `Alert` in the codebase), `__tests__/useQuizStore.test.ts`
**Files scanned:** 24 (all non-node_modules files under `app/` and `src/`)
**Pattern extraction date:** 2026-07-14
