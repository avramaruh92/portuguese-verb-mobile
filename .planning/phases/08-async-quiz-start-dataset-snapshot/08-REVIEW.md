---
phase: 08-async-quiz-start-dataset-snapshot
reviewed: 2026-07-14T00:00:00Z
depth: standard
files_reviewed: 5
files_reviewed_list:
  - src/store/useQuizStore.ts
  - __tests__/useQuizStore.test.ts
  - app/_layout.tsx
  - app/index.tsx
  - app/results.tsx
findings:
  critical: 2
  warning: 2
  info: 1
  total: 5
status: issues_found
---

# Phase 08: Code Review Report

**Reviewed:** 2026-07-14T00:00:00Z
**Depth:** standard
**Files Reviewed:** 5
**Status:** issues_found

## Summary

Reviewed the async quiz-start / dataset-snapshot changes: `useQuizStore`'s new async
`startQuiz`, its test suite, and the three screens that call it (`app/_layout.tsx`,
`app/index.tsx`, `app/results.tsx`). The store's dataset-snapshot behavior itself
(resolving verbs once per `startQuiz` call and generating from that snapshot) is
correctly implemented and well covered by the FETCH-04 tests. However, the store
deliberately re-throws unexpected (non-`InsufficientVerbsError`) errors to the
caller — confirmed by its own test ("startQuiz re-throws unexpected errors") — and
neither UI call site (`app/index.tsx`, `app/results.tsx`) has a `catch` for that
path, only a `finally`. That produces an unhandled promise rejection and a silent,
unrecoverable UI state on any unexpected `startQuiz` failure. `app/results.tsx`
also has no fallback UI when `session` is null, so the failure path (and any other
route into `/results` without an active session) renders a blank white screen with
no way to recover other than the OS back gesture.

## Critical Issues

### CR-01: `app/index.tsx` swallows no exceptions from `startQuiz` — unexpected errors become unhandled promise rejections with no user feedback

**File:** `app/index.tsx:32-44`
**Issue:** `useQuizStore.startQuiz` is documented and tested to re-throw any error that is not `InsufficientVerbsError` (see `__tests__/useQuizStore.test.ts:106-112`, "startQuiz re-throws unexpected errors"). `handleStartQuiz` awaits `startQuiz(...)` inside a `try { ... } finally { setStarting(false); }` block with no `catch`. If `generate()` or `resolveVerbs()` throws anything other than `InsufficientVerbsError` (e.g. a corrupt remote dataset causing `buildQuestion` to throw `Unknown verb "..." not found`), the exception propagates out of the `async` `onPress` handler as an unhandled promise rejection. The user sees no error message, the "Starting…" button state resets via `finally`, but the app gives no indication anything went wrong — it just silently fails to navigate.
**Fix:**
```tsx
async function handleStartQuiz() {
  if (!canStart || starting) return;
  setStarting(true);
  try {
    await startQuiz({ tenses: selectedTenses, includeIrregular });
    const nextStatus = useQuizStore.getState().status;
    if (nextStatus === "in-progress") {
      router.replace("/quiz");
    }
  } catch (error) {
    // surface unexpected errors instead of letting them become
    // unhandled promise rejections
    setUnexpectedError(String(error));
  } finally {
    setStarting(false);
  }
}
```

### CR-02: `app/results.tsx` has no error handling for `startQuiz` failures and renders a dead-end blank screen when `session` is null

**File:** `app/results.tsx:16, 28-44`
**Issue:** Two compounding problems:
1. `handleTryAgain` calls `await startQuiz(filters)` with no `catch`, same unhandled-rejection issue as CR-01. This is a realistic trigger for this phase specifically: `startQuiz` now snapshots the dataset per call, so if the remote dataset changes between the original quiz and "Try Again" (e.g., the previously-cached remote result becomes unavailable and falls back to a smaller local set) it is possible for the same `filters` that succeeded once to trip `InsufficientVerbsError` — that path is handled (state becomes `status: "error"`, `session: null`) — but any *unexpected* error is not caught here either.
2. Regardless of cause, once `startQuiz` sets `session: null` (either the handled `InsufficientVerbsError` branch or before an unexpected throw partially applies state), `Results` immediately hits `if (!session) return null;` (line 16) and renders nothing — no error text, no navigation, no way back except an OS-level back gesture. The component never reads `status` or `errorMessage` from the store at all, so it cannot distinguish "no quiz started yet" from "just failed to restart."
**Fix:**
```tsx
export default function Results() {
  const router = useRouter();
  const session = useQuizStore((s) => s.session);
  const status = useQuizStore((s) => s.status);
  const errorMessage = useQuizStore((s) => s.errorMessage);
  const answers = useQuizStore((s) => s.answers);
  const filters = useQuizStore((s) => s.filters);
  const startQuiz = useQuizStore((s) => s.startQuiz);
  const [starting, setStarting] = useState(false);

  if (!session) {
    // No completed session to show (fresh state, or Try Again failed) —
    // never render a blank screen, always give the user a way forward.
    return (
      <View style={styles.container}>
        {status === "error" && errorMessage ? (
          <Text style={styles.errorText}>{errorMessage}</Text>
        ) : null}
        <Pressable onPress={() => router.replace("/")} style={styles.backButton}>
          <Text style={styles.backButtonText}>Back to Setup</Text>
        </Pressable>
      </View>
    );
  }
  ...
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
      // if nextStatus === "error" the component now re-renders the
      // fallback branch above instead of going blank
    } catch (error) {
      // TODO: surface unexpected errors (e.g. toast/log) instead of
      // letting them become unhandled promise rejections
    } finally {
      setStarting(false);
    }
  }
  ...
}
```

## Warnings

### WR-01: `startQuiz`'s error branch leaves stale `currentIndex`/`answers`/`lockedChoice`/`filters` in place

**File:** `src/store/useQuizStore.ts:52-60`
**Issue:** On `InsufficientVerbsError`, only `status`, `errorMessage`, and `session` are reset; `currentIndex`, `answers`, and `lockedChoice` retain whatever values they had from a prior in-progress or completed quiz, and `filters` is not updated to the options that just failed. Nothing currently reads these stale fields while `status === "error"`, so there's no observed user-facing bug today, but it's a latent trap: any future code that reads `answers`/`currentIndex` without first checking `status` will see inconsistent data (e.g. a 10-item `answers` array next to a `null` `session`).
**Fix:**
```ts
if (error instanceof InsufficientVerbsError) {
  set({
    status: "error",
    errorMessage: INSUFFICIENT_VERBS_MESSAGE,
    session: null,
    filters: options,
    currentIndex: 0,
    answers: [],
    lockedChoice: null,
  });
  return;
}
```

### WR-02: `startQuiz` has no guard against concurrent/out-of-order invocations

**File:** `src/store/useQuizStore.ts:39-63`, `app/index.tsx:32-44`, `app/results.tsx:28-44`
**Issue:** `startQuiz` is an async action with no request-id/cancellation tracking. The only protection against double-invocation lives in the calling components' local `starting` React state (`if (!canStart || starting) return;` / `if (starting) return;`), which is set via `setStarting(true)` — a state update that is not guaranteed to be reflected before a second rapid tap/event is dispatched. If two `startQuiz` calls race (e.g. double-tap, or `resolveVerbs()` taking variable time due to the network fetch inside it), whichever call's `await resolveVerbs()` resolves last wins the final `set(...)`, even if it was the *first* call — silently discarding the more recent user intent and potentially double-firing `router.replace("/quiz")`.
**Fix:** Track an incrementing call token in the store and ignore stale resolutions:
```ts
let startToken = 0;
startQuiz: async (options) => {
  const token = ++startToken;
  try {
    const { verbs } = await resolveVerbs();
    if (token !== startToken) return; // superseded by a newer call
    const session = generate(options, undefined, verbs);
    set({ status: "in-progress", filters: options, session, currentIndex: 0, answers: [], lockedChoice: null, errorMessage: null });
  } catch (error) {
    if (token !== startToken) return;
    ...
  }
},
```

## Info

### IN-01: `handleShare` silently discards all share errors, including unexpected ones

**File:** `app/results.tsx:20-26`
**Issue:** `catch { /* Silently swallow share errors */ }` is intentional per the comment for the "user cancelled the share sheet" case, but it also swallows genuine failures (e.g. `Share.share` throwing due to a platform API error) with zero logging, making such failures unreportable/undebuggable in production.
**Fix:** Distinguish cancellation from real errors, or at minimum log unexpected ones:
```ts
async function handleShare() {
  try {
    await Share.share({ message: buildShareMessage(correct, total) });
  } catch (error) {
    if (__DEV__) console.warn("Share failed:", error);
  }
}
```

---

_Reviewed: 2026-07-14T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
