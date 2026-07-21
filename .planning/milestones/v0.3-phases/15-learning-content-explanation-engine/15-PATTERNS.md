# Phase 15: Learning Content & Explanation Engine - Pattern Map

**Mapped:** 2026-07-20
**Files analyzed:** 10 (3 new domain files, 4 modified domain files, 3 test files new/extended)
**Analogs found:** 10 / 10

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|--------------------|------|-----------|-----------------|----------------|
| `src/learning/types.ts` | model | transform | `src/dataset/types.ts` | exact (same per-domain `types.ts` role) |
| `src/learning/schema.ts` | utility (validation) | transform | `src/dataset/validate.ts` | exact (compositional Zod schema) |
| `src/learning/explain.ts` | service (pure function) | transform | `src/quiz/engine.ts` | exact (pure, injectable-input, no React) |
| `src/dataset/types.ts` (modify: add `formIndex?`) | model | transform | itself (additive change) | exact |
| `src/dataset/validate.ts` (modify: add `formIndex` to `VerbSchema`) | utility (validation) | transform | itself (additive change) | exact |
| `src/dataset/remote.ts` (modify: return shape `{ verbs, learning }`) | service | request-response | itself + `src/feedback/submit.ts` (fetch+timeout+result-shape pattern) | exact |
| `src/dataset/source.ts` (modify: snapshot gains `learning`) | service | CRUD (cache/memoize) | itself (additive change) | exact |
| `__tests__/learning-explain.test.ts` | test | transform | `__tests__/quiz-engine.test.ts` (pure-function table-style tests, not read but same convention per `quiz/engine.ts`'s injectable-random pattern) — closer direct analog used: `__tests__/dataset.test.ts` | role-match |
| `__tests__/learning-schema.test.ts` | test | transform | `__tests__/dataset.test.ts` | exact |
| `__tests__/dataset-remote.test.ts` (extend) | test | request-response | itself (existing file, extend in place) | exact |
| `__tests__/dataset-source.test.ts` (extend) | test | CRUD (cache) | itself (existing file, extend in place) | exact |

## Pattern Assignments

### `src/learning/types.ts` (model, transform)

**Analog:** `src/dataset/types.ts` (full file read above — 37 lines)

**Pattern to copy:** Plain exported `interface`/`type` declarations, no classes, `PascalCase` for interfaces/types, reuse `Tense`/`Subject` from `../dataset/types` rather than re-declaring. Follow the exact same flat-export style (no barrel, no default export).

```typescript
// src/dataset/types.ts (existing convention to mirror)
export interface Verb {
  verb: string;
  translation: string;
  isIrregular: boolean;
  conjugations: Record<Tense, Record<Subject, string>>;
}
```

Apply the same style for `FormMatch`, `LearningTemplates`, `VerbLearningEntry`, `LearningContent`, `MismatchCategory` — per RESEARCH.md's Pattern 1/3 shapes. `FormMatch = { tense: Tense; subject: Subject }`. `MismatchCategory` is a plain string-literal union (matches project convention of preferring unions over `enum`, per CONVENTIONS.md "Types").

---

### `src/learning/schema.ts` (utility/validation, transform)

**Analog:** `src/dataset/validate.ts` (full file, 44 lines) + `src/feedback/schema.ts` (full file, 15 lines) for the `z.enum(TENSES as unknown as [...])` reuse convention.

**Compositional bottom-up schema pattern** (`src/dataset/validate.ts` lines 3-24):
```typescript
const SubjectConjugationsSchema = z.object({ ... });
const TenseConjugationsSchema = z.object({
  present_indicative: SubjectConjugationsSchema,
  ...
});
export const VerbSchema = z.object({ ... conjugations: TenseConjugationsSchema });
```
Build `FormMatchSchema` → `LearningTemplatesSchema`/inline `templates` object → `VerbLearningEntrySchema` → `LearningContentSchema` the same way (see RESEARCH.md Pattern 1 for the exact target shape — do not re-derive, copy that shape directly).

**Enum reuse pattern** (`src/feedback/schema.ts` lines 3-9):
```typescript
import { TENSES, SUBJECTS, type Tense, type Subject } from "../dataset/types";
tense: z.enum(TENSES as unknown as [Tense, ...Tense[]]),
subject: z.enum(SUBJECTS as unknown as [Subject, ...Subject[]]),
```
Use this exact cast idiom for `FormMatchSchema`'s `tense`/`subject` fields and any `Tense`/`Subject` field inside `LearningContentSchema`.

**Error-accumulation pattern** (`src/dataset/validate.ts` lines 26-43, `validateDataset`):
```typescript
export function validateDataset(verbs: unknown[]): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  verbs.forEach((v, i) => {
    const result = VerbSchema.safeParse(v);
    if (!result.success) {
      const issues = result.error.issues
        .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
        .join("; ");
      errors.push(`verbs[${i}]: ${issues}`);
    }
  });
  return { valid: errors.length === 0, errors };
}
```
Not directly reused for `learning` (which degrades to `undefined` on any failure per D-04/Pitfall 3, not an accumulated-errors return), but the `.safeParse` + `.issues` idiom is the one to reuse inside `fetchRemoteVerbs`'s new `LearningContentSchema.safeParse(payload.learning)` call.

**Do NOT port:** the backend's `superRefine` seeded-verb-list check (RESEARCH.md Pattern 1 note) — mobile has no seed list to check against.

---

### `src/learning/explain.ts` (service/pure function, transform)

**Analog:** `src/quiz/engine.ts` (full file, 124 lines) — specifically its injectable-parameter, pure-function, no-React style.

**Core pattern — small single-purpose exported functions, dependencies as plain parameters** (`src/quiz/engine.ts` lines 19-23, 50-63):
```typescript
export function generate(
  options: GenerateOptions,
  random: () => number = Math.random,
  verbs: Verb[] = localVerbs,
): QuizSession { ... }

export function buildQuestion(
  triple: Triple,
  allVerbs: readonly Verb[],
  random: () => number,
): Question {
  const verb = allVerbs.find((v) => v.verb === triple.verb);
  if (!verb) {
    throw new Error(`Unknown verb "${triple.verb}" not found in provided verb list`);
  }
  ...
}
```
Mirror this exactly for `selectExplanation(verb: Verb, selectedAnswer: string, correctAnswer: { tense: Tense; subject: Subject }, learning: LearningContent | undefined): string | undefined` — no hidden module state, no defaults that hide a dependency (unlike `generate`'s `Math.random`/`localVerbs` defaults, `selectExplanation` has no natural default and should require all four params explicitly, since RESEARCH.md's Pitfall 1 requires callers to always pass current `learning`/`verb.formIndex`).

**Fail-closed / never-throw pattern** — mirror `src/dataset/source.ts`'s `resolve()` catch-and-degrade (see below) rather than `quiz/engine.ts`'s `throw new InsufficientVerbsError(...)`: `selectExplanation` must return `undefined`, never throw, on any missing-data path (D-04). This is the one place `quiz/engine.ts` is NOT the pattern to copy (it throws on insufficient data) — use the dataset-layer's silent-degrade convention instead for this specific behavior.

**Tie-break classification algorithm:** copy RESEARCH.md's Pattern 3 code block verbatim (it is already written to project conventions — plain function, string-literal union return type, no external deps). Reproduced here for convenience:
```typescript
function classify(
  matches: FormMatch[],
  correct: { tense: Tense; subject: Subject },
): MismatchCategory {
  const categories = matches.map((m) => {
    const sameTense = m.tense === correct.tense;
    const sameSubject = m.subject === correct.subject;
    if (sameTense && sameSubject) return "generic" as MismatchCategory;
    if (sameSubject) return "wrongTense" as MismatchCategory;
    if (sameTense) return "wrongSubject" as MismatchCategory;
    return "wrongTenseAndSubject" as MismatchCategory;
  });
  const allAgree = categories.every((c) => c === categories[0]);
  return allAgree ? categories[0]! : "generic";
}
```
Note the `categories[0]!` non-null assertion — follows CONVENTIONS.md's "comment-justified `!`" rule for `noUncheckedIndexedAccess`; add a one-line comment explaining why `categories[0]` is always defined (array is non-empty since `matches.length >= 1` is a precondition), matching the style in `src/quiz/random.ts`.

**Template interpolation:** simple `.replace(/\{(\w+)\}/g, ...)` helper (RESEARCH.md "Don't Hand-Roll" table) — no templating library.

---

### `src/dataset/types.ts` (modify — additive)

**Analog:** itself, additive only.

```typescript
// existing (unchanged)
export interface Verb {
  verb: string;
  translation: string;
  isIrregular: boolean;
  conjugations: Record<Tense, Record<Subject, string>>;
  // NEW:
  formIndex?: Record<string, FormMatch[]>; // optional: absent for local fallback (D-05)
}
```
Import `FormMatch` from `../learning/types` (one-directional `dataset` → `learning` dependency, confirmed acceptable by RESEARCH.md).

---

### `src/dataset/validate.ts` (modify — additive)

**Analog:** itself. Add `formIndex: z.record(z.string(), z.array(FormMatchSchema)).optional()` to `VerbSchema` (import `FormMatchSchema` from `../learning/schema`), following the exact `.optional()` idiom already used nowhere yet in this file but standard Zod/project style (see `feedback/schema.ts`'s no-optional fields as the required-field contrast — this is the first optional field in a `VerbSchema`-shaped object, so there's no in-file precedent; follow plain Zod `.optional()`).

---

### `src/dataset/remote.ts` (modify — breaking return-shape change)

**Analog:** itself (full file, 35 lines) + `src/feedback/submit.ts` for the AbortController+timeout try/finally convention (already present in this file, unchanged).

**Current structure to preserve exactly** (lines 7-35): `AbortController` + `setTimeout`/`clearTimeout` in `try {...} finally {...}`, `response.ok` check throws, `payload.verbs` array-check throws, `validateDataset` throws on invalid shape.

**New addition (return shape becomes `{ verbs, learning }`):**
```typescript
// Source: RESEARCH.md Code Examples — extends existing safeParse/throw-only-for-verbs pattern
import { LearningContentSchema } from "../learning/schema";
import type { LearningContent } from "../learning/types";

export async function fetchRemoteVerbs(): Promise<{
  verbs: Verb[];
  learning: LearningContent | undefined;
}> {
  // ...existing fetch/timeout/verbs-validation logic (lines 8-30) unchanged...
  const learningResult = LearningContentSchema.safeParse(payload.learning);
  const learning = learningResult.success ? learningResult.data : undefined;
  return { verbs: payload.verbs as Verb[], learning };
}
```
**Critical:** `learning` validation failure must NOT throw (must degrade silently to `undefined`) — this is the one deliberate divergence from the file's existing all-fields-throw-on-invalid pattern (RESEARCH.md Pitfall 3). Only `verbs` validation failure throws.

**Every caller must be updated in the same atomic change** (RESEARCH.md explicitly flags this as breaking, not additive): `src/dataset/source.ts`, `__tests__/dataset-remote.test.ts` (currently asserts `expect(result).toEqual([sampleVerb])` at line 62 — must become `expect(result).toEqual({ verbs: [sampleVerb], learning: undefined })`).

---

### `src/dataset/source.ts` (modify — snapshot gains `learning`)

**Analog:** itself (full file, 30 lines).

**Current structure to preserve exactly:**
```typescript
let cachedResult: Promise<{ verbs: Verb[]; source: VerbSource }> | null = null;

async function resolve(): Promise<{ verbs: Verb[]; source: VerbSource }> {
  try {
    const remote = await fetchRemoteVerbs();
    return { verbs: remote, source: "remote" };
  } catch {
    return { verbs: localVerbs, source: "local" };
  }
}
```
**New shape:**
```typescript
let cachedResult: Promise<{
  verbs: Verb[];
  source: VerbSource;
  learning: LearningContent | undefined;
}> | null = null;

async function resolve() {
  try {
    const { verbs, learning } = await fetchRemoteVerbs();
    return { verbs, source: "remote" as const, learning };
  } catch {
    return { verbs: localVerbs, source: "local" as const, learning: undefined };
  }
}
```
`prefetch()` and `resolveVerbs()` (lines 18-29) are unchanged — they operate on whatever shape `resolve()` returns, no internal changes needed beyond the type signature flowing through. This is the single memoization point per RESEARCH.md Pitfall 2 — do not add a second cache/module-level variable for `learning`.

**Downstream audit required (not this file, but flagged by RESEARCH.md's State of the Art table):** `src/components/OfflinePill.tsx` and `src/store/useQuizStore.ts` both call `resolveVerbs()`/consume its return — audit their destructuring for shape assumptions that would break under the wider `{ verbs, source, learning }` object (likely fine since both currently destructure named fields, not the whole object, but verify).

---

### `__tests__/learning-explain.test.ts` (new)

**Analog:** `__tests__/dataset.test.ts` (full file, 51 lines) for `describe`/`it` structure and plain-object test fixtures; and `src/quiz/engine.ts`'s injectable-`random`-parameter testability convention (mocked in `__tests__/quiz-engine.test.ts`, not read directly but same convention applies — `selectExplanation` needs no injectable random since it's deterministic, but should be tested purely with plain input objects, no mocking).

```typescript
// Pattern from __tests__/dataset.test.ts
describe("dataset validation", () => {
  it("every verb has the correct shape", () => {
    verbs.forEach((v) => { ... });
  });
  ...
});
```
Mirror with `describe("selectExplanation", () => { it("returns the wrongTense template when...", () => {...}); ... })`. Cover: single-match wrongTense/wrongSubject/wrongTenseAndSubject (D-02), tied-agreeing-category, tied-disagreeing-category → generic (D-01), missing `learning` block, missing per-verb entry, zero `formIndex` matches (all → `undefined`, D-04), and a purity assertion (inputs unchanged after call — use `Object.freeze` or deep-equal before/after per TEST-05).

---

### `__tests__/learning-schema.test.ts` (new)

**Analog:** `__tests__/dataset.test.ts` (full file) — same `describe`/`it` style, direct `.safeParse` assertions rather than going through a network mock.

```typescript
// existing pattern to mirror (dataset.test.ts line 25-27)
it("reports zero shape/completeness errors", () => {
  expect(validateDataset(verbs).errors).toEqual([]);
});
```
For `learning-schema.test.ts`: `expect(LearningContentSchema.safeParse(validPayload).success).toBe(true)`, plus negative cases (missing `templates.generic`, wrong `version`, malformed `formIndex` entry) each asserting `.success === false`.

---

### `__tests__/dataset-remote.test.ts` (extend in place)

**Analog:** itself (full file, 130 lines, already read completely above).

**Existing fetch-mock pattern to extend** (lines 44-63):
```typescript
it("resolves the unwrapped Verb[] when payload.verbs passes validation on a well-shaped 200", async () => {
  globalThis.fetch = jest.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => ({ verbs: [sampleVerb] }),
  }) as unknown as typeof fetch;

  const result = await fetchRemoteVerbs();
  expect(result).toEqual([sampleVerb]);  // MUST CHANGE to { verbs: [sampleVerb], learning: undefined }
});
```
Add new `it()` blocks: `payload.learning` present+valid → `{ verbs, learning: <parsed> }`; present+invalid → `{ verbs, learning: undefined }` (verbs unaffected, no throw); absent → `{ verbs, learning: undefined }`. **Every existing assertion of the old `[sampleVerb]` bare-array shape (line 62, and any other `.toEqual([...])`/`.resolves` assertions on `fetchRemoteVerbs()`'s return) must be updated to the new `{ verbs, learning }` object shape** in the same task per RESEARCH.md's atomic-change flag.

---

### `__tests__/dataset-source.test.ts` (extend in place)

**Analog:** itself (full file, 108 lines, already read completely above).

**Existing mock-return pattern to extend** (lines 52-61):
```typescript
it("resolves { verbs: <remote>, source: 'remote' } when fetchRemoteVerbs resolves", async () => {
  const { fetchRemoteVerbs } = require("../src/dataset/remote");
  fetchRemoteVerbs.mockResolvedValue([sampleRemoteVerb]);  // MUST CHANGE to { verbs: [sampleRemoteVerb], learning: undefined }

  const { resolveVerbs } = require("../src/dataset/source");
  const result = await resolveVerbs();
  expect(result).toEqual({ verbs: [sampleRemoteVerb], source: "remote" }); // MUST CHANGE to include learning: undefined
});
```
Update every `fetchRemoteVerbs.mockResolvedValue([...])` call (lines 54, 65 area, 85, 98) to the new `{ verbs, learning }` shape, and every `expect(result).toEqual({ verbs, source })` assertion to include `learning`. Add one new test: `resolveVerbs()`'s result carries a non-`undefined` `learning` value through when `fetchRemoteVerbs` resolves one (RESEARCH.md EXPL-01 requirement).

## Shared Patterns

### Compositional Zod schema (bottom-up nested `z.object`)
**Source:** `src/dataset/validate.ts` lines 3-24
**Apply to:** `src/learning/schema.ts` — build `FormMatchSchema` → `VerbLearningEntrySchema` → `LearningContentSchema` bottom-up, matching the `SubjectConjugationsSchema` → `TenseConjugationsSchema` → `VerbSchema` nesting style.

### Enum reuse via `z.enum(CONST as unknown as [T, ...T[]])`
**Source:** `src/feedback/schema.ts` lines 3, 8-9
**Apply to:** Every `Tense`/`Subject` field inside `src/learning/schema.ts` — never re-declare tense/subject literals, always import `TENSES`/`SUBJECTS` from `../dataset/types`.

### Fail-closed network/parsing (never throw to caller, degrade silently)
**Source:** `src/dataset/source.ts` lines 9-16 (`resolve()`'s try/catch → local fallback)
**Apply to:** `src/learning/explain.ts` (`selectExplanation` returns `undefined` rather than throwing on any missing-data path) and `src/dataset/remote.ts`'s new `learning` parsing branch (safeParse → `undefined`, no throw, independent of `verbs`' own throw-on-invalid behavior).

### `AbortController` + `setTimeout`/`clearTimeout` in `try/finally`
**Source:** `src/dataset/remote.ts` lines 8-9, 32-34 (also `src/feedback/submit.ts`)
**Apply to:** No change needed — `fetchRemoteVerbs`'s existing timeout wrapper already covers the new `learning` parsing since it happens on the same already-fetched `payload` object; no new network call is introduced.

### Module-scope single-cache memoization
**Source:** `src/dataset/source.ts` lines 7, 19-29 (`cachedResult` + `prefetch()`/`resolveVerbs()`)
**Apply to:** No new cache — extend the existing `cachedResult`'s resolved type to include `learning` as a third field (Pitfall 2 — do not introduce a second cache).

### `noUncheckedIndexedAccess`-safe array access with comment-justified `!`
**Source:** `src/quiz/random.ts` (referenced in CONVENTIONS.md; pattern: `[result[i], result[j]] = [result[j]!, result[i]!]; // noUncheckedIndexedAccess-safe: ...`)
**Apply to:** `src/learning/explain.ts`'s `classify()` function's `categories[0]!` access — add an equivalent inline comment justifying why the array is guaranteed non-empty.

## No Analog Found

None — every file in this phase has a strong existing analog in `src/dataset/`, `src/quiz/`, or `src/feedback/`, since this phase is explicitly additive/extending established per-domain conventions (per CONTEXT.md's "Claude's Discretion": `src/learning/` mirrors the existing `dataset/`/`quiz/`/`feedback` domain-folder convention).

## Metadata

**Analog search scope:** `src/dataset/`, `src/quiz/`, `src/feedback/`, `__tests__/` (all read directly, no broader glob/grep needed — CONTEXT.md and RESEARCH.md already named every relevant analog file explicitly)
**Files scanned:** 9 (`src/dataset/types.ts`, `src/dataset/validate.ts`, `src/dataset/remote.ts`, `src/dataset/source.ts`, `src/feedback/schema.ts`, `src/quiz/engine.ts`, `src/quiz/types.ts`, `__tests__/dataset-remote.test.ts`, `__tests__/dataset-source.test.ts`, `__tests__/dataset.test.ts`)
**Pattern extraction date:** 2026-07-20
