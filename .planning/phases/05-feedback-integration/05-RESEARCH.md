# Phase 5: Feedback Integration - Research

**Researched:** 2026-07-12
**Domain:** First outbound network call in an Expo/React Native app (fetch + AbortController), Zod payload validation against a locked cross-repo contract, React Native `Modal` UX, and jest-expo network testing
**Confidence:** HIGH (stack/versions, existing-code patterns), MEDIUM (fetch/AbortController Hermes behavior, jest fetch-mocking patterns), LOW (live round-trip cold-start timing — must be verified during execution, not research)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** The "Report a problem" affordance lives on the Quiz screen (`app/quiz.tsx`), not the Results screen. Feedback is about the specific question the learner is looking at right now, so it needs live access to that question's `verb`/`tense`/`subject`/`correctAnswer` plus the learner's `selectedAnswer`.
- **D-02:** The button only appears/becomes usable once the answer is locked (i.e. `lockedChoice !== null` in the existing quiz store) — `selectedAnswer` is a required field on the locked backend contract, so there is no valid state to submit feedback before the learner has answered the current question.
- **D-03:** Tapping "Report a problem" opens a modal/sheet containing: a short preset reason picker (**Wrong answer / Typo or spelling / Confusing wording / Other**) and a free-text message input (maps to the backend's single `message` field — combine the preset reason + free text into one string; exact string composition left to planner/implementer as long as the reason is legible in the submitted message).
- **D-04:** Submission is a blocking modal interaction: once the user taps submit, the modal shows an inline spinner and disables further input *within the modal* until the request resolves. This does NOT block the quiz underneath — the Quiz screen and its state remain fully interactive/untouched while the modal is open (FDBK-03). Dismissing the modal mid-request is an implicit cancel from the UI's perspective (in-flight request may still complete in background) — exact cancel/AbortController wiring is implementer's discretion.
- **D-05 (Success / 201):** Show a brief success message with a checkmark inside the modal, auto-dismiss after ~1.5 seconds, returning the learner to the (still untouched) Quiz screen.
- **D-06 (400 / ValidationError):** Show a generic "Something went wrong, try again" message. Do NOT parse or surface the `fields` object — a 400 here should only ever indicate an app-side payload-mapping bug, not a learner-fixable input error. No Retry button per UI-SPEC (user may edit and re-tap Submit manually).
- **D-07 (500 / InternalServerError):** Same generic error message as 400, plus a **Retry** button. Modal stays open, preserves the learner's already-entered reason + message text.
- **D-08 (Network error / timeout):** Treat identically to 500 (generic error + Retry, modal stays open, input preserved).
- **D-09 (Timeout threshold):** Client-side request timeout is **~90 seconds** — covers the backend's documented cold-start window (up to ~1 min) with headroom. Implement via `AbortController` with native `fetch`, no axios.

### Claude's Discretion

- Exact visual layout of the report modal/sheet (native `Modal` vs custom bottom-sheet overlay, spacing, typography, colors) — **now locked by 05-UI-SPEC.md** (approved), which specifies native RN core primitives, exact colors/spacing/copy. Treat UI-SPEC as authoritative for all visual decisions; this section is superseded by it.
- Exact string composition combining the preset reason + free-text message into the single backend `message` field.
- Where the feedback-submission logic lives in the file tree — follow the existing `app/` routes-only + `src/<domain>/` logic convention (Phase 1 D-02). Recommend `src/feedback/`.
- `appVersion` sourcing — prefer `Constants.expoConfig?.version` (via `expo-constants`, already an installed dependency — see Standard Stack below) over adding `expo-application`.
- `platform` field — derive from React Native's `Platform.OS` at submission time (`"ios" | "android"`), not hardcoded `"ios"`.

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.

</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| FDBK-01 | User can submit in-app feedback (message + verb/tense/subject/correctAnswer/selectedAnswer context) via `POST /feedback` to the live backend | Standard Stack (fetch + Zod), Code Examples (`submitFeedback`, `buildFeedbackPayload`), Architecture Patterns (`src/feedback/` module split) |
| FDBK-02 | Feedback submission handles success (201), validation error (400), server error (500), and network/cold-start delay gracefully | Code Examples (status-branching `submitFeedback` result type), Common Pitfalls (Hermes AbortController caveats, cold-start timing), Architectural Responsibility Map |
| FDBK-03 | Feedback submission failure never blocks or interrupts quiz completion | Architecture Patterns (modal-local async, Quiz screen never awaits), Don't Hand-Roll (no global loading/error state coupling to quiz store) |
| FDBK-04 | Feedback payload mapping (UI labels → locked backend enum literals for tense/subject/platform) is unit-tested | Validation Architecture section, Code Examples (Zod schema + payload builder tests), Runtime verification: Tense/Subject literals already confirmed identical to backend contract (see below) |

</phase_requirements>

## Summary

This phase adds the app's first-ever outbound network call. The codebase already has everything needed pre-installed: `zod@4.4.3` and `expo-constants@57.0.3` are already dependencies (confirmed via `package.json`), so **no new packages need to be added** for the core implementation. `src/dataset/types.ts`'s `Tense`/`Subject` literal unions (`present_indicative | preterite | imperfect | future` and `eu | tu | ele_ela | nos | voces | eles_elas`) are byte-for-byte identical to the backend contract documented in CLAUDE.md — the cross-repo risk CLAUDE.md flags is a non-issue at the type level; the only remaining verification is the live round-trip call itself (network reachability, cold-start timing, actual response shape), which cannot be resolved by research and must happen during execution.

The critical technical risk in this phase is not the payload shape (already solved) but React Native's `fetch`/`AbortController` implementation on Hermes. Multiple independent sources confirm `AbortSignal.timeout()` is not implemented in Hermes/RN, and a still-open React Native issue (facebook/react-native#50015, opened 2025, "Newer Patch Available" as of search) documents cases where `abortController.abort()` does not actually cancel an in-flight `fetch`. The ~90s timeout (D-09) must therefore be implemented manually with `setTimeout` + `controller.abort()`, and the plan must not assume `abort()` reliably cancels the underlying request — treat abort as "stop waiting for it, but the network layer may still complete in the background," which is exactly what D-04's "implicit cancel" language already anticipates. This is a fortunate alignment: the UX decision already tolerates the technical reality.

**Primary recommendation:** Build a `src/feedback/` module with three pure, independently-testable pieces — a Zod schema mirroring the backend contract (`feedbackPayload.ts`), a pure payload-builder function mapping quiz-question state + form input to that schema's shape, and a `submitFeedback()` function wrapping `fetch` with manual `setTimeout`-based abort and status-code branching returning a discriminated-union result type (`{status: "success", data} | {status: "validation-error"} | {status: "server-error"} | {status: "network-error"}`). Keep this module UI-framework-agnostic (no RN imports beyond `Platform.OS` at the call site) so it's testable with plain Jest, and wire the modal (per approved UI-SPEC) to call it without ever touching `useQuizStore`.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Report-problem trigger + modal UI (form, spinner, success/error states) | Client (React Native component) | — | Pure presentation, per approved UI-SPEC; no server/API involvement |
| Payload construction (map quiz state + form input → backend enum literals) | Client (pure TS module, `src/feedback/`) | — | Deterministic mapping, no side effects, must be unit-testable without RN rendering |
| Payload validation (Zod schema mirroring backend contract) | Client (pure TS module) | — | Defense-in-depth client-side check before network call; backend re-validates independently (out of this repo's scope) |
| Network transport (`fetch` + `AbortController` + timeout) | Client (pure TS module) | — | No backend code changes in this phase; backend `POST /feedback` already shipped and locked |
| `POST /feedback` request validation, persistence, response shaping | API / Backend (`portuguese-verb-api`, external repo) | Database (Supabase, via backend only) | Explicitly out of scope for this repo per CLAUDE.md — mobile app never touches Supabase directly |
| Quiz session state (`session`, `currentIndex`, `lockedChoice`) | Client (existing `useQuizStore`) | — | Read-only dependency for this phase; feedback module must not mutate or subscribe in a way that couples quiz lifecycle to network lifecycle (violates FDBK-03 if done wrong) |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `zod` | 4.4.3 (already installed — `npm view zod version` confirms `4.4.3` is current on registry) [VERIFIED: npm registry] | Validate the outbound `POST /feedback` payload against the backend's locked Zod contract before sending | Already the project's chosen validation library (CLAUDE.md, locked); reuse for this phase's `feedbackPayload.ts` schema rather than hand-writing type guards |
| Native `fetch` (global, ships with Hermes/RN 0.86.0) | N/A, bundled | The single outbound `POST /feedback` call | No dependency needed; RN 0.86 (bundled with Expo SDK 57, confirmed in `package.json`) ships a global `fetch`. Do not add axios — single unauthenticated POST, no interceptor need (already decided in CLAUDE.md's embedded stack research) |
| `expo-constants` | 57.0.3 (already installed — `npm view expo-constants version` confirms `57.0.3` is current) [VERIFIED: npm registry] | Read `Constants.expoConfig?.version` for the `appVersion` payload field | Already a dependency (`package.json`); no install step needed. Confirmed API shape unchanged for SDK 57 [CITED: docs.expo.dev/versions/latest/sdk/constants/] |
| RN core `Platform` (from `react-native`, no install) | bundled with `react-native@0.86.0` | Derive `platform: "ios" | "android"` at submission time via `Platform.OS` | Already available; no new dependency. Matches CONTEXT.md discretion note (don't hardcode `"ios"`) |
| RN core `Modal` (from `react-native`, no install) | bundled with `react-native@0.86.0` | Report-problem modal/sheet container | UI-SPEC confirms: "plain `Pressable`/`View`/`Text`/`Modal`/`Switch` from `react-native` core, no third-party UI kit" — this is locked, not open for research |

### Supporting

No new supporting libraries are needed. Every dependency this phase touches (`zod`, `expo-constants`, `react-native` core `fetch`/`Platform`/`Modal`) is already installed and pinned in `package.json`. This phase should not add `axios`, `expo-application`, `expo-sharing`, `react-native-share`, or `@react-native-async-storage/async-storage` — all explicitly ruled out by CLAUDE.md's embedded stack research for reasons that still apply unchanged (single unauthenticated call, no persistence, plain-text/JSON only, no file sharing involved).

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Manual `setTimeout` + `controller.abort()` for the 90s timeout | `AbortSignal.timeout(90000)` | `AbortSignal.timeout()` is not implemented in Hermes as of current RN — confirmed by multiple community reports [CITED: github.com/facebook/react-native/issues/42042]. Do not use it; it will throw `TypeError: AbortSignal.timeout is not a function` at runtime on-device even though it may work in a Node-based Jest environment, producing a false-positive test. |
| `expo-application`'s native build-number APIs | `Constants.expoConfig?.version` | Only worth adding if a future phase needs the native build number (not the semver `version` string) — not needed here, matches CONTEXT.md discretion note |
| Native `Modal` | `react-native-community/hooks` bottom-sheet or a custom `Animated`-driven sheet | UI-SPEC already locked this to native `Modal`; a custom sheet would add complexity with zero UI-SPEC-mandated benefit |

**Installation:**
No installation required — all packages needed for this phase are already present in `package.json`. Do not run `npm install` for zod/expo-constants; they are already there.

**Version verification:** Confirmed live against npm registry (2026-07-12):
```
npm view zod version              → 4.4.3 (matches installed ^4.4.3)
npm view expo-constants version   → 57.0.3 (matches installed ~57.0.3)
npm view expo-application version → 57.0.0 (NOT used this phase, listed for completeness since CONTEXT.md discretion note references it as an alternative)
```

## Package Legitimacy Audit

No new external packages are being installed in this phase — every library touched (`zod`, `expo-constants`, `react-native` core) is already present in `package.json` from prior phases. The Package Legitimacy Gate protocol (slopcheck, registry verification, postinstall-script check) applies to *newly introduced* packages; since none are introduced here, this audit is a no-op.

| Package | Registry | Age | Downloads | Source Repo | slopcheck | Disposition |
|---------|----------|-----|-----------|-------------|-----------|-------------|
| `zod` | npm | already vetted (Phase 1/2 setup) | very high | github.com/colinhacks/zod | not re-run (pre-existing dependency) | Approved — pre-existing |
| `expo-constants` | npm | already vetted (Expo SDK template) | very high | github.com/expo/expo | not re-run (pre-existing dependency) | Approved — pre-existing |

**Packages removed due to slopcheck [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

If the planner or implementer later decides to add any package not already in `package.json` (e.g. a bottom-sheet library, a toast library), it MUST go through the full Package Legitimacy Gate before being added to a plan — this audit does not pre-clear anything not listed above.

## Architecture Patterns

### System Architecture Diagram

```
[Quiz screen: app/quiz.tsx]
        │  (question context: verb/tense/subject/correctAnswer,
        │   lockedChoice=selectedAnswer, both read-only from useQuizStore)
        ▼
[Report modal component — new, e.g. app/quiz.tsx-local state or src/feedback/ReportModal.tsx]
        │  user picks reason + types free text, taps "Submit feedback"
        ▼
[buildFeedbackPayload()  — src/feedback/payload.ts, pure function]
        │  maps {reason, message, verb, tense, subject, correctAnswer,
        │        selectedAnswer, appVersion, platform} → FeedbackPayload
        ▼
[FeedbackPayload Zod schema — src/feedback/schema.ts]
        │  .safeParse() — client-side shape check before network call
        ▼
[submitFeedback() — src/feedback/submit.ts]
        │  fetch(POST https://portuguese-verb-api.onrender.com/feedback,
        │        AbortController with manual 90s setTimeout)
        ▼
   ┌────┴─────┬─────────────┬──────────────┐
   ▼          ▼             ▼              ▼
 201        400           500        network/timeout/abort
success   validation-err  server-err   network-err
   │          │             │              │
   └──────────┴─────────────┴──────────────┘
                    ▼
     [Modal renders result: success checkmark (auto-dismiss)
      OR generic error text (+ Retry button for 500/network only)]
                    │
                    ▼
     [Quiz screen underneath — untouched throughout, no re-render
      triggered by feedback state, no useQuizStore mutation]
```

### Recommended Project Structure
```
src/feedback/
├── types.ts          # FeedbackPayload interface, FeedbackReason union, SubmitResult discriminated union
├── schema.ts          # Zod schema mirroring the backend's locked contract exactly
├── payload.ts          # buildFeedbackPayload(question, selectedAnswer, reason, message) -> FeedbackPayload (pure)
├── submit.ts          # submitFeedback(payload) -> Promise<SubmitResult>, owns fetch + AbortController + timeout
└── reasons.ts          # FEEDBACK_REASONS list + reason-to-message-prefix mapping (D-03 composition)

app/quiz.tsx           # adds trigger button + <ReportFeedbackModal /> (or inline modal JSX), reads
                        # session.questions[currentIndex] + lockedChoice, passes down as props — no store mutation

__tests__/
├── feedback-schema.test.ts    # Zod schema round-trips for every tense × subject × platform combination
├── feedback-payload.test.ts   # buildFeedbackPayload mapping correctness (FDBK-04)
└── feedback-submit.test.ts    # submitFeedback branches: 201/400/500/network-error/timeout, mocked fetch
```

This mirrors the existing `src/quiz/` split (`engine.ts`/`labels.ts`/`random.ts`/`scoring.ts`/`share.ts`/`types.ts`) — small, single-responsibility, framework-agnostic modules, each independently unit-testable with plain Jest and no RN rendering, consistent with Phase 1 D-02's `app/` routes-only + `src/<domain>/` logic convention.

### Pattern 1: Manual timeout via `setTimeout` + `AbortController` (not `AbortSignal.timeout`)
**What:** Hermes does not implement `AbortSignal.timeout()`. Build the timeout by hand.
**When to use:** Any RN fetch call needing a timeout — this is the only viable pattern for D-09's 90s threshold.
**Example:**
```typescript
// Source: community-verified pattern, cross-referenced against
// facebook/react-native#42042 (AbortSignal.timeout not implemented in Hermes)
// and facebook/react-native#50015 (abort() may not fully cancel the underlying request)
async function submitFeedback(payload: FeedbackPayload): Promise<SubmitResult> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 90_000);

  try {
    const response = await fetch("https://portuguese-verb-api.onrender.com/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    if (response.status === 201) {
      const data = await response.json();
      return { status: "success", data };
    }
    if (response.status === 400) {
      return { status: "validation-error" };
    }
    // Any other non-2xx (including 500) collapses to the same UX per D-07/D-08
    return { status: "server-error" };
  } catch {
    // Covers both real network failures AND the abort case (controller.abort()
    // rejects the fetch promise with an AbortError-like rejection) — both map
    // to the same "network-error" UX per D-08. Do not try to distinguish
    // abort-due-to-timeout from abort-due-to-modal-dismiss from a genuine
    // network failure; the UX is identical for all three per CONTEXT.md.
    return { status: "network-error" };
  } finally {
    clearTimeout(timeoutId);
  }
}
```

### Pattern 2: Modal-local async state, never touching `useQuizStore`
**What:** All submit/loading/error/success state for the feedback flow lives in the modal component's own `useState`, not in Zustand.
**When to use:** This phase, specifically to satisfy FDBK-03 — the quiz store must never gain a `feedbackStatus` field or similar, because that would create an implicit coupling where a quiz-screen re-render could depend on network state.
**Example:**
```typescript
// Source: derived from existing Quiz screen pattern (app/quiz.tsx already
// keeps quiz-progression state in useQuizStore and would-be transient UI
// state, like choiceStyle(), as local computation — same principle applies)
function ReportFeedbackModal({ visible, question, selectedAnswer, onClose }: Props) {
  const [reason, setReason] = useState<FeedbackReason>("wrong_answer");
  const [message, setMessage] = useState("");
  const [state, setState] = useState<"idle" | "submitting" | "success" | "error">("idle");

  async function handleSubmit() {
    setState("submitting");
    const payload = buildFeedbackPayload(question, selectedAnswer, reason, message);
    const result = await submitFeedback(payload);
    if (result.status === "success") {
      setState("success");
      setTimeout(onClose, 1500); // D-05 auto-dismiss
    } else {
      setState("error"); // reason/message preserved in local state — D-07/D-08
    }
  }
  // ...
}
```

### Anti-Patterns to Avoid
- **Awaiting `submitFeedback()` on the Quiz screen's render path or in `handleAdvance()`:** Would violate FDBK-03 directly — the "Next" button flow must never depend on feedback network state. Keep the modal's submit handler entirely self-contained.
- **Using `AbortSignal.timeout()`:** Throws at runtime on Hermes (confirmed community issue). Tests using Node's fetch polyfill (undici, in a Jest environment) may pass even though this fails on-device — a classic "works in Jest, fails on iOS" trap for this exact API.
- **Treating a 400 the same as a 500 in terms of Retry visibility:** UI-SPEC explicitly differentiates — no Retry button on 400 (D-06), Retry button on 500/network (D-07/D-08). Don't collapse the discriminated union type down to a boolean "isError" — keep the four-way status.
- **Parsing/surfacing the backend's `fields` object on 400:** D-06 explicitly forbids this. The `SubmitResult` discriminated union for `validation-error` should not even carry the `fields` payload through to the UI layer — drop it at the `submit.ts` boundary.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Payload shape validation against backend contract | Manual `if (typeof x === "string")` chains | `zod` schema + `.safeParse()` | Already the project's standard (locked); gives compile-time `z.infer` types and runtime validation from one source of truth, exactly like the dataset validation in Phase 2 |
| Fetch timeout | A hand-rolled `Promise.race([fetch(...), timeoutPromise])` | `AbortController` + manual `setTimeout(() => controller.abort(), 90000)` | `Promise.race` alone doesn't actually cancel the in-flight request (the fetch keeps running even after the race "loses"), whereas `AbortController` at least signals cancellation intent to the RN networking layer even given the caveats in facebook/react-native#50015 |
| Preset-reason-to-message string composition | A generic i18n/templating library | A small hardcoded lookup object (`{wrong_answer: "Wrong answer", ...}`) + simple string concatenation | Only 4 fixed preset strings, no localization requirement in v0 scope — a templating library is pure overkill |
| Version string retrieval | Reading `app.json`/`package.json` directly at runtime | `Constants.expoConfig?.version` | `expo-constants` is the sanctioned Expo API for this; direct `package.json` imports don't work reliably in RN bundles and `app.json` isn't guaranteed to be bundled at runtime |

**Key insight:** Every piece of this phase already has a project-locked, pre-installed tool (Zod for validation, native fetch for transport, expo-constants for version, RN core Modal for UI). The only genuinely novel code is the timeout/abort wiring and the discriminated-union result type — everything else is composition, not invention.

## Common Pitfalls

### Pitfall 1: `AbortSignal.timeout()` silently fails only on-device
**What goes wrong:** Code using `AbortSignal.timeout(90000)` passes in Jest (Node's fetch polyfill supports it) but throws `TypeError: AbortSignal.timeout is not a function` when run on an actual iOS device/simulator with Hermes.
**Why it happens:** Hermes's JS engine + RN's fetch polyfill do not implement the full `AbortSignal` static API surface as of the current RN release [CITED: github.com/facebook/react-native/issues/42042].
**How to avoid:** Always use the manual `setTimeout` + `controller.abort()` pattern (Pattern 1 above). Never use `AbortSignal.timeout()`, `AbortSignal.any()`, or other newer `AbortSignal` static methods in RN code, even if they typecheck.
**Warning signs:** TypeScript compiles fine (the DOM lib types include these methods), Jest tests pass, but the app crashes/throws only when actually run via `expo start --ios` or a simulator/device build. This is exactly why a live round-trip test (per CONTEXT.md's canonical refs) is non-negotiable for this phase — unit tests alone cannot catch this class of bug.

### Pitfall 2: `controller.abort()` may not actually cancel the underlying network request
**What goes wrong:** Calling `abort()` after the timeout fires (or when the modal is dismissed) causes the `fetch` promise to reject client-side, but the actual HTTP request may continue in flight on the native networking layer — a still-open RN issue as of the current release [CITED: github.com/facebook/react-native/issues/50015].
**Why it happens:** RN's fetch implementation bridges to native `URLSession`/`OkHttp`, and abort signal propagation to that native layer has known gaps.
**How to avoid:** Design the UX (already done correctly in D-04/D-08) to treat "abort" as "the UI stops waiting," not "the request definitely stopped." Do not build any UI/logic that assumes a dismissed/timed-out request is guaranteed to have zero server-side effect — e.g., don't show "request cancelled" messaging that implies certainty the backend never received it. The backend may still persist a feedback row even after the client gives up waiting; this is acceptable (duplicate/late feedback rows are a backend-side non-issue, not something this phase needs to prevent).
**Warning signs:** None directly observable client-side — this is a "design around it" pitfall, not a "detect and fix" one.

### Pitfall 3: Coupling feedback state to `useQuizStore` breaks FDBK-03
**What goes wrong:** A tempting shortcut is to add a `feedbackStatus`/`isSubmittingFeedback` field to the existing Zustand store so it's "available everywhere." This creates a re-render dependency between quiz progression and network state.
**Why it happens:** Zustand makes adding fields to an existing store trivially easy, so it's the path of least resistance even when architecturally wrong.
**How to avoid:** Keep all feedback-modal state (`reason`, `message`, submit status) in local `useState` inside the modal component (Pattern 2). The store stays read-only for this phase, exactly as CONTEXT.md's Integration Points section specifies.
**Warning signs:** Any diff touching `src/store/useQuizStore.ts` in this phase's plan should be treated as a red flag and re-checked against D-04/FDBK-03.

### Pitfall 4: Testing `fetch` timeout/abort behavior with real timers is slow and flaky
**What goes wrong:** A naive test that actually waits 90 real seconds for the timeout to fire makes the test suite unbearably slow (or gets skipped/flakes in CI).
**Why it happens:** `setTimeout(fn, 90000)` really does wait 90 real seconds unless Jest's fake timers are engaged.
**How to avoid:** Use `jest.useFakeTimers()` + `jest.advanceTimersByTime(90000)` in the timeout-specific test, combined with a mocked `global.fetch` that never resolves on its own (simulating a hung cold-start request) so the test can assert the abort actually fires at the 90s mark without real wall-clock delay [CITED: jestjs.io/docs/timer-mocks].
**Warning signs:** A test file for `submit.ts` that takes noticeably longer than the rest of the suite to run, or any `sleep`/real `setTimeout` calls inside a test.

## Code Examples

### Zod schema mirroring the locked backend contract
```typescript
// Source: CLAUDE.md "Key Domain Facts" §POST /feedback request contract (locked, cross-repo)
import { z } from "zod";

export const feedbackPayloadSchema = z.object({
  message: z.string().min(1),
  verb: z.string().min(1),
  tense: z.enum(["present_indicative", "preterite", "imperfect", "future"]),
  subject: z.enum(["eu", "tu", "ele_ela", "nos", "voces", "eles_elas"]),
  correctAnswer: z.string().min(1),
  selectedAnswer: z.string().min(1),
  appVersion: z.string().min(1),
  platform: z.enum(["ios", "android"]),
});

export type FeedbackPayload = z.infer<typeof feedbackPayloadSchema>;
```
Note: these enum literals are copy-verified against `src/dataset/types.ts`'s `Tense`/`Subject` unions — both already match exactly, confirmed by direct file read during this research session, not just CLAUDE.md's assertion.

### Payload builder (pure, unit-testable without RN)
```typescript
// Source: derived from CONTEXT.md D-03 (preset reason + free text → single message field)
import type { Tense, Subject } from "../dataset/types";
import type { FeedbackReason } from "./types";

const reasonLabels: Record<FeedbackReason, string> = {
  wrong_answer: "Wrong answer",
  typo: "Typo or spelling",
  confusing: "Confusing wording",
  other: "Other",
};

export function buildFeedbackPayload(params: {
  verb: string;
  tense: Tense;
  subject: Subject;
  correctAnswer: string;
  selectedAnswer: string;
  reason: FeedbackReason;
  freeText: string;
  appVersion: string;
  platform: "ios" | "android";
}): FeedbackPayload {
  const label = reasonLabels[params.reason];
  const message = params.freeText.trim()
    ? `${label}: ${params.freeText.trim()}`
    : label;

  return {
    message,
    verb: params.verb,
    tense: params.tense,
    subject: params.subject,
    correctAnswer: params.correctAnswer,
    selectedAnswer: params.selectedAnswer,
    appVersion: params.appVersion,
    platform: params.platform,
  };
}
```

### `appVersion` + `platform` sourcing at the call site
```typescript
// Source: Context7/official docs — https://docs.expo.dev/versions/latest/sdk/constants/
import Constants from "expo-constants";
import { Platform } from "react-native";

const appVersion = Constants.expoConfig?.version ?? "unknown";
const platform: "ios" | "android" = Platform.OS === "android" ? "android" : "ios";
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|---------------|--------|
| `AbortController` polyfills (e.g. `abort-controller` npm package) for RN | Native `AbortController` global, ships with RN's fetch polyfill | RN long since bundled its own `AbortController`; no polyfill package needed | Do not add `abort-controller` as a dependency — it's redundant and was historically needed for much older RN versions, not RN 0.86 |
| `AsyncStorage`-backed retry queues for flaky mobile networks | Not applicable to this phase's scope | N/A | CONTEXT.md/PROJECT.md explicitly scope this to "no persistence" — a failed feedback submission is simply lost if the user doesn't retry; no offline queue is in scope for v0 |

**Deprecated/outdated:** None specific to this phase's stack — Zod 4, expo-constants 57.x, and native fetch are all current.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `expo-application@57.0.0` is the correct current version if ever needed later | Standard Stack | Low — not used this phase, informational only; verified via `npm view` but package name itself is `[ASSUMED]` per provenance rule (recalled from training/CLAUDE.md, not looked up via Context7/official docs page) |
| A2 | facebook/react-native#50015 ("abort() doesn't actually cancel fetch") remains unresolved as of RN 0.86 | Common Pitfalls, Pattern 1 | Medium — if actually fixed in 0.86, the "design around it" guidance is overly conservative but still harmless (it doesn't prevent correct behavior, just avoids relying on a guarantee). Recommend a quick manual on-device check during execution: trigger a submit, abort it via timeout/dismiss, and check Render's request logs for whether the request actually stopped. |
| A3 | Expo/RN's fetch polyfill on Hermes does not implement `AbortSignal.timeout()` | Common Pitfalls, Pattern 1 | Medium — sourced from WebSearch of a GitHub issue (facebook/react-native#42042), not directly fetched/read in full; if this has since been fixed, the manual setTimeout pattern is still valid (just not strictly required) — no downside to following the more defensive pattern regardless |

**Note on provenance:** All three assumptions above are flagged because they rely on WebSearch summaries of GitHub issues rather than a full fetch-and-read of the issue threads or official RN release notes. Given they only affect *how conservatively* the timeout is implemented (not whether the core FDBK requirements can be met), the risk is bounded — worst case, the plan includes a slightly more defensive pattern than strictly necessary.

## Open Questions

1. **Does the live backend's cold-start actually resolve within 90 seconds in practice?**
   - What we know: STATE.md's blocker note says cold starts can take "up to ~1 min," and D-09 sets the client timeout at ~90s specifically to give headroom over that documented figure.
   - What's unclear: The actual observed cold-start latency against the live `https://portuguese-verb-api.onrender.com/feedback` endpoint today — Render free-tier cold-start times can vary and may exceed 1 minute under some conditions.
   - Recommendation: CONTEXT.md's canonical refs already flag this — the plan MUST include an explicit task to perform a live round-trip test against the deployed backend during this phase (not deferred to Phase 6, which is reserved for the *final* manual cold-start test). Treat this as the actual verification step for both the payload-shape assumption and the timeout-threshold assumption.

2. **Is there a maximum length or format constraint on the backend's `message` field?**
   - What we know: CLAUDE.md documents the field as a plain string, Zod-validated on the backend, but does not document a max length.
   - What's unclear: Whether an extremely long free-text message (unlikely but possible) could trigger a 400 the client didn't anticipate.
   - Recommendation: Not blocking — D-06 already specifies generic 400 handling regardless of cause. No client-side max-length enforcement needed for v0; if it becomes an issue, it surfaces as a generic "something went wrong" which is an acceptable UX per the locked decisions.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Live backend (`https://portuguese-verb-api.onrender.com/feedback`) | FDBK-01/02 live round-trip verification | Not verified in this research session (no outbound network probe performed — research tooling has no way to hit this from this session) | — | Plan must include an explicit execution-time task to curl/fetch this endpoint and confirm 201/400/500 behavior before considering the phase done |
| Node.js/npm (for `npm view` verification) | Standard Stack version checks | Yes | confirmed via successful `npm view` calls this session | — |
| `zod`, `expo-constants`, `react-native` (installed) | Core implementation | Yes | 4.4.3 / 57.0.3 / 0.86.0 | — |

**Missing dependencies with no fallback:**
- None — but the live backend reachability check itself is unverified by this research session and must be the first execution-time task, per CONTEXT.md's own emphasis on this point.

**Missing dependencies with fallback:**
- None.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest 30.x via `jest-expo@57.0.1` preset (confirmed in `package.json`: `"jest": { "preset": "jest-expo" }`) |
| Config file | `package.json` (`jest` key) — no standalone `jest.config.js` |
| Quick run command | `npm test -- __tests__/feedback-schema.test.ts __tests__/feedback-payload.test.ts` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| FDBK-01 | Payload builder maps quiz-question context + form input to the correct `FeedbackPayload` shape | unit | `npm test -- __tests__/feedback-payload.test.ts` | ❌ Wave 0 |
| FDBK-02 | `submitFeedback` returns `{status: "success"}` on mocked 201, `{status: "validation-error"}` on mocked 400, `{status: "server-error"}` on mocked 500, `{status: "network-error"}` on mocked fetch rejection and on simulated 90s timeout | unit | `npm test -- __tests__/feedback-submit.test.ts` | ❌ Wave 0 |
| FDBK-03 | Manual/smoke check: Quiz screen state (`currentIndex`, `lockedChoice`) is unaffected while the modal is open/submitting — cannot be meaningfully unit-tested without RN rendering; verify by code review (no `useQuizStore` writes anywhere in `src/feedback/` or the modal component) plus a manual on-device check during execution | manual-only | — (justification: requires actual RN rendering + timing to observe non-interruption; a unit test on pure functions can't prove a UI didn't block) | — |
| FDBK-04 | For every one of the 4 tenses × 6 subjects × 2 platforms (48 combinations), the Zod schema accepts the literal and `buildFeedbackPayload` maps it through unchanged | unit | `npm test -- __tests__/feedback-schema.test.ts` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npm test -- __tests__/feedback-*.test.ts`
- **Per wave merge:** `npm test` (full suite, includes existing quiz/dataset tests to catch regressions)
- **Phase gate:** Full suite green before `/gsd:verify-work`, plus the live round-trip check documented in Open Questions #1 (not a Jest test — a manual/scripted curl or in-app check against the real deployed backend)

### Wave 0 Gaps
- [ ] `__tests__/feedback-schema.test.ts` — covers FDBK-04 (schema round-trips for every tense/subject/platform combination)
- [ ] `__tests__/feedback-payload.test.ts` — covers FDBK-01, FDBK-04 (payload-builder mapping correctness, including the D-03 reason+freetext message composition)
- [ ] `__tests__/feedback-submit.test.ts` — covers FDBK-02 (mocked fetch: 201/400/500/network-error/timeout branches, using `jest.useFakeTimers()` for the 90s timeout case per Pitfall 4)
- [ ] No new test framework/config needed — `jest-expo` preset already fully covers this; existing `__tests__/` directory convention continues unchanged

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | No auth anywhere in this product (locked, both repos) |
| V3 Session Management | No | No sessions in this product |
| V4 Access Control | No | `POST /feedback` is a public, unauthenticated endpoint by design (backend-locked contract) |
| V5 Input Validation | Yes | Zod schema (`feedbackPayloadSchema`) validates outbound payload shape client-side before sending; backend independently re-validates (out of this repo's scope, already shipped) |
| V6 Cryptography | No | Plain HTTPS `fetch` to the deployed backend (already TLS-terminated by Render); no client-side crypto/secrets involved — no API keys, no Supabase credentials touch this repo (locked constraint, CLAUDE.md) |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Free-text `message` field used as an injection vector against the backend (e.g. script/SQL injection attempts) | Tampering | Out of scope for the mobile client to defend against — the backend's own Zod validation + (presumably) parameterized Supabase writes are the actual defense, already shipped and out of this repo's control. Client-side, simply pass the string through unmodified; do not attempt client-side sanitization/escaping, which would be redundant with backend validation and could corrupt legitimate user text. |
| Leaking internal error details to the user on 500 | Information Disclosure | Already mitigated by design — D-07/D-08 mandate a generic "Something went wrong" message with no attempt to parse/display `response.body` on non-201 responses. The backend's own contract also guarantees a 500 response body of just `{error: "InternalServerError"}` with no stack traces, so even if the client did display it, no internals would leak — but the client should not rely on that and should show generic copy regardless (defense in depth, and simpler code). |

## Sources

### Primary (HIGH confidence)
- Direct file reads this session: `package.json`, `src/dataset/types.ts`, `app/quiz.tsx`, `src/quiz/types.ts`, `src/quiz/share.ts`, `__tests__/quiz-share.test.ts` — confirms installed versions, existing patterns, and Tense/Subject literal match against CLAUDE.md's documented backend contract
- `npm view zod version` → `4.4.3`, `npm view expo-constants version` → `57.0.3`, `npm view expo-application version` → `57.0.0` — direct registry queries, run this session
- CLAUDE.md's embedded Technology Stack research section (already reviewed/locked prior to this session) — treated as HIGH confidence project-level source, not re-derived

### Secondary (MEDIUM confidence)
- https://docs.expo.dev/versions/latest/sdk/constants/ — official Expo Constants docs, WebSearch snippet only (not fully fetched), confirms `Constants.expoConfig?.version` API shape is unchanged for SDK 57
- https://jestjs.io/docs/timer-mocks — official Jest docs on fake timers, WebSearch snippet, standard pattern for testing setTimeout-based abort logic

### Tertiary (LOW confidence)
- https://github.com/facebook/react-native/issues/42042 — "AbortSignal.timeout is not a function" — WebSearch summary only, not fully read; flagged in Assumptions Log (A3)
- https://github.com/facebook/react-native/issues/50015 — "AbortSignal/AbortController doesn't work" — WebSearch summary only, "Newer Patch Available" label noted but exact fix version not confirmed; flagged in Assumptions Log (A2)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all packages already installed and version-verified directly against npm registry this session, zero new dependencies needed
- Architecture: HIGH — directly derived from existing, already-reviewed code (`app/quiz.tsx`, `src/quiz/` split) plus an approved UI-SPEC that already locks all visual decisions
- Pitfalls: MEDIUM — the Hermes/AbortController caveats are real and cross-referenced across multiple community sources, but not verified via a full read of the primary GitHub issue threads or official RN release notes (see Assumptions Log)

**Research date:** 2026-07-12
**Valid until:** 2026-08-11 (30 days — stack is stable/locked; re-verify only if RN or Expo SDK version bumps before this phase executes)
</content>
