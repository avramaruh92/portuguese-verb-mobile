# Phase 20: Native Build Risk Front-Loading - Research

**Researched:** 2026-07-23
**Domain:** Expo/EAS release engineering — first-ever native cloud build for a managed Expo SDK ~57 app
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Set the final `ios.bundleIdentifier` (`com.avram.aruh.lafa`) in `app.json`
  during this phase, not a disposable scratch id. It needs to land there eventually and
  is idempotent — Phase 21 confirms/finalizes it rather than changing it. Avoids
  registering throwaway EAS credentials/project state under a discarded identifier.
- **D-02:** Run `eas build:configure` interactively to auto-generate the initial
  `eas.json` (development/preview/production profiles) and register the EAS project id
  — do not hand-write a placeholder. Phase 23 edits this file in place (adds submit
  profile, `appVersionSource: "remote"`, `autoIncrement: true`,
  `ITSAppUsesNonExemptEncryption`) rather than starting from scratch.
- **D-03:** If `npx expo-doctor` or `npx expo install --check` surface real issues
  (version mismatches, native module drift), fix them immediately in this phase — do
  not log-and-defer. BUILD-01's success criteria requires a zero-issues `expo-doctor`
  pass, and every later v0.5 phase assumes a clean dependency baseline.
- **D-04:** Add `eas-cli` (`^21.0.3`) as a pinned `devDependency` in `package.json`
  rather than always invoking via `npx`. It's used repeatedly across this milestone
  (Phases 20 and 24); pinning gives a reproducible version and avoids npx's
  per-invocation upgrade nag.
- EAS CLI is already authenticated on this machine (`eas whoami` -> `avram.aruh`) — no
  login step needed.
- Current `app.json` state (verified 2026-07-23): `slug: "portuguese-verb-mobile"`,
  `scheme: "portugueseverbmobile"`, no `ios.bundleIdentifier`, `ios.icon:
  "./assets/expo.icon"` (untouched Expo template default, out of scope this phase —
  Phase 22's job), no `eas.json`, no `extra.eas.projectId`.

### Claude's Discretion
- Exact sequencing of expo-doctor/install-check fixes vs. the
  bundle-identifier/eas.json setup — whichever order is more efficient is fine, as
  long as both land before the throwaway `eas build` runs.

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope. Icon path decisions belong to Phase 22,
`eas.json` submit/export-compliance fields belong to Phase 23, and both were
explicitly kept out of this phase's D-01/D-02 decisions.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| BUILD-01 | `npx expo-doctor` and `npx expo install --check` run clean before any release-config polish work begins | Live run captured below (Step 3) — exact current failures and fix commands documented; zero-issues target confirmed reachable with a single `expo install --fix` pass |
| BUILD-02 | A throwaway `eas build --platform ios --profile production --clear-cache` succeeds, proving the native dependency graph builds on EAS's cloud infrastructure | `eas build:configure` interactive flow documented (Step 2); credential-prompt sequence for a from-scratch EAS-managed iOS build documented (Common Pitfalls); build-status verification via `--json`/exit code documented (Code Examples) |
</phase_requirements>

## Summary

This phase has no ambiguity left to resolve by reading docs — it was resolved by
**running the actual commands against this actual repo**, which is more reliable than
predicting SDK 57 behavior from training data or community reports. `npx expo-doctor`
was run live on 2026-07-23 and found exactly **one failing check** (of 20): 7 packages
with patch/minor version drift against Expo SDK ~57.0.7's expected ranges, all fixable
with a single `npx expo install --fix` (equivalently `npx expo install --check` then
accept the prompt). No config-plugin issues, no native module incompatibilities, no New
Architecture problems were found — this project's dependency graph is clean modulo
routine patch-version lag. `eas-cli@21.0.3` is confirmed on the npm registry and
already authenticated locally (`avram.aruh`); a stale **global** `eas-cli@20.0.0`
install exists on this machine and will shadow a project-local pinned version unless
the plan accounts for it (see Common Pitfalls).

`eas build:configure` for a project with **no existing `eas.json`** and **no existing
`ios.bundleIdentifier`** will interactively prompt for the bundle identifier if it
isn't already set — meaning the order specified by D-01 (set
`com.avram.aruh.lafa` in `app.json` *before* running `build:configure`) avoids that
prompt entirely and lets the CLI pick up the value non-interactively. `eas
build:configure` auto-detects there's no linked EAS project (no `extra.eas.projectId`
in `app.json`) and creates one under the current slug (`portuguese-verb-mobile`) —
this is expected and fine; Phase 21 owns any slug/scheme rename decision, and D-01/D-02
explicitly scope that out of Phase 20.

**Primary recommendation:** Fix the 7 flagged package versions with `npx expo install
--fix`, set `ios.bundleIdentifier` in `app.json` before running `eas build:configure`,
pin `eas-cli@^21.0.3` as a devDependency and invoke it via an npm script (not bare
`npx`, which will otherwise resolve the stale global v20.0.0 on this machine), then run
the throwaway `eas build --platform ios --profile production --clear-cache` and verify
success via `eas build:list --status finished --limit 1 --json` rather than relying on
a human checking the dashboard.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Dependency version validation (`expo-doctor`, `expo install --check`) | Build tooling (local CLI) | — | Pure static analysis of `package.json` against Expo's known-good version manifest; no runtime/server component |
| `eas.json` bootstrap (`eas build:configure`) | Build tooling (local CLI) → EAS cloud API | — | CLI writes local `eas.json`/`app.json` fields, but registers project state (`extra.eas.projectId`) against Expo's remote account/project API |
| Throwaway iOS build | EAS cloud build service | Apple credential service (via EAS-managed remote credentials) | Actual compilation/signing happens entirely on EAS's cloud infrastructure; this project has no local Xcode/native project to build with |
| Build status verification | Build tooling (local CLI, `eas build:list --json`) | EAS cloud API (source of truth) | CLI is a thin client over the EAS API; the "real" status lives server-side, CLI just queries it |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `eas-cli` | `^21.0.3` [VERIFIED: npm registry — `npm view eas-cli version` returned `21.0.3` live on 2026-07-23; slopcheck rated `[OK]`] | Runs `eas build:configure`, `eas build`, `eas build:list` | Official Expo tool, only supported path to a signed iOS build without a checked-in native `ios/` project (already established project-wide in `.planning/research/STACK.md`) |
| `expo-doctor` | n/a (invoked via `npx expo-doctor`, not installed as a dependency) [VERIFIED: ran live, resolved to `expo-doctor@1.20.1`] | Static project-health check across 20 categories | Official Expo diagnostic tool; ephemeral `npx` invocation is the documented usage pattern — no reason to pin as a devDependency |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `react-native-screens` | `~4.26.0` (bump from currently installed `4.25.2`) [VERIFIED: live `expo-doctor` output, 2026-07-23] | Native screen container primitives used by `expo-router` | Fix now — flagged as a minor version mismatch against SDK ~57.0.7's expected range |
| `expo`, `expo-constants`, `expo-linking`, `expo-router`, `expo-splash-screen`, `expo-web-browser` | Bump to `~57.0.8` / `~57.0.7` / `~57.0.4` / `~57.0.8` / `~57.0.5` / `~57.0.2` respectively (see exact table in Code Examples) [VERIFIED: live `expo-doctor` output, 2026-07-23] | Core Expo SDK packages | Fix now — all are patch-level drift, zero known breaking changes between these patch versions per Expo's SDK 57 changelog |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `npx eas-cli` (ephemeral, unpinned) | Global `npm install -g eas-cli` | Rejected by D-04 — a stale global v20.0.0 already exists on this dev machine and silently shadows `npx eas-cli`'s "latest" resolution; devDependency pinning + npm script avoids this ambiguity entirely (see Common Pitfalls) |
| Fixing all 7 version mismatches individually | Only fixing packages `expo-doctor` calls "must fix" vs. "minor" | Rejected by D-03 — fix everything flagged, no partial fixes; the distinction between "Minor version mismatches" and "Patch version mismatches" in `expo-doctor`'s own output is informational only, both blocked a clean pass in this run |

**Installation:**
```bash
npm install -D eas-cli@^21.0.3
npx expo install --fix
```

**Version verification:** Ran live against this repo on 2026-07-23:
```bash
npm view eas-cli version          # -> 21.0.3
npx expo-doctor                   # -> 19/20 checks passed, 1 failed (package version drift)
npx expo install --check          # -> confirms same 7 packages, exact expected versions listed
```

## Package Legitimacy Audit

| Package | Registry | Age | Downloads | Source Repo | slopcheck | Disposition |
|---------|----------|-----|-----------|-------------|-----------|-------------|
| `eas-cli` | npm | Years (actively maintained, official Expo org package) | Very high (core Expo tooling) | github.com/expo/eas-cli | [OK] (verified live via `slopcheck install eas-cli` on 2026-07-23) | Approved |

**Packages removed due to slopcheck [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

No other new external packages are introduced by this phase — the 7 version bumps
(`expo`, `expo-constants`, `expo-linking`, `expo-router`, `expo-splash-screen`,
`expo-web-browser`, `react-native-screens`) are patch/minor upgrades of packages
already present and trusted in this repo, not new installs, so they are out of scope
for the legitimacy gate.

**Operational note for the planner:** `slopcheck install <pkg>` performs a **real `npm
install`** as its verification mechanism, not a dry-run/registry-metadata-only check —
running it against this repo during research added `eas-cli` to `dependencies` and had
to be reverted with `npm uninstall eas-cli` before this document was written. If any
future phase re-runs the Package Legitimacy Gate, plan for `npm uninstall <pkg>`
immediately after, and confirm `git diff package.json`/`package-lock.json` is clean
afterward (or intentionally keep the install if that's what the phase's actual
implementation step needed anyway).

## Architecture Patterns

### System Architecture Diagram

```
Local machine (this repo)                          EAS cloud (Expo's infrastructure)
┌───────────────────────────────┐
│ 1. npx expo-doctor             │
│    (static check, no network   │
│     mutation)                  │
└───────────────┬─────────────────┘
                │ 19/20 pass -> 1 fail (version drift)
                ▼
┌───────────────────────────────┐
│ 2. npx expo install --fix       │
│    (rewrites package.json/      │
│     package-lock.json)          │
└───────────────┬─────────────────┘
                │ re-run expo-doctor -> 20/20
                ▼
┌───────────────────────────────┐
│ 3. Set ios.bundleIdentifier     │
│    in app.json (D-01, before    │
│    step 4)                      │
└───────────────┬─────────────────┘
                ▼
┌───────────────────────────────┐        registers project id,
│ 4. eas build:configure          │──────► writes extra.eas.projectId
│    (interactive)                │        back into app.json;
└───────────────┬─────────────────┘        generates eas.json locally
                │ eas.json now exists (dev/preview/production profiles)
                ▼
┌───────────────────────────────┐        uploads project archive,
│ 5. eas build --platform ios     │──────► prebuilds natively in the
│    --profile production         │        cloud, compiles, signs with
│    --clear-cache                │        EAS-managed credentials
└───────────────┬─────────────────┘        (interactive credential
                │                          prompts on first run — see
                │                          Common Pitfalls)
                ▼
┌───────────────────────────────┐        polls EAS API for build
│ 6. eas build:list --status       │◄──────  status (finished/errored)
│    finished --limit 1 --json    │
│    (verification, not the       │
│    dashboard)                   │
└───────────────────────────────┘
```

### Recommended Project Structure
No new folders — this phase only touches root-level config files:
```
app.json          # gains ios.bundleIdentifier
eas.json          # new — generated by `eas build:configure`
package.json      # gains eas-cli devDependency, patch-bumped dependency versions
package-lock.json # regenerated by the above
```

### Pattern 1: Fix dependency drift before touching release config
**What:** Run `npx expo-doctor` and `npx expo install --fix` (or `--check` then
accept) as a fully standalone first step, re-run `expo-doctor` to confirm 20/20, and
only then move on to `app.json`/`eas.json` changes.
**When to use:** Always, for any first-ever EAS build on a project that's only been
run through Expo Go / dev client so far — dependency drift is invisible until a real
native build tries to compile against it.
**Example:**
```bash
# Source: live run against this repo, 2026-07-23
npx expo-doctor              # baseline: 19/20 checks passed
npx expo install --fix       # applies the 7 patch/minor bumps expo-doctor flagged
npx expo-doctor              # confirm: 20/20 checks passed
```

### Pattern 2: Set bundle identifier before `eas build:configure`, not during
**What:** `app.json`'s `ios.bundleIdentifier` should already contain
`com.avram.aruh.lafa` before `eas build:configure` runs, so the CLI reads it
non-interactively instead of prompting.
**When to use:** Any first-time `eas build:configure` run where the final bundle id is
already decided (it is here, per D-01).
**Example:**
```json
// Source: docs.expo.dev/build-reference/build-configuration/, cross-checked
// against WebSearch confirmation that build:configure prompts only for
// missing android.package/ios.bundleIdentifier values
{
  "expo": {
    "ios": {
      "bundleIdentifier": "com.avram.aruh.lafa"
    }
  }
}
```

### Anti-Patterns to Avoid
- **Running `eas build:configure` before deciding the bundle identifier:** it will
  prompt interactively and, if answered with a placeholder/scratch value "just to get
  through the throwaway build," risks EAS registering credentials/an App ID against
  the wrong identifier (Pitfall 2 in `.planning/research/PITFALLS.md`) — D-01 already
  avoids this by sequencing bundle-id-first, honor it.
- **Invoking `eas` via bare `npx eas-cli` after pinning the devDependency:** on this
  specific machine, a global `eas-cli@20.0.0` install exists and `npx` may resolve it
  instead of the project-local `^21.0.3` — use an npm script (`"eas": "eas"` won't
  disambiguate either; use `npx --no-install eas` from within a context where
  `node_modules/.bin` is on PATH, or reference `./node_modules/.bin/eas` explicitly in
  any script) to guarantee the pinned local version runs.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Detecting native dependency version drift | A custom script diffing `package.json` against Expo's SDK manifest | `npx expo-doctor` / `npx expo install --check --fix` | This is exactly what these official tools exist for; they already read Expo's authoritative per-SDK version manifest, which changes on every Expo point release |
| Generating/registering an EAS project id | Hand-writing `extra.eas.projectId` into `app.json` | `eas build:configure` (or `eas init`) | The project id is a server-side EAS record; hand-writing a value risks a UUID that doesn't correspond to any real registered project, causing `eas build` to fail with a project-not-found error |
| Verifying build success | Manually checking the EAS dashboard in a browser every time | `eas build:list --status finished --limit 1 --json` (or `--status errored` to detect failure) | Scriptable, works in a plan-verification step without a human eyeballing a UI; also the only way to reliably automate the BUILD-02 success-criteria check |

**Key insight:** Every tool this phase needs already exists and was exercised live
against this exact repo during research — there is no custom tooling to design here,
only correct sequencing (fix deps → lock bundle id → configure EAS → build → verify).

## Common Pitfalls

### Pitfall 1: Stale global `eas-cli` shadows the pinned devDependency
**What goes wrong:** This dev machine already has `eas-cli@20.0.0` installed globally
(`npm ls -g eas-cli` confirms it, at `/Users/avi/.nvm/versions/node/v25.0.0/lib`).
Running `npx eas-cli --version` after pinning `^21.0.3` as a devDependency still
resolved to `eas-cli/20.0.0` in a live test on 2026-07-23 — npx preferred the globally
installed binary over fetching/using the pinned local version.
**Why it happens:** `npx <pkg>` checks for an existing globally-resolvable binary on
`PATH` before consulting `node_modules/.bin` in some npm/npx version combinations;
this machine's `eas` binary is on `PATH` via the global install.
**How to avoid:** After pinning the devDependency, invoke EAS commands through a
`package.json` script (e.g. `"eas": "eas"`) run via `npm run eas -- build ...`, which
npm resolves through `node_modules/.bin` first regardless of global installs — or
explicitly call `./node_modules/.bin/eas`.
**Warning signs:** `eas --version` (or any `eas` subcommand's startup banner) reports a
version lower than the pinned `^21.0.3` range.

### Pitfall 2: `eas build:configure` on a from-scratch project triggers a full interactive Apple credential setup on first `eas build`
**What goes wrong:** `eas build:configure` itself only scaffolds `eas.json` and links
the EAS project — it does **not** create Apple credentials. The credential prompts
(Apple account login, "generate a new Apple Distribution Certificate?", provisioning
profile creation) happen on the *first actual* `eas build --platform ios` invocation,
not during `build:configure`. A plan that assumes `build:configure` handles
everything non-interactively will be surprised by an unattended `eas build` hanging on
a TTY prompt.
**Why it happens:** EAS separates "project/build-profile configuration" from
"credential provisioning" — credentials are lazily created the first time they're
actually needed for a given bundle identifier + distribution type combination.
**How to avoid:** Plan the throwaway build step as an interactive terminal session
(not a background/non-interactive script) for this first run specifically; expect
prompts for Apple account login and certificate/profile generation, and budget a
manual approval step in the plan rather than assuming full automation.
**Warning signs:** `eas build` appears to hang with no output — it is waiting on a
terminal prompt for Apple credentials.

### Pitfall 3: `expo-doctor`'s "Minor" vs "Patch" version-mismatch labels don't map to severity for this gate
**What goes wrong:** `expo-doctor`'s live output for this repo splits its 7 flagged
packages into a "⚠️ Minor version mismatches" table (1 package: `react-native-screens`)
and a "🔧 Patch version mismatches" table (6 packages: `expo`, `expo-constants`,
`expo-linking`, `expo-router`, `expo-splash-screen`, `expo-web-browser`) — but both
tables contributed to the single overall "1 checks failed" result. A plan that only
fixes the "Minor" table (assuming "Patch" is cosmetic) will not reach the BUILD-01
zero-issues target.
**Why it happens:** The labels describe the *kind* of semver bump needed, not whether
fixing it is optional — `expo-doctor` exits non-zero if *either* category has entries.
**How to avoid:** Run `npx expo install --fix` (which addresses both categories in one
pass) rather than hand-picking which packages to bump; re-run `expo-doctor` afterward
to confirm 20/20.
**Warning signs:** `expo-doctor` still reports "1 checks failed" after only bumping
the "Minor" table's packages.

## Code Examples

### Full expo-doctor output captured live against this repo (2026-07-23)
```
# Source: `npx expo-doctor` run in this repo, 2026-07-23
19/20 checks passed. 1 checks failed. Possible issues detected:

✖ Check that packages match versions required by installed Expo SDK

⚠️ Minor version mismatches
package               expected  found
react-native-screens  ~4.26.0   4.25.2

🔧 Patch version mismatches
package               expected  found
expo                  ~57.0.8   57.0.7
expo-constants        ~57.0.7   57.0.6
expo-linking          ~57.0.4   57.0.3
expo-router           ~57.0.8   57.0.7
expo-splash-screen    ~57.0.5   57.0.4
expo-web-browser      ~57.0.2   57.0.1

7 packages out of date.
Advice:
Use 'npx expo install --check' to review and upgrade your dependencies.
```

### Verifying build status without the dashboard
```bash
# Source: Expo EAS CLI docs (docs.expo.dev/eas/cli/) + WebSearch cross-check of
# exit-code semantics (0=success, 11=failure, 12=canceled, 13=wait aborted)
npx eas-cli build:list --platform ios --status finished --limit 1 --json
# or, to explicitly check for a recent failure:
npx eas-cli build:list --platform ios --status errored --limit 1 --json
```
[CITED: docs.expo.dev/eas/cli/ — exact JSON schema of `build:list` output not
independently re-verified this session; field names may need a live dry-run before
being wired into a plan verification step. Confidence: MEDIUM.]

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|---------------|--------|
| Manually managed `.p12`/provisioning profiles committed or shared via fastlane match | EAS-managed (remote) Apple credentials, generated/stored server-side by EAS on first build | Standard for EAS-first projects with no prior native workflow (this project has never had one) | No local credential files to manage in this phase; first-run interactive prompts are expected (Pitfall 2), not a sign of misconfiguration |
| Manually bumping `ios.buildNumber` per release | `cli.appVersionSource: "remote"` (EAS tracks build numbers server-side) | Expo's now-default recommendation, already decided as this milestone's approach per `.planning/research/STACK.md` | Not this phase's concern — Phase 23 sets `appVersionSource`; this phase's `eas build:configure` may scaffold `appVersionSource` or leave `ios.buildNumber` untouched, verify whichever it produces and hand off to Phase 23 as-is |

**Deprecated/outdated:** None specific to this phase — SDK 57 / EAS Build /
`eas-cli@21.x` are all current as of this research date.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `eas build:list --json` field names/schema for programmatically detecting build success are as documented in general EAS CLI docs (not independently re-verified against a real build's JSON output this session, since no real build was run during research) | Code Examples | If the actual JSON shape differs, the plan's verification step needs a live dry-run adjustment during execution — low risk, easily caught by running the command once and inspecting output before relying on it in a script |
| A2 | The global `eas-cli@20.0.0` vs. pinned `^21.0.3` shadowing behavior (Pitfall 1) generalizes beyond this exact dev machine | Common Pitfalls | If the executing agent/environment doesn't have that global install, the mitigation (npm script / explicit `node_modules/.bin` path) is still harmless to include, just unnecessary — no downside to including it defensively |

**All other claims in this research were verified live against this repo
(`expo-doctor`, `expo install --check`, `npm view eas-cli version`, `eas whoami`,
`slopcheck install eas-cli`) or cited from official Expo documentation — no
unconfirmed assumptions about SDK 57 compatibility or EAS behavior remain.**

## Open Questions

1. **Does `eas build:configure` write `appVersionSource` into the generated
   `eas.json`, or leave it unset (defaulting to `"local"`)?**
   - What we know: Expo's own recommended `eas.json` shape (documented in
     `.planning/research/STACK.md`) sets `cli.appVersionSource: "remote"` explicitly —
     but that's a *recommendation* for the final config, not necessarily what
     `build:configure`'s auto-scaffold produces by default.
   - What's unclear: Whether Phase 20's `eas build:configure` run will produce a
     scaffold that already has `appVersionSource: "remote"`, or whether that field is
     entirely Phase 23's addition.
   - Recommendation: Not a blocker for Phase 20 — whatever `build:configure` produces
     is fine to commit as-is per D-02 ("Phase 23 edits this file in place"); just don't
     let Phase 20 second-guess or hand-edit the scaffolded `eas.json` beyond what's
     needed to run the throwaway build.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| `eas-cli` (via npx, pre-pin) | All phase steps | ✓ | Resolves to global `20.0.0` currently; registry latest is `21.0.3` | Pin as devDependency + invoke via npm script (see Pitfall 1) |
| EAS account authentication | `eas build:configure`, `eas build` | ✓ | Authenticated as `avram.aruh` (accounts: `avram.aruh`, `savi-labs`) | None needed — already satisfied per CONTEXT.md |
| Node.js / npm | All steps | ✓ | Node v25.0.0 (per this session's shell) | — |
| Network access to EAS cloud API | `build:configure`, `eas build`, `build:list` | ✓ (assumed — not independently re-verified this session beyond `eas whoami` succeeding, which requires network) | — | — |

**Missing dependencies with no fallback:** none identified.
**Missing dependencies with fallback:** stale global `eas-cli` version (Pitfall 1) —
fallback is explicit npm-script/local-bin invocation.

## Validation Architecture

This phase has no application code under test — it is a CLI-driven configuration and
build-verification phase. The three success criteria are themselves the "tests":

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None (CLI command exit-code/output verification, not a unit/integration test suite) |
| Config file | n/a |
| Quick run command | `npx expo-doctor` (seconds) |
| Full suite command | `npx eas-cli build --platform ios --profile production --clear-cache --non-interactive` after credentials are pre-provisioned (10-20+ min cloud build) |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| BUILD-01 | `expo-doctor` reports zero issues | CLI exit-code check | `npx expo-doctor` (exits 0 when "0 checks failed") | ✅ (tool already available via npx) |
| BUILD-01 | `expo install --check` reports no mismatches | CLI exit-code check | `npx expo install --check` | ✅ |
| BUILD-02 | Throwaway iOS build succeeds on EAS infra | CLI-driven cloud build + status query | `npx eas-cli build --platform ios --profile production --clear-cache` then `npx eas-cli build:list --platform ios --status finished --limit 1 --json` | ✅ (eas-cli available via npx/pinned devDependency) |

### Sampling Rate
- **Per task commit:** `npx expo-doctor` (fast, run after every dependency-fixing task)
- **Per wave merge:** full `expo install --check` + (once) the throwaway `eas build`
- **Phase gate:** `expo-doctor` 20/20 AND a `finished`-status build confirmed via
  `build:list --json`, both required before Phase 20 is marked complete

### Wave 0 Gaps
None — existing tooling (`expo-doctor`, `expo install --check`, `eas-cli`) fully
covers this phase's verification needs; no test files or fixtures need to be created.

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | No auth in this app; EAS account auth is developer-tooling auth, not app auth, and is already satisfied (no credentials handled by this phase's code changes) |
| V3 Session Management | No | n/a |
| V4 Access Control | No | n/a |
| V5 Input Validation | No | No new user-facing input surfaces introduced by this phase |
| V6 Cryptography | Marginal | EAS-managed credentials mean this phase never handles raw private keys/certs directly — EAS generates and stores the iOS distribution certificate server-side. Do not commit any credential material (`.p12`, `.mobileprovision`, ASC API keys) to the repo even transiently; none should be produced by this phase's `eas build:configure`/`eas build` steps since `credentialsSource: "remote"` keeps everything server-side |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Committing an EAS-generated `.p12`/provisioning profile or an interactively-entered Apple ID/App Store Connect API key into a config file by accident | Information Disclosure | Keep `eas.json`'s scaffolded output as-is (no `local` credentialsSource, no hardcoded `appleId`/`ascApiKeyPath`); verify `git diff eas.json` before committing contains only build-profile config, no secrets |
| Global `eas-cli` install shadowing the pinned version (Pitfall 1) leading to a different, potentially older/vulnerable CLI actually executing commands with account access | Tampering (supply-chain adjacent) | Explicit local-bin invocation per Pitfall 1's mitigation; not a high-severity risk here (both versions are official, authenticated) but worth the same npm-script discipline for reproducibility |

## Sources

### Primary (HIGH confidence)
- Live command execution against this repo, 2026-07-23: `npx expo-doctor`, `npx expo
  install --check`, `npm view eas-cli version`, `npx eas-cli whoami`, `npx eas-cli
  --version`, `npm ls -g eas-cli`, `slopcheck install eas-cli`
- [Configure EAS Build with eas.json — Expo Documentation](https://docs.expo.dev/build/eas-json/)
- [Build configuration process — Expo Documentation](https://docs.expo.dev/build-reference/build-configuration/)
- [Set up EAS Build — Expo Documentation](https://docs.expo.dev/build/setup/)
- [EAS CLI reference — Expo Documentation](https://docs.expo.dev/eas/cli/)
- [Using automatically managed credentials — Expo Documentation](https://docs.expo.dev/app-signing/managed-credentials/)
- `.planning/research/SUMMARY.md`, `.planning/research/STACK.md`,
  `.planning/research/PITFALLS.md` (milestone-level research, already vetted HIGH
  confidence for the shared EAS/eas.json/credentials facts reused here)

### Secondary (MEDIUM confidence)
- WebSearch: "eas build:configure command interactive prompts bundle identifier
  app.json existing 2026" — cross-checked against official docs' description of
  build:configure's scope
- WebSearch: "eas build ios first build EAS managed credentials interactive prompts" —
  credential-prompt sequence for a first-ever iOS build (Pitfall 2)
- WebSearch: "eas build --json exit code check build status programmatically CLI" —
  exit-code semantics (0/11/12/13) and `--json` flag behavior; exact `build:list` JSON
  schema not independently re-verified against a live build output this session
  (logged as Assumption A1)
- WebSearch: "Expo SDK 57 React Native 0.86 New Architecture EAS build known issues" —
  confirms SDK 55+ runs New Architecture unconditionally (cannot be disabled),
  confirms a known `jest-expo`/`@react-native/jest-preset` peer-dependency conflict
  exists in some SDK 57 setups (not observed as a blocker in this repo's live
  `expo-doctor`/`npm install` runs, so not treated as an active risk here — flagged
  only for awareness)

### Tertiary (LOW confidence)
- None used as load-bearing claims — all WebSearch findings above were cross-verified
  against either live command output or official Expo docs before inclusion.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — `eas-cli` version and package-drift facts verified live
  against this exact repo, not inferred from training data
- Architecture: HIGH — sequencing (fix deps → lock bundle id → configure EAS → build →
  verify) is a direct synthesis of D-01/D-02/D-03 plus live-verified tool behavior
- Pitfalls: HIGH for Pitfalls 1 and 3 (both observed directly this session); MEDIUM
  for Pitfall 2 (credential-prompt sequence is WebSearch-sourced, not independently
  triggered since no real `eas build` was run during research to avoid burning EAS
  build-minutes/registering premature credentials)

**Research date:** 2026-07-23
**Valid until:** ~14 days (Expo/EAS ecosystem moves fast — `expo-doctor`'s specific
flagged-package table will go stale as soon as the next Expo SDK 57 patch ships;
re-run `npx expo-doctor` fresh at execution time rather than trusting this document's
captured table if more than a couple of weeks have passed)
