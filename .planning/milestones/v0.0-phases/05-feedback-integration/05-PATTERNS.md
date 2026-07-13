# Phase 5: Feedback Integration - Pattern Map

**Mapped:** 2026-07-13
**Files analyzed:** 9 (5 new `src/feedback/` modules, 1 modified screen, 3 new test files)
**Analogs found:** 9 / 9

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|--------------------|------|-----------|-----------------|----------------|
| `src/feedback/types.ts` | model | transform | `src/quiz/types.ts` | exact |
| `src/feedback/schema.ts` | model (validation) | transform | `src/dataset/validate.ts` | exact |
| `src/feedback/payload.ts` | utility | transform | `src/quiz/share.ts` (pure builder fn) | exact |
| `src/feedback/reasons.ts` | config/utility | transform | `src/quiz/labels.ts` (Record lookup table) | exact |
| `src/feedback/submit.ts` | service | request-response | none in-repo (first network call) — nearest shape is `src/quiz/engine.ts` (throws typed error) + RESEARCH.md Pattern 1 | role-match (external pattern) |
| `app/quiz.tsx` (modified — add trigger button + modal) | component/route | request-response + event-driven | `app/results.tsx` (Pressable action row + button style reuse) | exact |
| `__tests__/feedback-schema.test.ts` | test | transform | `__tests__/dataset.test.ts` (Zod schema round-trip over enum combinations) | exact |
| `__tests__/feedback-payload.test.ts` | test | transform | `__tests__/quiz-share.test.ts` (pure-function input/output test) | exact |
| `__tests__/feedback-submit.test.ts` | test | request-response | none in-repo (first fetch-mocking test) — follow RESEARCH.md's fake-timer + mocked-fetch guidance | no analog |

## Pattern Assignments

### `src/feedback/types.ts` (model, transform)

**Analog:** `src/quiz/types.ts` (9-33, read in full — file is 33 lines)

**Whole-file pattern to copy:**
```typescript
import type { Tense, Subject } from "../dataset/types";

export interface Triple {
  verb: string;
  tense: Tense;
  subject: Subject;
}

export interface Question extends Triple {
  choices: string[];
  correctAnswer: string;
}

export class InsufficientVerbsError extends Error {
  constructor(
    public readonly eligibleCount: number,
    public readonly required: number,
  ) {
    super(
      `Insufficient eligible questions: ${eligibleCount} available, ${required} required`,
    );
    this.name = "InsufficientVerbsError";
  }
}
```

**What to replicate:**
- Plain `interface`/`type` exports, no classes except for a typed Error subclass when a module needs one (not needed here, but shows the project's convention if `submit.ts` ever needs a custom error).
- Import shared domain types (`Tense`, `Subject`) from `../dataset/types` via relative path — no path aliases used anywhere in this codebase, keep that.
- For `src/feedback/types.ts`, define: `FeedbackReason` (`"wrong_answer" | "typo" | "confusing" | "other"`), `FeedbackPayload` (or re-export from `schema.ts` via `z.infer`), and `SubmitResult` discriminated union (`{status:"success", data:...} | {status:"validation-error"} | {status:"server-error"} | {status:"network-error"}`) per RESEARCH.md's Architecture Patterns section — mirror the flat, no-nesting interface style shown above.

---

### `src/feedback/schema.ts` (model/validation, transform)

**Analog:** `src/dataset/validate.ts` (1-44, read in full — file is 44 lines)

**Imports pattern (line 1):**
```typescript
import { z } from "zod";
```

**Core Zod-schema pattern (lines 3-24):**
```typescript
const SubjectConjugationsSchema = z.object({
  eu: z.string().min(1),
  tu: z.string().min(1),
  ele_ela: z.string().min(1),
  nos: z.string().min(1),
  voces: z.string().min(1),
  eles_elas: z.string().min(1),
});

export const VerbSchema = z.object({
  verb: z.string().min(1),
  translation: z.string().min(1),
  isIrregular: z.boolean(),
  conjugations: TenseConjugationsSchema,
});
```

**What to replicate for `feedbackPayloadSchema`:**
- Export the schema as a top-level `const`/`export const`, named `<Thing>Schema` (matches `VerbSchema` naming).
- Use `z.object({...})` with `.min(1)` on every required string field (no bare `z.string()` anywhere in this codebase's schemas — always constrained).
- Use `z.enum([...])` for `tense`/`subject`/`platform` — copy the literal arrays byte-for-byte from `src/dataset/types.ts` (`TENSES`/`SUBJECTS` constants) rather than retyping them, to guarantee they never drift:
```typescript
// src/dataset/types.ts, lines 15-29 (source of truth for enum literals)
export const TENSES: readonly Tense[] = ["present_indicative", "preterite", "imperfect", "future"];
export const SUBJECTS: readonly Subject[] = ["eu", "tu", "ele_ela", "nos", "voces", "eles_elas"];
```
- Export `z.infer<typeof feedbackPayloadSchema>` as `FeedbackPayload` type, same as `VerbSchema` implicitly backs `Verb` in `src/dataset/types.ts`.
- `validateDataset()`'s `.safeParse()` + issue-mapping pattern (lines 26-43) is the model for any error-collection helper this module needs, but per RESEARCH.md D-06, `schema.ts` itself should stay a pure validator — no UI-facing error formatting lives here.

---

### `src/feedback/payload.ts` (utility, transform)

**Analog:** `src/quiz/share.ts` (1-4, full file — smallest pure-function analog in the codebase)

**Whole-file pattern:**
```typescript
export function buildShareMessage(correct: number, total: number): string {
  return `I scored ${correct}/${total} on Portuguese Verb Quiz!`;
}
```

**What to replicate:**
- One exported pure function, no side effects, no RN imports — exactly the shape `buildFeedbackPayload()` needs (RESEARCH.md Code Examples already gives the target implementation; this analog confirms the *style*: small, named, single-purpose, string-template-based composition).
- Reuse the `src/quiz/labels.ts` `Record<Key, string>` lookup-table convention (below) for the reason→label mapping inside this file, rather than a switch statement.

---

### `src/feedback/reasons.ts` (config/utility, transform)

**Analog:** `src/quiz/labels.ts` (1-17, full file)

**Whole-file pattern:**
```typescript
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

**What to replicate for `reasons.ts`:**
- Export a `FEEDBACK_REASONS` ordered list (array of `{value: FeedbackReason, label: string}` for the picker UI order — UI-SPEC D-03 order is "Wrong answer / Typo or spelling / Confusing wording / Other") plus a `reasonLabels: Record<FeedbackReason, string>` lookup, same `Record<Key, string>` shape as `subjectLabels`/`tenseLabels` above.
- Exact copy strings from UI-SPEC's Copywriting Contract table: `"Wrong answer"`, `"Typo or spelling"`, `"Confusing wording"`, `"Other"`.

---

### `src/feedback/submit.ts` (service, request-response)

**No in-repo analog** — this is the app's first outbound network call. Nearest structural analog for "throws/returns a typed result instead of letting errors bubble raw" is `src/quiz/engine.ts`'s use of `InsufficientVerbsError` (typed failure) and `useQuizStore.ts`'s try/catch-and-`set()` pattern (lines 38-60) for converting a caught error into app state rather than re-throwing to the UI layer:

```typescript
// src/store/useQuizStore.ts, lines 38-60 — the project's existing try/catch → typed-state convention
startQuiz: (options: GenerateOptions) => {
  try {
    const session = generate(options);
    set({ status: "in-progress", filters: options, session, ... });
  } catch (error) {
    if (error instanceof InsufficientVerbsError) {
      set({ status: "error", errorMessage: INSUFFICIENT_VERBS_MESSAGE, session: null });
      return;
    }
    throw error;
  }
},
```

**Apply this shape to `submitFeedback()`:** catch specific failure modes, collapse to a typed result rather than throwing — but per RESEARCH.md Pattern 1, use a discriminated-union *return value* (`Promise<SubmitResult>`), not a `set()` call (this module must stay RN/Zustand-free per FDBK-03 / Pitfall 3). Copy the concrete implementation from RESEARCH.md's Code Examples section (`submitFeedback` with manual `setTimeout` + `AbortController`, status-branching 201/400/other→server-error, catch→network-error, `finally: clearTimeout`) — that code is already the authoritative target implementation, cross-referenced against the Hermes `AbortSignal.timeout()` pitfall.

---

### `app/quiz.tsx` (modified — component/route, request-response + event-driven)

**Analog:** `app/results.tsx` (1-132, full file) for the action-button-row + modal-trigger pattern; `app/quiz.tsx` itself (1-93, already read in full this session) is the file being modified.

**Imports pattern to extend** (`app/quiz.tsx` lines 1-5):
```typescript
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useQuizStore } from "../src/store/useQuizStore";
import { subjectLabels, tenseLabels } from "../src/quiz/labels";
import { verbs } from "../src/dataset/verbs";
```
Add: `Modal` from `react-native` (per UI-SPEC), plus feedback module imports (`buildFeedbackPayload`, `submitFeedback`, `FEEDBACK_REASONS`), plus `Constants` from `expo-constants` and `Platform` from `react-native` for `appVersion`/`platform` sourcing — see RESEARCH.md Code Examples "appVersion + platform sourcing at the call site".

**Existing store read-only pattern to preserve** (lines 9-13):
```typescript
const session = useQuizStore((s) => s.session);
const currentIndex = useQuizStore((s) => s.currentIndex);
const lockedChoice = useQuizStore((s) => s.lockedChoice);
```
Report button visibility gate: reuse the same `lockedChoice === null` conditional already used for the Next button (line 86-87: `lockedChoice === null && styles.nextButtonHidden` / `pointerEvents={lockedChoice === null ? "none" : "auto"}`) — apply an identical pattern to the new report-trigger button per D-02.

**Button/action pattern to copy** (`app/results.tsx` lines 51-63, secondary/back-button style specifically lines 60-62 + 120-131):
```typescript
<Pressable onPress={handleBackToSetup} style={styles.backButton}>
  <Text style={styles.backButtonText}>Back to Setup</Text>
</Pressable>
```
```typescript
backButton: {
  minHeight: 44,
  borderRadius: 12,
  backgroundColor: "#F2F2F7",
  justifyContent: "center",
  alignItems: "center",
},
backButtonText: {
  fontSize: 16,
  fontWeight: "600",
  color: "#007AFF",
},
```
Use this `minHeight: 44` + `StyleSheet.create` convention for every new interactive element (report trigger button, modal Submit/Retry/reason-chip buttons) — matches UI-SPEC's 44px minimum touch target rule exactly.

**Async handler + silent-catch pattern to copy** (`app/results.tsx` lines 18-24, `handleShare`):
```typescript
async function handleShare() {
  try {
    await Share.share({ message: buildShareMessage(correct, total) });
  } catch {
    // Silently swallow share errors — screen stays interactive.
  }
}
```
This is the project's existing precedent for "an async action that must never break the screen if it fails" — directly analogous to FDBK-03's requirement that the Quiz screen stay untouched regardless of feedback submission outcome. The new modal's `handleSubmit()` should follow this same shape but surface the outcome *inside the modal's own local state* (per RESEARCH.md Pattern 2) rather than swallowing it, since D-05/D-06/D-07 require visible success/error UI.

**Local component state for the modal (new pattern, not yet in codebase):** Follow RESEARCH.md's Pattern 2 exactly — `useState` for `reason`, `message`, and `state: "idle" | "submitting" | "success" | "error"` scoped inside a `ReportFeedbackModal` component (or inline in `app/quiz.tsx`), never inside `useQuizStore`. No existing component in this codebase currently uses local `useState` (all three screens are currently pure Zustand-store readers with zero local state) — this is a net-new but codebase-consistent pattern per Pitfall 3's explicit warning.

---

### `__tests__/feedback-schema.test.ts` (test, transform)

**Analog:** `__tests__/dataset.test.ts` (1-51, full file)

**Imports + describe/it structure to copy** (lines 1-5, 35-50):
```typescript
import { verbs } from "../src/dataset/verbs";
import { validateDataset } from "../src/dataset/validate";
import { TENSES, SUBJECTS } from "../src/dataset/types";

describe("dataset validation", () => {
  it("matches the locked backend enums for Tense and Subject", () => {
    expect(TENSES).toEqual([
      "present_indicative", "preterite", "imperfect", "future",
    ]);
    expect(SUBJECTS).toEqual([
      "eu", "tu", "ele_ela", "nos", "voces", "eles_elas",
    ]);
  });
});
```
**What to replicate:** the "enumerate every combination via `TENSES.forEach`/`SUBJECTS.forEach` and assert `.safeParse().success`" style already used at lines 7-18 (`v.conjugations[tense]` shape loop) — apply the same nested-forEach approach to cover all 4×6×2 = 48 tense/subject/platform combinations against `feedbackPayloadSchema.safeParse()` per FDBK-04's test-map requirement. Also copy the "negative case" pattern at lines 29-33 (`delete broken.conjugations...; expect(...).valid).toBe(false)`) — write an analogous negative test that mutates a required field to an invalid enum value and asserts `.safeParse().success === false`.

---

### `__tests__/feedback-payload.test.ts` (test, transform)

**Analog:** `__tests__/quiz-share.test.ts` (1-21, full file)

**Whole-file pattern:**
```typescript
import { buildShareMessage } from "../src/quiz/share";

describe("buildShareMessage", () => {
  it("builds message for a mid-range score", () => {
    expect(buildShareMessage(8, 10)).toBe(
      "I scored 8/10 on Portuguese Verb Quiz!",
    );
  });
});
```
**What to replicate:** pure input→exact-string-output assertions, one `describe` per exported function, no mocking, no RN imports. Apply directly to `buildFeedbackPayload()`: assert the exact `message` string composition for each reason (with and without free text, per D-03's `"Wrong answer: <free text>"` composition), and assert every other field passes through unchanged (`verb`, `tense`, `subject`, `correctAnswer`, `selectedAnswer`, `appVersion`, `platform`).

---

### `__tests__/feedback-submit.test.ts` (test, request-response)

**No in-repo analog** — first fetch-mocking test in this codebase. Structural convention to keep from the two analogs above: one `describe` block per exported function, `it()` names as plain-English behavior statements (e.g. `"returns success on 201"`, not `"test1"`). For the network-specific mechanics, follow RESEARCH.md's Pitfall 4 guidance directly:
```typescript
// Pattern from RESEARCH.md Pitfall 4 — required to avoid a 90-real-second test
jest.useFakeTimers();
// mock global.fetch to never resolve, then:
jest.advanceTimersByTime(90_000);
// assert the promise now resolves to { status: "network-error" }
```
Mock `global.fetch` per-test (e.g. `global.fetch = jest.fn().mockResolvedValue({ status: 201, json: async () => ({...}) })`) and assert each of the four `SubmitResult` branches (201→success, 400→validation-error, 500→server-error, rejected promise→network-error) plus the fake-timer timeout case. No existing project file mocks `fetch` or global network APIs — this is genuinely new test infrastructure, not an extension of an existing pattern.

---

## Shared Patterns

### No path aliases — always relative imports
**Source:** every file in `src/` and `app/` (`app/quiz.tsx` line 3: `import { useQuizStore } from "../src/store/useQuizStore"`; `src/quiz/types.ts` line 1: `import type { Tense, Subject } from "../dataset/types"`)
**Apply to:** all new `src/feedback/*.ts` files and the `app/quiz.tsx` modification. Do not introduce `@/` or `~/` path aliases — none exist in `tsconfig.json` or anywhere in the codebase.

### `StyleSheet.create` at the bottom of the component file, flat token reuse
**Source:** `app/quiz.tsx` lines 95-183, `app/results.tsx` lines 68-132
**Apply to:** the report-trigger button and modal component. Reuse exact existing hex values (`#FFFFFF`, `#F2F2F7`, `#007AFF`, `#FF3B30`, `#34C759`, `#000000`, `#8E8E93`) and the `minHeight: 44` / `borderRadius: 12` button convention — do not invent new colors or radii (also locked by UI-SPEC's Color/Spacing tables).

### Zod schema + `z.infer` as single source of truth for a domain shape
**Source:** `src/dataset/validate.ts` (`VerbSchema` backs the `Verb` type used across `src/dataset/types.ts` and `src/dataset/verbs.ts`)
**Apply to:** `src/feedback/schema.ts` — `feedbackPayloadSchema` should be the one place the backend contract shape is declared; `src/feedback/types.ts`'s `FeedbackPayload` should be `z.infer<typeof feedbackPayloadSchema>`, not a hand-duplicated interface.

### Typed-failure-over-thrown-error at the store/UI boundary
**Source:** `src/quiz/types.ts`'s `InsufficientVerbsError` + `src/store/useQuizStore.ts` lines 38-60 (catch known error type → `set()` typed state; unknown errors still `throw`)
**Apply to:** `src/feedback/submit.ts` — `submitFeedback()` should never throw for expected failure modes (400/500/network/timeout); return a `SubmitResult` discriminated union instead, exactly like the store converts `InsufficientVerbsError` into `{status: "error", errorMessage: ...}` instead of letting it bubble to the component.

### Silent/local-only failure handling for non-blocking async actions
**Source:** `app/results.tsx` lines 18-24 (`handleShare`'s try/catch)
**Apply to:** the report modal's submit flow — failures must stay scoped to the modal's own local state and never affect `app/quiz.tsx`'s render or `useQuizStore`, matching this file's precedent of "an async side action that fails without disturbing the screen."

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `src/feedback/submit.ts` | service | request-response | First outbound network call in the codebase — no existing `fetch`/API-client module to pattern-match against. Use RESEARCH.md's Pattern 1 code example directly (already vetted against Hermes `AbortController` pitfalls) combined with `useQuizStore.ts`'s typed-catch convention for the return-shape style. |
| `__tests__/feedback-submit.test.ts` | test | request-response | No existing test mocks `fetch`/network/timers in this codebase. Use RESEARCH.md's Pitfall 4 fake-timer guidance; keep the existing `describe`/`it` naming convention from `__tests__/quiz-share.test.ts` and `__tests__/dataset.test.ts`. |

## Metadata

**Analog search scope:** `app/` (all 4 screens), `src/quiz/` (all 6 modules), `src/dataset/` (all 3 modules), `src/store/` (1 module), `__tests__/` (all 8 test files)
**Files scanned:** 22 (full-file reads; every file in scope is ≤ 132 lines, no offset/limit reads needed)
**Pattern extraction date:** 2026-07-13
</content>
