---
phase: 24-quality-gates-preflight-first-submit
plan: 02
subsystem: release-engineering / preflight tooling
tags: [preflight, backend-smoke-test, ci-script, ship-02]
requires: []
provides:
  - "scripts/preflight.ts (four live-backend status-code checks)"
  - "npm run preflight entry"
affects:
  - "Phase 24 Plan 03 (operator re-runs this same script against a cold Render instance for SHIP-03)"
tech-stack:
  added: []
  patterns:
    - "AbortController + setTimeout/clearTimeout fetch-timeout pattern (mirrors src/dataset/remote.ts, src/feedback/submit.ts)"
    - "Standalone script structure copied from scripts/generate-brand-assets.ts (SCREAMING_SNAKE_CASE consts, small named functions, unconditional main() call, no CLI parsing)"
key-files:
  created:
    - scripts/preflight.ts
  modified:
    - package.json
decisions: []
metrics:
  duration: "~15 min"
  completed: "2026-07-25"
---

# Phase 24 Plan 02: Live-Backend Preflight Script Summary

One-liner: Standalone `scripts/preflight.ts` smoke-tests `/health`, `/content/verbs`, `/feedback`, `/product-feedback` on the live Render backend by status code only, wired to `npm run preflight`, verified green on a warm run.

## What Was Built

- `scripts/preflight.ts` — a plain TypeScript script (run via Node's native type-stripping, no new dependency) that:
  - Declares `BASE_URL`, four endpoint constants (`HEALTH_ENDPOINT`, `CONTENT_ENDPOINT`, `FEEDBACK_ENDPOINT`, `PRODUCT_FEEDBACK_ENDPOINT`), and `TIMEOUT_MS = 90_000` as file-local `SCREAMING_SNAKE_CASE` constants (re-declared, not imported — the source constants in `src/dataset/remote.ts`/`src/feedback/submit.ts`/`src/productFeedback/submit.ts` are unexported by convention).
  - A shared `checkStatus(label, url, expected, init?)` helper wraps `fetch` in an `AbortController` + `setTimeout`/`clearTimeout` `try/finally` (mirrors the project's established fetch-timeout pattern), compares `response.status` to the expected code, and treats thrown/aborted fetches as a failed check rather than crashing.
  - Four check functions (`checkHealth`, `checkContentVerbs`, `checkFeedback`, `checkProductFeedback`) — GET checks expect 200, POST checks send schema-valid dummy payloads (matching `feedbackPayloadSchema`/`productFeedbackPayloadSchema`) and expect 201.
  - `main()` runs all four checks sequentially, prints one `PASS`/`FAIL` line per check, a summary count line, and calls `process.exit(1)` if any check failed. Called unconditionally as the last statement (`main();`), no argv parsing — matches the `generate-brand-assets.ts` precedent.
  - No `response.json()` / body-shape validation anywhere — status-code-only per plan's D-03.
- `package.json` — added `"preflight": "node scripts/preflight.ts"` to the `scripts` block, same plain-invocation style as the existing `generate-assets` entry.

## Verification

- `node -e ...` structural check (all four endpoint paths, `AbortController`, `process.exit(1)`, `main();` present): passed.
- `npm run typecheck`: exits 0.
- `npm run preflight` run once against the live warm backend (`https://portuguese-verb-api.onrender.com`) — actual observed output:
  ```
  PASS /health -> 200
  PASS /content/verbs -> 200
  PASS /feedback -> 201
  PASS /product-feedback -> 201
  4/4 checks passed
  ```
  Exit code 0. All four checks passed on the first attempt — no cold-start retry was needed. This run genuinely exercised the live network (not sandbox-blocked); the two dummy POST payloads ("preflight smoke test — ignore") were written to the production `/feedback` and `/product-feedback` tables per the plan's accepted threat T-24-02.

## Deviations from Plan

None - plan executed exactly as written.

## Self-Check

- `scripts/preflight.ts` exists: FOUND
- `package.json` contains `"preflight": "node scripts/preflight.ts"`: FOUND
- Commit `fe6fd63` (Task 1): FOUND in `git log`
- Commit `79a29f9` (Task 2): FOUND in `git log`

## Self-Check: PASSED
