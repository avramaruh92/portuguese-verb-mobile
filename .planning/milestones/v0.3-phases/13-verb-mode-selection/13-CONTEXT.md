# Phase 13: Verb Mode Selection - Context

**Gathered:** 2026-07-20
**Status:** Ready for planning

<domain>
## Phase Boundary

Replace the boolean "Include irregular verbs" toggle on the Setup screen with
a 3-option verb-difficulty selector (Regular only / Mixed / Irregular only),
defaulting to Regular only, and make quiz generation filter the eligible verb
pool correctly for all three modes — including graceful failure (existing
insufficient-verbs error pattern) when Irregular-only's smaller pool can't
satisfy the selected tenses.

</domain>

<decisions>
## Implementation Decisions

### Selector UI
- **D-01:** Replace the `Switch` with a 3-chip row, reusing the existing chip
  visual pattern from tense selection (`app/index.tsx`'s `chip`/`chipSelected`/
  `chipText`/`chipTextSelected` styles, min-height 44).
- **D-02:** Selection behavior is single-select/radio-style — exactly one of
  the 3 mode chips is highlighted at a time (unlike the tense row's
  multi-select + "All tenses" pattern), matching the underlying data model
  (one `VerbMode` value, not a `Set`).
- **D-03:** Verb-mode chip row sits below the tense chip row, in the same
  screen position the irregular-verb `Switch` currently occupies.
- **D-04:** Verb-mode chip row gets its own section label, "Verb mode",
  matching the existing `sectionLabel` pattern used above the tense chips.

### Option labels & order
- **D-05:** Chip order, left to right: **Regular only → Mixed → Irregular
  only** (matches ROADMAP.md's success-criteria ordering; reads as a
  difficulty progression; default/Regular is the leftmost/first chip).
- **D-06:** Chip label copy is verbatim: `"Regular only"`, `"Mixed"`,
  `"Irregular only"` — no shortened variants.

### Type/field naming
- **D-07:** `GenerateOptions.includeIrregular: boolean` is replaced by
  `verbMode: VerbMode`, where `VerbMode = "regular_only" | "mixed" |
  "irregular_only"` (snake_case literals, consistent with how this codebase
  generally writes closed-string-union values).
- **D-08:** `VerbMode` is defined in `src/quiz/types.ts` alongside
  `GenerateOptions` (not in `src/dataset/types.ts`) — it's a quiz-generation
  concept (pool filter), not part of the `Verb`/dataset shape.
- **D-09:** This rename propagates through every current usage of
  `includeIrregular`: `src/quiz/engine.ts`'s pool filter (`generate()`),
  `app/index.tsx`'s local state + `startQuiz` call, and the existing test
  fixtures in `__tests__/quiz-engine.test.ts` and `__tests__/useQuizStore.test.ts`.

### Insufficient-pool error copy
- **D-10:** Update the existing insufficient-verbs message text (it
  currently says "...try selecting more tenses or including irregulars.",
  which references a control that no longer exists). New text:
  `"Not enough verbs for that combination — try selecting more tenses or a
  different verb mode."` — deliberately generic so it stays accurate
  regardless of which mode (Regular-only or Irregular-only) triggered it.
  This is the `INSUFFICIENT_VERBS_MESSAGE` constant in
  `src/store/useQuizStore.ts`.

### Claude's Discretion
- Exact prop/variable names inside `app/index.tsx` beyond the `verbMode`
  field itself (e.g. local `useState` setter naming) are implementer
  discretion, as long as they follow existing camelCase conventions.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements & roadmap
- `.planning/ROADMAP.md` §"Phase 13: Verb Mode Selection" — goal, success
  criteria (3-option selector, per-mode pool filtering, insufficient-pool
  error handling, unit test coverage), depends on Phase 12 (shipped)
- `.planning/REQUIREMENTS.md` §"Verb Mode" — MODE-01, MODE-02, MODE-03 exact
  requirement text; TEST-03 traceability row

No other external specs/ADRs apply — requirements fully captured in
ROADMAP.md/REQUIREMENTS.md and the decisions above.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `app/index.tsx` chip styles (`chip`, `chipSelected`, `chipText`,
  `chipTextSelected`) — directly reusable for the new verb-mode chip row,
  just with single-select instead of multi-select press handling.
- `sectionLabel` style in `app/index.tsx` — reuse for the new "Verb mode"
  section heading.

### Established Patterns
- `GenerateOptions` (`src/quiz/types.ts`) is the single options object passed
  from the Setup screen through `useQuizStore.startQuiz()` into
  `quiz/engine.ts`'s `generate()` — the `verbMode` field replacement flows
  through this exact same path, no new plumbing needed.
- `src/quiz/engine.ts`'s `generate()` currently does
  `verbs.filter((v) => options.includeIrregular || !v.isIrregular)` — this
  single line becomes a 3-way filter on `options.verbMode` against
  `v.isIrregular`.
- `InsufficientVerbsError` (`src/quiz/types.ts`) is already thrown by
  `sampleTriples()` when the eligible triple pool is smaller than
  `QUESTIONS_PER_SESSION` (10) and is already caught in
  `useQuizStore.startQuiz()` and translated to `INSUFFICIENT_VERBS_MESSAGE`
  — this existing path does not need new wiring, only the message text
  changes (D-10).
- Dataset/quiz union types use lowercase/snake_case string literals
  (`Tense`, `Subject` in `src/dataset/types.ts`) — `VerbMode`'s literals
  follow the same convention.

### Integration Points
- `app/index.tsx`: local `useState` for verb mode selection, passed into
  `startQuiz({ tenses, verbMode })`.
- `src/store/useQuizStore.ts`: `INSUFFICIENT_VERBS_MESSAGE` constant update
  only — no other store logic changes (it just forwards `GenerateOptions`
  through unchanged).
- `src/quiz/engine.ts`: `generate()`'s eligibility filter line.
- Tests: `__tests__/quiz-engine.test.ts` and `__tests__/useQuizStore.test.ts`
  currently construct `GenerateOptions` with `includeIrregular` — all such
  fixtures need updating to `verbMode`, and new test cases are needed for
  the "irregular_only" and "mixed" filter behaviors (TEST-03).

</code_context>

<specifics>
## Specific Ideas

No specific implementation-style references beyond what's captured above —
the roadmap's exact option names ("Regular only" / "Mixed" / "Irregular
only") were adopted verbatim as the chip copy.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 13-Verb Mode Selection*
*Context gathered: 2026-07-20*
