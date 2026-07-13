# Phase 2: Dataset & Domain Vocabulary - Pattern Map

**Mapped:** 2026-07-12
**Files analyzed:** 4
**Analogs found:** 4 / 4 (all role-match or convention-match; no exact prior `src/dataset/` module exists yet — this phase establishes the first domain-layer files)

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|--------------------|------|-----------|-----------------|----------------|
| `src/dataset/types.ts` | model | transform (static type definitions, no runtime behavior) | `src/store/useQuizStore.ts` | convention-match (TS strictness/export style only — no prior types-only module exists) |
| `src/dataset/verbs.ts` | model / config (static data) | batch (bulk static data, read-only) | `src/store/useQuizStore.ts` | convention-match (module shape/export style only — no prior static-data module exists) |
| `src/dataset/validate.ts` | utility | transform (schema validation, pure function, no I/O) | none in codebase (first Zod usage) | no-analog — use RESEARCH.md Pattern 1/2 code examples directly |
| `__tests__/dataset.test.ts` | test | transform (pure-function assertions, no RN rendering) | `__tests__/useQuizStore.test.ts`, `__tests__/smoke.test.ts` | exact (same `__tests__/*.test.ts` convention, same Jest/`describe`/`it` structure, same relative-import pattern) |

## Pattern Assignments

### `src/dataset/types.ts` (model, transform)

**Analog:** `src/store/useQuizStore.ts` (full file, 9 lines — read in full, no analog for types-only module exists yet)

```typescript
import { create } from "zustand";

interface QuizStoreState {
  status: "idle";
}

export const useQuizStore = create<QuizStoreState>(() => ({
  status: "idle",
}));
```

**What to copy from this analog:**
- Named exports only, no default export (`export const` / `export type` / `export interface`) — matches the single export style used throughout the codebase so far.
- No barrel files, no path aliases — plain relative imports (`tsconfig.json` has no `paths` mapping configured; `expo/tsconfig.base` is the only extension).
- File is intentionally minimal and single-purpose — `types.ts` should contain only `Tense`, `Subject`, and `Verb` (or `z.infer`-derived `Verb`), nothing else.

**Concrete shape to author (per RESEARCH.md Pattern 1, `tsconfig.json` strict mode + `noUncheckedIndexedAccess: true` verified in this repo):**
```typescript
export type Tense = "present_indicative" | "preterite" | "imperfect" | "future";
export type Subject = "eu" | "tu" | "ele_ela" | "nos" | "voces" | "eles_elas";

export interface Verb {
  verb: string;
  translation: string;
  isIrregular: boolean;
  conjugations: Record<Tense, Record<Subject, string>>;
}
```
Per RESEARCH.md's stated preference, prefer deriving `Verb` via `z.infer<typeof VerbSchema>` in `validate.ts` and re-exporting/importing it here rather than hand-writing a duplicate `interface Verb` — avoids the two-sources-of-truth drift RESEARCH.md's Anti-Patterns section warns against. Either placement (declared in `types.ts` and re-exported, or declared in `validate.ts` and imported into `types.ts`) is acceptable per CONTEXT.md's "file structure is Claude's discretion" note; pick one direction and keep `Tense`/`Subject` as the only things ever redeclared elsewhere (CONTEXT.md Integration Points: `src/dataset/types.ts` is the single source of truth other phases import).

---

### `src/dataset/verbs.ts` (model/config, batch)

**Analog:** `src/store/useQuizStore.ts` (same file — only precedent for a `src/` domain module's import/export conventions)

**What to copy:**
- Single default-free named export (`export const verbs: Verb[] = [...]`), matching `export const useQuizStore = ...` — one clear named export per file.
- Type-only import syntax already established isn't present in the analog (no `import type` used there), but RESEARCH.md's own code example uses `import type { Verb } from "./types";` — follow RESEARCH.md's example over the analog here since it's more specific to this exact file.

**Structure to author (from RESEARCH.md Code Examples, verbatim pattern to follow):**
```typescript
import type { Verb } from "./types";

export const verbs: Verb[] = [
  {
    verb: "falar",
    translation: "to speak",
    isIrregular: false,
    conjugations: {
      present_indicative: { eu: "falo", tu: "falas", ele_ela: "fala", nos: "falamos", voces: "falam", eles_elas: "falam" },
      preterite:          { eu: "falei", tu: "falaste", ele_ela: "falou", nos: "falámos", voces: "falaram", eles_elas: "falaram" },
      imperfect:          { eu: "falava", tu: "falavas", ele_ela: "falava", nos: "falávamos", voces: "falavam", eles_elas: "falavam" },
      future:             { eu: "falarei", tu: "falarás", ele_ela: "falará", nos: "falaremos", voces: "falarão", eles_elas: "falarão" },
    },
  },
  // ... 49 more, each a flat object literal (see Pitfall 2 below — no spread/helper composition)
];
```
**Critical constraint (RESEARCH.md Pitfall 2):** author each of the 50 entries as a flat object literal typed directly as `Verb` — do not build entries via a spread/merge helper or programmatic generator. This keeps TypeScript's literal-checking at full strength as a first line of defense before the Zod runtime check in `validate.ts` runs.

---

### `src/dataset/validate.ts` (utility, transform)

**Analog:** None in codebase — this is the first Zod-based module (`zod@4.4.3` is an installed-but-unused dependency prior to this phase). Use RESEARCH.md Pattern 1 + Pattern 2 verbatim as the canonical pattern source instead of a codebase analog.

**Imports pattern:**
```typescript
import { z } from "zod";
```

**Core schema pattern (RESEARCH.md Pattern 1 — exhaustive `z.object()`, NOT `z.record()`):**
```typescript
const SubjectConjugationsSchema = z.object({
  eu: z.string().min(1),
  tu: z.string().min(1),
  ele_ela: z.string().min(1),
  nos: z.string().min(1),
  voces: z.string().min(1),
  eles_elas: z.string().min(1),
});

const TenseConjugationsSchema = z.object({
  present_indicative: SubjectConjugationsSchema,
  preterite: SubjectConjugationsSchema,
  imperfect: SubjectConjugationsSchema,
  future: SubjectConjugationsSchema,
});

export const VerbSchema = z.object({
  verb: z.string().min(1),
  translation: z.string().min(1),
  isIrregular: z.boolean(),
  conjugations: TenseConjugationsSchema,
});

export type Verb = z.infer<typeof VerbSchema>;
```

**Validation-report pattern (RESEARCH.md Pattern 2 — `.safeParse()`, never `.parse()`, never throws):**
```typescript
export function validateDataset(verbs: unknown[]): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  verbs.forEach((v, i) => {
    const result = VerbSchema.safeParse(v);
    if (!result.success) {
      errors.push(`verbs[${i}]: ${result.error.issues.map(iss => iss.path.join(".") + ": " + iss.message).join("; ")}`);
    }
  });
  return { valid: errors.length === 0, errors };
}
```

**Error handling pattern:** No try/catch needed — `.safeParse()` never throws, so error handling is purely the accumulation-into-array shown above. This is the entire error-handling story for this file.

**Explicit anti-pattern to avoid (RESEARCH.md Pitfall 1):** Do NOT use `z.record(SubjectEnum, z.string())` or `z.record(TenseEnum, ...)` for the `conjugations` field — Zod 4's `z.record()` with enum-typed keys has documented exhaustiveness inconsistencies (colinhacks/zod #2623, #4571) that can silently allow a missing conjugation cell to pass validation. The exhaustive `z.object()` form above is the only schema shape this phase should ship.

---

### `__tests__/dataset.test.ts` (test, transform)

**Analog:** `__tests__/useQuizStore.test.ts` (full file, read in full) and `__tests__/smoke.test.ts` (full file, read in full)

```typescript
// __tests__/useQuizStore.test.ts
import { useQuizStore } from "../src/store/useQuizStore";

describe("useQuizStore", () => {
  it("imports safely and exposes idle initial status", () => {
    expect(useQuizStore.getState().status).toBe("idle");
  });
});
```

```typescript
// __tests__/smoke.test.ts
describe("smoke", () => {
  it("runs a trivial assertion under the jest-expo preset", () => {
    expect(1 + 1).toBe(2);
  });
});
```

**What to copy:**
- Relative import path convention: `../src/<module>/<file>` (both analogs import from `../src/...`, no path aliases configured in `tsconfig.json`).
- Top-level `describe("<module name>", () => { ... })` block, one per file, matching `describe("useQuizStore", ...)`.
- Plain Jest `it("<behavior description>", () => { expect(...).toBe/toEqual(...) })` — no `beforeEach`/setup boilerplate in either analog since both modules are stateless/trivial to exercise directly.
- No RN Testing Library import in either analog — confirms RESEARCH.md's guidance that pure-logic tests (including this dataset module) should stay plain-Jest, no `@testing-library/react-native`.

**Structure to author (combining analog conventions with RESEARCH.md's Code Examples section, which is authoritative for this specific file's test cases):**
```typescript
import { verbs } from "../src/dataset/verbs";
import { validateDataset } from "../src/dataset/validate";

describe("dataset validation", () => {
  it("reports zero shape/completeness errors", () => {
    expect(validateDataset(verbs).errors).toEqual([]);
  });

  it("rejects a verb missing a conjugation cell (negative case)", () => {
    const broken = JSON.parse(JSON.stringify(verbs[0]));
    delete broken.conjugations.future.eles_elas;
    expect(validateDataset([broken]).valid).toBe(false);
  });

  it("Tense/Subject literals match CLAUDE.md's locked backend enums", () => {
    const TENSES: readonly string[] = ["present_indicative", "preterite", "imperfect", "future"];
    const SUBJECTS: readonly string[] = ["eu", "tu", "ele_ela", "nos", "voces", "eles_elas"];
    expect(Object.keys(verbs[0].conjugations).sort()).toEqual([...TENSES].sort());
    expect(Object.keys(verbs[0].conjugations.present_indicative).sort()).toEqual([...SUBJECTS].sort());
  });
});
```
Additional test cases the planner should schedule per RESEARCH.md's Validation Architecture test map (DATA-01, DATA-02): a "dataset has N verbs" count assertion, and a shape assertion covering `translation`/`isIrregular` presence — same `describe`/`it` structure as above, no new pattern needed.

---

## Shared Patterns

### TypeScript strictness baseline
**Source:** `tsconfig.json` (repo root, read directly)
**Apply to:** All four files
```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "types": ["jest"]
  }
}
```
`noUncheckedIndexedAccess: true` means any dynamic (non-literal-key) indexing into `Record<Tense, Record<Subject, string>>` types as possibly-`undefined` — write `verbs.ts` entries as flat literals (Pitfall 2) and prefer the exhaustive `z.object()` schema (Pattern 1) so no code needs to defensively guard against `undefined` conjugation cells.

### No path aliases / relative imports only
**Source:** `tsconfig.json` (no `paths` key present) + both existing `__tests__/*.test.ts` files
**Apply to:** All four files — always import via relative paths (`./types`, `../src/dataset/verbs`), never a bare/aliased specifier.

### Named exports only, no default exports
**Source:** `src/store/useQuizStore.ts`
**Apply to:** All four files — `export const`, `export type`, `export interface`, `export function` throughout; no file in this phase should use `export default`.

### `__tests__/*.test.ts` flat convention (not co-located)
**Source:** Existing `__tests__/smoke.test.ts` and `__tests__/useQuizStore.test.ts`, both at repo-root `__tests__/`, not next to their `src/` counterparts.
**Apply to:** `__tests__/dataset.test.ts` — place at repo-root `__tests__/`, not inside `src/dataset/`, to match the established convention (RESEARCH.md's Recommended Project Structure confirms this explicitly).

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `src/dataset/validate.ts` | utility | transform | First use of `zod` in this codebase — `zod@4.4.3` is installed but has no prior usage to pattern-match against. Planner/executor should follow RESEARCH.md's Pattern 1/Pattern 2 code examples verbatim (reproduced above) rather than search for a codebase analog. |

## Metadata

**Analog search scope:** `src/` (entire tree — only 1 file existed prior to this phase: `src/store/useQuizStore.ts`), `__tests__/` (entire tree — 2 files), `package.json`, `tsconfig.json`
**Files scanned:** 5 (`src/store/useQuizStore.ts`, `__tests__/useQuizStore.test.ts`, `__tests__/smoke.test.ts`, `package.json`, `tsconfig.json`) plus `.planning/research/ARCHITECTURE.md` and `.planning/phases/02-dataset-domain-vocabulary/02-RESEARCH.md` for pattern-source code examples where no codebase analog exists
**Pattern extraction date:** 2026-07-12
</content>
