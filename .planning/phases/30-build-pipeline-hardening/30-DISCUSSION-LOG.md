# Phase 30: Build Pipeline Hardening - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-08-16
**Phase:** 30-Build Pipeline Hardening
**Areas discussed:** Version confirmation method, Pin granularity, Local dev workflow, Validation build type

---

## Version confirmation method

| Option | Description | Selected |
|--------|-------------|----------|
| Trust historical evidence | Phase 24 regenerated `package-lock.json` under Node 22/npm 10 to fix EAS's npm-ci lockfile mismatch; Phase 29 hit and confirmed the same class of drift again — real, project-specific build-log evidence, twice. Pin to Node 22 first, let SC4's required real production build be the final confirmation. | ✓ |
| Trigger a fresh build first to re-check | EAS build images get updated over time, so the Phase 24 finding could be stale — kick off a build now specifically to read the current image's Node version before deciding what to pin. | |
| Check EAS's public build image docs | Cross-reference Expo SDK ~57 against Expo's published build-image Node version docs as a non-build confirmation source. | |

**User's choice:** Trust historical evidence (recommended option).
**Notes:** None.

---

## Pin granularity

| Option | Description | Selected |
|--------|-------------|----------|
| Exact patch | Pin `.nvmrc`/`engines.node`/`eas.json` node field to one exact version string (e.g. "22.11.0"), matching the project's own PITFALLS.md guidance that all three locations must agree exactly. | ✓ |
| Major-only float | Pin to "22" everywhere — looser, tolerates EAS bumping patch versions without a repo change, but reintroduces the version ambiguity that caused 3 prior drift incidents. | |
| You decide | Let the researcher/planner pick based on what's actually discoverable. | |

**User's choice:** Exact patch (recommended option).
**Notes:** Prior evidence (Phase 24) only recorded major-only (`nvm use 22`) — no exact patch was captured historically. Captured as a known gap in CONTEXT.md: researcher/executor must resolve the exact patch via `nvm install 22 && nvm use 22` + `node -v` during this phase.

---

## Local dev workflow

| Option | Description | Selected |
|--------|-------------|----------|
| Use nvm directly | `nvm install 22 && nvm use 22` (or `nvm use` once `.nvmrc` exists) to switch, regenerate the lockfile, run the verification suite under it, then switch back. nvm is already installed on this machine. | ✓ |
| You decide | Let the executor pick exact commands as long as the lockfile ends up regenerated under the pinned version with a clean `npm ci`. | |

**User's choice:** Use nvm directly (recommended option).
**Notes:** None.

---

## Validation build type

| Option | Description | Selected |
|--------|-------------|----------|
| Straight to production | SC4 requires a real production build to succeed anyway; prior incidents (Phase 24, 29) were only ever caught by actual EAS builds — a preview build exercises the identical `npm ci` path/image, so it wouldn't catch anything extra, just costs another build cycle. | ✓ |
| Preview build first, then production | Run a cheaper `eas build --profile preview` first to confirm `npm ci` succeeds before spending a production build slot. | |

**User's choice:** Straight to production (recommended option).
**Notes:** None.

---

## Claude's Discretion

None — all four areas had explicit user selections (all matched the recommended option).

## Deferred Ideas

None — discussion stayed within phase scope. No CI pipeline exists in this repo to extend the pin to (noted as a fact in CONTEXT.md's code_context, not a deferred idea).
