---
last_mapped_commit: 94ea956
---

# Testing Patterns

**Analysis Date:** 2026-10-14

## Test Framework

**Runner:**
- Jest 29 (`@types/jest` 29.5.14 pinned in `devDependencies`), run through the `jest-expo` preset (`jest-expo` ~57.0.2).
- Config: `package.json` `"jest": { "preset": "jest-expo" }`. There is no separate `jest.config.*` file.
- Type globals: `tsconfig.json` `"types": ["jest", "node"]`.

**Assertion Library:**
- Jest built-in `expect`. No `@testing-library/react-native`, no Chai, no Vitest.

**Run Commands:**
```bash
npm test                 # jest, runs the whole suite once
npx jest                 # same, direct
npx jest __tests__/quiz-engine.test.ts    # single file
npx jest -t "generate"   # filter by test name
npx jest --watch         # watch mode (not wired into an npm script)
npx jest --coverage      # coverage report (not wired into an npm script; no thresholds)
npm run typecheck        # tsc --noEmit; tests are type-checked too
npm run lint             # expo lint (ESLint, flat config)
```

**Current state (2026-10-14):** 23 suites, 277 tests, all passing (`npx jest`, ~1.3 s). `npm run typecheck` and `npm run lint` are clean.

## Test File Organization

**Location:**
- Almost all tests live in the top-level `__tests__/` directory, separate from source. Jest picks up `__tests__/**` and `*.test.ts(x)` by default.
- Exception: `src/theme/tokens.test.ts` is co-located with `src/theme/tokens.ts`. It is the only test outside `__tests__/`. Put new tests in `__tests__/` unless there is a strong reason to co-locate.
- There are no `*.spec.*` files and no `__mocks__/` directories.

**Naming:**
- `<domain>-<module>.test.ts`, with the dash prefix standing for the source folder:
  - `__tests__/dataset-remote.test.ts` -> `src/dataset/remote.ts`
  - `__tests__/dataset-source.test.ts` -> `src/dataset/source.ts`
  - `__tests__/feedback-submit.test.ts` -> `src/feedback/submit.ts`
  - `__tests__/productFeedback-payload.test.ts` -> `src/productFeedback/payload.ts`
  - `__tests__/quiz-engine.test.ts` -> `src/quiz/engine.ts`
  - `__tests__/useQuizStore.test.ts` -> `src/store/useQuizStore.ts`
  - `__tests__/offline-pill.test.ts` -> `src/components/OfflinePill.tsx` (pure exports only)
- Cross-cutting guards and fixtures use descriptive names: `api-host-guard.test.ts`, `contract-fixture.test.ts`, `smoke.test.ts`.

**Structure:**
```
__tests__/
├── fixtures/
│   └── content-verbs-v0.4.sample.json   # backend /content/verbs contract sample (50 verbs + learning block)
├── api-host-guard.test.ts
├── contract-fixture.test.ts
├── dataset.test.ts / dataset-remote.test.ts / dataset-source.test.ts
├── feedback-payload.test.ts / feedback-schema.test.ts / feedback-submit.test.ts
├── productFeedback-payload.test.ts / productFeedback-schema.test.ts / productFeedback-submit.test.ts
├── learning-explain.test.ts / learning-schema.test.ts
├── offline-pill.test.ts
├── quiz-choice-style.test.ts / quiz-engine.test.ts / quiz-labels.test.ts
├── quiz-random.test.ts / quiz-scoring.test.ts / quiz-share.test.ts
├── smoke.test.ts
└── useQuizStore.test.ts
src/theme/tokens.test.ts          # co-located exception
```

**Coverage by area (what exists):**
- Dataset: validation of the bundled dataset (`dataset.test.ts`), remote fetch HTTP and validation paths (`dataset-remote.test.ts`), resolution and background refresh (`dataset-source.test.ts`), backend contract fixture (`contract-fixture.test.ts`).
- Quiz: generation, filters, distractor tiers, and sampling (`quiz-engine.test.ts`, 23 tests), shuffle determinism (`quiz-random.test.ts`), scoring, labels, share text, choice-style mapping.
- Store: session start, selection lock, advance, reset, superseded-call guard, error mapping (`useQuizStore.test.ts`).
- Feedback and product feedback: payload building, Zod schema acceptance and rejection, submit status mapping, timeout behaviour.
- Learning content: explanation selection (`learning-explain.test.ts`, 23 tests), schema.
- Guards: no legacy backend host in `src/`, `scripts/`, `app/`, and config files; `scripts/preflight.ts` `BASE_URL` matches `API_BASE_URL` (`api-host-guard.test.ts`).

## Test Structure

**Suite organization:**
Tests are plain `describe`/`it` blocks with no `beforeAll` for pure modules. Nested `describe` groups by function, as in `__tests__/quiz-engine.test.ts`:

```typescript
import { generate, sampleTriples, buildQuestion, pickDistractors } from "../src/quiz/engine";
import { InsufficientVerbsError } from "../src/quiz/types";
import { verbs } from "../src/dataset/verbs";

describe("quiz engine", () => {
  describe("generate", () => {
    it("filter: restricts questions to the requested tense and excludes irregular verbs when regular_only", () => {
      const session = generate({ tenses: ["future"], verbMode: "regular_only" }, Math.random);
      expect(session.questions).toHaveLength(10);
      session.questions.forEach((q) => {
        expect(q.tense).toBe("future");
        const verb = verbs.find((v) => v.verb === q.verb);
        expect(verb).toBeDefined();
        expect(verb!.isIrregular).toBe(false);
      });
    });
  });
});
```

**Test naming:**
- Full-sentence `it(...)` titles, lowercase after an optional category prefix: `"filter: restricts questions ..."`, `"filter (mixed): allows irregular verbs ..."`. Describe the observable behaviour and the condition, e.g. `"resolves { verbs, learning: undefined } when payload.learning is absent"`, `"rejects when response.ok is false (e.g. HTTP 500)"`.
- Pin exact contracts in titles where they matter: `"locks the exact D-03 copy string"` (`__tests__/offline-pill.test.ts`), `"colors export the exact Lafa palette"` (`src/theme/tokens.test.ts`).

**Patterns:**
- Setup: `beforeEach` resets shared state. In `__tests__/useQuizStore.test.ts`: `useQuizStore.getState().reset(); mockedResolveVerbs.mockReset(); mockedResolveVerbs.mockResolvedValue({ verbs: localVerbs, source: "local", learning: undefined });`.
- Teardown: restore globals and timers in `afterEach`. In `__tests__/feedback-submit.test.ts`: `globalThis.fetch = originalFetch; jest.useRealTimers(); jest.clearAllMocks();`.
- Module-state isolation: `jest.resetModules()` in `afterEach`, then `require()` the module inside each test, in `__tests__/dataset-source.test.ts`. Required because `src/dataset/source.ts` memoizes results at module scope (`cachedResult`, `settledSource`, `refreshInFlight`). Use this pattern for any module with module-level caches or singletons.
- Assertions: `toEqual` for objects and arrays, `toBe` for primitives and identity, `toHaveLength`, `toBeDefined`, `toBeUndefined`, `toThrow` / `rejects.toThrow`, `toHaveBeenCalledWith`, `not.toBe(input)` to assert non-mutation.
- Table-style cases use `it.each` in `__tests__/api-host-guard.test.ts` (`it.each(["src", "scripts", "app"])("no Oregon host in %s/", ...)`).
- Guard tests read real files with `fs` and `path` relative to `__dirname` (`api-host-guard.test.ts`, `contract-fixture.test.ts`).

## Mocking

**Framework:** Jest's built-in mocking (`jest.fn`, `jest.mock`, `jest.spyOn`, fake timers). No mocking library.

**Deterministic randomness (preferred seam):**
Do not mock `Math.random`. Pass a deterministic function into the injectable parameter used by production code:
```typescript
function mockRandom(sequence: number[]): () => number {
  let i = 0;
  return () => sequence[i++ % sequence.length]!;
}

const result = shuffle([1, 2, 3, 4, 5], mockRandom([0.9, 0.1, 0.5, 0.0]));
expect(result).toEqual([3, 4, 2, 1, 5]);
```
This helper is defined locally in `__tests__/quiz-random.test.ts` and `__tests__/quiz-engine.test.ts`. The `!` is the accepted `noUncheckedIndexedAccess` assertion in tests.

**Global `fetch` replacement:**
Network tests replace `globalThis.fetch` with a `jest.fn` that resolves a minimal `Response`-shaped object, cast through `unknown`:
```typescript
globalThis.fetch = jest.fn().mockResolvedValue({
  ok: true,
  status: 201,
  json: async () => persistedRow,
}) as unknown as typeof fetch;
```
Restore in `afterEach` (`globalThis.fetch = originalFetch`). Pattern used in `__tests__/feedback-submit.test.ts`, `__tests__/productFeedback-submit.test.ts`, `__tests__/dataset-remote.test.ts`, `__tests__/contract-fixture.test.ts`.

Mocks are minimal: include only the fields the code reads (`ok`, `status`, `json`). Do not build full `Response` objects.

**Abort and timeout tests:**
Use fake timers and a fetch mock that honours `signal`:
```typescript
jest.useFakeTimers();
globalThis.fetch = jest.fn().mockImplementation(
  (_url: string, options?: { signal?: AbortSignal }) =>
    new Promise((_resolve, reject) => {
      options?.signal?.addEventListener("abort", () => reject(new Error("AbortError")));
    }),
) as unknown as typeof fetch;
// then jest.advanceTimersByTime(...) past TIMEOUT_MS and assert the rejection or network-error status
```
`jest.advanceTimersByTime` is used six times across the timeout tests in `__tests__/dataset-remote.test.ts` and `__tests__/feedback-submit.test.ts`.

**Module mocks:**
- Automock a whole module with `jest.mock(path)`, then drive it with `jest.MockedFunction` typing:
  ```typescript
  jest.mock("../src/dataset/source");
  const mockedResolveVerbs = resolveVerbs as jest.MockedFunction<typeof resolveVerbs>;
  mockedResolveVerbs.mockResolvedValue({ verbs: localVerbs, source: "local", learning: undefined });
  ```
  Used in `__tests__/useQuizStore.test.ts` (source module) and `__tests__/dataset-source.test.ts` (remote module, accessed via `require` after `jest.resetModules()`).
- Spy on a single export to observe or force behaviour, and restore it:
  ```typescript
  const spy = jest.spyOn(engine, "generate").mockImplementationOnce(() => { throw new Error("boom"); });
  await expect(useQuizStore.getState().startQuiz(VALID_OPTIONS)).rejects.toThrow("boom");
  ```
  Restore with `spy.mockRestore()` when the spy persists beyond one assertion (`__tests__/useQuizStore.test.ts`).
- `jest.clearAllMocks()` in `afterEach` is the standard reset; it is used in every mock-heavy file.

**What to mock:**
- Network (`fetch`) and the remote dataset module when testing source resolution.
- Other store-layer dependencies when testing store transitions (`resolveVerbs`, `generate`).
- Timers, only for timeout and abort behaviour.

**What NOT to mock:**
- Pure domain logic: `src/quiz/*`, `src/dataset/validate.ts`, `src/feedback/schema.ts`, `src/learning/explain.ts`. Test these directly with real inputs.
- Zod schemas. Feed real payloads, and assert `.safeParse(...).success` or the `valid`/`errors` return.
- The bundled dataset (`src/dataset/verbs.ts`). Tests import it directly, and it is the reference for "real" conjugations.
- The backend contract fixture. Use `__tests__/fixtures/content-verbs-v0.4.sample.json` as-is, rather than hand-building verb objects.

**React components are not rendered in tests.** There is no `react-test-renderer` or `@testing-library/react-native`. Component behaviour is covered by extracting logic into pure modules (for example `resolveChoiceStyle` in `src/quiz/choiceStyle.ts`, `isLocalSource` in `src/components/OfflinePill.tsx`, `buildFeedbackPayload` in `src/feedback/payload.ts`) and testing those. Keep it that way: put new logic in a pure module under `src/` and test that module.

## Fixtures and Factories

**Inline sample objects:**
Each test file defines its own sample data at file top, typed with the domain type. For example, `__tests__/dataset-remote.test.ts` defines `const sampleVerb: Verb = { ... }` and `const sampleLearningContent: LearningContent = { ... }`. Keep sample verbs realistic (full 4-tense x 6-subject conjugations) so validation passes.

**Shared fixture file:**
- `__tests__/fixtures/content-verbs-v0.4.sample.json` is the backend `/content/verbs` response sample (50 verbs plus a `learning` block at `version: 1`). It is loaded with `fs.readFileSync` and `JSON.parse` in `__tests__/contract-fixture.test.ts`.
- Update it only when the backend contract changes, and keep accents and tied forms (`falam` appears for both `voces` and `eles_elas`) byte-for-byte. The test asserts `falar.formIndex.falam` has length 2.

**Real dataset:**
- `src/dataset/verbs.ts` (the bundled fallback) is imported directly by tests and used as the `verbs` argument for the engine. Sanity-check it in `__tests__/dataset.test.ts`.

**Location:**
- Fixtures: `__tests__/fixtures/`.
- Sample objects: inline in each test file. There is no shared factory module; if a third file needs the same verb, move it to `__tests__/fixtures/` rather than duplicating a third time.

## Coverage

**Requirements:** None enforced. There are no `coverageThreshold` settings in the Jest config and no CI gate.

**View coverage:**
```bash
npx jest --coverage
```
No coverage script is defined in `package.json`. Add one only if the team decides to enforce a threshold.

## Test Types

**Unit tests:**
- The whole suite is unit tests. Each file tests one module's exported functions or one store, with real inputs and injected dependencies.
- Pure-function checks dominate: `quiz-*`, `dataset-*`, `feedback-*`, `productFeedback-*`, `learning-*`.

**Integration tests:**
- No dedicated integration layer. The closest are `__tests__/contract-fixture.test.ts` (fixture through validation and the fetch path) and `__tests__/useQuizStore.test.ts` (store through engine, with the source mocked).
- Backend HTTP is never called in tests. Network is always replaced with a mocked `fetch`.

**Live smoke checks (not Jest):**
- `npm run preflight` runs `scripts/preflight.ts`, which hits the live backend (`/health`, `/content/verbs`, `/feedback`, `/product-feedback`) with the app's own timeout budgets. It is a manual dev tool, not part of `npm test`. It writes a test feedback row to the live backend, so run it deliberately.
- `npm run validate-brand` and `npm run generate-assets` (`scripts/validate-brand.ts`, `scripts/generate-brand-assets.ts`) check and regenerate brand assets with `sharp` and `@resvg/resvg-js`. They are not tests and are not run by Jest.

**E2E tests:**
- Not used. No Detox, Maestro, or Playwright setup in the repo. Device verification is manual (screenshots live under `store/screenshots/`).

## Common Patterns

**Async testing:**
```typescript
it("resolves { verbs, learning: undefined } when payload.learning is absent", async () => {
  globalThis.fetch = jest.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ verbs: [sampleVerb] }) }) as unknown as typeof fetch;
  const result = await fetchRemoteVerbs();
  expect(result).toEqual({ verbs: [sampleVerb], learning: undefined });
});
```
Use `async` test functions and `await`. For rejections, use `await expect(promise).rejects.toThrow()` (`__tests__/dataset-remote.test.ts`), not a try/catch.

**Error testing:**
```typescript
expect(() => sampleTriples(pool, 10, mockRandom([0.5]))).toThrow(InsufficientVerbsError);
```
- Assert the class with `toThrow(ErrorClass)` when the class is the contract (`InsufficientVerbsError`).
- Assert the message with `toThrow("boom")` (substring match) when the message is the contract.
- For result unions, assert the full object: `expect(result).toEqual({ status: "validation-error" })`. Asserting the full object confirms that extra fields (such as the 400 `fields` body) are not leaked, as in `__tests__/feedback-submit.test.ts`.

**Zod schema testing:**
- Valid cases use `safeParse(...)` and assert `.success` true.
- Invalid cases assert `.success` false, and for enum fields, cover each rejected literal. See `__tests__/feedback-schema.test.ts`, `__tests__/productFeedback-schema.test.ts` (13 tests), `__tests__/learning-schema.test.ts`.

**Deterministic quiz tests:**
- Use `mockRandom([...])` sequences for shuffle and distractor order. Use `Math.random` (default) only when the assertion holds for any order, such as filter properties (`session.questions.forEach(...)`).

**Contract and host guards:**
- `__tests__/api-host-guard.test.ts` fails the suite if the retired backend host appears in `src/`, `scripts/`, `app/`, `app.json`, `package.json`, or `eas.json`. Do not write the host literal into a test or source file; `api-host-guard.test.ts` builds it by concatenation for this reason.
- `__tests__/contract-fixture.test.ts` asserts the fixture's verb count (50) and learning `version` (1), then runs it through `validateDataset`, `LearningContentSchema`, and `fetchRemoteVerbs`.

**Test authoring checklist (derived from the existing suite):**
1. Put the test in `__tests__/<domain>-<module>.test.ts` (or `src/` only if co-locating a token-level test).
2. Import from the source file without a `.ts` extension.
3. Inject randomness with `mockRandom` and dependencies with parameters before reaching for `jest.mock`.
4. For module-level caches, `jest.resetModules()` and `require()` inside each test.
5. For `fetch`, replace `globalThis.fetch` with a cast `jest.fn`, and restore it in `afterEach`.
6. For timeouts, use `jest.useFakeTimers()` and restore with `jest.useRealTimers()`.
7. Run `npx jest` and `npm run typecheck`. Both must pass before commit.

---

*Testing analysis: 2026-10-14*
