# Phase 36: API Base-URL Cutover & Timeouts - Research

**Researched:** 2026-10-11
**Domain:** Expo/RN fetch config, Jest repo-guard test, doc hygiene
**Confidence:** HIGH (all findings from direct repo inspection + live read-only GETs)

## Summary

Small, mechanical phase. Exactly three source files and one script hold the Oregon host (`src/dataset/remote.ts`, `src/feedback/submit.ts`, `src/productFeedback/submit.ts`, `scripts/preflight.ts`). No `app.json`, `eas.json`, `app/`, `docs/`, `assets/` hit [VERIFIED: grep]. `dist/` and `ios/` are git-ignored and contain no hits [VERIFIED: grep + git check-ignore]. Docs with live (non-historical) Oregon references: `CLAUDE.md:60`, `AGENTS.md:37`, `store/metadata/review-notes.md:29,34,39,43`, `store/privacy/nutrition-label-answers.md:157`.

Frankfurt is live: `GET /health` -> 200 and `GET /content/verbs` -> 200 with `cache-control: public, max-age=300` and a weak `etag` [VERIFIED: curl 2026-10-11]. `scripts/preflight.ts` issues two POSTs (`/feedback`, `/product-feedback`) that persist dummy rows on the backend; this is existing, accepted behaviour required by API-03 (I did NOT run it).

**Primary recommendation:** Add `src/config/api.ts` exporting `API_BASE_URL`; import it in the three submit/remote files via relative paths; change timeouts to 15_000 / 45_000 / 45_000; add `__tests__/api-host-guard.test.ts` that recursively scans `src/` and `scripts/`; update existing 90s timeout tests to the new values; add NET-03 tests to `__tests__/dataset-remote.test.ts`; rewrite the four docs.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary | Rationale |
|---|---|---|---|
| Base URL constant | Client config module (`src/config/`) | — | Single source for 3 network modules |
| Timeouts / fallback | Client network modules | — | Existing AbortController pattern |
| ETag/304 revalidation | OS (iOS NSURLCache) | Backend headers | App sends nothing special |
| Oregon-host guard | Jest (repo test) | — | Fails `npm test` |
| Preflight | Node script (`scripts/`) | Backend | Cannot import from `src/` easily (see pitfall) |

## Standard Stack

No new dependencies. Jest via jest-expo ~57, Node `fs`/`path`, Zod existing. No package installs, so Package Legitimacy Audit is N/A.

## Architecture Patterns

### Where the constant lives
Conventions: named exports only, no barrels, relative imports, no path aliases. New folder `src/config/` does not exist yet. Recommended: `src/config/api.ts`:

```ts
export const API_BASE_URL = "https://portuguese-verb-api-fra.onrender.com";
```
Each consumer keeps its own endpoint constant, built from it (keeps naming convention `SCREAMING_SNAKE_CASE`):
```ts
import { API_BASE_URL } from "../config/api";
const CONTENT_ENDPOINT = `${API_BASE_URL}/content/verbs`;   // remote.ts
const FEEDBACK_ENDPOINT = `${API_BASE_URL}/feedback`;       // feedback/submit.ts
const PRODUCT_FEEDBACK_ENDPOINT = `${API_BASE_URL}/product-feedback`; // productFeedback/submit.ts
```
Also keep per-file `const TIMEOUT_MS` (15_000 in remote.ts, 45_000 in both submit files). Do not share a timeout constant; the values differ.

### preflight.ts
Run by `node scripts/preflight.ts` (Node native TS type-stripping; package.json `engines.node` 22.23.2, local v25.0.0). It is standalone with its own `BASE_URL` literal. Node's type-stripping does not resolve extensionless relative imports (`../src/config/api`) -- an import would need the `.ts` extension, which conflicts with tsc/Expo config (no `allowImportingTsExtensions` known). Recommendation: keep preflight self-contained, just change its literal to the Frankfurt host (API-03 only requires it targets Frankfurt). Optionally add a guard test asserting preflight's `BASE_URL` literal equals `API_BASE_URL` (read file text, regex). Preflight `TIMEOUT_MS = 90_000` should stay (it is a dev tool; cold boot ~40s; not in NET scope). [ASSUMED: leaving preflight timeout at 90s is acceptable.]

### Guard test (API-02)
Place `__tests__/api-host-guard.test.ts`. It is outside `src/`/`scripts/` so it cannot self-trip, but build the needle by concatenation anyway:
```ts
import { readdirSync, readFileSync, statSync } from "fs";
import { join } from "path";

const OREGON_HOST = ["portuguese-verb-api", "onrender.com"].join(".");
// NB: the Frankfurt host is "portuguese-verb-api-fra.onrender.com" -- it does NOT contain
// "portuguese-verb-api.onrender.com" as a substring, so a plain includes() is safe.

function walk(dir: string): string[] { /* recurse readdirSync(dir,{withFileTypes}) -> files */ }

it.each(["src", "scripts"])("no Oregon host in %s/", (d) => {
  const root = join(__dirname, "..", d);
  const offenders = walk(root).filter((f) => readFileSync(f, "utf8").includes(OREGON_HOST));
  expect(offenders).toEqual([]);
});
```
Notes: `fs`/`path` are available in jest-expo (node-based test environment for the default `jest-expo` preset; `__dirname` is defined in CJS Jest modules) [ASSUMED -- plan should include a quick run to confirm; existing `contract-fixture.test.ts` likely already reads files, planner can check]. Scan all file types (no extension filter) but skip nothing; include `.ts/.tsx/.json`. `src/theme/tokens.test.ts` is co-located inside `src/` -- fine. Make the guard also assert the scanned file list is non-empty (so a wrong path does not silently pass). Optionally also assert `API_BASE_URL` equals the Frankfurt literal.

### Timeout tests
Existing pattern: `jest.useFakeTimers()`, fetch mock that rejects on `signal` abort, `jest.advanceTimersByTime(N)`, `await` result. Update:
- `__tests__/feedback-submit.test.ts:77-92` and `__tests__/productFeedback-submit.test.ts:74-89`: rename "90s" -> "45s", advance `45_000`. Strengthen: first `advanceTimersByTime(44_999)` and assert not yet aborted (e.g. `signal.aborted === false`), then advance 1ms.
- `__tests__/dataset-remote.test.ts`: no timeout test exists currently; add one with `advanceTimersByTime(15_000)` and `await expect(promise).rejects.toThrow()` (attach the `rejects` expectation before advancing, or capture promise first to avoid unhandled rejection). Fallback-to-local is verified at `source.ts` level (`dataset-source.test.ts` mocks `fetchRemoteVerbs` rejecting); remote.ts itself throws.
- Also update endpoint assertions: `productFeedback-submit.test.ts:95` ("calls fetch with the /product-feedback endpoint") and the feedback-submit equivalent -- grep showed NO test file contains the Oregon literal ("onrender" search of `__tests__` returned nothing), so these likely assert via `expect.stringContaining("/product-feedback")` or similar; the planner should assert the full Frankfurt URL there to satisfy API-01 / success criterion 1.

### NET-03 test
Add to `__tests__/dataset-remote.test.ts`:
1. Capture `fetch` mock args on a 200: assert URL has no `?` (no query params), `init.headers` is `undefined` (current code passes only `{ signal }`), and if present contains no `Cache-Control`/`Pragma`/`If-None-Match`/`If-Modified-Since` (case-insensitive). Assert `Object.keys(init)` equals `["signal"]` to lock it.
2. 304: mock `{ ok: false, status: 304, json: async () => { throw ... } }` -> `rejects.toThrow()`. Real RN `Response.ok` is false for 304 (ok = 200-299). Also test via `source.ts` `resolveVerbs` that a rejecting fetch yields `source: "local"` (existing `dataset-source.test.ts` pattern; check for module-level `cachedResult` -- use `jest.resetModules`/`jest.isolateModules` as that file already does). Zero production change required (remote.ts already uses `!response.ok`).
Pitfall: a 2xx non-200 (e.g. 204) passes `ok` but `json()` fails -> still throws; fine.

## Don't Hand-Roll

| Problem | Use | Why |
|---|---|---|
| Recursive dir scan | small `readdirSync` recursion (Node 20+ `readdirSync(dir,{recursive:true})` also works on Node 22/25) | no glob dep needed |
| Timeouts | existing AbortController+setTimeout pattern | convention |
| Cache revalidation | iOS NSURLCache (server sends ETag + max-age=300) | requirement forbids manual headers |

## Common Pitfalls

1. **Substring trap:** Frankfurt `portuguese-verb-api-fra.onrender.com` does not contain the Oregon needle; verified by inspection. But a needle of just `portuguese-verb-api` would false-positive on prose -- use the full `.onrender.com` form.
2. **Doc scope:** `portuguese-verb-api` as a repo/sibling name in CLAUDE.md/AGENTS.md (lines 4,14,29,44,80,170, etc.) is the repo name, not the host -- leave as is. Only change host URLs / "live API" statements. Also CLAUDE.md says `POST /feedback ... on the live API (https://portuguese-verb-api.onrender.com)` -> Frankfurt; optionally add one line noting Oregon is retired / the Oregon service deleted by 2026-11-01 deadline.
3. **CLAUDE.md vs AGENTS.md differ** (cmp: not identical); edit each separately.
4. **nutrition-label-answers.md:157** is a dated historical verification record ("Date checked 2026-08-17 ... Health check: GET https://portuguese-verb-api.onrender.com/health returned 200"). API-04 says it must not point at Oregon "as the current API". Recommended: re-run (or reference) the Frankfurt health check and update the host to Frankfurt with a note that the 2026-08-17 check was against the former Oregon service (Oregon host named only as "former", or described without the literal host). Do not claim a fresh date/SHA you did not verify; the SHA `f06c46b` is Oregon-era. I verified today `GET /health` -> 200 on Frankfurt (2026-10-11).
5. **review-notes.md** lists 4 URLs (lines 29,34,39,43) -- these are App Review notes; update all to Frankfurt. Also the backend's keep-warm / cold-start line (content falls back after 15s) is accurate; consider noting a 15s content timeout is consistent with "silently falls back" text (no change needed).
6. **Planning docs** (`.planning/PROJECT.md`, ROADMAP, REQUIREMENTS, `.continue-here.md`) mention Oregon intentionally as history/deadline -- out of scope; ROADMAP/REQUIREMENTS must keep the needle literal (they live outside src/scripts so guard unaffected).
7. **Live ETag:** `cache-control: public, max-age=300` means iOS may serve cached content for 5 minutes without hitting the network; irrelevant to code but explains behaviour in manual testing.
8. **Preflight POSTs write dummy rows** to Frankfurt DB on each run (existing behaviour); `npm run preflight` should be run once as a gate.

## Code Examples
See Architecture Patterns above (constant, endpoint construction, guard test).

## Runtime State Inventory
Not a rename of stored data, but for completeness: stored data -- none (no persistence in app); live service config -- Render Oregon service deletion is a backend-repo task (REGION-05), blocked until this ships; OS-registered state -- none; secrets/env -- none (no env files, host hardcoded); build artifacts -- `dist/` and `ios/` are gitignored, contain no Oregon host today; but any already-built/submitted binary still has Oregon until the App Store update ships (release is outside this phase).

## Assumptions Log
| # | Claim | Section | Risk |
|---|---|---|---|
| A1 | Leaving `scripts/preflight.ts` TIMEOUT_MS at 90s is fine | preflight | Low |
| A2 | jest-expo test env exposes node `fs`/`path`/`__dirname` | guard test | Low; plan a Wave-0 smoke run |
| A3 | Node type-stripping cannot import `../src/config/api` without `.ts` ext in preflight | preflight | Low; falling back to literal is safe either way |

## Environment Availability
| Dependency | Required By | Available | Version |
|---|---|---|---|
| Node | tests, preflight | yes | v25.0.0 (engines pin 22.23.2) |
| Frankfurt API | preflight, docs check | yes | /health 200, /content/verbs 200 (2026-10-11) |
| Network | preflight | yes | -- |

## Validation Architecture

### Test Framework
| Property | Value |
|---|---|
| Framework | Jest via jest-expo ~57 (`"jest": {"preset":"jest-expo"}` in package.json; no jest.config file) |
| Quick run | `npx jest __tests__/dataset-remote.test.ts __tests__/feedback-submit.test.ts __tests__/productFeedback-submit.test.ts __tests__/api-host-guard.test.ts` |
| Full suite | `npm test` (+ `npm run typecheck`, `npm run lint`) |

### Phase Requirements -> Test Map
| Req | Behavior | Type | Command | Exists |
|---|---|---|---|---|
| API-01 | All three endpoints use Frankfurt base from `src/config/api.ts` (assert fetch URL in each submit/remote test; assert constant value) | unit | `npx jest __tests__/dataset-remote.test.ts __tests__/feedback-submit.test.ts __tests__/productFeedback-submit.test.ts` | edit existing |
| API-02 | Oregon host absent from src/ and scripts/ | guard | `npx jest __tests__/api-host-guard.test.ts` | Wave 0 new |
| API-03 | preflight targets Frankfurt and passes | smoke (live network) | `npm run preflight` (manual gate; plus guard test asserts preflight literal is Frankfurt) | script edit |
| API-04 | Four docs free of Oregon-as-current | grep check | `! grep -n "portuguese-verb-api\.onrender\.com" CLAUDE.md AGENTS.md store/metadata/review-notes.md store/privacy/nutrition-label-answers.md` (planner may extend guard test to cover these files; if so, historical mention must avoid the literal) | grep / optional test |
| NET-01 | Content fetch aborts at 15s | unit, fake timers | `npx jest __tests__/dataset-remote.test.ts` | add test |
| NET-02 | Both feedback submits abort at 45s -> network-error | unit, fake timers | `npx jest __tests__/feedback-submit.test.ts __tests__/productFeedback-submit.test.ts` | edit existing |
| NET-03 | No cache-busting headers/params; 304/non-200 -> falls back | unit | `npx jest __tests__/dataset-remote.test.ts __tests__/dataset-source.test.ts` | add tests |

Sampling: per task commit quick run; per wave `npm test && npm run typecheck && npm run lint`; phase gate full suite green + `npm run preflight`.

Wave 0 gaps: `__tests__/api-host-guard.test.ts`; `src/config/api.ts`.

## Security Domain
| ASVS | Applies | Control |
|---|---|---|
| V5 Input validation | yes (unchanged) | Zod validation of remote payload already in place |
| V9 Communications | yes | HTTPS-only host constant; guard test prevents host regression |
| V2/V3/V4/V6 | no | no auth/sessions/crypto |

Threat: stale host silently reintroduced (Tampering/Availability) -> guard test. Timeout shortening has no security impact; 45s retains cold-boot tolerance.

## Sources
- Repo files inspected directly (src/dataset/remote.ts, src/feedback/submit.ts, src/productFeedback/submit.ts, scripts/preflight.ts, existing tests, docs) [VERIFIED]
- Live curl to Frankfurt `/health` and `/content/verbs` 2026-10-11 [VERIFIED]
- `.planning/REQUIREMENTS.md`, `ROADMAP.md`, `.continue-here.md`

## Metadata
Confidence: stack HIGH, architecture HIGH, pitfalls HIGH. Valid until: 2026-11-01 deadline.
