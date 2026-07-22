# Phase 18: Explanation Compatibility Upgrade - Research

**Researched:** 2026-07-22
**Domain:** Pure TypeScript domain logic (template interpolation), no new libraries, no UI
**Confidence:** HIGH

## Summary

This phase is a small, well-contained extension of one existing pure function,
`selectExplanation` in `src/learning/explain.ts` (67 lines total). No new
dependencies, no new files are strictly required, no schema changes are
needed (the Zod schema and `VerbLearningEntry` type already support
`tenseNotes`/`subjectHints` as of a prior phase). The entire task is: (1) add
two more keys to the `context` object passed to `interpolate()`, resolved
from `verb.formIndex[selectedAnswer]` using the same `matches` array already
computed by `classify()`, and (2) append `tenseNotes[correctTense]` /
`subjectHints[correctSubject]` strings to the interpolated result, joined by
`\n`, only when present.

The codebase and CONTEXT.md have already done the hard design work: D-01
through D-04 fully specify the resolution algorithm for tied/ambiguous
selected-answer matches and the append order/gating rules. This research
confirms those decisions are directly implementable against the current code
and verifies the real backend v0.4 fixture data shape they're based on.

**Primary recommendation:** Extend `selectExplanation` in place (no new
files needed) by computing `selectedTenseLabel`/`selectedSubjectLabel` from
`matches[0]` only when `category !== "generic"` (i.e., only when all matches
agreed — reuse the existing `classify()` result, don't recompute agreement),
then appending `entry.tenseNotes?.[correctAnswer.tense]` and
`entry.subjectHints?.[correctAnswer.subject]` as extra `\n`-joined lines
unconditionally (regardless of category).

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Template variable resolution (labels) | Domain logic (`src/learning/`) | — | Pure function, no I/O, matches existing `classify`/`interpolate` pattern |
| Notes/hints appending | Domain logic (`src/learning/`) | — | Same function, same fail-closed contract |
| Backend content shape (schema) | Already implemented (`src/learning/schema.ts`) | — | No changes needed — `tenseNotes`/`subjectHints` already validated |
| Rendering the returned string | UI (`app/quiz.tsx`) | — | Out of scope for this phase — caller signature/behavior for consuming the string is unchanged |

## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** When multiple `formIndex[selectedAnswer]` matches agree on a
  mismatch category (`classify()`'s "all agree" path), resolve
  `selectedTenseLabel`/`selectedSubjectLabel` from **`matches[0]`** —
  deterministic by array order, consistent with `classify()` treating
  `categories[0]` as its reference category.
- **D-02:** When tied matches **disagree** on category (`classify()` already
  falls back to `"generic"`), `selectedTenseLabel`/`selectedSubjectLabel` are
  **omitted from the interpolation context entirely** rather than computed
  from `matches[0]`. This is behaviorally a no-op (the `generic` template
  doesn't reference these placeholders) but keeps resolution conceptually
  tied to "the same selected match that drove the mismatch category."
- **D-03:** `tenseNotes[correctAnswer.tense]` and
  `subjectHints[correctAnswer.subject]` are appended to the interpolated
  template output as **separate lines**, joined with `\n`, in order:
  interpolated text, then `tenseNotes` (if present), then `subjectHints` (if
  present). Skip either/both silently if absent — never append an empty
  line.
- **D-04:** Notes/hints are appended **unconditionally across all
  categories** (`wrongTense`, `wrongSubject`, `wrongTenseAndSubject`,
  `generic`) whenever the backend content has them for the correct
  tense/subject — no category-based gating.

### Claude's Discretion

- Exact placement of the label-resolution/appending logic within
  `explain.ts` (inline in `selectExplanation` vs. a small helper function) —
  no structural preference expressed, keep the module's existing
  small-pure-function style.

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| EXPL-05 | `selectExplanation` provides all backend v0.4 template variables (`verb`, `selectedAnswer`, `correctAnswer`, `tenseLabel`, `subjectLabel`, `selectedTenseLabel`, `selectedSubjectLabel`) | Confirmed current `context` object (lines 56-63 of `explain.ts`) already has the first 5 keys; add 2 more per D-01/D-02. Fixture's real templates (`content-verbs-v0.4.sample.json` line 8712-8718) confirm exact placeholder names used by backend. |
| EXPL-06 | Selected tense/subject resolved from `verb.formIndex[selectedAnswer]`; reuse the same selected match that drove the mismatch category when ambiguous, else fall back to generic | `classify()` already computes `matches` → `categories` → agree/disagree. D-01/D-02 specify exactly how to reuse this without duplicating the agree/disagree computation. |
| EXPL-07 | `tenseNotes[correctTense]`/`subjectHints[correctSubject]` appended when present | `VerbLearningEntry` type and `LearningContentSchema` already declare these as optional fields — no schema change needed, confirmed in `src/learning/types.ts` and `src/learning/schema.ts`. Fixture has real examples for `ser`, `estar`, `ter`, `ir`, `fazer`, `poder` (both tenseNotes and subjectHints present in fixture, contrary to CONTEXT.md's claim that no subjectHints example exists — see Open Questions). |
| EXPL-08 | Fail-closed: no `learning`/`formIndex`/match → no explanation, ever | Existing early-returns (`!learning \|\| !verb.formIndex`, `!entry`, `!matches \|\| matches.length === 0`) already implement this for the base case; new logic must not introduce any new throw or fabrication path — appending happens only after the existing template interpolation, and note/hint appends never trigger a "return undefined" — they only add text if present. |
| TEST-06 | Unit tests cover selectedTenseLabel/subjectLabel interpolation, appended notes/hints, missing-match fail-closed path | Existing `__tests__/learning-explain.test.ts` (11 tests) already exercises tied-agree/tied-disagree/fail-closed paths at the category level — extend with assertions on the new fields and note/hint text, following the exact same `buildVerb()`/`buildLearningContent()` fixture-builder pattern. |
</phase_requirements>

## Standard Stack

No new packages. This phase modifies one existing file
(`src/learning/explain.ts`) and its test file
(`__tests__/learning-explain.test.ts`). No `Standard Stack`,
`Package Legitimacy Audit`, or `Environment Availability` sections apply —
skipped per the "no external dependencies" condition.

## Architecture Patterns

### Recommended Project Structure

No new files needed. Everything stays in:
```
src/learning/
├── explain.ts        # selectExplanation, classify, interpolate — extend in place
└── types.ts           # FormMatch, MismatchCategory, LearningContent, VerbLearningEntry — no changes needed
__tests__/
└── learning-explain.test.ts   # extend existing test file
```

### Pattern: Reuse `classify()`'s agreement computation, don't duplicate it

**What:** `classify()` already computes `categories` (one per match) and
`allAgree = categories.every((c) => c === first)`, returning either the
agreed category or `"generic"`. The existing code discards this
intermediate `allAgree`/`categories` info once `classify()` returns.

**When to use:** For D-01/D-02, the cleanest implementation checks
`category !== "generic"` as the proxy for "matches agreed" — this is exactly
equivalent to `allAgree` for the non-disagreement path IF a genuinely
`"generic"` category match set (i.e., an actual generic match, not a
disagree-fallback) is impossible to distinguish from a disagreement
fallback. **This is a real ambiguity to resolve during planning** — see
Open Questions below; it affects whether `category !== "generic"` alone is
a safe proxy or whether `classify()` needs to be refactored to expose
`allAgree` explicitly.

**Example:**
```typescript
// Source: existing src/learning/explain.ts pattern, extended
function classify(
  matches: FormMatch[],
  correct: { tense: Tense; subject: Subject },
): { category: MismatchCategory; agreed: boolean } {
  const categories = matches.map((match): MismatchCategory => {
    const sameTense = match.tense === correct.tense;
    const sameSubject = match.subject === correct.subject;
    if (sameTense && sameSubject) return "generic";
    if (sameSubject) return "wrongTense";
    if (sameTense) return "wrongSubject";
    return "wrongTenseAndSubject";
  });
  const first = categories[0]!;
  const allAgree = categories.every((category) => category === first);
  return { category: allAgree ? first : "generic", agreed: allAgree };
}
```
This small refactor (returning `{ category, agreed }` instead of bare
`MismatchCategory`) cleanly disambiguates "matches[0] IS itself a generic
match" (agreed === true, category === "generic") from "matches disagreed"
(agreed === false, category === "generic") — both currently collapse to the
same `"generic"` string, but only the first case has a legitimately reusable
`matches[0]` per D-01's spirit ("reuse the same selected match that drove
the mismatch category" — a disagreement fallback was NOT driven by any
single match).

### Pattern: `interpolate()`'s built-in safety for optional context keys

**What:** `interpolate()` (line 25-34) does a regex `.replace()` that only
substitutes keys present in `context` via
`Object.prototype.hasOwnProperty.call(context, key)` — unmatched
`{placeholder}` tokens are left as literal text if the key is absent.

**When to use:** This means D-02 ("omit from context entirely") is safe by
construction — omitting `selectedTenseLabel`/`selectedSubjectLabel` from the
`context` object when matches disagree will NOT leave a stray
`{selectedTenseLabel}` in the output, because the `generic` template (used
whenever `category === "generic"`, which is exactly when matches disagree)
never contains that placeholder in the first place. No extra guard logic
needed beyond "don't add the key when disagreed."

**Example:**
```typescript
// Source: src/learning/explain.ts:25-34 (existing, unchanged)
function interpolate(template: string, context: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (original, key: string) =>
    Object.prototype.hasOwnProperty.call(context, key) ? context[key]! : original,
  );
}
```

### Anti-Patterns to Avoid

- **Appending notes/hints only for certain categories:** D-04 explicitly
  requires unconditional appending across all 4 categories. Do not add
  `if (category === "wrongTense") { append tenseNotes }`-style gating.
- **Recomputing agreement logic separately from `classify()`:** Duplicating
  the `categories.every(...)` check outside `classify()` risks the two
  computations drifting. Prefer the small `classify()` return-shape change
  above (or an equivalent single source of truth).
- **Appending an empty line when notes/hints are absent:** e.g.
  `[text, tenseNotes ?? "", subjectHints ?? ""].join("\n")` would produce
  trailing `\n\n` when a value is missing. Filter falsy segments before
  joining: `[text, tenseNotes, subjectHints].filter(Boolean).join("\n")`.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Template placeholder substitution | A new templating engine/library | Existing `interpolate()` regex function | Already handles missing-key safety exactly as needed; no new dependency justified for `{key}` substitution |
| Optional-field presence check | Manual `typeof x !== "undefined"` scattered checks | Existing `?.` optional chaining + `Partial<Record<...>>` types already on `VerbLearningEntry` | Type-safe, matches existing codebase convention (`entry.tenseNotes?.[correctAnswer.tense]`) |

**Key insight:** This phase needs zero new abstractions — it's a case study
in extending an existing small-pure-function module without adding
structural complexity.

## Common Pitfalls

### Pitfall 1: Conflating "generic due to actual match" with "generic due to disagreement"

**What goes wrong:** If the implementation uses `category === "generic"` as
the sole signal for "omit selected labels," it will also omit selected
labels in the (currently impossible given fixture data, but type-theoretically
possible) case where a *single* match has `sameTense && sameSubject` — i.e.,
`selectedAnswer` happens to equal the correct answer, which one might think
shouldn't happen in practice (a learner wouldn't select the correct answer
as their "wrong" answer) — this edge case is likely unreachable via the
actual quiz flow, but the classify() function itself doesn't rule it out.
**Why it happens:** `classify()` collapses both "all-agree-and-agreed-value-
is-generic" and "disagreed-so-fallback-to-generic" into the same string
return value.
**How to avoid:** Refactor `classify()` (or add a sibling helper) to
distinguish `agreed` from the resulting `category`, per the Architecture
Patterns section above. Confirm with a unit test that an all-agree-on-
generic case (if constructible) still resolves `matches[0]`-based labels,
while a genuine disagreement omits them — though note the existing fixture
builder has no natural "all matches are generic" test case; the planner
may choose to treat this as a non-issue since `selectedAnswer` matching the
correct answer shouldn't occur when driven by real quiz mismatch logic (the
`Question` type guarantees `selectedAnswer !== correctAnswer` in practice)
— flag as an open question for the planner to resolve rather than
silently picking an interpretation.

### Pitfall 2: `entry.tenseNotes`/`entry.subjectHints` indexed access under `noUncheckedIndexedAccess`

**What goes wrong:** `entry.tenseNotes?.[correctAnswer.tense]` type-checks
fine under `noUncheckedIndexedAccess` because `Partial<Record<Tense, string>>`
already types the indexed access as `string | undefined` — no extra `!`
assertion needed, and none should be added (there's no "invariant" here;
absence is a legitimate, expected case, unlike the `categories[0]!` case).
**Why it happens:** Contributors following the "add `!` for
noUncheckedIndexedAccess" convention seen elsewhere in the codebase might
reflexively add a non-null assertion here, which would be actively wrong —
this value is genuinely optional and must stay `string | undefined`.
**How to avoid:** Do not assert non-null on `tenseNotes`/`subjectHints`
lookups; let them flow through as `string | undefined` and filter with
`.filter(Boolean)` or an explicit `if` check before appending.

### Pitfall 3: Test fixture in `learning-explain.test.ts` currently has no `tenseNotes`/`subjectHints` data

**What goes wrong:** `buildLearningContent()`'s `falar` entry only has
`irregularTenses: []` — no `tenseNotes`/`subjectHints`. Extending tests
for EXPL-07 requires either adding these fields to the existing `falar`
entry (risk: could change existing test expectations if not scoped
carefully) or adding a new verb entry to `buildVerb()`/
`buildLearningContent()` dedicated to notes/hints testing.
**Why it happens:** The existing fixture builder was written before v0.4
fields existed.
**How to avoid:** Prefer adding `tenseNotes`/`subjectHints` to the existing
`falar` entry (since all other test verbs/matches are already keyed off
`falar`) but only reference them in *new* test cases — existing tests using
`correctSlot = present_indicative/eu` will need `tenseNotes.present_indicative`
and/or `subjectHints.eu` to remain absent (or the existing assertions must be
updated to include the appended text). Recommend: add `tenseNotes` keyed to
a *different* tense (e.g. `preterite`) and `subjectHints` keyed to a
different subject than `correctSlot` uses, OR add fields but update all
existing exact-string assertions to include the appended note/hint text.
This is a test-fixture design decision the planner should make explicitly,
not leave implicit.

## Code Examples

### Full extended `selectExplanation` sketch (illustrative, not prescriptive)

```typescript
// Source: derived from src/learning/explain.ts (existing) + CONTEXT.md D-01..D-04
export function selectExplanation(
  verb: Verb,
  selectedAnswer: string,
  correctAnswer: { tense: Tense; subject: Subject },
  learning: LearningContent | undefined,
): string | undefined {
  if (!learning || !verb.formIndex) return undefined;

  const entry = learning.verbs[verb.verb];
  if (!entry) return undefined;

  const matches = verb.formIndex[selectedAnswer];
  if (!matches || matches.length === 0) return undefined;

  const { category, agreed } = classify(matches, correctAnswer);
  const template =
    category === "generic" ? learning.templates.generic : learning.templates[category];

  const context: Record<string, string> = {
    verb: verb.verb,
    correctAnswer: verb.conjugations[correctAnswer.tense][correctAnswer.subject],
    selectedAnswer,
    tenseLabel: tenseLabels[correctAnswer.tense],
    subjectLabel: subjectLabels[correctAnswer.subject],
  };

  if (agreed) {
    // noUncheckedIndexedAccess-safe: matches.length >= 1 is guaranteed above.
    const selectedMatch = matches[0]!;
    context.selectedTenseLabel = tenseLabels[selectedMatch.tense];
    context.selectedSubjectLabel = subjectLabels[selectedMatch.subject];
  }

  const interpolated = interpolate(template, context);

  const extraLines = [
    entry.tenseNotes?.[correctAnswer.tense],
    entry.subjectHints?.[correctAnswer.subject],
  ].filter((line): line is string => Boolean(line));

  return [interpolated, ...extraLines].join("\n");
}
```

### Test pattern for new assertions (following existing style)

```typescript
// Source: extends __tests__/learning-explain.test.ts's existing style
it("includes selectedTenseLabel/selectedSubjectLabel for a single-match wrongSubject case", () => {
  const verb = buildVerb();
  const learning = buildLearningContent();
  learning.templates.wrongSubject =
    "You answered as {selectedSubjectLabel}; for {subjectLabel} of {verb}, use '{correctAnswer}', not '{selectedAnswer}'.";
  const result = selectExplanation(verb, "falas", correctSlot, learning);
  // "falas" = present_indicative/tu -- selectedSubjectLabel should be subjectLabels.tu
  expect(result).toContain(subjectLabels.tu);
});

it("appends tenseNotes and subjectHints as separate lines when present", () => {
  const verb = buildVerb();
  const learning = buildLearningContent();
  learning.verbs.falar = {
    irregularTenses: [],
    tenseNotes: { present_indicative: "Some note text." },
    subjectHints: { eu: "Some hint text." },
  };
  const result = selectExplanation(verb, "falas", correctSlot, learning);
  expect(result).toBe(
    `For ${subjectLabels.eu} of falar, use 'falo', not 'falas'.\nSome note text.\nSome hint text.`,
  );
});

it("omits selectedTenseLabel/selectedSubjectLabel when tied matches disagree", () => {
  const verb = buildVerb();
  const learning = buildLearningContent();
  const result = selectExplanation(verb, "tied-disagree", correctSlot, learning);
  // generic template has no {selectedTenseLabel}/{selectedSubjectLabel} placeholders,
  // so this is a behavioral no-op -- assert the plain generic output, unaffected.
  expect(result).toBe("For falar, the correct answer is 'falo'.");
});
```

## State of the Art

Not applicable — no external library/API surface changed. The only "state
of the art" reference is the backend's v0.4 content contract itself, which
is captured in the Phase 17 fixture
(`__tests__/fixtures/content-verbs-v0.4.sample.json`) and already proven to
parse (Phase 17, `__tests__/contract-fixture.test.ts`).

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `category !== "generic"` is an insufficiently precise proxy for "matches agreed" (Pitfall 1) — recommending a `classify()` return-shape change to `{ category, agreed }` | Architecture Patterns, Pitfall 1 | Low risk to product behavior (the ambiguous case is likely unreachable via real quiz data since selectedAnswer != correctAnswer in practice), but if the planner instead uses the simpler `category !== "generic"` proxy without addressing this, a future test asserting the "single generic match" edge case would fail or behave differently than D-01 literally specifies. This is a design nuance CONTEXT.md's D-01/D-02 do not explicitly address (they describe the tied-agree/tied-disagree cases from the actual test fixture, not the theoretical single-match-generic case). |
| A2 | CONTEXT.md states "No `subjectHints` example currently exists in the fixture" — this research found `subjectHints` entries for `fazer`, `poder`, and at least 4 other verbs in `content-verbs-v0.4.sample.json` (lines 8883, 8896, 8909, 8923, 8968, 8983) | Canonical References (CONTEXT.md text, not this doc) | None for planning — this is a correction, not a risk. The planner can use real fixture `subjectHints` data instead of synthesizing one, if desired for richer test coverage against the actual contract fixture. |

## Open Questions

1. **Should `classify()`'s signature change to expose `agreed` separately from `category`?**
   - What we know: The current `classify()` returns a single `MismatchCategory` string, collapsing "matches agreed on generic" and "matches disagreed" into the same `"generic"` value. D-01/D-02 are written in terms of the tied-agree/tied-disagree test fixtures, which never hit the ambiguous single-match-generic edge case.
   - What's unclear: Whether the planner should invest in disambiguating this (via a return-shape change, as sketched above) or accept `category !== "generic"` as a "good enough" proxy, given the edge case is likely unreachable through the real quiz flow (a `Question`'s `selectedAnswer` is chosen from wrong `choices`, so `selectedAnswer === correctAnswer` shouldn't occur — see `src/quiz/engine.ts`'s `buildQuestion`/`pickDistractors`).
   - Recommendation: Default to the simpler `category !== "generic"` proxy unless the executor finds a concrete counterexample during test-writing; document the assumption inline with a comment if chosen. Low risk either way given the practical unreachability of the edge case, but flag it so it isn't silently decided without a comment trail.

2. **Test fixture design for EXPL-07 (tenseNotes/subjectHints on `falar`)**
   - What we know: Existing tests key everything off `buildVerb()`'s `falar` entry with `correctSlot = present_indicative/eu`. `buildLearningContent()`'s `falar` entry has no `tenseNotes`/`subjectHints` today.
   - What's unclear: Whether to add these fields to the existing `falar`/`correctSlot` combination (requiring updates to several existing exact-string assertions) or introduce a second verb/scenario dedicated to notes/hints testing (cleaner isolation, more boilerplate).
   - Recommendation: Add `tenseNotes`/`subjectHints` to a `correctSlot` combination NOT used by the pre-existing passing tests (e.g., key the note under `preterite` and the hint under a subject other than `eu`), so all current assertions remain untouched and only new tests exercise the appended text — see Pitfall 3 and Code Examples above.

## Environment Availability

Skipped — no external dependencies (pure in-repo TypeScript change, no new
tools/services/runtimes required beyond what's already installed: Jest,
TypeScript, already present per `.planning/codebase/STACK.md`).

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest via `jest-expo` ~57.0.1 preset (existing, `package.json`) |
| Config file | `package.json`'s `"jest": { "preset": "jest-expo" }` field |
| Quick run command | `npx jest __tests__/learning-explain.test.ts` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| EXPL-05 | Context includes all 7 template variables | unit | `npx jest __tests__/learning-explain.test.ts -t "template"` | ✅ existing file, extend |
| EXPL-06 | selectedTenseLabel/selectedSubjectLabel resolved from matches[0] when agreed; omitted when disagreed | unit | `npx jest __tests__/learning-explain.test.ts -t "selected"` | ✅ existing file, extend |
| EXPL-07 | tenseNotes/subjectHints appended as separate lines, order and skip-if-absent | unit | `npx jest __tests__/learning-explain.test.ts -t "notes\|hints"` | ✅ existing file, extend |
| EXPL-08 | Fail-closed paths (no learning/formIndex/match) still return undefined | unit | `npx jest __tests__/learning-explain.test.ts -t "undefined"` | ✅ existing file, already covers base case — verify still passes after extension |
| TEST-06 | All of the above, explicit coverage | unit | `npm test` | ✅ existing file, extend |

### Sampling Rate
- **Per task commit:** `npx jest __tests__/learning-explain.test.ts`
- **Per wave merge:** `npm test` (full suite, currently 192+ tests per STATE.md v0.3 baseline)
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
None — existing test infrastructure (`__tests__/learning-explain.test.ts`,
Jest + `jest-expo` preset) fully covers this phase's requirements; only new
test cases need to be added to the existing file, no new framework/config/
fixtures required.

## Sources

### Primary (HIGH confidence)
- `src/learning/explain.ts` (read directly, current implementation)
- `src/learning/types.ts` (read directly, confirms `tenseNotes`/`subjectHints` already typed)
- `src/learning/schema.ts` (read directly, confirms Zod schema already validates these fields)
- `src/quiz/labels.ts` (read directly, confirms `tenseLabels`/`subjectLabels` lookup tables)
- `__tests__/learning-explain.test.ts` (read directly, existing test coverage/style)
- `__tests__/fixtures/content-verbs-v0.4.sample.json` (read directly, real backend v0.4 template strings and tenseNotes/subjectHints examples)
- `.planning/phases/18-explanation-compatibility-upgrade/18-CONTEXT.md` (locked decisions D-01..D-04)
- `.planning/REQUIREMENTS.md` (EXPL-05..08, TEST-06 exact wording)
- `.planning/STATE.md` (project status, confirms Phase 17 complete, v0.3 baseline 192 tests)

### Secondary (MEDIUM confidence)
None used — all findings verified directly against the actual codebase files.

### Tertiary (LOW confidence)
None used.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - no new dependencies, confirmed by reading `package.json`-derived STACK.md and the actual source files
- Architecture: HIGH - directly read and traced the existing `selectExplanation`/`classify`/`interpolate` implementation and its full test suite
- Pitfalls: MEDIUM-HIGH - Pitfall 1 (classify() ambiguity) is a genuine design nuance not explicitly resolved by CONTEXT.md's decisions, flagged as Open Question rather than asserted as fact

**Research date:** 2026-07-22
**Valid until:** Stable — this is a closed, self-contained pure-function change with no external API surface; valid until the backend v0.4 contract itself changes (no expiration risk from library/ecosystem drift)
