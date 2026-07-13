# Phase 3: Quiz Engine - Pattern Map

**Mapped:** 2026-07-12
**Files analyzed:** 6 (4 new source files, 2 new test files)
**Analogs found:** 6 / 6 (all role-match or better; Phase 2's `src/dataset/` is a near-exact structural analog for the whole module)

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|-----------------|----------------|
| `src/quiz/types.ts` | model (pure types) | transform | `src/dataset/types.ts` | exact |
| `src/quiz/random.ts` | utility | transform | `src/dataset/types.ts` (only for module-header style; no direct algorithmic analog exists in repo) | role-match |
| `src/quiz/engine.ts` | service (pure domain logic) | transform / batch | `src/dataset/validate.ts` (pure function module, `Verb`/`Tense`/`Subject` consumer) | role-match |
| `src/quiz/scoring.ts` | service (pure domain logic) | transform | `src/dataset/validate.ts` (small single-purpose pure-function module) | role-match |
| `__tests__/quiz-engine.test.ts` | test | batch (assertions over generated data) | `__tests__/dataset.test.ts` | exact |
| `__tests__/quiz-scoring.test.ts` | test | batch (assertions over fixtures) | `__tests__/dataset.test.ts` | exact |

No component/controller/middleware files are in scope this phase — the entire deliverable is a framework-free `src/quiz/` domain module plus its unit tests, mirroring Phase 2's `src/dataset/` module exactly. `src/store/useQuizStore.ts` is explicitly NOT modified this phase (Phase 4 concern) and is included below only as a "do not touch, but note its shape" reference.

## Pattern Assignments

### `src/quiz/types.ts` (model, transform)

**Analog:** `src/dataset/types.ts` (full file, 37 lines — read in one pass)

**Full pattern to copy** (`src/dataset/types.ts` lines 1-37):
```typescript
export type Tense =
  | "present_indicative"
  | "preterite"
  | "imperfect"
  | "future";

export type Subject =
  | "eu"
  | "tu"
  | "ele_ela"
  | "nos"
  | "voces"
  | "eles_elas";

export const TENSES: readonly Tense[] = [
  "present_indicative",
  "preterite",
  "imperfect",
  "future",
];

export const SUBJECTS: readonly Subject[] = [
  "eu",
  "tu",
  "ele_ela",
  "nos",
  "voces",
  "eles_elas",
];

export interface Verb {
  verb: string;
  translation: string;
  isIrregular: boolean;
  conjugations: Record<Tense, Record<Subject, string>>;
}
```

**What to copy for `src/quiz/types.ts`:**
- Same "plain interface/type export, no class, no decorators" style — no barrel re-export layer, just direct named exports.
- Import `Tense`, `Subject`, `Verb` from `../dataset/types` (relative import, matching how `src/dataset/verbs.ts` imports `Verb` via `import type { Verb } from "./types";` — see below). Do NOT redeclare `Tense`/`Subject` per CONTEXT.md canonical_refs ("single source of truth this phase imports — no redeclaration").
- Recommended shape per RESEARCH.md's Open Question resolution (minimal `Question`, no denormalized translation/label fields):
  ```typescript
  import type { Tense, Subject } from "../dataset/types";

  export interface Triple {
    verb: string;
    tense: Tense;
    subject: Subject;
  }

  export interface Question extends Triple {
    choices: string[];      // 4 shuffled choices
    correctAnswer: string;
  }

  export interface QuizSession {
    questions: Question[];
  }

  export interface GenerateOptions {
    tenses: Tense[];
    includeIrregular: boolean;
  }

  export class InsufficientVerbsError extends Error {
    constructor(public readonly eligibleCount: number, public readonly required: number) {
      super(`Insufficient eligible questions: ${eligibleCount} available, ${required} required`);
      this.name = "InsufficientVerbsError";
    }
  }
  ```
- Use `readonly` array types on public function signatures where `src/dataset/types.ts` uses `readonly Tense[]` — consistent strictness convention.

---

### `src/quiz/random.ts` (utility, transform)

**Analog:** No direct algorithmic analog exists in the repo (first shuffle/RNG utility in the project) — RESEARCH.md's Pattern 1 code example is the primary source. Structural/style analog is `src/dataset/validate.ts` (small pure-function module, single named export, no class).

**Style to copy from `src/dataset/validate.ts`** (lines 1, 26-43 — module shape: top import, then one or two focused exported functions, no default export):
```typescript
import { z } from "zod";
// ...schema declarations...

export function validateDataset(verbs: unknown[]): {
  valid: boolean;
  errors: string[];
} {
  // ...
}
```

**Core pattern to implement** (from RESEARCH.md, verified textbook Fisher-Yates — treat as the canonical source since no repo analog exists):
```typescript
export function shuffle<T>(items: readonly T[], random: () => number): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j]!, result[i]!]; // noUncheckedIndexedAccess-safe: i,j always valid indices by loop invariant
  }
  return result;
}
```
**Convention note:** `random` has NO default value in this shared utility — only the outermost `generate()` in `engine.ts` should default to `Math.random`, per RESEARCH.md Pitfall 1 (nested helpers must require `random` as mandatory so a missed thread-through is a compile error, not a silent bug).

---

### `src/quiz/engine.ts` (service, transform/batch)

**Analog:** `src/dataset/validate.ts` (structural: pure function module operating on `Verb[]`, no I/O, no classes except the one error type) + `src/dataset/verbs.ts`'s import style for consuming `Verb`.

**Imports pattern** (mirrors `src/dataset/verbs.ts` line 1 and `src/dataset/validate.ts` line 1):
```typescript
import type { Verb, Tense, Subject } from "../dataset/types";
import { SUBJECTS } from "../dataset/types";
import { verbs } from "../dataset/verbs";
import { shuffle } from "./random";
import type { GenerateOptions, Question, QuizSession, Triple } from "./types";
import { InsufficientVerbsError } from "./types";
```
Note the repo's existing convention (seen in `verbs.ts`) of `import type { Verb } from "./types"` for type-only imports — follow this split of `import type` vs value imports (`SUBJECTS`, `verbs`) consistently, since `noUncheckedIndexedAccess`/strict mode projects in this repo already lean on `import type` for type-only symbols.

**Core pattern — pure function, no class, no I/O** (structural precedent: `src/dataset/validate.ts` lines 26-43, `validateDataset` takes data in, returns a plain result object, no side effects):
```typescript
export function generate(
  options: GenerateOptions,
  random: () => number = Math.random,
): QuizSession {
  const eligibleVerbs = verbs.filter((v) => options.includeIrregular || !v.isIrregular);
  const pool: Triple[] = eligibleVerbs.flatMap((v) =>
    options.tenses.flatMap((tense) =>
      SUBJECTS.map((subject) => ({ verb: v.verb, tense, subject })),
    ),
  );
  const sampled = sampleTriples(pool, 10, random);
  const questions = sampled.map((triple) => buildQuestion(triple, eligibleVerbs, random));
  return { questions };
}
```

**Error handling pattern** (matches `src/dataset/types.ts`'s "no defensive re-validation" philosophy — errors are thrown as typed classes, not returned as `{valid, errors}` tuples, since this is an internal-caller-only module per RESEARCH.md's security_enforcement note):
```typescript
function sampleTriples(pool: readonly Triple[], count: number, random: () => number): Triple[] {
  if (pool.length < count) {
    throw new InsufficientVerbsError(pool.length, count);
  }
  return shuffle(pool, random).slice(0, count);
}
```

**Validation pattern:** None needed at runtime (RESEARCH.md explicitly recommends skipping Zod here — Assumption A1 — since inputs are already statically typed and validated at the Phase 2 dataset layer via `src/dataset/validate.ts`). Do not add a `validate.ts` counterpart to `src/quiz/`.

---

### `src/quiz/scoring.ts` (service, transform)

**Analog:** `src/dataset/validate.ts` (same "single small pure function, plain object return type" shape).

**Core pattern** (mirrors `validateDataset`'s signature style: typed params in, plain result object out):
```typescript
import type { QuizSession } from "./types";

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

---

### `__tests__/quiz-engine.test.ts` (test, batch)

**Analog:** `__tests__/dataset.test.ts` (full file, 52 lines — read in one pass)

**Imports pattern** (lines 1-3):
```typescript
import { verbs } from "../src/dataset/verbs";
import { validateDataset } from "../src/dataset/validate";
import { TENSES, SUBJECTS } from "../src/dataset/types";
```
Adapt to:
```typescript
import { generate } from "../src/quiz/engine";
import { score } from "../src/quiz/scoring";
import { InsufficientVerbsError } from "../src/quiz/types";
import { shuffle } from "../src/quiz/random";
```

**Describe/it/expect structure** (lines 5-51, full file is the template):
```typescript
describe("dataset validation", () => {
  it("every verb has the correct shape", () => {
    verbs.forEach((v) => {
      expect(v.verb.length).toBeGreaterThan(0);
      // ...
    });
  });

  it("reports zero shape/completeness errors", () => {
    expect(validateDataset(verbs).errors).toEqual([]);
  });

  it("rejects a verb missing a conjugation cell (negative case)", () => {
    const broken = JSON.parse(JSON.stringify(verbs[0]));
    delete broken.conjugations.future.eles_elas;
    expect(validateDataset([broken]).valid).toBe(false);
  });
});
```
**Conventions to copy:** flat `describe` block per module, one `it` per behavior with a descriptive plain-English name (including "(negative case)" suffix style for error-path tests — reuse for the `InsufficientVerbsError` test), `expect(...).toEqual(...)` / `.toBe(...)` assertions, no `beforeEach`/mocking framework — plain data fixtures declared inline (`JSON.parse(JSON.stringify(...))` for deep-cloning a fixture before mutating it, as seen in the negative-case test).

**Mock RNG pattern** (from RESEARCH.md, use for D-09 deterministic tests; not present in `dataset.test.ts` since that file has no randomness — this is new but follows the same "plain closure, no library" ethos as the rest of the codebase):
```typescript
function mockRandom(sequence: number[]): () => number {
  let i = 0;
  return () => sequence[i++ % sequence.length]!;
}
```

**Structural invariant test pattern** (use real `Math.random`, matching `dataset.test.ts`'s "assert invariant holds across full real dataset" style seen in "has the expected count of seeded verbs with unique infinitives"):
```typescript
it("never produces a duplicate (verb,tense,subject) triple in a session", () => {
  const session = generate({ tenses: ["present_indicative", "preterite"], includeIrregular: true }, Math.random);
  const keys = session.questions.map((q) => `${q.verb}|${q.tense}|${q.subject}`);
  expect(new Set(keys).size).toBe(keys.length);
});
```

---

### `__tests__/quiz-scoring.test.ts` (test, batch)

**Analog:** `__tests__/dataset.test.ts` (same describe/it/expect conventions as above, scaled down to a single-purpose small module — closer in size/scope to how `validateDataset` is tested within `dataset.test.ts`'s "reports zero shape/completeness errors" + negative-case pair).

**Pattern:**
```typescript
import { score } from "../src/quiz/scoring";
import type { QuizSession } from "../src/quiz/types";

describe("score", () => {
  it("counts correct answers against a known session fixture", () => {
    const session: QuizSession = {
      questions: [
        { verb: "falar", tense: "present_indicative", subject: "eu", choices: ["falo", "falas", "fala", "falam"], correctAnswer: "falo" },
        // ...
      ],
    };
    expect(score(session, ["falo", "wrong"])).toEqual({ correct: 1, total: 2 });
  });
});
```

## Shared Patterns

### Pure-function, framework-free domain module (Phase 1 D-02, reinforced by Phase 2)
**Source:** entire `src/dataset/` directory (`types.ts`, `verbs.ts`, `validate.ts`)
**Apply to:** all of `src/quiz/types.ts`, `src/quiz/random.ts`, `src/quiz/engine.ts`, `src/quiz/scoring.ts`
No React, no Zustand, no I/O imports anywhere in `src/quiz/`. Every exported function takes plain typed arguments and returns plain typed values/throws typed errors — no classes except the single `InsufficientVerbsError`.

### `import type` vs value import split
**Source:** `src/dataset/verbs.ts` line 1 (`import type { Verb } from "./types";`)
**Apply to:** all new files importing `Tense`/`Subject`/`Verb`/`Question`/`QuizSession`/`GenerateOptions` — split type-only imports from value imports (`SUBJECTS`, `TENSES`, `verbs`, `shuffle`).

### No runtime re-validation of already-typed internal data
**Source:** RESEARCH.md Assumption A1, `src/dataset/validate.ts` (Zod used ONLY at the dataset ingestion boundary, not downstream consumers)
**Apply to:** `src/quiz/engine.ts`, `src/quiz/scoring.ts` — do not add Zod schemas for `GenerateOptions` or `QuizSession`; TypeScript's static types are sufficient since all callers are internal/trusted (no network/user input crosses this boundary this phase).

### Jest describe/it/expect structure, no mocking library
**Source:** `__tests__/dataset.test.ts` (full file)
**Apply to:** `__tests__/quiz-engine.test.ts`, `__tests__/quiz-scoring.test.ts` — flat `describe` per module, one `it` per behavior, plain `expect(...).toEqual/toBe(...)`, inline fixtures, no `jest.mock`/spies needed since everything is pure functions over plain data.

### Mandatory (non-default) `random` parameter threading
**Source:** RESEARCH.md Pattern 1 / Pitfall 1 (new convention this phase introduces — no prior repo precedent, first randomized module in the codebase)
**Apply to:** `src/quiz/random.ts`'s `shuffle()`, and every internal helper in `engine.ts` (`sampleTriples`, `buildQuestion`, `pickDistractors`) — only the top-level exported `generate()` may default `random` to `Math.random`; everything else requires it as a mandatory parameter so a missed thread-through fails at compile time.

## No Analog Found

None — every file in scope has at least a role-match analog (`src/dataset/` module structure covers types/service/utility roles; `dataset.test.ts` covers the test role). The one genuinely new pattern (injectable-RNG shuffle) has no prior repo precedent but is fully specified by RESEARCH.md's Pattern 1/2/3 code examples, which are treated as the canonical source for that piece.

## Metadata

**Analog search scope:** `src/dataset/`, `src/store/`, `__tests__/` (entire `src/` and `__tests__/` trees — small enough to read exhaustively)
**Files scanned:** `src/dataset/types.ts`, `src/dataset/validate.ts`, `src/dataset/verbs.ts` (partial, header only), `src/store/useQuizStore.ts`, `__tests__/dataset.test.ts`, `tsconfig.json` (strict-mode flags)
**Pattern extraction date:** 2026-07-12
