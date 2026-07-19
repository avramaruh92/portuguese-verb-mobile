# Phase 12: Tense Label Refresh - Context

**Gathered:** 2026-07-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Change the *displayed* tense labels for `preterite` → "Completed past" and
`imperfect` → "Imperfect past" in `src/quiz/labels.ts`'s `tenseLabels` map.
`present_indicative` ("Present") and `future` ("Future") are unchanged. Add
Portuguese grammar names as secondary/de-emphasized text on the Quiz screen's
meta row only, for preterite/imperfect only. No change to the `Tense` union
type, its enum literals (`present_indicative`/`preterite`/`imperfect`/
`future`), or the `POST /feedback` payload — those are backend-locked and
untouched by this phase. Display-only change.

</domain>

<decisions>
## Implementation Decisions

### Primary label wording
- **D-01:** `tenseLabels.preterite` → `"Completed past"`,
  `tenseLabels.imperfect` → `"Imperfect past"`. `tenseLabels.present_indicative`
  (`"Present"`) and `tenseLabels.future` (`"Future"`) are NOT touched —
  confirmed explicitly, no scope creep into reconsidering their wording.
- **D-02:** `"Perfect past"` must never appear anywhere in the UI (per
  LABEL-02) — this is a negative constraint to verify against, not a label
  to add.

### Portuguese grammar names (secondary text)
- **D-03:** Add the Portuguese grammar term as secondary text on the Quiz
  screen's meta row (`app/quiz.tsx`, the `{translation} · {tense} ·
  {subject}` line, `styles.metaRow`) — this is a new addition this phase,
  not merely "don't violate the constraint." User explicitly chose to add
  it rather than leave LABEL-02 satisfied by omission.
- **D-04:** Format: inline, same line, parenthesized —
  e.g. `"correr · Completed past (Pretérito perfeito) · eles/elas"`. Not a
  new second line / not caption-sized secondary row.
- **D-05:** Only for preterite ("Pretérito perfeito") and imperfect
  ("Pretérito imperfeito") — present_indicative and future keep their
  current plain rendering (`"Present"`, `"Future"`, no parenthetical),
  since they have no ambiguity to disambiguate and weren't part of this
  phase's requirements.
- **D-06:** Setup screen (`app/index.tsx`) tense-selection chips are NOT
  changed — no Portuguese grammar name added there. The chips are
  narrow/space-constrained and the user only asked for the addition on the
  Quiz screen's meta row.
- **D-07:** Styling for the parenthetical Portuguese term: implementer's
  discretion between reusing `colors.text` (same as the rest of the meta
  row, since it's inline in the same `Text` block) or nesting a
  `colors.textSecondary`-styled `<Text>` for subtle de-emphasis — no strong
  preference expressed on color, only on placement/format (D-04) and scope
  (D-05, D-06).

### Data structure implication
- **D-08:** `tenseLabels` (the primary label map) stays a
  `Record<Tense, string>` — only the two string values change (D-01). A
  *separate* lookup for the Portuguese grammar names is needed (e.g. a new
  partial map or record covering only `preterite`/`imperfect`, since
  `present_indicative`/`future` never get a parenthetical per D-05) —
  exact shape/naming is implementer's discretion, but it must NOT reuse or
  overload `tenseLabels` itself (that map is the primary-label contract
  asserted by `quiz-labels.test.ts`).

### Backend contract isolation (LABEL-03)
- **D-09:** No code changes are needed to guarantee LABEL-03 — confirmed by
  reading `src/feedback/payload.ts`/`schema.ts`: the feedback payload's
  `tense` field is built from the `Tense` enum literal (`question.tense`),
  never from `tenseLabels[...]`. This phase's changes are confined to
  `src/quiz/labels.ts`'s display strings and `app/quiz.tsx`'s rendering —
  neither touches the payload path. Downstream agents should verify this
  invariant still holds after implementation (e.g. grep for
  `tenseLabels` usage in `src/feedback/`), not re-architect anything to
  enforce it.

### Test scope (TEST-01)
- **D-10:** `__tests__/quiz-labels.test.ts` needs updating to assert the
  new displayed strings (`"Completed past"`, `"Imperfect past"`) while
  keeping its existing assertion style (loop over `TENSES` for
  non-empty-string coverage, explicit assertion for one full string value
  per `subjectLabels`' `ele_ela` example) — mirror the existing test
  pattern, don't rewrite its structure.

### Claude's Discretion
- Exact color/emphasis treatment of the parenthetical Portuguese term
  (D-07).
- Naming/shape of the new Portuguese-grammar-name lookup structure (D-08).
- Whether a new Jest test file/section is needed specifically for the
  Portuguese grammar name rendering, vs. covering it within the existing
  `quiz-labels.test.ts` — TEST-01 only requires the primary label
  assertions; the secondary-text addition (D-03) is Claude's call on test
  coverage depth.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements & Roadmap
- `.planning/REQUIREMENTS.md` — LABEL-01, LABEL-02, LABEL-03, TEST-01 (the
  locked requirement text for this phase)
- `.planning/ROADMAP.md` §"Phase 12: Tense Label Refresh" — goal and
  success criteria

### Files to modify (identified during discussion)
- `src/quiz/labels.ts` — `tenseLabels.preterite`/`tenseLabels.imperfect`
  string changes (D-01); new Portuguese-grammar-name lookup (D-08)
- `app/quiz.tsx` — meta row rendering (`styles.metaRow`, around line
  118-124) to include the parenthetical Portuguese term (D-03/D-04/D-05)
- `__tests__/quiz-labels.test.ts` — updated assertions (D-10)

### Files confirmed NOT in scope
- `app/index.tsx` — Setup screen chips unchanged (D-06)
- `src/feedback/payload.ts`, `src/feedback/schema.ts` — no changes; payload
  already sources `tense` from the enum literal, not the label map (D-09)
- `src/dataset/types.ts` — `Tense` union/`TENSES` const unchanged

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/theme/tokens.ts` (from Phase 11): `colors.textSecondary` (`#6B6560`)
  and `typography.body`/`typography.caption` are available if the
  implementer chooses de-emphasized styling for the parenthetical term
  (D-07).

### Established Patterns
- `app/quiz.tsx`'s meta row currently renders as one `<Text>` with a
  template-literal string
  (`{currentVerb?.translation ?? ""} · {tenseLabels[question.tense]} ·
  {subjectLabels[question.subject]}`) — D-04's inline-parenthesized format
  fits this existing single-line pattern without restructuring the JSX
  (though nesting a second `<Text>` inside for D-07's optional
  de-emphasis is a minor, compatible change).
- `src/quiz/labels.ts` currently exports two flat `Record<Tense/Subject,
  string>` maps with no partial/optional records — D-08's new Portuguese
  lookup is the first place this file would need a partial map (only 2 of
  4 tenses), which is a new pattern worth flagging to the planner/executor.

### Integration Points
- `tenseLabels` is imported in exactly two places: `app/quiz.tsx` (meta
  row) and `app/index.tsx` (Setup screen chips) — confirmed via repo grep.
  Only the `app/quiz.tsx` call site changes this phase (D-06 excludes
  `app/index.tsx`).

</code_context>

<specifics>
## Specific Ideas

- Exact English wording locked by ROADMAP.md success criteria: "Completed
  past" (preterite), "Imperfect past" (imperfect) — not open for
  rewording.
- Exact Portuguese wording locked by REQUIREMENTS.md LABEL-02: "Pretérito
  perfeito" (preterite), "Pretérito imperfeito" (imperfect).

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

### Reviewed Todos (not folded)
None — no pending todos matched this phase.

</deferred>

---

*Phase: 12-Tense Label Refresh*
*Context gathered: 2026-07-19*
