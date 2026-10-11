---
phase: 21-release-identity-lock
reviewed: 2026-07-23T00:00:00Z
depth: standard
files_reviewed: 1
files_reviewed_list:
  - app.json
findings:
  critical: 1
  warning: 2
  info: 1
  total: 4
status: issues_found
---

# Phase 21: Code Review Report

**Reviewed:** 2026-07-23T00:00:00Z
**Depth:** standard
**Files Reviewed:** 1
**Status:** issues_found

## Summary

Reviewed the single config-only diff to `app.json` for Phase 21 (Release
Identity Lock): `expo.slug` (`portuguese-verb-mobile` → `lafa`),
`expo.scheme` (`portugueseverbmobile` → `lafa`), and `expo.ios.buildNumber`
(added, `"1"`). The JSON itself is syntactically valid and the confirmed
unchanged fields (`bundleIdentifier`, `version`, `extra.eas.projectId`)
match what the phase's own plan/summary artifacts claim. However, the
resulting config is in a state that will actively break `eas` project
commands until a server-side reconciliation (tracked as a Phase 24
carry-forward per the phase's own `21-01-SUMMARY.md`), and it now
contradicts an explicit, unambiguous statement in this repo's own
`CLAUDE.md`. Both are real, provable problems with the file as it stands
in the tree today, regardless of the fact that the team has a plan to
resolve them later — a reviewer's job is to flag the state of the
committed artifact, not to accept "we know, it's tracked" as closing the
issue.

## Critical Issues

### CR-01: `app.json` slug now mismatches the EAS-registered project slug, breaking `eas project:info`/`eas build`/`eas submit`

**File:** `app.json:4` (`"slug": "lafa"`), in combination with `app.json:52` (`"projectId": "88aa092c-033c-4bcc-bf53-450c721977e8"`)
**Issue:** The EAS project identified by `extra.eas.projectId` is still registered server-side under slug `portuguese-verb-mobile`, but `app.json`'s top-level `slug` field is now `lafa`. This is not a hypothetical risk — the phase's own `21-01-SUMMARY.md` documents running `eas project:info --json --non-interactive` against this exact file and getting a hard failure:
```
Project config: Slug for project identified by "extra.eas.projectId"
(portuguese-verb-mobile) does not match the "slug" field (lafa).
Error: project:info command failed.
```
`eas build`, `eas submit`, and `eas update` perform the same slug-consistency check as `eas project:info` (confirmed in the same summary as "other project-context commands... perform [this check]"). As committed, this file cannot be used to run a real EAS build or submit until the server-side slug is reconciled via the Expo dashboard — a manual, out-of-repo action explicitly deferred to a future phase (24). Shipping this file in its current state, without that reconciliation landing first, means the release pipeline is broken for as long as this gap persists. A reviewer cannot treat "we already know and have a ticket for it" as equivalent to "the pipeline works" — the artifact under review does not build.
**Fix:** Either (a) do not merge/ship this `app.json` state until the dashboard slug reconciliation lands (sequence Phase 24's dashboard rename before or atomically with this change), or (b) if the two must ship independently, add a loud, unmissable guard (e.g. a `STATE.md`/`ROADMAP.md` blocking entry, or a CI check that runs `eas project:info` and fails the build) so nobody attempts an EAS build against this commit before the reconciliation completes.

## Warnings

### WR-01: `app.json` slug change contradicts an explicit, still-current statement in `CLAUDE.md`

**File:** `app.json:4`
**Issue:** `CLAUDE.md` (root of this repo, read by every agent session per project convention) states unconditionally: *"The repo/slug/backend sibling repo name stay `portuguese-verb-mobile` / `portuguese-verb-api` — 'Lafa' is the user-facing identity only."* This statement was not updated as part of this phase, and it is now factually wrong about the `slug` field specifically (it is silent on `app.json`'s `scheme`, but explicit about "slug"). Any future agent or contributor reading `CLAUDE.md` before touching `app.json` will be told the slug never changes, when it already has. This is exactly the kind of documentation-drift the project's own `CLAUDE.md` warns readers to watch for elsewhere (e.g. the "Portuguese Verb Quiz" display-name caveat), but this specific claim was not caught or updated during this phase.
**Fix:** Update the `CLAUDE.md` paragraph to either (a) clarify "slug" there refers to the repo's package/directory slug (`package.json`'s `"name": "portuguese-verb-mobile"`, unchanged) as distinct from `app.json`'s Expo config `slug` (renamed), or (b) if the intent really was for `expo.slug` to also stay pinned, revert this phase's slug change and use a different mechanism to rebrand app-facing identity.

### WR-02: `package.json` name and `app.json` slug are now inconsistent with no cross-reference or comment

**File:** `app.json:4` vs. `package.json:2` (`"name": "portuguese-verb-mobile"`, unchanged)
**Issue:** Before this phase, `app.json`'s `expo.slug` and `package.json`'s `name` were identical (`portuguese-verb-mobile`), which is Expo's conventional default relationship (slug is typically derived from/matches the package name). After this phase they diverge (`lafa` vs. `portuguese-verb-mobile`) with no comment or STATE.md note explaining the intentional divergence for a future reader who only opens `app.json` or `package.json` in isolation (without the `.planning/` phase artifacts).
**Fix:** Add a brief note near the top of `.planning/codebase/STACK.md` or `CLAUDE.md` documenting that `package.json.name` intentionally stays `portuguese-verb-mobile` (repo identity) while `app.json.expo.slug` is now `lafa` (release identity), so the divergence reads as deliberate rather than an oversight.

## Info

### IN-01: New custom URL scheme `lafa` is a short, generic string with no collision check recorded

**File:** `app.json:8` (`"scheme": "lafa"`)
**Issue:** iOS custom URL schemes are global to the device — if another installed app also registers the scheme `lafa`, `Linking`/deep-link behavior becomes non-deterministic (first-registered or alphabetically-resolved app wins, depending on iOS version). The phase artifacts don't record having checked for scheme collisions (unlike the slug, which was explicitly checked against the EAS server). This is low-risk for a Portuguese-verb quiz app in practice, but it's an unverified assumption.
**Fix:** No code change needed; consider a one-line note in the phase's decision log confirming the scheme was chosen without a collision-check, so it's a known/accepted risk rather than an oversight if it ever surfaces as a support issue.

---

_Reviewed: 2026-07-23T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
