# Phase 16: Explanation Panel UI - Context

**Gathered:** 2026-07-20
**Status:** Ready for planning

<domain>
## Phase Boundary

Wire Phase 15's pure `selectExplanation` function into the Quiz screen: after
a learner locks in an incorrect answer, show a short explanation panel
between the answer choices and the Next button. When no explanation can be
resolved (missing `learning` block, missing verb entry, or no `formIndex`
match), render nothing — never fabricate grammar prose, never block
advancing. Scoring, `correctAnswer`, and the `POST /feedback` payload's
`selectedAnswer` are untouched by this phase (EXPL-04).

This phase is UI wiring only — the explanation-selection logic itself
(`src/learning/explain.ts`) and its Zod-validated `learning`/`formIndex`
parsing (`src/dataset/*`) were already built and tested in Phase 15.

</domain>

<decisions>
## Implementation Decisions

### Panel visual treatment
- **D-01:** Explanation panel uses a neutral surface card —
  `colors.surface` background, `colors.textSecondary` text — the same
  "quiet" treatment already used by `OfflinePill`. It should read as
  supplementary info, not another alert, and stay visually distinct from
  the existing green (`colors.success`) / red (`colors.error`)
  correct/wrong choice highlighting already on the choice buttons.
  Rejected: `primarySoft`-tinted "tip" card (too visually loud) and plain
  text with no card (blends into the meta row above).

### Layout stability
- **D-02:** Conditional mount — the panel only renders in the tree when
  `selectExplanation` actually returns a string. No reserved/hidden space
  when there's no explanation. This matches EXPL-03's "no explanation
  panel is shown" literally. Accepted tradeoff: choices/Next button
  position shifts slightly between a question with an explanation and one
  without — user explicitly preferred this over the `nextButton`/
  `reportButton` opacity-0 reserved-space pattern already used elsewhere in
  `quiz.tsx`.

### Copy/label
- **D-03:** Sentence only, no heading/label above it (no "Why?" or
  "Explanation:" caption). The backend's templates are already
  self-contained sentences (e.g. "For X, the correct answer is...") — a
  label would be redundant framing.

### Timing/animation
- **D-04:** No animation or delay — the panel appears instantly alongside
  the existing instant right/wrong choice coloring, consistent with the
  rest of the Quiz screen (which has zero animation on answer reveal
  today).

### Claude's Discretion
- **Where the Quiz screen sources the `learning` block and the
  formIndex-bearing `Verb` object.** Two known gaps to resolve as
  implementation details (not user preferences):
  1. `useQuizStore`'s `startQuiz` currently destructures only `{ verbs }`
     from `resolveVerbs()` and discards `learning` entirely — nothing in
     the store today exposes `learning` to screens.
  2. `app/quiz.tsx`'s `currentVerb` lookup
     (`verbs.find((v) => v.verb === question.verb)`) reads from the
     **locally bundled** `src/dataset/verbs.ts` import, NOT from the
     session's resolved/fetched verb list — so it never has `formIndex`
     even on a successful remote fetch. This must be corrected so
     `selectExplanation` receives a real `Verb` with `formIndex` when one
     exists. Both are wiring bugs/gaps for the planner to fix, not open
     product questions.
- Exact component/function boundary (e.g., a small `ExplanationPanel`
  component in `src/components/` vs. inline JSX in `quiz.tsx`) — follows
  existing conventions (`OfflinePill.tsx` precedent), no user preference
  expressed.
- Whether `selectExplanation` is called via a `useMemo`/inline computation
  each render vs. computed once per locked answer — performance/implementation
  detail, negligible either way at this scale.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase 15 outputs (this phase's direct dependency)
- `.planning/phases/15-learning-content-explanation-engine/15-CONTEXT.md` —
  full D-01..D-05 decisions on tied-form resolution, the known cross-verb
  formIndex gap (deferred, not fixed here), and missing-content degrade
  rules — all still binding for this phase.
- `src/learning/explain.ts` — `selectExplanation(verb, selectedAnswer,
  correctAnswer, learning)`  → `string | undefined`. Exact signature to
  call from the Quiz screen. Never throws; returns `undefined` on every
  missing-data path (verified by `grep -n "throw"` finding zero matches
  in Phase 15).
- `src/learning/types.ts` — `FormMatch`, `MismatchCategory`,
  `LearningContent` types.
- `src/dataset/source.ts` — `resolveVerbs()` returns
  `{ verbs: Verb[]; source: VerbSource; learning: LearningContent | undefined }`.
  `learning` is already threaded through the per-session cached snapshot;
  it's `useQuizStore` and `quiz.tsx` that don't yet expose/use it (see
  Claude's Discretion above).
- `src/dataset/types.ts` — `Verb` now has an optional `formIndex` field
  (added in Phase 15).

### Requirements (EXPL-02/03/04)
- `.planning/REQUIREMENTS.md` — EXPL-02 (panel placement + template
  resolution), EXPL-03 (fail-closed no-panel case), EXPL-04 (never mutates
  scoring/feedback payload, never blocks advance).

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/theme/tokens.ts` — `colors.surface`, `colors.textSecondary`,
  `typography.body`, `spacing.md`/`spacing.lg`, `radius.control` — reuse
  directly for the panel's card styling, matching `OfflinePill`'s existing
  "quiet card" visual pattern.
- `src/quiz/labels.ts` — `tenseLabels`/`subjectLabels`/`tenseGrammarNames`
  already imported in `quiz.tsx`; `selectExplanation` itself already pulls
  `tenseLabel`/`subjectLabel` internally from this same module (Phase 15),
  so no duplication needed.

### Established Patterns
- `app/quiz.tsx`'s existing conditional-render pattern (`if (!session)
  return null;`, `if (!question) return null;`) — the explanation panel
  should follow this same "render nothing if not applicable" style rather
  than a hidden/opacity-0 element (matches D-02).
- Per-domain module structure (`types.ts` + logic files, named exports,
  no barrels) — if a new `ExplanationPanel` component is added under
  `src/components/`, follow `OfflinePill.tsx`'s existing shape (small,
  self-contained, imports tokens directly).

### Integration Points
- `app/quiz.tsx` is the single integration point: it already has
  `question` (verb/tense/subject/correctAnswer), `lockedChoice`, and
  renders the choices + Next button block where the panel must slot in
  ("between the answer choices and the Next button" per EXPL-02).
- The panel should only attempt to compute an explanation when
  `lockedChoice !== null && lockedChoice !== question.correctAnswer`
  (an answer has been locked in AND it was wrong) — mirrors the existing
  `choiceStyle()` correct/wrong branching already in `quiz.tsx`.

</code_context>

<specifics>
## Specific Ideas

No specific copy/wording requirements — explanation sentences are entirely
backend-authored template output (already seeded and interpolated by
`selectExplanation`); this phase only decides how to *display* whatever
string comes back, not what it says.

</specifics>

<deferred>
## Deferred Ideas

None new — this phase's only known limitation (the cross-verb formIndex
gap, D-03 from Phase 15's CONTEXT.md) was already captured and deferred in
Phase 15; it applies unchanged here (a cross-verb DIST-03 distractor will
still resolve to "no explanation," which is correct fail-closed behavior
per EXPL-03, not a new bug to fix in this phase).

</deferred>

---

*Phase: 16-Explanation Panel UI*
*Context gathered: 2026-07-20*
