---
phase: 21-release-identity-lock
plan: 01
subsystem: release-config
tags: [app.json, eas, release-identity, config-only]
requires: []
provides:
  - "app.json release identity locked: slug=lafa, scheme=lafa, ios.buildNumber=1"
  - "Confirmed EAS projectId still resolves to the existing project (D-01)"
  - "Documented server-slug vs local-slug mismatch as a Phase 24 carry-forward finding (IDENT-04)"
affects:
  - app.json
tech-stack:
  added: []
  patterns:
    - "Single-field JSON edits in app.json, one atomic feat commit per logically distinct change (Phase 20 precedent)"
key-files:
  created: []
  modified:
    - app.json
decisions:
  - "Kept extra.eas.projectId (88aa092c-033c-4bcc-bf53-450c721977e8) unchanged per D-01 — EAS projects are UUID-keyed, re-registering would orphan Phase 20's proof build"
  - "Did not attempt to reconcile the server-side slug (still portuguese-verb-mobile) with the new local slug (lafa) — per D-02/D-03, that reconciliation is a dashboard-only human action deferred to Phase 24 (handled by 21-02's checkpoint)"
metrics:
  duration: "~15min"
  completed: "2026-07-23"
---

# Phase 21 Plan 01: Release Identity Lock Summary

Locked `app.json`'s release identity (slug, scheme, iOS build number) to their
final `lafa`-branded values and confirmed, read-only, that the existing EAS
project registration still resolves — while explicitly documenting the
expected (and currently un-reconciled) server-slug vs. local-slug mismatch as
a Phase 24 carry-forward finding, per D-02/D-03.

## What Was Built

### Task 1: Edited app.json release identity fields (commit `447a405`)

Four fields in `app.json`'s `expo` object:
- `slug`: `"portuguese-verb-mobile"` → `"lafa"` (IDENT-02)
- `scheme`: `"portugueseverbmobile"` → `"lafa"` (IDENT-02)
- `ios.buildNumber`: added, string `"1"` (IDENT-03)
- `ios.bundleIdentifier`: confirmed unchanged, `"com.avram.aruh.lafa"` (IDENT-01, set in Phase 20)
- `version`: confirmed unchanged, `"1.0.0"` (IDENT-03)
- `extra.eas.projectId`: confirmed untouched, `"88aa092c-033c-4bcc-bf53-450c721977e8"`

All verification assertions passed:
```
node -e config assertions (slug/scheme, buildNumber/version, bundleIdentifier) -> all pass
npm run typecheck -> exit 0
```

### Task 2: EAS project resolution check and IDENT-04 finding (no commit — verification only, no file changes)

Ran `npm run eas -- project:info --json --non-interactive` (the pinned local
`eas-cli@21.1.0`, not the shadowing global `eas-cli@20.0.0` — same Phase 20
Pitfall 1 precedent applies to invocation method).

**Result — deviates from RESEARCH.md's prediction, but confirms IDENT-04's
required finding more directly than expected:**

```
Project config: Slug for project identified by "extra.eas.projectId"
(portuguese-verb-mobile) does not match the "slug" field (lafa).
Learn more: https://expo.fyi/eas-project-id
    Error: project:info command failed.
```

RESEARCH.md's Architecture Patterns section (based on reading `eas-cli`
source at research time) predicted `eas project:info` skips the
slug-consistency check that other project-context commands (`eas build`,
`eas submit`, etc.) perform, and would return clean JSON with the server's
`fullName` for manual comparison. Against the actual pinned `eas-cli@21.1.0`
in this repo, `project:info` **does** perform this check and exits non-zero
before returning any JSON — a version-specific behavior gap in the research
(most likely `eas-cli` added this check to `project:info` in a version
released after the source snapshot the research read).

This is documented as-is, not treated as a bug to fix: the command's error
message itself is direct, first-party confirmation of exactly the two facts
D-02 required:
1. **The `projectId` still resolves** — the error message could only report
   the server's current slug (`portuguese-verb-mobile`) for
   `extra.eas.projectId` by successfully fetching that project record from
   EAS's servers by ID first. This is the D-01/IDENT-04 "projectId still
   resolves" confirmation, obtained implicitly rather than via a clean
   `--json` payload.
2. **The expected mismatch is real and current:** server slug
   `portuguese-verb-mobile` (unchanged, no reconciliation performed this
   phase) vs. local slug `lafa` (this phase's edit). This is the exact,
   anticipated post-edit state per D-02/D-03 — not a regression.

No forbidden command (`eas init`, `eas init --force`, `eas build`, `eas
submit`, `eas build:list`, `eas update`) was run. `git diff --stat app.json`
after the command confirms zero CLI-side mutation of `app.json` (the command
failed before performing any local write, consistent with expectations).

**IDENT-04 carry-forward finding for Phase 24:** the EAS project record
identified by `extra.eas.projectId` (`88aa092c-033c-4bcc-bf53-450c721977e8`)
still has server-side slug `portuguese-verb-mobile`, while `app.json`'s local
`slug` is now `lafa`. Any project-context EAS CLI command that performs this
consistency check (confirmed for `project:info` in this session; documented
by research for `build`/`submit`/`build:list`/`update`) will throw until the
server-side slug is reconciled. Per Open Question 1 (RESEARCH.md, resolved),
reconciliation is a dashboard-only human action with no CLI/API equivalent —
Phase 21 Plan 02's `checkpoint:human-verify` task is the designated place for
the operator to perform/confirm this dashboard action before Phase 24's
first real build.

## Deviations from Plan

### Auto-fixed Issues

None requiring code changes — Task 1 executed exactly as planned.

### Documented Findings (not deviations requiring a fix)

**1. [Research gap, not a bug] `eas project:info` performs the slug-consistency check in the pinned `eas-cli@21.1.0`, contrary to RESEARCH.md's prediction**
- **Found during:** Task 2
- **Issue:** RESEARCH.md predicted a clean `--json` return skipping slug validation; the actual pinned CLI version throws instead.
- **Resolution:** No fix needed — the thrown error is itself valid, direct evidence of both required facts (projectId resolves + mismatch is real), satisfying D-02/IDENT-04 more directly than the originally-planned JSON-diff comparison would have. Documented above as this phase's IDENT-04 finding. Carried forward to Phase 24 planning: any future research into this exact command should account for CLI-version-dependent slug-check behavior.
- **Files modified:** None (app.json unaffected — confirmed via `git diff --stat app.json`).
- **Commit:** N/A (no file change).

## Known Stubs

None.

## Threat Flags

None — no new network endpoints, auth paths, file access patterns, or trust-boundary changes. Per the plan's threat model, this phase has no applicable ASVS category (static config edit + one read-only CLI call).

## Self-Check: PASSED

- `app.json` exists and contains `"slug": "lafa"` — FOUND
- Commit `447a405` exists in `git log` — FOUND
- `git diff --stat app.json` post-Task-2 is empty (no CLI mutation) — CONFIRMED
