---
phase: 28-ui-token-application
plan: 02
subsystem: ui
tags: [tokens, pressable, interaction-states, theme]
dependency-graph:
  requires: [THEME-01, THEME-02]
  provides: [UI-01, UI-02]
  affects: [app/index.tsx, app/quiz.tsx, app/results.tsx]
tech-stack:
  added: []
  patterns:
    - "Pressable function-form style prop: style={({ pressed }) => [...]}"
    - "colors.pressed appended as the LAST array entry so it always wins over the base background"
key-files:
  created: []
  modified:
    - app/index.tsx
    - app/quiz.tsx
    - app/results.tsx
decisions:
  - "Setup 'Lafa' heading confirmed unchanged (typography.heading + colors.text, text-only) — no edit needed for UI-01"
  - "Quiz choice buttons gate the pressed override with lockedChoice === null so post-lock success/error coloring always wins (D-03)"
metrics:
  duration: "~15 minutes"
  completed: 2026-08-14
---

# Phase 28 Plan 02: Pressed-State Token Wiring Summary

Wired the already-defined `colors.pressed` (`#C94A2D`) token into pressed-state
visuals on five primary-action `Pressable`s across the three screens, using
`Pressable`'s function-form `style` prop for the first time in this codebase.

## What Was Built

- **app/index.tsx**: `startButton` converted from array-literal `style` to
  `({ pressed }) => [...]` with `pressed && { backgroundColor: colors.pressed }`
  appended last. Confirmed (no edit needed) that the "Lafa" heading remains
  `<Text style={styles.heading}>Lafa</Text>` at `typography.heading` +
  `colors.text`, satisfying UI-01.
- **app/quiz.tsx**: Choice-button `Pressable` (inside
  `question.choices.map(...)`) converted to function form with the pressed
  override gated by `lockedChoice === null && pressed` — once a choice is
  locked, `choiceStyle()`'s success/error coloring is never overridden.
  `nextButton` converted to function form with an unconditional pressed
  override; its existing `pointerEvents` hide/show gate was left untouched.
- **app/results.tsx**: `shareButton` and `tryAgainButton` both converted from
  bare `style={styles.X}` references to function form with the pressed
  override appended. `backButton` ("Back to Setup") intentionally left
  unmodified.

All three tasks strictly followed the D-04 mechanism from the plan's
`<interfaces>` section: no `onPressIn`/`onPressOut`/`useState` press
tracking was introduced anywhere.

## Verification

- `npm run typecheck` — exits 0
- `npm run lint` — no new errors
- `npx jest` — 21 suites, 251 tests, all passing
- All per-task acceptance-criteria grep counts verified exactly as specified
  in 28-02-PLAN.md (Tasks 1–3)
- Plan-wide verification: `grep -rc "onPressIn\|onPressOut\|useState.*pressed" app/` → 0 matches;
  `grep -rEn "#[0-9A-Fa-f]{6}" app/` → 0 matches (no raw hex literals introduced)

## Deviations from Plan

### Note (not a fix, informational only)

**Task 2 acceptance criterion `pointerEvents={lockedChoice === null ? "none" : "auto"}` grep count**
The plan's acceptance criteria state this grep should return `1` ("unchanged").
In practice it returns `2`, both before and after this plan's edits — the
pattern is shared verbatim by `nextButton` and the pre-existing
`reportButton` (`app/quiz.tsx`), which both use the identical
`pointerEvents={lockedChoice === null ? "none" : "auto"}` expression. This
plan did not add, remove, or modify any `pointerEvents` prop — the count of
`2` is the pre-existing state, not a regression. No fix needed; flagging only
because the acceptance criteria text assumed a count of `1`.

### Auto-fixed Issues

None — plan executed exactly as written for all code changes.

## Human Verification Needed (Task 4 — deferred to end-of-phase)

Task 4 of `28-02-PLAN.md` is a `checkpoint:human-verify` gate. Per this
execution's checkpoint-handling instructions (default `end-of-phase` mode,
not `mid-flight`), it was **not** run inline. The app was not launched via
`npm run ios` by this executor. The following verification content is
recorded here verbatim for the orchestrator to consolidate into an
end-of-phase `HUMAN-UAT.md`:

**What was built:** Pressed-state backgrounds (`colors.pressed`, deep orange
`#C94A2D`) on the Setup Start Quiz button, Quiz choice buttons (unanswered
only), Quiz Next button, and Results Share Score / Try Again buttons — all
via `Pressable`'s function-form `style` prop. The Setup "Lafa" heading was
confirmed unchanged (text-only).

**How to verify:**
1. Run `npm run ios` and open the app.
2. Setup screen: press and HOLD "Start Quiz" — the button background should
   darken to deep orange while held, and return to `#F2643E` on release.
   Confirm the "Lafa" heading is plain text with no icon.
3. Press and hold a tense chip and the verb-mode chips — they must NOT
   change color (out of scope by design).
4. Start a quiz. Press and hold an answer choice WITHOUT releasing — the
   choice should darken to deep orange. Release to lock it in.
5. With a choice now locked (green/red showing), press and hold any choice
   again — the green/red coloring must NOT be replaced by deep orange.
6. Press and hold "Next" — should darken to deep orange.
7. Finish the quiz. On Results, press and hold "Share Score" and "Try Again"
   — both should darken to deep orange. Press and hold "Back to Setup" —
   it must NOT change color (out of scope by design).

**Acceptance criteria:**
- Start Quiz, Next, Share Score, Try Again each visibly darken while held and revert on release
- An unanswered quiz choice darkens while held
- A locked quiz choice retains its success/error color while held (no orange override)
- Setup chips and the Results "Back to Setup" link show no pressed color change
- The Setup "Lafa" heading renders as text only, no icon or oversized display type

**Resume signal:** Type "approved" or describe which button behaved incorrectly.

## Threat Flags

None — styling-only change on existing `Pressable` components; no new
inputs, event handlers, data flows, network calls, or dependencies.

## Commits

- `9d80adf` — feat(28-02): wire pressed state into Setup's Start Quiz button
- `0955a1e` — feat(28-02): wire pressed state into Quiz choice buttons and Next button
- `8443bda` — feat(28-02): wire pressed state into Results Share Score and Try Again buttons

## Self-Check: PASSED

- FOUND: app/index.tsx (modified, contains `({ pressed })`)
- FOUND: app/quiz.tsx (modified, contains `({ pressed })` x2)
- FOUND: app/results.tsx (modified, contains `({ pressed })` x2)
- FOUND commit 9d80adf in `git log --oneline`
- FOUND commit 0955a1e in `git log --oneline`
- FOUND commit 8443bda in `git log --oneline`
