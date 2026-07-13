# Phase 2: Dataset & Domain Vocabulary - Context

**Gathered:** 2026-07-12
**Status:** Ready for planning

<domain>
## Phase Boundary

A typed, Zod-validated local verb dataset (50 verbs × 4 tenses × 6 subjects) backing all future
quiz content, plus a one-time reconciliation of the app's internal `Tense`/`Subject` vocabulary
against the backend's locked enum literals. No quiz-generation logic, no UI, no feedback
integration — those are Phases 3-5. This phase produces data + types + validation only.

</domain>

<decisions>
## Implementation Decisions

### Verb Selection Mix
- **D-01:** Mostly regular, few irregular — target ~35-40 regular verbs + ~10-15 of the most
  common irregulars (ser, estar, ter, ir, fazer, poder, querer, dizer, ver, dar, vir, saber, pôr).
  Matches A1-A2 learner level: irregulars are essential but shouldn't dominate the set.
- **D-02:** Among the regular verbs, weight conjugation classes roughly proportional to real-world
  usage: ~50% -ar, ~30% -er, ~20% -ir. All three classes must still be represented so every
  conjugation pattern gets quiz coverage — this is not a hard ratio, just the target skew.

### Internal Vocabulary vs Backend Literals
- **D-03:** Internal `Tense`/`Subject` TypeScript types MUST use the exact same string literal
  values as the backend's locked enums — `Tense = 'present_indicative' | 'preterite' | 'imperfect'
  | 'future'`, `Subject = 'eu' | 'tu' | 'ele_ela' | 'nos' | 'voces' | 'eles_elas'`. These are used
  as the actual dataset/quiz-engine types everywhere in the app, not just at the feedback boundary.
  This means **zero mapping layer is needed in Phase 5** for the tense/subject fields specifically —
  the feedback payload can pass these values straight through.
  Display-friendly labels (e.g., "ele/ela" with the slash, "nós" with the accent) are a **separate
  presentation-only lookup table** (e.g., `subjectLabels: Record<Subject, string>`), not a new type
  and not part of this phase's dataset module — build it when the setup/quiz UI needs it (Phase 4),
  not now.

### Conjugation Accuracy Source
- **D-04:** No specific external reference required. Claude drafts the full 50-verb dataset from
  its own European Portuguese grammar knowledge; the user does a verb-by-verb read-through before
  it ships. This read-through can happen either at the end of this phase or, per the existing
  ROADMAP Phase 6 plan, as the dedicated "dataset accuracy read-through vs authoritative EP source"
  polish pass — planner's discretion on timing, but the accuracy responsibility is user review, not
  a cited external source.

### Irregular-Verb Flag Criteria
- **D-05:** `isIrregular` is true if and only if the verb deviates from the regular -ar/-er/-ir
  pattern in the **present indicative** specifically (traditional EP A1-A2 teaching definition —
  stem changes, irregular 1st person, etc.). A verb that is regular in the present but irregular in
  a later tense (preterite/imperfect/future) is still flagged `isIrregular: false`. This keeps the
  "Include irregular verbs" toggle's meaning aligned with what a beginner learner expects.

### Claude's Discretion
- Exact dataset file structure (single `verbs.ts` array vs split files) — single file is sufficient
  per `.planning/research/ARCHITECTURE.md`'s scaling notes for 50 verbs; no action needed unless
  file size becomes unwieldy.
- Zod schema shape and validation test structure — per `.planning/research/STACK.md`'s existing
  recommendation (one schema mirroring `Verb { verb, translation, isIrregular, conjugations:
  Record<Tense, Record<Subject, string>> }`, asserted in a Jest test).
- Whether `validateDataset()` also runs at runtime in `__DEV__` vs test-time only — architecture
  research left this open ("optionally at runtime"), no user preference expressed.
- Exact list of which 15 irregular verbs beyond the near-certain core (ser/estar/ter/ir/fazer/
  poder/querer/dizer/ver/dar/vir/saber/pôr) fill out the remaining irregular slots, and the full
  35-40 regular verb list — user did not provide a specific list, drafting is delegated to Claude
  per D-04.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Stack & Versions
- `.planning/research/STACK.md` — Zod 4.x recommendation for dataset shape validation; exact
  schema pattern (`Verb` type mirroring `verb, translation, isIrregular, conjugations`)

### Architecture
- `.planning/research/ARCHITECTURE.md` — pure-domain-core pattern for `src/dataset/`
  (`verbs.ts`, `types.ts`, `validate.ts`), zero React/Zustand imports, scaling notes for 50-verb
  single-file structure, recommended structure section (§Recommended Project Structure)

### Project Contract
- `.planning/PROJECT.md` — locked backend enum literals (`tense`, `subject`, `platform`), full
  50-verb target confirmed as a Key Decision, "dataset authoring drafted by assistant, reviewed by
  user" constraint
- `.planning/ROADMAP.md` §Phase 2 — success criteria this phase must satisfy; §Phase 6 — where the
  dedicated accuracy read-through against an authoritative EP source is currently planned
- `CLAUDE.md` — exact locked enum literal strings for `tense` and `subject` (source of truth for
  D-03's internal vocabulary mirroring)

### Prior Phase
- `.planning/phases/01-scaffold/01-CONTEXT.md` — D-02 established `app/` routes-only + sibling
  `src/` domain tree convention that this phase's `src/dataset/` continues

No other external specs — requirements fully captured in decisions above.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/store/useQuizStore.ts` (Phase 1) — placeholder Zustand store with `status: 'idle'`; this
  phase does not modify it, but Phase 3's quiz-engine will eventually feed it via `src/dataset/`
  types this phase defines.

### Established Patterns
- `app/` routes-only, `src/<domain>/` for logic (Phase 1 D-02) — `src/dataset/` follows this.
- Strict TypeScript (`tsconfig.json` `strict: true`, `noUncheckedIndexedAccess: true` from Phase 1)
  — dataset types should be written to pass strict mode cleanly, particularly around
  `Record<Tense, Record<Subject, string>>` indexing.

### Integration Points
- `src/dataset/types.ts`'s `Tense`/`Subject` unions are the single source of truth Phase 3's
  quiz-engine and Phase 5's feedback client will both import — no other module should redeclare
  these types.

</code_context>

<specifics>
## Specific Ideas

No specific verb list was provided by the user — the near-certain core irregulars (ser, estar,
ter, ir, fazer, poder, querer, dizer, ver, dar, vir, saber, pôr) were named during discussion as
examples of "most common irregulars," not an exhaustive final list. Claude drafts the full list per
D-01/D-02/D-04/D-05, user reviews before it ships.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope. (The tense/subject → display-label mapping table was
raised during discussion but explicitly deferred to Phase 4, not built now — see D-03.)

</deferred>

---

*Phase: 2-Dataset & Domain Vocabulary*
*Context gathered: 2026-07-12*
