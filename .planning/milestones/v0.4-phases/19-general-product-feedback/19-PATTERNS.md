# Phase 19: General Product Feedback - Pattern Map

**Mapped:** 2026-07-22
**Files analyzed:** 12 (6 new domain files, 3 modified screens, 3 new test files)
**Analogs found:** 12 / 12

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|--------------------|------|-----------|-----------------|---------------|
| `src/productFeedback/types.ts` | model (types) | request-response | `src/feedback/types.ts` | exact |
| `src/productFeedback/schema.ts` | model (validation) | request-response | `src/feedback/schema.ts` | exact |
| `src/productFeedback/categories.ts` | utility (label map) | transform | `src/feedback/reasons.ts` | exact |
| `src/productFeedback/payload.ts` | utility (builder) | transform | `src/feedback/payload.ts` | exact |
| `src/productFeedback/submit.ts` | service | request-response | `src/feedback/submit.ts` | exact |
| `src/productFeedback/ProductFeedbackModal.tsx` | component | request-response | `src/feedback/ReportFeedbackModal.tsx` | exact |
| `app/index.tsx` (modify) | route/component | request-response | itself (add footer link + modal, mirror `app/quiz.tsx` wiring) | role-match |
| `app/results.tsx` (modify) | route/component | request-response | itself (add footer link + modal, mirror `app/quiz.tsx` wiring) | role-match |
| `app/quiz.tsx` (modify) | route/component | request-response | itself (restructure bottom section: two-button row) | exact (self) |
| `__tests__/productFeedback-schema.test.ts` | test | request-response | `__tests__/feedback-schema.test.ts` | exact |
| `__tests__/productFeedback-payload.test.ts` | test | transform | `__tests__/feedback-payload.test.ts` | exact |
| `__tests__/productFeedback-submit.test.ts` | test | request-response | `__tests__/feedback-submit.test.ts` | exact |

## Pattern Assignments

### `src/productFeedback/types.ts` (model, request-response)

**Analog:** `src/feedback/types.ts` (full file, 14 lines)

```typescript
import type { z } from "zod";

import { feedbackPayloadSchema } from "./schema";

export type FeedbackReason = "wrong_answer" | "typo" | "confusing" | "other";

export type FeedbackPayload = z.infer<typeof feedbackPayloadSchema>;

export type SubmitResult =
  | { status: "success"; data: unknown }
  | { status: "validation-error" }
  | { status: "server-error" }
  | { status: "network-error" };
```

**Adaptation for `productFeedback`:**
- Replace `FeedbackReason` with `ProductFeedbackCategory = "bug" | "idea" | "other"`.
- Add `ProductFeedbackScreen = "setup" | "quiz" | "results"` (per RESEARCH.md Pitfall 4, declare a `SCREENS = ["setup", "quiz", "results"] as const` array in this file and derive both the type and the Zod enum from it — same pattern `dataset/types.ts` uses for `TENSES`/`SUBJECTS`).
- `SubmitResult` union is copied verbatim (no changes — same 4-state shape).
- `ProductFeedbackPayload = z.infer<typeof productFeedbackPayloadSchema>`.

---

### `src/productFeedback/schema.ts` (model, request-response)

**Analog:** `src/feedback/schema.ts` (full file, 15 lines)

```typescript
import { z } from "zod";

import { TENSES, SUBJECTS, type Tense, type Subject } from "../dataset/types";

export const feedbackPayloadSchema = z.object({
  message: z.string().min(1),
  verb: z.string().min(1),
  tense: z.enum(TENSES as unknown as [Tense, ...Tense[]]),
  subject: z.enum(SUBJECTS as unknown as [Subject, ...Subject[]]),
  correctAnswer: z.string().min(1),
  selectedAnswer: z.string().min(1),
  appVersion: z.string().min(1),
  platform: z.enum(["ios", "android"]),
});
```

**Adaptation for `productFeedback`** — per RESEARCH.md's exact contract (PFDBK-03), the new schema needs explicit max lengths that the analog does not have:

```typescript
export const productFeedbackPayloadSchema = z.object({
  category: z.enum(["bug", "idea", "other"]),
  message: z.string().min(1).max(2000),
  screen: z.enum(SCREENS as unknown as [ProductFeedbackScreen, ...ProductFeedbackScreen[]]),
  appVersion: z.string().min(1).max(20),
  platform: z.enum(["ios", "android"]),
});
```
Note: unlike `feedback/schema.ts`, `appVersion` here has both a min and max (1-20) — do not copy the analog's unbounded `z.string().min(1)` for `appVersion`.

---

### `src/productFeedback/categories.ts` (utility, transform)

**Analog:** `src/feedback/reasons.ts` (full file, 13 lines)

```typescript
import type { FeedbackReason } from "./types";

export const reasonLabels: Record<FeedbackReason, string> = {
  wrong_answer: "Wrong answer",
  typo: "Typo or spelling",
  confusing: "Confusing wording",
  other: "Other",
};

export const FEEDBACK_REASONS: { value: FeedbackReason; label: string }[] = (
  ["wrong_answer", "typo", "confusing", "other"] as const
).map((value) => ({ value, label: reasonLabels[value] }));
```

**Adaptation:** rename to `categoryLabels: Record<ProductFeedbackCategory, string>` (`bug: "Bug", idea: "Idea", other: "Other"`) and `CATEGORY_OPTIONS: { value: ProductFeedbackCategory; label: string }[]`. Same `Record` + derived-array shape, no other structural change.

---

### `src/productFeedback/payload.ts` (utility, transform)

**Analog:** `src/feedback/payload.ts` (full file, 31 lines)

```typescript
import type { Tense, Subject } from "../dataset/types";
import type { FeedbackReason, FeedbackPayload } from "./types";
import { reasonLabels } from "./reasons";

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
  const trimmedFreeText = params.freeText.trim();
  const label = reasonLabels[params.reason];
  const message = trimmedFreeText ? `${label}: ${trimmedFreeText}` : label;

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

**Key divergence (RESEARCH.md, explicit):** product feedback's `message` is used **verbatim/trimmed**, NOT composed with a category-label prefix (unlike `"<reasonLabel>: <freeText>"`). Use `message: params.message.trim()` directly — no `label` composition logic. This also means PFDBK-05 requires the return object contains **only** `category, message, screen, appVersion, platform` — never `verb`/`tense`/`subject`/`correctAnswer`/`selectedAnswer`. Concrete builder (from RESEARCH.md Code Examples):

```typescript
export function buildProductFeedbackPayload(params: {
  category: ProductFeedbackCategory;
  message: string;
  screen: ProductFeedbackScreen;
  appVersion: string;
  platform: "ios" | "android";
}): ProductFeedbackPayload {
  return {
    category: params.category,
    message: params.message.trim(),
    screen: params.screen,
    appVersion: params.appVersion,
    platform: params.platform,
  };
}
```

---

### `src/productFeedback/submit.ts` (service, request-response)

**Analog:** `src/feedback/submit.ts` (full file, 36 lines) — copy structurally verbatim, only endpoint URL and type imports differ.

```typescript
import type { FeedbackPayload, SubmitResult } from "./types";

const FEEDBACK_ENDPOINT = "https://portuguese-verb-api.onrender.com/feedback";
const TIMEOUT_MS = 90_000;

export async function submitFeedback(
  payload: FeedbackPayload,
): Promise<SubmitResult> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(FEEDBACK_ENDPOINT, {
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

    return { status: "server-error" };
  } catch {
    return { status: "network-error" };
  } finally {
    clearTimeout(timeoutId);
  }
}
```

**Adaptation:** rename to `submitProductFeedback`, change `FEEDBACK_ENDPOINT` → `PRODUCT_FEEDBACK_ENDPOINT = "https://portuguese-verb-api.onrender.com/product-feedback"`, swap imported types to `ProductFeedbackPayload`/`SubmitResult` from `./types`. **Do not** extract a shared timeout/AbortController helper between `feedback/` and `productFeedback/` — D-07 explicitly locks zero shared code, intentional duplication.

---

### `src/productFeedback/ProductFeedbackModal.tsx` (component, request-response)

**Analog:** `src/feedback/ReportFeedbackModal.tsx` (full file, 264 lines)

**Imports pattern** (lines 1-17):
```typescript
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import type { Subject, Tense } from "../dataset/types";
import { colors, radius, spacing, typography } from "../theme/tokens";
import { buildFeedbackPayload } from "./payload";
import { FEEDBACK_REASONS } from "./reasons";
import { submitFeedback } from "./submit";
import type { FeedbackReason, SubmitResult } from "./types";
```
Note: this file already imports tokens correctly (`../theme/tokens`) — this is the good precedent to follow (do NOT copy the hardcoded-hex anti-pattern the ARCHITECTURE.md doc separately flags elsewhere; this particular import line is already correct and should be copied as-is).

**Props shape** (lines 21-31) — analog:
```typescript
export type ReportFeedbackModalProps = {
  visible: boolean;
  verb: string;
  tense: Tense;
  subject: Subject;
  correctAnswer: string;
  selectedAnswer: string;
  appVersion: string;
  platform: "ios" | "android";
  onClose: () => void;
};
```
Adapt to:
```typescript
export type ProductFeedbackModalProps = {
  visible: boolean;
  screen: ProductFeedbackScreen; // "setup" | "quiz" | "results", literal prop per screen — no usePathname()
  appVersion: string;
  platform: "ios" | "android";
  onClose: () => void;
};
```

**State machine pattern** (lines 44-69) — copy verbatim, replacing `reason`/`FeedbackReason` state with `category`/`ProductFeedbackCategory` (default to first category, e.g. `"bug"`), and add `message` state (already present in analog as free-text, but note **required** here — see disabled-button divergence below):
```typescript
const [reason, setReason] = useState<FeedbackReason>("wrong_answer");
const [message, setMessage] = useState("");
const [state, setState] = useState<ModalState>("idle");
const [lastStatus, setLastStatus] = useState<SubmitResult["status"] | null>(null);
const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

useEffect(() => {
  if (visible) {
    setReason("wrong_answer");
    setMessage("");
    setState("idle");
    setLastStatus(null);
  }
  if (timerRef.current) {
    clearTimeout(timerRef.current);
    timerRef.current = null;
  }
  return () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };
}, [visible]);
```

**Submit handler pattern** (lines 71-98) — copy structure verbatim, swap `buildFeedbackPayload`/`submitFeedback` for `buildProductFeedbackPayload`/`submitProductFeedback`, pass `category`/`message`/`screen`/`appVersion`/`platform` instead of the quiz-context fields:
```typescript
async function handleSubmit() {
  try {
    setState("submitting");
    const payload = buildProductFeedbackPayload({
      category,
      message,
      screen,
      appVersion,
      platform,
    });
    const result = await submitProductFeedback(payload);
    if (result.status === "success") {
      setState("success");
      setLastStatus(result.status);
      timerRef.current = setTimeout(onClose, 1500);
    } else {
      setState("error");
      setLastStatus(result.status);
    }
  } catch {
    setState("error");
    setLastStatus("network-error");
  }
}
```

**Pill-list category picker** (lines 116-140, D-05 locks this exact pattern) — rename `reason`→`category`, `FEEDBACK_REASONS`→`CATEGORY_OPTIONS`, `reasonOption*` styles → `categoryOption*` (or reuse the same style names):
```tsx
<View style={styles.reasonList}>
  {FEEDBACK_REASONS.map((option) => {
    const isSelected = option.value === reason;
    return (
      <Pressable
        key={option.value}
        onPress={() => setReason(option.value)}
        disabled={isSubmitting}
        style={[styles.reasonOption, isSelected && styles.reasonOptionSelected]}
      >
        <Text style={[styles.reasonOptionText, isSelected && styles.reasonOptionTextSelected]}>
          {option.label}
        </Text>
      </Pressable>
    );
  })}
</View>
```

**Submit button disabled-state divergence (Pitfall 3, do not copy verbatim):**
```typescript
// Analog (ReportFeedbackModal) — message is optional:
disabled={isSubmitting}

// ProductFeedbackModal — message is REQUIRED (D-06):
disabled={isSubmitting || message.trim().length === 0}
```

**Success/error text pattern** (lines 152-160) — copy verbatim, adapt copy per CONTEXT.md's Claude's Discretion note (keep the same tone: `"✓ ... sent — thank you!"` / `"Something went wrong. Please try again."`):
```tsx
{state === "success" ? (
  <Text style={styles.successText}>✓ Feedback sent — thank you!</Text>
) : null}

{state === "error" ? (
  <Text style={styles.errorText}>
    Something went wrong. Please try again.
  </Text>
) : null}
```

**Full StyleSheet block** (lines 184-263) — copy verbatim as the starting point; all values already use `colors`/`spacing`/`radius`/`typography` tokens (this file is the correct token-usage precedent, not the anti-pattern flagged elsewhere in ARCHITECTURE.md for other hardcoded spots).

---

### `app/index.tsx` (modify) — add footer-link entry point (D-01)

**Analog:** self (existing file, full read above) + `app/quiz.tsx`'s modal-wiring pattern (lines 1-12, 27, 169-179)

**Integration pattern to add:**
1. Import `Constants from "expo-constants"` and `Platform` from `"react-native"` (currently absent — Pitfall 1), copying verbatim from `app/quiz.tsx` lines 3, 56-57:
```typescript
const appVersion = Constants.expoConfig?.version ?? "unknown";
const platform: "ios" | "android" = Platform.OS === "android" ? "android" : "ios";
```
2. Add local state `const [productFeedbackVisible, setProductFeedbackVisible] = useState(false);` (mirrors `app/quiz.tsx` line 27's `reportVisible` state).
3. Render a low-visual-weight `Pressable`/`Text` footer link below the Start Quiz button (new; no existing analog button style — closest existing secondary-button style is `app/quiz.tsx`'s `reportButtonText` style: `{ ...typography.body, color: colors.primary }`, used at reduced visual weight per D-01, e.g. smaller/caption-styled and no button background).
4. Render `<ProductFeedbackModal>` at the bottom of the JSX tree, mirroring `app/quiz.tsx` lines 169-179's `<ReportFeedbackModal>` placement:
```tsx
<ProductFeedbackModal
  visible={productFeedbackVisible}
  screen="setup"
  appVersion={appVersion}
  platform={platform}
  onClose={() => setProductFeedbackVisible(false)}
/>
```

---

### `app/results.tsx` (modify) — add footer-link entry point (D-02)

**Analog:** self + `app/quiz.tsx`'s modal-wiring pattern (same as above)

Same integration pattern as `app/index.tsx`: add `expo-constants`/`Platform` imports (currently absent), add `productFeedbackVisible` state, render footer link below the existing `actions` block (after Share Score / Try Again / Back to Setup, inside or after the `styles.actions` `View`, per D-02), render `<ProductFeedbackModal screen="results" ... />`.

---

### `app/quiz.tsx` (modify) — two-action row, divergent visibility (D-03/D-04)

**Analog:** self, existing `reportButton` block (lines 161-179) is both the analog and the file being modified.

**Current pattern** (lines 161-179, being restructured):
```tsx
<Pressable
  onPress={() => setReportVisible(true)}
  style={[styles.reportButton, lockedChoice === null && styles.reportButtonHidden]}
  pointerEvents={lockedChoice === null ? "none" : "auto"}
>
  <Text style={styles.reportButtonText}>Report a problem</Text>
</Pressable>

<ReportFeedbackModal
  visible={reportVisible}
  verb={question.verb}
  tense={question.tense}
  subject={question.subject}
  correctAnswer={question.correctAnswer}
  selectedAnswer={lockedChoice ?? ""}
  appVersion={appVersion}
  platform={platform}
  onClose={() => setReportVisible(false)}
/>
```

**Target pattern (RESEARCH.md Pattern 2, D-04 divergent visibility):**
```tsx
<View style={styles.feedbackRow /* flexDirection: "row", gap: spacing.md */}>
  <Pressable
    onPress={() => setReportVisible(true)}
    style={[styles.reportButton, lockedChoice === null && styles.reportButtonHidden]}
    pointerEvents={lockedChoice === null ? "none" : "auto"}
  >
    <Text style={styles.reportButtonText}>Report a problem</Text>
  </Pressable>
  <Pressable
    onPress={() => setProductFeedbackVisible(true)}
    style={styles.reportButton /* no hidden/pointerEvents gating — visible from question-load */}
  >
    <Text style={styles.reportButtonText}>Help us improve</Text>
  </Pressable>
</View>

<ReportFeedbackModal ... unchanged ... />
<ProductFeedbackModal
  visible={productFeedbackVisible}
  screen="quiz"
  appVersion={appVersion}
  platform={platform}
  onClose={() => setProductFeedbackVisible(false)}
/>
```
`appVersion`/`platform` are already computed in this file (lines 56-57) — reuse directly, do not recompute.

**Style change required (Pitfall 2):** `reportButton` currently has no `flex` property (it was full-width, `marginTop: spacing.md`). Add a new `feedbackRow: { flexDirection: "row", gap: spacing.md, marginTop: spacing.md }` container style and give both buttons `flex: 1` (either a style-array modifier or bake into `reportButton`); remove `reportButton`'s own `marginTop` since the row now owns that spacing.

---

### `__tests__/productFeedback-schema.test.ts` (test, request-response)

**Analog:** `__tests__/feedback-schema.test.ts` (full file, 99 lines)

Structure to mirror: `validPayload(overrides)` helper + nested `.forEach` matrix over enum combinations + invalid-literal rejection cases + empty-string rejection loop. New cases beyond the analog (per RESEARCH.md Wave 0 Gaps): add max-length rejection tests for `message` (>2000 chars) and `appVersion` (>20 chars), which `feedback-schema.test.ts` doesn't need since that schema has no max-length constraints. Also mirror the `FEEDBACK_REASONS`-ordering describe block (lines 74-98) for `CATEGORY_OPTIONS`/`categoryLabels`.

---

### `__tests__/productFeedback-payload.test.ts` (test, transform)

**Analog:** `__tests__/feedback-payload.test.ts` (full file, 87 lines)

Structure to mirror: `baseParams` object + `describe("buildProductFeedbackPayload", ...)`. **Divergence:** omit the reason-label-composition tests (lines 24-53, 55-62 of the analog) since `message` is verbatim/trimmed, not prefixed with a category label. Keep the "passes through all context fields unchanged" style test (lines 64-77) and the schema round-trip test (lines 79-86, adapted to `productFeedbackPayloadSchema`). Add an explicit new assertion for PFDBK-05: `expect(Object.keys(payload).sort()).toEqual(["appVersion", "category", "message", "platform", "screen"])` — asserts no quiz-answer fields (`verb`/`tense`/`subject`/`correctAnswer`/`selectedAnswer`) are ever present.

---

### `__tests__/productFeedback-submit.test.ts` (test, request-response)

**Analog:** `__tests__/feedback-submit.test.ts` (full file, 97 lines) — this is a verbatim structural mirror per RESEARCH.md. Copy the exact 6 test cases (201/400/500/other-non-201/network-error/90s-timeout via `jest.useFakeTimers()` + `jest.advanceTimersByTime(90_000)`), only changing the imported function (`submitProductFeedback`), sample payload shape, and `afterEach` cleanup block (identical: `globalThis.fetch = originalFetch; jest.useRealTimers(); jest.clearAllMocks();`).

---

## Shared Patterns

### AbortController timeout pattern
**Source:** `src/feedback/submit.ts` lines 9-10, 17, 33 (also `src/dataset/remote.ts`)
**Apply to:** `src/productFeedback/submit.ts` only (D-07 forbids extracting a shared helper — duplicate the pattern, do not import it)
```typescript
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);
try {
  // ... fetch with signal: controller.signal
} finally {
  clearTimeout(timeoutId);
}
```

### Result-union submit response mapping
**Source:** `src/feedback/submit.ts` lines 20-31
**Apply to:** `src/productFeedback/submit.ts`
```typescript
if (response.status === 201) {
  const data = await response.json();
  return { status: "success", data };
}
if (response.status === 400) {
  return { status: "validation-error" };
}
return { status: "server-error" };
// catch block: return { status: "network-error" }
```

### Design tokens usage
**Source:** `src/theme/tokens.ts` (all exports), consumed via `src/feedback/ReportFeedbackModal.tsx`'s `StyleSheet.create` block (lines 184-263)
**Apply to:** `ProductFeedbackModal.tsx` and any new/modified footer-link styles in `app/index.tsx`, `app/results.tsx`, `app/quiz.tsx` — always `import { colors, spacing, radius, typography } from "../theme/tokens"` (or `../src/theme/tokens` from `app/`), never inline hex/px literals.

### Zod schema as single source of truth
**Source:** CONVENTIONS.md "Zod Usage Patterns"; `src/feedback/schema.ts` + `src/feedback/types.ts`
**Apply to:** `src/productFeedback/schema.ts` + `src/productFeedback/types.ts` — schema defines shape, `types.ts` derives `z.infer`, never a hand-written parallel interface. Reuse a single `SCREENS`/`CATEGORIES`-style const array as the source for both the Zod enum and the TS union type (Pitfall 4).

### Modal state machine (idle/submitting/success/error)
**Source:** `src/feedback/ReportFeedbackModal.tsx` lines 19, 46, 71-98, 100-103
**Apply to:** `ProductFeedbackModal.tsx` — identical 4-state machine, identical `showRetry` derivation (`state === "error" && (lastStatus === "server-error" || lastStatus === "network-error")`), identical auto-close-on-success via `setTimeout(onClose, 1500)` stored in a `timerRef`.

## No Analog Found

None — every file in this phase has a direct, verified precedent in `src/feedback/`, `app/quiz.tsx`, or `__tests__/feedback-*.test.ts`. This phase is explicitly scoped as a structural mirror (RESEARCH.md: "copy a proven pattern, change the field set and endpoint").

## Metadata

**Analog search scope:** `src/feedback/`, `src/theme/`, `app/`, `__tests__/feedback-*.test.ts`
**Files scanned:** 13 (6 feedback domain files, 3 screens, 3 feedback test files, 1 tokens file)
**Pattern extraction date:** 2026-07-22
