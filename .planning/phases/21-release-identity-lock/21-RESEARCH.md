# Phase 21: Release Identity Lock - Research

**Researched:** 2026-07-23
**Domain:** Expo/EAS release configuration (app.json identity fields, EAS project/slug binding)
**Confidence:** HIGH (core mechanism verified via eas-cli source + a live, safe command run against this exact repo's registered project)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### EAS project id reconciliation (IDENT-04)
- **D-01:** Keep the existing `extra.eas.projectId`
  (`88aa092c-033c-4bcc-bf53-450c721977e8`), registered in Phase 20 under the
  old slug `portuguese-verb-mobile`. Do not delete/re-register it. EAS
  projects are keyed by UUID, not by slug — re-registering would orphan
  Phase 20's finished proof build (`2dc80140-...`) and require
  re-provisioning Apple distribution credentials for no benefit.
- **D-02:** After changing `slug`/`scheme` to `lafa`, verify (read-only) that
  the existing projectId still resolves correctly under the new slug —
  e.g. `eas project:info` or equivalent — rather than assuming it's fine.
  If verification surfaces a real mismatch, surface it as a finding rather
  than silently forcing a new project.

#### Build verification scope
- **D-03:** This phase is config-only — no new `eas build` run. Edit
  `app.json` (slug, scheme, buildNumber) and do the read-only EAS project
  check from D-02, but defer any real build/submit verification to Phase 24
  ("Quality Gates, Preflight & First Submit"), which is the roadmap's
  designated first post-identity-lock build. Avoids burning another EAS
  build credit in this phase.

### Claude's Discretion
- Exact command(s) used for the read-only EAS project verification (D-02) —
  whichever `eas`/`eas-cli` subcommand cleanly confirms projectId↔slug
  resolution without triggering a build or re-registration.
- Order of the three `app.json` edits (slug, scheme, buildNumber) — all are
  independent, single-field changes with no sequencing risk.

### Deferred Ideas (OUT OF SCOPE)
- Real `eas build`/submit verification of the new identity — explicitly
  deferred to Phase 24 (D-03), not this phase.
- Durable Node-version pin (`.nvmrc` or equivalent) to prevent the
  npm-version lockfile drift class found in Phase 20 — flagged by Phase 20
  for Phase 23/24, not re-raised here since it's out of this phase's scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-------------------|
| IDENT-01 | `app.json` sets `ios.bundleIdentifier` to `com.avram.aruh.lafa` | Already set in Phase 20; this phase confirms only. See "Code Examples" (app.json diff) — no reconciliation risk, no research gap. |
| IDENT-02 | `app.json` `slug` and `scheme` updated to `lafa` | Core research finding: `scheme` is risk-free (client-side only, Pitfall 3); `slug` triggers the EAS project/slug validation mechanism documented in depth in "Architecture Patterns" and "Common Pitfalls" #1-#2 — the central risk this research resolves. |
| IDENT-03 | `app.json` sets `ios.buildNumber` to `1`; `version` confirmed unchanged at `1.0.0` | Simple field addition; see "Code Examples" and "State of the Art" note on `autoIncrement`/remote version source superseding this field after Phase 24's first real build. |
| IDENT-04 | `extra.eas.projectId` checked for a pre-existing value under the old slug and reconciled before the first real (non-throwaway) build | Fully addressed: "Summary", "Architecture Patterns", "Common Pitfalls" #1-#2, "Code Examples" (live `eas project:info` output), and "Open Questions" #1-#2 give the exact verification command, its real scope/limits, and the unresolved dashboard-rename question the plan must checkpoint on. |
</phase_requirements>

## Summary

This phase is a pure `app.json` config edit (four fields: `slug`, `scheme`,
`ios.buildNumber`, plus a read-only check of `extra.eas.projectId`) with no
product/UI code changes. The mechanically easy part — editing the four
fields — carries no real risk. The hard part, and the reason this phase
exists as its own phase, is the interaction between `slug` and
`extra.eas.projectId`: **EAS enforces server-side that the local `slug`
field must match the slug the project was registered under, and throws a
hard, non-bypassable error if they diverge — in every project-context
command except `eas project:info`.** This was verified directly by reading
`eas-cli`'s own source (`getProjectIdAsync.ts`) and confirmed empirically by
running `eas project:info` against this repo's live registered project
before any change was made.

This does not block the phase (which is explicitly config-only per D-03),
but it is a load-bearing finding for the *plan*: the "read-only verification"
task in D-02 must be scoped as a **first-order confirmation the projectId
still resolves to a project by ID** (which `eas project:info` proves cleanly
and safely), not as proof that a future `eas build`/`eas submit` will
succeed post-slug-change (which it will *not*, unless the project's
server-side slug is separately updated — a dashboard action outside CLI/API
scope, requiring human action). This mismatch risk must be surfaced as a
finding for Phase 24 to inherit, exactly as D-02 anticipates ("If
verification surfaces a real mismatch, surface it as a finding rather than
silently forcing a new project").

**Primary recommendation:** Edit the four `app.json` fields directly (no
tooling needed), then run `eas project:info` (non-interactive-safe, already
proven to work in this repo) to fetch the server's current `fullName` for
the existing `projectId`. Compare the slug segment of that `fullName`
against the new local `slug` — expect them to differ (`portuguese-verb-mobile`
vs. `lafa`) immediately after this phase's edit, since nothing in this
phase updates the server side. Log that expected/known divergence explicitly
as a carry-forward finding for Phase 24, rather than treating command
success/failure as the signal (the command succeeds either way).

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Bundle identifier / slug / scheme / buildNumber | Build config (`app.json`) | — | Static Expo config, read by EAS Build/Submit and the native build process at build time, not at runtime by app code |
| EAS project registration (`extra.eas.projectId`) | EAS platform (expo.dev / EAS servers) | Build config (`app.json`, CLI-written) | The projectId is a server-side identity; `app.json` only stores a pointer to it — the authoritative slug↔projectId binding lives on EAS's servers, not locally |
| EAS project slug reconciliation | EAS platform (dashboard, human action) | CLI (`eas project:info`, read-only) | No CLI/API mutation exists to rename a registered project's slug; this is a dashboard-only operation per Expo's own docs (`currentFullName` "may change when a project is transferred between accounts or renamed") |

## Standard Stack

### Core
No new packages. This phase edits existing `app.json`/`eas.json` (already present from Phase 20) and uses the already-pinned `eas-cli` devDependency.

| Tool | Version (verified in this repo) | Purpose |
|------|------|---------|
| `eas-cli` | `^21.1.0` in `package.json` devDependencies; `eas.json` `cli.version: ">= 21.1.0"` | Read-only project verification (`eas project:info`) |
| `expo` (Expo SDK) | ~57.0.4 | Reads `app.json` at build/config-resolution time; no direct CLI use needed this phase |

**Installation:** None — no packages installed or changed this phase.

**Version verification:** `eas-cli` version confirmed via `npx eas-cli project:info` invocation in this repo, which printed `"It's recommended to use the cli.version field in eas.json"` (informational only, non-blocking) and successfully returned project data — confirms the pinned CLI version works against the current EAS backend as of 2026-07-23. `[VERIFIED: live command run against this repo]`

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `eas project:info` for verification | `eas whoami` | Only confirms *account* auth, not project/slug binding — insufficient for D-02's goal |
| `eas project:info` for verification | `eas build:list --limit 1 --json` (used in Phase 20) | Also project-context-aware but heavier (lists builds); more importantly, unlike `project:info`, some project-context commands DO invoke the slug-consistency check (`getProjectIdAsync`) and could throw post-slug-change — риск of accidentally tripping the exact failure mode D-03 wants to defer. Confirm before using anything other than `project:info` in this phase's plan. |
| `eas init --force` to "fix" a mismatch | N/A | Explicitly rejected: per eas-cli source, `--force` overwrites the LOCAL `app.json` slug to match the SERVER's registered slug (`modifyExpoConfigAsync(projectDir, { slug: correctSlug })`) — the opposite direction of what IDENT-02 requires. Never run this in this phase. |

## Package Legitimacy Audit

Not applicable — this phase installs no new packages (config-only edit of existing `app.json`/`eas.json` fields; `eas-cli` is already a pinned Phase 20 dependency, unchanged here).

## Architecture Patterns

### System Architecture Diagram

```
 app.json (local, git-tracked)                EAS servers (expo.dev, remote)
 ┌───────────────────────────┐                ┌─────────────────────────────┐
 │ slug: "lafa" (this phase)  │                │ Project record               │
 │ scheme: "lafa"             │                │   id: 88aa092c-...          │
 │ ios.buildNumber: "1"       │                │   fullName (slug portion):  │
 │ ios.bundleIdentifier:      │                │     "portuguese-verb-mobile"│
 │   com.avram.aruh.lafa      │                │     (UNCHANGED by this      │
 │ extra.eas.projectId:       │  ──points to──▶│      phase — needs a        │
 │   88aa092c-...  (unchanged)│                │      dashboard rename)      │
 └───────────────────────────┘                └─────────────────────────────┘
              │                                              ▲
              │ read by                                     │ queried by
              ▼                                              │
   ┌────────────────────────────────────────────────────────┴──┐
   │ eas-cli command context resolution                         │
   │  - `eas project:info` → AppQuery.byIdAsync(projectId) only  │
   │    → NO slug comparison → always succeeds (this phase's     │
   │      safe verification command)                             │
   │  - `eas build` / `eas submit` / `eas build:list` → also      │
   │    calls getProjectIdAsync() → COMPARES local slug to        │
   │    server fullName's slug → THROWS on mismatch (Phase 24     │
   │    risk, deferred, not run in this phase per D-03)           │
   └──────────────────────────────────────────────────────────────┘
```

### Recommended task sequence
```
1. Edit app.json: slug -> "lafa"
2. Edit app.json: scheme -> "lafa"
3. Edit app.json: ios.buildNumber -> "1" (new key; version stays "1.0.0")
4. Confirm ios.bundleIdentifier already "com.avram.aruh.lafa" (Phase 20, no change)
5. Run `eas project:info` (or `--json`) — read-only, safe, non-interactive-compatible
6. Compare returned fullName's slug segment to the new local slug — expect
   a mismatch; document it as a known, deferred finding (not a blocker)
```

### Pattern: EAS project identity is UUID-keyed, not slug-keyed, but slug-validated at the CLI layer
**What:** The actual server-side project identity is `extra.eas.projectId` (a UUID). `slug` is a separate, human-readable field stored on that same server-side project record. EAS CLI commands that need full project context (build, submit, build:list, update, etc.) fetch the project by `projectId` and then **compare** the fetched record's slug against the local `app.json` slug — throwing if they differ. `eas project:info` is a narrow exception: it fetches by ID and displays the result without this comparison.
**When to use:** Any phase/plan that changes `slug` while an EAS project already exists under the old slug must account for this validation gap.
**Example (verified against eas-cli source, `packages/eas-cli/src/commandUtils/context/contextUtils/getProjectIdAsync.ts`):**
```ts
// Source: https://github.com/expo/eas-cli (main branch, getProjectIdAsync.ts)
if (exp.slug && exp.slug !== appForProjectId.slug) {
  throw new Error(
    `Project config: Slug for project identified by "extra.eas.projectId" ` +
    `(${appForProjectId.slug}) does not match the "slug" field (${exp.slug})...`
  );
}
```
`[VERIFIED: eas-cli GitHub source, cross-checked against packages/eas-cli/src/project/projectInitialization.ts's ensureOwnerSlugConsistencyAsync, and packages/eas-cli/src/commands/project/info.ts's simpler AppQuery.byIdAsync-only path]`

### Anti-Patterns to Avoid
- **Treating `eas project:info` success as proof the identity is fully reconciled:** it only proves the `projectId` still resolves to *a* project on the server. It does not validate slug consistency (that command path skips the check entirely). Do not close IDENT-04 on this command's exit code alone — explicitly compare and log the fullName vs. local slug.
- **Running `eas init --force` to "resolve" a mismatch:** this overwrites the LOCAL slug to match the SERVER (wrong direction for this phase's goal — would silently revert IDENT-02's slug change).
- **Running any project-context command that isn't `eas project:info` in this phase:** `eas build:list`, `eas build`, `eas submit`, `eas update` etc. all invoke the slug-consistency check and may throw once slug is changed locally but not yet reconciled server-side — out of scope for this config-only phase (D-03).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Verifying EAS project/slug state | A custom script calling the EAS GraphQL API directly | `eas project:info` (already pinned via `eas-cli` devDependency) | Official CLI already exposes exactly the read-only lookup needed; no auth/GraphQL wiring to hand-roll |

**Key insight:** There is no gap here to hand-roll around — the risk in this phase is a documented platform constraint (slug immutability at the CLI validation layer), not a missing tool.

## Common Pitfalls

### Pitfall 1: Assuming slug rename is a no-op because "the projectId doesn't change"
**What goes wrong:** A plan closes IDENT-04 by running any EAS CLI command and seeing it succeed, without checking whether that specific command actually validates slug consistency. `eas project:info` will succeed regardless of mismatch; commands used later (Phase 24's `eas build`/`eas submit`) will not.
**Why it happens:** The UUID (`projectId`) genuinely never changes — but a second, independent field (`slug`) on the same server-side record is separately validated by most project-context CLI commands.
**How to avoid:** Explicitly parse and compare the `fullName` returned by `eas project:info` against the new local `slug`. If they differ, log it as an open finding for Phase 24 rather than assuming success.
**Warning signs:** `eas project:info`'s output shows `fullName: @avram.aruh/portuguese-verb-mobile` after `app.json`'s slug has already been changed to `lafa` — this is the expected, not-yet-reconciled state right after this phase, not a bug.

### Pitfall 2: Trying to fix the mismatch with `eas init --force` or `eas init --id`
**What goes wrong:** `--force` silently rewrites the LOCAL `app.json` slug back to whatever the server has registered (`portuguese-verb-mobile`), directly undoing IDENT-02.
**Why it happens:** `eas init`'s reconciliation logic (`ensureOwnerSlugConsistencyAsync`) is one-directional: local always conforms to server, never the reverse.
**How to avoid:** Never run `eas init` in this phase. The only supported way to make the server's slug match the new local value is a dashboard-side project rename (see Open Questions) — a human/manual action, not a CLI command, and explicitly out of scope for this phase.

### Pitfall 3: Confusing `scheme` (client-side deep link) with anything EAS-server-validated
**What goes wrong:** Assuming `scheme` needs the same reconciliation dance as `slug`.
**Why it happens:** Both fields changed in the same edit, both look like "identity" fields.
**How to avoid:** `scheme` is a purely local, client-side URL scheme (`Linking`/deep-link registration baked into the native build) with no server-side registration or validation — changing it is a simple, risk-free edit. `[ASSUMED — based on standard Expo/React Native `scheme` semantics and no contrary evidence found in eas-cli source; not independently verified via a dedicated doc citation this session]`

## Code Examples

### Verifying EAS project resolution (read-only, safe, non-interactive)
```bash
# Source: live command run against this repo, 2026-07-23, before any slug change
npx eas-cli project:info --json --non-interactive
# Observed output (pre-change baseline):
#   fullName  @avram.aruh/portuguese-verb-mobile
#   ID        88aa092c-033c-4bcc-bf53-450c721977e8
```
This command completed instantly with no interactive prompt in this repo's non-TTY environment, consistent with Phase 20's finding that only `eas init`'s "create a project?" prompt hangs on non-TTY stdin — `project:info` has no such prompt since the project already exists and is referenced directly by ID. `[VERIFIED: command executed in this session]`

### The app.json diff this phase makes
```json
// Source: this repo's app.json, current -> target (this phase's scope)
{
  "expo": {
    "slug": "portuguese-verb-mobile",   // -> "lafa"
    "scheme": "portugueseverbmobile",   // -> "lafa"
    "ios": {
      "bundleIdentifier": "com.avram.aruh.lafa", // unchanged, confirm only
      // buildNumber: not present yet -> add "1"
    }
    // version: "1.0.0" — confirm unchanged, do not touch
  }
}
```
`[VERIFIED: read directly from this repo's current app.json]`

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|---------------|--------|
| N/A | `cli.appVersionSource: "remote"` + `eas.json` `build.production.autoIncrement: true` (already set by Phase 20/23 scope) means `ios.buildNumber` in `app.json` is largely superseded by EAS's remote-tracked build number counter once builds start flowing through `production` profile | Established by Expo SDK 50+/eas-cli's "remote version source" feature, already adopted in this repo's `eas.json` (Phase 20) | The `ios.buildNumber: "1"` this phase sets in `app.json` is really just the *starting point*/local fallback; once `autoIncrement: true` builds run (Phase 24+), EAS's own remote counter — not this JSON field — is authoritative for subsequent build numbers. Do not expect this field to still say "1" after Phase 24's first real build; that is expected, correct autoIncrement behavior, not drift. `[CITED: eas.json `cli.appVersionSource`/`build.production.autoIncrement` fields, confirmed present in this repo's `eas.json` from Phase 20]` |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `scheme` is purely client-side with no EAS server-side validation/registration, so changing it carries no reconciliation risk analogous to `slug` | Common Pitfalls #3 | Low — if wrong, the only consequence is a missed reconciliation step for a field that (per all evidence found) is not server-validated by EAS; would surface immediately as a CLI error if incorrect, same class of error as the slug mismatch already documented |
| A2 | The Expo/EAS dashboard (expo.dev, web UI) supports renaming a project's slug while preserving its `projectId`, based on Expo's own docs describing `currentFullName` as changing "when a project is transferred between accounts or renamed" — but the exact UI path/label was not directly observed in this research session | Open Questions | Medium — if the dashboard does NOT actually expose a slug-rename affordance, there is no supported way to reconcile the slug mismatch short of accepting it permanently or creating a new EAS project (which D-01 explicitly rejected) — Phase 24 would inherit a hard blocker on its first real `eas build`/`eas submit` |

**If this table is empty:** N/A — see above, two items logged.

## Open Questions

1. **Does the expo.dev dashboard actually expose a "rename project" action that changes the registered slug while keeping the same `projectId`?**
   - What we know: EAS CLI itself has no such mutation (verified — no `updateApp`/`renameApp` GraphQL call in `eas-cli`'s project-handling source). Expo's own `app.json` field docs describe `currentFullName` as legitimately changing "when a project is transferred between accounts or renamed," implying project renaming is a first-class, expected lifecycle event on the platform.
   - What's unclear: Where/how this rename is triggered (web dashboard project settings is the most likely candidate, by elimination, since the CLI has no equivalent) — not directly observed via docs or screenshots in this session.
   - Recommendation: The plan should include a `checkpoint:human-verify` task for the operator to check the expo.dev dashboard's project settings for a rename/slug-change option immediately after this phase's `app.json` edit lands, and log the outcome (renamed successfully / no such option found) as this phase's IDENT-04 closing evidence — rather than assuming either outcome. If no rename option exists, surface the resulting fullName/slug mismatch explicitly to Phase 24 planning as a known pre-existing condition (not a regression introduced by that phase).

2. **Will Phase 24's first real `eas build --profile production` actually throw on the slug/fullName mismatch, or does EAS's build submission path tolerate it differently than `eas project:info`/local CLI validation suggests?**
   - What we know: `getProjectIdAsync`'s slug-consistency throw is in the shared context-resolution code used by build-adjacent commands (confirmed via source), and Phase 20 already saw this general class of "local CLI environment surprises production behavior" risk (the npm 10 vs. 11 lockfile issue).
   - What's unclear: Whether this specific check fires identically for `eas build` (submitted from a possibly-different EAS-side execution context) as it does for locally-run CLI commands — not empirically tested this session per D-03 (no build in this phase).
   - Recommendation: Phase 24's research/planning should re-verify this specific risk with a cheap, safe command (e.g., another `eas project:info` right before the real build, plus checking whether question 1's dashboard rename actually happened) rather than assuming Phase 21's finding is stale by the time Phase 24 executes.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| `eas-cli` (via `npx`/`npm run eas`) | IDENT-04 verification command | Yes | `^21.1.0` (package.json), confirmed working live against this repo, 2026-07-23 | — |
| EAS account auth (`eas whoami`) | IDENT-04 verification command | Yes (established Phase 20: `avram.aruh`) | — | — |
| Network access to EAS servers | `eas project:info` | Yes (command succeeded live this session) | — | — |

**Missing dependencies with no fallback:** None.
**Missing dependencies with fallback:** None.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest (`jest-expo` preset) — existing, unchanged this phase |
| Config file | `package.json` (`"jest": { "preset": "jest-expo" }`) |
| Quick run command | `npm test` |
| Full suite command | `npm test` (single suite, ~251 tests as of Phase 20) |

This phase makes no `src/`/`app/` code changes, so Jest coverage is unaffected — verification for this phase is config-value assertions and CLI command output, not unit tests.

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| IDENT-01 | `ios.bundleIdentifier` reads `com.avram.aruh.lafa` | config-assertion | `node -e "if(require('./app.json').expo.ios.bundleIdentifier!=='com.avram.aruh.lafa')process.exit(1)"` | N/A — no dedicated file, inline shell assertion |
| IDENT-02 | `slug` and `scheme` both read `lafa` | config-assertion | `node -e "const e=require('./app.json').expo; if(e.slug!=='lafa'||e.scheme!=='lafa')process.exit(1)"` | N/A |
| IDENT-03 | `ios.buildNumber` is `"1"`, `version` unchanged `"1.0.0"` | config-assertion | `node -e "const e=require('./app.json').expo; if(e.ios.buildNumber!=='1'||e.version!=='1.0.0')process.exit(1)"` | N/A |
| IDENT-04 | `extra.eas.projectId` checked/reconciled, no stale duplicate | manual/CLI-output | `npx eas-cli project:info --json --non-interactive` (compare output to local slug, log finding) | N/A — not automatable as a pass/fail Jest assertion; the "correct" outcome (match vs. documented mismatch) requires human judgment per Open Question 1 |

### Sampling Rate
- **Per task commit:** run the relevant `node -e` config assertion (or eyeball the diff — these are single-field JSON edits) plus `npm run typecheck` (this repo's existing convention for any `app.json`-adjacent change, per Phase 20 precedent) to confirm nothing else broke.
- **Per wave merge:** `npm test` full suite (should be unaffected — no `src/`/`app/` files touched) + `npx expo-doctor` (repeat Phase 20's zero-issues baseline check, since `app.json` identity fields are within its scope).
- **Phase gate:** All four `node -e` assertions pass, `eas project:info` output logged and compared to `slug`, full Jest suite still green, before `/gsd:verify-work`.

### Wave 0 Gaps
None — no test framework changes needed. This phase's verification is config-value assertion + one CLI command, not new Jest test files.

## Security Domain

Config-only, release-engineering phase — no user-facing surface, no authentication, no data handling. Per project constraints, this app has no auth/session/crypto surface anywhere.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-------------------|
| V2 Authentication | No | N/A — no auth in this product (CLAUDE.md-confirmed project-wide constraint) |
| V3 Session Management | No | N/A |
| V4 Access Control | No | N/A |
| V5 Input Validation | No | N/A — no user input; `app.json` is static, developer-edited config, not runtime-parsed external input |
| V6 Cryptography | No | N/A |

### Known Threat Patterns for {stack}

None applicable — this phase touches only static build-time identity config with no runtime attack surface. The one operational risk (EAS project/slug reconciliation) is a release-tooling correctness concern, not a security vulnerability class.

## Sources

### Primary (HIGH confidence)
- `eas-cli` GitHub source (main branch): `packages/eas-cli/src/commandUtils/context/contextUtils/getProjectIdAsync.ts` — slug-mismatch throw logic
- `eas-cli` GitHub source (main branch): `packages/eas-cli/src/project/projectInitialization.ts` (`ensureOwnerSlugConsistencyAsync`) — confirms one-directional (server→local) reconciliation via `eas init --force`
- `eas-cli` GitHub source: `packages/eas-cli/src/commands/project/info.ts` — confirms `eas project:info` fetches by ID only, no slug comparison
- Live command execution in this repo, 2026-07-23: `npx eas-cli project:info --json --non-interactive` — succeeded, returned `fullName: @avram.aruh/portuguese-verb-mobile`, `ID: 88aa092c-033c-4bcc-bf53-450c721977e8`
- `docs.expo.dev/versions/latest/config/app/` — `currentFullName`/`originalFullName` field definitions, confirming project renaming is a recognized platform lifecycle event

### Secondary (MEDIUM confidence)
- `github.com/expo/eas-cli/issues/1530` (and its resolving comment) — community-reported slug-mismatch resolution pattern (in that case, users removed `projectId` to force a new one — the opposite of this phase's D-01, cited only to corroborate that the mismatch error is real and commonly hit)
- `spacetech.dk` blog post on the same error message — corroborates exact error text and community understanding that slug changes normally require a new EAS project

### Tertiary (LOW confidence)
- No direct observation of the expo.dev dashboard's project-rename UI — inferred from doc language only (see Open Question 1)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new tooling, existing pinned `eas-cli` confirmed working live in this repo
- Architecture (slug/projectId binding mechanism): HIGH — verified directly from `eas-cli` source across three files, corroborated by a live command run in this exact repo
- Pitfalls: HIGH — same source basis as architecture
- Dashboard rename affordance (Open Question 1): MEDIUM — inferred from official doc wording, not directly observed

**Research date:** 2026-07-23
**Valid until:** 30 days (eas-cli internals are relatively stable across minor versions, but re-verify if `eas-cli` is upgraded past `^21.1.0` before Phase 24 executes)
