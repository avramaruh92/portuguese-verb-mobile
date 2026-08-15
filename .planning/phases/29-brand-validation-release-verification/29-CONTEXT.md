# Phase 29: Brand Validation & Release Verification - Context

**Gathered:** 2026-08-15
**Status:** Ready for planning

<domain>
## Phase Boundary

The rebrand milestone (v0.6) closes with two provable checks: (1) an
automated brand-validation script confirming `app.json` config and generated
PNG assets are correct (VALID-01), plus the existing test/typecheck/lint
gates passing (VALID-02), and (2) a manual human confirmation on a real EAS
preview build that the splash/icon/palette render correctly end-to-end
(VALID-03) — something no automated check running on the dev machine can
prove. This phase does NOT update ROADMAP.md/STATE.md to mark the v0.6
milestone complete or archive planning docs — that is a separate
`/gsd:complete-milestone` step run after this phase's VERIFICATION.md
passes, matching how v0.5 closed.

</domain>

<decisions>
## Implementation Decisions

### Validation script shape (VALID-01)
- **D-01:** Implement as a standalone Node/TypeScript script,
  `scripts/validate-brand.ts`, mirroring the style of the existing
  `scripts/generate-brand-assets.ts` — not a Jest test file, and not folded
  into `scripts/preflight.ts`. Wire it to a new `npm run validate-brand`
  script in `package.json`. It should exit non-zero on any failed check so
  it's usable as a pre-flight gate.
- **D-02:** Use `sharp` (already a `package.json` dependency, already used
  by `generate-brand-assets.ts`) for PNG inspection —
  `sharp(path).metadata()` to read `width`/`height`/`hasAlpha` — not a
  shell-out to macOS-only `sips` (which Phase 25 used only for an ad hoc
  one-off check, not committed tooling).
- **D-03:** The script's `app.json` config checks (no Expo-blue
  splash/adaptive background) hardcode the forbidden old hex values
  (`#208AEF`, `#E6F4FE`) as independent literals in `validate-brand.ts` —
  do NOT import/share constants with `generate-brand-assets.ts`. A validator
  should assert against known-bad values independently, not trust the
  generator's own constants.

### EAS build profile & platform (VALID-03)
- **D-04:** Use eas.json's `preview` build profile (internal distribution)
  for the manual human-verify build — not `production`. Preview is faster,
  installs directly on-device without App Store/Play Store submission, and
  is sufficient to verify splash/icon/palette rendering; `production`'s
  `autoIncrement` and store-submission concerns aren't needed for this
  check.
- **D-05:** The EAS preview build itself is iOS only, matching the
  project's iOS-first convention (CLAUDE.md, `app.json`'s `ios.icon`
  config). No Android EAS build is produced for this phase.
- **D-06:** VALID-03's Android adaptive-icon criterion ("centered and not
  clipped by common masks") is satisfied WITHOUT an Android build: verify
  the generated `assets/images/android-icon-foreground.png` against a
  static adaptive-icon mask preview (e.g. Android Studio's Image Asset
  tool, or an equivalent online adaptive-icon mask previewer) rather than
  building and installing on an Android device/emulator.

### Human verification tracking
- **D-07:** Record the EAS preview-build human-verify results in a
  `HUMAN-UAT.md` checklist doc in the phase directory, following the exact
  pattern Phase 28 established
  (`.planning/phases/28-ui-token-application/HUMAN-UAT.md`): numbered
  step-by-step verification instructions, developer ticks off each item,
  explicit "APPROVED by developer, [date]" status line at the top once
  signed off. Do not fold this into VERIFICATION.md directly.

### Claude's Discretion
- Exact list/wording of the `HUMAN-UAT.md` checklist items (cold-launch
  splash color, iOS icon design match, Android mask-preview check,
  cross-screen palette consistency across Setup/Quiz/Results/modals) — the
  content should cover exactly VALID-03's stated criteria, phrased as
  concrete steps like Phase 28's checklist.
- Exact structure/output format of `scripts/validate-brand.ts`'s console
  output (pass/fail summary format) — implementation mechanics, not a user
  preference.
- Which specific PNG dimension/alpha assertions the script codifies beyond
  what BRAND-03/VALID-01 already specify (e.g. exact expected sizes per
  asset) — pull these from Phase 25's `25-01-PLAN.md` and
  `generate-brand-assets.ts`'s own constants (`CANVAS_PX`, `FAVICON_PX`,
  `SPLASH_WIDTH_PX`, etc.) rather than re-deriving them.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements & roadmap
- `.planning/REQUIREMENTS.md` (VALID-01, VALID-02, VALID-03, lines ~61-70)
  — locked requirement text for this phase
- `.planning/ROADMAP.md` §"Phase 29: Brand Validation & Release
  Verification" (lines 170-179) — goal, success criteria, dependencies on
  Phase 27 + Phase 28

### Prior phase context (source of what this phase validates)
- `.planning/phases/25-brand-asset-pipeline/25-01-PLAN.md` and
  `scripts/generate-brand-assets.ts` — source of the exact PNG dimension
  targets and generation logic VALID-01 must check against (constants:
  `CANVAS_PX`, `FAVICON_PX`, `SPLASH_WIDTH_PX`, `SAFE_ZONE_PX`)
- `.planning/phases/25-brand-asset-pipeline/25-VALIDATION.md` — explicitly
  foreshadows this phase: "A future Phase 29 'Brand Validation' may add
  automated PNG dimension/alpha assertions per VALID-01" and used `sips`
  as an ad hoc (not committed) check — this phase supersedes that with a
  committed `sharp`-based script
- `.planning/phases/27-expo-config-startup-flash-fix/27-CONTEXT.md` and
  `27-VERIFICATION.md` — confirms `app.json`'s splash/adaptive/appearance
  config values (already correct) and explicitly defers "end-to-end
  splash color verified on a real release build" to this phase (VALID-03)
- `.planning/phases/28-ui-token-application/28-CONTEXT.md` and
  `HUMAN-UAT.md` — source of the palette-consistency checklist pattern
  (D-07) this phase's `HUMAN-UAT.md` should follow; confirms all
  screens/components already resolve colors through `colors.*` tokens
- `eas.json` — existing `preview`/`production`/`development` build
  profiles; this phase uses `preview` (D-04)

No other external specs/ADRs — requirements fully captured in decisions
above.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `sharp` (`^0.35.3`) — already a dependency, already used in
  `scripts/generate-brand-assets.ts` for PNG generation; this phase adds
  its first use for PNG *inspection* (`.metadata()`).
- `scripts/generate-brand-assets.ts` — the pattern to mirror for
  `scripts/validate-brand.ts`'s script structure (module-level constants,
  no CLI framework, plain `node`/`tsx`-runnable script). Do NOT import its
  constants directly (D-03) — read the same target values but declare them
  independently in the validator.
- `.planning/phases/28-ui-token-application/HUMAN-UAT.md` — exact
  checklist format/tone to replicate for this phase's `HUMAN-UAT.md`.

### Established Patterns
- `package.json` `scripts` block currently has `start`/`android`/`ios`/
  `web`/`lint`/`test`/`typecheck` plus (per Phase 25) `generate-assets` —
  add `validate-brand` alongside these, same invocation style (no new CLI
  tooling).
- `eas.json` already has `development`/`preview`/`production` build
  profiles configured (from an earlier phase) — `preview` needs no new
  eas.json changes, just running `eas build --profile preview --platform
  ios`.

### Integration Points
- New file: `scripts/validate-brand.ts`.
- `package.json` — new `"validate-brand"` script entry.
- New file: `${phase_dir}/HUMAN-UAT.md` (not `app/`/`src/` — planning
  artifact, not shipped code).
- No changes to `app.json`, `src/theme/tokens.ts`, or any screen — this
  phase only adds verification tooling, it doesn't touch already-shipped
  Phase 25-28 code.

</code_context>

<specifics>
## Specific Ideas

No visual mockups or external references — this phase validates already-
committed brand work from Phases 25-28 rather than making new design
decisions.

</specifics>

<deferred>
## Deferred Ideas

None raised beyond phase scope. Milestone close-out (marking v0.6 complete
in ROADMAP.md/STATE.md, archiving planning docs) was explicitly scoped out
of this phase — it belongs to a separate `/gsd:complete-milestone` step run
after this phase's VERIFICATION.md passes (see `<domain>`).

</deferred>

---

*Phase: 29-Brand Validation & Release Verification*
*Context gathered: 2026-08-15*
