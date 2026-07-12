# Phase 2: Dataset & Domain Vocabulary - Research

**Researched:** 2026-07-12
**Domain:** Typed local data modeling + Zod 4.x runtime validation (TypeScript, no React/RN involvement)
**Confidence:** HIGH (types/module structure, Zod installed-version behavior verified against `node_modules`) / MEDIUM (Zod 4 `z.record` + enum-key completeness semantics — verified via GitHub issue threads, not official docs directly fetched)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Mostly regular, few irregular — target ~35-40 regular verbs + ~10-15 of the most
  common irregulars (ser, estar, ter, ir, fazer, poder, querer, dizer, ver, dar, vir, saber, pôr).
  Matches A1-A2 learner level: irregulars are essential but shouldn't dominate the set.
- **D-02:** Among the regular verbs, weight conjugation classes roughly proportional to real-world
  usage: ~50% -ar, ~30% -er, ~20% -ir. All three classes must still be represented so every
  conjugation pattern gets quiz coverage — this is not a hard ratio, just the target skew.
- **D-03:** Internal `Tense`/`Subject` TypeScript types MUST use the exact same string literal
  values as the backend's locked enums — `Tense = 'present_indicative' | 'preterite' | 'imperfect'
  | 'future'`, `Subject = 'eu' | 'tu' | 'ele_ela' | 'nos' | 'voces' | 'eles_elas'`. These are used
  as the actual dataset/quiz-engine types everywhere in the app, not just at the feedback boundary.
  This means zero mapping layer is needed in Phase 5 for the tense/subject fields specifically —
  the feedback payload can pass these values straight through. Display-friendly labels (e.g.,
  "ele/ela" with the slash, "nós" with the accent) are a separate presentation-only lookup table
  (e.g., `subjectLabels: Record<Subject, string>`), not a new type and not part of this phase's
  dataset module — build it when the setup/quiz UI needs it (Phase 4), not now.
- **D-04:** No specific external reference required. Claude drafts the full 50-verb dataset from
  its own European Portuguese grammar knowledge; the user does a verb-by-verb read-through before
  it ships. This read-through can happen either at the end of this phase or, per the existing
  ROADMAP Phase 6 plan, as the dedicated "dataset accuracy read-through vs authoritative EP source"
  polish pass — planner's discretion on timing, but the accuracy responsibility is user review, not
  a cited external source.
- **D-05:** `isIrregular` is true if and only if the verb deviates from the regular -ar/-er/-ir
  pattern in the present indicative specifically (traditional EP A1-A2 teaching definition — stem
  changes, irregular 1st person, etc.). A verb that is regular in the present but irregular in a
  later tense (preterite/imperfect/future) is still flagged `isIrregular: false`. This keeps the
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

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope. (The tense/subject → display-label mapping table was
raised during discussion but explicitly deferred to Phase 4, not built now — see D-03.)
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|--------------------|
| DATA-01 | Local verb dataset includes English translation, regular/irregular flag, and conjugations for all 4 tenses × 6 subject forms | `Verb`/`Tense`/`Subject` type design (Pattern 1), exhaustive `z.object()` schema, Code Examples section |
| DATA-02 | Dataset supports up to 50 curated European Portuguese verbs (initial content may seed smaller for velocity, architecture supports full 50) | Recommended Project Structure (single `verbs.ts` array, no scaling changes needed at 50 verbs per ARCHITECTURE.md); Open Question 2 on verb-list drafting/review sequencing |
| DATA-03 | Dataset shape/completeness is automatically validated (every verb has all required cells populated) | Pattern 1 (exhaustive schema) + Pattern 2 (`validateDataset()` result shape) + Pitfall 1 (the `z.record()` trap that would silently defeat this requirement) + Validation Architecture test map |
</phase_requirements>


## Summary

This phase is pure domain modeling: no UI, no store wiring, no network I/O. The only real technical risk is **Zod 4's `z.record()` semantics with enum keys**, which changed from Zod 3 in a way that can silently produce a *partial* (all-keys-optional) record instead of the *exhaustive* (all-keys-required) record the dataset needs for DATA-03's "zero shape/completeness errors" guarantee. Getting this schema wrong doesn't throw a type error — it just fails to catch a missing conjugation cell at validation time, which is precisely the failure mode DATA-03 exists to prevent. The rest of the phase (types, file structure, verb selection) is low-risk and mostly already decided in CONTEXT.md.

The installed toolchain (`zod@4.4.3`, `typescript@~6.0.3`, `jest-expo@~57.0.1`) is already in `package.json` — this phase adds zero new dependencies. Test file convention is already established (`__tests__/*.test.ts`), so `src/dataset/` tests fit that existing pattern rather than needing a new co-located `__tests__` directory decision.

**Primary recommendation:** Build the `Verb` Zod schema using `z.object()` with **explicit per-subject keys** (not `z.record(SubjectEnum, z.string())`) nested inside **explicit per-tense keys** (not `z.record(TenseEnum, ...)`) — i.e., a fully-spelled-out object shape mirroring the 4×6 grid — rather than relying on `z.record()`'s enum-key behavior, which has documented inconsistencies in Zod 4 around exhaustiveness. This makes "every cell present" a structural guarantee enforced by Zod's own required-field checking, not an assumption about record-completeness semantics.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Verb data storage (50 verbs × 4 tenses × 6 subjects) | Domain / Data (in-app, `src/dataset/`) | — | No backend content API exists or is planned (CLAUDE.md, PROJECT.md) — dataset ships inside the app bundle as a static TS module. |
| `Tense`/`Subject` type definitions | Domain / Data (`src/dataset/types.ts`) | Integration (`src/api/`, consumed later) | These types are the single source of truth every other tier (quiz-engine in Phase 3, API mapping in Phase 5) imports from — must not be redeclared elsewhere. |
| Dataset shape/completeness validation | Domain / Data (`src/dataset/validate.ts` + Jest) | — | Build/test-time concern; no runtime UI dependency this phase. Optional `__DEV__` runtime check is architecture's discretion, not required for DATA-03. |
| Enum-literal reconciliation vs backend | Domain / Data (this phase, one-time review) | Integration (`src/api/`, Phase 5 enforces it in code) | This phase only needs to *define* `Tense`/`Subject` correctly; the mapping/enforcement boundary lives in Phase 5's `feedbackClient.ts` per ARCHITECTURE.md. |

## Standard Stack

### Core
No new packages — this phase uses only what's already installed.

| Library | Version (installed) | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `zod` | `4.4.3` [VERIFIED: node_modules/zod/package.json + npm registry `latest`] | Runtime schema validation of the verb dataset | Already locked in `.planning/research/STACK.md`; matches project's existing dependency, no version change needed. |
| `typescript` | `~6.0.3` [VERIFIED: package.json] | Static types for `Verb`/`Tense`/`Subject`, `z.infer` | Note: `.planning/research/STACK.md` (Phase 1 research) recommended staying on "TypeScript 5.x, not 7.x" — the project actually has `~6.0.3` installed, which is neither of those. This is a **discrepancy worth flagging to the planner**, not something Phase 2 should fix; it's a pre-existing Phase 1 scaffold detail, out of this phase's scope. Phase 2's dataset code should just target whatever `tsc --noEmit` accepts today (verified: `~6.0.3`, `strict: true`, `noUncheckedIndexedAccess: true`). |
| `jest-expo` | `~57.0.1` [VERIFIED: package.json] | Test runner preset | Already configured (`"jest": { "preset": "jest-expo" }` in package.json). Dataset validation tests are plain TS, no RN rendering — will run fine under this preset with zero extra config. |

### Supporting
None needed — no new libraries for this phase.

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `z.object()` with 6 explicit subject keys per tense | `z.record(SubjectEnum, z.string())` | Record form is more concise but has documented Zod 4 exhaustiveness inconsistencies with enum keys (see Pitfall 1) — not worth the risk for a completeness-critical schema with only 6 keys to spell out. |
| Single `verbs.ts` array (50 verbs) | Split into per-tense or per-verb-group files | ARCHITECTURE.md already recommends single-file for 50 verbs; splitting adds import/re-export overhead with no benefit at this scale — deferred per CONTEXT.md discretion note. |

**Installation:** None — no new packages to install this phase.

**Version verification:** `zod@4.4.3` confirmed via `node_modules/zod/package.json` (installed) and cross-checked against `npm view zod version` = `4.4.3` [VERIFIED: npm registry, 2026-07-12]. `typescript` installed is `~6.0.3` [VERIFIED: package.json], while `npm view typescript version` currently resolves to `7.0.2` [VERIFIED: npm registry] — do not bump TypeScript as part of this phase; that's an unrelated toolchain decision outside DATA-01/02/03 scope.

## Package Legitimacy Audit

No external packages are being installed in this phase — `zod`, `typescript`, and `jest-expo` are all pre-existing dependencies from Phase 1's scaffold. The Package Legitimacy Gate is not applicable; skipping per the "only required whenever this phase installs external packages" condition.

## Architecture Patterns

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│  src/dataset/types.ts                                        │
│  Tense = 'present_indicative' | 'preterite' |                │
│          'imperfect' | 'future'                              │
│  Subject = 'eu' | 'tu' | 'ele_ela' | 'nos' |                 │
│            'voces' | 'eles_elas'                              │
│  Verb = { verb, translation, isIrregular,                    │
│           conjugations: Record<Tense, Record<Subject,string>>}│
└───────────────────────────┬───────────────────────────────────┘
                            │ imported by
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  src/dataset/verbs.ts                                        │
│  export const verbs: Verb[] = [ ...50 hand-authored entries ]│
└───────────────────────────┬───────────────────────────────────┘
                            │ validated by
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  src/dataset/validate.ts                                      │
│  VerbSchema (Zod) — explicit object shape, all 24 cells       │
│  required per verb                                            │
│  validateDataset(verbs) -> { valid: true } |                  │
│                             { valid: false, errors: [...] }   │
└───────────────────────────┬───────────────────────────────────┘
                            │ asserted by
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  __tests__/dataset.test.ts (Jest, jest-expo preset)           │
│  - "every verb passes VerbSchema"                             │
│  - "dataset has 50 verbs" (or documents interim seed count)  │
│  - "Tense/Subject literals match CLAUDE.md's locked strings"  │
│    (one-time reconciliation assertion, DATA-03/SC-3)          │
└─────────────────────────────────────────────────────────────┘

Downstream (NOT built this phase, consumers only):
  src/quiz-engine/  (Phase 3) — imports verbs.ts + types.ts, no dataset changes
  src/api/          (Phase 5) — imports Tense/Subject types, no redeclaration
```

### Recommended Project Structure
```
src/
└── dataset/
    ├── types.ts       # Tense, Subject, Verb type definitions (source of truth)
    ├── verbs.ts        # Typed array of 50 verb entries (hand-authored, user-reviewed)
    └── validate.ts      # Zod schema + validateDataset() function

__tests__/
└── dataset.test.ts     # Shape/completeness tests + enum-literal reconciliation test
    (follows existing __tests__/smoke.test.ts, __tests__/useQuizStore.test.ts convention)
```

This matches ARCHITECTURE.md's recommended structure exactly and follows the existing `__tests__/*.test.ts` convention already established in the repo (verified: `__tests__/smoke.test.ts`, `__tests__/useQuizStore.test.ts` exist from Phase 1) — no new test-location decision needed.

### Pattern 1: Exhaustive object schema instead of `z.record()` for fixed-key grids

**What:** When the set of keys is small, fixed, and known at schema-authoring time (here: exactly 6 `Subject` values, exactly 4 `Tense` values), define the schema as `z.object({ eu: z.string().min(1), tu: z.string().min(1), ... })` rather than `z.record(SubjectSchema, z.string())`. Zod's `z.object()` treats every declared key as required by default — there's no ambiguity about whether a missing key fails validation.

**When to use:** Any dataset shape where "all N cells must be present" is a hard correctness requirement (exactly DATA-03's ask) and N is small enough to spell out (24 cells: 4 tenses × 6 subjects — very manageable).

**Example:**
```typescript
// src/dataset/validate.ts
import { z } from "zod";

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

Note this schema-first approach means `Verb` (the TypeScript type) can be *derived* from the Zod schema via `z.infer`, rather than hand-written separately in `types.ts` and kept in sync manually — reduces the risk of the Zod schema and the TS type silently drifting apart. `Tense`/`Subject` as standalone exported unions can still be derived: `type Tense = keyof z.infer<typeof TenseConjugationsSchema>`, or simply declared as literal unions alongside the schema (either is fine; CONTEXT.md leaves exact file structure to discretion).

### Pattern 2: `validateDataset()` returns a typed result, doesn't throw

**What:** A `validateDataset(verbs: unknown[]): { valid: true } | { valid: false; errors: string[] }` function using `.safeParse()` per-verb (not `.parse()`), collecting all errors rather than throwing on the first bad verb.

**When to use:** DATA-03 asks for a validation *report* ("zero shape/completeness errors ... across all seeded verbs") — a report implies seeing every error at once, not stopping at the first one. This also makes the Jest assertion clean: `expect(validateDataset(verbs).errors).toEqual([])`.

**Example:**
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

### Anti-Patterns to Avoid
- **Relying on `z.record(TenseEnum, ...)` / `z.record(SubjectEnum, ...)` for completeness enforcement:** Zod 4 has documented, still-open inconsistencies in how `z.record()` treats enum-typed keys for exhaustiveness (see Pitfall 1). Don't use it where "every key must be present" is the actual requirement being tested.
- **Redeclaring `Tense`/`Subject` in more than one file:** CONTEXT.md's Integration Points section is explicit — `src/dataset/types.ts` is the *only* place these unions are declared; Phase 3 and Phase 5 import from here.
- **Hand-writing a separate TS `interface Verb` next to a Zod `VerbSchema`:** Two independent sources of truth for the same shape will drift. Prefer `z.infer<typeof VerbSchema>` as the canonical `Verb` type (Pattern 1).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Dataset shape/completeness checking | Custom loop with manual `if (!verb.conjugations.future.eu) errors.push(...)` per-field checks | Zod `.safeParse()` with an exhaustive `z.object()` schema (Pattern 1/2) | Zod already gives structural completeness checking, precise error paths (`conjugations.future.eu`), and a derivable TS type for free — a hand-rolled checker duplicates this with more surface area for bugs and no compile-time type derivation. |
| Verifying `Tense`/`Subject` literal values match backend | Manually eyeballing CLAUDE.md against `types.ts` | A single Jest test asserting the literal arrays equal CLAUDE.md's documented values (e.g., `expect(TENSES).toEqual(['present_indicative','preterite','imperfect','future'])`) | Makes SC-3's "reviewed once ... with no unresolved mismatches" a repeatable, CI-checkable assertion instead of a one-time manual glance that can't be re-verified later if the file is edited. |

**Key insight:** This phase's entire technical risk surface is "did we actually validate completeness, or did we validate something that *looks* like completeness checking but silently allows gaps." Zod's object-required-by-default behavior is the correct tool; Zod's record-with-enum-key behavior is the trap.

## Common Pitfalls

### Pitfall 1: `z.record()` with an enum/literal-union key can silently produce a partial (optional-keys) record in Zod 4
**What goes wrong:** A schema like `z.record(z.enum(['eu','tu','ele_ela','nos','voces','eles_elas']), z.string())` may not enforce that all 6 keys are present — Zod 4 changed `z.record()` semantics from Zod 3, and there are multiple open GitHub issues (colinhacks/zod #2623, #4571) documenting inconsistent/partial-record behavior specifically when the key schema is an enum or a union derived from a const object. A verb missing its `eles_elas` future-tense conjugation could pass validation.
**Why it happens:** Zod 4's `z.record()` requires two explicit arguments (key schema, value schema) as a breaking change from v3's single-argument form, and the exhaustiveness guarantee for enum-typed keys is not consistently documented/implemented across all key-schema variants as of the current release.
**How to avoid:** Use the exhaustive `z.object()` pattern (Pattern 1) instead of `z.record()` for the `conjugations` field, since the key sets (4 tenses, 6 subjects) are small and fixed. This sidesteps the ambiguity entirely — `z.object()`'s required-by-default behavior is unambiguous and has been Zod's core semantic since v3.
**Warning signs:** If a Jest test using a deliberately-incomplete fixture (e.g., a verb missing one conjugation cell) does NOT fail validation, the schema is not actually enforcing completeness — write this negative test case explicitly (see Validation Architecture below) to catch this before it ships.

### Pitfall 2: `Record<Tense, Record<Subject, string>>` (TypeScript utility type) does not enforce completeness for object *literals*, only for assignments matching the exact type
**What goes wrong:** With `noUncheckedIndexedAccess: true` (already set in `tsconfig.json`), reading `verb.conjugations.future.eu` types as `string`, not `string | undefined` — but if the *literal* dataset entry is written with a missing key, TypeScript's structural typing for object literals assigned to a `Record<K,V>`-typed variable can still fail to catch it in certain contexts (e.g., if the array element type is widened, or a verb entry is spread/composed dynamically rather than written as a single literal). This is a general TS `Record` limitation, not RN/Expo-specific.
**Why it happens:** TypeScript's excess/missing-property checking for object literals is strongest at the point of direct assignment; if `verbs.ts` builds entries via any helper/spread pattern rather than 50 flat literals, this protection can weaken.
**How to avoid:** Author `verbs.ts` as 50 flat object literals (`{ verb: 'falar', translation: 'to speak', isIrregular: false, conjugations: { present_indicative: { eu: '...', ... }, ... } }`), each directly typed as `Verb` — don't build entries programmatically or via spread/merge helpers. This keeps TypeScript's literal-checking at full strength AND lets the Zod runtime check (Pitfall 1's fix) serve as the actual completeness backstop, since TS-only checking is compile-time and doesn't run as part of "reports zero shape/completeness errors" (SC-2, which implies a runtime-executable check, i.e., the Jest test).
**Warning signs:** `tsc --noEmit` passing is necessary but not sufficient evidence of dataset completeness — SC-2 requires the Zod validation test to actually run and report zero errors, not just type-checking to pass.

### Pitfall 3: Backend enum literal values in CLAUDE.md are themselves flagged as "best-guess, unverified" by the backend team
**What goes wrong:** Treating CLAUDE.md's `Tense`/`Subject` literals as unquestionably final risks locking in a value that the backend team itself hasn't fully committed to. CLAUDE.md explicitly states these were chosen "ahead of this app's existence (best-guess, flagged as needing verification — see portuguese-verb-api's Phase 3 decisions D-07/D-08)."
**Why it happens:** Cross-repo contracts authored before both sides exist are inherently provisional until both sides implement against them.
**How to avoid:** This phase's job (per SC-3) is narrowly scoped to *internal* reconciliation — confirm the app's own `Tense`/`Subject` types use the *exact same strings* CLAUDE.md documents, and write a test asserting that. It is explicitly **not** this phase's job to re-verify against the live backend's actual Zod schema (that's a Phase 5 concern, when `POST /feedback` is actually wired up and can be round-trip tested). Don't scope-creep into calling the live API this phase — CONTEXT.md's phase boundary excludes feedback integration entirely.
**Warning signs:** Any task that suggests hitting `https://portuguese-verb-api.onrender.com` from this phase is out of scope — flag it back to Phase 5.

## Code Examples

### Complete minimal example — types + one verb + validation
```typescript
// src/dataset/types.ts
export type Tense = "present_indicative" | "preterite" | "imperfect" | "future";
export type Subject = "eu" | "tu" | "ele_ela" | "nos" | "voces" | "eles_elas";

export interface Verb {
  verb: string;
  translation: string;
  isIrregular: boolean;
  conjugations: Record<Tense, Record<Subject, string>>;
}

// src/dataset/verbs.ts
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
  // ... 49 more
];

// __tests__/dataset.test.ts
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
    // Assert every conjugation object in the dataset uses exactly these keys —
    // a structural proxy for "internal vocabulary matches backend literals" (SC-3).
    expect(Object.keys(verbs[0].conjugations).sort()).toEqual([...TENSES].sort());
    expect(Object.keys(verbs[0].conjugations.present_indicative).sort()).toEqual([...SUBJECTS].sort());
  });
});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|---------------|--------|
| `z.record(z.string())` (single-arg, Zod 3) | `z.record(keySchema, valueSchema)` (two-arg, required) | Zod 4 (2025) | Any Zod 3-era `z.record()` example found via general training knowledge/web search is likely outdated syntax — always check the two-arg form when writing new schemas against the installed `zod@4.4.3`. |

**Deprecated/outdated:** Single-argument `z.record()` — removed in Zod 4, do not use even as reference for API shape.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `z.record()` with enum-typed keys in Zod 4.4.3 specifically (not just "Zod 4" generally) exhibits the partial-record inconsistency described in GitHub issues #2623/#4571 | Pitfall 1 | LOW — even if 4.4.3 has since fixed this, the recommended `z.object()` pattern (Pattern 1) is strictly safer and has zero downside versus `z.record()`, so the mitigation holds regardless of whether the exact bug is present in this patch version. |
| A2 | The ~35-40 regular / ~10-15 irregular verb list Claude will draft (per D-04/D-05, not yet written) will correctly apply the "irregular in present indicative only" flag criterion | Don't Hand-Roll / Specific Ideas (deferred to planning/execution) | MEDIUM — conjugation accuracy is explicitly the user's review responsibility per D-04, not verified by this research; flagging here so the planner schedules the user read-through checkpoint CONTEXT.md already anticipates. |

## Open Questions (RESOLVED)

1. **Should `validateDataset()` also run at runtime in `__DEV__`, per ARCHITECTURE.md's "optionally at runtime" note?**
   - What we know: CONTEXT.md explicitly leaves this to Claude's discretion; no user preference expressed.
   - What's unclear: Whether a `__DEV__`-gated runtime assertion adds meaningful safety beyond the Jest test, given the dataset is static and only changes via source edits (which the Jest test already catches in CI/pre-commit).
   - RESOLVED: Skip runtime validation for this phase — the Jest test is sufficient for DATA-03 and keeps the dataset module free of any environment-conditional code. Revisit only if a future phase adds dynamic/remote dataset loading (explicitly out of scope — PROG-04). No runtime `__DEV__` validation task appears in any of the three plans, confirming this resolution.

2. **Exact final 50-verb list (which 15 irregulars, which 35-40 regulars, -ar/-er/-ir ratio realized)**
   - What we know: D-01/D-02 give selection criteria (target ratios, named core irregulars) but not a finalized list.
   - What's unclear: This is drafting work, not research — no external tool resolves "which specific 50 verbs," that's Claude's authoring task per D-04.
   - RESOLVED: Planner scheduled verb-list drafting as Plan 02-02's own wave, followed by Plan 02-03's `checkpoint:human-verify` review gate before the dataset is considered done, consistent with CONTEXT.md's D-04 and STATE.md's existing "Phase 6 dedicated accuracy read-through" blocker note.

## Environment Availability

No external dependencies for this phase — pure TypeScript/Zod authoring and Jest execution, both already installed and configured (`zod@4.4.3`, `jest-expo@~57.0.1` present in `package.json`; `__tests__/` convention already in use). Skipping this section's table per the "no external dependencies" skip condition.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest 30.x via `jest-expo@~57.0.1` preset [VERIFIED: package.json `"jest": { "preset": "jest-expo" }`] |
| Config file | `package.json` (`jest` key) — no separate `jest.config.js` exists or is needed |
| Quick run command | `npm test -- __tests__/dataset.test.ts` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DATA-01 | Every verb has translation, isIrregular flag, conjugations for 4 tenses × 6 subjects | unit | `npm test -- __tests__/dataset.test.ts -t "shape"` | ❌ Wave 0 |
| DATA-02 | Dataset supports up to 50 verbs (architecture, not necessarily fully seeded) | unit | `npm test -- __tests__/dataset.test.ts -t "count"` | ❌ Wave 0 |
| DATA-03 | Dataset validation reports zero shape/completeness errors | unit | `npm test -- __tests__/dataset.test.ts -t "zero shape/completeness errors"` | ❌ Wave 0 |
| DATA-03 (negative case) | Validation actually rejects an incomplete verb (proves the check isn't a no-op — see Pitfall 1) | unit | `npm test -- __tests__/dataset.test.ts -t "rejects a verb missing"` | ❌ Wave 0 |
| (SC-3, no dedicated REQ ID) | Internal Tense/Subject literals match CLAUDE.md's exact backend enum strings | unit | `npm test -- __tests__/dataset.test.ts -t "locked backend enums"` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npm test -- __tests__/dataset.test.ts`
- **Per wave merge:** `npm test` (full suite, includes Phase 1's `smoke.test.ts` and `useQuizStore.test.ts`)
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/dataset/types.ts` — does not exist yet, needed before any test can import types
- [ ] `src/dataset/verbs.ts` — does not exist yet, dataset content itself
- [ ] `src/dataset/validate.ts` — does not exist yet, the `VerbSchema` + `validateDataset()` this phase's tests exercise
- [ ] `__tests__/dataset.test.ts` — does not exist yet; follows the existing `__tests__/*.test.ts` convention (no new Jest config needed — `jest-expo` preset already handles plain-TS test files with zero RN imports)

*(No framework install needed — `jest-expo` and `zod` are already dependencies.)*

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-------------------|
| V2 Authentication | No | No auth in this app (locked, CLAUDE.md) |
| V3 Session Management | No | No sessions |
| V4 Access Control | No | No access-controlled resources — dataset is static, bundled, offline |
| V5 Input Validation | Yes (narrow sense) | Zod schema validation of the dataset itself (Pattern 1/2) — this is *build-time content* validation, not user-input validation, but the same ASVS discipline (fail closed, exhaustive schema, no silent partial acceptance) applies per Pitfall 1 |
| V6 Cryptography | No | No secrets, no crypto operations in this phase |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|----------------------|
| Silently-incomplete dataset shipped to production (missing conjugation cell surfaces as a runtime `undefined` string shown to the learner) | Tampering / (data-integrity, not adversarial) | Exhaustive Zod schema (Pattern 1) + explicit negative test proving the schema actually rejects incompleteness (Pitfall 1) — this is a data-integrity concern rather than a classic adversarial STRIDE threat, since the dataset is bundled, local, and not user-modifiable at runtime. |

No adversarial attack surface exists in this phase — the dataset is static, bundled into the app binary, never fetched remotely, and never accepts user input. The "security" concern here is entirely about data-integrity validation rigor (Pitfall 1), not classic ASVS threat modeling.

## Sources

### Primary (HIGH confidence)
- `node_modules/zod/package.json` — installed version `4.4.3`, checked directly in this repo
- `npm view zod version` / `npm view typescript version` — registry `latest` dist-tags, queried directly, 2026-07-12
- `package.json`, `tsconfig.json` (this repo) — actual installed dependency versions and TS strictness config, checked directly
- `.planning/phases/02-dataset-domain-vocabulary/02-CONTEXT.md` — locked decisions (D-01 through D-05)
- `CLAUDE.md` — exact locked backend enum literal strings

### Secondary (MEDIUM confidence)
- https://github.com/colinhacks/zod/issues/2623 — `z.record` with enum/union key producing a partial record, WebSearch-surfaced GitHub issue thread, not independently reproduced against `zod@4.4.3` specifically in this session
- https://github.com/colinhacks/zod/issues/4571 — `z.record(z.enum(...))` v3-vs-v4 behavior difference, same caveat as above
- https://gist.github.com/imaman/a62d1c7bab770a3b49fe3be10a66f48a — Zod v4 migration guide summary (two-arg `z.record()` requirement), community-authored, cross-checked against the GitHub issues above for consistency

### Tertiary (LOW confidence)
- None used without cross-verification.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new dependencies, all versions verified directly against installed `node_modules`/`package.json` and npm registry
- Architecture: HIGH — directly extends already-approved `.planning/research/ARCHITECTURE.md`, no new architectural decisions needed this phase
- Pitfalls: MEDIUM — the core Zod `z.record()` risk (Pitfall 1) is verified via multiple GitHub issue threads discussing Zod 4 behavior generally, but not independently reproduced against the exact installed `zod@4.4.3` patch version in this research session; the recommended mitigation (avoid `z.record()` entirely, use `z.object()`) is safe regardless of whether the specific bug is present

**Research date:** 2026-07-12
**Valid until:** 30 days (stable domain — pure TS/Zod modeling, no fast-moving external API surface this phase touches)
</content>
