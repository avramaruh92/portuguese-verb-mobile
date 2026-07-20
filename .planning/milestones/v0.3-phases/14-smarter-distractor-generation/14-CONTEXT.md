# Phase 14: Smarter Distractor Generation - Context

**Gathered:** 2026-07-20
**Status:** Ready for planning

<domain>
## Phase Boundary

Replace `pickDistractors`' current 2-tier strategy (same-verb wrong-subject →
cross-verb same-subject/tense) with a 3-tier priority strategy: same-verb
wrong-subject → same-verb wrong-tense (preterite/imperfect pair prioritized
when applicable) → cross-verb fallback preferring the same conjugation class
(derived from infinitive ending). The existing 4-unique-choices/1-correct-
answer invariant must hold across every tense/mode combination, verified by
new unit tests.

</domain>

<decisions>
## Implementation Decisions

### Tier 2 — same-verb wrong-tense
- **D-01:** When the question's own tense IS `preterite` or `imperfect`, tier
  2's top-priority candidate is the *other* member of that pair (the
  Completed-past vs. Imperfect-past confusion), same subject, same verb.
- **D-02:** When the question's own tense is `present_indicative` or
  `future` (not part of the preterite/imperfect pair), tier 2 has no special
  ordering — pick from whichever other same-verb, same-subject tense form(s)
  are available (shuffled, consistent with how tier 1 already shuffles
  same-verb candidates).
- **D-03:** Tier 2 candidates are same-verb, same-subject, other-tense forms
  — the tense-axis mirror of tier 1's same-verb, other-subject, same-tense
  candidates. Dedupe against the correct answer and already-chosen
  distractors, same as tier 1 does today.

### Tier 3 — cross-verb fallback with conjugation class
- **D-04:** Conjugation class is derived at distractor-selection time from
  the verb's infinitive ending (last two letters: `ar` / `er` / `ir`) — no
  dataset/schema change, no new field on `Verb`.
- **D-05:** Tier 3 first tries other verbs sharing the same conjugation
  class (same ending) before falling back to any other verb, when same-verb
  tiers 1+2 are exhausted — same-subject/tense form, as today.

### Tier-fill strategy
- **D-06:** Strict fill-then-fallback: tier 1 is filled to exhaustion first,
  then tier 2 fills remaining slots, then tier 3 fills whatever's left.
  Mirrors the current code's same-verb-then-cross-verb structure — just
  inserts the missing middle tier. No deliberate tier-mixing/reservation of
  slots when an earlier tier alone could fill all 3.

### Claude's Discretion
- Exact internal helper function names/shapes for the new tier-2 candidate
  logic (e.g. whether it's a new `pickWrongTenseDistractors` alongside the
  existing tier-1/tier-3 logic, or inlined into `pickDistractors`) — follow
  `src/quiz/engine.ts`'s existing small-single-purpose-function convention.
- Shuffle/randomization mechanics within a tier (already established via the
  injectable `random` parameter pattern) apply unchanged to tier 2.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements & roadmap
- `.planning/ROADMAP.md` §"Phase 14: Smarter Distractor Generation" — goal,
  5 success criteria (tier priority order, 4-unique/1-correct invariant,
  unit test coverage), depends on Phase 13 (shipped)
- `.planning/REQUIREMENTS.md` §"Distractors" — DIST-01, DIST-02, DIST-03,
  DIST-04 exact requirement text; TEST-04 traceability row

No other external specs/ADRs apply — requirements fully captured in
ROADMAP.md/REQUIREMENTS.md and the decisions above.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/quiz/engine.ts`'s `pickDistractors()` — already implements tier 1
  (same-verb wrong-subject, deduped via `Set`, shuffled) and tier 3
  (cross-verb same-subject/tense fallback) exactly as needed; this phase
  inserts tier 2 between them and adds conjugation-class preference to tier
  3's existing fallback loop.
- `shuffle()` (`src/quiz/random.ts`) — the existing injectable Fisher-Yates
  shuffle, already used for both tiers; reuse for tier 2 candidate ordering.

### Established Patterns
- `pickDistractors(verb, tense, subject, allVerbs, random)` signature is
  unchanged by this phase — same inputs, same `string[]` return, tier logic
  only.
- `DISTRACTOR_COUNT = 3` module constant caps total distractors regardless
  of how many tiers are consulted.
- Dedup pattern: build an `exclude` Set seeded with `correctAnswer` and
  already-chosen forms; skip any candidate already in `exclude` before
  pushing (`src/quiz/engine.ts:74-85`) — tier 2 and the tier-3
  class-preference pass follow this same pattern.
- `Verb.verb` is a plain infinitive string (`"falar"`, `"comer"`,
  `"partir"`, `"ser"`, ...) ending in `ar`/`er`/`ir` — conjugation class is
  `verb.slice(-2)`, no schema change needed (confirmed by scanning
  `src/dataset/verbs.ts`).
- `Tense` union (`src/dataset/types.ts`): `present_indicative | preterite |
  imperfect | future`. "Completed-past" = `preterite`, "Imperfect-past" =
  `imperfect` in ROADMAP.md's wording.

### Integration Points
- `src/quiz/engine.ts`'s `pickDistractors()` is the sole integration point
  — called only from `buildQuestion()` in the same file. No caller-side
  changes needed (`app/quiz.tsx`, `useQuizStore.ts` are unaffected).
- Tests: `__tests__/quiz-engine.test.ts` already has `pickDistractors` test
  coverage for tiers 1 and 3 (cross-verb fallback) — TEST-04 extends this
  file with tier-2 (wrong-subject, wrong-tense incl. preterite/imperfect
  pair) and cross-verb-with-class-preference cases, plus the existing
  4-unique/1-correct invariant re-verified under the new strategy.

</code_context>

<specifics>
## Specific Ideas

No specific implementation-style references beyond what's captured above —
ROADMAP.md's tier ordering and REQUIREMENTS.md's DIST-01–04 wording were
adopted directly as the priority strategy.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 14-Smarter Distractor Generation*
*Context gathered: 2026-07-20*
