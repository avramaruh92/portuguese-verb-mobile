---
gsd_state_version: 1.0
milestone: v1.1
milestone_name: Frankfurt API Cutover
status: ready_to_plan
stopped_at: Phase 39 complete (2/2) — ready to discuss Phase 999.1
last_updated: 2026-10-14T19:26:27.279Z
last_activity: 2026-10-14 -- Phase 39 execution started
progress:
  total_phases: 5
  completed_phases: 3
  total_plans: 11
  completed_plans: 11
  percent: 60
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-10-11)

**Core value:** A learner can open the app, pick what to practice, complete a 10-question conjugation quiz entirely offline, and see an accurate score.
**Current focus:** Phase 999.1 — add analytics sdk for usage metrics

## Current Position

Phase: 999.1
Plan: Not started
Status: Ready to plan
Last activity: 2026-10-14

## Performance Metrics

**Velocity (v0.0-v1.0, shipped):**

- Plans per milestone: v0.0: 22, v0.1: 13, v0.2: 4, v0.3: 8, v0.4: 7, v0.5: 11, v0.6: 8, v1.0: 16
- Kickoff to ship: v0.0 ~1.3 days, v0.1 ~6 days, v0.2 ~7 days, v0.3 ~1 day, v0.4 ~2 days, v0.5 ~3 days, v0.6 ~3 days, v1.0 56 days (phases 30-34 in 1 day; Phase 35 spanned Apple review + an info-request resubmission)

## Accumulated Context

### Roadmap Evolution

- v1.0 roadmap created 2026-08-16 — 6 phases (30-35) derived from BUILD/BRAND/LOCKUP/UX/VALID/STORE requirement categories, following research/SUMMARY.md's suggested ordering. 27/27 v1.0 requirements mapped, no orphans. Sequencing: 30 (Node/lockfile pin) must lead — prerequisite, not a feature, with 3x prior-incident evidence (v0.5 Phase 20, Phase 24, v0.6 Phase 29). 31 (brand source + generator id-rewrite) depends on 30 since it adds a new build-time dependency and regenerates assets. 32 (homepage lockup) depends on 31 — shares the same generator script, isolates risk to one variable at a time. 33 (quiz press-state fix) is fully independent, can run in parallel with 31-32. 34 (validate-brand.ts extension) depends on 31+32 since it asserts against their real generated output. 35 (App Store Connect submission) is strictly last — terminal action, screenshots/build must reflect the fully finished state.
- v1.1 roadmap created 2026-10-11 — 4 phases (36-39), 22/22 requirements mapped. 36 (code cutover) leads; 37 (EAS build, TestFlight, real-device E2E, HAND-01) depends on 36; 38 (App Store submit/release, HAND-02) depends on 37 and is terminal; 39 (tech debt) is independent and DROPPABLE, must never block 37/38. Targets: TestFlight ~2026-10-13, App Store live ~2026-10-17, Oregon deletion no later than 2026-10-30; hard deadline 2026-11-01.
- v0.6 shipped 2026-08-16 — all 5 phases complete, 14/14 requirements verified, 251/251 tests passing, dated developer sign-off on a real EAS preview build, archived to `.planning/milestones/v0.6-*`.

### Decisions

Full decision log in PROJECT.md Key Decisions (v0.0-v1.0, all with outcomes). No decisions yet for the next milestone.

### Pending Todos

- Frankfurt API base-URL switch: superseded by milestone v1.1 (Phases 36-38; hard stop 2026-11-01). See ROADMAP.md.

### Blockers/Concerns

None open.

## Deferred Items

Items acknowledged and carried forward (unchanged at v1.0 close):

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

Known non-blocking tech debt: see PROJECT.md "Next Milestone" and `.planning/milestones/v1.0-MILESTONE-AUDIT.md` (validate-brand colour/cwd robustness and ungated lockup crop constants, Fastify 6 `disableRequestLogging` deprecation, `ios/` README reference, WCAG palette spot-check, v0.3 distractor `formIndex` gap).

## Quick Tasks Completed

| ID | Description | Date | Commit | Directory |
|----|--------------|------|--------|-----------|
| 260816-k8y | Remove eas-cli devDependency and redundant eas script | 2026-08-16 | b537116 | [260816-k8y-remove-eas-cli-from-devdependencies-and-](./quick/260816-k8y-remove-eas-cli-from-devdependencies-and-/) |

## Session Continuity

Last session: 2026-10-14T19:07:15.161Z
Stopped at: Phase 39 context gathered
Resume file: .planning/phases/39-v1-0-tech-debt-cleanup/39-CONTEXT.md

## Operator Next Steps

- Run /gsd:plan-phase 37
