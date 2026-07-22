# Phase 19: General Product Feedback - Research

**Researched:** 2026-07-22
**Domain:** React Native (Expo Router) feature addition — new independent feedback domain + 3-screen UI integration
**Confidence:** HIGH

## Summary

This phase is a structural mirror of an existing, working pattern (`src/feedback/`)
extended to a new backend endpoint (`POST /product-feedback`) and a new field set
(`category`/`message`/`screen`/`appVersion`/`platform` — no quiz-answer context).
Every piece of this phase — Zod schema, payload builder, submit function, modal
component, entry-point wiring on 3 screens — has a direct 1:1 precedent already in
the codebase (`src/feedback/*`, `app/quiz.tsx`'s `ReportFeedbackModal` wiring). There
is no new library, no new architectural pattern, and no ambiguity in the backend
contract (fully specified in REQUIREMENTS.md PFDBK-03).

The one open design question flagged in CONTEXT.md (D-08 — derive `screen` via
`usePathname()` vs. a hardcoded literal prop) has a clear answer from this research:
**use the hardcoded literal prop**, mirroring how `appVersion`/`platform` are already
computed per-screen today. `usePathname()` is technically capable of distinguishing
`/`, `/quiz`, `/results` in this app's flat (non-dynamic, non-grouped) route
structure, but it returns a plain `string` even with `typedRoutes` enabled (typed
routes only types `href`/`Link` targets, not `usePathname()`'s return value), so
using it would require an untyped runtime `switch`/lookup with a fallback case —
strictly more code and a new failure mode (unmapped pathname) for zero benefit over
a compile-time-safe literal already known at each call site.

**Primary recommendation:** Build `src/productFeedback/` as an exact structural
clone of `src/feedback/` (5 files: `types.ts`, `schema.ts`, `payload.ts`, `submit.ts`,
`ProductFeedbackModal.tsx`, plus `categories.ts` mirroring `reasons.ts`), pass
`screen` as a hardcoded literal string prop from each of the 3 screens (no
`usePathname()`), and wire entry points per the UI-SPEC (footer link on Setup/Results,
side-by-side button pair on Quiz with divergent visibility per D-04).

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Product feedback UI entry points (footer link, quiz buttons) | Browser/Client (RN screens, `app/`) | — | Presentational, screen-local state (`visible` boolean), matches existing `ReportFeedbackModal` wiring pattern |
| Product feedback modal (category pick, message input, submit UX) | Browser/Client (`src/productFeedback/ProductFeedbackModal.tsx`) | — | Pure RN component, mirrors `ReportFeedbackModal.tsx` |
| Payload construction & validation | Client domain logic (`src/productFeedback/payload.ts`, `schema.ts`) | — | Framework-free, unit-testable, matches `src/feedback/` split |
| Submission transport (POST /product-feedback) | Client domain logic (`src/productFeedback/submit.ts`) | API/Backend (receives, persists) | Client owns request shaping + timeout/error-union; backend owns persistence and 201/400/500 semantics (already shipped per backend v0.4) |
| Screen identification (`screen` field) | Browser/Client (screen component, literal prop) | — | Each screen already knows its own identity trivially — no need for router introspection |

## Standard Stack

No new packages required. This phase reuses the exact existing stack:

### Core (already installed, no version changes)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `zod` | ^4.4.3 (installed, confirmed via `package.json`) [VERIFIED: package.json] | Runtime schema validation for the new payload shape | Existing convention — schema is single source of truth, `z.infer` derives the type (CONVENTIONS.md) |
| `react-native` `Modal`/`TextInput`/`Pressable` | bundled w/ RN 0.86.0 | Modal UI primitives | Same primitives `ReportFeedbackModal.tsx` already uses — zero new dependency surface |
| `expo-constants` | ~57.0.3 (installed) [VERIFIED: package.json] | `appVersion` derivation | Already used in `app/quiz.tsx`; needs adding to `app/index.tsx` and `app/results.tsx` |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `react-native` `Platform` | bundled | `platform: "ios" \| "android"` derivation | Same pattern as `app/quiz.tsx` line 57 |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Hardcoded literal `screen` prop per screen | `usePathname()`-derived screen detection | `usePathname()` returns untyped `string` even under `typedRoutes`; requires a runtime mapping fn with a fallback/default case for unmapped paths. No compile-time safety, more code, no benefit in this flat 3-route app. Rejected — see D-08 resolution below. |
| Separate `src/productFeedback/` domain (D-07) | Extract shared `submit.ts`/AbortController helper between `feedback/` and `productFeedback/` | User explicitly locked zero-shared-code (D-07) to keep the two backend contracts fully decoupled; also matches CONVENTIONS.md's no-barrel-files, self-contained-domain pattern already used for `dataset/`/`quiz/`/`feedback/` |

**Installation:** None — no new packages.

## Package Legitimacy Audit

Not applicable — this phase introduces zero new external packages. All dependencies
used (`zod`, `expo-constants`, `react-native` core, `expo-router`) are already
installed and verified present in `package.json`.

## D-08 Resolution: `screen` Field Derivation (usePathname vs. hardcoded prop)

**Recommendation: hardcoded literal prop, NOT `usePathname()`.**

Investigated `node_modules/expo-router/build/exports.d.ts` [VERIFIED: installed
expo-router ~57.0.7 type exports] — `usePathname` and `useSegments` are both
exported from `expo-router`'s `hooks` module. Per Expo's official typed-routes
documentation [CITED: docs.expo.dev/router/reference/typed-routes] typed routes
(`experiments.typedRoutes: true`, already enabled in this app's `app.json`) only
adds compile-time typing to `href`/`Link`/`router.push` *targets* — it does not
change `usePathname()`'s return type, which remains a plain `string` (e.g. `"/"`,
`"/quiz"`, `"/results"`).

For this app's specific route set — three flat, non-dynamic, non-grouped routes
(`app/index.tsx` → `/`, `app/quiz.tsx` → `/quiz`, `app/results.tsx` → `/results`,
per `ARCHITECTURE.md`) — `usePathname()` would reliably distinguish the three
screens at render time (no shared-route or tab-navigator ambiguity applies here;
known `usePathname()` edge cases like stale values on protected/shared routes
[CITED: github.com/expo/expo issue #34847, #40193] don't apply to this app's
navigator shape). So it is *feasible*, but it is not the better choice:

- It would require writing an untyped `string → "setup" | "quiz" | "results"`
  mapping function inside the modal or a new shared hook, with an unavoidable
  fallback branch for any unmapped pathname (dead code path that can never be
  proven unreachable at compile time).
- It couples `ProductFeedbackModal`'s prop needs to `expo-router` internals,
  when the existing `appVersion`/`platform` precedent already establishes that
  this kind of small per-render context is computed once in the screen and
  passed down as a typed prop.
- It offers no testability advantage — the modal's own Jest tests
  (`__tests__/productFeedback-*.test.ts`) test payload/schema/submit logic in
  isolation, not the screen-level pathname-to-modal wiring (this codebase has no
  `@testing-library/react-native`, so router-hook behavior at the screen level
  is not directly unit-tested either way).

**Concrete implementation:** each of the 3 screens passes a hardcoded literal —
`screen="setup"` in `app/index.tsx`, `screen="quiz"` in `app/quiz.tsx`,
`screen="results"` in `app/results.tsx` — as a typed
`"setup" | "quiz" | "results"` prop to `ProductFeedbackModal`, exactly mirroring
how `appVersion`/`platform` are computed per-screen today.

## Architecture Patterns

### System Architecture Diagram

```text
┌─────────────────────────────────────────────────────────────────┐
│  Setup (app/index.tsx)     Quiz (app/quiz.tsx)   Results (app/results.tsx) │
│  "Help us improve" link    2 buttons (row):       "Help us improve" link   │
│       │                    "Report a problem"          │                   │
│       │                    (gated on lockedChoice)      │                  │
│       │                    "Help us improve"            │                  │
│       │                    (ungated, question-load)     │                  │
│       ▼                         │        ▼               ▼                │
│  screen="setup" prop            │   screen="quiz" prop   screen="results"  │
│       └───────────────┬─────────┴────────────┬───────────┘                │
│                        ▼                      ▼                            │
│              <ProductFeedbackModal>   <ReportFeedbackModal>  (unchanged)   │
│              (src/productFeedback/)   (src/feedback/)                      │
└──────────┬──────────────────────────────────┬──────────────────────────────┘
           │ buildProductFeedbackPayload()     │ buildFeedbackPayload()
           ▼                                    ▼
   productFeedbackPayloadSchema (Zod)   feedbackPayloadSchema (Zod)
           │                                    │
           ▼                                    ▼
   submitProductFeedback()              submitFeedback()
   POST /product-feedback               POST /feedback
   (90s AbortController timeout,        (90s AbortController timeout,
    result union: success/              result union: success/
    validation-error/server-error/      validation-error/server-error/
    network-error)                      network-error)
           │                                    │
           ▼                                    ▼
   https://portuguese-verb-api.onrender.com  (same host, two independent
   /product-feedback (NEW, backend v0.4)      endpoints — no shared code)
```

### Recommended Project Structure
```
src/
├── productFeedback/          # NEW — mirrors src/feedback/ exactly
│   ├── types.ts              # ProductFeedbackCategory, ProductFeedbackPayload, SubmitResult
│   ├── schema.ts             # productFeedbackPayloadSchema (Zod)
│   ├── categories.ts         # categoryLabels + CATEGORY_OPTIONS (mirrors reasons.ts)
│   ├── payload.ts            # buildProductFeedbackPayload()
│   ├── submit.ts             # submitProductFeedback()
│   └── ProductFeedbackModal.tsx
app/
├── index.tsx                 # MODIFIED — add footer link + modal (D-01)
├── quiz.tsx                  # MODIFIED — restructure bottom section (D-03/D-04)
└── results.tsx               # MODIFIED — add footer link + modal (D-02)
__tests__/
├── productFeedback-schema.test.ts
├── productFeedback-payload.test.ts
└── productFeedback-submit.test.ts
```

### Pattern 1: Mirrored domain module (zero shared code)
**What:** `src/productFeedback/` duplicates the shape and structure of
`src/feedback/` file-for-file, with a different field set and endpoint.
**When to use:** Whenever two backend contracts must evolve independently
(explicit constraint, D-07) and CONVENTIONS.md's "no barrel files, self-contained
domains" rule applies.
**Example:**
```typescript
// Source: mirrors src/feedback/schema.ts pattern exactly
// src/productFeedback/schema.ts
import { z } from "zod";

export const productFeedbackPayloadSchema = z.object({
  category: z.enum(["bug", "idea", "other"]),
  message: z.string().min(1).max(2000),
  screen: z.enum(["setup", "quiz", "results"]),
  appVersion: z.string().min(1).max(20),
  platform: z.enum(["ios", "android"]),
});
```

```typescript
// Source: mirrors src/feedback/types.ts pattern exactly
// src/productFeedback/types.ts
import type { z } from "zod";
import { productFeedbackPayloadSchema } from "./schema";

export type ProductFeedbackCategory = "bug" | "idea" | "other";
export type ProductFeedbackScreen = "setup" | "quiz" | "results";
export type ProductFeedbackPayload = z.infer<typeof productFeedbackPayloadSchema>;

export type SubmitResult =
  | { status: "success"; data: unknown }
  | { status: "validation-error" }
  | { status: "server-error" }
  | { status: "network-error" };
```

```typescript
// Source: mirrors src/feedback/submit.ts exactly, new endpoint only
// src/productFeedback/submit.ts
import type { ProductFeedbackPayload, SubmitResult } from "./types";

const PRODUCT_FEEDBACK_ENDPOINT =
  "https://portuguese-verb-api.onrender.com/product-feedback";
const TIMEOUT_MS = 90_000;

export async function submitProductFeedback(
  payload: ProductFeedbackPayload,
): Promise<SubmitResult> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(PRODUCT_FEEDBACK_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    if (response.status === 201) {
      const data = await response.json();
      return { status: "success", data };
    }
    if (response.status === 400) return { status: "validation-error" };
    return { status: "server-error" };
  } catch {
    return { status: "network-error" };
  } finally {
    clearTimeout(timeoutId);
  }
}
```

### Pattern 2: Divergent-visibility button pair (D-04)
**What:** Two `Pressable`s in one always-mounted `flexDirection: "row"` container;
one is gated on `lockedChoice`, the other is not — avoids layout reflow when the
gated button fades in.
**When to use:** Quiz screen's two-action row (UI-SPEC "Quiz screen two-button row").
**Example:**
```tsx
// Source: extends existing app/quiz.tsx reportButton pattern (verified in this repo)
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
    style={styles.reportButton /* no hidden/pointerEvents gating */}
  >
    <Text style={styles.reportButtonText}>Help us improve</Text>
  </Pressable>
</View>
```
Note: `reportButton`'s existing `StyleSheet` entries need `flex: 1` added (or a new
shared style) to become half-width per UI-SPEC's "two `flex: 1` (half-width)
Pressables" requirement — currently `reportButton` has no `flex` property since it
was previously the only/full-width button.

### Anti-Patterns to Avoid
- **Hardcoding hex/px values in the new modal:** `ReportFeedbackModal.tsx` (the
  pattern being mirrored) already violates the tokens convention
  (ARCHITECTURE.md Anti-Patterns) — do NOT copy that specific deviation into
  `ProductFeedbackModal.tsx`. CONTEXT.md's canonical refs explicitly call this out:
  import `colors`/`spacing`/`radius`/`typography` from `src/theme/tokens.ts` from
  the start.
- **Sharing a submit/timeout helper between `feedback/` and `productFeedback/`:**
  explicitly rejected by D-07 — keep both fully independent files even though the
  AbortController/timeout logic is byte-for-byte identical. This is intentional
  duplication, not an oversight to "clean up" during planning.
- **Rendering "Report a problem" and "Help us improve" as one conditionally-mounted
  row:** per D-04, do not gate the whole row on `lockedChoice` — only "Report a
  problem" itself is gated; the row container is always mounted so width is stable.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Payload shape validation | Manual `if` chains checking field types/lengths | Zod schema (`productFeedbackPayloadSchema`) with `z.infer` | Matches existing convention exactly; single source of truth for both compile-time type and runtime validation |
| Request timeout | Manual `Promise.race` with `setTimeout` | `AbortController` + `setTimeout(() => controller.abort(), TIMEOUT_MS)` in try/finally | Exact existing pattern in `src/feedback/submit.ts` and `src/dataset/remote.ts` — proven, tested, matches TEST-07's expected 90s-timeout test case |
| Category/reason picker UI | New segmented-control component or 3rd-party picker | Reuse the exact pill-list `Pressable` pattern from `ReportFeedbackModal`'s `reasonOption`/`reasonOptionSelected` styles (renamed for categories) | D-05 explicitly locks this — visual consistency, zero new styling surface |

**Key insight:** This entire phase is "copy a proven pattern, change the field set
and endpoint." Any deviation from `src/feedback/`'s existing structure (a new
validation approach, a new timeout pattern, a shared abstraction) adds risk without
benefit — the research finding is confirmation that mirroring, not innovating, is
correct here.

## Common Pitfalls

### Pitfall 1: Forgetting `appVersion`/`platform` derivation on Setup/Results
**What goes wrong:** `app/index.tsx` and `app/results.tsx` currently have no
`expo-constants`/`Platform` imports at all — only `app/quiz.tsx` computes these
today (lines 56-57). A naive implementation might try to pass a placeholder or
omit the fields.
**Why it happens:** The existing precedent lives in only one of the three screens
that need it.
**How to avoid:** Add `import Constants from "expo-constants";` and the
`Platform.OS` ternary (`import { Platform } from "react-native";`) to both
`app/index.tsx` and `app/results.tsx`, verbatim copy of `app/quiz.tsx` lines 3, 56-57.
**Warning signs:** TypeScript error on missing `appVersion`/`platform` props when
wiring `<ProductFeedbackModal>` into Setup/Results.

### Pitfall 2: `reportButton` style reused without adding `flex: 1`
**What goes wrong:** The existing `reportButton` style (currently full-width,
`marginTop: spacing.md`, no `flex`) is reused as-is for both buttons in the new
row, causing both to render at intrinsic content width inside a `flexDirection: "row"`
container instead of the UI-SPEC's required half-width split.
**Why it happens:** Copy-pasting the existing style object without checking it
against the new row-layout requirement.
**How to avoid:** Add a new `feedbackRow: { flexDirection: "row", gap: spacing.md, marginTop: spacing.md }`
container style, and give both buttons `flex: 1` (either as a modifier on
`reportButton` or a new shared style) — remove the old button's own `marginTop`
since the row now owns that spacing.
**Warning signs:** Buttons visually shrink-to-content and don't split the row
evenly on-device.

### Pitfall 3: Message field required-vs-optional divergence from `ReportFeedbackModal`
**What goes wrong:** `ReportFeedbackModal`'s free-text field is optional (Submit
is never disabled by it) — `ProductFeedbackModal`'s message field is **required**
per D-06/UI-SPEC (`disabled` until `message.trim().length > 0`). Copy-pasting
`ReportFeedbackModal`'s submit-button `disabled` logic verbatim would miss this.
**Why it happens:** The two modals look nearly identical, but this one validation
rule differs.
**How to avoid:** Explicitly add `message.trim().length === 0` to the submit
button's `disabled` condition in `ProductFeedbackModal.tsx` (in addition to
`isSubmitting`), unlike `ReportFeedbackModal` which only disables on `isSubmitting`.
**Warning signs:** TEST-07 or manual testing shows Submit is tappable with an
empty message.

### Pitfall 4: `screen` enum literal drift between schema, payload builder, and screen props
**What goes wrong:** `"setup" | "quiz" | "results"` is a hand-written union (unlike
`tense`/`subject` which reuse `TENSES`/`SUBJECTS` runtime arrays from
`dataset/types.ts`). Nothing today generates or re-uses a canonical `SCREENS`
array for this domain.
**Why it happens:** This is a new enum with no existing runtime-array precedent to
reuse (unlike tense/subject).
**How to avoid:** Declare `SCREENS = ["setup", "quiz", "results"] as const` once in
`src/productFeedback/types.ts` (or a small constants file) and derive both the Zod
enum (`z.enum(SCREENS)`) and the prop type from it, following the same
array-as-source-of-truth pattern `dataset/types.ts` establishes for
`TENSES`/`SUBJECTS` — do not write the literal union three separate times.
**Warning signs:** A typo in one of the three places (schema, modal prop type,
screen call site) causes a silent 400 or a TypeScript mismatch only at one call
site.

## Code Examples

### Category options list (mirrors `reasons.ts`)
```typescript
// Source: mirrors src/feedback/reasons.ts exactly, verified in this repo
// src/productFeedback/categories.ts
import type { ProductFeedbackCategory } from "./types";

export const categoryLabels: Record<ProductFeedbackCategory, string> = {
  bug: "Bug",
  idea: "Idea",
  other: "Other",
};

export const CATEGORY_OPTIONS: { value: ProductFeedbackCategory; label: string }[] = (
  ["bug", "idea", "other"] as const
).map((value) => ({ value, label: categoryLabels[value] }));
```

### Payload builder (no reason-label composition — message is used verbatim)
```typescript
// Source: derived from src/feedback/payload.ts pattern; product feedback
// message is NOT prefixed with a category label (unlike feedback's
// "<reasonLabel>: <freeText>" composition) — category is its own field.
// src/productFeedback/payload.ts
import type { ProductFeedbackPayload, ProductFeedbackCategory, ProductFeedbackScreen } from "./types";

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

## State of the Art

Not applicable — no external ecosystem/library shifted here. This is an internal
pattern-replication phase; nothing to compare against an "old vs. new approach"
industry timeline.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Backend's `POST /product-feedback` endpoint is already live and matches REQUIREMENTS.md's PFDBK-03 contract exactly (not independently re-verified against the live backend in this research session — REQUIREMENTS.md states this is sourced from "backend v0.4 contract") | Standard Stack / Code Examples | If the live endpoint's field names, enum values, or length limits differ from REQUIREMENTS.md, submissions will 400 or silently mismatch — same cross-repo contract risk pattern CLAUDE.md already flags for the existing `/feedback` endpoint. Recommend a manual smoke-test POST against the live backend before considering TEST-07 fully verified. |
| A2 | `usePathname()`'s return value for this app's 3 flat routes is exactly `"/"`, `"/quiz"`, `"/results"` with no trailing-slash or query-string variation | D-08 Resolution | Low risk since this recommendation resolves to NOT using `usePathname()` — this assumption only matters if a future phase revisits D-08 and picks the pathname-derivation path instead. |

**If this table is empty:** N/A — see above.

## Open Questions

1. **Is `POST /product-feedback` actually deployed on the live backend yet?**
   - What we know: REQUIREMENTS.md describes the exact contract as "backend v0.4"
     — implying it's part of the same backend milestone this mobile milestone
     depends on.
   - What's unclear: This research session did not make a live request to
     `https://portuguese-verb-api.onrender.com/product-feedback` to confirm the
     endpoint exists and returns the expected 201/400 shapes (backend is a
     sibling repo, out of scope for this mobile-repo research pass).
   - Recommendation: Planner should either add a manual verification task/checkpoint
     before marking TEST-07's submit-status tests "done" in spirit (the unit tests
     mock `fetch` and don't require the live endpoint to pass), or flag this as a
     pre-ship smoke-test item for the human operator, consistent with how the
     existing `POST /feedback` contract risk is called out in CLAUDE.md.

## Environment Availability

Skipped — this phase has no new external tool/runtime dependencies beyond what's
already installed and verified (Node/Expo/TypeScript toolchain unchanged, no new
npm packages).

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest via `jest-expo` ~57.0.1 preset [VERIFIED: package.json] |
| Config file | `"jest": { "preset": "jest-expo" }` in `package.json` |
| Quick run command | `npx jest __tests__/productFeedback-schema.test.ts __tests__/productFeedback-payload.test.ts __tests__/productFeedback-submit.test.ts` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PFDBK-03 | Schema accepts valid payload for all category/screen/platform combinations | unit | `npx jest __tests__/productFeedback-schema.test.ts` | ❌ Wave 0 |
| PFDBK-03 | Schema rejects invalid category/screen/platform literals | unit | `npx jest __tests__/productFeedback-schema.test.ts` | ❌ Wave 0 |
| PFDBK-03 | Schema rejects empty/over-2000-char message, empty/over-20-char appVersion | unit | `npx jest __tests__/productFeedback-schema.test.ts` | ❌ Wave 0 |
| PFDBK-03 | Payload builder maps params to exact backend field names (category/message/screen/appVersion/platform) | unit | `npx jest __tests__/productFeedback-payload.test.ts` | ❌ Wave 0 |
| PFDBK-05 | Payload builder never includes verb/tense/subject/correctAnswer/selectedAnswer keys | unit | `npx jest __tests__/productFeedback-payload.test.ts` (assert `Object.keys(payload)` is exactly the 5 allowed fields) | ❌ Wave 0 |
| PFDBK-04 | Submit returns success/validation-error/server-error/network-error per 201/400/other/reject, with 90s AbortController timeout | unit | `npx jest __tests__/productFeedback-submit.test.ts` | ❌ Wave 0 |
| PFDBK-01/02 | Entry points render on Setup/Quiz/Results, divergent visibility on Quiz | manual (no `@testing-library/react-native` in this repo — screen-level rendering is not unit-tested anywhere in this codebase) | on-device/simulator manual check | n/a — matches existing project convention of not testing screen components |
| TEST-07 | Full coverage matrix mirroring `feedback-*.test.ts` (schema/payload/submit) | unit | `npm test` | ❌ Wave 0 (all 3 files new) |

### Sampling Rate
- **Per task commit:** `npx jest __tests__/productFeedback-*.test.ts`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `__tests__/productFeedback-schema.test.ts` — covers PFDBK-03 (mirrors `__tests__/feedback-schema.test.ts` structure: valid-combination matrix + invalid-literal + empty-string rejection loop, plus new max-length rejection cases for `message` (2000) and `appVersion` (20) that `feedback-schema.test.ts` doesn't need since `feedback`'s schema has no max-length constraints)
- [ ] `__tests__/productFeedback-payload.test.ts` — covers PFDBK-03/PFDBK-05 (mirrors `__tests__/feedback-payload.test.ts` structure, minus the reason-label-composition tests since product feedback's `message` is used verbatim/trimmed, not prefixed; add an explicit "never includes quiz-answer fields" assertion for PFDBK-05)
- [ ] `__tests__/productFeedback-submit.test.ts` — covers PFDBK-04 (verbatim structural mirror of `__tests__/feedback-submit.test.ts`, same 6 test cases: 201/400/500/other-non-201/network-error/90s-timeout, only the mocked endpoint URL and payload shape differ)
- [ ] No new Jest config or fixtures needed — existing `jest-expo` preset and `globalThis.fetch` mocking pattern used identically

*(No framework install needed — `jest-expo` already configured and covers all phase requirements' automatable surface.)*

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | No auth anywhere in this product (locked constraint, CLAUDE.md "Auth Model: None") |
| V3 Session Management | No | No sessions in this product |
| V4 Access Control | No | No access-controlled resources — public feedback submission endpoint |
| V5 Input Validation | Yes | Zod schema (`productFeedbackPayloadSchema`) validates `category` enum, `message` length (1-2000), `screen` enum, `appVersion` length (1-20), `platform` enum client-side before submission; backend is the authoritative validator (client validation is UX-only, matches existing `feedback/schema.ts` pattern which is also not yet wired to call `.parse()` before submission per ARCHITECTURE.md — same non-blocking gap applies here, acceptable since backend re-validates and returns 400 on invalid payloads) |
| V6 Cryptography | No | No credentials, no crypto operations in this app (never holds Supabase credentials, per CLAUDE.md) |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Unbounded free-text `message` field submitted to public endpoint (spam/abuse) | Denial of Service (resource exhaustion via repeated submissions) | Out of scope for mobile client — backend-owned (rate limiting, if any, is a backend v0.4 concern not covered by this mobile phase); client only enforces the 1-2000 char length contract already specified |
| Injection via free-text `message` field (stored XSS if ever rendered in an admin dashboard) | Tampering | Out of scope for mobile client — backend/storage-layer concern (same as existing `/feedback` endpoint's `message` field, which has the identical shape and is already shipped); mobile only sends `JSON.stringify(payload)` over HTTPS, no client-side rendering of other users' feedback |
| Sensitive data leakage via `message` free text (a learner pastes something sensitive) | Information Disclosure | No mitigation available or expected at this layer — same accepted risk profile as the existing `/feedback` "Add details" free-text field, which has shipped without issue; PFDBK-05's guarantee (no quiz-answer context ever included) is the only structural leakage constraint this phase must enforce, and it's covered by the payload-builder unit tests above |

## Sources

### Primary (HIGH confidence)
- `package.json` (this repo) - confirmed `zod` ^4.4.3, `expo-router` ~57.0.7, `expo-constants` ~57.0.3, `expo` ~57.0.7, `jest-expo` ~57.0.1 all installed
- `node_modules/expo-router/build/exports.d.ts` (this repo, installed package) - confirmed `usePathname`/`useSegments` export surface
- `src/feedback/{types,schema,payload,submit,reasons}.ts`, `src/feedback/ReportFeedbackModal.tsx` (this repo) - exact pattern being mirrored, read in full
- `app/{index,quiz,results}.tsx` (this repo) - exact integration points, read in full
- `__tests__/feedback-{schema,payload,submit}.test.ts` (this repo) - exact test structure/coverage matrix being mirrored, read in full
- `.planning/phases/19-general-product-feedback/19-CONTEXT.md`, `19-UI-SPEC.md` - locked decisions and visual contract, read in full
- `.planning/REQUIREMENTS.md` - exact backend v0.4 contract for `POST /product-feedback` (PFDBK-03), read in full

### Secondary (MEDIUM confidence)
- [Expo Router Typed Routes docs](https://docs.expo.dev/router/reference/typed-routes/) - confirms typed routes types `href` targets, doesn't claim to type `usePathname()`'s return (inferred from doc scope, not an explicit negative statement in the doc — see note below)

### Tertiary (LOW confidence)
- [usePathname() incorrect on protected routes · expo/expo#34847](https://github.com/expo/expo/issues/34847), [usePathname() returns "/" for tabs with shared routes · expo/expo#40193](https://github.com/expo/expo/issues/40193) - community-reported edge cases for `usePathname()` in navigator shapes (protected routes, tab navigators with shared routes) that don't apply to this app's flat 3-route `Stack` navigator, cited only to show the class of risk being avoided by choosing the hardcoded-prop fallback

## Metadata

**Confidence breakdown:**
- Standard Stack: HIGH - zero new packages, all versions confirmed directly from this repo's `package.json`
- Architecture: HIGH - every pattern has a verified, read-in-full precedent in this exact codebase
- Pitfalls: HIGH - derived from direct diff analysis between the existing `feedback/`/screen code and the new requirements (UI-SPEC field/behavior deltas), not speculative
- D-08 resolution: MEDIUM-HIGH - `usePathname()` typing behavior confirmed via installed package types + official docs scope; the "no benefit in this app" conclusion is reasoning from the app's known flat route structure (HIGH confidence on that part, since routes are directly enumerable in this repo)

**Research date:** 2026-07-22
**Valid until:** 30 days (stable internal pattern-replication phase, no fast-moving external dependency)
