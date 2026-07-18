# Testing Patterns

**Analysis Date:** 2026-07-18

## Test Framework

**Runner:**
- Jest via the `jest-expo` preset (`jest-expo@~57.0.1`), configured entirely in `package.json`:
  ```json
  "jest": {
    "preset": "jest-expo"
  }
  ```
  No standalone `jest.config.js`/`.ts` file exists — the preset is declared inline. `jest-expo` handles all RN/Expo module transforms; `@types/jest@29.5.14` is a devDependency and `"types": ["jest"]` is set in `tsconfig.json` for global type support (`describe`, `it`, `expect`, `jest.*`) without importing them per file.

**Assertion Library:**
- Jest's built-in `expect` — no `@testing-library/jest-dom` or custom matchers observed.

**Run Commands:**
```bash
npm test           # runs `jest` (package.json "test" script)
npm run typecheck  # tsc --noEmit — run alongside tests, not part of the jest command itself
```
No watch-mode or coverage script is defined in `package.json`; `jest`'s own CLI flags (`--watch`, `--coverage`) would need to be passed manually if needed.

## Test File Organization

**Location:**
- Nearly all tests live in a single top-level `__tests__/` directory at the repo root (sibling to `src/`), NOT co-located with source files. This is a deliberate, consistent choice across 13 of 14 test files.
- One exception: `src/theme/tokens.test.ts` is co-located directly next to `src/theme/tokens.ts` inside `src/` — the only source-adjacent test in the repo.

**Naming:**
- `<domain>-<module>.test.ts` — the domain folder name and the source filename are dash-joined, not path-mirrored: `dataset-remote.test.ts` (tests `src/dataset/remote.ts`), `dataset-source.test.ts` (tests `src/dataset/source.ts`), `dataset.test.ts` (tests `src/dataset/verbs.ts` + `src/dataset/validate.ts` together — the dataset as a whole), `feedback-payload.test.ts`, `feedback-schema.test.ts`, `feedback-submit.test.ts`, `quiz-engine.test.ts`, `quiz-labels.test.ts`, `quiz-random.test.ts`, `quiz-scoring.test.ts`, `quiz-share.test.ts`, `offline-pill.test.ts` (tests `src/components/OfflinePill.tsx`), `useQuizStore.test.ts` (tests `src/store/useQuizStore.ts`, camelCase matching the store's own filename rather than the dash convention), plus a standalone `smoke.test.ts` with no corresponding source file (a trivial "the preset boots" sanity check: `expect(1 + 1).toBe(2)`).
- New test files should follow this same `<domain>-<module>.test.ts` naming and go in `__tests__/`, importing the module under test via `../src/<domain>/<module>`.

**Structure:**
```
__tests__/
├── dataset-remote.test.ts
├── dataset-source.test.ts
├── dataset.test.ts
├── feedback-payload.test.ts
├── feedback-schema.test.ts
├── feedback-submit.test.ts
├── offline-pill.test.ts
├── quiz-engine.test.ts
├── quiz-labels.test.ts
├── quiz-random.test.ts
├── quiz-scoring.test.ts
├── quiz-share.test.ts
├── smoke.test.ts
└── useQuizStore.test.ts
src/theme/tokens.test.ts        # only co-located exception
```

## Test Structure

**Suite organization** — one top-level `describe` per module, nested `describe`s per function/behavior group, plain `it(...)` blocks with long, sentence-style descriptions that often name the specific bug/decision being pinned down (e.g. `"same-verb repeat (D-07): sampleTriples does not dedupe by verb alone, only by the full triple"`, referencing decision IDs from planning docs):

```typescript
// __tests__/quiz-engine.test.ts
describe("quiz engine", () => {
  describe("generate", () => {
    it("filter: restricts questions to the requested tense and excludes irregular verbs when toggled off", () => {
      const session = generate({ tenses: ["future"], includeIrregular: false }, Math.random);
      expect(session.questions).toHaveLength(10);
      ...
    });
  });
  describe("sampleTriples", () => { ... });
  describe("buildQuestion / pickDistractors", () => { ... });
});
```

**Patterns:**
- Setup: inline per-test, no shared `beforeAll`/module-level fixtures in most files; `useQuizStore.test.ts` and network tests use `beforeEach`/`afterEach` for store reset and fetch mock restoration.
- Teardown: network-mocking tests always restore global state in `afterEach`:
  ```typescript
  // __tests__/feedback-submit.test.ts, __tests__/dataset-remote.test.ts
  afterEach(() => {
    globalThis.fetch = originalFetch;
    jest.useRealTimers();
    jest.clearAllMocks();
  });
  ```
- Assertion style: prefers whole-object `toEqual`/`toMatchObject`-style equality over many narrow assertions when checking result shapes (e.g. `expect(result).toEqual({ status: "success", data: persistedRow })`), and uses `toThrow()`/`.rejects.toThrow()` for error-path checks rather than manual try/catch except when asserting on specific error instance properties (see `InsufficientVerbsError` test below).

## Mocking

**Framework:** Jest's built-in `jest.fn()`, `jest.mock()`, `jest.spyOn()` — no separate mocking library (no `msw`, no `nock`).

**Patterns:**
```typescript
// Direct global fetch stubbing (network boundary), __tests__/feedback-submit.test.ts:
globalThis.fetch = jest.fn().mockResolvedValue({
  status: 201,
  json: async () => persistedRow,
}) as unknown as typeof fetch;

// Fake timers to assert on the 90s AbortController timeout without a real wait:
jest.useFakeTimers();
globalThis.fetch = jest.fn().mockImplementation(
  (_url, options) => new Promise((_resolve, reject) => {
    options?.signal?.addEventListener("abort", () => reject(new Error("AbortError")));
  }),
) as unknown as typeof fetch;
const resultPromise = submitFeedback(samplePayload);
jest.advanceTimersByTime(90_000);
const result = await resultPromise;

// Module-level mock + spyOn for store tests, __tests__/useQuizStore.test.ts:
jest.mock("../src/dataset/source");
const mockedResolveVerbs = resolveVerbs as jest.MockedFunction<typeof resolveVerbs>;
...
const spy = jest.spyOn(engine, "generate").mockImplementationOnce(() => { throw new Error("boom"); });
```

**What to Mock:**
- Network boundaries only: `globalThis.fetch` for both `fetchRemoteVerbs` (`dataset-remote.test.ts`) and `submitFeedback` (`feedback-submit.test.ts`).
- Cross-module dependencies when testing a consumer in isolation: `useQuizStore.test.ts` mocks the entire `../src/dataset/source` module (`resolveVerbs`) so store tests don't depend on real dataset resolution/remote fetch timing, and spies on `engine.generate` to force an error path.
- Randomness: quiz engine tests inject a deterministic `mockRandom(sequence: number[])` helper (redefined locally in `quiz-engine.test.ts`) rather than mocking `Math.random` globally — this relies on `generate`'s injectable `random` parameter (see CONVENTIONS.md's Function Design section).

**What NOT to Mock:**
- Pure domain logic is never mocked when it's the thing under test — `verbs` (the real 50-verb dataset from `src/dataset/verbs.ts`) is used directly and unmocked in `quiz-engine.test.ts` and `dataset.test.ts` for realistic integration-style coverage, alongside smaller hand-built fixture verbs for edge cases (collision/backfill scenarios).
- Zustand's `create` is not mocked — `useQuizStore.test.ts` exercises the real store instance via `useQuizStore.getState()`, only mocking its external dependency (`resolveVerbs`).

## Fixtures and Factories

**Test data:** No shared fixture files or factory functions — verb fixtures are hand-written inline per test file as plain object literals conforming to the `Verb` type, e.g.:
```typescript
// __tests__/quiz-engine.test.ts, __tests__/dataset-remote.test.ts, __tests__/useQuizStore.test.ts
const sampleVerb: Verb = {
  verb: "falar",
  translation: "to speak",
  isIrregular: false,
  conjugations: { present_indicative: { eu: "falo", tu: "falas", ... }, ... },
};
```
Each test file that needs custom verbs defines its own local constants (`simpleVerbs`, `collidingVerb`, `sampleRemoteVerb`, `sampleVerb`) rather than importing from a shared `__fixtures__` directory — there is no such directory in the repo. When adding new tests needing verb data, either reuse the real `verbs` array from `src/dataset/verbs.ts` (for realistic-scale tests) or define a local inline fixture (for targeted edge cases), matching this file-local convention.

**Location:** Inline in each test file; no `__fixtures__/`, `__mocks__/`, or `test-utils/` directory exists.

## Coverage

**Requirements:** No coverage threshold or `--coverage` script configured in `package.json`. No coverage badge/config found.

**View Coverage:**
```bash
npx jest --coverage
```
(Not a predefined npm script — would need to be run ad hoc.)

## Test Types

**Unit Tests:** The entire suite is unit-level — plain Jest tests importing TS/TSX modules directly with zero rendering. Even the one component test (`offline-pill.test.ts`) only imports and tests its two named non-JSX exports (`isLocalSource`, `OFFLINE_PILL_TEXT`), never rendering the `OfflinePill` component itself.

**Integration Tests:** None distinct from unit tests — `useQuizStore.test.ts` exercises the real Zustand store plus the real `generate`/`shuffle` engine end-to-end (only the network-adjacent `resolveVerbs` is mocked), which is the closest thing to an integration test in the suite, but it's still a plain Jest test file with no separate test-type distinction/tag/directory.

**E2E Tests:** Not used — no Detox, Maestro, or Playwright config found.

**Component/RTL Tests:** `@testing-library/react-native` is NOT installed (absent from `package.json` dependencies) and not used anywhere. All component logic in `src/components/OfflinePill.tsx` and `src/feedback/ReportFeedbackModal.tsx` that needs test coverage is tested by extracting and exporting pure helper functions/constants from the component file (e.g. `isLocalSource`, `OFFLINE_PILL_TEXT` exported alongside the `OfflinePill` component) and unit-testing those directly, rather than rendering the component tree. `ReportFeedbackModal.tsx` currently has no exported pure helpers and no corresponding test file — follow the `OfflinePill` pattern (extract testable pure logic as named exports) if adding coverage for it.

## Common Patterns

**Async Testing:**
```typescript
// Standard async/await with real store/engine calls, __tests__/useQuizStore.test.ts
it("startQuiz with valid options transitions to in-progress with a 10-question session", async () => {
  await useQuizStore.getState().startQuiz(VALID_OPTIONS);
  const state = useQuizStore.getState();
  expect(state.status).toBe("in-progress");
  expect(state.session?.questions.length).toBe(10);
});

// Promise-returning test (no async fn) also used to confirm an API contract:
it("startQuiz returns a Promise that callers can await", () => {
  const result = useQuizStore.getState().startQuiz(VALID_OPTIONS);
  expect(result).toBeInstanceOf(Promise);
  return result;
});
```

**Error Testing:**
```typescript
// Simple throw assertion:
expect(() => sampleTriples(tinyPool, 10, mockRandom([0]))).toThrow(InsufficientVerbsError);

// Manual try/catch when asserting on specific typed error properties beyond message:
try {
  sampleTriples(tinyPool, 10, mockRandom([0]));
  throw new Error("expected sampleTriples to throw");
} catch (err) {
  expect(err).toBeInstanceOf(InsufficientVerbsError);
  expect((err as InstanceType<typeof InsufficientVerbsError>).eligibleCount).toBe(2);
  expect((err as InstanceType<typeof InsufficientVerbsError>).required).toBe(10);
}

// Rejected promise assertion for async error paths:
await expect(fetchRemoteVerbs()).rejects.toThrow();
```

---

*Testing analysis: 2026-07-18*
