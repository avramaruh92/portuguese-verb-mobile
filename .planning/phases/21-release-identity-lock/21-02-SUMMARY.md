---
phase: 21-release-identity-lock
plan: 02
subsystem: infra
tags: [eas, release-identity, checkpoint, human-verify]

# Dependency graph
requires:
  - phase: 21-01
    provides: "app.json slug/scheme/buildNumber locked to lafa; eas project:info run, confirmed the mismatch"
provides:
  - "IDENT-04 closing evidence: no expo.dev dashboard rename option exists for a project's slug"
  - "Confirmed disposition: server-slug vs local-slug mismatch is a known, permanent-for-now condition, explicitly handed to Phase 24"
affects: [24-quality-gates-preflight-first-submit]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "EAS project settings (expo.dev General tab) exposes only Display name (cosmetic label) and Project icon as renameable fields — no Slug field exists. Danger Zone only offers Transfer project (to another account) and Delete project — neither reconciles a slug in place."

key-files:
  created: [21-02-SUMMARY.md]
  modified: []

key-decisions:
  - "Operator inspected the full expo.dev Project Settings > General page (Display name, Project icon, Connections, notifications, Danger Zone) and confirmed no slug-rename affordance exists anywhere on it"
  - "Setting Display Name to 'Lafa' does NOT change the underlying slug — confirmed by re-running eas project:info, which still throws the identical slug-mismatch error (server slug unchanged: portuguese-verb-mobile)"
  - "D-01 upheld: no new EAS project created; projectId 88aa092c-033c-4bcc-bf53-450c721977e8 unchanged"
  - "Per RESEARCH.md Open Question 1, this resolves definitively to: no CLI/API AND no dashboard path exists to rename an EAS project's registered slug while keeping its projectId. The only ways to change the registered slug would be Transfer (moves to another account, does not preserve slug independently) or Delete+recreate (which is exactly what D-01 rejected)."

requirements-completed: [IDENT-04]

# Metrics
duration: ~10min (operator dashboard check + verification)
completed: 2026-07-23
---

# Phase 21 Plan 02: Dashboard Rename Checkpoint Summary

**Confirmed no EAS dashboard mechanism exists to rename a project's slug — IDENT-04 closes with the mismatch explicitly documented and handed to Phase 24, not silently accepted or hidden.**

## Performance

- **Duration:** ~10 min
- **Started:** 2026-07-23 (checkpoint presented)
- **Completed:** 2026-07-23
- **Tasks:** 1 (checkpoint:human-verify)
- **Files modified:** 0 (this SUMMARY.md only)

## Accomplishments
- Operator logged into expo.dev, opened the `Lafa` project (id `88aa092c-033c-4bcc-bf53-450c721977e8`), and reviewed the full Project Settings > General page.
- The page exposes exactly two editable identity-adjacent fields: **Display name** (cosmetic, "used on the EAS website" per its own description) and **Project icon**. Neither is the registered `slug`.
- Operator initially set Display Name to "Lafa" and uploaded a project icon, then confirmed (at Claude's request) this was the entire settings page — no separate "Slug" field exists anywhere on it.
- Re-ran `npx eas-cli project:info --json --non-interactive` after the Display Name change: **identical error** — `Slug for project identified by "extra.eas.projectId" (portuguese-verb-mobile) does not match the "slug" field (lafa)`. This confirms the Display Name change has zero effect on the field EAS actually validates.
- Danger Zone offers only **Transfer project** (moves the project to a different Expo account — does not rename the slug independently) and **Delete project** (exactly the "create a new project" path D-01 explicitly rejected, since it would orphan Phase 20's proof build and require re-provisioning Apple distribution credentials).

## Task Commits

This plan makes no code/config commit — its sole output is this SUMMARY.md, which will be committed by the orchestrator (per plan frontmatter `files_modified: []`).

## Files Created/Modified
- `.planning/phases/21-release-identity-lock/21-02-SUMMARY.md` — this file, IDENT-04 closing evidence

## Decisions Made
- **IDENT-04 closes on outcome (b) from the plan's two anticipated outcomes:** no dashboard rename option exists. This was verified thoroughly (full settings page reviewed, Display Name tested and confirmed not to affect the slug, re-verified via a live `eas project:info` re-run) rather than assumed.
- **D-01 upheld throughout:** no new EAS project was created; `extra.eas.projectId` remains `88aa092c-033c-4bcc-bf53-450c721977e8`.
- **D-03 upheld:** no `eas build`/`eas submit`/`eas init` was run this plan; only the already-permitted `eas project:info` read-only re-verification.

## Deviations from Plan

None — plan executed exactly as written. The plan anticipated exactly this class of outcome (its `<how-to-verify>` step 4b) and this SUMMARY follows that disposition precisely.

## Issues Encountered

**Resolved (not a bug):** The operator's first attempt (setting Display Name to "Lafa") looked superficially like it might address IDENT-04, since the sidebar/header now shows "Lafa" instead of the old name. Verified via a live `eas project:info` re-run that this is cosmetic only and the underlying slug-consistency error is byte-for-byte identical to before the Display Name change. This is now conclusively documented so Phase 24 doesn't waste time re-investigating the Display Name field as a potential fix.

## User Setup Required

None further — the dashboard investigation this checkpoint required is complete. No external service configuration remains for this phase.

## Next Phase Readiness

**Phase 24 ("Quality Gates, Preflight & First Submit") inherits a known, permanent condition, not an open question:**
- `app.json` local `slug`/`scheme` = `lafa` (locked, Phase 21 Plan 01)
- EAS project `88aa092c-033c-4bcc-bf53-450c721977e8`'s server-side registered slug remains `portuguese-verb-mobile` — there is no supported way (CLI, API, or dashboard) to change this while keeping the same project
- Any EAS CLI command that performs the slug-consistency check (confirmed for `project:info` in this repo's pinned `eas-cli@21.1.0`; expected for `build`/`submit`/`build:list`/`update` per RESEARCH.md) **will throw** until this is addressed
- **Phase 24 must decide, with full information, one of:** (a) accept creating a fresh EAS project under the `lafa` slug at that point (re-provisioning Apple distribution credentials, losing the Phase 20 proof-build link — the tradeoff D-01 avoided here, but Phase 24 may judge differently once a real build is actually blocked), or (b) find an EAS support/API path not surfaced by this research (e.g. contacting Expo support, or a newer `eas-cli` version exposing a rename command). This is not this phase's decision to make — IDENT-04 required documenting the state, not resolving Phase 24's build.

---
*Phase: 21-release-identity-lock*
*Completed: 2026-07-23*

## Self-Check: PASSED

- FOUND: `.planning/phases/21-release-identity-lock/21-02-SUMMARY.md` (this file)
- CONFIRMED: `eas project:info --json --non-interactive` re-run post-Display-Name-change still errors with identical slug-mismatch message
- CONFIRMED: `extra.eas.projectId` unchanged (`88aa092c-033c-4bcc-bf53-450c721977e8`) — no new project created
- CONFIRMED: no `eas init`/`eas build`/`eas submit`/`eas build:list`/`eas update` run this plan
