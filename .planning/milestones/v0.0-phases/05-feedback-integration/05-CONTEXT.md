# Phase 5: Feedback Integration - Context

**Gathered:** 2026-07-12
**Status:** Ready for planning

<domain>
## Phase Boundary

A learner can report a problem with the question they're currently looking at,
directly from the Quiz screen, via a modal that submits to the live backend's
`POST /feedback`. The app handles the backend's real-world success/error/cold-start
behavior gracefully — success, validation error, generic server error, and
network/timeout — without ever blocking or interrupting quiz completion itself.
No dataset, quiz-engine, or Setup/Results-screen changes — those are locked from
Phases 2-4. No feedback history, no viewing past submissions, no editing/deleting
submitted feedback — out of scope for v0.

</domain>

<decisions>
## Implementation Decisions

### Entry Point
- **D-01:** The "Report a problem" affordance lives on the Quiz screen
  (`app/quiz.tsx`), not the Results screen. Feedback is about the specific question
  the learner is looking at right now, so it needs live access to that question's
  `verb`/`tense`/`subject`/`correctAnswer` plus the learner's `selectedAnswer`.
- **D-02:** The button only appears/becomes usable once the answer is locked
  (i.e. `lockedChoice !== null` in the existing quiz store) — `selectedAnswer` is a
  required field on the locked backend contract, so there is no valid state to
  submit feedback before the learner has answered the current question.

### Report Form & Submission
- **D-03:** Tapping "Report a problem" opens a modal/sheet containing:
  - A short preset reason picker: **Wrong answer / Typo or spelling / Confusing
    wording / Other**
  - A free-text message input (maps to the backend's single `message` field —
    combine the preset reason + free text into one string, e.g.
    `"Wrong answer: <free text>"` or similar; exact string composition left to
    planner/implementer as long as the reason is legible in the submitted message)
- **D-04:** Submission is a blocking modal interaction: once the user taps submit,
  the modal shows an inline spinner and disables further input *within the modal*
  until the request resolves. This does NOT block the quiz underneath — the Quiz
  screen and its state remain fully interactive/untouched while the modal is open,
  satisfying FDBK-03. The learner could theoretically dismiss/back out of the modal
  while a request is in flight; treat that as an implicit cancel from the UI's
  perspective (the in-flight request itself may still complete in the background,
  but the UI stops waiting on it) — exact cancel/AbortController wiring is
  implementer's discretion.

### Response Handling
- **D-05 (Success / 201):** Show a brief success message with a checkmark inside
  the modal, auto-dismiss after ~1.5 seconds, returning the learner to the (still
  untouched) Quiz screen.
- **D-06 (400 / ValidationError):** Show a generic "Something went wrong, try
  again" message. Do NOT parse or surface the `fields` object from the response —
  a 400 here should only ever indicate an app-side payload-mapping bug (the only
  free-text field has no format constraints worth surfacing per-field), not a
  learner-fixable input error.
- **D-07 (500 / InternalServerError):** Show the same generic error message as
  400, plus a **Retry** button. The modal stays open and preserves the learner's
  already-entered reason + message text — no need to re-type on retry.
- **D-08 (Network error / timeout):** Treat identically to the 500 case (generic
  error + Retry, modal stays open, input preserved).
- **D-09 (Timeout threshold):** Client-side request timeout is **~90 seconds** —
  comfortably covers the backend's documented cold-start window (up to ~1 min per
  STATE.md's Phase 5 blocker note) with headroom, so a slow-but-succeeding cold
  start isn't cut off prematurely. Implement via `AbortController` per the stack
  research's `submitFeedback()` guidance (native `fetch`, no axios).

### Claude's Discretion
- Exact visual layout of the report modal/sheet (native `Modal` vs a custom
  bottom-sheet-style overlay, spacing, typography, colors) — consistent with the
  plain `StyleSheet.create` approach already used across `app/index.tsx`,
  `app/quiz.tsx`, `app/results.tsx`. This phase has `UI hint: yes` in ROADMAP.md —
  consider `/gsd:ui-phase 5` for a design contract before/alongside planning if
  visual polish matters beyond functional correctness.
- Exact string composition combining the preset reason + free-text message into
  the single backend `message` field.
- Where the feedback-submission logic lives in the file tree (e.g. a new
  `src/feedback/` module mirroring `src/quiz/`'s pattern) — follow the existing
  `app/` routes-only + `src/<domain>/` logic convention from Phase 1 D-02.
- `appVersion` sourcing — per the stack research, prefer
  `Constants.expoConfig?.version` (via `expo-constants`, likely already a
  transitive dependency) over adding `expo-application`.
- `platform` field — derive from React Native's `Platform.OS` at submission time
  (`"ios" | "android"`) rather than hardcoding `"ios"`, so the mapping stays
  correct if the app is ever run on Android during development, even though the
  product is iOS-first.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Backend Contract (locked cross-repo, CLAUDE.md)
- `CLAUDE.md` §"Key Domain Facts" — the full locked `POST /feedback` request
  contract: fields (`message`, `verb`, `tense`, `subject`, `correctAnswer`,
  `selectedAnswer`, `appVersion`, `platform`), enum literals for `tense`/
  `subject`/`platform`, and exact response shapes for 201/400/500. This is the
  single source of truth for the payload shape FDBK-01/02/04 must satisfy.
- CLAUDE.md's "IMPORTANT — cross-repo contract risk" note — verify the app's
  actual `Tense`/`Subject` enum literals (locked in Phase 2, see
  `02-CONTEXT.md` D-03 below) match the backend's expected literals exactly
  before wiring submission, or legitimate feedback will 400.

### Project Contract
- `.planning/PROJECT.md` — core value loop; feedback must never block it
- `.planning/ROADMAP.md` §Phase 5 — success criteria this phase must satisfy;
  `UI hint: yes` flag — consider `/gsd:ui-phase 5`
- `.planning/REQUIREMENTS.md` §Feedback — FDBK-01/02/03/04 exact requirement
  wording
- `.planning/STATE.md` — Phase 5 blocker note: "Render free-tier cold starts
  (up to ~1 min) must not block or corrupt quiz completion — build feedback
  submission as fire-and-forget-from-the-quiz's-perspective (D-04/D-09 above),
  never a blocking await on the quiz thread. Live round-trip test against
  deployed API needed during this phase; final cold-start manual test deferred
  to Phase 6."

### Stack Research (feedback-specific guidance)
- Root `CLAUDE.md`'s embedded Technology Stack research — `zod` for payload
  validation (mirror the backend's Zod contract in a `feedbackPayload.ts`
  module), native `fetch` (not axios) with `AbortController`-based timeout
  (D-09), `expo-constants`'s `Constants.expoConfig.version` for `appVersion`.

### Prior Phases
- `.planning/phases/02-dataset-domain-vocabulary/02-CONTEXT.md` D-03 — internal
  `Tense`/`Subject` values ARE intended to be the backend enum literals; this
  phase is where that assumption finally gets exercised against the real live
  API for the first time — treat the first successful live round-trip as the
  actual verification of that assumption, not just a code-level check.
- `.planning/phases/04-quiz-experience-setup-quiz-results/04-CONTEXT.md` — Quiz
  screen structure (D-05/D-06/D-07/D-08) this phase adds a report button
  alongside without disrupting; `useQuizStore` shape this phase reads from
  (`session`, `currentIndex`, `lockedChoice`) but does not mutate.

No other external specs — requirements fully captured in decisions above.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `app/quiz.tsx` — existing Quiz screen; report button/modal is additive here,
  reads `session.questions[currentIndex]` (verb/tense/subject/correctAnswer) and
  `lockedChoice` (selectedAnswer) already available in local scope.
- `src/quiz/labels.ts` — `tenseLabels`/`subjectLabels` already exist for
  displaying human-readable tense/subject in any feedback-confirmation UI, if
  needed (backend payload itself uses the raw enum literals, not the labels).
- `src/store/useQuizStore.ts` — read-only dependency for this phase; no changes
  needed to the store itself.

### Established Patterns
- `app/` routes-only, `src/<domain>/` for logic (Phase 1 D-02) — a `src/feedback/`
  module (payload builder + submit function + Zod schema) would follow the same
  pattern as `src/quiz/`.
- Strict TypeScript (`strict: true`, `noUncheckedIndexedAccess: true`) carries
  through.
- Plain `StyleSheet.create` + functional-component pattern, no UI library —
  matches all three existing screens.
- No existing network/fetch code anywhere in the app yet — this phase establishes
  the first (and only) outbound network call pattern.

### Integration Points
- Report modal is triggered from `app/quiz.tsx`, reads current question context
  + `lockedChoice` from `useQuizStore`, and calls a new `submitFeedback()`
  function (likely `src/feedback/submit.ts` or similar) that does the actual
  `fetch` to `https://portuguese-verb-api.onrender.com/feedback`.
- No existing app-version/platform-reading code — first use of
  `expo-constants`/`Platform.OS` in the app.

</code_context>

<specifics>
## Specific Ideas

- Success message: a short checkmark + text, auto-dismissing after ~1.5s (D-05).
- Error message copy: generic "Something went wrong, try again" for both 400 and
  500/network cases (D-06/D-07/D-08) — no per-field validation copy.
- Preset reasons: Wrong answer / Typo or spelling / Confusing wording / Other
  (D-03).

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope. (No pending todos matched this
phase per `todo.match-phase`.)

</deferred>

---

*Phase: 5-Feedback Integration*
*Context gathered: 2026-07-12*
