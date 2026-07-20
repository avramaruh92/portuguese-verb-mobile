# Phase 15: Learning Content & Explanation Engine - Context

**Gathered:** 2026-07-20
**Status:** Ready for planning

<domain>
## Phase Boundary

Parse the backend's optional `learning` block and per-verb `formIndex` from
`GET /content/verbs` (Zod-validated, fail-closed on any shape mismatch), and
implement a pure function that — given a verb, a selected (wrong) answer, the
correct answer, and the parsed learning content — resolves the selected
answer's actual `{tense, subject}` slot via `formIndex` and returns the
correctly-templated explanation string, or `undefined` when no match exists.

**No UI in this phase** — the explanation panel itself is Phase 16. Phase 15
only needs to prove the data can be parsed and the right string can be
derived, independent of any Quiz-screen rendering.

</domain>

<decisions>
## Implementation Decisions

### Tied-form resolution (formIndex ambiguity)
- **D-01:** `formIndex[form]` can return 2+ tied `{tense, subject}` matches
  (real Portuguese verbs commonly tie — e.g. "falam" is both `voces` and
  `eles_elas` in `present_indicative`). When a selected answer's tied matches
  disagree on mismatch category (one implies `wrongSubject`, another implies
  `wrongTense`), the function must NOT guess — fall back to the backend's
  `generic` template ("For {verb}, the correct answer is '{correctAnswer}'.").
  Only use `wrongTense`/`wrongSubject`/`wrongTenseAndSubject` when every tied
  match agrees on the same category. This keeps explanations always correct,
  never confidently wrong on an ambiguous tie.
- **D-02:** When `formIndex[selectedAnswer]` returns exactly one match (the
  common case), classify normally: same tense as correct → `wrongSubject`;
  same subject as correct → `wrongTense`; neither matches →
  `wrongTenseAndSubject`.

### Cross-verb distractor gap (known limitation, not fixed here)
- **D-03:** Phase 14's DIST-03 fallback tier can produce a wrong-answer
  string borrowed from a DIFFERENT verb's conjugation table. Because
  `formIndex` is scoped per-verb (only the current question's verb's own
  conjugation table is indexed), a cross-verb wrong answer will almost always
  resolve to 0 matches against the current verb's `formIndex` → no
  explanation panel, per EXPL-03's "no formIndex match" fail-closed case.
- **User confirmed this is a real gap, not acceptable-and-ignored** — record
  it explicitly as a known limitation for a future phase (e.g. also checking
  the *other* verb's `formIndex` when a distractor's provenance is
  cross-verb). **Do not attempt to fix it in Phase 15 or Phase 16** — those
  phases only consume `formIndex` as shipped by the backend (per-verb scope
  is a backend data-shape decision, not something mobile can restructure).
  If a future phase revisits this, it would need either the engine to tag
  distractor provenance (which verb a cross-verb distractor form came from)
  or a broader cross-verb formIndex — out of scope now.

### Missing/degraded learning content (already locked by requirements, restated for planner clarity)
- **D-04:** Per EXPL-01/EXPL-03, ALL of the following degrade to "no
  explanation" (never throw, never fabricate): the `learning` block is
  entirely absent from the response (local-fallback dataset, or backend
  fail-closed omission), `learning.verbs[verb]` has no entry for the current
  verb, or `formIndex[selectedAnswer]` has zero matches.
- **D-05:** The bundled local fallback dataset (`src/dataset/verbs.ts`) never
  carries `learning`/`formIndex` — offline sessions never show explanations
  in Phase 16. This phase does not need to add `learning`/`formIndex` to the
  local dataset or its Zod schema as a required field; both must be optional
  everywhere they appear in mobile's dataset types.

### Claude's Discretion
- Where the new parsing/explanation logic lives (e.g. a new `src/learning/`
  domain folder mirroring the existing `dataset/`/`quiz/`/`feedback`
  per-domain `types.ts` + logic-file convention) — architecture, not a user
  preference.
- Whether the per-session dataset snapshot (`src/dataset/source.ts`'s cached
  `resolveVerbs()` result) is extended to also carry `learning`, keeping it
  consistent with the existing "snapshot verbs at quiz-start so a background
  refresh can't swap content mid-session" guarantee from Phase 8 — this is a
  direct extension of an established pattern, not a new decision.
- Exact TypeScript shape for the parsed `LearningContent`/`FormMatch` types
  on the mobile side (mirroring the backend's `LearningContent`/`FormMatch`
  shapes from `contracts.ts`/`reverseIndex.ts`/`learningContentSchema.ts`,
  not necessarily byte-identical).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Backend contract (sibling repo `portuguese-verb-api` / local path `/Users/avi/portuguese-verb/portuguese-verb-backend`)
- `src/routes/content/contracts.ts` — defines `ContentVerbsResponse = { verbs: ContentVerb[]; learning?: LearningContent }` and `ContentVerb = VerbSeedInput & { formIndex: Record<string, FormMatch[]> }`. `formIndex` ships on every verb unconditionally; `learning` is the block that can be fail-closed-omitted.
- `prisma/seed-data/reverseIndex.ts` — `FormMatch = { tense, subject }`; `findFormMatches` does strict `===` string matching (case/accent-sensitive), returns 0/1/2+ matches, never null.
- `src/routes/content/reverseIndexBlock.ts` — `attachFormIndex`: for each verb, builds `Record<conjugatedFormString, FormMatch[]>` over that verb's own conjugation table only (per-verb scope — see D-03).
- `prisma/seed-data/learningContentSchema.ts` — `buildLearningContentSchema(seededVerbs)`: `{ version: 1, templates: { wrongTense, wrongSubject, wrongTenseAndSubject, correctAnswerReveal, generic }, verbs: Record<string, { irregularTenses, tenseNotes?, subjectHints? }> }`. Interpolation variables (single-brace, no escaping): `{verb}`, `{selectedAnswer}`, `{correctAnswer}`, `{tenseLabel}`, `{subjectLabel}`, `{selectedTenseLabel}`, `{selectedSubjectLabel}`. **Note:** `correctAnswerReveal` exists in the schema but is NOT one of the 4 templates EXPL-02 requires (`wrongTense`/`wrongSubject`/`wrongTenseAndSubject`/`generic`) — it is not used by this milestone; do not wire it up.
- `src/routes/content/learning.ts` — `deriveLearningBlock` (live `safeParse`, `undefined` on any failure) and `applyIsIrregularOverride` (server-side only, already applied before the response reaches mobile — mobile does not need to replicate this).
- `prisma/seed-data/learningContent.ts` — the actual seeded content; confirms all 50 seeded verbs currently have a `learning.verbs` entry (full coverage today, but the parsing/explanation logic must not assume 100% coverage going forward — always check for entry presence per D-04).

### Mobile-side existing patterns to extend
- `src/dataset/types.ts` — current `Verb` shape has no `formIndex`; needs an optional field.
- `src/dataset/source.ts` — `resolve()`/`resolveVerbs()` currently returns `{ verbs, source }`; the module-level `cachedResult` promise is the per-session snapshot mechanism from Phase 8 (see Claude's Discretion above for extending it to `learning`).
- `src/dataset/remote.ts` — `fetchRemoteVerbs()` fetches `payload.verbs`, ignores any other top-level key today; will need to also read+validate `payload.learning` (optional).
- `src/dataset/validate.ts` — existing Zod validation pattern (`safeParse`, accumulated errors) to follow for the new `learning`/`formIndex` schemas.
- `src/quiz/types.ts` — `Question extends Triple { choices: string[]; correctAnswer: string }`. Choices are plain strings with no provenance tag — this is WHY `formIndex` lookup is needed at all to resolve a selected answer's slot (confirms D-01/D-02's necessity).

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/dataset/validate.ts`'s compositional Zod-schema pattern (nested schemas built bottom-up, `.safeParse` + accumulated error messages) — reuse directly for the new `learning`/`formIndex` schemas.
- `TENSES`/`SUBJECTS` runtime arrays (`src/dataset/types.ts`) — reuse for any `z.enum(...)` needed in the new schemas, per existing convention (`src/feedback/schema.ts` already does this) instead of re-declaring tense/subject literals.

### Established Patterns
- Per-domain module structure: `types.ts` + sibling logic files, always named exports, no barrel files, no default exports (`CONVENTIONS.md`).
- Fail-closed network/parsing: `resolveVerbs()` never throws to callers; a `safeParse` failure degrades gracefully rather than crashing (`src/dataset/remote.ts`, `src/dataset/source.ts`). The new `learning` parsing must follow the same shape — a failed/missing `learning` block degrades to "no explanations," never a thrown error or broken quiz.
- Injectable-dependency pattern for pure functions (`generate(options, random, verbs)` in `src/quiz/engine.ts`) — the new explanation-selection function should similarly take its inputs as plain parameters (verb, selectedAnswer, correctAnswer, learning content) with no hidden state, for the same unit-testability reason.

### Integration Points
- `src/dataset/source.ts`'s cached snapshot is the natural place for `learning` to travel alongside `verbs`/`source` so Phase 16's UI can read a consistent, quiz-start-pinned snapshot.
- The new explanation-selection function's output feeds directly into Phase 16's Quiz screen — Phase 15 must expose a clean, independently-callable function (not embedded inside a component) so Phase 16 can import and test against it without touching UI.

</code_context>

<specifics>
## Specific Ideas

No specific UI/copy requirements — Phase 15 is data-only. The exact template
strings are backend-authored content (already seeded, see
`prisma/seed-data/learningContent.ts`) and are not mobile's concern beyond
correct interpolation.

</specifics>

<deferred>
## Deferred Ideas

- **Cross-verb formIndex resolution** (D-03) — teaching the explanation
  function to also check the *other* verb's `formIndex` when a DIST-03
  cross-verb distractor is selected, so those wrong answers can also get an
  explanation. Confirmed as a real gap by the user, explicitly deferred out
  of Phase 15/16 — would need either engine-side distractor provenance
  tagging or a broader backend data shape. Candidate for a future phase if
  this milestone's explanation coverage turns out to feel too sparse in
  practice.

</deferred>

---

*Phase: 15-Learning Content & Explanation Engine*
*Context gathered: 2026-07-20*
