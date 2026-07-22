# Phase 18: Explanation Compatibility Upgrade - Context

**Gathered:** 2026-07-22
**Status:** Ready for planning

<domain>
## Phase Boundary

`selectExplanation` (`src/learning/explain.ts`) is upgraded to match the backend
v0.4 explanation template contract: it must resolve and interpolate the
selected (wrong) answer's tense/subject labels (`selectedTenseLabel`,
`selectedSubjectLabel`) alongside the existing correct-answer labels, and
append backend-authored `tenseNotes[correctTense]` / `subjectHints[correctSubject]`
to the explanation text when present. All of this stays fail-closed exactly
as in v0.3 — no fabricated grammar text when `learning`, `formIndex`, or a
selected-answer match is missing. Pure `src/learning/` logic only, no UI
changes.

</domain>

<decisions>
## Implementation Decisions

### Selected-label resolution for tied/ambiguous matches
- **D-01:** When multiple `formIndex[selectedAnswer]` matches agree on a
  mismatch category (the existing `classify()` "all agree" path, e.g. the
  `tied-agree` test fixture — two `wrongSubject` matches with different
  subjects), resolve `selectedTenseLabel`/`selectedSubjectLabel` from the
  **first match** (`matches[0]`) — deterministic by array order, consistent
  with how `classify()` already treats `categories[0]` as its reference
  category.
- **D-02:** When tied matches **disagree** on category (the `tied-disagree`
  path, where `classify()` already falls back to `category === "generic"`),
  `selectedTenseLabel`/`selectedSubjectLabel` are **omitted from the
  interpolation context entirely** rather than computed from `matches[0]`.
  Rationale: no single match represents the mismatch in this case, and the
  `generic` template doesn't reference these placeholders anyway — this is
  a no-op behaviorally but keeps the resolution logic conceptually tied to
  "the same selected match that drove the mismatch category" (EXPL-06),
  which doesn't exist when the category itself was a disagreement fallback.

### Notes/hints appending
- **D-03:** `tenseNotes[correctAnswer.tense]` and `subjectHints[correctAnswer.subject]`
  are appended to the interpolated template output as **separate lines**,
  joined with `\n`, in the order: interpolated explanation text, then
  `tenseNotes` (if present), then `subjectHints` (if present). Only append
  whichever of the two actually exist on the verb's learning entry — skip
  either or both silently if absent (do not append an empty line).
- **D-04:** Notes/hints are appended **unconditionally across all
  categories** — `wrongTense`, `wrongSubject`, `wrongTenseAndSubject`, and
  `generic` — whenever the backend content has them for the correct
  tense/subject. No category-based gating on whether the note is "relevant"
  to the mismatch type; this matches EXPL-07's plain wording and keeps the
  append logic decoupled from `classify()`'s category branch.

### Claude's Discretion
- Exact placement of the label-resolution/appending logic within
  `explain.ts` (e.g., whether appending happens inside `selectExplanation`
  directly or a small helper) is left to the planner/executor — no
  structural preference was expressed beyond keeping the module's existing
  small-pure-function style.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements
- `.planning/REQUIREMENTS.md` (EXPL-05 through EXPL-08, TEST-06) — the
  locked requirement text this phase implements; ROADMAP.md's Phase 18
  entry restates these but REQUIREMENTS.md is the source of truth for
  exact wording.
- `.planning/ROADMAP.md` (Phase 18 section) — success criteria and
  dependency on Phase 17.

### Contract fixture (proves the real backend v0.4 shape)
- `__tests__/fixtures/content-verbs-v0.4.sample.json` — real backend v0.4
  payload sample. Its `learning.templates` object shows the actual
  `{selectedTenseLabel}`/`{selectedSubjectLabel}` placeholders this phase
  must interpolate (e.g. `wrongTense`: "You answered as if it were
  {selectedTenseLabel}, but {verb} in {tenseLabel} is...").  Its
  `learning.verbs.*.tenseNotes` entries (e.g. `ser`, `estar`, `ter`, `ir`)
  show real note text/format to test against. No `subjectHints` example
  currently exists in the fixture — schema supports it but the sample data
  doesn't exercise it, so tests must synthesize a `subjectHints` case.
- `__tests__/contract-fixture.test.ts` — proves this fixture parses through
  `validateDataset`/`LearningContentSchema`/`fetchRemoteVerbs`; this
  phase's logic consumes the same `learning`/`formIndex` shape it verifies.
- `.planning/phases/17-contract-fixture-verification/17-VERIFICATION.md` —
  Phase 17's verification report confirming the fixture shape is trustworthy.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/learning/explain.ts` — `selectExplanation`, `classify`, and
  `interpolate` already exist; this phase extends them, doesn't replace
  them. `interpolate()` already silently ignores unknown/missing template
  placeholders (regex replace only touches keys present in `context`), so
  adding `selectedTenseLabel`/`selectedSubjectLabel` to the context object
  is always safe even for templates (like `generic`) that don't use them.
- `src/quiz/labels.ts` — `tenseLabels`/`subjectLabels` lookup tables, already
  imported and used for the correct-answer labels; reuse the same tables
  for the selected-answer labels.
- `src/learning/types.ts` — `VerbLearningEntry` already declares optional
  `tenseNotes?: Partial<Record<Tense, string>>` and
  `subjectHints?: Partial<Record<Subject, string>>` — no type changes needed.
- `src/learning/schema.ts` — `LearningContentSchema` (Zod) already validates
  `subjectHints` via `z.partialRecord(SubjectEnum, z.string().min(1)).optional()`
  — schema/validation layer is already v0.4-ready; this phase is pure
  consumption logic in `explain.ts`.

### Established Patterns
- `classify()` returns a single `MismatchCategory`, computed by mapping all
  matches to categories and checking `every(category === first)` — the
  "all agree" vs "disagree → generic" logic this phase's D-01/D-02 hook into.
- Fail-closed pattern: every early-return in `selectExplanation` returns
  `undefined` rather than throwing or fabricating text (`!learning`,
  `!verb.formIndex`, no `entry`, no `matches`/empty `matches`) — new logic
  must preserve this, not introduce a new throw path.
- `noUncheckedIndexedAccess`-safe non-null assertions with inline
  justification comments (e.g. `categories[0]!` in `classify`) — follow
  this convention for any new indexed access (e.g. `matches[0]!` in D-01).

### Integration Points
- `selectExplanation`'s only caller context (per architecture doc) is
  `app/quiz.tsx`'s "Report a problem" / explanation display flow — no
  caller signature changes are implied by this phase (same 4 params, same
  `string | undefined` return type), only the returned string's content
  changes.

</code_context>

<specifics>
## Specific Ideas

No specific UI/text preferences beyond what's in the requirements — the
exact template strings are backend-authored content (in `learning.templates`
and per-verb `tenseNotes`/`subjectHints`), not something this app writes.
The app's job is correct interpolation/appending, not wording.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 18-explanation-compatibility-upgrade*
*Context gathered: 2026-07-22*
