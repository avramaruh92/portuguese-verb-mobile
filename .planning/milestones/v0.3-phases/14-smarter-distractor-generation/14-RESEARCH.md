# Phase 14: Smarter Distractor Generation - Research

**Researched:** 2026-07-20
**Domain:** Pure TypeScript algorithm change in a single existing file (`src/quiz/engine.ts`), no new dependencies, no UI/store/dataset-schema changes.
**Confidence:** HIGH

## Summary

This phase is a self-contained refactor of one function, `pickDistractors()` in
`src/quiz/engine.ts`, plus new Jest unit tests in `__tests__/quiz-engine.test.ts`.
No new libraries are needed — the whole implementation uses only language
built-ins (`Set`, `Array.filter/map`, string `.slice(-2)`) and the codebase's
existing `shuffle()` helper from `src/quiz/random.ts`. The current function
already implements what CONTEXT.md calls "tier 1" (same-verb, other-subject,
same-tense) and "tier 3" (cross-verb, same-subject/tense, no class
preference) back-to-back with no middle tier. This phase inserts a genuinely
new "tier 2" (same-verb, same-subject, other-tense — with preterite/imperfect
pair prioritization) between them, and adds a same-conjugation-class
preference pass to the existing tier-3 cross-verb fallback loop.

The real research value here is in the dataset shape, not any external
ecosystem: I confirmed the bundled dataset (`src/dataset/verbs.ts`, 50 verbs)
has a verb, `pôr`, whose infinitive ends in `ôr` — not `ar`/`er`/`ir` — which
breaks the naive `verb.slice(-2)` conjugation-class match locked by decision
D-04. This doesn't violate any locked decision (D-05's "same class before
falling back to any other verb" degrades gracefully — `pôr` just never
matches a class and always uses the generic fallback), but it's the one
concrete edge case worth a test case and an inline comment. I also traced
`allVerbs` through the actual call chain: `generate()` filters by `verbMode`
into `eligibleVerbs` *before* calling `buildQuestion(triple, eligibleVerbs,
random)`, so `pickDistractors`'s `allVerbs` parameter is the **mode-filtered**
pool, not the full 50-verb dataset. Under `irregular_only` mode this shrinks
the tier-3 candidate pool to just 13 verbs — still enough headroom for both
same-class and generic fallback given the class distribution below, but worth
a dedicated test.

**Primary recommendation:** Insert a new exported helper (e.g.
`pickSameVerbWrongTenseDistractors` or inlined tier-2 block matching tier 1's
existing inline style — Claude's Discretion per CONTEXT.md) between the
existing tier-1 and tier-3 blocks in `pickDistractors`, reusing the exact
`exclude`-Set-plus-shuffle-plus-slice pattern already used by tier 1, and add
a same-class-first ordering pass to the tier-3 fallback loop rather than
rewriting it.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Distractor tier selection (same-verb wrong-subject, same-verb wrong-tense, cross-verb fallback) | Domain logic (`src/quiz/engine.ts`) | — | Pure business logic, framework-free, already isolated from React/store per project convention |
| Conjugation-class derivation (`verb.slice(-2)`) | Domain logic (`src/quiz/engine.ts`) | — | No schema/type change per D-04; computed at selection time, not stored |
| Question assembly (choices array, correct answer placement) | Domain logic (`buildQuestion` in `src/quiz/engine.ts`) | — | Unchanged by this phase — `pickDistractors`'s signature and return type (`string[]`) stay identical |
| Test coverage | Test layer (`__tests__/quiz-engine.test.ts`) | — | Existing file already covers `pickDistractors`/`buildQuestion`; extend, don't create a new test file (matches one-file-per-module convention) |

No Browser/Frontend-Server/API/CDN/Database tiers are touched — this phase is entirely within the existing pure-logic layer.

## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** When the question's own tense IS `preterite` or `imperfect`, tier 2's top-priority candidate is the *other* member of that pair (Completed-past vs. Imperfect-past confusion), same subject, same verb.
- **D-02:** When the question's own tense is `present_indicative` or `future`, tier 2 has no special ordering — pick from whichever other same-verb, same-subject tense form(s) are available (shuffled, consistent with tier 1's shuffle).
- **D-03:** Tier 2 candidates are same-verb, same-subject, other-tense forms — the tense-axis mirror of tier 1's same-verb, other-subject, same-tense candidates. Dedupe against the correct answer and already-chosen distractors, same as tier 1.
- **D-04:** Conjugation class is derived at distractor-selection time from the verb's infinitive ending (`verb.slice(-2)`) — no dataset/schema change, no new field on `Verb`.
- **D-05:** Tier 3 first tries other verbs sharing the same conjugation class before falling back to any other verb, when same-verb tiers 1+2 are exhausted — same-subject/tense form, as today.
- **D-06:** Strict fill-then-fallback: tier 1 filled to exhaustion first, then tier 2, then tier 3. No deliberate tier-mixing/reservation of slots.

### Claude's Discretion
- Exact internal helper function names/shapes for the new tier-2 logic (new named export vs. inlined into `pickDistractors`) — follow `src/quiz/engine.ts`'s existing small-single-purpose-function convention.
- Shuffle/randomization mechanics within a tier (already established via the injectable `random` parameter) apply unchanged to tier 2.

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| DIST-01 | Distractor selection prefers same-verb, wrong-subject forms over arbitrary wrong forms | Already implemented (tier 1, unchanged) — confirmed by reading current `pickDistractors` lines 66-72 |
| DIST-02 | Distractor selection adds same-verb, wrong-tense forms, prioritizing the Completed-past vs. Imperfect-past confusion pair | New tier 2 — see Architecture Patterns below for concrete insertion shape and pair-prioritization logic |
| DIST-03 | Falls back to same-subject/tense forms from another verb (same conjugation class where available) when same-verb options run out | Existing tier-3 loop (lines 74-86) extended with a class-preference ordering pass — see Code Examples |
| DIST-04 | Every question keeps exactly 4 unique choices with exactly 1 correct answer under the new strategy | Verified via existing `Set`-based dedupe pattern extended across all 3 tiers; edge cases catalogued in Common Pitfalls |
| TEST-04 | Unit tests cover wrong-subject, wrong-tense (incl. pair), and cross-verb fallback cases, plus the 4-unique/1-correct invariant | Test patterns and `mockRandom` helper already exist in `__tests__/quiz-engine.test.ts` — see Validation Architecture |

## Standard Stack

No new packages. This phase uses only:
- Language built-ins: `Set`, `Array.prototype.filter/map/find`, `String.prototype.slice`
- Existing project helper: `shuffle()` from `src/quiz/random.ts` [VERIFIED: read source directly]
- Existing test tooling: Jest via `jest-expo` preset (already configured, no changes needed) [VERIFIED: read `__tests__/quiz-engine.test.ts` and `package.json`]

### Alternatives Considered
None applicable — no library choice exists for this problem; it's pure data selection over an in-memory array.

## Package Legitimacy Audit

Not applicable. This phase installs zero external packages.

## Architecture Patterns

### System Architecture Diagram (data flow through `pickDistractors`)

```
buildQuestion(triple, allVerbs, random)
  │
  ├─ correctAnswer = verb.conjugations[tense][subject]
  │
  └─▶ pickDistractors(verb, tense, subject, allVerbs, random)
        │
        ├─ TIER 1 (unchanged): same-verb, other-subject, same-tense
        │    candidates = SUBJECTS - subject → verb.conjugations[tense][s]
        │    dedupe via Set, exclude correctAnswer, shuffle, take up to 3
        │
        ├─ TIER 2 (NEW): same-verb, same-subject, other-tense
        │    only runs if chosen.length < DISTRACTOR_COUNT after tier 1
        │    if tense is preterite/imperfect → prioritize the paired tense
        │      (preterite↔imperfect) first, then remaining tenses (D-01)
        │    else (present_indicative/future) → no special order (D-02)
        │    candidates = TENSES - tense → verb.conjugations[t][subject]
        │    dedupe via exclude Set (correctAnswer + tier-1 chosen), shuffle
        │    remainder, take up to remaining slots
        │
        └─ TIER 3 (extended): cross-verb, same-subject, same-tense
             only runs if chosen.length < DISTRACTOR_COUNT after tier 1+2
             ownClass = verb.verb.slice(-2)
             pass A: other verbs where v.verb.slice(-2) === ownClass
             pass B: all other verbs (any class) — existing fallback
             both passes dedupe via exclude Set, shuffle each pass
             independently, take up to remaining slots
        │
        ▼
      return chosen  (string[], length === DISTRACTOR_COUNT unless the
                       whole allVerbs pool truly cannot fill it — see
                       Common Pitfalls)
```

Every tier feeds into the *same* running `exclude`/`chosen` state — this is
the existing pattern in tier 1→tier 3 today and must be preserved exactly for
tier 2's insertion (D-06's strict fill-then-fallback depends on it).

### Recommended Project Structure

No new files or folders. Everything stays in the existing two files:

```
src/quiz/
├── engine.ts        # pickDistractors gets the new tier-2 block/helper + tier-3 class-preference pass
└── random.ts         # unchanged — shuffle() reused as-is

__tests__/
└── quiz-engine.test.ts   # extended with new `describe`/`it` blocks for tier 2 and class-preference tier 3
```

### Pattern 1: Tier-2 as a small named helper (recommended shape)

**What:** Extract tier 2's candidate-gathering into its own exported function, mirroring how `sampleTriples`/`buildQuestion`/`pickDistractors` are already separate named exports in this file for independent testability.
**When to use:** This phase — matches CONVENTIONS.md's "small, single-purpose functions... specifically so each can be unit-tested in isolation."
**Example:**
```typescript
// Source: pattern derived from existing src/quiz/engine.ts style (tier 1 inline block, lines 66-72)
import type { Tense } from "../dataset/types";
import { TENSES } from "../dataset/types";

const TENSE_PAIRS: Partial<Record<Tense, Tense>> = {
  preterite: "imperfect",
  imperfect: "preterite",
};

export function pickSameVerbWrongTenseCandidates(
  verb: Verb,
  tense: Tense,
  subject: Subject,
  random: () => number,
): string[] {
  const otherTenses = TENSES.filter((t) => t !== tense);
  const pairedTense = TENSE_PAIRS[tense];
  // D-01: when the question tense is preterite/imperfect, its pair goes first;
  // D-02: otherwise no special ordering (plain shuffle of all other tenses).
  const ordered = pairedTense
    ? [pairedTense, ...shuffle(otherTenses.filter((t) => t !== pairedTense), random)]
    : shuffle(otherTenses, random);
  return [...new Set(ordered.map((t) => verb.conjugations[t][subject]))];
}
```
Then in `pickDistractors`, after the existing tier-1 block, insert:
```typescript
if (chosen.length < DISTRACTOR_COUNT) {
  const exclude = new Set([correctAnswer, ...chosen]);
  const tier2 = pickSameVerbWrongTenseCandidates(verb, tense, subject, random);
  for (const form of tier2) {
    if (chosen.length >= DISTRACTOR_COUNT) break;
    if (exclude.has(form)) continue;
    chosen.push(form);
    exclude.add(form);
  }
}
```
This is a straight structural mirror of the existing tier-3 loop shape (lines 74-86 today), keeping the file's style consistent.

### Pattern 2: Tier-3 class-preference as two ordered passes over the same loop body

**What:** Rather than rewriting the cross-verb loop, split it into two shuffled passes — same-class verbs first, then all other verbs — feeding the identical exclude/dedupe/push logic.
**When to use:** Implementing D-04/D-05.
**Example:**
```typescript
// Source: extends existing src/quiz/engine.ts tier-3 block (lines 74-86)
if (chosen.length < DISTRACTOR_COUNT) {
  const exclude = new Set([correctAnswer, ...chosen]);
  const ownClass = verb.verb.slice(-2);
  const otherVerbs = allVerbs.filter((v) => v.verb !== verb.verb);
  const sameClassVerbs = otherVerbs.filter((v) => v.verb.slice(-2) === ownClass);
  const otherClassVerbs = otherVerbs.filter((v) => v.verb.slice(-2) !== ownClass);
  const orderedForms = [
    ...shuffle(sameClassVerbs, random),
    ...shuffle(otherClassVerbs, random),
  ].map((v) => v.conjugations[tense][subject]);
  for (const form of orderedForms) {
    if (chosen.length >= DISTRACTOR_COUNT) break;
    if (exclude.has(form)) continue;
    chosen.push(form);
    exclude.add(form);
  }
}
```
Note: shuffling verb objects (not raw forms) then mapping to their form preserves per-verb identity through the ordering, which is simpler than shuffling forms directly and matches the existing style of shuffling then mapping.

### Anti-Patterns to Avoid
- **Rewriting `pickDistractors`'s public signature:** CONTEXT.md's Established Patterns section explicitly locks the signature unchanged (`pickDistractors(verb, tense, subject, allVerbs, random)` → `string[]`). Any new helper must be an *internal* addition, not a signature change.
- **Reserving slots per tier ahead of time (e.g. "always 1 from tier 2 if available"):** explicitly rejected by D-06 ("no deliberate tier-mixing/reservation of slots"). Tier 2 only runs at all if tier 1 didn't already fill all 3 slots.
- **Storing conjugation class on the `Verb` type:** explicitly rejected by D-04 — compute via `.slice(-2)` at call time only.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Random shuffling for tier ordering | A new shuffle/sampling utility | Existing `shuffle()` from `src/quiz/random.ts` | Already Fisher-Yates correct, already the project's injectable-random testability seam — a second shuffle implementation would fragment RNG-mocking patterns in tests |
| Dedup/exclude tracking across tiers | A custom "already used" array with `.includes()` | `Set<string>` (`exclude`), exactly as tiers 1 and 3 already do | O(1) lookup, and matches CONVENTIONS.md's documented dedup pattern precisely — deviating would look inconsistent in code review |

**Key insight:** There is nothing here that benefits from a library — the entire feature is ~30 lines of array/Set manipulation over an already-in-memory, already-typed dataset. The main risk isn't reinventing a wheel, it's *diverging in style* from the file's existing three tiers.

## Common Pitfalls

### Pitfall 1: `pôr`'s conjugation class never matches via `.slice(-2)`
**What goes wrong:** `"pôr".slice(-2)` returns `"ôr"` (with circumflex), which will never equal `"ar"`, `"er"`, or `"ir"` — so `pôr` (an irregular verb, present in the 13-verb irregular set) can never benefit from D-05's same-class preference pass. It always falls straight through to the generic "any other verb" pass.
**Why it happens:** `pôr`'s infinitive is a historical contraction (from *poer*) and doesn't follow the regular `-ar`/`-er`/`-ir` ending pattern that `verb.slice(-2)` assumes.
**How to avoid:** This does not violate D-04/D-05 as written (D-05 says "try same class first... before falling back to any other verb" — an empty same-class match set is a legal, silent no-op, not an error) — no special-case code is required. But write an explicit test asserting `pickDistractors` still returns 3 valid choices when the source verb is `pôr` under `irregular_only`/`mixed` mode, so this edge case is locked in as intentional rather than accidentally broken later.
**Warning signs:** If a future refactor adds a "class must have at least N candidates" assertion or throws on an unmatched class, it will break `pôr` specifically — watch for that regression.

### Pitfall 2: Conjugation-form syncretism can shrink tier 1 or tier 2 below 3 real candidates
**What goes wrong:** Portuguese conjugation tables legitimately have identical forms across different subjects (e.g. many `nos`/`voces`/`eles_elas` collisions in irregular verbs) or across tenses in edge-case synthetic data — see the existing test `"distractor dedupe/backfill"` (lines 402-456 of `__tests__/quiz-engine.test.ts`), which already constructs a verb where tier-1 candidates collapse from 5 raw subjects to 2 unique forms.
**Why it happens:** European Portuguese has real syncretism (e.g. `tu`/`ele_ela` regularly differ, but `nos` and `voces`/`eles_elas` can share surface forms in some paradigms) and the `Set`-based dedupe intentionally collapses identical strings.
**How to avoid:** The existing `Set` + `exclude` pattern already handles this correctly for tier 1; the same pattern must carry through unchanged into tier 2's candidate gathering and tier 3's class-preference pass — the risk isn't logic, it's *forgetting* to route tier 2's output through the same running `exclude` set (which would let a tier-2 candidate accidentally duplicate a tier-1 pick).
**Warning signs:** A `4-unique-choices` test failing specifically when using a synthetic verb with heavy conjugation collisions (extend the existing collision fixture in the test file rather than writing a new one from scratch).

### Pitfall 3: `allVerbs` passed to `pickDistractors` is the mode-filtered pool, not the full dataset
**What goes wrong:** Someone implementing/reviewing this phase might assume tier 3's "another verb" fallback always has the full 50-verb dataset to draw from. Tracing the actual call chain: `generate()` computes `eligibleVerbs = verbs.filter(...)` per `verbMode` (line 16-20 of `engine.ts`), then calls `buildQuestion(triple, eligibleVerbs, random)` (line 27), which passes that same filtered array straight into `pickDistractors(verb, ..., allVerbs, random)` (line 52). Under `irregular_only` mode, `allVerbs` is only the 13 irregular verbs, not all 50.
**Why it happens:** `pickDistractors`'s parameter is generically named `allVerbs`, which reads as "the whole dataset" but is actually "whatever pool the caller decided is eligible."
**How to avoid:** No code change needed — 13 verbs is still comfortably enough for tier 3 (worst case: an irregular `"ar"`-class verb like `estar`/`dar` still has 1 same-class sibling, and 12 candidates for the generic fallback pass). But write a dedicated test that calls `pickDistractors` with a small, `irregular_only`-sized verb array (reuse the existing `singleIrregularVerb`/`customVerbs` fixture style already in the test file) to lock in that the 3-slot invariant still holds at this pool size.
**Warning signs:** None currently — this is a "verify, don't fix" pitfall, since 13 verbs across 3 known classes (plus `pôr`'s unmatched class) is never small enough to threaten `DISTRACTOR_COUNT = 3` given `SUBJECTS.length === 6` also feeds tier 1/2 first.

### Pitfall 4: Tier-3 class split leaving one pass with zero candidates
**What goes wrong:** If `sameClassVerbs` (Pattern 2 above) is empty — e.g. exactly the `pôr` case, or a synthetic test fixture with only one verb per class — `shuffle([])` must return `[]` cleanly, not throw or return `undefined`.
**Why it happens:** Edge case at array-length 0/1 boundaries.
**How to avoid:** `shuffle()` (`src/quiz/random.ts`) already handles empty/singleton arrays correctly (`for (let i = result.length - 1; i > 0; i--)` never executes when `length <= 1`) — confirmed by reading the implementation. No defensive code needed, but worth an explicit test with a tiny synthetic verb pool (2-3 verbs, all different classes) to prove the concat-then-iterate pattern in Pattern 2 doesn't choke on an empty `sameClassVerbs` array.
**Warning signs:** A `TypeError` or empty-array unhandled case would only surface with a pathologically small test fixture — not a production risk given the real 50-verb dataset always has multiple verbs per class (20 `ar`, 19 `er`, 10 `ir`, 1 unmatched `ôr`).

## Code Examples

### Existing tier-1 pattern to mirror exactly (read from source, not reconstructed)
```typescript
// Source: src/quiz/engine.ts lines 66-72 (current, unchanged by this phase)
const otherSubjects = SUBJECTS.filter((s) => s !== subject);
const sameVerbCandidates = [
  ...new Set(otherSubjects.map((s) => verb.conjugations[tense][s])),
].filter((form) => form !== correctAnswer);

const shuffledSameVerb = shuffle(sameVerbCandidates, random);
const chosen = shuffledSameVerb.slice(0, DISTRACTOR_COUNT);
```

### Existing tier-3 pattern to extend, not replace
```typescript
// Source: src/quiz/engine.ts lines 74-86 (current — this is the loop shape tier 2 and the
// extended tier 3 should both follow for consistency)
if (chosen.length < DISTRACTOR_COUNT) {
  const exclude = new Set([correctAnswer, ...chosen]);
  const otherVerbForms = allVerbs
    .filter((v) => v.verb !== verb.verb)
    .map((v) => v.conjugations[tense][subject]);
  const shuffledOtherForms = shuffle(otherVerbForms, random);
  for (const form of shuffledOtherForms) {
    if (chosen.length >= DISTRACTOR_COUNT) break;
    if (exclude.has(form)) continue;
    chosen.push(form);
    exclude.add(form);
  }
}
```

### Existing `mockRandom` test helper to reuse for deterministic tier-order assertions
```typescript
// Source: __tests__/quiz-engine.test.ts lines 7-10 (already exists, reuse verbatim)
function mockRandom(sequence: number[]): () => number {
  let i = 0;
  return () => sequence[i++ % sequence.length]!;
}
```
Use this to construct deterministic RNG sequences that force specific tier-2 orderings (e.g. a sequence that always shuffles the preterite/imperfect pair to the front) — the same technique already used in the file's `"shuffle"` test (lines 458-476).

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|---------------|--------|
| 2-tier: same-verb wrong-subject → cross-verb same-subject/tense (no class preference) | 3-tier: same-verb wrong-subject → same-verb wrong-tense (pair-prioritized) → cross-verb same-class-preferred fallback | This phase (v0.3, Phase 14) | Wrong answers become pedagogically meaningful (subject confusion, then tense confusion, then a plausible-looking form from a same-pattern verb) rather than an arbitrary cross-verb form as the first fallback |

**Deprecated/outdated:** None — this is additive, not a replacement of a deprecated pattern.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | The recommended tier-2 extraction as a separate named export (`pickSameVerbWrongTenseCandidates`) is the best structural choice vs. fully inlining into `pickDistractors` | Architecture Patterns, Pattern 1 | Low — CONTEXT.md explicitly leaves this to Claude's Discretion; either shape satisfies the locked decisions, this is a style recommendation only, not a correctness claim |

**If this table is empty:** N/A — one low-risk stylistic assumption logged above; everything else in this research is verified directly by reading `src/quiz/engine.ts`, `src/quiz/types.ts`, `src/quiz/random.ts`, `src/dataset/types.ts`, `src/dataset/verbs.ts`, and `__tests__/quiz-engine.test.ts` in this session.

## Open Questions (RESOLVED)

1. **Exact function name/shape for the tier-2 helper** — RESOLVED
   - What we know: CONTEXT.md explicitly defers this to Claude's Discretion; the codebase convention (CONVENTIONS.md) favors small single-purpose named exports.
   - Resolution: Follow tier-1's inline shape (candidates as a plain array, capped/filled by the caller loop) for consistency — see Pattern 1's example. The plan's Task 1 names the concrete option (`pickSameVerbWrongTenseCandidates`), closing the ambiguity. Non-blocking; any reasonable name satisfies CONTEXT.md's Claude's Discretion note.

## Environment Availability

Skipped — no external dependencies (no new packages, services, or CLIs). This phase is a pure in-repo TypeScript change using already-configured Jest tooling.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest via `jest-expo` preset (`"jest": { "preset": "jest-expo" }` in `package.json`) |
| Config file | `package.json` (`jest` key) — no standalone `jest.config.js` |
| Quick run command | `npx jest __tests__/quiz-engine.test.ts` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DIST-01 | Same-verb wrong-subject preferred (tier 1) | unit | `npx jest __tests__/quiz-engine.test.ts -t "distractor"` | Existing tests already cover; add explicit tier-priority assertion if not already implicit |
| DIST-02 | Same-verb wrong-tense added, preterite/imperfect pair prioritized | unit | `npx jest __tests__/quiz-engine.test.ts -t "tier 2\|wrong-tense"` | New — needs new `it()` blocks |
| DIST-03 | Cross-verb fallback prefers same conjugation class | unit | `npx jest __tests__/quiz-engine.test.ts -t "class\|cross-verb"` | New — needs new `it()` blocks |
| DIST-04 | 4 unique choices / 1 correct answer invariant holds under new strategy | unit | `npx jest __tests__/quiz-engine.test.ts -t "distractor"` | Existing `"distractor: buildQuestion returns 4 distinct choices"` and `"dedupe/backfill"` tests already assert this — extend to force tier-2/tier-3 paths, e.g. across all 4 tenses per D-01/D-02 |
| TEST-04 | All of the above, explicitly | unit | `npm test` | Combination of new + extended existing tests in `__tests__/quiz-engine.test.ts` |

### Sampling Rate
- **Per task commit:** `npx jest __tests__/quiz-engine.test.ts`
- **Per wave merge:** `npm test` (full suite, currently all other test files unaffected by this phase)
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
None — `__tests__/quiz-engine.test.ts` already exists with the exact `mockRandom` helper, `simpleVerbs`/`collidingVerb` fixture patterns, and `describe("buildQuestion / pickDistractors")` block needed to extend for this phase. No new test framework install or shared fixture file required.

## Security Domain

Not applicable / omitted. This phase touches no user input, no network calls, no authentication, no cryptography, and no external contract (`POST /feedback` is untouched — CONTEXT.md confirms `pickDistractors`'s signature and callers are unaffected). ASVS categories are not relevant to a pure client-side distractor-selection algorithm over already-bundled/already-validated data.

## Sources

### Primary (HIGH confidence)
- `src/quiz/engine.ts` (read directly, this session) — current `pickDistractors`, `buildQuestion`, `generate`, `sampleTriples` implementation
- `src/quiz/types.ts` (read directly, this session) — `Triple`, `Question`, `QuizSession`, `GenerateOptions`, `VerbMode`, `InsufficientVerbsError`
- `src/dataset/types.ts` (read directly, this session) — `Tense`, `Subject`, `TENSES`, `SUBJECTS`, `Verb`
- `src/quiz/random.ts` (read directly, this session) — `shuffle()` implementation, confirmed empty/singleton-array safety
- `__tests__/quiz-engine.test.ts` (read directly, this session) — existing test patterns, `mockRandom` helper, fixture styles
- `src/dataset/verbs.ts` (grepped directly, this session) — confirmed 50 verbs, 13 irregular / 37 regular, conjugation-class distribution (20 `ar`, 19 `er`, 10 `ir`, 1 unmatched — `pôr`)
- `.planning/phases/14-smarter-distractor-generation/14-CONTEXT.md` — locked decisions D-01 through D-06
- `.planning/REQUIREMENTS.md` — DIST-01 through DIST-04, TEST-04 exact wording
- `.planning/STATE.md` — phase sequencing/status confirmation (Phase 13 complete, Phase 14 next)

### Secondary (MEDIUM confidence)
None used — all findings verified directly against the actual codebase in this session, no external library research was needed for this phase.

### Tertiary (LOW confidence)
None.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no external packages, verified by reading `package.json`-referenced tooling already in use
- Architecture: HIGH — verified by reading the actual current implementation and tracing the real call chain (`generate` → `buildQuestion` → `pickDistractors`)
- Pitfalls: HIGH — `pôr`'s class-matching edge case, syncretism collision handling, and the mode-filtered `allVerbs` pool were all confirmed by direct inspection/grep of the dataset and source, not inferred

**Research date:** 2026-07-20
**Valid until:** Effectively indefinite for this specific phase (no external ecosystem dependency to go stale) — re-verify only if `src/dataset/verbs.ts` gains/removes verbs before this phase is planned/executed, which would change the exact class-distribution numbers cited above.
