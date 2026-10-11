# Phase 21: Release Identity Lock - Context

**Gathered:** 2026-07-23
**Status:** Ready for planning

<domain>
## Phase Boundary

Lock the app's release identity — bundle identifier, slug/scheme, version/build
number, and EAS project id — so it's final and internally consistent before any
"real" (non-throwaway) build or App Store Connect record is created against it.
`ios.bundleIdentifier` (`com.avram.aruh.lafa`) was already set in Phase 20 to
avoid binding EAS credentials to a placeholder id and is confirmed, not
re-decided, here. Requirements: IDENT-01, IDENT-02, IDENT-03, IDENT-04. No
product/UI code changes.

</domain>

<decisions>
## Implementation Decisions

### EAS project id reconciliation (IDENT-04)
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

### Build verification scope
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

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project/milestone context
- `.planning/PROJECT.md` §"Current Milestone: v0.5 iOS TestFlight Readiness" — milestone goal, phase sequencing rationale
- `.planning/REQUIREMENTS.md` §"Release Identity" (IDENT-01–04) — exact requirement wording
- `.planning/ROADMAP.md` §"Phase 21: Release Identity Lock" — goal, success criteria, dependency on Phase 20

### Prior phase history (Phase 20 — direct dependency)
- `.planning/phases/20-native-build-risk-front-loading/20-CONTEXT.md` — D-01 (bundleIdentifier locked early), D-02 (eas.json bootstrap strategy)
- `.planning/phases/20-native-build-risk-front-loading/20-02-SUMMARY.md` — confirms current `app.json`/`eas.json` state as of Phase 20 completion: `ios.bundleIdentifier: "com.avram.aruh.lafa"` already set; `extra.eas.projectId: "88aa092c-033c-4bcc-bf53-450c721977e8"` and `owner: "avram.aruh"` CLI-registered under the OLD slug `portuguese-verb-mobile`; finished proof build `2dc80140-dcc3-4c7f-a71b-2848f114b5ca` exists under that project id; no durable Node-version pin exists yet (flagged for Phase 23/24, not this phase)

No other external specs — requirements fully captured in decisions above.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- None — this phase only touches `app.json` (four fields: `slug`, `scheme`,
  `ios.buildNumber`, and a read-only check of `extra.eas.projectId`). No
  `src/`/`app/` product code is in scope.

### Established Patterns
- `app.json` is the single source of truth for release identity in this
  managed-Expo project (no checked-in native `ios/` directory).
- EAS CLI treats some `app.json` fields as CLI-generated scaffold to commit
  as-is (established in Phase 20 for `extra.eas.projectId`/`owner`/
  `ios.infoPlist.ITSAppUsesNonExemptEncryption`) — the same convention
  applies if any verification command in this phase mutates `app.json`.

### Integration Points
- Current `app.json` state (verified 2026-07-23, post-Phase-20):
  `slug: "portuguese-verb-mobile"` (target: `"lafa"`),
  `scheme: "portugueseverbmobile"` (target: `"lafa"`),
  `version: "1.0.0"` (confirmed unchanged, no `ios.buildNumber` key present
  yet — target: add `"1"`),
  `ios.bundleIdentifier: "com.avram.aruh.lafa"` (already final, confirm only),
  `extra.eas.projectId: "88aa092c-033c-4bcc-bf53-450c721977e8"` (keep, verify
  resolution per D-01/D-02).
- `eas.json` already exists (created in Phase 20) with `development`/
  `preview`/`production` build profiles and `cli.appVersionSource: "remote"` —
  untouched by this phase; Phase 23 edits it further.
- EAS CLI already authenticated on this machine (`eas whoami` →
  `avram.aruh`) — no `eas login` step needed.

</code_context>

<specifics>
## Specific Ideas

No particular UI/behavior references — this is release-engineering config,
not a user-facing feature. Open to standard EAS CLI verification commands.

</specifics>

<deferred>
## Deferred Ideas

- Real `eas build`/submit verification of the new identity — explicitly
  deferred to Phase 24 (D-03), not this phase.
- Durable Node-version pin (`.nvmrc` or equivalent) to prevent the
  npm-version lockfile drift class found in Phase 20 — flagged by Phase 20
  for Phase 23/24, not re-raised here since it's out of this phase's scope.

None of this discussion surfaced any new capability requests — scope stayed
within IDENT-01 through IDENT-04.

</deferred>

---

*Phase: 21-release-identity-lock*
*Context gathered: 2026-07-23*
