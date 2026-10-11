# Phase 33: Quiz Press-State Color Fix - Context

**Gathered:** 2026-08-16
**Status:** Ready for planning

<domain>
## Phase Boundary

Fix a color-token bug in the quiz screen: pressing-and-holding an
unsubmitted answer choice currently uses `colors.pressed` (`#C94A2D`), a
dark red close enough to `colors.error` (`#D64545`) that a learner can
misread the press feedback as a "wrong answer" signal before they've even
submitted. This phase adds a dedicated `colors.choicePressed` token, wires
it into `app/quiz.tsx`'s answer-choice `Pressable`, and adds an explicit
check proving the locked correct/incorrect coloring always wins over the
pressed color once an answer is submitted. No other `colors.pressed` usage
(e.g. the Next button) is in scope — only the answer-choice `Pressable`.

</domain>

<decisions>
## Implementation Decisions

### `colors.choicePressed` value
- **D-01:** Add `colors.choicePressed = "#E3DFDA"` to `src/theme/tokens.ts`
  — a modestly darkened, desaturated shade of `colors.surface` (`#F1EFED`).
  Chosen specifically to be visually unrelated to `colors.success`
  (`#1F7F66`, green) and `colors.error` (`#D64545`, red) so press feedback
  reads as neutral "tap acknowledged," not as a correctness signal.
- **D-02:** This token is scoped only to unsubmitted quiz answer-option
  press/hold states (per UX-01) — not a general-purpose replacement for
  `colors.pressed` elsewhere in the app (e.g. Next button, header controls
  keep using `colors.pressed`).

### UX-03 verification approach
- **D-03:** `app/quiz.tsx`'s `choiceStyle()` function currently only
  computes the *locked-state* container/text styles (default / correct /
  wrong) — the pressed-color decision is a separate inline condition on
  the `Pressable`'s `style` prop
  (`lockedChoice === null && pressed && { backgroundColor: colors.pressed }`).
  Extract a single pure function that takes both the locked state and the
  `pressed` boolean and returns the final resolved style, so the
  precedence guarantee (locked correct/incorrect always overrides pressed)
  is expressed and tested in one place, not split across two code paths.
- **D-04:** Follow existing project convention: put this extracted
  function in a framework-free module under `src/quiz/` (mirrors
  `src/quiz/scoring.ts`, `src/quiz/share.ts`, `src/quiz/labels.ts` —
  small, single-purpose, named exports, no React/RN imports), and add a
  Jest unit test in `__tests__/` (e.g. `quiz-choice-style.test.ts`)
  covering at minimum: locked+correct, locked+wrong (selected-wrong and
  unselected-but-correct-when-wrong-was-picked), and unlocked+pressed —
  asserting the locked-state styles always take precedence over the
  pressed style in every combination. This satisfies UX-03's "explicit
  behavioral check" requirement without needing
  `@testing-library/react-native` (not present in this codebase).
- **D-05:** `app/quiz.tsx` is updated to call the extracted function
  instead of the current inline `choiceStyle()` + separate pressed
  condition, keeping the component itself thin.

### Claude's Discretion
- Exact function name, file name, and parameter shape for the extracted
  module are left to planning/implementation, as long as it lives under
  `src/quiz/`, is a pure function (no React/RN deps), is unit-testable,
  and absorbs both the locked-state and pressed-state decisions per D-03.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements
- `.planning/REQUIREMENTS.md` (UX-01, UX-02, UX-03) — locks the three
  success criteria for this phase: token addition, wiring, and precedence
  verification.
- `.planning/ROADMAP.md` (Phase 33 entry) — phase goal and success
  criteria, confirms this phase is independent of Phases 31-32.

### Existing code (read before changing)
- `src/theme/tokens.ts` — where `colors.choicePressed` is added; existing
  `colors.pressed`, `colors.success`, `colors.error` values that motivate
  the color choice.
- `app/quiz.tsx` (lines ~82-97 `choiceStyle()`, ~139-152 answer-choice
  `Pressable`) — the exact logic being extracted and rewired.

No other external specs — requirements fully captured in decisions above.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/quiz/scoring.ts`, `src/quiz/share.ts`, `src/quiz/labels.ts` —
  established pattern for small, pure, single-purpose modules under
  `src/quiz/` with named exports; the new extracted style-resolution
  function should follow this same shape.
- `__tests__/quiz-engine.test.ts`, `__tests__/quiz-scoring.test.ts` —
  established pattern for testing `src/quiz/` pure functions with
  `mockRandom`-style deterministic inputs; the new test file should follow
  this convention (plain-function unit tests, no component rendering).

### Established Patterns
- `noUncheckedIndexedAccess` is enabled — no array/record indexing
  concerns expected in this extracted function (it operates on scalar
  `choice`/`correctAnswer`/`lockedChoice`/`pressed` values), but keep the
  convention in mind if any lookups are introduced.
- Named exports only, no default exports, no barrel files — matches
  `CONVENTIONS.md`.

### Integration Points
- `app/quiz.tsx`'s answer-choice `Pressable` (`style={({ pressed }) => [...]}`
  callback) is the sole call site that needs rewiring to use the new
  extracted function and `colors.choicePressed`.

</code_context>

<specifics>
## Specific Ideas

- The bug is specifically that `colors.pressed` (`#C94A2D`) and
  `colors.error` (`#D64545`) are close enough in hue/darkness that a
  learner pressing-and-holding an unsubmitted choice can misread it as
  "you got this wrong" — the fix must produce a color that is clearly
  *not* red/green-adjacent. `#E3DFDA` (darkened `colors.surface`) was
  chosen for this reason.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 33-Quiz Press-State Color Fix*
*Context gathered: 2026-08-16*
