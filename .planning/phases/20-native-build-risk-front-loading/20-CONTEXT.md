# Phase 20: Native Build Risk Front-Loading - Context

**Gathered:** 2026-07-23
**Status:** Ready for planning

<domain>
## Phase Boundary

Prove the app's native dependency graph actually builds on EAS's cloud
infrastructure — this is the app's first-ever real native build. Any
drift invisible in Expo Go/dev-client (native module version mismatches,
config-plugin issues) must surface now, before release-identity, icon, or
`eas.json` polish work is invested in later phases. No product/UI code
changes. Requirements: BUILD-01, BUILD-02.

</domain>

<decisions>
## Implementation Decisions

### Bundle identifier for the throwaway build
- **D-01:** Set the final `ios.bundleIdentifier` (`com.avram.aruh.lafa`) in
  `app.json` during this phase, not a disposable scratch id. It needs to
  land there eventually and is idempotent — Phase 21 confirms/finalizes it
  rather than changing it. Avoids registering throwaway EAS
  credentials/project state under a discarded identifier.

### eas.json bootstrap strategy
- **D-02:** Run `eas build:configure` interactively to auto-generate the
  initial `eas.json` (development/preview/production profiles) and
  register the EAS project id — do not hand-write a placeholder. Phase 23
  edits this file in place (adds submit profile, `appVersionSource:
  "remote"`, `autoIncrement: true`, `ITSAppUsesNonExemptEncryption`) rather
  than starting from scratch.

### expo-doctor / expo install --check failure handling
- **D-03:** If `npx expo-doctor` or `npx expo install --check` surface real
  issues (version mismatches, native module drift), fix them immediately
  in this phase — do not log-and-defer. BUILD-01's success criteria
  requires a zero-issues `expo-doctor` pass, and every later v0.5 phase
  assumes a clean dependency baseline.

### eas-cli install method
- **D-04:** Add `eas-cli` (`^21.0.3`) as a pinned `devDependency` in
  `package.json` rather than always invoking via `npx`. It's used
  repeatedly across this milestone (Phases 20 and 24); pinning gives a
  reproducible version and avoids npx's per-invocation upgrade nag.

### Claude's Discretion
- Exact sequencing of expo-doctor/install-check fixes vs. the
  bundle-identifier/eas.json setup — whichever order is more efficient is
  fine, as long as both land before the throwaway `eas build` runs.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project/milestone context
- `.planning/PROJECT.md` §"Current Milestone: v0.5 iOS TestFlight Readiness" — milestone goal, target features, key context
- `.planning/REQUIREMENTS.md` §"Native Build Verification" — BUILD-01, BUILD-02 exact wording
- `.planning/ROADMAP.md` §"Phase 20: Native Build Risk Front-Loading" — goal, success criteria, dependency on nothing (first v0.5 phase)
- `.planning/research/SUMMARY.md` §"Phase 1: Native build risk front-loading" — full rationale, pitfall #4 (expo-doctor/native build drift), suggested build order
- `.planning/research/STACK.md` — eas-cli version, eas.json schema, app.json field requirements (verified against official Expo docs)
- `.planning/research/PITFALLS.md` — pitfall #5 (expo-doctor/native-build risk currently unknown — recommends a throwaway build before icon/eas.json polish)

No other external specs — requirements fully captured in decisions above.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- None — this phase touches only `app.json`, `package.json`, and (new)
  `eas.json`; no `src/`/`app/` product code is in scope.

### Established Patterns
- `app.json` is the single source of truth for release identity in this
  managed-Expo project (no checked-in native `ios/` directory).
- `package.json` devDependencies are pinned to exact/tilde versions
  throughout (e.g. `jest-expo`, `typescript`) — `eas-cli` should follow the
  same convention.

### Integration Points
- Current `app.json` state (verified 2026-07-23): `slug:
  "portuguese-verb-mobile"`, `scheme: "portugueseverbmobile"`, no
  `ios.bundleIdentifier`, `ios.icon: "./assets/expo.icon"` (still the
  unmodified Expo template default per Phase 22's scope), no `eas.json`,
  no `extra.eas.projectId`.
- EAS CLI already authenticated on this machine (`eas whoami` →
  `avram.aruh`, accounts `avram.aruh` and `savi-labs`) — no `eas login`
  step needed in the plan.
- `eas-cli@21.0.3` confirmed as latest via `npx eas-cli --version` on
  2026-07-23.

</code_context>

<specifics>
## Specific Ideas

No particular UI/behavior references — this is release-engineering
config, not a user-facing feature. Open to standard EAS Build tooling
conventions.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope. (Icon path decisions belong
to Phase 22, `eas.json` submit/export-compliance fields belong to Phase
23, and both were explicitly kept out of this phase's D-01/D-02 decisions.)

</deferred>

---

*Phase: 20-native-build-risk-front-loading*
*Context gathered: 2026-07-23*
