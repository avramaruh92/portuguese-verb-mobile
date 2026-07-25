# Phase 24: Quality Gates, Preflight & First Submit - Pattern Map

**Mapped:** 2026-07-24
**Files analyzed:** 4 (2 lint-fix targets, 1 new script, 1 config edit)
**Analogs found:** 4 / 4

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|--------------------|------|-----------|-----------------|----------------|
| `src/feedback/ReportFeedbackModal.tsx` | component | event-driven | `src/productFeedback/ProductFeedbackModal.tsx` | exact (identical bug shape, sibling file) |
| `src/productFeedback/ProductFeedbackModal.tsx` | component | event-driven | `src/feedback/ReportFeedbackModal.tsx` | exact (identical bug shape, sibling file) |
| `scripts/preflight.ts` (new) | utility/script | request-response (batch of live HTTP checks) | `scripts/generate-brand-assets.ts` | exact (only existing standalone script precedent) |
| `package.json` (`scripts` block edit) | config | n/a | existing `"generate-assets": "node scripts/generate-brand-assets.ts"` entry | exact |

Both modal files are two instances of the *same* bug — fix one, then mirror the identical structural fix onto the other. There is no other component in the codebase with this "reset state when becoming visible" `useEffect` shape to use as an alternate analog, and none is needed.

## Pattern Assignments

### `src/feedback/ReportFeedbackModal.tsx` (component, event-driven) and `src/productFeedback/ProductFeedbackModal.tsx` (component, event-driven)

**Analog:** each other (byte-for-byte identical bug pattern, only field names differ: `reason`/`FEEDBACK_REASONS` vs. `category`/`CATEGORY_OPTIONS`)

**Current buggy effect — the exact code causing `react-hooks/set-state-in-effect`:**

`src/feedback/ReportFeedbackModal.tsx` lines 44-69:
```typescript
const [reason, setReason] = useState<FeedbackReason>("wrong_answer");
const [message, setMessage] = useState("");
const [state, setState] = useState<ModalState>("idle");
const [lastStatus, setLastStatus] = useState<SubmitResult["status"] | null>(
  null,
);
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

`src/productFeedback/ProductFeedbackModal.tsx` lines 39-64 (identical shape, `category`/`CATEGORY_OPTIONS`/`ProductFeedbackCategory` in place of `reason`/`FEEDBACK_REASONS`/`FeedbackReason`):
```typescript
const [category, setCategory] = useState<ProductFeedbackCategory>("bug");
const [message, setMessage] = useState("");
const [state, setState] = useState<ModalState>("idle");
const [lastStatus, setLastStatus] = useState<SubmitResult["status"] | null>(
  null,
);
const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

useEffect(() => {
  if (visible) {
    setCategory("bug");
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

**Why this trips the lint rule:** calling `setState`/`setReason`/`setMessage`/etc. unconditionally inside a plain (non-cleanup) `useEffect` body, gated only by a prop check (`if (visible)`), is exactly the "set state in effect" anti-pattern the `react-hooks/set-state-in-effect` rule flags — React's guidance is to compute this during render via a tracked previous-value ref instead of an effect.

**Fix pattern per D-01 (implementer's discretion, React's official "adjusting state when a prop changes" pattern, no `key`-remount):**

Replace the `useEffect`-based reset with a render-time comparison against a ref tracking the previous `visible` value. Keep the `timerRef` cleanup on unmount as a separate, legitimate `useEffect` (that one is fine — cleanup-only effects with no direct `setState` call in the effect body itself are not what the rule flags, only be careful not to call `setState` directly inside it either). Concretely, something like:

```typescript
const prevVisibleRef = useRef(visible);
if (visible && !prevVisibleRef.current) {
  // Reset state during render when transitioning to visible — avoids
  // react-hooks/set-state-in-effect by not calling setState from an effect.
  setReason("wrong_answer"); // or setCategory("bug") in ProductFeedbackModal
  setMessage("");
  setState("idle");
  setLastStatus(null);
}
prevVisibleRef.current = visible;

useEffect(() => {
  return () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };
}, [visible]);
```

Calling `setState` conditionally during the render body (not inside `useEffect`) guarded by a ref-tracked previous-prop comparison is the documented React pattern for "adjusting state when a prop changes" and is explicitly exempted from `react-hooks/set-state-in-effect` because it is not in an effect at all. Apply this identical transformation to both files — same variable names substituted per-file (`reason`/`setReason` vs `category`/`setCategory`).

**Constraint:** user-visible behavior must not change — modal must still reset all fields (`reason`/`category`, `message`, `state`, `lastStatus`) every time `visible` flips `false → true`. Critically, the dependency array must stay `[visible]`, NOT `[]` — the original code cleared the pending success-timer on every `visible` transition (not just unmount), so both modals are always-mounted (`app/quiz.tsx` etc. render them unconditionally, only toggling `visible`). Narrowing this cleanup to unmount-only would let a stale 1.5s auto-close timer fire after a rapid close/reopen during that window and call `onClose()` unexpectedly on the freshly reopened modal — a real behavior regression, not just a lint nit.

**Do not do:** a `key`-based remount trick (explicitly rejected by the user in D-01).

---

### `scripts/preflight.ts` (new file — utility/script, request-response batch checks)

**Analog:** `scripts/generate-brand-assets.ts` (only existing standalone-script precedent in the repo)

**Structural pattern to copy** (full file at `/Users/avi/portuguese-verb/portuguese-verb-mobile/scripts/generate-brand-assets.ts`):
- Plain `.ts` file under `scripts/`, no build step — invoked directly via `node scripts/<name>.ts` (Node's native TS type-stripping, no `ts-node`/`tsx` dependency declared in `package.json`).
- Top-of-file `const` literals in `SCREAMING_SNAKE_CASE` for all fixed config values (paths, sizes, thresholds) — matches project convention (`SOURCE_SVG_PATH`, `ICON_OUTPUT_PATH`, `ICON_SIZE_PX`, etc., lines 6-13). Preflight should declare its endpoint/timeout constants the same way.
- Small, single-purpose named functions per concern (`extractIconGroup`, `buildIconDoc`, `generateIcon`, `generateSplash`) rather than one large script body — mirrors the project's "small, single-purpose functions" convention (see CONVENTIONS.md "Function Design").
- Functions `throw new Error(...)` with a descriptive message when an invariant fails (lines 27-30, 38-41, 45-48, 63-66, 68-71, 89-93) — no silent failure, no custom error classes for a one-shot script.
- A single `async function main(): Promise<void>` at the bottom that sequences the steps, called unconditionally as the last line of the file: `main();` (line 122) — no `if (require.main === module)` guard, no argv parsing (script has no CLI flags in the analog).
- Uses `node:fs`'s `readFileSync`/`writeFileSync` directly with no wrapper/try-catch around file I/O — errors are allowed to propagate and crash the script with Node's default stack trace (acceptable for a small manually-run dev script).

**Preflight-specific adaptation** — reuse the project's established fetch pattern (`AbortController` + `setTimeout`/`clearTimeout` in a `try/finally`), copied from `src/dataset/remote.ts` lines 13-19 and 40-42, and `src/feedback/submit.ts` lines 9-19 and 32-34:
```typescript
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);
try {
  const response = await fetch(ENDPOINT, { signal: controller.signal, ... });
  // status-code-only check per D-03 — no response.json()/body validation needed
} finally {
  clearTimeout(timeoutId);
}
```

**Exact endpoint constants to reuse/mirror (status-code checks only, per D-03):**
| Endpoint | Constant | Source file | Exact URL |
|---|---|---|---|
| `GET /health` | *(new — no existing constant)* | n/a — first use in this codebase | `https://portuguese-verb-api.onrender.com/health` |
| `GET /content/verbs` | `CONTENT_ENDPOINT` | `src/dataset/remote.ts:6` | `https://portuguese-verb-api.onrender.com/content/verbs` |
| `POST /feedback` | `FEEDBACK_ENDPOINT` | `src/feedback/submit.ts:3` | `https://portuguese-verb-api.onrender.com/feedback` |
| `POST /product-feedback` | `PRODUCT_FEEDBACK_ENDPOINT` | `src/productFeedback/submit.ts:3-4` | `https://portuguese-verb-api.onrender.com/product-feedback` |

These constants are not exported from their source files (no `export` keyword on any of the three) — the preflight script cannot `import` them; per the project's own convention ("Backend endpoints are hardcoded as string constants directly in source" — CONTEXT.md code_context, confirmed here), re-declare the same literal base URL (`https://portuguese-verb-api.onrender.com`) + path suffixes directly in `scripts/preflight.ts` as its own `SCREAMING_SNAKE_CASE` constants, rather than adding new exports to production source files just for the script.

**Dummy payload shapes required (must satisfy the exact Zod schemas below — D-03: syntactically valid, content arbitrary):**

`feedbackPayloadSchema` (`src/feedback/schema.ts` lines 5-14):
```typescript
z.object({
  message: z.string().min(1),
  verb: z.string().min(1),
  tense: z.enum(["present_indicative", "preterite", "imperfect", "future"]), // TENSES, src/dataset/types.ts:17-21 (4th value "future" per CLAUDE.md enum)
  subject: z.enum(["eu", "tu", "ele_ela", "nos", "voces", "eles_elas"]), // SUBJECTS, src/dataset/types.ts:24-30, per CLAUDE.md
  correctAnswer: z.string().min(1),
  selectedAnswer: z.string().min(1),
  appVersion: z.string().min(1),
  platform: z.enum(["ios", "android"]),
})
```
Example valid dummy payload (mirrors `buildFeedbackPayload`'s output shape, `src/feedback/payload.ts` lines 5-30):
```typescript
{
  message: "preflight smoke test — ignore",
  verb: "falar",
  tense: "present_indicative",
  subject: "eu",
  correctAnswer: "falo",
  selectedAnswer: "falo",
  appVersion: "preflight",
  platform: "ios",
}
```

`productFeedbackPayloadSchema` (`src/productFeedback/schema.ts` lines 5-13):
```typescript
z.object({
  category: z.enum(["bug", "idea", "other"]),
  message: z.string().min(1).max(2000),
  screen: z.enum(["setup", "quiz", "results"]), // SCREENS, src/productFeedback/types.ts:5
  appVersion: z.string().min(1).max(20),
  platform: z.enum(["ios", "android"]),
})
```
Example valid dummy payload:
```typescript
{
  category: "other",
  message: "preflight smoke test — ignore",
  screen: "setup",
  appVersion: "preflight",
  platform: "ios",
}
```

**Status-code assertion targets (D-03), no body-shape validation:**
| Check | Method | Expected status |
|---|---|---|
| `/health` | GET | 200 |
| `/content/verbs` | GET | 200 |
| `/feedback` | POST (dummy payload above) | 201 |
| `/product-feedback` | POST (dummy payload above) | 201 |

Script should print a pass/fail summary line per check and exit non-zero if any check fails (standard for a CI/manual gate script; no existing exit-code convention in the repo to copy from since `generate-brand-assets.ts` has no failure-exit-code path beyond an uncaught throw — that same "let it throw and crash with non-zero exit" behavior is acceptable and consistent for this script too, or an explicit `process.exit(1)` after printing failures is equally fine, Claude's discretion).

---

### `package.json` (`scripts` block edit)

**Analog:** existing `"generate-assets": "node scripts/generate-brand-assets.ts"` entry (`package.json` line under `"scripts"`)

**Exact current scripts block** (`package.json`):
```json
"scripts": {
  "start": "expo start",
  "android": "expo start --android",
  "ios": "expo start --ios",
  "web": "expo start --web",
  "lint": "expo lint",
  "test": "jest",
  "typecheck": "tsc --noEmit",
  "eas": "eas",
  "generate-assets": "node scripts/generate-brand-assets.ts"
}
```

**Pattern to copy:** add a new entry in the same style — plain `node scripts/<file>.ts` invocation, no flags, no separate build step:
```json
"preflight": "node scripts/preflight.ts"
```

## Shared Patterns

### Fetch timeout pattern (AbortController)
**Source:** `src/dataset/remote.ts` lines 13-19, 40-42; `src/feedback/submit.ts` lines 9-19, 32-34; `src/productFeedback/submit.ts` (identical shape)
**Apply to:** `scripts/preflight.ts`'s four HTTP checks
```typescript
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);
try {
  const response = await fetch(ENDPOINT, { signal: controller.signal });
  // ...
} finally {
  clearTimeout(timeoutId);
}
```

### Hardcoded endpoint constants (no env vars)
**Source:** `src/dataset/remote.ts:6`, `src/feedback/submit.ts:3`, `src/productFeedback/submit.ts:3-4` — all declare `const <NAME>_ENDPOINT = "https://portuguese-verb-api.onrender.com/<path>";` as an unexported, file-local constant.
**Apply to:** `scripts/preflight.ts` — re-declare its own four endpoint constants the same way; do not add new env-var config or new exports to production source files.

### Standalone script structure
**Source:** `scripts/generate-brand-assets.ts` (full file)
**Apply to:** `scripts/preflight.ts` — `SCREAMING_SNAKE_CASE` constants at top, small named functions per concern, single `async function main()` at bottom, called unconditionally as the last statement (`main();`), no CLI-arg parsing, errors allowed to throw/crash (or explicit summary + `process.exit(1)` on failure).

### Render-time state reset (replaces effect-based reset)
**Source:** React's official "Adjusting state when a prop changes" guidance (no existing in-repo analog before this phase — this is a new pattern introduction, applied identically to both modal files)
**Apply to:** `src/feedback/ReportFeedbackModal.tsx`, `src/productFeedback/ProductFeedbackModal.tsx`
```typescript
const prevVisibleRef = useRef(visible);
if (visible && !prevVisibleRef.current) {
  // reset fields here, during render
}
prevVisibleRef.current = visible;
```

## No Analog Found

None — all four files/edits have a direct or near-direct existing analog in the codebase (the render-time-reset React pattern has no in-repo precedent, but it is a well-documented, narrowly-scoped React idiom specified directly in CONTEXT.md D-01, not something requiring a new analog search).

## Metadata

**Analog search scope:** `src/feedback/`, `src/productFeedback/`, `src/dataset/`, `scripts/`, `package.json`
**Files scanned:** `src/feedback/ReportFeedbackModal.tsx`, `src/productFeedback/ProductFeedbackModal.tsx`, `scripts/generate-brand-assets.ts`, `src/feedback/submit.ts`, `src/productFeedback/submit.ts`, `src/dataset/remote.ts`, `src/feedback/schema.ts`, `src/productFeedback/schema.ts`, `src/feedback/payload.ts`, `src/productFeedback/types.ts`, `src/dataset/types.ts`, `package.json`
**Pattern extraction date:** 2026-07-24
