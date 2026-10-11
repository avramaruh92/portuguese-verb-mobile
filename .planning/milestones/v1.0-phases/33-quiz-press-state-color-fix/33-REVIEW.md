---
phase: 33-quiz-press-state-color-fix
reviewed: 2026-08-16T00:00:00Z
depth: standard
files_reviewed: 5
files_reviewed_list:
  - src/theme/tokens.ts
  - src/theme/tokens.test.ts
  - src/quiz/choiceStyle.ts
  - __tests__/quiz-choice-style.test.ts
  - app/quiz.tsx
findings:
  critical: 0
  warning: 1
  info: 2
  total: 3
status: issues_found
---

# Phase 33: Code Review Report

**Reviewed:** 2026-08-16
**Depth:** standard
**Files Reviewed:** 5
**Status:** issues_found

## Summary

This phase extracts answer-choice press/lock coloring out of `app/quiz.tsx`
into a new pure, framework-free module (`src/quiz/choiceStyle.ts`) and adds
a dedicated neutral `colors.choicePressed` token, replacing the old bug
where an unsubmitted, held-down choice tinted with `colors.pressed`
(`#C94A2D`) — visually close enough to `colors.error` (`#D64545`) to be
misread as "wrong answer" before submitting.

`resolveChoiceStyle`'s precedence logic (locked state always wins over
`pressed`) is correct and exhaustively covered by
`__tests__/quiz-choice-style.test.ts` (15 cases including the 4 explicit
precedence assertions). I traced every branch by hand against all
locked/unlocked × selected/unselected × correct/incorrect × pressed/not
combinations and found no logic gaps or unreachable branches. `tsc --noEmit`
and the two new/changed test suites pass locally (19/19). Conventions are
followed: named exports only, no React/RN imports in `src/quiz/`,
`noUncheckedIndexedAccess`-safe, tokens used instead of hardcoded literals
in the changed styling code.

The one substantive issue is a maintainability/correctness-risk pattern in
`app/quiz.tsx`: `resolveChoiceStyle` is called twice per choice per render
(once with `pressed=false` for text color, once with the live `pressed`
value for background color). This works correctly today only because
`resolveChoiceStyle` happens to return the same `textColor` for the
`"default"` and `"pressed"` variants — that invariant is not enforced by
the type system or a comment, so a future change to give the pressed state
its own text color would silently desync text/background pairing without
any test catching it (the existing tests only assert the return value of a
single call, never that both call sites the caller makes agree).

## Warnings

### WR-01: Duplicate `resolveChoiceStyle` calls in `app/quiz.tsx` can silently desync text/background color

**File:** `app/quiz.tsx:123-140`
**Issue:** For each choice, `resolveChoiceStyle` is invoked twice with
different `pressed` arguments — once to compute `base.textColor` (always
`pressed=false`) outside the `Pressable`'s style callback, and again inside
the callback with the live `pressed` value to compute `backgroundColor`:

```tsx
const base = resolveChoiceStyle(choice, question.correctAnswer, lockedChoice, false);
return (
  <Pressable
    style={({ pressed }) => [
      styles.choice,
      {
        backgroundColor: resolveChoiceStyle(
          choice, question.correctAnswer, lockedChoice, pressed,
        ).backgroundColor,
      },
    ]}
  >
    <Text style={[styles.choiceText, { color: base.textColor }]}>{choice}</Text>
  </Pressable>
);
```

This is correct today only because `resolveChoiceStyle`'s `"pressed"`
variant happens to return the same `textColor` (`colors.text`) as
`"default"`. Nothing enforces that invariant — if a future change gives the
pressed variant its own `textColor` (e.g. for contrast against a darker
tint), the background will update on press but the text color computed
from the stale `pressed=false` call will not, producing an inconsistent
button. No test in `__tests__/quiz-choice-style.test.ts` would catch this
because tests only assert a single call's return value in isolation, never
that the two call sites in `app/quiz.tsx` agree with each other.
**Fix:** Compute `resolveChoiceStyle` once per choice using the actual
`pressed` value, and destructure both `backgroundColor` and `textColor`
from that single result inside the style callback (or lift `pressed` state
via `useState` per choice if the two need to be combined outside the
callback). E.g.:

```tsx
{question.choices.map((choice) => (
  <Pressable
    key={choice}
    onPress={() => selectAnswer(choice)}
    style={({ pressed }) => [
      styles.choice,
      { backgroundColor: resolveChoiceStyle(choice, question.correctAnswer, lockedChoice, pressed).backgroundColor },
    ]}
  >
    {({ pressed }) => (
      <Text
        style={[
          styles.choiceText,
          { color: resolveChoiceStyle(choice, question.correctAnswer, lockedChoice, pressed).textColor },
        ]}
      >
        {choice}
      </Text>
    )}
  </Pressable>
))}
```

## Info

### IN-01: `ChoiceVariant`/`variant` field is produced but never consumed outside tests

**File:** `src/quiz/choiceStyle.ts:3-9`, `app/quiz.tsx:123,131`
**Issue:** `resolveChoiceStyle` returns a `variant` field (`"default" |
"pressed" | "correct" | "wrong"`) and exports the `ChoiceVariant` type, but
`app/quiz.tsx` only ever destructures `.backgroundColor` and `.textColor`
from the result — `variant` is read only in
`__tests__/quiz-choice-style.test.ts` assertions. Not a bug, but worth
noting the field currently has no production consumer; if it's meant to
support a future feature (e.g. an icon/checkmark per variant), that's fine
as forward-looking API surface, but if not, it's unused surface area.
**Fix:** No action required unless a consumer is planned; otherwise
consider whether `variant` should be dropped from the public return shape
until something other than tests reads it.

### IN-02: `resolveChoiceStyle`'s locked-branch conditionals repeat `choice === correctAnswer` / `choice === lockedChoice` three times

**File:** `src/quiz/choiceStyle.ts:17-28`
**Issue:** The four-way branch inside `if (lockedChoice !== null)` re-derives
`choice === lockedChoice` and `choice === correctAnswer` as raw expressions
in each `if`, rather than naming them once (e.g. `isSelected`,
`isCorrect`) as the prior implementation in `app/quiz.tsx` did before this
phase. This is a minor readability regression, not a logic bug — the
branches were hand-verified to be correct and mutually exclusive.
**Fix:** Optionally extract `const isSelected = choice === lockedChoice;`
and `const isCorrect = choice === correctAnswer;` at the top of the
function to reduce repetition, matching the style of the code this
function replaced.

---

_Reviewed: 2026-08-16_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
