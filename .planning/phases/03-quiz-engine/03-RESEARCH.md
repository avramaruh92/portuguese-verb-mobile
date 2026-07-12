# Phase 3: Quiz Engine - Research

**Researched:** 2026-07-12
**Domain:** Pure TypeScript logic — deterministic random sampling, Fisher-Yates shuffle, injectable RNG, Jest unit testing
**Confidence:** HIGH

## Summary

Phase 3 needs no new dependencies and no external API research — it is pure TypeScript logic operating entirely on the Phase 2 dataset already in the repo (`src/dataset/types.ts`, `src/dataset/verbs.ts`). Every design question CONTEXT.md left to discretion (RNG injection pattern, unique-sampling algorithm, shuffle implementation, test structure, module location) has a well-established, simple, textbook answer that requires no library: an injectable `random: () => number` parameter threaded through a Fisher-Yates shuffle, used both to shuffle-then-take unique triples and to shuffle answer-choice order. `zod` (already installed) is optional here — the engine consumes already-validated, statically-typed data and does not need runtime schema checks, unlike Phase 2's dataset loader.

The main engineering risk is not "what library" but "getting the sampling/backfill/uniqueness logic exactly right" per D-01 through D-10, and writing tests that assert exact deterministic output under a scripted mock RNG rather than statistical (run N times, check distribution) tests. This research documents the standard shuffle-then-take pattern, the mock-RNG testing pattern Jest supports natively, and a concrete recommended module layout (`src/quiz/`) consistent with `src/dataset/`.

**Primary recommendation:** Build `src/quiz/engine.ts` (generation) and `src/quiz/scoring.ts` (scoring) as pure functions with an injected `random: () => number` (default `Math.random`), using a single shared Fisher-Yates `shuffle<T>(arr, random)` utility in `src/quiz/random.ts`. No new npm packages required.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Triple filtering (tense + irregular toggle) | Domain logic (`src/quiz/`) | — | Pure function over in-memory dataset array; no I/O, no framework |
| Unique-triple sampling (10 questions) | Domain logic (`src/quiz/`) | — | Deterministic pure function, injectable RNG per D-09 |
| Distractor selection + shuffle | Domain logic (`src/quiz/`) | — | D-01–D-04 scope this inside the engine, not the UI layer |
| Scoring | Domain logic (`src/quiz/`) | — | D-10: pure `score(session, answers)` function |
| Insufficient-pool error signaling | Domain logic (`src/quiz/`) | UI (Phase 4 consumes) | Engine throws typed error; UI decides how to render it (D-08) |
| Session/question state during play | Zustand (`src/store/useQuizStore.ts`) | — | Out of scope this phase — Phase 4 wires engine output into the store |
| Test execution | Jest (`jest-expo` preset) | — | Already configured project-wide; no new test tooling needed |

## Standard Stack

### Core
No new libraries required. This phase uses only:

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|---------------|
| TypeScript | `~6.0.3` (already installed) | Types for `Question`, `QuizSession`, `GenerateOptions`, error class | Already locked project-wide `[VERIFIED: package.json]` |
| Jest via `jest-expo` | `~57.0.1` (already installed) | Test runner/preset | Already configured, `dataset.test.ts` is the working analog `[VERIFIED: package.json, __tests__/dataset.test.ts]` |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `zod` | `^4.4.3` (already installed) | Optional — NOT recommended for this phase | The engine's inputs (dataset, `GenerateOptions`) are internal, statically typed, and already validated at the dataset layer (Phase 2's `validate.ts`). Adding a Zod schema here would duplicate validation with no new attack surface to guard (no external/untrusted input reaches this module). Skip it — use TypeScript types only. |

### Alternatives Considered
| Standard approach | Alternative | Tradeoff |
|---|---|---|
| Fisher-Yates shuffle-then-take-N | Reservoir sampling (Algorithm R) | Reservoir sampling is designed for streams of unknown/unbounded length and needs `O(pool)` random calls either way for this pool size (≤1200 triples); Fisher-Yates shuffle-then-slice is simpler, more idiomatic in JS/TS, and easier to unit-test deterministically with a scripted mock RNG. CONTEXT.md explicitly leaves this as discretion — shuffle-then-take is the recommended choice. |
| Injected `random: () => number` closure param | A seedable PRNG library (`seedrandom`, `pure-rand`) | D-09 explicitly only requires "a mock RNG" for deterministic tests, not a statistically-robust PRNG algorithm — a plain injectable function is sufficient and needs zero new dependencies. Only reach for `pure-rand`/`seedrandom` if a future phase needs seed-reproducible *production* randomness (e.g. daily quiz seed) — not needed here. |
| Manual dedupe via `Set<string>` keyed on `${verb}|${tense}|${subject}` | Nested `Map` structures | A single string-keyed `Set` is simplest for D-06's uniqueness check across ≤1200 possible triples; no measurable perf difference at this scale. |

**Installation:** None — no new packages.

**Version verification:** Not applicable; no new packages introduced. Existing versions confirmed via `package.json` read directly `[VERIFIED: package.json]`.

## Package Legitimacy Audit

Not applicable — this phase introduces zero new external packages. Skipping the slopcheck/registry gate; nothing to audit.

## Architecture Patterns

### System Architecture Diagram

```
Phase 2 dataset (src/dataset/verbs.ts, types.ts)
        │
        ▼
┌─────────────────────────────┐
│ src/quiz/engine.ts           │
│                               │
│  filterPool(verbs, options)  │──▶ eligible (verb,tense,subject) triples
│        │                     │
│        ▼                     │
│  sampleTriples(pool, 10,     │──▶ throws InsufficientVerbsError if pool < 10
│    random)                   │    (D-08)
│        │                     │
│        ▼                     │
│  buildQuestion(triple,       │──▶ picks 3 distractors (D-02/D-03),
│    allVerbs, random)         │    shuffles 4 choices (D-04)
│        │                     │
│        ▼                     │
│  generate(options, random)   │──▶ QuizSession { questions: Question[10] }
└─────────────────────────────┘
        │
        ▼ (session + user answers)
┌─────────────────────────────┐
│ src/quiz/scoring.ts           │
│  score(session, answers)     │──▶ { correct, total } (D-10)
└─────────────────────────────┘
        │
        ▼
Phase 4: UI event handlers + useQuizStore (NOT this phase)
```

Data flow: dataset → filter → sample unique triples → build full 4-choice questions → assemble session → (later, Phase 4) collect answers → score. Every stage is a pure function; no I/O, no React, no Zustand imports anywhere in `src/quiz/`.

### Recommended Project Structure
```
src/quiz/
├── types.ts          # Question, QuizSession, GenerateOptions, InsufficientVerbsError
├── random.ts          # shuffle<T>(arr, random), pickN helper(s) — shared RNG-injection utility
├── engine.ts           # filterPool, sampleTriples, buildQuestion (distractors+shuffle), generate()
└── scoring.ts          # score(session, answers)

__tests__/
├── quiz-engine.test.ts   # filtering, sampling uniqueness, distractor dedupe/backfill, insufficient-pool error
└── quiz-scoring.test.ts  # score() correctness
```
This mirrors `src/dataset/{types,verbs,validate}.ts` + `__tests__/dataset.test.ts` (Phase 2's established pattern) and Phase 1 D-02's `src/<domain>/` convention `[CITED: .planning/phases/01-scaffold/01-CONTEXT.md]`.

### Pattern 1: Injectable Fisher-Yates shuffle
**What:** A shuffle utility that takes a `random: () => number` function instead of calling `Math.random()` internally, so tests can inject a scripted sequence of return values for fully deterministic assertions.
**When to use:** Any place D-04/D-09 require randomized-but-testable ordering — answer choice shuffle and triple sampling.
**Example:**
```typescript
// Standard Fisher-Yates (Durstenfeld variant), RNG injected — textbook pattern, no external source needed
export function shuffle<T>(items: readonly T[], random: () => number = Math.random): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j]!, result[i]!]; // noUncheckedIndexedAccess-safe via `!` (bounds proven by loop invariant)
  }
  return result;
}
```
Note on `noUncheckedIndexedAccess: true` (already enabled per CONTEXT.md code_context): array indexing returns `T | undefined` under this compiler flag. The swap above is safe by construction (`i`, `j` are always valid indices), but TypeScript cannot prove that — use non-null assertions (`!`) with a comment, or destructure via a small helper. This is the single most common strict-mode friction point in this phase; flag it for the planner.

### Pattern 2: Shuffle-then-take for unique sampling
**What:** To sample N unique triples from a filtered pool without bias, shuffle the entire eligible pool once, then take the first N.
**When to use:** D-06/D-07's uniqueness requirement (unique `(verb,tense,subject)`, verb repeats OK) — the pool is already deduplicated by construction (each triple in the pool appears once, since it's derived from `verbs × tenses × subjects` with no duplicates), so shuffle-then-slice trivially guarantees no repeats without an extra `Set` check *for the sampling stage itself*. A `Set`-based assertion in tests (D-06 says "implement as a Set-based uniqueness check") is still worth adding defensively/for test clarity, but the shuffle-then-take approach makes violating uniqueness structurally impossible as long as the pool itself has no duplicate entries.
**Example:**
```typescript
// Pool is built once as flat list of unique {verb, tense, subject} triples (no dupes by construction)
function sampleTriples(pool: readonly Triple[], count: number, random: () => number): Triple[] {
  if (pool.length < count) {
    throw new InsufficientVerbsError(pool.length, count);
  }
  return shuffle(pool, random).slice(0, count);
}
```

### Pattern 3: Distractor generation with dedupe + cross-verb backfill (D-02/D-03)
**What:** Collect the other 5 subject-forms of the same verb+tense, dedupe to unique strings excluding the correct answer, take up to 3; if fewer than 3 remain, backfill from other verbs' correct forms for the same tense+subject (also deduped against already-chosen forms and the correct answer).
**When to use:** Building each `Question`'s 4 choices.
**Example:**
```typescript
function pickDistractors(
  verb: Verb, tense: Tense, subject: Subject, allVerbs: readonly Verb[], random: () => number,
): string[] {
  const correct = verb.conjugations[tense][subject];
  const sameVerbPool = SUBJECTS.filter((s) => s !== subject)
    .map((s) => verb.conjugations[tense][s]);
  const uniqueSameVerb = shuffle([...new Set(sameVerbPool)].filter((f) => f !== correct), random);

  const distractors = uniqueSameVerb.slice(0, 3);
  if (distractors.length < 3) {
    const need = 3 - distractors.length;
    const exclude = new Set([correct, ...distractors]);
    const otherVerbForms = shuffle(
      allVerbs
        .filter((v) => v.verb !== verb.verb)
        .map((v) => v.conjugations[tense][subject])
        .filter((f) => !exclude.has(f)),
      random,
    );
    // dedupe candidates against each other too, in case multiple other verbs share a form
    for (const form of otherVerbForms) {
      if (distractors.length >= 3) break;
      if (!exclude.has(form)) {
        distractors.push(form);
        exclude.add(form);
      }
    }
  }
  return distractors; // exactly 3 by dataset-size guarantee (D-03); no further fallback needed
}
```
This is a textbook set-dedupe + fallback pattern — no citation needed beyond the D-02/D-03 spec itself, which is fully deterministic given the dataset's guaranteed shape (every verb has all 6 subject forms, per Phase 2).

### Anti-Patterns to Avoid
- **Calling `Math.random()` directly inside `generate()`/`shuffle()`/distractor logic:** Breaks D-09's testability requirement — always thread the injected `random` parameter through every call site that needs randomness, including nested helper functions like `pickDistractors`.
- **Statistical/flaky tests ("run 1000 times, assert distribution looks uniform"):** CONTEXT.md D-09 explicitly calls this out as unnecessary — inject a scripted mock RNG (e.g. a function returning a fixed sequence, or always `0`/`0.999`) and assert exact deterministic output instead.
- **Re-validating the dataset with Zod inside the engine:** Phase 2 already validates dataset shape at build/test time (`validate.ts`); re-parsing with Zod on every `generate()` call adds runtime cost and a redundant dependency for data that TypeScript already guarantees is well-formed by the time it reaches this module.
- **Restricting sampling to distinct verbs:** D-07 explicitly allows verb repeats — do not add a "one question per verb" constraint; it isn't required and would break under narrow single-tense filters.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|--------------|-----|
| Random shuffling | A biased "sort by `Math.random() - 0.5`" comparator | Fisher-Yates (`shuffle()` above) | `array.sort(() => Math.random() - 0.5)` is a well-known anti-pattern producing statistically biased shuffles (V8 and other engines' sort implementations aren't guaranteed-stable-random-comparator-safe) — Fisher-Yates is the correct, unbiased, O(n) standard algorithm and is barely more code. |
| Seeded/mock RNG for tests | A real seeded-PRNG library | A plain scripted closure, e.g. `let calls = [0.1, 0.9, 0.5]; let i = 0; const random = () => calls[i++]!;` | D-09 only needs deterministic, not cryptographically/statistically robust randomness — Jest's built-in ability to inject arbitrary functions makes a library unnecessary. |
| Unique-sampling / dedupe | Custom probabilistic "keep rejecting duplicates" loop | Shuffle-then-take over a pool built with zero duplicates by construction (Pattern 2) | A pool built as the flat cross product of filtered verbs × tenses × subjects has no duplicate triples to begin with, so a reject-and-retry loop is solving a problem that doesn't exist here — it would also risk infinite loops if implemented naively against a near-exhausted pool. |

**Key insight:** Every "hand-roll risk" in this phase is really a *correctness* risk (bias, flakiness, off-by-one dedupe bugs), not a "should I use a library" risk — there is no good reason to add a dependency for shuffling ≤1200 short arrays in Node/Hermes. The discipline needed is: always thread `random` through nested calls, and always build the sampling pool so it's dedupe-by-construction rather than dedupe-by-filtering.

## Common Pitfalls

### Pitfall 1: Non-deterministic tests despite "injectable RNG"
**What goes wrong:** Implementer injects `random` into the top-level `generate()` call but a nested helper (e.g. the shuffle inside `pickDistractors`, or the final 4-choice shuffle) falls back to `Math.random()` default internally, silently reintroducing non-determinism into "deterministic" tests.
**Why it happens:** Default parameters (`random: () => number = Math.random`) are convenient for production call sites but easy to forget to thread through when refactoring/extracting helper functions.
**How to avoid:** Only the outermost `generate()` should have a default value for `random`; every internal/nested function should require `random` as a mandatory parameter (no default) so a missed thread-through is a TypeScript compile error, not a silent runtime bug.
**Warning signs:** Tests pass locally but fail intermittently in CI, or two consecutive test runs with the "same" mock RNG produce different assertions.

### Pitfall 2: `noUncheckedIndexedAccess` strict-mode friction in swap/index logic
**What goes wrong:** Fisher-Yates swap (`[a[i], a[j]] = [a[j], a[i]]`) and any `pool[randomIndex]` access fails to typecheck under `noUncheckedIndexedAccess: true` (already enabled per CONTEXT.md) because indexed access returns `T | undefined`.
**Why it happens:** The compiler can't prove loop-bound-derived indices are always in range.
**How to avoid:** Use non-null assertions (`!`) at swap/index sites where correctness is provable by the loop invariant, with a short comment explaining why it's safe — don't disable `noUncheckedIndexedAccess` or scatter unchecked `as` casts elsewhere.
**Warning signs:** `tsc --noEmit` failures on array index expressions inside the shuffle/sampling code.

### Pitfall 3: Off-by-one / wrong-pool-size in the D-08 insufficient-pool check
**What goes wrong:** Checking `pool.length < count` against the *unfiltered* dataset, or against a pool that still contains duplicate triples, produces a false "sufficient" result that then fails deeper in sampling — or a false "insufficient" that unnecessarily throws.
**Why it happens:** Conflating "number of matching verbs" with "number of unique eligible (verb,tense,subject) triples" — D-08's threshold is explicitly about triples, not verbs (CONTEXT.md gives the example: "even a single-tense filter with irregulars off yields ~228 triples (38 regular verbs × 6 subjects)").
**How to avoid:** Build the triple pool first (flatten filtered verbs × selected tenses × all 6 subjects), then check `pool.length < 10` on that flattened, already-unique list — this is the exact quantity D-08 refers to.
**Warning signs:** `InsufficientVerbsError` thrown/not-thrown at the wrong filter combinations; test against the "single tense, irregulars off" boundary case from CONTEXT.md's own example (~228 triples, should NOT throw) plus a synthetic tiny-pool case (should throw).

### Pitfall 4: Distractor pool assumed non-empty for "other verbs" backfill
**What goes wrong:** In extremely narrow scenarios (not expected with the full 50-verb dataset, but worth defensive testing) the "other verbs' correct forms for the same tense+subject" backfill pool could theoretically be empty or entirely duplicate the same string, leaving fewer than 3 distinct distractors.
**Why it happens:** D-03's guarantee ("this guarantees exactly 3 distinct wrong answers... every time") is a claim about the *current 50-verb, 4-tense, 6-subject dataset scale*, not a mathematical certainty for arbitrary future dataset sizes.
**How to avoid:** Write a unit test asserting the invariant `distractors.length === 3 && new Set(distractors).size === 3` for every question in a full, unfiltered `generate()` call (exercising the real dataset), so a future dataset edit that breaks the guarantee is caught immediately rather than silently producing a malformed question.
**Warning signs:** A future phase adds/edits verbs and this invariant test starts failing — treat that as a real signal, not a flaky test.

## Code Examples

### Full-session generation skeleton
```typescript
// src/quiz/engine.ts — illustrative skeleton combining patterns above
export interface GenerateOptions {
  tenses: Tense[];          // one or more selected tenses (SETUP-01)
  includeIrregular: boolean; // SETUP-02 toggle
}

export function generate(
  options: GenerateOptions,
  random: () => number = Math.random,
): QuizSession {
  const eligibleVerbs = verbs.filter((v) => options.includeIrregular || !v.isIrregular);
  const pool: Triple[] = eligibleVerbs.flatMap((v) =>
    options.tenses.flatMap((tense) => SUBJECTS.map((subject) => ({ verb: v.verb, tense, subject }))),
  );

  const sampled = sampleTriples(pool, 10, random); // throws InsufficientVerbsError per D-08
  const questions = sampled.map((triple) => buildQuestion(triple, eligibleVerbs, random));
  return { questions };
}
```

### Scoring
```typescript
// src/quiz/scoring.ts
export function score(
  session: QuizSession,
  answers: readonly (string | null)[],
): { correct: number; total: number } {
  const total = session.questions.length;
  const correct = session.questions.reduce(
    (acc, q, i) => acc + (answers[i] === q.correctAnswer ? 1 : 0),
    0,
  );
  return { correct, total };
}
```

### Test pattern — scripted mock RNG (Jest, following `dataset.test.ts` conventions)
```typescript
// __tests__/quiz-engine.test.ts
function mockRandom(sequence: number[]): () => number {
  let i = 0;
  return () => sequence[i++ % sequence.length]!;
}

describe("generate", () => {
  it("throws InsufficientVerbsError when filtered pool has fewer than 10 triples", () => {
    expect(() =>
      generate({ tenses: ["future"], includeIrregular: false }, mockRandom([0])),
    ).not.toThrow(); // sanity: real dataset always has enough — construct a synthetic tiny pool test separately
  });

  it("never produces a duplicate (verb,tense,subject) triple in a session", () => {
    const session = generate({ tenses: ["present_indicative", "preterite"], includeIrregular: true }, Math.random);
    const keys = session.questions.map((q) => `${q.verb}|${q.tense}|${q.subject}`);
    expect(new Set(keys).size).toBe(keys.length);
  });
});
```
This follows the exact `describe`/`it`/`expect` style already established in `__tests__/dataset.test.ts` `[VERIFIED: __tests__/dataset.test.ts]` — no new test conventions needed. Note the second example deliberately uses real `Math.random` for a *structural* invariant test (uniqueness is guaranteed by construction regardless of RNG, per Pattern 2) — reserve scripted mock RNGs for tests asserting *exact* output (which triples were picked, which distractor slot the correct answer landed in), per D-09.

## State of the Art

Not applicable — this is stable, decades-old algorithmic territory (Fisher-Yates dates to 1938/1964 Durstenfeld variant); no meaningful "old vs current approach" table applies. The one relevant modern note: `noUncheckedIndexedAccess` (a TypeScript strict-mode flag, already enabled per this project's CLAUDE.md) changes how array-indexing code must be written compared to older non-strict TS codebases — see Pitfall 2.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `zod` is not needed inside `src/quiz/` because inputs are already statically typed/validated at the dataset layer | Standard Stack (Supporting) | Low — if the planner disagrees and wants defensive runtime validation on `GenerateOptions`, adding a small Zod schema later is a trivial, non-breaking addition; does not affect D-01–D-10 compliance either way. |

*(This is the only assumed claim — everything else in this research is either directly verified against files in this repo (`[VERIFIED: ...]`), cited from CONTEXT.md/PROJECT.md (`[CITED: ...]`), or standard/textbook algorithmic knowledge with no external-fact-checking dependency, e.g. Fisher-Yates correctness.)*

## Open Questions

1. **Exact `QuizSession`/`Question` field names beyond what D-01–D-10 specify**
   - What we know: `Question` must carry verb, tense, subject, the learner-facing prompt data implied by QUIZ-01 (though QUIZ-01 itself is Phase 4's concern for *display*), `correctAnswer`, and 4 `choices`.
   - What's unclear: Whether `Question` should also carry translation/subject-label data now (for Phase 4 convenience) or whether Phase 4 re-derives display strings from `verb`/`subject` via the dataset. CONTEXT.md leaves exact type shapes to discretion.
   - Recommendation: Keep `Question` minimal (verb, tense, subject, choices, correctAnswer) since QUIZ-01's display concerns (translation, learner-friendly subject label) are Phase 4's responsibility and can be derived by looking up `verb` in the dataset — avoids duplicating dataset data into every question object. Planner should confirm this minimal-shape choice explicitly as a task-level decision.

## Environment Availability

Skipped — this phase has no external dependencies (pure TypeScript logic, no new packages, no network/service calls, `jest-expo` already configured project-wide).

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest 30.x via `jest-expo` preset `~57.0.1` `[VERIFIED: package.json]` |
| Config file | `package.json` → `"jest": { "preset": "jest-expo" }` (no separate `jest.config.js`) `[VERIFIED: package.json]` |
| Quick run command | `npx jest __tests__/quiz-engine.test.ts __tests__/quiz-scoring.test.ts` |
| Full suite command | `npm test` (runs `jest`, all `__tests__/*.test.ts`) |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|--------------------|--------------|
| QUIZ-04 | Filtering by tense + irregular toggle produces correct eligible pool | unit | `npx jest __tests__/quiz-engine.test.ts -t "filter"` | ❌ Wave 0 |
| QUIZ-04 | Sampling produces exactly 10 questions with no duplicate (verb,tense,subject) triple (D-06/D-07) | unit | `npx jest __tests__/quiz-engine.test.ts -t "duplicate"` | ❌ Wave 0 |
| QUIZ-04 | Insufficient pool throws `InsufficientVerbsError` (D-08) | unit | `npx jest __tests__/quiz-engine.test.ts -t "InsufficientVerbsError"` | ❌ Wave 0 |
| QUIZ-04 | Distractors deduped, backfilled to exactly 3 unique wrong answers (D-02/D-03) | unit | `npx jest __tests__/quiz-engine.test.ts -t "distractor"` | ❌ Wave 0 |
| QUIZ-04 | Correct-answer position fully randomized across calls, deterministic under mock RNG (D-04/D-09) | unit | `npx jest __tests__/quiz-engine.test.ts -t "shuffle"` | ❌ Wave 0 |
| QUIZ-04 | `score()` returns correct `{correct, total}` for known session+answers fixtures (D-10) | unit | `npx jest __tests__/quiz-scoring.test.ts` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npx jest __tests__/quiz-engine.test.ts __tests__/quiz-scoring.test.ts`
- **Per wave merge:** `npm test` (full suite, includes `dataset.test.ts`, `useQuizStore.test.ts`, `smoke.test.ts`)
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `__tests__/quiz-engine.test.ts` — covers QUIZ-04 (filtering, sampling, distractors, D-08 error)
- [ ] `__tests__/quiz-scoring.test.ts` — covers QUIZ-04 (score calculation)
- [ ] No new framework/config install needed — `jest-expo` already covers this; no shared fixtures beyond importing `verbs`/`types` from `src/dataset/` (already available)

## Security Domain

Not applicable to this phase. No user input, no network calls, no auth, no cryptography, no persistence — pure in-memory computation over a static local dataset. `security_enforcement` config not checked further since there is no attack surface introduced (no ASVS categories apply: no auth, no session, no external input crossing a trust boundary — `GenerateOptions` originates from Phase 4's UI within the same trusted app process, not from network/user-supplied strings requiring V5 input validation here).

## Sources

### Primary (HIGH confidence)
- `/Users/avi/portuguese-verb/portuguese-verb-mobile/.planning/phases/03-quiz-engine/03-CONTEXT.md` — locked D-01 through D-10 decisions (this phase's authoritative spec)
- `/Users/avi/portuguese-verb/portuguese-verb-mobile/src/dataset/types.ts`, `verbs.ts`, `validate.ts` — Phase 2 output this phase consumes directly
- `/Users/avi/portuguese-verb/portuguese-verb-mobile/__tests__/dataset.test.ts` — established Jest test-style analog
- `/Users/avi/portuguese-verb/portuguese-verb-mobile/package.json` — confirmed installed package versions, `jest` config, `noUncheckedIndexedAccess`/strict-mode context via CLAUDE.md

### Secondary (MEDIUM confidence)
- Fisher-Yates (Durstenfeld) shuffle algorithm — standard, well-documented CS algorithm; no single canonical URL needed, cross-checked against training knowledge as uncontested textbook material (not a fast-moving library API subject to staleness).

### Tertiary (LOW confidence)
- None — this phase had no claims requiring unverified/single-source web research; no new packages, no fast-moving API surface.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new dependencies; all versions read directly from `package.json`
- Architecture: HIGH — directly derived from locked CONTEXT.md decisions (D-01–D-10) plus established Phase 1/2 conventions
- Pitfalls: HIGH — derived from concrete strict-mode config (`noUncheckedIndexedAccess`) already in this repo and the explicit edge cases CONTEXT.md itself calls out (D-03, D-08)

**Research date:** 2026-07-12
**Valid until:** Not time-sensitive — pure algorithmic content with no library-version dependency; effectively valid indefinitely for this phase's scope. Re-research only if CONTEXT.md's D-01–D-10 decisions change.
