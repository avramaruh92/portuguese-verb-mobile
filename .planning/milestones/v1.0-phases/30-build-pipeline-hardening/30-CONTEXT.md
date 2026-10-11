# Phase 30: Build Pipeline Hardening - Context

**Gathered:** 2026-08-16
**Status:** Ready for planning

<domain>
## Phase Boundary

Close the Node/npm version drift between the local dev machine and the real
EAS build image for good, via a durable version pin (`.nvmrc`,
`package.json` `engines.node`, `eas.json`'s production `node` field) plus a
freshly regenerated `package-lock.json` proven against a real EAS production
build. This is a prerequisite/infrastructure phase, not a feature — no new
product capability ships here.

</domain>

<decisions>
## Implementation Decisions

### Version confirmation method
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

### Pin granularity
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

### Local dev workflow
- **D-03:** Use `nvm` directly for the local Node-version switch needed to
  regenerate `package-lock.json` under the pinned version: `nvm install 22`
  (or the resolved exact patch) then `nvm use 22`, regenerate the lockfile
  clean (`rm -rf node_modules package-lock.json && npm install`), run the
  full verification suite (`npm ci --include=dev`, `npm run typecheck`,
  `npm run lint`, `npm test`) under that Node version, then switch back.
  `nvm` is already installed and available on this machine — no alternate
  tooling needed.
- Once `.nvmrc` exists, subsequent switches can use plain `nvm use`.

### Validation build type
- **D-04:** Go straight to a real `eas build --profile production` (plus
  the `npm ci` proof it implies) rather than running a cheaper
  `--profile preview` build first. SC4 explicitly requires a real
  production build to succeed anyway, and both prior incidents (Phase 24,
  Phase 29) were only ever caught and fixed via actual EAS builds — a
  preview build exercises the identical `npm ci` install path and build
  image, so it would not catch anything a production build wouldn't,
  it would just add an extra build cycle and wait time.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements & roadmap
- `.planning/REQUIREMENTS.md` (BUILD-01 through BUILD-04, lines 12-16) —
  locked requirement text for this phase
- `.planning/ROADMAP.md` (Phase 30 section, lines 118-127) — goal, success
  criteria, dependency note ("first phase of v1.0; prerequisite for every
  later phase")

### Research (from milestone research phase)
- `.planning/research/PITFALLS.md` — lines 19-25 (pin in all three
  locations: `.nvmrc`, `package.json engines.node`, `eas.json` build
  profile `node` field — the last is what EAS Build actually reads),
  lines 152/161/176/185/195 (recurrence table, mitigation checklist,
  explicit acceptance criterion: "a real `eas build` succeeds from a
  freshly-cloned checkout")
- `.planning/research/SUMMARY.md` line 143 — "exact EAS build-image Node
  version must be read from real build logs, not assumed from the local
  dev machine"

### Prior-incident evidence (why this phase exists)
- `.planning/milestones/v0.5-phases/24-quality-gates-preflight-first-submit/24-03-SUMMARY.md`
  lines 34, 88-104 — first confirmed lockfile-drift diagnosis/fix: Node 22 /
  npm 10 via `nvm use 22`, `npm ci --include=dev` failure on
  `typescript@5.9.3` missing from lockfile
- `.planning/milestones/v0.5-phases/24-quality-gates-preflight-first-submit/24-VERIFICATION.md`
  line 39 — verified evidence of the Node 22/npm 10 regeneration
- `.planning/milestones/v0.6-phases/29-brand-validation-release-verification/29-02-SUMMARY.md`
  lines 12, 39, 50, 70, 78 — second recurrence: `npm ci` ERESOLVE failure on
  EAS's build server from a `react-native` version mismatch between
  `package.json` and `package-lock.json`, same root cause class
- `.planning/STATE.md` lines 54, 68, 92 — v1.0 roadmap sequencing rationale
  citing all 3 prior incidents and requiring build-log confirmation before
  pinning

### Existing config (current state, no pin yet)
- `eas.json` — production build profile exists but has no `node` field yet
- `package.json` — no `engines` field yet
- No `.nvmrc` exists yet at repo root

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- None directly reusable — this phase adds config files (`.nvmrc`) and
  fields (`package.json engines.node`, `eas.json` `build.production.node`),
  not application code.

### Established Patterns
- `eas.json`'s existing structure (`build.production`, `build.preview`,
  `build.development` profiles) — the `node` field is a new key added to
  the existing `production` profile object, following the same flat-object
  pattern already used for `autoIncrement`, `distribution`, etc.
- No CI workflows exist in this repo (`.github/workflows/` absent) — the
  pin only needs to satisfy local dev (`.nvmrc`) and EAS's cloud build
  image (`eas.json`); no CI-specific node-version config to add.

### Integration Points
- `package-lock.json` regeneration is the one step that touches the actual
  dependency tree — must be done with `nvm use <pinned version>` active,
  then verified with `npm ci` (not `npm install`) to match exactly what
  EAS's build server runs.

</code_context>

<specifics>
## Specific Ideas

- Local dev machine currently reports Node v25.0.0 / npm 11.17.0 — this is
  NOT the target pin; it's the drift source. Do not assume local machine
  state reflects the correct pin.
- Starting point for the pin is Node 22.x (major), exact patch to be
  resolved via `nvm install 22` during research/execution.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope. No CI pipeline exists to
extend the pin to (noted above as an established-pattern fact, not a
deferred idea).

</deferred>

---

*Phase: 30-Build Pipeline Hardening*
*Context gathered: 2026-08-16*
