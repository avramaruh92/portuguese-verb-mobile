# Phase 15: Learning Content & Explanation Engine - Research

**Researched:** 2026-07-20
**Domain:** Cross-repo contract parsing (Zod) + pure explanation-selection logic, mobile-side only
**Confidence:** HIGH

## Summary

This phase has no new external dependencies and no UI. It is entirely: (1)
extend mobile's existing dataset Zod schema/types to optionally carry the
backend's `learning` block and per-verb `formIndex` (already shipped, live,
unconditional on `formIndex` / fail-closed-omittable on `learning`), and (2)
write one pure function that, given a wrong answer, resolves which
`{tense, subject}` slot it actually belongs to via `formIndex`, classifies
the mismatch, and fills the matching backend-authored template string.

The backend does **not** ship a reference implementation of the
explanation-selection algorithm — only the data (`formIndex`, `learning`
templates) and the `FormMatch`/`findFormMatches` primitives that produce
`formIndex`. `learning.ts` on the backend only validates and attaches the
data (`deriveLearningBlock`, `applyIsIrregularOverride`); it never picks a
template. The selection algorithm mobile must implement is therefore new
code, guided precisely by CONTEXT.md's D-01/D-02 tie-breaking rules, which
this research confirms match the backend's `FormMatch`/template shapes with
no additional edge case beyond what CONTEXT.md already states.

**Primary recommendation:** Add a new `src/learning/` domain folder
(`types.ts`, `schema.ts`, `explain.ts`) mirroring `src/dataset/`'s
compositional-Zod-schema convention exactly. Extend `Verb` with an optional
`formIndex?: Record<string, FormMatch[]>` field, add a separate
`LearningContent` type/schema (not part of `Verb`), thread `learning`
through `fetchRemoteVerbs` and `resolveVerbs()`'s cached snapshot as a third
key (`{ verbs, source, learning }`), and implement `selectExplanation(...)`
as a pure function taking `(verb: Verb, selectedAnswer, correctAnswer,
learning: LearningContent | undefined)` and returning `string | undefined`.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| `learning`/`formIndex` schema validation | Domain logic (`src/learning/`, `src/dataset/`) | — | Mirrors existing `validate.ts` pattern; runs client-side against untrusted network payload |
| Dataset snapshot extension (`resolveVerbs()`) | Domain logic (`src/dataset/source.ts`) | — | Existing per-session cache is the correct home; no new tier needed |
| Explanation-selection (template pick + interpolation) | Domain logic (`src/learning/explain.ts`) | — | Pure function, framework-free, no React — same pattern as `src/quiz/engine.ts` |
| Explanation panel rendering | Browser/Client (Phase 16, out of scope) | — | Explicitly deferred to Phase 16 per CONTEXT.md |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| zod | ^4.4.3 (already installed, `[VERIFIED: npm registry]` — confirmed via `node_modules/zod/package.json`, matches backend's `^4.4.3`) | Runtime validation of `learning`/`formIndex` shapes | Already the project's sole validation library; `z.partialRecord` (used by backend's `learningContentSchema.ts` for `tenseNotes`/`subjectHints`) is confirmed present in mobile's installed zod 4.4.3 |

No new packages are required for this phase. **Package Legitimacy Audit is
not applicable** — nothing new is installed.

### Supporting
None beyond what's already in the project (no new libraries).

### Alternatives Considered
None — this phase reuses the existing stack exclusively; CONTEXT.md's
Claude's Discretion section only covers internal type-shape/file-layout
choices, not library alternatives.

**Installation:** none required.

## Package Legitimacy Audit

Not applicable — this phase installs no external packages.

## Architecture Patterns

### System Architecture Diagram

```text
GET /content/verbs  →  { verbs: ContentVerb[], learning?: LearningContent }
        │
        ▼
src/dataset/remote.ts  (fetchRemoteVerbs)
  - validates payload.verbs (existing, unchanged)
  - NEW: validates payload.learning if present (learningContentSchema-mirror)
  - NEW: also reads formIndex per verb (optional field on Verb)
  - returns { verbs, learning } (both typed, learning optional)
        │
        ▼
src/dataset/source.ts  (resolveVerbs / cachedResult)
  - NEW: snapshot shape becomes { verbs, source, learning }
  - local fallback path: learning always undefined (D-05)
        │
        ▼
        ├──────────────► src/quiz/engine.ts (UNCHANGED — Question/Triple
        │                 shapes carry no learning data; explanation lookup
        │                 happens later, at answer time, not generation time)
        │
        ▼
src/learning/explain.ts  (NEW, pure, no React)
  selectExplanation(verb, selectedAnswer, correctAnswer, learning)
    1. look up verb.formIndex[selectedAnswer] → FormMatch[]
    2. 0 matches → return undefined (D-04 fail-closed)
    3. classify each match against the KNOWN correct {tense, subject}
       (available from the Question/Triple that generated the question —
       NOT re-derived from formIndex, since the engine already knows it)
    4. if all matches agree on one category → pick that template
       if matches disagree → fall back to "generic" (D-01)
    5. look up learning.verbs[verb.verb] for tenseNotes/subjectHints
       (optional enrichment — NOT required for template selection itself;
       template selection only needs the FormMatch/{tense,subject} data)
    6. interpolate template string, return it
        │
        ▼
   (Phase 16: Quiz screen renders this string — out of scope here)
```

### Recommended Project Structure
```
src/learning/
├── types.ts       # LearningContent, VerbLearningEntry, LearningTemplates,
│                   # FormMatch, MismatchCategory type — mirrors dataset/types.ts
├── schema.ts       # Zod schemas: FormMatchSchema, LearningContentSchema
│                   # (compositional, mirrors dataset/validate.ts style)
└── explain.ts       # selectExplanation() — the pure explanation-selection fn
```

`src/dataset/types.ts` gets one addition: `Verb.formIndex?:
Record<string, FormMatch[]>` (import `FormMatch` from `src/learning/types.ts`
— acceptable one-directional dependency, `dataset` → `learning`, since
`formIndex` ships as part of each `ContentVerb`, not as part of
`learning`). `src/dataset/validate.ts` gets the `formIndex` field added to
`VerbSchema` as optional. `src/dataset/remote.ts` and `src/dataset/source.ts`
are extended, not replaced (see Code Examples below).

### Pattern 1: Compositional optional Zod schema (mirror `dataset/validate.ts`)
**What:** Build `FormMatchSchema`, then `LearningTemplatesSchema`, then
`VerbLearningEntrySchema`, then `LearningContentSchema` bottom-up, exactly
like `SubjectConjugationsSchema` → `TenseConjugationsSchema` → `VerbSchema`
in `src/dataset/validate.ts`.
**When to use:** For the entire `learning` block and `formIndex` field.
**Example:**
```typescript
// Source: mirrors src/dataset/validate.ts + backend's
// prisma/seed-data/learningContentSchema.ts (translated to mobile's
// existing TENSES/SUBJECTS runtime arrays, per src/feedback/schema.ts's
// established z.enum(TENSES as unknown as [Tense, ...Tense[]]) convention)
import { z } from "zod";
import { TENSES, SUBJECTS } from "../dataset/types";

const TenseEnum = z.enum(TENSES as unknown as [string, ...string[]]);
const SubjectEnum = z.enum(SUBJECTS as unknown as [string, ...string[]]);

export const FormMatchSchema = z.object({
  tense: TenseEnum,
  subject: SubjectEnum,
});

const VerbLearningEntrySchema = z.object({
  irregularTenses: z.array(TenseEnum),
  tenseNotes: z.partialRecord(TenseEnum, z.string().min(1)).optional(),
  subjectHints: z.partialRecord(SubjectEnum, z.string().min(1)).optional(),
});

export const LearningContentSchema = z.object({
  version: z.literal(1),
  templates: z.object({
    wrongTense: z.string().min(1),
    wrongSubject: z.string().min(1),
    wrongTenseAndSubject: z.string().min(1),
    // correctAnswerReveal exists in the backend's schema but is NOT
    // consumed by this milestone (EXPL-02 only needs 4 of the 5
    // templates) — still validate it as present-if-shipped, since the
    // backend always sends it, but do not wire it into explain.ts.
    correctAnswerReveal: z.string().min(1),
    generic: z.string().min(1),
  }),
  verbs: z.record(z.string(), VerbLearningEntrySchema),
});
```
**Note on backend's `superRefine`:** the backend's schema does an extra
`superRefine` pass rejecting `learning.verbs` keys not in its seeded-verb
list. Mobile does not have (and does not need) that cross-check — mobile
should simply accept whatever `verbs` keys are present and look up by verb
name at explain-time; an unknown/extra key is harmless (D-04's "no entry
for the current verb" path already handles it). Do not port the
`superRefine` — it is backend-only validation against its own seed list.

### Pattern 2: `formIndex` as an optional per-verb field, not a top-level map
**What:** `formIndex` ships as `ContentVerb.formIndex` (attached to *each*
verb object), not as a sibling of `learning` at the response's top level.
**When to use:** When extending `Verb`/`VerbSchema` — add `formIndex` next
to `conjugations`, not inside the new `learning` domain types.
**Example:**
```typescript
// src/dataset/types.ts — addition only, existing fields unchanged
import type { FormMatch } from "../learning/types";

export interface Verb {
  verb: string;
  translation: string;
  isIrregular: boolean;
  conjugations: Record<Tense, Record<Subject, string>>;
  formIndex?: Record<string, FormMatch[]>; // optional: absent for local fallback (D-05)
}
```
Local fallback verbs (`src/dataset/verbs.ts`) never set `formIndex` — this
is why it must be optional, not required, on `Verb` (confirmed by D-05: the
bundled dataset is not touched by this milestone).

### Pattern 3: Tie-breaking classification (D-01/D-02 in precise TS terms)
**What:** Given `matches: FormMatch[]` (from `formIndex[selectedAnswer]`,
length ≥ 1) and the known-correct `{tense, subject}` (from the `Question`
that was already generated — the engine already knows the correct triple,
no need to re-derive it from `formIndex`), classify:

```typescript
// Source: derived directly from CONTEXT.md D-01/D-02, cross-checked
// against backend's FormMatch shape (reverseIndex.ts) — no additional
// backend-side reference implementation exists to mirror.
type MismatchCategory =
  | "wrongTense"
  | "wrongSubject"
  | "wrongTenseAndSubject"
  | "generic"; // ambiguous tie or fallback

function classify(
  matches: FormMatch[],
  correct: { tense: Tense; subject: Subject },
): MismatchCategory {
  const categories = matches.map((m) => {
    const sameTense = m.tense === correct.tense;
    const sameSubject = m.subject === correct.subject;
    if (sameTense && sameSubject) {
      // selectedAnswer's slot IS the correct slot — should not normally
      // reach here since selectedAnswer !== correctAnswer is a precondition
      // (a wrong answer that happens to also be a correct-slot string is
      // itself an ambiguity — treat as generic per D-01's spirit)
      return "generic" as MismatchCategory;
    }
    if (sameSubject) return "wrongTense" as MismatchCategory;
    if (sameTense) return "wrongSubject" as MismatchCategory;
    return "wrongTenseAndSubject" as MismatchCategory;
  });

  const allAgree = categories.every((c) => c === categories[0]);
  return allAgree ? categories[0]! : "generic";
}
```
**When to use:** This is the entire tie-breaking algorithm — no further
edge cases exist in the backend source beyond what CONTEXT.md already
states. `findFormMatches` (backend) never returns 0 for a form that truly
exists in the table (it's exhaustive over all tense×subject cells), and
`formIndex` is built the same way for every unique form string — so mobile
should trust `formIndex[selectedAnswer]` completely once present.

### Anti-Patterns to Avoid
- **Re-deriving `{tense, subject}` from `formIndex` for the CORRECT answer
  too:** don't. The correct triple is already known (it's what generated
  the question in `src/quiz/engine.ts`). Only the selected (wrong) answer's
  slot needs `formIndex` lookup.
- **Wiring up `correctAnswerReveal`:** it exists in the schema/seed data but
  is explicitly out of scope for EXPL-02's 4 templates — don't reference it
  in `explain.ts`.
- **Porting the backend's `superRefine` seeded-verb-list check:** mobile has
  no independent seeded-verb list to check against; skip it (see Pattern 1).
- **Treating a single match's category as `generic` when it's genuinely a
  clean wrongTense/wrongSubject/wrongTenseAndSubject:** D-02 only calls for
  normal classification (not `generic`) when there's exactly one match —
  `generic` is reserved for ties that disagree, not for the single-match
  case.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| String template interpolation (`{verb}`, `{selectedAnswer}`, etc.) | A templating library (mustache/handlebars) | A simple `.replace(/\{(\w+)\}/g, ...)` helper (single-brace, no escaping, per backend's D-25) | Backend's interpolation syntax is deliberately minimal (7 closed variable names, no nesting/escaping) — a full templating engine is unnecessary complexity for a fixed, closed variable set |
| Zod schema for `learning`/`formIndex` | A hand-written type-guard/validator | Zod, compositional style matching `dataset/validate.ts` | Consistency with the rest of the codebase's validation approach; `z.partialRecord` already proven available |

**Key insight:** This phase's complexity is entirely in the tie-breaking
classification logic (Pattern 3), not in tooling — resist the urge to add
any new dependency; the existing Zod + plain-function toolkit is sufficient.

## Common Pitfalls

### Pitfall 1: Treating `formIndex` absence the same as `learning` absence
**What goes wrong:** Code checks `if (!learning) return undefined;` but
forgets `formIndex` is a *separate* optional field on `Verb` itself (ships
unconditionally from the backend today, but is `undefined` for the local
fallback dataset). A verb fetched remotely always has `formIndex`; a verb
from the local fallback never does.
**Why it happens:** Both `learning` and `formIndex` degrade together in
practice (local fallback lacks both), but they are independent fields in
the type system and must both be null-checked in `selectExplanation`.
**How to avoid:** Guard both: `if (!verb.formIndex || !learning) return
undefined;` — plus the per-verb `learning.verbs[verb.verb]` presence check
(D-04's third condition).
**Warning signs:** A runtime crash reading `formIndex[selectedAnswer]` on
an offline/local-fallback session (`formIndex` is `undefined` there).

### Pitfall 2: Re-fetching `learning` outside the per-session snapshot
**What goes wrong:** If `learning` isn't threaded through
`resolveVerbs()`'s cached promise the same way `verbs`/`source` are, a
component could end up reading a *fresher* `learning` payload than the
`verbs` snapshot the quiz session was generated from — violating the
Phase 8 "snapshot at quiz-start" guarantee CONTEXT.md explicitly calls out
as the pattern to extend.
**Why it happens:** Easy to add a second fetch/cache for `learning` instead
of extending the existing single cached `resolve()` result.
**How to avoid:** Add `learning` as a third key on the same
`{ verbs, source, learning }` object returned by `resolve()`/cached by
`cachedResult` in `src/dataset/source.ts` — one fetch, one cache, three
fields.
**Warning signs:** Two different network calls to `/content/verbs`, or a
separate `learningCache` module-level variable.

### Pitfall 3: Assuming `payload.learning` validation failure should reject the whole fetch
**What goes wrong:** Making `fetchRemoteVerbs()` throw (and thus fall back
to the *entire* local dataset) when `payload.learning` fails validation,
even though `payload.verbs` is perfectly valid.
**Why it happens:** `fetchRemoteVerbs` currently throws on `verbs`
validation failure, and it's tempting to reuse that same throw-based
pattern uniformly for `learning`.
**How to avoid:** `learning` validation failure must degrade to
`learning: undefined` in the resolved result — it must NOT cause the
`verbs` fetch to fail/fallback. This mirrors the backend's own
`deriveLearningBlock` behavior (`safeParse`, `undefined` on any failure,
independent of the verbs list) and matches EXPL-01's success criterion 2
("Responses that omit `learning`... resolve the dataset exactly as before").
**Warning signs:** A learner sees "Using saved content" (local fallback
pill) triggered purely because the optional `learning` block was malformed,
even though live verb content was fine.

## Code Examples

### Extending `fetchRemoteVerbs` (backward-compatible)
```typescript
// Source: extends src/dataset/remote.ts, following its existing safeParse/
// throw-only-for-verbs pattern; learning failure degrades silently.
import { LearningContentSchema } from "../learning/schema";
import type { LearningContent } from "../learning/types";

export async function fetchRemoteVerbs(): Promise<{
  verbs: Verb[];
  learning: LearningContent | undefined;
}> {
  // ...existing fetch/timeout/verbs-validation logic unchanged...
  const learningResult = LearningContentSchema.safeParse(payload.learning);
  const learning = learningResult.success ? learningResult.data : undefined;

  return { verbs: payload.verbs as Verb[], learning };
}
```
**Caution:** this changes `fetchRemoteVerbs`'s return shape from `Verb[]` to
`{ verbs, learning }` — every existing caller (`src/dataset/source.ts`, and
`__tests__/dataset-remote.test.ts`'s assertions like
`expect(result).toEqual([sampleVerb])`) must be updated in the same task.
Flag this as a breaking-shape change within the phase, not a purely
additive one — the planner should sequence "update `fetchRemoteVerbs`
return shape" and "update all its callers/tests" as one atomic unit of
work, not two separable tasks, to avoid an intermediate broken state.

### Extending `resolveVerbs()` snapshot
```typescript
// Source: extends src/dataset/source.ts
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

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|---------------|--------|
| `resolveVerbs()` returns `{ verbs, source }` | `resolveVerbs()` returns `{ verbs, source, learning }` | This phase | All current/future callers of `resolveVerbs`/`fetchRemoteVerbs` (store, OfflinePill) must accept the wider shape; audit `src/components/OfflinePill.tsx` and `src/store/useQuizStore.ts` for destructuring that would break |
| `Verb` has 4 fields | `Verb` gains optional 5th field `formIndex` | This phase | Purely additive on `Verb`; existing `VerbSchema` gets `formIndex` added as `.optional()` |

**Deprecated/outdated:** none — this is additive to a recently-shipped
(v0.1) architecture, not a replacement of an older pattern.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | No backend-side reference implementation of the explanation-selection/tie-break algorithm exists anywhere in the backend repo (confirmed via grep for `wrongTense`/`selectExplanation`/`explanationFor`/`buildExplanation` across `src/` and `prisma/` — only schema/test/content files matched, no selection logic) | Summary, Pattern 3 | If a hidden reference implementation is later found, the planner should prefer porting it verbatim over this research's derived pseudocode |
| A2 | `correctAnswerReveal` template is confirmed unused by this milestone (CONTEXT.md explicitly says so; backend schema still requires/validates it as present) | Pattern 1 | Low — if a future phase needs it, the schema already validates and stores it, just unused in `explain.ts` |

All other claims in this research are `[VERIFIED]` (via direct reads of the
canonical backend source files and mobile source files) or `[CITED:
CONTEXT.md]` (the D-01 through D-05 decisions, copied/restated, not
re-derived).

## Open Questions (RESOLVED)

Resolved by 15-02-PLAN.md Task 2, which mandates adding `learning: undefined`
to every `mockedResolveVerbs.mockResolvedValue({ verbs, source })` call in
`__tests__/useQuizStore.test.ts` — exactly this section's own recommendation.

1. **Should `formIndex`/`learning` failures be surfaced anywhere in tests
   for `OfflinePill`/`useQuizStore`, given they don't change `source`?**
   - What we know: `learning`/`formIndex` validation failure never changes
     `source` (`"remote"` vs `"local"`) — only `verbs` validation failure
     does that.
   - What's unclear: whether existing `OfflinePill`/`useQuizStore` tests
     have any snapshot/shape assertions on `resolveVerbs()`'s return value
     that would need updating even though their own logic doesn't consume
     `learning`.
   - Recommendation: planner should include a task to grep
     `__tests__/useQuizStore.test.ts` and any `OfflinePill` tests for
     `resolveVerbs`/`{ verbs, source }` destructuring/mocks and update the
     mock shape to include `learning: undefined`, even if the test doesn't
     assert on it, to avoid TypeScript shape mismatches.

## Environment Availability

Skipped — no external tools/services beyond what's already used
(`fetch`, already-installed `zod`); no new environment dependency
introduced by this phase.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest via `jest-expo` preset (already configured) |
| Config file | `package.json`'s `"jest": { "preset": "jest-expo" }` |
| Quick run command | `npm test -- __tests__/learning-explain.test.ts` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|--------------------|-------------|
| EXPL-01 | `learning`/`formIndex` parsed from a well-shaped response, `verbs`/`formIndex` unaffected | unit | `npm test -- __tests__/dataset-remote.test.ts` | ❌ Wave 0 (extend existing file) |
| EXPL-01 | Response omitting `learning` resolves dataset exactly as before, no crash | unit | `npm test -- __tests__/dataset-remote.test.ts` | ❌ Wave 0 (extend existing file) |
| EXPL-01 | `resolveVerbs()` snapshot carries `learning` alongside `verbs`/`source` | unit | `npm test -- __tests__/dataset-source.test.ts` | ❌ Wave 0 (extend existing file) |
| TEST-05 | Correct template per mismatch type (`wrongTense`/`wrongSubject`/`wrongTenseAndSubject`/`generic`, incl. ambiguous-tie → `generic`) | unit | `npm test -- __tests__/learning-explain.test.ts` | ❌ Wave 0 (new file) |
| TEST-05 | Missing-content fallback (no `learning`, no verb entry, zero `formIndex` matches) → `undefined`, no throw | unit | `npm test -- __tests__/learning-explain.test.ts` | ❌ Wave 0 (new file) |
| TEST-05 | Explanation generation never mutates scoring/feedback data | unit | `npm test -- __tests__/learning-explain.test.ts` (assert `selectExplanation` is pure / inputs unchanged) | ❌ Wave 0 (new file) |

### Sampling Rate
- **Per task commit:** `npm test -- __tests__/learning-explain.test.ts` (and whichever `dataset-*.test.ts` file was touched)
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `__tests__/learning-explain.test.ts` — new file, covers TEST-05 (template selection per category + tie-break-to-generic + missing-content fallback + purity)
- [ ] `__tests__/learning-schema.test.ts` — new file (recommended, not explicitly required by TEST-05 but matches `dataset.test.ts`'s existing pattern of a standalone schema-validation test file) covering `LearningContentSchema`/`FormMatchSchema` safeParse success/failure cases
- [ ] Extend `__tests__/dataset-remote.test.ts` — add cases for `payload.learning` present-valid / present-invalid / absent, confirm `verbs` handling unaffected in all three
- [ ] Extend `__tests__/dataset-source.test.ts` — update mock return shapes to `{ verbs, learning }` from `fetchRemoteVerbs`, add assertions that `resolveVerbs()`'s result includes `learning`
- [ ] No new framework install needed — `jest-expo` already covers this

## Security Domain

Not applicable in the traditional sense — no new auth/session/crypto/input
surface. The one relevant control: `learning`/`formIndex` content from
`GET /content/verbs` is untrusted network input and MUST go through
`.safeParse` (never `.parse`) before use, exactly like the existing
`verbs` validation — this is already the established pattern
(`src/dataset/validate.ts`, `src/dataset/remote.ts`) and this research's
Pattern 1/3 follow it. No SQL/DB/auth surface exists on the mobile side.

| ASVS Category | Applies | Standard Control |
|---------------|---------|-------------------|
| V5 Input Validation | yes | Zod `.safeParse` on all `learning`/`formIndex` fields from network response, degrade to `undefined` on failure (never throw/crash) |

## Sources

### Primary (HIGH confidence, direct file reads this session)
- `/Users/avi/portuguese-verb/portuguese-verb-backend/src/routes/content/contracts.ts` — `ContentVerbsResponse`/`ContentVerb` shapes
- `/Users/avi/portuguese-verb/portuguese-verb-backend/src/routes/content/reverseIndexBlock.ts` — `attachFormIndex`, per-verb scope confirmation (D-03 root cause)
- `/Users/avi/portuguese-verb/portuguese-verb-backend/src/routes/content/learning.ts` — `deriveLearningBlock`, `applyIsIrregularOverride` (confirms no selection-algorithm reference implementation exists here)
- `/Users/avi/portuguese-verb/portuguese-verb-backend/prisma/seed-data/reverseIndex.ts` — `FormMatch`, `findFormMatches` (strict `===`, never null, 0/1/2+ matches)
- `/Users/avi/portuguese-verb/portuguese-verb-backend/prisma/seed-data/learningContentSchema.ts` — `buildLearningContentSchema`, template names, interpolation variable list, `z.partialRecord` usage
- `/Users/avi/portuguese-verb/portuguese-verb-backend/prisma/seed-data/learningContent.ts` — real seeded content, template strings, confirms full current coverage
- `/Users/avi/portuguese-verb/portuguese-verb-backend/prisma/seed-data/enums.ts` — `TENSES`/`SUBJECTS` literal match confirmation (identical to mobile's)
- `/Users/avi/portuguese-verb/portuguese-verb-mobile/src/dataset/types.ts`, `source.ts`, `remote.ts`, `validate.ts`
- `/Users/avi/portuguese-verb/portuguese-verb-mobile/src/quiz/types.ts`
- `/Users/avi/portuguese-verb/portuguese-verb-mobile/__tests__/dataset-remote.test.ts`, `dataset-source.test.ts`
- `node_modules/zod/package.json` — confirmed installed version 4.4.3, `z.partialRecord` present

### Secondary (MEDIUM confidence)
None used — all findings verified against direct source reads in both repos.

### Tertiary (LOW confidence)
None.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new dependencies, existing zod version confirmed compatible
- Architecture: HIGH — directly read both backend canonical files and mobile existing patterns
- Pitfalls: HIGH — derived from direct comparison of backend's fail-closed pattern vs. mobile's existing `resolveVerbs`/`fetchRemoteVerbs` throw/catch behavior

**Research date:** 2026-07-20
**Valid until:** 30 days (stable, cross-repo contract already shipped/live on backend; low churn risk)
