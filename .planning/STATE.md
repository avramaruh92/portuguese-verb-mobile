---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: Warm Brand Polish + App Store Submission Readiness
status: executing
stopped_at: Completed 35-02-PLAN.md
last_updated: "2026-08-17T12:14:54.351Z"
last_activity: 2026-08-17
progress:
  total_phases: 6
  completed_phases: 5
  total_plans: 16
  completed_plans: 13
  percent: 81
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-08-16)

**Core value:** A learner can open the app, pick what to practice, complete a 10-question conjugation quiz entirely offline, and see an accurate score.
**Current focus:** Phase 35 — app-store-connect-readiness

## Current Position

Phase: 35 (app-store-connect-readiness) — EXECUTING
Plan: 6 of 7
Status: Ready to execute
Last activity: 2026-08-17

## Performance Metrics

**Velocity (v0.0-v0.6, shipped):**

- Total plans completed: 86 (v0.0: 22, v0.1: 13, v0.2: 4, v0.3: 8, v0.4: 7, v0.5: 11, v0.6: 8, +4 counting Phase 10.1... totals reconciled per MILESTONES.md phase-count summaries)
- Total execution time: v0.0 ~1.3 days, v0.1 ~6 days, v0.2 ~7 days, v0.3 ~1 day, v0.4 ~2 days, v0.5 ~3 days, v0.6 ~3 days (kickoff to ship)

**v1.0 phases (planned, not yet started):**

| Phase | Requirements | Status |
|-------|--------------|--------|
| 30. Build Pipeline Hardening | BUILD-01, BUILD-02, BUILD-03, BUILD-04 | Not started |
| 31. Brand Asset Source & Generator | BRAND-01, BRAND-02, BRAND-03, BRAND-04 | Not started |
| 32. Homepage Lockup | LOCKUP-01, LOCKUP-02, LOCKUP-03 | Not started |
| 33. Quiz Press-State Color Fix | UX-01, UX-02, UX-03 | Not started |
| 34. Brand Validation Extension | VALID-01, VALID-02, VALID-03, VALID-04 | Not started |
| 35. App Store Connect Readiness | STORE-01 through STORE-09 | Not started |
| Phase 31 P01 | 25min | 3 tasks | 3 files |
| Phase 31 P02 | 20min | 2 tasks | 6 files |
| Phase 31 P03 | 15min | 3 tasks | 2 files |
| Phase 32 P02 | ~2h | 2 tasks | 1 files |
| Phase 33 P01 | 35min | 2 tasks | 5 files |
| Phase 35-app-store-connect-readiness P03 | 12min | 2 tasks | 6 files |
| Phase 35 P05 | 55min | 3 tasks | 4 files |
| Phase 35-app-store-connect-readiness P02 | 40min | 2 tasks | 3 files |

## Accumulated Context

### Roadmap Evolution

- v1.0 roadmap created 2026-08-16 — 6 phases (30-35) derived from BUILD/BRAND/LOCKUP/UX/VALID/STORE requirement categories, following research/SUMMARY.md's suggested ordering. 27/27 v1.0 requirements mapped, no orphans. Sequencing: 30 (Node/lockfile pin) must lead — prerequisite, not a feature, with 3x prior-incident evidence (v0.5 Phase 20, Phase 24, v0.6 Phase 29). 31 (brand source + generator id-rewrite) depends on 30 since it adds a new build-time dependency and regenerates assets. 32 (homepage lockup) depends on 31 — shares the same generator script, isolates risk to one variable at a time. 33 (quiz press-state fix) is fully independent, can run in parallel with 31-32. 34 (validate-brand.ts extension) depends on 31+32 since it asserts against their real generated output. 35 (App Store Connect submission) is strictly last — terminal action, screenshots/build must reflect the fully finished state.
- v0.6 shipped 2026-08-16 — all 5 phases complete, 14/14 requirements verified, 251/251 tests passing, dated developer sign-off on a real EAS preview build, archived to `.planning/milestones/v0.6-*`.

### Decisions

Decisions are logged in PROJECT.md Key Decisions table (v0.0-v0.6 decisions all show final outcomes). No new v1.0 decisions logged yet — roadmap creation only.

- [Phase 31]: linkedom package legitimacy approved for build-time devDependency install (T-31-SC mitigation satisfied)
- [Phase 31]: Worktree isolation failed to provision for plan 31-01; coordinator authorized sequential execution on plan/phase-20 instead
- [Phase 31]: Combined generator extraction rewrite and main() rewiring into a single Task 1 commit; Task 2's commit scoped to regenerated PNG binaries
- [Phase 31]: Checkpoint (31-03 Task 2) approved with 5 of 6 checks passing; check 5 (native icon after delete+reinstall) deferred to Phase 35 per D-10 since no dev-client/EAS build was available to test against
- [Phase 32]: Task 2 checkpoint required 5 rounds of on-device iteration on lockup sizing/alignment before developer approval; final approach crops the rendered PNG to its measured non-background content bounding box rather than aligning the full 1600x520 canvas
- [Phase 35-app-store-connect-readiness]: Review notes enumerate all three real network calls, correcting CLAUDE.md's stale two-endpoint framing — Under-counting network calls in App Review notes contradicts the privacy label and risks reviewer rejection
- [Phase 35]: Substituted iPhone 17 Pro Max simulator for the plan's iPhone 16 Pro Max reference (unavailable locally), after verifying identical 1320x2868 capture resolution. — Plan explicitly frames dimension, not device name, as the contract for the 6.9-inch bucket.
- [Phase 35]: Screenshots captured via the Simulator app's Cmd+S tool (developer-driven) rather than xcrun simctl io booted screenshot; alpha channel added by that tool was stripped via sharp's removeAlpha() per the plan's own remediation path. — Both capture paths produce equivalent-resolution PNGs; the plan pre-defined alpha remediation for exactly this kind of source discrepancy.
- [Phase 35]: GitHub Pages required a public repo (free plan does not support Pages on private repos); avramaruh92/portuguese-verb-mobile was made public to unblock STORE-02, accepting full source visibility. — Avoided paying for GitHub Pro or standing up separate hosting infra that would contradict D-01's no-new-repo constraint. Two mutating actions (repo visibility, Pages source) were blocked by the Claude Code platform's own permission classifier and had to be performed manually by the developer.

### Pending Todos

None open.

### Blockers/Concerns

- [Phase 34]: Decision coverage gate flagged D-01–D-04 as "uncovered" (literal `D-NN:` string not present in 34-01-PLAN.md's `must_haves`), overridden as "Proceed anyway" — gsd-plan-checker independently confirmed all four decisions are substantively honored in the plan body (explicit "do NOT" clauses, exact reused-helper approach, unchanged output contract). Labeling gap only, not a scope/behavior gap.

None open yet otherwise. Flagged from research for phase-planning attention:

- Phase 30 must confirm the exact EAS build-image Node version from real build logs, not assumed from the local dev machine, before pinning `.nvmrc`/`engines.node`/`eas.json`'s `node` field.
- Phase 31's generator rewrite must include an explicit alpha-channel re-verification against a real EAS build (not just local `sharp`/`resvg` output) — this is the exact code path that produced the currently-solved opaque-icon invariant.
- Phase 33 needs an explicit precedence check (locked+correct → locked+incorrect → pressed → default), not just the new token's existence, to avoid a last-writer-wins style bug.
- Phase 35 needs the backend's actual data-retention/IP-logging behavior confirmed with the sibling `portuguese-verb-api` repo before finalizing the privacy nutrition label, and Apple's exact 2026 age-rating/screenshot-dimension specifics should be spot-checked live in App Store Connect at execution time.

## Deferred Items

Items acknowledged and carried forward (unchanged by v1.0 roadmap creation):

| Category | Item | Status | Deferred At |
|----------|------|--------|-------------|
| v2 | PROG-01 Typed-answer quiz mode with diacritic normalization | Deferred | Project init |
| v2 | PROG-02 On-device progress/streak tracking | Deferred | Project init |
| v2 | PROG-03 Spaced repetition scheduling | Deferred | Project init |
| v2 | FETCH-06 Dataset staleness/version metadata | Deferred (P3) | v0.1 requirements definition |
| v2 | QUIZ-09 Question-progress indicator ("Question X of 10") | Deferred (P2) | v0.1 requirements definition |
| v2 | UI-04 Answer-selection feedback animation | Deferred (P3) | v0.1 requirements definition |
| v2 | RELEASE-01 `.eas/workflows/` automated build+submit CI pipeline | Deferred | v0.5 requirements definition |
| v2 | RELEASE-04 Additional device-size screenshot sets | Deferred | v1.0 requirements definition |
| v2 | RELEASE-05 Localized App Store listing copy | Deferred | v1.0 requirements definition |
| v2 | External (non-team) TestFlight testers — triggers Apple Beta App Review | Deferred | v0.5, Phase 24 checkpoint |

Known non-blocking tech debt carried from prior milestone audits — none block v1.0's roadmap, but relevant context for planning:

- No durable Node-version pin existed prior to v1.0 — npm-version lockfile drift recurred 3 times (v0.5 Phase 20, Phase 24, v0.6 Phase 29); this is now Phase 30's primary deliverable, not deferred further.
- Locked Lafa palette computed below WCAG AA 4.5:1 contrast on several text/background pairings (pre-v0.6, not independently re-audited for the v0.6 replacement palette) — not in v1.0 scope, spot-check candidate for a future milestone.
- Cross-verb distractor `formIndex`-miss gap (v0.3) — explanation coverage uneven across distractor tiers, fail-closed, explicitly deferred, not in v1.0 scope.
- ~~`npx expo-doctor` 2 advisory failures (`eas` npm script, `eas-cli` devDependency) — deliberate v0.5 Phase 20 tradeoff (D-04)~~ — **resolved** via quick task 260816-k8y (2026-08-16): global `eas-cli@21.2.0` now satisfies `eas.json`'s `cli.version: ">= 21.1.0"` requirement, so the local devDependency and its shadowing script were removed. `npx expo-doctor` now passes 21/21 checks.

## Quick Tasks Completed

| ID | Description | Date | Commit | Directory |
|----|--------------|------|--------|-----------|
| 260816-k8y | Remove eas-cli devDependency and redundant eas script | 2026-08-16 | b537116 | [260816-k8y-remove-eas-cli-from-devdependencies-and-](./quick/260816-k8y-remove-eas-cli-from-devdependencies-and-/) |

## Session Continuity

Last session: 2026-08-17T12:14:54.341Z
Stopped at: Completed 35-02-PLAN.md
Resume file: None

## Operator Next Steps

- Phase 32 (Homepage Lockup) is complete — both plans shipped, LOCKUP-01/02/03 verified.
- Run `/gsd:execute-phase 33` to continue with Phase 33 (Quiz Press-State Color Fix), which is fully independent and can run in parallel with any remaining brand-asset work.
