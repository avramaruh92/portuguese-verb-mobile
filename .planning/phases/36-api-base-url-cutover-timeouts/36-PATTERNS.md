# Phase 36: API Base-URL Cutover & Timeouts - Pattern Map

**Mapped:** 2026-10-11
**Files analyzed:** 13
**Analogs found:** 12 / 13

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `src/config/api.ts` (new) | config | none (constant) | `src/dataset/types.ts` (named-export constants) | role-match |
| `src/dataset/remote.ts` (mod) | service | request-response (GET) | itself | exact |
| `src/feedback/submit.ts` (mod) | service | request-response (POST) | itself | exact |
| `src/productFeedback/submit.ts` (mod) | service | request-response (POST) | itself | exact |
| `scripts/preflight.ts` (mod) | utility script | request-response | itself (literal only) | exact |
| `__tests__/api-host-guard.test.ts` (new) | test | file-I/O | `__tests__/contract-fixture.test.ts` (fs/path/__dirname) | role-match |
| `__tests__/feedback-submit.test.ts` (mod) | test | request-response | itself | exact |
| `__tests__/productFeedback-submit.test.ts` (mod) | test | request-response | itself | exact |
| `__tests__/dataset-remote.test.ts` (mod) | test | request-response | itself | exact |
| `CLAUDE.md:60`, `AGENTS.md:37` (mod) | docs | n/a | n/a | n/a |
| `store/metadata/review-notes.md:29,34,39,43` (mod) | docs | n/a | n/a | n/a |
| `store/privacy/nutrition-label-answers.md:157` (mod) | docs | n/a | n/a | n/a |

## Pattern Assignments

### `src/config/api.ts` (config)

Conventions: named exports only, no barrels, relative imports, no path aliases, SCREAMING_SNAKE_CASE constants.
```ts
export const API_BASE_URL = "https://portuguese-verb-api-fra.onrender.com";
```

### `src/dataset/remote.ts` (service, GET)

**Current** (lines 1-7, 14-19) to change:
```ts
import { LearningContentSchema } from "../learning/schema";
import type { LearningContent } from "../learning/types";

const CONTENT_ENDPOINT = "https://portuguese-verb-api.onrender.com/content/verbs";
const TIMEOUT_MS = 90_000;
...
const response = await fetch(CONTENT_ENDPOINT, { signal: controller.signal });
```
**Target:** add `import { API_BASE_URL } from "../config/api";` (external, then sibling-domain, then local ordering), `const CONTENT_ENDPOINT = \`${API_BASE_URL}/content/verbs\`;`, `const TIMEOUT_MS = 15_000;`. Keep the `fetch(..., { signal })` call exactly as is (NET-03: no headers/params). `!response.ok` already throws on 304; no logic change. Keep AbortController + try/finally clearTimeout.

### `src/feedback/submit.ts` (service, POST)

Lines 1-4:
```ts
import type { FeedbackPayload, SubmitResult } from "./types";

const FEEDBACK_ENDPOINT = "https://portuguese-verb-api.onrender.com/feedback";
const TIMEOUT_MS = 90_000;
```
**Target:** `import { API_BASE_URL } from "../config/api";` before `./types` import; `const FEEDBACK_ENDPOINT = \`${API_BASE_URL}/feedback\`;`; `TIMEOUT_MS = 45_000`. Rest (try/catch -> network-error, finally clearTimeout) unchanged.

### `src/productFeedback/submit.ts` (service, POST)

Lines 1-5:
```ts
import type { ProductFeedbackPayload, SubmitResult } from "./types";

const PRODUCT_FEEDBACK_ENDPOINT =
  "https://portuguese-verb-api.onrender.com/product-feedback";
const TIMEOUT_MS = 90_000;
```
**Target:** same as above with `${API_BASE_URL}/product-feedback`, `TIMEOUT_MS = 45_000`.

### `scripts/preflight.ts`

Line 1: `const BASE_URL = "https://portuguese-verb-api.onrender.com";` -> change literal to `https://portuguese-verb-api-fra.onrender.com`. Keep self-contained (no import from `src/`; Node type-stripping needs `.ts` extensions). Leave `TIMEOUT_MS = 90_000` (line 6). Endpoints at lines 2-5 derive from `BASE_URL` already.

### `__tests__/api-host-guard.test.ts` (test, file-I/O)

**Analog:** `__tests__/contract-fixture.test.ts` lines 1-10 proves `fs`, `path`, and `__dirname` work in this Jest env (A2 resolved):
```ts
import fs from "fs";
import path from "path";
...
const raw = fs.readFileSync(path.join(__dirname, "fixtures/content-verbs-v0.4.sample.json"), ...
```
Use the guard skeleton from RESEARCH.md (needle built via `["portuguese-verb-api","onrender.com"].join(".")`, recursive walk of `src` and `scripts`, assert file list non-empty, assert `API_BASE_URL` equals Frankfurt literal, optionally regex-assert preflight's `BASE_URL` literal equals `API_BASE_URL`). Use `import fs from "fs"` style to match the existing test. Optionally extend to the four docs (their text must then avoid the Oregon literal).

### `__tests__/feedback-submit.test.ts` and `__tests__/productFeedback-submit.test.ts` (test)

**Timeout test to edit** (feedback-submit lines 77-96; productFeedback lines 74-~92 same shape):
```ts
it("returns network-error when the request never resolves and the 90s timeout fires", async () => {
  jest.useFakeTimers();
  globalThis.fetch = jest.fn().mockImplementation(
    (_url: string, options?: { signal?: AbortSignal }) =>
      new Promise((_resolve, reject) => {
        options?.signal?.addEventListener("abort", () => { reject(new Error("AbortError")); });
      }),
  ) as unknown as typeof fetch;
  const resultPromise = submitFeedback(samplePayload);
  jest.advanceTimersByTime(90_000);
  const result = await resultPromise;
  expect(result).toEqual({ status: "network-error" });
});
```
Change to "45s" / `45_000`; to strengthen, capture the signal from the mock, `advanceTimersByTime(44_999)`, assert `signal.aborted === false`, then advance 1.

**Endpoint assertion** (productFeedback lines 95-110) currently `expect.stringContaining("/product-feedback")`; change to the exact string `` `${API_BASE_URL}/product-feedback` `` (import from `../src/config/api`) or the full Frankfurt literal. feedback-submit.test.ts has no endpoint test; add one modeled on the productFeedback test (201 mock, `toHaveBeenCalledWith(".../feedback", expect.objectContaining({...}))`).

### `__tests__/dataset-remote.test.ts` (test)

**Timeout test to edit** (lines 164-182; already has the right shape, including attaching `rejects` before advancing):
```ts
const resultPromise = fetchRemoteVerbs();
const assertion = expect(resultPromise).rejects.toThrow();
jest.advanceTimersByTime(90_000);
await assertion;
```
Rename "90s" -> "15s", advance `15_000` (NET-01; the test exists already, contrary to RESEARCH note). Strengthen with 14_999 not-aborted check.

**New NET-03 tests** follow the `mockResolvedValue({ ok, status, json })` pattern (lines 70-80, 118-126):
- 200 case: capture `(globalThis.fetch as jest.Mock).mock.calls[0]`; assert URL equals `${API_BASE_URL}/content/verbs`, has no `?`, and `Object.keys(init)` equals `["signal"]`.
- 304 case: `{ ok: false, status: 304, json: async () => { throw new Error("no body"); } }` -> `await expect(fetchRemoteVerbs()).rejects.toThrow()`.
- Fallback-to-local at source level is already covered in `__tests__/dataset-source.test.ts` (mocked rejecting `fetchRemoteVerbs`).

### Docs
- `CLAUDE.md:60` and `AGENTS.md:37`: `(\`https://portuguese-verb-api.onrender.com\`).` -> Frankfurt host. Edit each separately (files differ). Leave repo-name mentions of `portuguese-verb-api`.
- `store/metadata/review-notes.md` lines 29, 34, 39, 43: replace host in all four.
- `store/privacy/nutrition-label-answers.md:157`: `**Health check:** \`GET https://portuguese-verb-api.onrender.com/health\` returned \`200\`.` -> Frankfurt host with a note that the 2026-08-17 check was against the former Oregon service (avoid the literal Oregon host); Frankfurt `/health` verified 200 on 2026-10-11.
- Verify with `! grep -n "portuguese-verb-api\.onrender\.com" CLAUDE.md AGENTS.md store/metadata/review-notes.md store/privacy/nutrition-label-answers.md`.

## Shared Patterns

### Network timeout (AbortController)
**Source:** `src/feedback/submit.ts` lines 9-18, 30-34 (and identical in the other two modules). Keep per-file `TIMEOUT_MS` (15_000 content, 45_000 feedback x2); do not share a timeout constant.
```ts
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);
try { ... signal: controller.signal ... } finally { clearTimeout(timeoutId); }
```

### Base URL import
**Apply to:** the three network modules. `import { API_BASE_URL } from "../config/api";` (relative, named, no alias), endpoint constants built by template string.

### Fake-timer fetch mock
**Source:** `__tests__/feedback-submit.test.ts` lines 15-22 (afterEach restores `globalThis.fetch`, `jest.useRealTimers()`, `jest.clearAllMocks()`) and lines 80-87 (abort-aware never-resolving fetch).

## No Analog Found

| File | Role | Reason |
|---|---|---|
| `src/config/` folder | config | New folder; no existing config module. Follow general named-export conventions. |

## Metadata

**Analog search scope:** `src/dataset`, `src/feedback`, `src/productFeedback`, `scripts`, `__tests__`, docs listed in RESEARCH.md
**Files scanned:** ~12
**Pattern extraction date:** 2026-10-11
