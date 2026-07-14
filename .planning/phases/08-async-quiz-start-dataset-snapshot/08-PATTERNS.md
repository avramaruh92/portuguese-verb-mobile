# Phase 8: Async Quiz Start & Dataset Snapshot - Pattern Map

**Mapped:** 2026-07-14
**Files analyzed:** 6 (4 to modify, 2 read-only reference)
**Analogs found:** 4 / 4 (of files requiring new logic)

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|-----------------|---------------|
| `src/store/useQuizStore.ts` (`startQuiz()`) | store | request-response (async CRUD-like state transition) | `src/feedback/ReportFeedbackModal.tsx` (`handleSubmit`, for the async try/catch shape) + itself (existing sync body, for the state-update shape) | role-match |
| `app/index.tsx` (`handleStartQuiz()`) | component (screen) | request-response | `src/feedback/ReportFeedbackModal.tsx` (async handler + local loading-state button) | exact (closest available async-button pattern in repo) |
| `app/results.tsx` (`handleTryAgain()`) | component (screen) | request-response | `app/index.tsx`'s existing `handleStartQuiz()` (identical duplicated sync pattern today) + `ReportFeedbackModal.tsx` (async loading-state pattern) | exact |
| `app/_layout.tsx` | provider (root layout) | event-driven (mount-time side effect) | `src/feedback/ReportFeedbackModal.tsx`'s `useEffect` (mount/visibility-triggered side effect, closest `useEffect`-on-mount usage in the app tree) | role-match |
| `src/dataset/source.ts` (read-only) | service | async singleton/memoized fetch | n/a — reference only, no changes | n/a |
| `src/quiz/engine.ts` (read-only) | utility | transform | n/a — reference only, no changes | n/a |

No other components in the repo currently perform an async action from a button tap and gate the button on a loading flag — `ReportFeedbackModal.tsx` is the **only** existing analog for that exact shape in this codebase, so it is reused for both `app/index.tsx` and `app/results.tsx`.

## Pattern Assignments

### `src/store/useQuizStore.ts` — `startQuiz()` (store, async state transition)

**Analog (self):** `src/store/useQuizStore.ts` lines 1-61 (current synchronous implementation) — the file being modified already has the target shape; only the signature and body need to become `async`/`await`-based. Cross-referenced against `src/feedback/ReportFeedbackModal.tsx` lines 70-97 for the async try/catch idiom used elsewhere in this codebase.

**Current imports** (lines 1-4):
```typescript
import { create } from "zustand";
import { generate } from "../quiz/engine";
import type { GenerateOptions, QuizSession } from "../quiz/types";
import { InsufficientVerbsError } from "../quiz/types";
```
Add: `import { resolveVerbs } from "../dataset/source";`

**Interface signature to change** (line 19):
```typescript
startQuiz: (options: GenerateOptions) => void;
```
becomes:
```typescript
startQuiz: (options: GenerateOptions) => Promise<void>;
```

**Current synchronous core pattern** (lines 38-61) — this is the exact structure to preserve, just made async:
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
**Target shape** (per D-01/D-03): `await resolveVerbs()` first, then pass the resolved `verbs` array into `generate(options, undefined, verbs)` (the `random` param stays defaulted — see `src/quiz/engine.ts` line 14, `verbs: Verb[] = localVerbs`, so only the 3rd positional arg needs supplying). `resolveVerbs()` never rejects (Phase 7 D-06), so no new outer try/catch is needed around it — only the existing `InsufficientVerbsError` catch around `generate()` stays. `status` only flips to `"in-progress"` after the awaited snapshot resolves and `generate()` succeeds (D-03 — no new status value).

**Async try/catch idiom to mirror** (from `src/feedback/ReportFeedbackModal.tsx` lines 70-97):
```typescript
async function handleSubmit() {
  try {
    setState("submitting");
    const payload = buildFeedbackPayload({ ... });
    const result = await submitFeedback(payload);
    if (result.status === "success") {
      setState("success");
      ...
    } else {
      setState("error");
      ...
    }
  } catch {
    setState("error");
    ...
  }
}
```

---

### `app/index.tsx` — `handleStartQuiz()` (component/screen, request-response)

**Analog:** `src/feedback/ReportFeedbackModal.tsx` (async handler + button loading-state gating), combined with this file's own existing structure for everything else (imports, screen shell, styling conventions stay unchanged).

**Current imports** (lines 1-7) — unchanged, `useState` already imported:
```typescript
import { useState } from "react";
import { Pressable, StyleSheet, Switch, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useQuizStore } from "../src/store/useQuizStore";
import { tenseLabels } from "../src/quiz/labels";
import { TENSES } from "../src/dataset/types";
import type { Tense } from "../src/dataset/types";
```

**Current sync pattern to replace** (lines 31-38) — the exact "call then synchronously read `.getState().status`" bug CONTEXT.md flags:
```typescript
function handleStartQuiz() {
  if (!canStart) return;
  startQuiz({ tenses: selectedTenses, includeIrregular });
  const nextStatus = useQuizStore.getState().status;
  if (nextStatus === "in-progress") {
    router.replace("/quiz");
  }
}
```

**Target pattern** — local loading flag (per D-02, Claude's discretion says local `useState` is acceptable) gating the button, `await`ing the now-async `startQuiz`, mirroring `ReportFeedbackModal.tsx`'s `isSubmitting` flag (lines 43-45, 70-72, 99, 161-171):
```typescript
const [starting, setStarting] = useState(false);
// ...
async function handleStartQuiz() {
  if (!canStart || starting) return;
  setStarting(true);
  try {
    await startQuiz({ tenses: selectedTenses, includeIrregular });
    const nextStatus = useQuizStore.getState().status;
    if (nextStatus === "in-progress") {
      router.replace("/quiz");
    }
  } finally {
    setStarting(false);
  }
}
```

**Button loading-state pattern to mirror** (from `ReportFeedbackModal.tsx` lines 161-171):
```typescript
<Pressable
  onPress={handleSubmit}
  disabled={isSubmitting}
  style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
>
  {isSubmitting ? (
    <ActivityIndicator color="#FFFFFF" />
  ) : (
    <Text style={styles.submitButtonText}>Submit feedback</Text>
  )}
</Pressable>
```
Apply the same `disabled={!canStart || starting}` / label-swap idea to the existing Start button (lines 81-87 of `app/index.tsx`); exact visual treatment (spinner vs. text swap) is Phase 10's call per D-02 — a plain label swap (e.g. `"Starting…"`) satisfies this phase's state-machine requirement.

---

### `app/results.tsx` — `handleTryAgain()` (component/screen, request-response)

**Analog:** Same two sources as `app/index.tsx` above — `ReportFeedbackModal.tsx` for the loading-flag/button pattern, and `app/index.tsx`'s own pre-fix `handleStartQuiz()` for the exact duplicated bug being fixed here too.

**Current imports** (lines 1-5) — `useState` not yet imported, needs adding:
```typescript
import { Pressable, Share, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useQuizStore } from "../src/store/useQuizStore";
import { score } from "../src/quiz/scoring";
import { buildShareMessage } from "../src/quiz/share";
```
Add `useState` to the `"react"` import (new import line needed since none currently exists in this file).

**Current sync pattern to replace** (lines 26-36):
```typescript
function handleTryAgain() {
  if (!filters) {
    router.replace("/");
    return;
  }
  startQuiz(filters);
  const nextStatus = useQuizStore.getState().status;
  if (nextStatus === "in-progress") {
    router.replace("/quiz");
  }
}
```

**Target pattern** — identical shape to `app/index.tsx`'s fix:
```typescript
const [starting, setStarting] = useState(false);
// ...
async function handleTryAgain() {
  if (!filters) {
    router.replace("/");
    return;
  }
  if (starting) return;
  setStarting(true);
  try {
    await startQuiz(filters);
    const nextStatus = useQuizStore.getState().status;
    if (nextStatus === "in-progress") {
      router.replace("/quiz");
    }
  } finally {
    setStarting(false);
  }
}
```
Gate the "Try Again" `Pressable` (lines 56-58) with `disabled={starting}` and a label swap, same as `app/index.tsx`'s Start button and `ReportFeedbackModal.tsx`'s submit button.

---

### `app/_layout.tsx` — add `prefetch()` call (provider/root layout, event-driven mount side effect)

**Analog:** `src/feedback/ReportFeedbackModal.tsx` lines 1, 51-68 — closest existing `useEffect`-on-mount/visibility pattern in the codebase (there is no other root-level side-effect file to copy from; this is the only `useEffect` usage in the repo).

**Current full file** (5 lines):
```typescript
import { Stack } from "expo-router";

export default function RootLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
```

**`useEffect`-on-mount idiom to mirror** (from `ReportFeedbackModal.tsx` lines 1, 51-68 — adapted: that one has cleanup/timer logic this phase doesn't need, since `prefetch()` is fire-and-forget and `resolveVerbs()` memoizes internally per Phase 7 D-05):
```typescript
import { useEffect } from "react";
// ...
useEffect(() => {
  prefetch();
}, []);
```

**Target pattern** (per D-04, Claude's discretion — `useEffect` on mount is the straightforward choice, matching Phase 7's own suggested integration point and the only side-effect convention already present in the app):
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
`prefetch()` itself (see `src/dataset/source.ts` lines 18-22) is synchronous-looking but kicks off the internal async `resolve()` and memoizes it in module-level `cachedResult` — calling it here does not block the initial render, satisfying D-04's "doesn't block the initial render" requirement without needing `await` or additional state.

---

## Shared Patterns

### Async button loading-state (local component state, not store status)
**Source:** `src/feedback/ReportFeedbackModal.tsx` lines 43-45 (`state` local `useState`), 70-97 (`handleSubmit` async wrapper), 99 (`isSubmitting` derived flag), 161-171 (button `disabled` + label/spinner swap)
**Apply to:** `app/index.tsx`'s Start button, `app/results.tsx`'s Try Again button
**Why not store-level:** D-03 explicitly keeps `QuizStatus` at 4 values — the loading flag must live in each screen's local state, not `useQuizStore`, matching how `ReportFeedbackModal.tsx` already keeps its own `ModalState` local rather than pushing "submitting" into a shared store.

### Await-then-check-status navigation guard
**Source:** `app/index.tsx` lines 31-38 and `app/results.tsx` lines 26-36 (current, both to be fixed identically)
**Apply to:** Both files — same fix, same shape: `await startQuiz(...)` then read `useQuizStore.getState().status` synchronously on the next line (this read-after-await is fine since `set()` inside `startQuiz` has already resolved by the time the awaited promise settles), then conditionally `router.replace(...)`.

### Fetch-once memoized resolver, safe to call repeatedly
**Source:** `src/dataset/source.ts` lines 7, 18-29 (`cachedResult` module-level promise, `prefetch()`/`resolveVerbs()` both reuse it)
**Apply to:** `src/store/useQuizStore.ts`'s `startQuiz()` — no new caching/dedup logic needed there; every `startQuiz()` call can safely `await resolveVerbs()` even if `prefetch()` already kicked it off in `app/_layout.tsx`, since both hit the same memoized promise.

## No Analog Found

None — every file in scope has at least a role-match or exact analog above. `ReportFeedbackModal.tsx` is notably the *only* existing async-handler-with-loading-button pattern in the repo, so it is reused across three of the four files being modified; there is no second independent analog to cross-check it against.

## Metadata

**Analog search scope:** `app/`, `src/store/`, `src/feedback/`, `src/dataset/`, `src/quiz/`
**Files scanned:** `src/store/useQuizStore.ts`, `app/index.tsx`, `app/results.tsx`, `app/_layout.tsx`, `app/quiz.tsx`, `src/dataset/source.ts`, `src/dataset/remote.ts`, `src/quiz/engine.ts`, `src/feedback/ReportFeedbackModal.tsx`, `src/feedback/submit.ts`
**Pattern extraction date:** 2026-07-14
