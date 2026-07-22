# Phase 19: General Product Feedback - Context

**Gathered:** 2026-07-22
**Status:** Ready for planning

<domain>
## Phase Boundary

A learner can submit general app feedback (bug/idea/other) from any of the 3
screens (Setup, Quiz, Results), independent of and never including any
quiz-answer context, via a new `POST /product-feedback` endpoint matching the
backend v0.4 contract exactly. This is additive to, and fully independent
from, the existing quiz-specific `POST /feedback` ("Report a problem") flow,
which is untouched.

</domain>

<decisions>
## Implementation Decisions

### Entry point placement
- **D-01:** Setup screen — "Help us improve" is a small, low-visual-weight
  footer text link (not a header icon, not a settings-style row), placed
  below the Start Quiz button so it never competes with the primary action.
- **D-02:** Results screen — "Help us improve" is the same small footer-link
  treatment, placed below the existing Share Score / Try Again / Back to
  Setup action group (not a 4th equally-weighted button, not a header icon).
  This keeps the entry-point pattern visually consistent across Setup and
  Results.

### Quiz two-action row
- **D-03:** "Report a problem" and "Help us improve" are equal-weight,
  side-by-side secondary buttons (both styled like today's existing
  "Report a problem" button, split into two half-width buttons in a row) —
  not one-primary/one-secondary.
- **D-04 (resolves a ROADMAP wording conflict — read carefully):**
  ROADMAP.md's Phase 19 success criteria literally says "after an answer is
  locked, a two-action row offers 'Report a problem' and 'Help us improve'",
  implying both appear together post-lock. The user's actual intent, given
  explicitly during discussion, is:
  - **"Help us improve" is available immediately** when the question loads
    (pre-lock) — general feedback isn't about the current answer, so gating
    it on `lockedChoice` adds friction with no benefit, and per PFDBK-05 it
    must never include quiz-answer context anyway.
  - **"Report a problem" still only appears once an answer is locked**
    (unchanged from current behavior — it inherently needs
    `selectedAnswer`/`correctAnswer` to be meaningful).
  - They are therefore NOT rendered as one single "row" that appears/disappears
    together the whole time — "Help us improve" is present from question-load,
    and "Report a problem" joins it once locked. Downstream agents (researcher,
    planner) should implement this divergent-timing behavior, not the literal
    "row appears together after lock" reading of ROADMAP.md. This is a
    deliberate scope clarification, not scope creep — the two flows and their
    final rendered positions are unchanged; only the reveal timing of one of
    them is clarified.

### Feedback modal UX
- **D-05:** Category picker (bug/idea/other) reuses the exact pill-list
  pattern from `ReportFeedbackModal`'s reason picker (row of selectable
  pressable pills) — not a segmented control. Visual consistency with the
  existing modal, minimal new styling.
- **D-06:** Message field (1-2000 chars) validation is submit-time only, no
  live character counter — matches `ReportFeedbackModal`'s existing pattern
  (no counter there either). Disable Submit until non-empty; rely on
  schema/backend validation for the 2000-char max; show the same inline
  error text pattern on a 400 response as the existing Report flow.

### Component/domain structure
- **D-07:** `src/productFeedback/` is a full mirror of `src/feedback/` with
  zero shared code — separate `types.ts`, `schema.ts`, `payload.ts`,
  `submit.ts`, `ProductFeedbackModal.tsx`. No shared AbortController/timeout
  helper extracted. This matches CONVENTIONS.md (no barrel files, one
  concern per file, self-contained domains) and keeps the two independently-
  evolving backend contracts (`/feedback` vs `/product-feedback`) fully
  decoupled per ROADMAP's explicit "existing POST /feedback untouched"
  constraint.
- **D-08:** The `screen` field (`setup`/`quiz`/`results`) is derived from the
  current expo-router route/pathname inside the modal or a shared hook,
  rather than each screen passing a hardcoded literal prop. **Flag for
  research:** verify feasibility with `expo-router`'s `usePathname()` (or
  equivalent) before planning locks this in — confirm it reliably
  distinguishes `/` (setup), `/quiz`, and `/results` at the point the modal
  is rendered, and that it works the same for TypeScript's typed-routes mode
  (`experiments.typedRoutes: true` is enabled in `app.json`). If pathname
  derivation proves unreliable or awkward, the fallback is a hardcoded
  literal prop per screen (same pattern as `appVersion`/`platform` today).

### Claude's Discretion
- Exact wording of modal titles, success/error copy for
  `ProductFeedbackModal` (not discussed in detail — follow
  `ReportFeedbackModal`'s existing tone: "✓ ... sent — thank you!" /
  "Something went wrong. Please try again.").
- Exact footer-link copy ("Help us improve" is locked by ROADMAP; styling
  details like font size/color are Claude's call, informed by `theme/tokens.ts`).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Contract & requirements
- `.planning/ROADMAP.md` (Phase 19 section) — goal, dependencies, 5 numbered
  success criteria, requirement IDs
- `.planning/REQUIREMENTS.md` (PFDBK-01 through PFDBK-05, TEST-07) — exact
  payload contract, field constraints, test coverage matrix

### Existing pattern to mirror
- `src/feedback/types.ts`, `src/feedback/schema.ts`, `src/feedback/payload.ts`,
  `src/feedback/submit.ts`, `src/feedback/reasons.ts`,
  `src/feedback/ReportFeedbackModal.tsx` — the exact structural/behavioral
  pattern `src/productFeedback/` must mirror (schema-first with `z.infer`,
  result-union submit function, 90s AbortController timeout, pill-list
  category picker, modal state machine idle/submitting/success/error)

### Screens to integrate
- `app/index.tsx` (Setup — no existing feedback entry point)
- `app/quiz.tsx` (Quiz — existing `ReportFeedbackModal` wiring at the bottom
  of the component; `appVersion`/`platform` already computed here via
  `expo-constants`/`Platform.OS`)
- `app/results.tsx` (Results — no existing feedback entry point)

### Design tokens
- `src/theme/tokens.ts` — `colors`, `spacing`, `radius`, `typography` for
  the new modal and footer-link styling (note:
  `.planning/codebase/ARCHITECTURE.md`'s Anti-Patterns section flags that
  `ReportFeedbackModal.tsx` currently hardcodes hex/px values instead of
  using tokens — do NOT copy that anti-pattern into the new
  `ProductFeedbackModal.tsx`; use tokens from the start)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/feedback/reasons.ts` pattern (a `Record<T, string>` label map plus a
  derived `{value,label}[]` array) — reuse the same shape for
  `category` (bug/idea/other) labels in the new domain.
- `expo-constants`/`Platform.OS` appVersion/platform derivation already
  exists in `app/quiz.tsx` (lines ~56-57) — same values needed on
  `app/index.tsx` and `app/results.tsx`, currently not computed there.

### Established Patterns
- Zod schema is the single source of truth paired with `z.infer` — no
  hand-written parallel interface (CONVENTIONS.md).
- Submit functions never throw — always return a tagged `SubmitResult`
  union (`success | validation-error | server-error | network-error`),
  branching strictly on `response.status` (201/400/else) wrapped in
  try/catch/finally with `AbortController` timeout (CONVENTIONS.md,
  `src/feedback/submit.ts`).
- Named exports only, no default exports, no barrel files
  (CONVENTIONS.md) — apply to every new `src/productFeedback/*.ts` file.

### Integration Points
- `app/index.tsx` and `app/results.tsx` need new local state
  (`productFeedbackVisible`) and a rendered `<ProductFeedbackModal>` at the
  bottom, following the exact pattern already in `app/quiz.tsx` for
  `ReportFeedbackModal`.
- `app/quiz.tsx` needs the existing bottom section restructured: keep
  `ReportFeedbackModal` gated on `lockedChoice !== null` (unchanged), add
  `ProductFeedbackModal` ungated (visible/available from question-load per
  D-04), and lay both trigger buttons out side-by-side per D-03.

</code_context>

<specifics>
## Specific Ideas

No specific visual mockups or exact copy were provided beyond what's
captured in Decisions above — the user consistently deferred to "match the
existing Report a problem pattern" as the reference implementation to
extend, not replace.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope. No scope-creep suggestions
came up during this session.

</deferred>

---

*Phase: 19-general-product-feedback*
*Context gathered: 2026-07-22*
