# Phase 4: Quiz Experience (Setup → Quiz → Results) - Context

**Gathered:** 2026-07-12
**Status:** Ready for planning

<domain>
## Phase Boundary

The full user-facing core-value loop: a Setup screen (tense multi-select + irregular
toggle), a Quiz screen (10 questions with 4-choice answers, immediate feedback,
manual advance), and a Results screen (score out of 10 + native share). Wires Phase
3's `generate()`/`score()` pure functions and Phase 2's dataset into UI and
`useQuizStore` (Zustand). No feedback/backend work — that's Phase 5. No dataset or
quiz-engine logic changes — those are locked from Phases 2-3.

</domain>

<decisions>
## Implementation Decisions

### Setup Screen
- **D-01:** Tense selection is a multi-select control showing all 4 tenses (present
  indicative, preterite, imperfect, future) plus a top-level "All tenses" shortcut
  that selects/deselects all 4 at once.
- **D-02:** The "Start Quiz" button is disabled until at least 1 tense is selected —
  the zero-tense invalid state is prevented structurally, not handled via an error
  message after the fact.
- **D-03:** The "Include irregular verbs" toggle has label text only, no explanatory
  helper copy underneath — matches the minimal style of the rest of the setup screen.
- **D-04:** When Phase 3's `InsufficientVerbsError` is thrown (the tense/irregular
  filter combination yields <10 eligible questions), catch it BEFORE navigating to
  the quiz screen. Show a short inline error message on the setup screen (e.g. "Not
  enough verbs for that combination — try selecting more tenses or including
  irregulars") and keep the user there. Never navigate to the quiz screen in an
  error state.

### Quiz Screen — Feedback & Advance
- **D-05:** After the user taps an answer choice, that choice is colored green
  (correct) or red (wrong). If wrong, the actual correct choice is ALSO highlighted
  green so the learner sees the right answer immediately — reinforces learning for
  the A1-A2 target audience.
- **D-06:** The first tap locks the answer — all 4 choices become non-interactive
  immediately after selection. No changing the answer before advancing.
- **D-07:** Advancing to the next question requires a manual "Next" button tap after
  feedback is shown — no auto-advance timer. User controls pacing; nobody misses the
  color feedback because it vanished too fast.
- **D-08:** Progress during the quiz shows BOTH a text counter (e.g. "3 / 10") and a
  visual progress bar.

### Results Screen & Share
- **D-09:** Score is presented as a large, prominent "X/10" — the visual centerpiece
  of the results screen, not a plain sentence.
- **D-10:** The native iOS share-sheet message (RSLT-02) is:
  `"I scored X/10 on Portuguese Verb Quiz!"` — score-first, casual/celebratory tone,
  substitute the actual score for X.
- **D-11:** Results screen offers three actions: open the share sheet, "Try Again"
  (immediately starts a new quiz reusing the SAME tense/irregular filters from the
  just-completed quiz — no return to setup needed), and a separate action to go back
  to Setup (to change filters). "Try Again" must re-derive a fresh session via
  `generate()` with the same `GenerateOptions`, not replay the same questions.

### Claude's Discretion
- Exact visual layout/styling details not covered above (spacing, typography,
  colors beyond the green/red feedback semantics, iconography) — implementer's
  choice, consistent with the plain `StyleSheet.create` approach already used in
  `app/index.tsx`.
- Whether tense multi-select renders as chips, checkboxes, or another control —
  functionally it must support D-01's multi-select + "All tenses" shortcut
  semantics; visual treatment is open. (Note: this phase has `UI hint: yes` in
  ROADMAP.md — consider `/gsd:ui-phase 4` for a design contract before/alongside
  planning if visual polish matters beyond functional correctness.)
- Exact Zustand store shape for `useQuizStore` beyond what Phase 3's
  `QuizSession`/`Question`/`GenerateOptions` types require it to hold (current
  session, current question index, answers array, current filters) — planner's
  discretion, following the existing placeholder in `src/store/useQuizStore.ts`.
- Navigation/routing file structure under `app/` (e.g. `app/setup.tsx`,
  `app/quiz.tsx`, `app/results.tsx` vs nested routes) — follow Expo Router
  conventions; Phase 1 D-04 explicitly deferred these route files to this phase.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Quiz Engine & Dataset (Phase 2/3 — this phase's direct dependencies)
- `src/quiz/types.ts` — `Triple`, `Question`, `QuizSession`, `GenerateOptions`,
  `InsufficientVerbsError` — the exact shapes this phase's UI/store consume
- `src/quiz/engine.ts` — `generate(options, random?)` — called from the setup
  screen's "Start Quiz" handler; throws `InsufficientVerbsError` per D-04
- `src/quiz/scoring.ts` — `score(session, answers)` — called on the results screen
  transition to compute the final `{ correct, total }`
- `src/dataset/types.ts` — `Tense`, `Subject`, `TENSES`, `SUBJECTS` — needed for the
  tense multi-select control and subject-pronoun display labels (QUIZ-01)
- `src/store/useQuizStore.ts` — current placeholder Zustand store (`status: 'idle'`
  only) — this phase replaces/extends it to hold session, index, answers, filters

### Project Contract
- `.planning/PROJECT.md` — core value loop, "Include irregular verbs" toggle
  semantics (filters verb pool only, independent of tense selection)
- `.planning/ROADMAP.md` §Phase 4 — success criteria this phase must satisfy;
  `UI hint: yes` flag — consider `/gsd:ui-phase 4` for a design contract
- `.planning/REQUIREMENTS.md` — SETUP-01/02/03, QUIZ-01/02/03, RSLT-01/02 exact
  requirement wording

### Prior Phases
- `.planning/phases/03-quiz-engine/03-CONTEXT.md` — D-08 explicitly deferred
  InsufficientVerbsError handling/display to this phase (resolved here as D-04);
  D-02/D-03 distractor and choice-shuffling semantics this phase's UI must render
  faithfully (don't re-shuffle or re-derive `choices` client-side)
- `.planning/phases/02-dataset-domain-vocabulary/02-CONTEXT.md` — D-03: internal
  `Tense`/`Subject` values ARE the backend enum literals; a SEPARATE
  presentation-only `subjectLabels: Record<Subject, string>` lookup table (for
  "learner-friendly Portuguese label" per QUIZ-01, e.g. "ele/ela", "nós") is
  explicitly scoped to be built in this phase, not before
- `.planning/phases/01-scaffold/01-CONTEXT.md` — D-02 (`app/` routes-only + sibling
  `src/` domain tree) and D-04 (setup/quiz/results route files deliberately not
  created in Phase 1, created here)

No other external specs — requirements fully captured in decisions above.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/quiz/engine.ts`, `src/quiz/scoring.ts`, `src/quiz/types.ts` — fully tested,
  ready-to-call pure functions/types from Phase 3; no changes needed, only imports.
- `src/dataset/verbs.ts`, `src/dataset/types.ts` — the dataset `generate()` already
  samples from; this phase does not touch it directly, only via `generate()`.
- `src/store/useQuizStore.ts` — existing but minimal placeholder
  (`{ status: 'idle' }`); this phase is where it becomes the real session store.
- `app/index.tsx`, `app/_layout.tsx` — current root screen (plain heading, `Stack`
  layout with `headerShown: false`) and the only existing route files; this phase's
  screens should follow the same plain `StyleSheet.create` + functional-component
  pattern already established.

### Established Patterns
- `app/` routes-only, `src/<domain>/` for logic (Phase 1 D-02) — screens in this
  phase stay thin, delegating to `src/quiz/` for all generation/scoring logic.
- Strict TypeScript (`strict: true`, `noUncheckedIndexedAccess: true`) — carries
  through to store and screen code.
- No existing UI component library or design system beyond raw React Native
  primitives (`View`, `Text`, `StyleSheet`) — this phase establishes the first real
  UI patterns for the app.

### Integration Points
- Setup screen calls `generate()` on submit, catches `InsufficientVerbsError` (D-04),
  and on success stores the `QuizSession` + filters in `useQuizStore` before
  navigating to the quiz route.
- Quiz screen reads current question from the store, advances `currentIndex` and
  appends to an `answers` array on each "Next" tap.
- Results screen calls `score()` with the completed session + answers, reads the
  result for the D-09 score display, and reuses stored filters for D-11's "Try
  Again" (re-calls `generate()` with the same `GenerateOptions`).

</code_context>

<specifics>
## Specific Ideas

- Exact share message text specified by the user: `"I scored X/10 on Portuguese
  Verb Quiz!"` (D-10) — matches the example already referenced in
  `.planning/research/STACK.md`'s RN core `Share` API guidance.
- "Try Again" must reuse the same filters from the completed quiz, not send the
  user back through setup for a same-filters replay (D-11).

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope. (Feedback submission and its
success/error/cold-start handling are explicitly Phase 5, not raised as scope
creep here since the user stayed focused on the setup/quiz/results loop
throughout.)

</deferred>

---

*Phase: 4-Quiz Experience (Setup → Quiz → Results)*
*Context gathered: 2026-07-12*
