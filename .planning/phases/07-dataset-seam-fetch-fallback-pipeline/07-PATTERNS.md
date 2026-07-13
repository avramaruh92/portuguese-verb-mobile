# Phase 7: Dataset Seam & Fetch/Fallback Pipeline - Pattern Map

**Mapped:** 2026-07-14
**Files analyzed:** 6 (2 new source, 2 modified source, 2 new test)
**Analogs found:** 6 / 6

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|--------------------|------|-----------|-----------------|----------------|
| `src/dataset/remote.ts` | service (API client) | request-response | `src/feedback/submit.ts` | exact (same timeout/AbortController mechanics, GET instead of POST) |
| `src/dataset/source.ts` | service (orchestration/policy) | event-driven (fallback resolution) | none exact — adapted from research `ARCHITECTURE.md` Pattern 2, composes `remote.ts` + `src/dataset/verbs.ts` | role-match (no prior fallback-orchestrator exists in this codebase) |
| `src/quiz/engine.ts` (modified) | service (pure domain logic) | transform | itself (existing `generate()`) — only a signature-widening edit, no new analog needed | exact (self) |
| `src/dataset/verbs.ts` (modified) | model/data (static dataset) | CRUD (content edit only) | itself — one-field content edit (`querer.isIrregular`) | exact (self) |
| `__tests__/dataset-remote.test.ts` | test | request-response | `__tests__/feedback-submit.test.ts` | exact (same `globalThis.fetch` mock + fake-timer-timeout pattern) |
| `__tests__/dataset-source.test.ts` | test | event-driven | `__tests__/feedback-submit.test.ts` (mocking style) + `__tests__/quiz-engine.test.ts` (suite structure) | role-match (no prior fallback-orchestrator test exists; compose from two analogs) |

## Pattern Assignments

### `src/dataset/remote.ts` (service, request-response)

**Analog:** `src/feedback/submit.ts` (full file, 36 lines — read in one pass)

**Imports pattern** (adapt from lines 1-4, own imports):
```typescript
import type { Verb } from "./types";
import { validateDataset } from "./validate";
```

**Endpoint + timeout constants pattern** (`src/feedback/submit.ts` lines 3-4):
```typescript
const FEEDBACK_ENDPOINT = "https://portuguese-verb-api.onrender.com/feedback";
const TIMEOUT_MS = 90_000;
```
Adapt to:
```typescript
const CONTENT_ENDPOINT = "https://portuguese-verb-api.onrender.com/content/verbs";
const TIMEOUT_MS = 90_000; // D-04: same cold-start-tolerant window as submitFeedback
```

**Core AbortController + fetch pattern** (`src/feedback/submit.ts` lines 6-35, full function):
```typescript
export async function submitFeedback(
  payload: FeedbackPayload,
): Promise<SubmitResult> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(FEEDBACK_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    if (response.status === 201) {
      const data = await response.json();
      return { status: "success", data };
    }
    if (response.status === 400) {
      return { status: "validation-error" };
    }
    return { status: "server-error" };
  } catch {
    return { status: "network-error" };
  } finally {
    clearTimeout(timeoutId);
  }
}
```
**Key divergence for `remote.ts` (per D-04/D-06/research Pattern 1):** unlike `submitFeedback`, do NOT return a status-tagged result object — `fetchRemoteVerbs()` must throw/reject on every failure path (non-2xx, JSON parse failure, `validateDataset()` failure) so `source.ts` owns the single fallback decision point. Use `response.ok` (not exact status codes) since this is a GET with only one success shape:
```typescript
export async function fetchRemoteVerbs(): Promise<Verb[]> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(CONTENT_ENDPOINT, { signal: controller.signal });
    if (!response.ok) {
      throw new Error(`content fetch failed: ${response.status}`);
    }
    const payload = await response.json();
    const { valid, errors } = validateDataset(payload.verbs);
    if (!valid) {
      throw new Error(`invalid remote dataset shape: ${errors.join("; ")}`);
    }
    return payload.verbs as Verb[];
  } finally {
    clearTimeout(timeoutId);
  }
}
```
Note the `finally` still clears the timeout (mirrors `submit.ts` exactly); there is deliberately no `catch` block in `fetchRemoteVerbs` itself — let network errors and thrown `Error`s propagate to the caller (`source.ts`), consistent with research Pitfall 2 ("remote.ts must not swallow failures").

**Error handling pattern:** none locally — all errors propagate (reject the promise). This is an intentional divergence from `submit.ts`'s catch-and-classify style; see note above.

---

### `src/dataset/source.ts` (service, event-driven/fallback-orchestration)

**Analog:** No exact prior file in this codebase (first fallback-orchestrator module). Base structure on `src/dataset/verbs.ts`'s import shape plus the research doc's Pattern 2 (already grounded in this repo's own conventions).

**Imports pattern:**
```typescript
import { verbs as localVerbs } from "./verbs";
import { fetchRemoteVerbs } from "./remote";
import type { Verb } from "./types";
```

**Core fallback + memoization pattern** (adapted from `.planning/research/ARCHITECTURE.md` Pattern 2, extended per research's memoization recommendation — Open Question 2):
```typescript
export type VerbSource = "remote" | "local";

let cachedResult: Promise<{ verbs: Verb[]; source: VerbSource }> | null = null;

async function resolve(): Promise<{ verbs: Verb[]; source: VerbSource }> {
  try {
    const remote = await fetchRemoteVerbs();
    return { verbs: remote, source: "remote" };
  } catch {
    return { verbs: localVerbs, source: "local" };
  }
}

export function prefetch(): void {
  if (!cachedResult) {
    cachedResult = resolve();
  }
}

export function resolveVerbs(): Promise<{ verbs: Verb[]; source: VerbSource }> {
  if (!cachedResult) {
    cachedResult = resolve();
  }
  return cachedResult;
}
```
This satisfies D-03 (non-blocking — `prefetch()` is fire-and-forget, callers never need to await it), D-05 (module-level `cachedResult` guard — fetch-once-per-session, in-memory only, no `AsyncStorage`), and never rejects past this module's boundary (the `catch` in `resolve()` always falls through to `localVerbs`).

**Error handling pattern:** every failure mode from `fetchRemoteVerbs()` (network error, timeout/abort, non-2xx, JSON parse failure, schema validation failure) lands in the single `catch` block above — do not add per-failure-mode branches here; that would duplicate the throw-based catch-all `fetchRemoteVerbs()` already provides (research Pitfall 2).

---

### `src/quiz/engine.ts` (modified, service/pure-transform)

**Analog:** itself — no external analog needed, this is a targeted signature-widening edit.

**Current signature** (`src/quiz/engine.ts` lines 1-24):
```typescript
import type { Verb, Tense, Subject } from "../dataset/types";
import { SUBJECTS } from "../dataset/types";
import { verbs } from "../dataset/verbs";
import { shuffle } from "./random";
import type { GenerateOptions, Question, QuizSession, Triple } from "./types";
import { InsufficientVerbsError } from "./types";

const QUESTIONS_PER_SESSION = 10;
const DISTRACTOR_COUNT = 3;

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
  const sampled = sampleTriples(pool, QUESTIONS_PER_SESSION, random);
  const questions = sampled.map((triple) => buildQuestion(triple, eligibleVerbs, random));
  return { questions };
}
```

**Required edit (per D-06/research Pattern 3 — optional trailing param, NOT a required leading param):**
```typescript
import type { Verb, Tense, Subject } from "../dataset/types";
import { SUBJECTS } from "../dataset/types";
import { verbs as localVerbs } from "../dataset/verbs"; // renamed to avoid shadowing new param
import { shuffle } from "./random";
import type { GenerateOptions, Question, QuizSession, Triple } from "./types";
import { InsufficientVerbsError } from "./types";

const QUESTIONS_PER_SESSION = 10;
const DISTRACTOR_COUNT = 3;

export function generate(
  options: GenerateOptions,
  random: () => number = Math.random,
  verbs: Verb[] = localVerbs, // NEW — optional, trailing, defaults to local bundled dataset
): QuizSession {
  const eligibleVerbs = verbs.filter((v) => options.includeIrregular || !v.isIrregular);
  // ...rest of function body UNCHANGED
}
```
**Critical constraint:** every other line of the function body, and every other export (`sampleTriples`, `buildQuestion`, `pickDistractors`) stays byte-for-byte unchanged. The only diffs in this file are: (1) the import rename `verbs` → `localVerbs`, (2) the new trailing `verbs` parameter with its default. This is the exact fix for the signature-conflict pitfall research flagged (`src/store/useQuizStore.ts:40` calls `generate(options)` unmodified; `__tests__/quiz-engine.test.ts` calls `generate({...}, Math.random)` unmodified — both must keep compiling and passing without any edit to those two files).

**Existing call sites that MUST remain unmodified (verify, do not touch):**
- `src/store/useQuizStore.ts:40` — `const session = generate(options);`
- `__tests__/quiz-engine.test.ts` — every call is `generate({...}, Math.random)` or `generate({...})`

---

### `src/dataset/verbs.ts` (modified, content-only edit)

**Analog:** itself.

**Location of edit:** `querer` entry starts at line 1682. Field to change (line 1684):
```typescript
    verb: "querer",
    translation: "to want",
    isIrregular: false,   // <-- change to: true
    conjugations: {
```
No structural change — same object shape, same array position, only the boolean literal flips per D-02.

---

### `__tests__/dataset-remote.test.ts` (test, request-response)

**Analog:** `__tests__/feedback-submit.test.ts` (full file, 97 lines — read in one pass)

**Mocking setup pattern** (lines 15-22):
```typescript
describe("submitFeedback", () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
    jest.useRealTimers();
    jest.clearAllMocks();
  });
```
Adapt identically for `fetchRemoteVerbs` — replace `submitFeedback` describe name and payload with `fetchRemoteVerbs` and a schema-valid `Verb` fixture.

**Success-path mock pattern** (lines 24-34, adapted):
```typescript
it("resolves with validated verbs on a well-shaped 200", async () => {
  globalThis.fetch = jest.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => ({ verbs: [validVerbFixture] }),
  }) as unknown as typeof fetch;

  const result = await fetchRemoteVerbs();
  expect(result).toEqual([validVerbFixture]);
});
```

**Rejection-path mock pattern** (lines 47-56, non-2xx; adapt `response.status === 500` check to `response.ok === false`):
```typescript
it("rejects on non-2xx response", async () => {
  globalThis.fetch = jest.fn().mockResolvedValue({
    ok: false,
    status: 500,
    json: async () => ({ error: "InternalServerError" }),
  }) as unknown as typeof fetch;

  await expect(fetchRemoteVerbs()).rejects.toThrow();
});
```

**Network-error rejection pattern** (lines 69-75):
```typescript
it("rejects when fetch itself rejects", async () => {
  globalThis.fetch = jest.fn().mockRejectedValue(new Error("Network request failed"));
  await expect(fetchRemoteVerbs()).rejects.toThrow();
});
```

**Fake-timer timeout pattern** (lines 77-96, copy near-verbatim, swap 90s advance + assert rejection instead of a `network-error` status object):
```typescript
it("rejects when the request never resolves and the 90s timeout fires", async () => {
  jest.useFakeTimers();

  globalThis.fetch = jest.fn().mockImplementation(
    (_url: string, options?: { signal?: AbortSignal }) =>
      new Promise((_resolve, reject) => {
        options?.signal?.addEventListener("abort", () => {
          reject(new Error("AbortError"));
        });
      }),
  ) as unknown as typeof fetch;

  const resultPromise = fetchRemoteVerbs();
  jest.advanceTimersByTime(90_000);
  await expect(resultPromise).rejects.toThrow();
});
```

**Additional test required (not in the analog, per research Pitfall 3):** malformed-shape-with-200 case (invalid `Verb` shape or missing `verbs` key) must also reject — see research Code Examples section for the exact fixture (`{ verb: "falar" /* missing required fields */ }` and `{ verbs: "not-an-array" }`).

---

### `__tests__/dataset-source.test.ts` (test, event-driven)

**Analog (mocking style):** `__tests__/feedback-submit.test.ts` `afterEach`/`jest.fn()` conventions (lines 18-22, shown above).
**Analog (suite structure):** `__tests__/quiz-engine.test.ts` `describe` nesting (lines 12-13, 73, 96 — nested `describe` per exported function).

**Core pattern:** mock `fetchRemoteVerbs` itself (not `global.fetch`) via `jest.mock("../src/dataset/remote")`, to isolate fallback-policy logic from network mechanics per research's explicit guidance:
```typescript
import { resolveVerbs } from "../src/dataset/source";
import { fetchRemoteVerbs } from "../src/dataset/remote";
import { verbs as localVerbs } from "../src/dataset/verbs";

jest.mock("../src/dataset/remote");
const mockedFetchRemoteVerbs = fetchRemoteVerbs as jest.MockedFunction<typeof fetchRemoteVerbs>;

describe("resolveVerbs", () => {
  afterEach(() => {
    jest.clearAllMocks();
    jest.resetModules(); // needed to reset the module-level cachedResult guard between tests
  });

  it("resolves with remote verbs and source 'remote' when fetchRemoteVerbs succeeds", async () => {
    mockedFetchRemoteVerbs.mockResolvedValue(localVerbs); // any valid Verb[] fixture
    const result = await resolveVerbs();
    expect(result.source).toBe("remote");
  });

  it("resolves with local verbs and source 'local' when fetchRemoteVerbs rejects", async () => {
    mockedFetchRemoteVerbs.mockRejectedValue(new Error("network error"));
    const result = await resolveVerbs();
    expect(result).toEqual({ verbs: localVerbs, source: "local" });
  });

  it("never rejects, regardless of fetchRemoteVerbs's failure mode", async () => {
    mockedFetchRemoteVerbs.mockRejectedValue(new Error("timeout"));
    await expect(resolveVerbs()).resolves.toBeDefined();
  });

  it("fetches only once per module session (memoization)", async () => {
    mockedFetchRemoteVerbs.mockResolvedValue(localVerbs);
    await resolveVerbs();
    await resolveVerbs();
    expect(mockedFetchRemoteVerbs).toHaveBeenCalledTimes(1);
  });
});
```
Note: `jest.resetModules()` + re-`require`/re-`import` per test (or a dynamic `await import("../src/dataset/source")` inside each `it`) will likely be needed to reset the module-level `cachedResult` cache between test cases, since it's intentionally not exported/resettable — confirm exact reset mechanics work with this project's `jest-expo` preset when implementing (no prior module-level-cache test exists in this codebase to copy verbatim; this is the one genuinely new testing pattern this phase introduces).

## Shared Patterns

### Timeout-bounded fetch (AbortController)
**Source:** `src/feedback/submit.ts` lines 3-4, 9-10, 33-34
**Apply to:** `src/dataset/remote.ts`
```typescript
const TIMEOUT_MS = 90_000;
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);
try {
  // fetch with { signal: controller.signal }
} finally {
  clearTimeout(timeoutId);
}
```
Do NOT use `AbortSignal.timeout()` — unimplemented on Hermes, a settled v0.0 finding already encoded in `submit.ts`.

### Schema validation via existing Zod schema
**Source:** `src/dataset/validate.ts` lines 26-43 (`validateDataset`, full function, unchanged/reused as-is)
**Apply to:** `src/dataset/remote.ts` (validate `payload.verbs` after unwrapping the `{ verbs: [...] }` envelope — do NOT pass the whole envelope object to `validateDataset`, which expects a bare array)

### Test fetch-mocking convention
**Source:** `__tests__/feedback-submit.test.ts` lines 16-22, 26-29, 80-87
**Apply to:** `__tests__/dataset-remote.test.ts`
```typescript
const originalFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = originalFetch;
  jest.useRealTimers();
  jest.clearAllMocks();
});
globalThis.fetch = jest.fn().mockResolvedValue({ ok: true, status: 200, json: async () => (/* ... */) }) as unknown as typeof fetch;
```

### Non-breaking optional-trailing-parameter injection
**Source:** research-derived, grounded in direct read of `src/quiz/engine.ts` lines 11-14 and `src/store/useQuizStore.ts:40`
**Apply to:** `src/quiz/engine.ts`'s `generate()` only
```typescript
export function generate(
  options: GenerateOptions,
  random: () => number = Math.random,
  verbs: Verb[] = localVerbs,
): QuizSession { /* body unchanged */ }
```
This is the one pattern where the planner must actively resist the more "obvious" required-leading-parameter refactor illustrated in `.planning/research/ARCHITECTURE.md` — that shape breaks the store call site and the existing test suite, which this phase must not touch.

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `src/dataset/source.ts` | service | event-driven (fallback + memoization) | No prior fallback-orchestrator or memoized-resolver module exists in this codebase; closest precedent is the research doc's own Pattern 2 (already reviewed and incorporated above), not a real prior file |
| `__tests__/dataset-source.test.ts` (module-cache-reset mechanics specifically) | test | event-driven | No prior test in this codebase exercises resetting a module-level `let cachedResult` cache between test cases; must be worked out fresh at implementation time (see note under that file's pattern assignment above) |

## Metadata

**Analog search scope:** `src/dataset/`, `src/quiz/`, `src/feedback/`, `src/store/`, `__tests__/`
**Files scanned:** `src/quiz/engine.ts`, `src/dataset/validate.ts`, `src/dataset/types.ts`, `src/dataset/verbs.ts`, `src/feedback/submit.ts`, `src/store/useQuizStore.ts` (grep only), `__tests__/quiz-engine.test.ts`, `__tests__/feedback-submit.test.ts`, `__tests__/dataset.test.ts`
**Pattern extraction date:** 2026-07-14
