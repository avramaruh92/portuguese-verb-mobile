---
phase: 36-api-base-url-cutover-timeouts
reviewed: 2026-10-11T13:00:00Z
depth: standard
files_reviewed: 9
files_reviewed_list:
  - src/config/api.ts
  - src/dataset/remote.ts
  - src/feedback/submit.ts
  - src/productFeedback/submit.ts
  - scripts/preflight.ts
  - __tests__/api-host-guard.test.ts
  - __tests__/dataset-remote.test.ts
  - __tests__/feedback-submit.test.ts
  - __tests__/productFeedback-submit.test.ts
findings:
  critical: 0
  warning: 4
  info: 2
  total: 6
status: issues_found
---

# Phase 36: Code Review Report

**Reviewed:** 2026-10-11T13:00:00Z
**Depth:** standard
**Files Reviewed:** 9
**Status:** issues_found

## Summary

I reviewed the diff from `dbba602` to HEAD. It adds one shared `API_BASE_URL` (Frankfurt), points the three network modules at it, shortens the timeouts (content 15s, both feedback endpoints 45s), updates the preflight literal and adds a guard test against the Oregon host. The host cutover is correct: no Oregon literal is left in `src/`, `scripts/`, `app/` or the app config. The 4 test suites in scope pass (30 tests).

I found no blockers. The real risks come from the shorter timeouts combined with existing behavior around them:
- The content fallback is memoized for the whole process lifetime.
- Feedback POSTs are not idempotent and can be retried.

The guard test also covers less of the repo than its name suggests.

## Warnings

### WR-01: 15s content timeout plus a never-retried cache makes a cold boot cost the whole session

**File:** `src/dataset/remote.ts:8` (interacts with `src/dataset/source.ts` `cachedResult`)
**Issue:** `TIMEOUT_MS` dropped from 90s to 15s. The phase docs (36-RESEARCH, NET-02) give Render's cold boot as about 40s. If Frankfurt is cold when the app launches, `prefetch()` aborts at 15s and `resolve()` caches `source: "local"`. That cached promise is never invalidated, so the app stays on bundled content (no `learning` payload, OfflinePill shown) until the process is killed, even though the backend is warm a few seconds later. With the old 90s timeout a cold boot was absorbed. With 15s it always means a fallback for the session. The keep-warm pingers reduce this risk, but REQUIREMENTS.md says they are paused if the Oregon service still exists on 2026-11-01.
**Fix:** Let a `"local"` result be retried later instead of pinning it for the process lifetime. For example, clear the cache on failure so the next `resolveVerbs()` call (the next quiz start) tries again:
```ts
async function resolve() {
  try {
    const { verbs, learning } = await fetchRemoteVerbs();
    return { verbs, source: "remote" as const, learning };
  } catch {
    cachedResult = null; // allow a later resolveVerbs() to retry remote
    return { verbs: localVerbs, source: "local" as const, learning: undefined };
  }
}
```
Note that `useQuizStore` snapshots the source at quiz start, so a retry between sessions cannot swap questions mid-quiz. Any `source.ts` test that asserts single-fetch memoization on failure will need updating.

### WR-02: 45s feedback timeout is shorter than cold boot plus observed latency, and Retry can create duplicate rows

**File:** `src/feedback/submit.ts:5`, `src/productFeedback/submit.ts:5`
**Issue:** NET-02 justifies 45s as covering "a ~40s Render cold boot and the ~11s product-feedback latency". Those two add up to about 51s, which is more than 45s, so a submit that lands on a cold instance can be aborted on the client while the server still finishes the insert. The client then shows `network-error` with "Retry submission" (`ReportFeedbackModal.tsx:111`, `ProductFeedbackModal.tsx:102`). Retrying POSTs the same payload again and creates a duplicate row. Aborting the client request does not cancel server-side processing. The old 90s timeout made this much less likely.
**Fix:** Either raise the feedback timeouts above cold boot plus worst observed latency (for example 60_000), or make the submits idempotent: generate a client UUID per modal open, send it as an `Idempotency-Key` header or a payload field, and have the backend dedupe on it. The second option needs a cross-repo contract change. Also correct the NET-02 rationale so it doesn't claim 45s covers both.

### WR-03: The Oregon host guard skips `app/`, root config files and other runtime-read locations

**File:** `__tests__/api-host-guard.test.ts:26`
**Issue:** The guard only walks `src` and `scripts`. Expo Router screens live in `app/`, and endpoints can also be set in `app.json` (`extra`), `eas.json` or `package.json`. A literal reintroduced in any of those places would ship without the guard failing. That defeats the stated threat model (T-36: "stale host silently reintroduced"). There is also a smaller issue: `walk()` uses `entry.isDirectory()` on a `Dirent`, which is false for symlinks. A symlinked directory under `src/` would then be passed to `readFileSync` and throw `EISDIR`, which looks like a host leak instead of a walker bug.
**Fix:**
```ts
it.each(["src", "scripts", "app"])("no Oregon host in %s/", ...);

it.each(["app.json", "package.json", "eas.json"])("no Oregon host in %s", (f) => {
  const p = path.join(REPO_ROOT, f);
  if (!fs.existsSync(p)) return;
  expect(fs.readFileSync(p, "utf8")).not.toContain(OREGON_HOST);
});
```
In `walk()`, skip or resolve symlinks explicitly (`entry.isSymbolicLink()`).

### WR-04: Preflight still uses a 90s timeout, so it can pass when the app would fall back

**File:** `scripts/preflight.ts:6`, `scripts/preflight.ts:59`
**Issue:** The preflight gate checks `/content/verbs` with `TIMEOUT_MS = 90_000`, but the app now gives up after 15s. A `PASS /content/verbs` therefore doesn't show that the app would get remote content. A 30s response passes preflight, while every real launch at that moment silently uses the bundled dataset. The research doc kept 90s on purpose for a dev tool, but then the gate doesn't test the behavior this phase changed. The 36-02 summary's "4/4 checks passed" also doesn't record latency, so it can't show the app's budget was met.
**Fix:** Keep 90s as the overall abort, but record the elapsed time and fail (or warn loudly) when `/content/verbs` takes longer than the app's 15s, or longer than 45s for the feedback checks:
```ts
const started = Date.now();
const response = await fetch(url, { ...init, signal: controller.signal });
const ms = Date.now() - started;
return { label, ok: response.status === expected && ms <= budgetMs, actual: `${response.status} in ${ms}ms`, expected };
```

## Info

### IN-01: The preflight URL is a duplicated literal that a regex keeps in sync

**File:** `scripts/preflight.ts:1`, `__tests__/api-host-guard.test.ts:40-46`
**Issue:** The sync check depends on the exact text `const BASE_URL = "..."`. If someone reformats it (single quotes, a template literal, `let`), `match` becomes null. The test still fails (`undefined !== API_BASE_URL`), but the message is confusing.
**Fix:** Assert `expect(match).not.toBeNull()` first, with a message explaining the expected form. Or let preflight read the host from an env var that defaults to the literal.

### IN-02: The NET-03 test pins the exact `fetch` init keys

**File:** `__tests__/dataset-remote.test.ts:208`
**Issue:** `expect(Object.keys(init)).toEqual(["signal"])` fails on any harmless future init option (for example `headers: { Accept: "application/json" }`), not just cache-busting headers. The intent is "no If-None-Match / Cache-Control / Pragma and no `cache:` option".
**Fix:** Assert the specific forbidden things directly: `init.headers` has none of those three keys, and `init.cache` is undefined.

---

_Reviewed: 2026-10-11T13:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
