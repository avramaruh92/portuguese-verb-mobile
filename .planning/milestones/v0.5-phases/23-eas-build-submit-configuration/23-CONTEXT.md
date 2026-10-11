# Phase 23: EAS Build/Submit Configuration - Context

**Gathered:** 2026-07-23
**Status:** Ready for planning

<domain>
## Phase Boundary

Declare reproducible, EAS-managed-credential build and submit profiles in
`eas.json`, and set export-compliance proactively in `app.json`, so the
first real build/submit cycle in Phase 24 has nothing left to configure.
Requirements: EASCFG-01, EASCFG-02, EASCFG-03. No product/UI code changes,
no real `eas build`/`eas submit` run in this phase.

**Already satisfied by Phase 20's `eas build:configure` bootstrap (verify,
don't redo):**
- `eas.json` `cli.appVersionSource: "remote"` — present
- `eas.json` `build.production.autoIncrement: true` — present
- `app.json` `ios.infoPlist.ITSAppUsesNonExemptEncryption: false` — present
  (EASCFG-03 is effectively done; confirm it survives this phase's edits)

**Actual remaining gap:** `eas.json` `submit.production` is currently `{}` —
needs an `ios.ascAppId` placeholder (EASCFG-02).

</domain>

<decisions>
## Implementation Decisions

### ascAppId placeholder value (EASCFG-02)
- **D-01:** No App Store Connect app record exists yet for Lafa. Use a
  clearly-marked placeholder string (e.g. `"REPLACE_WITH_ASC_APP_ID"`) for
  `submit.production.ios.ascAppId`, not a real numeric id. Phase 24 fills
  in the real value once the ASC record is created as part of the first
  submit cycle.

### eas.json explicitness (EASCFG-01)
- **D-02:** Leave EAS-managed iOS credentials and `distribution: "store"`
  implicit (relying on EAS CLI defaults) rather than spelling them out in
  `build.production`. Matches Phase 20's established pattern of trusting
  `eas build:configure`'s generated output as-is. Success criteria only
  requires the three specific fields (`appVersionSource`, `autoIncrement`,
  `ascAppId` placeholder) — not a fully spelled-out profile.

### Claude's Discretion
- Exact placeholder string text for `ascAppId`, as long as it's
  unambiguous that it needs replacing before Phase 24's real submit
  (e.g. `"REPLACE_WITH_ASC_APP_ID"` or similar all-caps TODO-style
  string).
- Whether to add a comment/note anywhere documenting that the placeholder
  needs filling in — `eas.json` doesn't support comments (it's parsed as
  strict JSON), so this may need to live in a PLAN.md task note instead.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project/milestone context
- `.planning/PROJECT.md` §"Current Milestone: v0.5 iOS TestFlight Readiness" — milestone goal, phase sequencing rationale
- `.planning/REQUIREMENTS.md` §"EAS Build/Submit Configuration" (EASCFG-01–03) — exact requirement wording
- `.planning/ROADMAP.md` §"Phase 23: EAS Build/Submit Configuration" — goal, success criteria, dependency on Phase 21

### Prior phase history (direct dependencies/context)
- `.planning/phases/20-native-build-risk-front-loading/20-CONTEXT.md` — D-02: `eas build:configure` bootstrap strategy, explicitly scopes Phase 23 to edit the generated `eas.json` in place (adds submit profile, `appVersionSource: "remote"`, `autoIncrement: true`, `ITSAppUsesNonExemptEncryption`) rather than starting from scratch
- `.planning/phases/21-release-identity-lock/21-CONTEXT.md` — confirms final release identity (`bundleIdentifier: com.avram.aruh.lafa`, `slug`/`scheme`: `lafa`) that this phase's `eas.json`/`app.json` edits build on top of; also flags a durable Node-version pin as deferred to Phase 23/24 (not raised again here — out of EASCFG-01–03 scope, noted under Deferred below)

No other external specs — requirements fully captured in decisions above.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- None — this phase only touches `eas.json` (add `submit.production.ios.ascAppId`)
  and confirms (no edit expected) `app.json`'s existing
  `ios.infoPlist.ITSAppUsesNonExemptEncryption: false`. No `src/`/`app/`
  product code is in scope.

### Established Patterns
- `eas.json` is treated as EAS-CLI-generated scaffold to edit in place, not
  regenerate — established in Phase 20 (D-02) and Phase 21 (build-verification
  scope note).
- `app.json`/`eas.json` are the single sources of truth for release
  config in this managed-Expo project (no checked-in native `ios/` dir).

### Integration Points
- Current `eas.json` state (verified 2026-07-23, post-Phase-21):
  ```json
  {
    "cli": { "version": ">= 21.1.0", "appVersionSource": "remote" },
    "build": {
      "development": { "developmentClient": true, "distribution": "internal" },
      "preview": { "distribution": "internal" },
      "production": { "autoIncrement": true }
    },
    "submit": { "production": {} }
  }
  ```
  Target: add `"submit": { "production": { "ios": { "ascAppId": "REPLACE_WITH_ASC_APP_ID" } } }`.
  No other fields change.
- Current `app.json` state (verified 2026-07-23, post-Phase-21):
  `ios.bundleIdentifier: "com.avram.aruh.lafa"`, `slug`/`scheme`: `"lafa"`,
  `ios.buildNumber: "1"`, `ios.infoPlist.ITSAppUsesNonExemptEncryption: false`
  (already present — EASCFG-03 confirm-only, no edit expected).
- EAS CLI already authenticated on this machine (`eas whoami` →
  `avram.aruh`) — no `eas login` step needed.

</code_context>

<specifics>
## Specific Ideas

No particular UI/behavior references — this is release-engineering config,
not a user-facing feature. No real ASC App ID exists yet to use.

</specifics>

<deferred>
## Deferred Ideas

- Real `eas build`/`eas submit` verification of this config — explicitly
  deferred to Phase 24 ("Quality Gates, Preflight & First Submit"), which
  is where the real `ascAppId` value also gets filled in.
- Durable Node-version pin (`.nvmrc` or equivalent), flagged by Phase 20 as
  a candidate for Phase 23/24 — not folded into this phase since it's
  outside EASCFG-01–03's scope (no requirement covers it); still open for
  Phase 24 to pick up if relevant to the real build.

None of this discussion surfaced any new capability requests — scope
stayed within EASCFG-01 through EASCFG-03.

</deferred>

---

*Phase: 23-eas-build-submit-configuration*
*Context gathered: 2026-07-23*
