# Phase 21: Release Identity Lock - Pattern Map

**Mapped:** 2026-07-23
**Files analyzed:** 1 (`app.json`, modified — no new files)
**Analogs found:** 1 / 1 (self-analog: same file, prior edit in Phase 20)

## Scope Note

This phase touches exactly one file — `app.json` — and makes four field-level
edits (`slug`, `scheme`, `ios.buildNumber`, plus a read-only confirmation of
`ios.bundleIdentifier`), plus runs one read-only CLI verification command
(`eas project:info`). No `src/`, `app/` route, or test files are created or
modified. There is no component/service/controller-style code in scope, so
the standard role/data-flow classification grid does not meaningfully apply
here — the "file" in question is a static JSON config document, not
application logic.

Given that, this PATTERNS.md documents the one relevant precedent (Phase 20's
edit of this same file) rather than searching `src/` for unrelated
controller/service/component analogs, which would not transfer to a JSON
config edit.

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|--------------------|------|-----------|-----------------|----------------|
| `app.json` (`expo.slug`, `expo.scheme`, `expo.ios.buildNumber`) | config | batch (static, build-time-read, not runtime) | `app.json` itself, as edited in Phase 20 Plan 02 (`575715b`, `04bcaf5`, `915a3ea`) | exact (same file, same category of edit — single top-level/nested field additions) |
| (verification) `eas project:info --json --non-interactive` | N/A — CLI invocation, not a source file | request-response (read-only network call to EAS servers) | Phase 20's `eas build:list --platform ios --status finished --limit 1 --json` (`20-02-SUMMARY.md` line 103) | role-match (both are read-only, `--json`, non-interactive EAS CLI status checks used as phase-closing evidence) |

## Pattern Assignments

### `app.json` (config, batch/static)

**Analog:** `app.json` itself — this file's own Phase 20 edit history is the
only relevant precedent, since there is no other config file of this shape
in the repo.

**Current full content** (`app.json`, all 56 lines — read in full, no
truncation needed):
```json
{
  "expo": {
    "name": "Lafa",
    "slug": "portuguese-verb-mobile",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/images/icon.png",
    "scheme": "portugueseverbmobile",
    "userInterfaceStyle": "automatic",
    "ios": {
      "icon": "./assets/expo.icon",
      "bundleIdentifier": "com.avram.aruh.lafa",
      "infoPlist": {
        "ITSAppUsesNonExemptEncryption": false
      }
    },
    "android": { ... },
    "web": { ... },
    "plugins": [ ... ],
    "experiments": { ... },
    "extra": {
      "router": {},
      "eas": {
        "projectId": "88aa092c-033c-4bcc-bf53-450c721977e8"
      }
    },
    "owner": "avram.aruh"
  }
}
```

**Target diff for this phase** (four fields, all top-level or one level
nested under `ios`):
```json
{
  "expo": {
    "slug": "lafa",                          // was "portuguese-verb-mobile"
    "scheme": "lafa",                        // was "portugueseverbmobile"
    "ios": {
      "bundleIdentifier": "com.avram.aruh.lafa",  // unchanged — confirm only
      "buildNumber": "1"                     // new key, not present yet
    }
    // "version": "1.0.0" — confirm unchanged, do not touch
  }
}
```

**Edit style precedent (Phase 20 commits, same file):**
- `575715b` (feat) — added `ios.bundleIdentifier` as a single nested-field
  addition under an existing `ios` block, committed atomically and named
  descriptively (`feat: set final iOS bundle identifier in app.json`, per
  `20-02-SUMMARY.md` Task Commits). Apply the same style: one commit per
  logically distinct field-set change, `feat` prefix, imperative summary
  naming the exact field(s) touched.
- `04bcaf5` (feat) — CLI-generated `eas.json` bootstrap, committed as-is
  without hand-editing CLI output.
- `915a3ea` (feat) — committed a CLI-written field
  (`ios.infoPlist.ITSAppUsesNonExemptEncryption`) verbatim, treating
  EAS-CLI-generated scaffold as trustworthy, non-hand-edited config (see
  Shared Patterns below — this convention is explicitly reaffirmed in
  21-CONTEXT.md's "Established Patterns").

**Validation pattern to reuse (from RESEARCH.md's Validation Architecture,
already scoped for this phase — not invented fresh):**
```bash
node -e "const e=require('./app.json').expo; if(e.slug!=='lafa'||e.scheme!=='lafa')process.exit(1)"
node -e "const e=require('./app.json').expo; if(e.ios.buildNumber!=='1'||e.version!=='1.0.0')process.exit(1)"
node -e "if(require('./app.json').expo.ios.bundleIdentifier!=='com.avram.aruh.lafa')process.exit(1)"
```
Per-task/per-commit companion check (Phase 20 precedent, `20-02-SUMMARY.md`
line 305): run `npm run typecheck` after any `app.json`-adjacent edit even
though this phase touches no `.ts` files, to catch any config-plugin/type
regression early — cheap and already the established convention for
touching this file.

---

### EAS read-only verification command

**Analog:** Phase 20's `eas build:list --platform ios --status finished
--limit 1 --json` (`20-02-SUMMARY.md` line 103), used there as
non-interactive, machine-checkable phase-closing evidence.

**Pattern to copy for IDENT-04 (per RESEARCH.md Code Examples):**
```bash
npx eas-cli project:info --json --non-interactive
# Compare returned `fullName`'s slug segment against the new local `slug`.
# Expect a mismatch immediately post-edit (server not yet reconciled) —
# log this as a carry-forward finding for Phase 24, not a blocker.
```
Do **not** substitute any other project-context command (`eas build`,
`eas submit`, `eas build:list`, `eas update`) for this check in this
phase — RESEARCH.md's Common Pitfalls #1/#3 and Anti-Patterns section
confirm those commands additionally invoke a slug-consistency check that
`project:info` skips, and could throw or (worse) trigger unwanted
reconciliation behavior this phase must not perform.

## Shared Patterns

### CLI-generated config is committed as-is, never hand-edited
**Source:** `20-CONTEXT.md`/`21-CONTEXT.md` "Established Patterns"; concretely
demonstrated by Phase 20 commit `915a3ea` (`ios.infoPlist.ITSAppUsesNonExemptEncryption`)
and `04bcaf5` (`eas.json` bootstrap).
**Apply to:** Any field in `app.json` that a verification command in this
phase might write as a side effect (none expected for a read-only
`project:info` call, but if any CLI invocation in this phase's execution
unexpectedly mutates `app.json`, commit the diff verbatim rather than
hand-adjusting it).

### One field-change = one atomic commit, `feat` prefix, descriptive summary
**Source:** Phase 20 Task Commits list (`575715b`, `04bcaf5`, `9b48acf`, `915a3ea`).
**Apply to:** Each of the three `app.json` edits (slug, scheme, buildNumber)
in this phase — CONTEXT.md's D-flag already notes edit order is
unconstrained/independent, so each can land as its own small, named commit
following this repo's existing granularity convention for this exact file.

### Read-only CLI checks as phase-closing evidence, not Jest assertions
**Source:** `20-02-SUMMARY.md` (`build:list --json` check) and this phase's
own RESEARCH.md Validation Architecture table.
**Apply to:** IDENT-04's `eas project:info` check — treat its logged/compared
output as the closing evidence for that requirement, the same way Phase 20
treated `build:list --json` output as BUILD-02's closing evidence, rather
than trying to force it into an automated pass/fail Jest test.

## No Analog Found

None. The single in-scope file (`app.json`) has a direct, exact-match
precedent in this same file's own prior edit history (Phase 20 Plan 02).
No `src/`/`app/` files are touched by this phase, so no controller/service/
component-style analog search was needed or performed.

## Metadata

**Analog search scope:** `app.json` (this repo, current + Phase 20 history via `20-02-SUMMARY.md`); no `src/`/`app/`/`__tests__/` directories searched (out of scope — config-only phase, confirmed by both CONTEXT.md and RESEARCH.md).
**Files scanned:** 2 (`app.json` current state; `20-02-SUMMARY.md` for edit-history precedent)
**Pattern extraction date:** 2026-07-23
