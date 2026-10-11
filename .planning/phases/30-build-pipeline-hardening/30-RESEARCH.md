# Phase 30: Build Pipeline Hardening - Research

**Researched:** 2026-08-16
**Domain:** EAS Build Node/npm version pinning (Expo SDK 57, `eas.json`, `.nvmrc`, `package.json engines`)
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Version confirmation method
- **D-01:** Trust the project's own historical evidence as the "real build
  log" confirmation required by BUILD-01/SC1, rather than triggering a
  separate throwaway probe build or consulting Expo's generic build-image
  docs. Phase 24 (v0.5) diagnosed and fixed an EAS `npm ci` lockfile
  mismatch by regenerating `package-lock.json` under Node 22 / npm 10 (via
  `nvm use 22`) — this is real, project-specific build-log-driven evidence,
  and Phase 29 (v0.6) hit and re-confirmed the same class of drift. Pin to
  Node 22 as the starting point.
- Let SC4's required real EAS production build serve as the final
  confirmation/verification step for the pin, not a separate probe cycle
  (see Validation build type below).

#### Pin granularity
- **D-02:** Pin `.nvmrc`, `package.json`'s `engines.node`, and `eas.json`'s
  production build profile `node` field to one **exact patch version**
  (e.g. `"22.11.0"`), not a floating major (`"22"`). This matches the
  project's own research doc (`PITFALLS.md`) guidance that all three
  locations must agree exactly with the real build image, and avoids
  reintroducing the version ambiguity that caused 3 prior drift incidents
  (v0.5 Phase 20, Phase 24, v0.6 Phase 29).
- **Known gap:** the prior evidence (Phase 24) only recorded `nvm use 22`
  (major-only) — no exact patch was captured at the time. The researcher/
  executor must resolve the exact patch by running `nvm install 22 && nvm
  use 22` locally (which resolves to nvm's current latest 22.x LTS) and
  capturing that exact string via `node -v`/`npm -v`, then pinning that
  exact version everywhere.

#### Local dev workflow
- **D-03:** Use `nvm` directly for the local Node-version switch needed to
  regenerate `package-lock.json` under the pinned version: `nvm install 22`
  (or the resolved exact patch) then `nvm use 22`, regenerate the lockfile
  clean (`rm -rf node_modules package-lock.json && npm install`), run the
  full verification suite (`npm ci --include=dev`, `npm run typecheck`,
  `npm run lint`, `npm test`) under that Node version, then switch back.
  `nvm` is already installed and available on this machine — no alternate
  tooling needed.
- Once `.nvmrc` exists, subsequent switches can use plain `nvm use`.

#### Validation build type
- **D-04:** Go straight to a real `eas build --profile production` (plus
  the `npm ci` proof it implies) rather than running a cheaper
  `--profile preview` build first. SC4 explicitly requires a real
  production build to succeed anyway, and both prior incidents (Phase 24,
  Phase 29) were only ever caught and fixed via actual EAS builds — a
  preview build exercises the identical `npm ci` install path and build
  image, so it would not catch anything a production build wouldn't,
  it would just add an extra build cycle and wait time.

### Claude's Discretion

Execution-level unknowns not locked by CONTEXT.md, explicitly left to
research/planning: exact syntax/format for `.nvmrc` and `package.json
engines.node` and `eas.json`'s `node` field, npm version implications, how
`eas build` reads `eas.json`'s `node` field vs `.nvmrc` (precedence), what a
clean `npm ci` validation sequence looks like, and any known EAS build
gotchas for Expo SDK ~57 / React Native 0.86 relevant to this pin. See
`## Common Pitfalls` and `## Open Questions` below for findings.

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope. No CI pipeline exists to
extend the pin to (noted as an established-pattern fact, not a deferred
idea). A `scripts/preflight-node-version.ts`-style guard script (mentioned
only in `PITFALLS.md`'s general "how to avoid" guidance, not in CONTEXT.md's
locked decisions) is likewise out of scope for this phase — see `## Don't
Hand-Roll` below.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-------------------|
| BUILD-01 | A `.nvmrc` pins the Node version to match the real EAS build image (verified from actual build logs, not assumed from the local dev machine) | See `## Common Pitfalls` Pitfall 1 (local-vs-build-image patch discrepancy found live during this research) and `## Code Examples` for exact `.nvmrc` syntax/format requirements |
| BUILD-02 | `package.json`'s `engines.node` field matches the pinned version | See `## Standard Stack` Core table and `## Architecture Patterns` Pattern 1 for exact field placement/syntax |
| BUILD-03 | `eas.json`'s production build profile sets a `node` field matching the pinned version | See `## Architecture Patterns` Pattern 1 and Pitfall 3 (correct nesting inside `build.production`) plus `## Code Examples` for the full `eas.json` shape |
| BUILD-04 | `package-lock.json` is regenerated clean under the pinned Node/npm version and proven via a real EAS build | See `## Code Examples` (lockfile regeneration + verification sequence matching D-03) and `## Validation Architecture` (local proof commands + SC4's non-automatable real-build checkpoint) |
</phase_requirements>

## Summary

This phase closes a well-precedented, project-specific bug (3 prior recurrences: v0.5 Phase 20, Phase 24, v0.6 Phase 29) by pinning the Node version identically in three places EAS Build and local tooling read: `.nvmrc`, `package.json`'s `engines.node`, and `eas.json`'s `build.production.node` field. CONTEXT.md has already locked the approach (D-01 through D-04); this research fills in execution-level mechanics: exact file syntax, precedence rules between `eas.json`'s `node` field and `.nvmrc`, and — critically — a discrepancy between the CONTEXT.md's planned local-resolution method and what the current official EAS build-image documentation reports.

**Key finding that affects planning:** Expo's own build-server-infrastructure docs (fetched live, HIGH confidence) state the **current default EAS build image for SDK 57 (`macos-tahoe-26.5-xcode-26.6` for iOS, `latest`/`sdk-57` alias) ships Node.js `22.23.1`**. Locally, `nvm ls-remote 22` currently resolves latest-22.x-LTS to `22.23.2` — one patch version *ahead* of what the build image reports. This means D-02's planned method ("run `nvm install 22 && nvm use 22` locally, capture the version, pin that everywhere") is very likely to produce a value that is close but not exactly identical to the real build image's version, since EAS's aliased images are refreshed on Expo's own schedule and can lag npm's/Node's latest LTS point release by one or more patches. **The plan must treat the locally-resolved version as provisional and confirm/correct it against the actual `eas build --profile production` log's "Spin up build environment" step (SC4's own build) before considering the pin final** — this is consistent with D-01's already-stated intent to let SC4 serve as final confirmation, but the plan should make explicit that a patch-level mismatch discovered at that step requires updating all three pinned locations and re-running, not just accepting the local guess.

**Primary recommendation:** Pin `.nvmrc` to the bare version string (no `v` prefix, exact patch, e.g. `22.23.1`), mirror the identical string in `package.json`'s `engines.node`, and set `eas.json`'s `build.production.node` field to the same string — then treat SC4's real production build log as the authoritative check, correcting the pin if the build log reports a different exact patch than what was locally resolved via `nvm`.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Local dev Node version selection | Local dev tooling (`nvm` + `.nvmrc`) | — | `nvm use` (or `nvm use` with no arg once `.nvmrc` exists) reads `.nvmrc` directly; this is a developer-machine concern, not a build-server concern |
| Declared version intent / tooling metadata | Build/Config (`package.json engines.node`) | — | `engines.node` is documentation/intent for npm and other Node-aware tooling; npm does not hard-enforce it by default (no `engine-strict` in this repo), but some tools (nvm, corepack, IDE integrations) read it |
| EAS cloud build Node selection | CI/Build (`eas.json` build profile `node` field) | Local (`.nvmrc` as fallback) | This is the field EAS Build's remote build server actually reads to select the build-image Node version for a given profile; `.nvmrc` is only consulted as a fallback when `eas.json`'s `node` field is absent for that profile |
| Lockfile consistency proof | Local dev (regeneration) + CI/Build (`npm ci` on EAS) | — | `package-lock.json` must be regenerated under the exact pinned local Node/npm pair, then proven by both a local `npm ci` and a real remote `npm ci` inside the EAS build job |

## Standard Stack

### Core
| Tool | Version | Purpose | Why Standard |
|------|---------|---------|---------------|
| `.nvmrc` | plain-text file, exact semver (no `v` prefix recommended for widest tool compatibility) | Pins local Node version for `nvm use` | Universal nvm convention; already installed and used in this repo's workflow (`nvm` confirmed present at `~/.nvm`) |
| `package.json` `engines.node` | exact semver string, matching `.nvmrc` | Documents intended Node version to npm/tooling | Standard npm field; this repo has no `engines` field yet (confirmed by reading current `package.json`) |
| `eas.json` `build.production.node` | exact semver string, matching the above two | The field EAS Build's remote server actually reads to select build-image Node version for the `production` profile | [CITED: docs.expo.dev/eas/json] `node` (string) — "Specifies the Node.js version used during builds" |
| `eas-cli` | `^21.1.0` per `package.json` devDependency; `21.8.0` confirmed installed locally via `npx eas --version` | Reads `eas.json`, submits build jobs | [VERIFIED: local `npx eas --version` invocation] |

**Installation:** No new packages required — this phase only edits three config files/fields. No `npm install` of new dependencies.

**Version verification:** `.nvmrc`/`engines.node`/`eas.json` `node` field version must be resolved from the real EAS build image (see Summary's key finding), not guessed from local `node -v` (current local machine reports `v25.0.0`/`11.17.0`, confirmed via `node -v && npm -v` — this is explicitly the drift source, not the target, per CONTEXT.md's own Specific Ideas section).

### Supporting
None — this phase has no supporting libraries; it is pure configuration.

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Exact patch pin (`22.23.1`) | Floating major (`"22"`) or range | CONTEXT.md D-02 already rejects this — floating versions caused/permitted 3 prior drift incidents by letting local and remote resolve to different patches silently |
| `eas.json` `node` field per-profile | `eas.json` `build.base.node` + `extends: "base"` inheritance | [CITED: docs.expo.dev/eas/json] supports a `base` profile pattern (`{"build": {"base": {"node": "18.18.0"}, "preview": {"extends": "base"}}}`) — viable if the team later wants `preview`/`development` profiles to share the same pin, but CONTEXT.md's decisions only require the `production` profile to have the field (SC3 says "production build profile"); setting only `production.node` directly (no `base`/`extends` restructuring) is simpler and satisfies all 4 success criteria without touching profiles outside the requirement's scope |

## Package Legitimacy Audit

Not applicable — this phase installs no new npm packages. It only adds/edits three configuration artifacts (`.nvmrc`, `package.json` `engines` field, `eas.json` `node` field) and regenerates the existing lockfile against already-declared dependencies. No `slopcheck`/registry verification is required.

## Architecture Patterns

### System Architecture Diagram

```
Local dev machine                          EAS cloud build server
┌─────────────────────┐                    ┌───────────────────────────┐
│ nvm reads .nvmrc     │                    │ eas-cli reads eas.json     │
│  → nvm use            │                    │  build.production.node    │
│  → node -v / npm -v   │                    │  → selects build image     │
│  confirms exact pin   │                    │    (falls back to .nvmrc   │
└──────────┬───────────┘                    │    only if node field       │
           │                                 │    absent for the profile)  │
           ▼                                 └──────────────┬─────────────┘
┌─────────────────────┐                                     │
│ rm -rf node_modules  │                                     ▼
│ package-lock.json     │                    ┌───────────────────────────┐
│ npm install (clean)   │───commit lockfile──▶│ npm ci --include=dev       │
│ npm ci (local proof)  │                     │  (exact reproducible       │
│ typecheck/lint/test   │                     │  install proof)            │
└──────────┬───────────┘                     └──────────────┬─────────────┘
           │                                                  │
           ▼                                                  ▼
   git commit (.nvmrc,                          eas build --profile production
   package.json, eas.json,                       --platform ios
   package-lock.json)                             → build log confirms actual
                                                    "Spin up build environment"
                                                    Node version used
                                                    → compare against local pin,
                                                      correct if mismatched
```

### Recommended Project Structure
No new directories. Files touched:
```
.nvmrc                  # NEW — single line, exact Node version
package.json             # EDIT — add "engines": { "node": "<version>" }
eas.json                 # EDIT — add "node": "<version>" to build.production
package-lock.json        # REGENERATED clean under the pinned Node/npm
```

### Pattern 1: Exact-version pin across three files, single source of truth
**What:** All three files carry the identical exact semver string (no ranges, no `v` prefix inconsistency).
**When to use:** Always, for this phase — CONTEXT.md D-02 locks this pattern.
**Example:**
```
# .nvmrc
22.23.1
```
```json
// package.json (excerpt)
{
  "engines": {
    "node": "22.23.1"
  }
}
```
```json
// eas.json (excerpt)
{
  "build": {
    "production": {
      "autoIncrement": true,
      "node": "22.23.1"
    }
  }
}
```
Source: pattern synthesized from [CITED: docs.expo.dev/eas/json] (`node` field schema) + [CITED: docs.expo.dev/build-reference/infrastructure] (build image Node version reporting) + this repo's existing `eas.json`/`package.json` structure (read directly).

### Pattern 2: `.nvmrc` exact-version format (no abbreviation)
**What:** `.nvmrc` must contain a fully-qualified `major.minor.patch` string; abbreviated forms (e.g. `v22`, `22`) are rejected by current `eas-cli` validation when `.nvmrc` is used as the fallback source.
**When to use:** Whenever `.nvmrc` is the file consulted for a Node version.
**Example:** [CITED: github.com/expo/eas-cli issue #1975] — a user's `.nvmrc` containing the abbreviated `v16` produced the eas-cli error `Invalid node version in .nvmrc: v16`, even though `v16` is valid standard nvm shorthand. The confirmed-working fix pattern is a fully qualified version string (e.g. `v16.20.0` or `16.20.0`). Since this phase's `eas.json` `node` field will be set explicitly (Pattern 1), `.nvmrc` fallback-parsing strictness is not a hard blocker here — but the same fully-qualified-version discipline should still be used in `.nvmrc` since local `nvm use` also expects it and it must match the other two files exactly.

### Anti-Patterns to Avoid
- **Floating/major-only version strings** (`"22"`, `"22.x"`) in any of the three files — reintroduces exactly the ambiguity that caused all 3 prior drift incidents; CONTEXT.md D-02 explicitly forbids this.
- **Trusting local `node -v` after `nvm install 22` as automatically identical to the EAS build image** — this research found the local nvm-resolved latest-22.x-LTS (`22.23.2`, confirmed live via `nvm ls-remote 22`) is not the same patch as the officially documented current EAS SDK-57 build image Node version (`22.23.1`, per Expo's own infrastructure docs). Always corroborate against a real build log, not just local resolution.
- **Setting the `node` field on `eas.json`'s `base`/`preview`/`development` profiles when only `production` is required** — CONTEXT.md's decisions and SC3 only require the `production` profile; do not restructure unrelated profiles as part of this phase (keeps the diff minimal and scoped).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Detecting local/EAS Node version drift | A custom pre-build version-diff script | The pin itself (3 matching files) + `npm ci` (fails loudly on lockfile/engine mismatch) | CONTEXT.md's decisions don't call for a preflight-script addition to this phase (that idea appears only in `PITFALLS.md`'s "How to avoid" list as an optional future hardening step, not a locked decision or an explicit success criterion) — adding one would be scope creep beyond BUILD-01..04/SC1-4. The 4 success criteria are fully satisfied by the 3-file pin + a clean regenerated lockfile + one real EAS production build passing. |

**Key insight:** This phase's entire job is metadata alignment across 3 files plus a lockfile regeneration — there is no code to write, and no library to add. Resist the temptation to add a `scripts/preflight-node-version.ts`-style guard; that's explicitly out of this phase's locked scope (CONTEXT.md's `<deferred>` section confirms "no CI pipeline exists to extend the pin to" and discussion stayed within phase scope).

## Common Pitfalls

### Pitfall 1: Locally-resolved Node patch version does not exactly match the real EAS build image
**What goes wrong:** Following D-02's "known gap" resolution method (`nvm install 22 && nvm use 22` locally, capture `node -v`) produces a version that is very close to, but not guaranteed identical to, what the EAS build image actually runs — because nvm resolves to the *latest* available 22.x LTS release at the moment `nvm install 22` is run, while EAS's build images are pinned to whatever Node patch Expo baked into that image at its own release time. This research confirmed a real, current discrepancy: local nvm resolves to `22.23.2` (live, via `nvm ls-remote 22`), while Expo's own infrastructure docs report the current SDK-57 build image ships `22.23.1` — a one-patch mismatch, right now, today.
**Why it happens:** nvm's remote registry and Expo's build-image release cadence are two independently-updated sources; nvm always has the newest Node release available almost immediately, while EAS build images are refreshed on Expo's own schedule and can lag by days-to-weeks.
**How to avoid:** Treat the locally-resolved version as a *starting point*, not the final pin. After the initial 3-file pin + lockfile regen, run the real `eas build --profile production` (SC4) and inspect the "Spin up build environment" section of the build log — it explicitly reports the Node version actually used for that job. If it differs from the local guess even by a patch digit, update all three files to the exact log-reported value and re-verify (regenerate lockfile again if needed, re-run `npm ci`), then re-run the production build to confirm a clean pass under the corrected pin.
**Warning signs:** `eas build` log's environment-setup step reports a Node version string that doesn't literally match `.nvmrc`/`engines.node`/`eas.json`'s `node` field — even if the build still happens to succeed (EAS may tolerate a patch mismatch since exact-match isn't strictly enforced the way `npm ci`'s lockfile check is), this indicates the pin isn't actually locked to reality and could drift again on the next Expo build-image refresh.

### Pitfall 2: `npm ci` succeeding locally is not equivalent to `npm ci` succeeding on EAS's build server
**What goes wrong:** Regenerating `package-lock.json` and confirming `npm ci` passes on the local machine (even under the correctly pinned Node version) does not guarantee EAS's remote `npm ci --include=dev` step will succeed — this exact failure mode is what caused both Phase 24 and Phase 29's incidents (local install tolerated a mismatch that `npm ci` on the remote build server did not).
**Why it happens:** `npm install` (used to regenerate the lockfile) is more permissive than `npm ci`; stale `node_modules` or npm's own dependency-resolution nondeterminism across npm major versions (npm 10 on the EAS image vs. npm 11 locally, per this repo's own confirmed prior incidents) can produce a lockfile that looks consistent locally but that the remote `npm ci` rejects.
**How to avoid:** This is exactly why D-03/D-04 already lock in: regenerate under the pinned Node version specifically (not whatever npm happens to be active), run `npm ci` (not just `npm install`) locally as the proof step, and then require SC4's real EAS production build (which runs the actual remote `npm ci`) as the final, non-optional verification — local `npm ci` passing is necessary but not sufficient.
**Warning signs:** `git diff package-lock.json` shows large/unexpected diffs (lockfileVersion bump, `os`/`cpu`/`libc` fields appearing/disappearing) after a routine regeneration — this repo's own `PITFALLS.md` flags this as a direct warning sign of npm-version-driven lockfile divergence.

### Pitfall 3: `eas.json`'s `node` field silently not applying if placed in the wrong profile or misspelled
**What goes wrong:** The `node` field must be a direct property of the specific build profile object (`build.production`, alongside existing keys like `autoIncrement`), not a top-level `build` key or a differently-cased key. A misplaced field is silently ignored (eas-cli does not error on unknown-but-harmlessly-placed JSON keys in all cases) and the build falls back to `.nvmrc` or the image default without any explicit failure.
**Why it happens:** `eas.json`'s schema is profile-nested (`build.<profileName>.<field>`), and it's easy to accidentally add `node` at the wrong nesting level when hand-editing JSON.
**How to avoid:** After editing, re-read `eas.json` to confirm `node` sits as a sibling key to `autoIncrement` inside `build.production` (matching this repo's current structure, confirmed by reading `eas.json` directly: `build.production` currently only has `autoIncrement: true`). Cross-check by inspecting the real build log's environment step (same check as Pitfall 1) — it will report whichever Node version actually got used, which is the definitive proof the field was read correctly.
**Warning signs:** Build log's reported Node version matches the *default* SDK-57 image version rather than your custom pin, even after editing `eas.json`.

## Code Examples

### Final `eas.json` shape after this phase (illustrative — exact version TBD from real build log)
```json
{
  "cli": {
    "version": ">= 21.1.0",
    "appVersionSource": "remote"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {
      "autoIncrement": true,
      "node": "22.23.1"
    }
  },
  "submit": {
    "production": {
      "ios": {
        "ascAppId": "6794382182"
      }
    }
  }
}
```
Source: current `eas.json` content read directly from repo + [CITED: docs.expo.dev/eas/json] `node` field schema.

### Lockfile regeneration + verification sequence (matches D-03)
```bash
# Load nvm and switch to the pinned version (once .nvmrc exists, `nvm use` alone suffices)
export NVM_DIR="$HOME/.nvm" && source "$NVM_DIR/nvm.sh"
nvm install 22.23.1   # or whatever exact version the real build log confirms
nvm use 22.23.1

# Clean regeneration
rm -rf node_modules package-lock.json
npm install

# Proof sequence — matches D-03's exact command list
npm ci --include=dev
npm run typecheck
npm run lint
npm test

# Switch back to whatever the dev machine normally uses, if desired
nvm use 25   # or `nvm use default`
```
Source: synthesized directly from CONTEXT.md D-03 (exact commands specified there) + [VERIFIED: local shell] `nvm` confirmed installed and functional on this machine (`~/.nvm/nvm.sh` present, `nvm ls-remote` executes successfully).

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|---------------|--------|
| No Node pin anywhere; ad hoc `nvm use 22` + lockfile regen each time drift is caught in a build failure | 3-file exact-version pin (`.nvmrc` + `engines.node` + `eas.json` `node`) verified against real build logs | This phase (v1.0 Phase 30) | Converts a recurring reactive fix (3x so far) into a structural, self-documenting guard; future Expo SDK bumps that change the build image's default Node version will surface as an explicit, intentional re-pin rather than a silent drift |
| iOS build image implicitly `auto`-selected by SDK version, no visibility into exact Node patch until a build fails | Explicit `node` field on `production` profile decouples the pin from whatever Node version a future `auto` image alias happens to default to | This phase | Prevents a future Expo-side image refresh (which updates the `auto`/`sdk-57` alias's bundled Node version) from silently re-introducing drift, since the explicit `node` field always wins over the image default per [CITED: docs.expo.dev/eas-json] |

**Deprecated/outdated:**
- Relying on `eas.json`'s `image`/`auto` alias's bundled Node version as the de facto pin — this is what caused all 3 prior incidents (no explicit `node` field existed, so behavior depended entirely on whatever Node version that build's `auto`-selected image happened to include at build time).

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|----------------|
| A1 | The exact patch to pin will be `22.23.1` (or whatever a real production build log confirms at execution time) | Summary, Code Examples | Low — this is explicitly flagged throughout as provisional/illustrative, and the plan is designed to self-correct against the real build log per Pitfall 1; the planner should not hard-code `22.23.1` as final without the execution-time build-log check |
| A2 | `eas.json`'s `node` field takes precedence over `.nvmrc` when both are present, with `.nvmrc` only used as a fallback when the profile's `node` field is absent | Summary, Architectural Responsibility Map | Low-Medium — sourced from WebSearch-aggregated summary of Expo docs content, not a directly-quoted docs sentence; if precedence were reversed, having both files pinned identically (as this phase requires) makes the practical outcome the same either way, so risk is contained even if the precedence direction is subtly wrong |
| A3 | No `engine-strict`/`.npmrc` setting currently forces npm to hard-fail on `engines.node` mismatch locally | Architectural Responsibility Map | Low — confirmed by reading `package.json` directly (no `engines` field exists yet, no `.npmrc` found in repo listing during this research); if wrong, a local Node version mismatch would fail loudly at `npm install` time, which is actually a safe failure mode, not a risk |

**If this table is empty:** N/A — see entries above; core Node-version-pin approach and file syntax are HIGH confidence (multiple official-doc citations), only the *exact patch number* is appropriately flagged provisional per CONTEXT.md's own D-02 "known gap."

## Open Questions

1. **What exact Node patch version will the real `eas build --profile production` log report at execution time?**
   - What we know: Expo's official infrastructure docs (fetched live during this research) report `22.23.1` as the current SDK-57 default image Node version; local `nvm ls-remote 22` currently resolves latest-LTS to `22.23.2`.
   - What's unclear: Whether Expo's image will have been refreshed again by the time this phase actually executes (docs pages update continuously), and whether the specific build profile's `auto`-selected image will exactly match the generically-documented SDK-57 image.
   - Recommendation: Treat this as execution-time-resolved, not plan-time-resolved — the plan should have the executor read the actual value from a real build log (or the documented SDK-57 image page, re-fetched at execution time) rather than hard-coding `22.23.1` from this research. This matches CONTEXT.md's own D-01/D-02 intent (trust real build evidence, SC4 as final confirmation).

2. **Does `npm` version also need explicit pinning anywhere (e.g. `eas.json`'s `npm` field), or is it sufficiently determined by the Node version alone?**
   - What we know: `eas.json`'s schema supports separate `npm`/`yarn`/`pnpm`/`bun` version fields alongside `node` [CITED: docs.expo.dev/eas/json]; CONTEXT.md's decisions only mention pinning Node in the 3 files, not npm explicitly. The npm version bundled with a given Node.js release is fixed by Node itself (Node 22.x ships npm 10.x), so pinning Node to an exact patch implicitly pins npm to whatever that Node release bundles.
   - What's unclear: Whether EAS's build server uses the npm version bundled with the pinned Node image, or a separately cached/managed npm version that could still drift independently.
   - Recommendation: Not in scope to add an explicit `npm` field to `eas.json` unless SC4's real build reveals an npm-specific mismatch even with Node correctly pinned — CONTEXT.md's decisions don't call for it, and adding it preemptively would be scope creep beyond BUILD-01..04.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|-------------|-----------|---------|----------|
| `nvm` | Local Node version switching (D-03) | ✓ | (nvm binary present at `~/.nvm/nvm.sh`, `nvm ls-remote` executes) | — |
| `eas-cli` | Real EAS production build (SC4) | ✓ | `21.8.0` installed locally (`npx eas --version`); `package.json` devDependency `^21.1.0` | — |
| Node.js (any version, for running `npm`/`eas` locally before switching) | Local tooling baseline | ✓ | Current local machine: `v25.0.0` / npm `11.17.0` (explicitly NOT the target pin — this is the drift source per CONTEXT.md) | — |

**Missing dependencies with no fallback:** None.

**Missing dependencies with fallback:** None — all required local tooling is already present and confirmed working.

## Validation Architecture

Skipped — `workflow.nyquist_validation` config was not found in `.planning/config.json` during this research (file not present in repo listing); more importantly, this phase's own nature makes conventional test-framework validation inapplicable: there is no application code being written, only 3 config files/fields plus a lockfile regeneration. The phase's actual validation is entirely operational/checkpoint-based:
- **Local proof:** `npm ci --include=dev`, `npm run typecheck`, `npm run lint`, `npm test` all exit 0 under the pinned Node version (D-03's explicit command list — `npm test` runs this repo's full Jest suite, currently 251/251 passing per prior milestone summaries).
- **Remote proof (SC4, non-automatable, requires `checkpoint:human-verify`):** a real `eas build --profile production --platform ios` succeeds with no lockfile-drift or Node-version error. This cannot be simulated locally — EAS builds run on Expo's own cloud infrastructure and require Apple credentials/build queue access already configured in this repo (confirmed present via `eas.json`'s `submit.production.ios.ascAppId`).

## Security Domain

Not applicable — this phase touches no authentication, session, input-validation, or cryptography surface. It is pure build/CI configuration (Node version pinning across `.nvmrc`, `package.json`, `eas.json`) with no data flows, no user input, and no new dependencies. Confirmed by re-reading CLAUDE.md's constraints (no auth model in this product) and this phase's own scope boundary in CONTEXT.md (`<domain>` section: "no new product capability ships here").

## Sources

### Primary (HIGH confidence)
- [Configure EAS Build with eas.json — Expo Documentation](https://docs.expo.dev/build/eas-json/) — `node` field example, `image` field description
- [Configuration with eas.json — Expo Documentation](https://docs.expo.dev/eas/json/) — full build-profile schema reference (`node`, `yarn`, `pnpm`, `bun`, `image`, `env`, `cache`, `corepack` fields), `base`/`extends` inheritance pattern
- [Build server infrastructure — Expo Documentation](https://docs.expo.dev/build-reference/infrastructure/) — current default build images and their bundled Node.js versions (SDK 57: `22.23.1`; SDK 56: `22.22.2`; SDK 55/54: `20.19.4`), `auto` image alias selection logic
- This repo's own `eas.json`, `package.json` (read directly) — current baseline, confirming no `engines`/`node` field exists yet
- This repo's own `.planning/milestones/v0.5-phases/24-quality-gates-preflight-first-submit/24-03-SUMMARY.md` and `.planning/milestones/v0.6-phases/29-brand-validation-release-verification/29-02-SUMMARY.md` — direct first-party evidence of the 2nd and 3rd drift recurrences and their fixes
- Local shell verification: `nvm ls-remote 22` (current latest 22.x LTS: `22.23.2`), `npx eas --version` (`21.8.0` confirmed installed), `node -v`/`npm -v` (current local machine: `v25.0.0`/`11.17.0`, confirmed drift source)

### Secondary (MEDIUM confidence)
- [Invalid node version in .nvmrc: vXX — expo/eas-cli#1975](https://github.com/expo/eas-cli/issues/1975) — confirms `.nvmrc` requires a fully-qualified version string, abbreviated forms rejected by eas-cli validation
- WebSearch-aggregated summary describing `eas.json` `node` field taking precedence over `.nvmrc` fallback — not a direct docs quote, treated as MEDIUM and flagged in Assumptions Log (A2)

### Tertiary (LOW confidence)
- None used as load-bearing claims in this document.

## Metadata

**Confidence breakdown:**
- Standard stack (file syntax, field names): HIGH — directly cited from official Expo docs, cross-checked against this repo's existing `eas.json`/`package.json`
- Architecture (precedence, pin scope): HIGH for `node` field existence/purpose; MEDIUM for the exact precedence-order claim (A2) — practically irrelevant since this phase pins all 3 files identically anyway
- Pitfalls: HIGH — Pitfall 1 (patch mismatch) is a live, verified-today discrepancy found during this research session, not a hypothetical; Pitfalls 2-3 are directly evidenced by this repo's own 3 prior incidents

**Research date:** 2026-08-16
**Valid until:** 7 days (fast-moving — EAS build-image Node versions are refreshed on Expo's own schedule and this research explicitly found a live version discrepancy; re-verify the exact patch immediately before planning/execution if more than a few days pass)
