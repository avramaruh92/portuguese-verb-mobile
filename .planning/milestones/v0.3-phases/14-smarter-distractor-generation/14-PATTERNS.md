# Phase 14: Smarter Distractor Generation - Pattern Map

**Mapped:** 2026-07-20
**Files analyzed:** 2 (1 modified source file, 1 modified test file — no new files this phase)
**Analogs found:** 2 / 2 (both analogs are *within the same files being modified* — this phase extends existing patterns rather than adopting patterns from other domains)

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|-----------------|---------------|
| `src/quiz/engine.ts` (`pickDistractors`, modified) | service (pure domain logic) | transform (in-memory array selection) | `src/quiz/engine.ts`'s own existing tier-1/tier-3 blocks (same file, same function) | exact |
| `__tests__/quiz-engine.test.ts` (extended, not new) | test | request-response (function-in/array-out unit tests) | `__tests__/quiz-engine.test.ts`'s own existing `describe("buildQuestion / pickDistractors")` block | exact |

No files are created from scratch. Both files already exist and already contain the exact pattern shape this phase extends — the "closest analog" for each is the file's own current content, one function/block over.

## Pattern Assignments

### `src/quiz/engine.ts` — `pickDistractors()` (service, transform)

**Analog:** the function's own current tier-1 (lines 66-72) and tier-3 (lines 74-86) blocks — read directly this session, current as of Phase 14 planning.

**Imports pattern** (lines 1-6, unchanged — no new imports needed beyond what's already present):
```typescript
import type { Verb, Tense, Subject } from "../dataset/types";
import { SUBJECTS } from "../dataset/types";
import { verbs as localVerbs } from "../dataset/verbs";
import { shuffle } from "./random";
import type { GenerateOptions, Question, QuizSession, Triple } from "./types";
import { InsufficientVerbsError } from "./types";
```
Note: `TENSES` is not currently imported in this file (only `SUBJECTS` is) — tier 2 will need to add `import { SUBJECTS, TENSES } from "../dataset/types";` to the existing type-only + value import line.

**Core pattern — tier 1 (unchanged, do not touch)** (lines 66-72):
```typescript
const otherSubjects = SUBJECTS.filter((s) => s !== subject);
const sameVerbCandidates = [
  ...new Set(otherSubjects.map((s) => verb.conjugations[tense][s])),
].filter((form) => form !== correctAnswer);

const shuffledSameVerb = shuffle(sameVerbCandidates, random);
const chosen = shuffledSameVerb.slice(0, DISTRACTOR_COUNT);
```

**Core pattern — tier 3 fallback loop to mirror for the new tier 2, and to extend with class-preference** (lines 74-86):
```typescript
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
This is the exact loop shape (guard on `chosen.length < DISTRACTOR_COUNT`, build an `exclude` Set seeded with `correctAnswer` + already-`chosen`, shuffle candidates, `for`-loop with a `break`/`continue`/push/add body) that both the new tier 2 insertion and the extended tier-3 class-preference pass must reuse verbatim. This is the file's one reusable "fill a tier" idiom — RESEARCH.md's Pattern 1 and Pattern 2 are direct copies of this shape with different candidate-gathering logic swapped in.

**Function signature convention (do not change):**
```typescript
export function pickDistractors(
  verb: Verb,
  tense: Tense,
  subject: Subject,
  allVerbs: readonly Verb[],
  random: () => number,
): string[] {
```
Locked by CONTEXT.md — any new tier-2 helper must be an *internal* addition (either inlined into this function body or a new small named export called from within it), never a change to this signature or its callers (`buildQuestion`, line 52).

**Small-single-purpose-function convention** (module-level style, applies if extracting tier 2 as its own export): `sampleTriples` (lines 31-40) and `buildQuestion` (lines 42-55) are the file's existing examples of narrow, independently-testable named exports — each takes explicit params (no hidden closures over outer state besides constants), returns a plain value, and is called from exactly one place (`generate`/`buildQuestion` respectively). A new `pickSameVerbWrongTenseCandidates`-style helper should match this shape: `(verb, tense, subject, random) => string[]`, pure, no side effects, callable in isolation from a test.

**Module constant convention:**
```typescript
const QUESTIONS_PER_SESSION = 10;
const DISTRACTOR_COUNT = 3;
```
(lines 8-9) — `SCREAMING_SNAKE_CASE` module-level constants; a `TENSE_PAIRS` lookup (per RESEARCH.md's Pattern 1) would follow this same top-of-file placement, immediately after `DISTRACTOR_COUNT`.

---

### `__tests__/quiz-engine.test.ts` — `describe("buildQuestion / pickDistractors")` (test, request-response)

**Analog:** the block's own existing fixtures and assertions (lines 311-478) — read directly this session.

**`mockRandom` helper (reuse verbatim, already imported/defined at top of file)** (lines 7-10):
```typescript
function mockRandom(sequence: number[]): () => number {
  let i = 0;
  return () => sequence[i++ % sequence.length]!;
}
```

**Fixture pattern — plain `Verb[]` array literals, one per verb, full 4-tense × 6-subject conjugation table** (lines 312-391, `simpleVerbs`): two regular verbs (`falar`, `comer`), both `-ar`/`-er` class, used as the base pool for most `pickDistractors`/`buildQuestion` tests. New tier-2 tests (preterite/imperfect pair prioritization, same-subject/other-tense candidates) and new tier-3 tests (conjugation-class preference, the `pôr` no-class-match edge case, the `irregular_only`-sized 13-verb pool) should follow this exact literal-object fixture shape — add new verb fixtures (e.g. a synthetic `-ir` verb, or reuse/extend `pôr`'s real conjugations from `src/dataset/verbs.ts` if a realistic irregular fixture is preferred over a synthetic one) rather than inventing a different fixture style.

**Synthetic collision fixture pattern — for forcing dedupe/backfill through a specific tier** (lines 406-444, `collidingVerb`): a verb whose forms are deliberately set to short placeholder strings (`"formaX"`, `"formaY"`, `"x"`) so exact tier collapse is inspectable. This is the pattern to reuse for testing D-01/D-02's preterite/imperfect prioritization deterministically and for testing tier-3's same-class-vs-other-class split — construct verbs whose conjugations are simple, distinguishable literals rather than realistic Portuguese forms, so assertions can check exact string identity/tier provenance.

**Assertion pattern — invariant check** (lines 393-400, 453-456):
```typescript
expect(question.choices).toHaveLength(4);
expect(new Set(question.choices).size).toBe(4);
expect(question.choices).toContain(question.correctAnswer);
```
and
```typescript
expect(distractors).toHaveLength(3);
expect(new Set(distractors).size).toBe(3);
expect(distractors).not.toContain("colidoCorrect");
```
This is the exact DIST-04 (4-unique/1-correct) invariant assertion shape to reuse for every new test case across all three tiers and all four tenses, per TEST-04's requirement.

**Deterministic-ordering assertion pattern** (lines 458-470, using `mockRandom` with hand-picked sequences to force a specific shuffle outcome, then asserting on `.indexOf`/`.toEqual`): the pattern to reuse for asserting D-01's preterite↔imperfect pair goes first in tier-2 ordering — construct a `mockRandom` sequence, call `pickDistractors`/`buildQuestion`, and assert the resulting order/composition rather than just length.

**`it()` naming convention:** `"distractor: <what it proves>"`, `"distractor dedupe/backfill: <what it proves>"`, `"shuffle: <what it proves>"` — a `"<tier-prefix>: <behavior>"` label style. New tests should follow suit, e.g. `"tier 2: prioritizes preterite/imperfect pair when question tense is preterite"`, `"tier 3: prefers same conjugation class before falling back to any verb"`, `"tier 3: pôr (unmatched class) still produces 3 valid choices"`.

---

## Shared Patterns

### Exclude-Set + shuffle + capped-loop tier-fill idiom
**Source:** `src/quiz/engine.ts` lines 74-86 (current tier-3 block)
**Apply to:** the new tier-2 block/helper, and the extended tier-3 class-preference pass
```typescript
if (chosen.length < DISTRACTOR_COUNT) {
  const exclude = new Set([correctAnswer, ...chosen]);
  // ... gather + shuffle candidates specific to this tier ...
  for (const form of shuffledCandidates) {
    if (chosen.length >= DISTRACTOR_COUNT) break;
    if (exclude.has(form)) continue;
    chosen.push(form);
    exclude.add(form);
  }
}
```
This single idiom is the load-bearing pattern for the entire phase — D-06's "strict fill-then-fallback" and DIST-04's uniqueness invariant both depend on every tier routing through this exact guard/exclude/shuffle/loop shape with a running `chosen`/`exclude` state carried across tiers (not reset per tier).

### Injectable-random testability seam
**Source:** `src/quiz/random.ts` (`shuffle<T>(items, random)`), consumed throughout `src/quiz/engine.ts`
**Apply to:** any new tier-2 candidate-ordering logic
```typescript
export function shuffle<T>(items: readonly T[], random: () => number): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j]!, result[i]!];
  }
  return result;
}
```
Already null/empty-array safe (loop body never runs when `length <= 1`) — no defensive wrapping needed when calling with a possibly-empty candidate array (e.g. `sameClassVerbs` when the source verb is `pôr`).

### `noUncheckedIndexedAccess`-safe indexing
**Source:** `src/quiz/random.ts` line 6, `mockRandom` in `__tests__/quiz-engine.test.ts` line 9
**Apply to:** any new indexing into arrays (e.g. `TENSE_PAIRS[tense]` lookups, `sequence[i++ % sequence.length]`)
```typescript
[result[i], result[j]] = [result[j]!, result[i]!];
// noUncheckedIndexedAccess-safe: i and j are always valid indices by the loop invariant
```
Use a `!` with an explanatory comment when the invariant is provably safe (as here), or `?? fallback` when a value may legitimately be absent (e.g. `TENSE_PAIRS[tense]` for `present_indicative`/`future`, which is intentionally `undefined` — already typed as `Partial<Record<Tense, Tense>>` in RESEARCH.md's Pattern 1, so no `!` needed there, just an `if (pairedTense)` branch).

## No Analog Found

None. Every piece of this phase (tier-fill idiom, fixture style, assertion style, module-constant style, function-export style) has a direct, current analog inside the same two files being modified — no cross-domain pattern borrowing is needed, and no file in this phase lacks a close match.

## Metadata

**Analog search scope:** `src/quiz/engine.ts`, `src/quiz/random.ts`, `src/dataset/types.ts`, `__tests__/quiz-engine.test.ts` (all read directly this session; no broader codebase search was needed since this phase is a self-contained single-function refactor with both source and test analogs living in the exact two files being modified)
**Files scanned:** 4
**Pattern extraction date:** 2026-07-20
