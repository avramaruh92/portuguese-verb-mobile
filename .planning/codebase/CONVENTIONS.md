# Coding Conventions

**Analysis Date:** 2026-07-18

## Naming Patterns

**Files:**
- Domain source files: lowercase, no dashes, purpose-named — `types.ts`, `validate.ts`, `source.ts`, `remote.ts`, `verbs.ts` (`src/dataset/*`), `schema.ts`, `payload.ts`, `submit.ts`, `reasons.ts`, `types.ts` (`src/feedback/*`), `engine.ts`, `scoring.ts`, `share.ts`, `labels.ts`, `random.ts`, `types.ts` (`src/quiz/*`).
- React components: `PascalCase.tsx` — `src/components/OfflinePill.tsx`, `src/feedback/ReportFeedbackModal.tsx`.
- Store files: `useXStore.ts` — `src/store/useQuizStore.ts`.
- Route files (Expo Router, `app/`): lowercase matching the route — `app/index.tsx`, `app/quiz.tsx`, `app/results.tsx`, `app/_layout.tsx`.
- Test files live in a top-level `__tests__/` directory (not co-located), named `<domain>-<module>.test.ts`, e.g. `dataset-remote.test.ts`, `feedback-submit.test.ts`, `quiz-engine.test.ts`, `offline-pill.test.ts` — the dash-joined prefix mirrors the source subfolder + filename, not the exact path.
- One exception: `src/theme/tokens.test.ts` is co-located next to `tokens.ts` inside `src/`, not under `__tests__/`.

**Functions:**
- `camelCase`, verb-first for actions: `generate`, `sampleTriples`, `buildQuestion`, `pickDistractors`, `score`, `shuffle`, `validateDataset`, `buildFeedbackPayload`, `submitFeedback`, `fetchRemoteVerbs`, `resolveVerbs`, `buildShareMessage`, `isLocalSource`.
- Zustand store actions use bare verbs as object properties: `startQuiz`, `selectAnswer`, `advance`, `reset` (`src/store/useQuizStore.ts`).

**Variables:**
- `camelCase` throughout; constants that are truly fixed values use `SCREAMING_SNAKE_CASE`: `QUESTIONS_PER_SESSION`, `DISTRACTOR_COUNT` (`src/quiz/engine.ts`), `CONTENT_ENDPOINT`, `TIMEOUT_MS` (`src/dataset/remote.ts`, `src/feedback/submit.ts`), `FEEDBACK_ENDPOINT`, `INSUFFICIENT_VERBS_MESSAGE` (`src/store/useQuizStore.ts`), `OFFLINE_PILL_TEXT` (`src/components/OfflinePill.tsx`).
- Domain enum-like arrays are `SCREAMING_SNAKE_CASE` and typed `readonly T[]`: `TENSES`, `SUBJECTS` (`src/dataset/types.ts`).

**Types:**
- `PascalCase` for interfaces, type aliases, and classes: `Verb`, `Tense`, `Subject`, `Triple`, `Question`, `QuizSession`, `GenerateOptions`, `FeedbackPayload`, `FeedbackReason`, `SubmitResult`.
- Custom error classes extend `Error` and set `this.name` explicitly: `InsufficientVerbsError` (`src/quiz/types.ts`) takes typed public readonly constructor params (`eligibleCount`, `required`) rather than a generic message-only error.
- Union string literal types are preferred over `enum` everywhere (`Tense`, `Subject`, `QuizStatus`, `ModalState`, `SubmitResult["status"]`).

## Code Style

**Formatting:**
- No dedicated `.prettierrc` found in the repo root; formatting is consistent (2-space indent, double quotes, trailing commas in multiline literals) but not enforced by a visible formatter config — likely inherited from editor defaults or Expo's template.

**Linting:**
- `package.json` defines `"lint": "expo lint"` (Expo's built-in ESLint wrapper, `eslint-config-expo`). No standalone `.eslintrc*` or `eslint.config.*` file exists in the repo root — the project relies entirely on Expo's default lint config rather than a customized ruleset. Do not assume any project-specific ESLint rules exist beyond Expo's defaults.

## Import Organization

**Order (observed convention, not enforced by tooling):**
1. External packages (`react`, `react-native`, `zustand`, `zod`) — always first.
2. Relative imports, ordered roughly by proximity: sibling-domain types before same-file types, e.g. `src/quiz/engine.ts` imports `../dataset/types` and `../dataset/verbs` before its own `./random` and `./types`.
3. `import type { ... }` is used consistently to separate type-only imports from value imports, even inline alongside value imports on the same source (e.g. `src/dataset/source.ts`: `import { verbs as localVerbs } from "./verbs"; import { fetchRemoteVerbs } from "./remote"; import type { Verb } from "./types";`).

**Path Aliases:**
- None observed — all cross-module imports use relative paths (`../dataset/types`, `../quiz/engine`), never a `@/` or `~/` alias. No `paths` mapping is configured in `tsconfig.json`.

## TypeScript Strictness

`tsconfig.json` extends `expo/tsconfig.base` and explicitly turns on:
```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "types": ["jest"]
  }
}
```
- `noUncheckedIndexedAccess` means every array/record index access is typed as possibly `undefined`. The codebase handles this two ways:
  - Non-null assertion with an explanatory comment when the invariant is provably safe, e.g. `src/quiz/random.ts`: `[result[i], result[j]] = [result[j]!, result[i]!]; // noUncheckedIndexedAccess-safe: i and j are always valid indices by the loop invariant`.
  - Explicit `?? default` fallback where the value may legitimately be absent, e.g. `src/store/useQuizStore.ts`: `verbCounts.set(t.verb, (verbCounts.get(t.verb) ?? 0) + 1)` (test helper) and `mockRandom` in test files: `sequence[i++ % sequence.length]!`.
- Prefer this pattern (comment-justified `!` or `??` fallback) over disabling `noUncheckedIndexedAccess` or sprinkling unchecked casts.

## Zod Usage Patterns

- Zod schemas are the single source of truth for runtime validation and are always paired with a `z.infer<typeof schema>` derived type, never a hand-written parallel interface:
  - `src/feedback/schema.ts` defines `feedbackPayloadSchema`; `src/feedback/types.ts` derives `export type FeedbackPayload = z.infer<typeof feedbackPayloadSchema>;`.
  - `src/dataset/validate.ts` builds `VerbSchema` compositionally from smaller nested schemas (`SubjectConjugationsSchema` → `TenseConjugationsSchema` → `VerbSchema`), mirroring the nested `Record<Tense, Record<Subject, string>>` shape in `src/dataset/types.ts`.
- Enum-shaped string unions are validated with `z.enum(...)`, sourced from the same `TENSES`/`SUBJECTS` runtime arrays used elsewhere (not re-declared): `z.enum(TENSES as unknown as [Tense, ...Tense[]])` in `src/feedback/schema.ts` — this keeps the Zod enum and the TypeScript union type locked to one array literal.
- Validation entry points return a `{ valid: boolean; errors: string[] }` shape rather than throwing, when validating a collection (`validateDataset` in `src/dataset/validate.ts`) — errors are accumulated per-item with a `path.join(".")` message via `.safeParse`, not `.parse`.
- Where failure should short-circuit a caller (e.g. remote fetch), `.safeParse` results are still checked explicitly and converted into a thrown `Error` with a descriptive message (`src/dataset/remote.ts`), not left as an unchecked `.parse()` throw.

## Error Handling

- Domain-specific error classes are used sparingly and only when callers need to branch on the failure mode: `InsufficientVerbsError` in `src/quiz/types.ts` is caught specifically in `src/store/useQuizStore.ts`'s `startQuiz` via `instanceof` and translated into a store `errorMessage`; other errors are re-thrown, not swallowed.
- Network/IO functions never throw raw exceptions to their callers — they return a tagged result union instead: `SubmitResult` (`{ status: "success" | "validation-error" | "server-error" | "network-error" }`) from `submitFeedback` (`src/feedback/submit.ts`), determined by explicit `response.status` branching (`201` / `400` / else) wrapped in `try/catch/finally` with an `AbortController`-based timeout.
- `fetchRemoteVerbs` (`src/dataset/remote.ts`) is the one exception that throws (not a result union) — callers (`src/dataset/source.ts`'s `resolve()`) catch it with a bare `try { await fetchRemoteVerbs() } catch { return local fallback }`, treating "throws" as "use the offline dataset" at the source-resolution layer.

## Async/Concurrency Patterns

- Async work that can be superseded by a newer call uses an incrementing token guard rather than cancellation: `src/store/useQuizStore.ts`'s `startQuiz` increments a module-level `startToken`, checks `token !== startToken` after each `await`, and bails out silently if superseded — documented inline with a comment explaining the double-tap race it prevents.
- `AbortController` + `setTimeout`/`clearTimeout` is the standard timeout pattern for both outbound fetches, always in a `try { ... } finally { clearTimeout(timeoutId) }` block: `src/dataset/remote.ts` (`TIMEOUT_MS = 90_000`) and `src/feedback/submit.ts` (`TIMEOUT_MS = 90_000`).
- Dataset resolution is memoized at module scope via a cached `Promise` (`cachedResult` in `src/dataset/source.ts`), with a separate `prefetch()` export to warm the cache without awaiting it — call `prefetch()` early (e.g. app boot) and `resolveVerbs()` wherever the resolved value is needed; both share the same underlying promise.

## Function Design

- Small, single-purpose functions — most domain logic files (`src/quiz/engine.ts`, `src/dataset/validate.ts`) expose several narrow named exports (`generate`, `sampleTriples`, `buildQuestion`, `pickDistractors`) rather than one large function, specifically so each can be unit-tested in isolation (confirmed by `__tests__/quiz-engine.test.ts` testing each independently).
- Pure functions take their randomness/dependencies as injectable parameters with `Math.random` as the production default: `generate(options, random: () => number = Math.random, verbs: Verb[] = localVerbs)` (`src/quiz/engine.ts`) — this is the standard seam for deterministic testing throughout the quiz domain (see `mockRandom` helper in tests).

## Module Design

**Domain folders under `src/`:**
- `src/dataset/` — verb data + validation + source resolution (local vs. remote fallback).
- `src/quiz/` — quiz generation, scoring, sharing, label formatting; pure logic only, no React.
- `src/feedback/` — feedback payload building, Zod schema, submission, plus the one feedback-specific component (`ReportFeedbackModal.tsx`).
- `src/components/` — cross-domain shared UI (`OfflinePill.tsx`).
- `src/theme/` — design tokens (`tokens.ts`) consumed by components via named imports (`colors`, `spacing`, `radius`, `typography`), never inline hex/px literals in new domain components (though `ReportFeedbackModal.tsx` predates/bypasses this and still hardcodes literals directly in its `StyleSheet.create` — treat `theme/tokens.ts` as the convention to follow going forward, not a pattern already fully adopted everywhere).
- `src/store/` — Zustand stores, one file per store.

**Per-domain module structure:** each domain folder (`dataset`, `feedback`, `quiz`) has a `types.ts` holding its interfaces/type aliases/unions, with sibling files implementing logic against those types (e.g. `dataset/types.ts` + `dataset/validate.ts` + `dataset/source.ts` + `dataset/remote.ts` + `dataset/verbs.ts`; `feedback/types.ts` + `feedback/schema.ts` + `feedback/payload.ts` + `feedback/submit.ts` + `feedback/reasons.ts`). New domain logic should follow this split: define shapes in `types.ts`, keep one concern per additional file.

**Exports:** always named exports (`export function`, `export const`, `export interface`/`type`) — no default exports observed anywhere in `src/`. Follow this for new modules.

**Barrel files:** none observed — every import reaches into the specific file (`../dataset/types`, `../quiz/engine`), never a folder-level `index.ts` re-export.

---

*Convention analysis: 2026-07-18*
