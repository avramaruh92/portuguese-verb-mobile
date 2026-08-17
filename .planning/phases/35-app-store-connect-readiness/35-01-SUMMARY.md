---
phase: 35-app-store-connect-readiness
plan: 01
subsystem: app-config, backend-privacy
tags: [app-store-connect, ios-config, export-compliance, privacy, fastify, cross-repo]
requires: []
provides:
  - "ios.supportsTablet explicitly declared false in app.json"
  - "export compliance re-verified unchanged (ITSAppUsesNonExemptEncryption: false)"
  - "backend Fastify request logging no longer serializes client remoteAddress"
affects:
  - app.json
  - portuguese-verb-backend/src/app.ts
tech-stack:
  added: []
  patterns:
    - "Cross-repo plan execution: sibling repo edit gets its own isolated commit + push, never mixed into the primary repo's commit"
key-files:
  created: []
  modified:
    - app.json
    - /Users/avi/portuguese-verb/portuguese-verb-backend/src/app.ts
decisions: []
metrics:
  duration: "~15 minutes"
  completed: "2026-08-17"
---

# Phase 35 Plan 01: App Store Connect readiness — iOS tablet declaration, export compliance re-verification, backend IP-logging fix Summary

One-liner: Declared `ios.supportsTablet: false` explicitly in `app.json`, re-verified export compliance is unchanged (zero crypto/encryption usage), and disabled Fastify's built-in request logging in the sibling backend repo so `remoteAddress: req.ip` no longer reaches Render's log stream.

## What Was Built

**Task 1 — `app.json` (this repo):**
- Added `"supportsTablet": false` as a flat sibling key inside `expo.ios`, placed after `"buildNumber": "1"` and before `"infoPlist"`. No other keys touched (`bundleIdentifier`, `buildNumber` "1", `version`, `slug`, `scheme` all unchanged).
- Re-verified export compliance (STORE-07) — see dedicated section below.

**Task 2 — sibling repo `portuguese-verb-backend/src/app.ts` (cross-repo, its own commit/push):**
- Changed `Fastify({ logger: true })` to `Fastify({ logger: true, disableRequestLogging: true })` in `buildApp()`, with an inline comment explaining the rationale (Fastify's default `req` serializer emits `remoteAddress: req.ip` on every automatic request-completed log line; `logger: true` is retained so the curated `req.log.info`/`warn`/`error` calls in the route handlers and error handler — which carry no IP fields — keep working).
- No `serializers` override added, no hooks added, no route files touched.

## STORE-07 Export Compliance Re-verification

- (a) `"ITSAppUsesNonExemptEncryption": false` confirmed still present under `expo.ios.infoPlist` in `app.json` (unchanged from before this plan).
- (b) Command run: `grep -rin "crypto\|encryption" src app --include="*.ts" --include="*.tsx"` — zero output (grep exit code 1, no matches). Confirms nothing added by Phases 30-34 introduced crypto/encryption usage.
- (c) No crypto/encryption library present in `package.json` dependencies (unchanged; not modified by this or prior phases).

Conclusion: export compliance answer (`false` / no non-exempt encryption) remains accurate. The App Store Connect export-compliance field itself will be confirmed in plan 35-07.

## Verification Results

**This repo (mobile):**
- `grep -q '"supportsTablet": false' app.json` — pass
- `grep -q '"ITSAppUsesNonExemptEncryption": false' app.json` — pass
- `grep -rqi "crypto\|encryption" src app --include="*.ts" --include="*.tsx"` — zero hits (pass)
- `npm run typecheck` — exit 0
- `npm test` — 22 suites / 261 tests passed
- `npx expo config --type public` — exit 0
- `node -e "console.log(require('./app.json').expo.ios.supportsTablet)"` → `false`
- `node -e "console.log(require('./app.json').expo.ios.infoPlist.ITSAppUsesNonExemptEncryption)"` → `false`
- `node -e "console.log(require('./app.json').expo.ios.buildNumber)"` → `1` (unchanged)
- `git diff --name-only` (Task 1 commit) — only `app.json`

**Sibling backend repo:**
- `grep -q "disableRequestLogging: true" src/app.ts` — pass
- `grep -q "logger: true" src/app.ts` — pass
- `npm run build` — exit 0 (tsc)
- `npm test` — 26 files / 190 tests passed (a Fastify deprecation warning, `FSTDEP023`, was printed for `disableRequestLogging` — noted below, not a failure)
- `npm run lint` — exit 0, no output
- `git show --stat HEAD` — exactly one file changed: `src/app.ts`
- `git status --porcelain src/` — clean, no remaining modifications
- Commit SHA: `f06c46b255cc80314f464e3574c03888904977e9`, pushed to `origin/main` (`git rev-parse HEAD` == `git rev-parse origin/main`)
- Health check after push: polled `https://portuguese-verb-api.onrender.com/health`; first attempt returned no response (cold start), second attempt (after 15s) returned `{"status":"ok"}`
- `logger: true` intentionally retained (confirmed present alongside `disableRequestLogging: true` on the same constructor call)
- This repo (`portuguese-verb-mobile`) has zero changes under `src/` from Task 2

## Deviations from Plan

None - plan executed exactly as written.

**Observation (not a deviation, no action taken):** `npm test` in the backend repo printed a Fastify deprecation warning (`FSTDEP023`) noting that the top-level `disableRequestLogging` option is deprecated in favor of `logController`/`isLogDisabled` and will be removed in Fastify 6. The plan explicitly specified `disableRequestLogging: true` as the required option and prohibited adding hooks/serializers, so this was implemented exactly as instructed. All tests still passed (190/190). This is worth flagging for a future phase if/when the backend upgrades to Fastify 6, but is out of scope for this plan.

## Self-Check

- `app.json` contains `"supportsTablet": false,` — FOUND
- `/Users/avi/portuguese-verb/portuguese-verb-backend/src/app.ts` contains `disableRequestLogging: true` — FOUND
- Mobile commit `fcdbd49` exists in `git log` — FOUND
- Backend commit `f06c46b` exists in `git log` and matches `origin/main` — FOUND
- Backend health endpoint responded `{"status":"ok"}` after push — FOUND

## Self-Check: PASSED
