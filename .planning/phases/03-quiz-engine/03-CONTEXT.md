# Phase 3: Quiz Engine - Context

**Gathered:** 2026-07-12
**Status:** Ready for planning

<domain>
## Phase Boundary

Correct, independently tested logic to generate a 10-question quiz session (with
full 4-choice questions, not just verb/tense/subject) and score it, from the
Phase 2 dataset, filtered by tense selection and irregular-verb toggle. No UI,
no Zustand wiring beyond what the engine's types expose, no setup/results
screens — those are Phase 4. This phase produces pure, unit-tested generation
and scoring functions only.

</domain>

<decisions>
## Implementation Decisions

### Answer Choice Generation (in scope for this phase)
- **D-01:** The engine's `generate()` function produces the FULL question, including
  the 4 answer choices (1 correct + 3 distractors) — not just verb/tense/subject/
  correctAnswer. Distractor/choice-selection logic is pure quiz logic and belongs
  in the tested engine boundary, per the phase goal ("no UI involved" refers to
  screens, not to choice-generation logic).
- **D-02:** Distractors are drawn from the OTHER 5 subjects of the SAME verb+tense
  (e.g. for `comer`/`present_indicative`/`eu` → `como`, distractors come from
  `comes`/`come`/`comemos`/`comem`/`comem`), not from other verbs, and not a mix.
  Tests real conjugation/ending knowledge and is always available since every
  verb has all 6 subject forms populated (Phase 2 guarantee).
- **D-03:** Some subject pairs share identical conjugated forms in EP (e.g. `voces`
  and `eles_elas` are frequently identical 3rd-person-plural forms). Distractor
  selection MUST dedupe to unique strings first; if deduping the same-verb pool
  yields fewer than 3 unique wrong answers, backfill the remaining distractor
  slot(s) from other verbs' correct forms for the same tense+subject. This
  guarantees exactly 3 distinct wrong answers (4 total choices) every time —
  never fewer, never duplicate-looking options.
- **D-04:** The correct answer's position among the 4 shuffled choices is fully
  randomized on every call — no fixed slot, no position bias.

### Question Identity & Session Uniqueness
- **D-05:** A "question" is uniquely identified by its `(verb, tense, subject)`
  triple. Two questions are duplicates only if all three match.
- **D-06:** "No immediate repeats" (ROADMAP success criterion 1) is interpreted as
  the STRONGER guarantee: no duplicate `(verb, tense, subject)` triple appears
  ANYWHERE in the 10-question session (not just non-adjacent). Implement as a
  Set-based uniqueness check over sampled triples.
- **D-07:** The SAME verb CAN appear more than once in a session, as long as each
  occurrence has a different tense/subject (only the full triple must be unique,
  not the verb alone). Necessary given the pool size (up to 50 verbs × 4 tenses ×
  6 subjects = up to 1200 triples) — restricting to distinct verbs would
  needlessly shrink variety, especially under narrow filters (e.g. one tense
  selected).

### Small Filtered-Pool Fallback
- **D-08:** If the user's tense/irregular filters leave fewer than 10 eligible
  unique `(verb, tense, subject)` triples, `generate()` THROWS a descriptive
  error (e.g. an `InsufficientVerbsError`-style error carrying the eligible
  count) rather than silently returning a shorter session or allowing repeats.
  Phase 4's UI decides how to handle/display this. This is a true edge case
  given dataset size — even a single-tense filter with irregulars off yields
  ~228 triples (38 regular verbs × 6 subjects).

### Randomization & Testability
- **D-09:** `generate()` accepts an optional injectable RNG parameter (e.g.
  `random: () => number`, defaulting to `Math.random`) so tests can pass a
  seeded/mock RNG for fully deterministic assertions on triple selection,
  distractor choice, and shuffle order — no statistical/flaky-over-many-runs
  testing needed.
- **D-10:** The scoring function has the shape `score(session, answers) →
  { correct, total }` — a pure function taking the generated session (10
  questions with `correctAnswer`) and the user's parallel answers, returning a
  simple correct/total count. No richer per-question breakdown required for v0.

### Claude's Discretion
- Exact TypeScript signatures/parameter names beyond what's specified above
  (e.g. `GenerateOptions`, `QuizSession`, `Question` type names) — implementer's
  choice, consistent with `src/dataset/types.ts` naming conventions.
- Internal sampling algorithm for selecting 10 unique triples under the filters
  (e.g. shuffle-then-take vs reservoir sampling) — any correct, testable approach
  is fine as long as D-06/D-07/D-08 hold.
- Whether the quiz-engine module lives at `src/quiz/` or another `src/`
  subdirectory — follow the established `src/<domain>/` convention from Phase 1/2.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Dataset & Types (Phase 2 — this phase's direct dependency)
- `src/dataset/types.ts` — `Tense`, `Subject`, `Verb` types and `TENSES`/`SUBJECTS`
  arrays this phase's engine consumes directly (no mapping layer, per Phase 2 D-03)
- `src/dataset/verbs.ts` — the 50-verb dataset (38 regular / 12 irregular) the
  engine filters and samples from
- `src/dataset/validate.ts` — existing Zod validation pattern to follow if the
  engine needs any runtime shape assertions

### Project Contract
- `.planning/PROJECT.md` — core value ("10-question conjugation quiz... accurate
  score"), "Include irregular verbs" toggle semantics, automated test coverage
  requirement for quiz generation/scoring
- `.planning/ROADMAP.md` §Phase 3 — success criteria this phase must satisfy;
  §Phase 4 — where the generated session/scoring functions get wired into UI

### Prior Phases
- `.planning/phases/02-dataset-domain-vocabulary/02-CONTEXT.md` — D-03 (internal
  vocabulary = backend enum literals, no mapping needed), D-05 (isIrregular
  present-indicative-only criterion) that this phase's irregular-toggle filter
  relies on
- `.planning/phases/01-scaffold/01-CONTEXT.md` — D-02 established `app/`
  routes-only + sibling `src/` domain tree convention this phase's `src/quiz/`
  (or similar) continues

No other external specs — requirements fully captured in decisions above.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/dataset/verbs.ts`, `src/dataset/types.ts` — the full typed, human-verified
  50-verb dataset this phase's `generate()` samples from directly.
- `src/store/useQuizStore.ts` (Phase 1 placeholder, `status: 'idle'` only) — not
  modified by this phase; Phase 4 will wire the engine's output into this store.

### Established Patterns
- `src/<domain>/` pure-logic modules with zero React/Zustand imports (Phase 1 D-02,
  reinforced by Phase 2's `src/dataset/`) — the quiz engine should follow the same
  pure-function, framework-free pattern for testability.
- Strict TypeScript (`strict: true`, `noUncheckedIndexedAccess: true`) — engine
  types should be written to pass strict mode cleanly.
- Jest + `jest-expo` preset already wired (Phase 1); dataset tests (Phase 2) are
  the closest analog for how this phase's test suite should be structured.

### Integration Points
- `src/dataset/types.ts`'s `Tense`/`Subject`/`Verb` are the single source of truth
  this phase imports — no redeclaration.
- Phase 4 will call this phase's `generate()`/`score()` functions directly from
  UI event handlers and feed results into `useQuizStore`.

</code_context>

<specifics>
## Specific Ideas

No specific algorithm or library was requested — standard pure-function,
injectable-RNG design as captured in D-01 through D-10 above.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope. (Setup screen, quiz UI, and results
screen are explicitly Phase 4, not raised as scope creep here since the user
stayed focused on engine-logic questions throughout.)

</deferred>

---

*Phase: 3-Quiz Engine*
*Context gathered: 2026-07-12*
